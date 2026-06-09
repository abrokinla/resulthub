import { NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await req.json();

    const config = await queryOne<{
      passThreshold: number;
      graduationType: string;
      graduationMinCumulative: number;
    }>(
      `SELECT "passThreshold", "graduationType", "graduationMinCumulative"
       FROM "SchoolConfig" WHERE "schoolId" = $1`,
      [schoolId]
    );
    if (!config) {
      return NextResponse.json(
        { error: "School config not found" },
        { status: 404 }
      );
    }

    const students = await query<{
      id: string;
      classId: string;
      section: string;
      className: string;
      classOrder: number;
      academicYear: string;
      cumulative: number;
    }>(
      `SELECT s.id, s."classId", cl.section, cl.name AS "className",
              cl."order" AS "classOrder", cl."academicYear",
              COALESCE((SELECT SUM(r.cumulative) FROM "Result" r
               WHERE r."studentId" = s.id AND r.status = 'APPROVED'), 0) AS cumulative
       FROM "Student" s
       JOIN "Class" cl ON s."classId" = cl.id
       WHERE s."schoolId" = $1 AND s.status = 'ACTIVE'
       ORDER BY s."classId"`,
      [schoolId]
    );

    let promoted = 0;
    let graduated = 0;
    let failed = 0;

    for (const student of students) {
      const totalScore = student.cumulative;
      const totalSubjectsResult = await queryOne<{ count: number }>(
        `SELECT COUNT(*) AS count FROM "StudentSubject" ss
         JOIN "ScoreSummary" sc ON sc."studentSubjectId" = ss.id
         WHERE ss."studentId" = $1`,
        [student.id]
      );
      const totalSubjects = totalSubjectsResult?.count ?? 0;
      const totalPossible = totalSubjects * 100;

      let qualifies = false;
      if (config.graduationType === "passAll") {
        qualifies = totalScore >= totalPossible * (config.passThreshold / 100);
      } else {
        qualifies = totalScore >= config.graduationMinCumulative;
      }

      // Determine next class
      const currentOrder = student.classOrder;
      const nextClass = await queryOne<{ id: string }>(
        `SELECT id FROM "Class"
         WHERE "schoolId" = $1 AND "order" = $2 AND "academicYear" = $3
         LIMIT 1`,
        [schoolId, currentOrder + 1, student.academicYear]
      );

      if (qualifies) {
        if (student.section === "SENIOR_SECONDARY" && student.className === "SSS 3") {
          await query(
            `UPDATE "Student" SET status = 'GRADUATED' WHERE id = $1`,
            [student.id]
          );
          graduated++;
        } else if (nextClass) {
          await query(
            `UPDATE "Student" SET "classId" = $1, status = 'PROMOTED' WHERE id = $2`,
            [nextClass.id, student.id]
          );
          promoted++;
        } else {
          failed++;
        }
      } else {
        await query(
          `UPDATE "Student" SET status = 'REPEATING' WHERE id = $1`,
          [student.id]
        );
        failed++;
      }
    }

    return NextResponse.json({ promoted, graduated, failed });
  } catch (error) {
    console.error("Process promotion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
