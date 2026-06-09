import { NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getSheetType, computeGrade } from "@/lib/sheet-types";

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resultId } = await req.json();

    const result = await queryOne<{
      studentId: string;
      classId: string;
      section: string;
      sheetType: string;
      passThreshold: number;
    }>(
      `SELECT r."studentId", cl.id AS "classId", cl.section, cl."sheetType",
              COALESCE(sc."passThreshold", 50) AS "passThreshold"
       FROM "Result" r
       JOIN "Student" s ON r."studentId" = s.id
       JOIN "Class" cl ON s."classId" = cl.id
       LEFT JOIN "SchoolConfig" sc ON sc."schoolId" = s."schoolId"
       WHERE r.id = $1`,
      [resultId]
    );

    if (!result) {
      return NextResponse.json({ error: "Result not found" }, { status: 404 });
    }

    const sheetType = getSheetType(result.section, result.sheetType);

    // Get all student-subjects with scores for this student
    const summaries = await query<{
      ssId: string;
      subjectId: string;
      subjectName: string;
      totalScore: number;
    }>(
      `SELECT ss.id AS "ssId", ss."subjectId", sub.name AS "subjectName",
              COALESCE(sc."totalScore", 0) AS "totalScore"
       FROM "StudentSubject" ss
       JOIN "Subject" sub ON ss."subjectId" = sub.id
       LEFT JOIN "ScoreSummary" sc ON sc."studentSubjectId" = ss.id
       WHERE ss."studentId" = $1 AND COALESCE(sc."totalScore", 0) > 0`,
      [result.studentId]
    );

    // Get all students in same class with their scores
    const allStudentScores = await query<{
      studentId: string;
      subjectId: string;
      totalScore: number;
    }>(
      `SELECT ss."studentId", ss."subjectId", COALESCE(sc."totalScore", 0) AS "totalScore"
       FROM "StudentSubject" ss
       LEFT JOIN "ScoreSummary" sc ON sc."studentSubjectId" = ss.id
       WHERE ss."studentId" IN (
         SELECT id FROM "Student" WHERE "classId" = $1
       )`,
      [result.classId]
    );

    // Group by student to compute cumulatives
    const studentCumulatives = new Map<string, number>();
    for (const s of allStudentScores) {
      studentCumulatives.set(
        s.studentId,
        (studentCumulatives.get(s.studentId) ?? 0) + s.totalScore
      );
    }

    // Compute per-subject positions
    for (const summary of summaries) {
      const subjectScores = allStudentScores
        .filter((s) => s.subjectId === summary.subjectId)
        .map((s) => s.totalScore)
        .sort((a, b) => b - a);

      const position = subjectScores.indexOf(summary.totalScore) + 1;

      await query(
        `UPDATE "ScoreSummary" SET "subjectPosition" = $1 WHERE "studentSubjectId" = $2`,
        [position, summary.ssId]
      );
    }

    // Compute overall cumulative, average
    const cumulative = summaries.reduce((s, ss) => s + ss.totalScore, 0);
    const average = summaries.length > 0 ? cumulative / summaries.length : 0;
    const adminGrade = computeGrade(average, sheetType);

    // Compute overall position
    const allCumulatives = Array.from(studentCumulatives.entries())
      .map(([id, cum]) => ({ id, cum }))
      .sort((a, b) => b.cum - a.cum);
    const position = allCumulatives.findIndex((c) => c.cum === studentCumulatives.get(result.studentId)) + 1;
    const positionOutOf = allCumulatives.length;

    await query(
      `UPDATE "Result" SET cumulative = $1, average = $2, position = $3, "positionOutOf" = $4,
                           "adminGrade" = $5, status = 'APPROVED', "approvedAt" = $6, "approvedById" = $7
       WHERE id = $8`,
      [
        cumulative,
        Math.round(average * 100) / 100,
        position,
        positionOutOf,
        adminGrade,
        new Date(),
        session.user.id,
        resultId,
      ]
    );

    return NextResponse.json({ message: "Result approved" });
  } catch (error) {
    console.error("Approve result error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
