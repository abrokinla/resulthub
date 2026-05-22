import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getSheetType, computeGrade } from "@/lib/sheet-types";

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resultId } = await req.json();

    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: {
        student: {
          include: {
            class: true,
            school: { include: { config: true } },
            studentSubjects: {
              include: { scoreSummaries: true, subject: true },
            },
          },
        },
        term: true,
      },
    });

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    const config = result.student.school.config;
    const sheetType = getSheetType(result.student.class.section, result.student.class.sheetType);

    // Compute per-subject positions
    const summaries = result.student.studentSubjects
      .map((ss) => ({
        ssId: ss.id,
        subjectName: ss.subject.name,
        totalScore: ss.scoreSummaries[0]?.totalScore ?? 0,
      }))
      .filter((s) => s.totalScore > 0);

    // Get all students in same class + term for ranking
    const allStudents = await prisma.studentSubject.findMany({
      where: {
        student: { classId: result.student.classId },
      },
      include: {
        scoreSummaries: true,
      },
    });

    // Group by student to compute cumulatives
    const studentCumulatives = new Map<string, number>();
    for (const ss of allStudents) {
      const total = ss.scoreSummaries[0]?.totalScore ?? 0;
      studentCumulatives.set(
        ss.studentId,
        (studentCumulatives.get(ss.studentId) ?? 0) + total
      );
    }

    // Compute subject positions
    for (const summary of summaries) {
      const otherSubjectScores = allStudents
        .filter(
          (ss) =>
            ss.subjectId ===
            result.student.studentSubjects.find((s) => s.id === summary.ssId)?.subjectId
        )
        .map((ss) => ss.scoreSummaries[0]?.totalScore ?? 0)
        .sort((a, b) => b - a);

      const position =
        otherSubjectScores.indexOf(summary.totalScore) + 1;

      await prisma.scoreSummary.update({
        where: { studentSubjectId: summary.ssId },
        data: { subjectPosition: position },
      });
    }

    // Compute overall cumulative, average
    const cumulative = summaries.reduce((s, ss) => s + ss.totalScore, 0);
    const average = summaries.length > 0 ? cumulative / summaries.length : 0;

    // Compute grade
    const adminGrade = computeGrade(average, sheetType);

    // Compute overall position
    const allCumulatives = Array.from(studentCumulatives.entries())
      .map(([id, cum]) => ({ id, cum }))
      .sort((a, b) => b.cum - a.cum);
    const position = allCumulatives.findIndex((c) => c.cum === studentCumulatives.get(result.studentId)) + 1;
    const positionOutOf = allCumulatives.length;

    const updated = await prisma.result.update({
      where: { id: resultId },
      data: {
        cumulative,
        average: Math.round(average * 100) / 100,
        position,
        positionOutOf,
        adminGrade: adminGrade as any,
        status: "APPROVED",
        approvedAt: new Date(),
        approvedById: session.user.id,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Approve result error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
