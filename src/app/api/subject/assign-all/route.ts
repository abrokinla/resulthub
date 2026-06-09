import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { subjectId, classId } = await req.json();

    const students = await query<{ id: string }>(
      `SELECT id FROM "Student" WHERE "classId" = $1`,
      [classId]
    );

    const existingAssignments = await query<{ studentId: string }>(
      `SELECT "studentId" FROM "StudentSubject" WHERE "subjectId" = $1`,
      [subjectId]
    );
    const existingIds = new Set(existingAssignments.map((a) => a.studentId));

    const newAssignmentIds = students
      .filter((s) => !existingIds.has(s.id))
      .map((s) => s.id);

    if (newAssignmentIds.length > 0) {
      const values = newAssignmentIds
        .map((sid, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
        .join(", ");
      const params: string[] = [];
      for (const sid of newAssignmentIds) {
        params.push(sid, subjectId);
      }
      await query(
        `INSERT INTO "StudentSubject" ("studentId", "subjectId") VALUES ${values}`,
        params
      );
    }

    return NextResponse.json({
      message: `Assigned to ${newAssignmentIds.length} students`,
    });
  } catch (error) {
    console.error("Assign subject error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
