import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { computeCAScore, computeExamScore, computeTotal, isFail } from "@/lib/utils";
import { computeGrade, getSheetType } from "@/lib/sheet-types";

export async function PUT(req: Request) {
  try {
    const { entries } = await req.json();

    const schoolConfigs = new Map<string, { passThreshold: number; sheetTypeId: string }>();

    for (const entry of entries) {
      const { studentSubjectId, caScore, examScore } = entry;

      if (!studentSubjectId) continue;

      const ss = await queryOne<{
        studentId: string;
        schoolId: string;
        classSheetType: string;
        classId: string;
        passThreshold: number;
      }>(
        `SELECT ss."studentId", s."schoolId", cl."sheetType" AS "classSheetType",
                s."classId", COALESCE(sc."passThreshold", 50) AS "passThreshold"
         FROM "StudentSubject" ss
         JOIN "Student" s ON ss."studentId" = s.id
         JOIN "Class" cl ON s."classId" = cl.id
         LEFT JOIN "SchoolConfig" sc ON sc."schoolId" = s."schoolId"
         WHERE ss.id = $1`,
        [studentSubjectId]
      );
      if (!ss) continue;

      const schoolId = ss.schoolId;
      let passThreshold = 50;
      let sheetTypeId = "PRIMARY";

      if (!schoolConfigs.has(schoolId)) {
        sheetTypeId = ss.classSheetType;
        passThreshold = ss.passThreshold;
        schoolConfigs.set(schoolId, { passThreshold, sheetTypeId });
      } else {
        const cached = schoolConfigs.get(schoolId)!;
        passThreshold = cached.passThreshold;
        sheetTypeId = cached.sheetTypeId;
      }

      const assessments = await query<{ type: string; scoreObtained: number; maxScore: number }>(
        `SELECT type, "scoreObtained", "maxScore" FROM "Assessment" WHERE "studentSubjectId" = $1`,
        [studentSubjectId]
      );

      const sheetConfig = getSheetType("", sheetTypeId);
      const caMax = sheetConfig.scoreColumns.find((c) => c.key === "ca" || c.key === "ca1")?.maxScore ?? 30;

      const computedCA = caScore ?? computeCAScore(assessments, caMax);
      const computedExam = examScore ?? computeExamScore(assessments);
      const total = computeTotal(computedCA, computedExam);
      const grade = computeGrade(total, sheetConfig);

      await query(
        `INSERT INTO "ScoreSummary" ("studentId", "studentSubjectId", "caScore", "examScore", "totalScore", grade, "isFail")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT ("studentSubjectId")
         DO UPDATE SET "caScore" = EXCLUDED."caScore", "examScore" = EXCLUDED."examScore",
                       "totalScore" = EXCLUDED."totalScore", grade = EXCLUDED.grade,
                       "isFail" = EXCLUDED."isFail"`,
        [ss.studentId, studentSubjectId, computedCA, computedExam, total, grade, isFail(total, passThreshold)]
      );
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
