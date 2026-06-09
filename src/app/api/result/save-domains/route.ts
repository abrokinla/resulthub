import { NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, termId, affectiveDomain, psychomotorData } =
      await req.json();

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM "Result" WHERE "studentId" = $1 AND "termId" = $2`,
      [studentId, termId]
    );

    if (!existing) {
      const term = await queryOne<{ academicYear: string }>(
        `SELECT "academicYear" FROM "Term" WHERE id = $1`,
        [termId]
      );
      await query(
        `INSERT INTO "Result" ("studentId", "termId", "academicYear", status, "affectiveDomain", "psychomotorData")
         VALUES ($1, $2, $3, 'DRAFT', $4::jsonb, $5::jsonb)`,
        [
          studentId,
          termId,
          term?.academicYear ?? "",
          JSON.stringify(affectiveDomain ?? []),
          JSON.stringify(psychomotorData ?? []),
        ]
      );
    } else {
      await query(
        `UPDATE "Result" SET "affectiveDomain" = $1::jsonb, "psychomotorData" = $2::jsonb WHERE id = $3`,
        [
          JSON.stringify(affectiveDomain ?? []),
          JSON.stringify(psychomotorData ?? []),
          existing.id,
        ]
      );
    }

    return NextResponse.json({ message: "Domains saved" });
  } catch (error) {
    console.error("Save domains error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
