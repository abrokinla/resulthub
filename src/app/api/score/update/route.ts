import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeCAScore, computeExamScore, computeTotal, isFail } from "@/lib/utils";
import { computeGrade, getSheetType } from "@/lib/sheet-types";

export async function PUT(req: Request) {
  try {
    const { entries } = await req.json();

    const schoolConfigs = new Map<string, { passThreshold: number; sheetTypeId: string }>();

    for (const entry of entries) {
      const { studentSubjectId, caScore, examScore, classId } = entry;

      if (!studentSubjectId) continue;

      const studentSubject = await prisma.studentSubject.findUnique({
        where: { id: studentSubjectId },
        include: {
          student: {
            include: { class: true, school: { include: { config: true } } },
          },
          subject: true,
        },
      });
      if (!studentSubject) continue;

      const schoolId = studentSubject.student.schoolId;
      let passThreshold = 50;
      let sheetTypeId = "PRIMARY";

      if (!schoolConfigs.has(schoolId)) {
        const cls = studentSubject.student.class;
        sheetTypeId = cls.sheetType;
        const cfg = studentSubject.student.school.config;
        if (cfg) {
          passThreshold = cfg.passThreshold;
        }
        schoolConfigs.set(schoolId, { passThreshold, sheetTypeId });
      } else {
        const cached = schoolConfigs.get(schoolId)!;
        passThreshold = cached.passThreshold;
        sheetTypeId = cached.sheetTypeId;
      }

      // Get assessments for CA computation
      const assessments = await prisma.assessment.findMany({
        where: { studentSubjectId },
        select: { type: true, scoreObtained: true, maxScore: true },
      });

      const sheetConfig = getSheetType("", sheetTypeId);
      const caMax = sheetConfig.scoreColumns.find((c) => c.key === "ca" || c.key === "ca1")?.maxScore ?? 30;

      const computedCA = caScore ?? computeCAScore(assessments, caMax);
      const computedExam = examScore ?? computeExamScore(assessments);
      const total = computeTotal(computedCA, computedExam);
      const grade = computeGrade(total, sheetConfig);

      await prisma.scoreSummary.upsert({
        where: { studentSubjectId },
        create: {
          studentId: studentSubject.studentId,
          studentSubjectId,
          caScore: computedCA,
          examScore: computedExam,
          totalScore: total,
          grade,
          isFail: isFail(total, passThreshold),
        },
        update: {
          caScore: computedCA,
          examScore: computedExam,
          totalScore: total,
          grade,
          isFail: isFail(total, passThreshold),
        },
      });
    }

    return NextResponse.json({ message: "Scores updated" });
  } catch (error) {
    console.error("Score update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
