import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { queryOne, query, transaction, queryClient } from "@/lib/db";
import { DEFAULT_CLASSES } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const existing = await queryOne(
      `SELECT id FROM "School" WHERE email = $1`,
      [email]
    );
    if (existing) {
      return NextResponse.json(
        { error: "A school with this email already exists" },
        { status: 409 }
      );
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const passwordHash = await hash(password, 12);
    const academicYear = new Date().getFullYear().toString();
    const now = new Date();
    const future = new Date(now);
    future.setMonth(future.getMonth() + 4);

    const defaultRatingScale = JSON.stringify([
      { grade: "A", label: "EXCELLENT", range: "100-81" },
      { grade: "B", label: "V. GOOD", range: "80-71" },
      { grade: "C", label: "GOOD", range: "70-61" },
      { grade: "D", label: "SATISFACTORY", range: "60-51" },
      { grade: "E", label: "AVERAGE", range: "50-40" },
      { grade: "F", label: "FAIL", range: "39-0" },
    ]);

    const school = await transaction(async (client) => {
      const [s] = await queryClient<{ id: string }>(
        client,
        `INSERT INTO "School" (name, slug, email) VALUES ($1, $2, $3) RETURNING id`,
        [name, slug, email]
      );
      const schoolId = s.id;

      await client.query(
        `INSERT INTO "SchoolConfig" ("schoolId", "ratingScale", "affectiveTraits", "psychomotorSkills")
         VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb)`,
        [
          schoolId,
          defaultRatingScale,
          JSON.stringify(["NEATNESS", "ATTENTIVENESS", "CONSISTENCY", "OBEDIENCE",
            "SELF-CONTROL", "LEADERSHIP", "RESPONSE IN CLASS",
            "HOMEWORK RESPONSE", "APPEARANCE", "PUNCTUALITY"]),
          JSON.stringify(["CREATIVITY", "WRITING", "DRAMA", "SPORTS"]),
        ]
      );

      await client.query(
        `INSERT INTO "User" ("schoolId", email, "passwordHash", name, role)
         VALUES ($1, $2, $3, $4, 'ADMIN')`,
        [schoolId, email, passwordHash, `${name} Admin`]
      );

      for (const c of DEFAULT_CLASSES) {
        await client.query(
          `INSERT INTO "Class" ("schoolId", name, section, "sheetType", "order", "academicYear")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [schoolId, c.name, c.section, c.sheetType, c.order, academicYear]
        );
      }

      await client.query(
        `INSERT INTO "Term" ("schoolId", name, "academicYear", "isCurrent", "startsAt", "endsAt")
         VALUES ($1, 'FIRST', $2, true, $3, $4)`,
        [schoolId, academicYear, now, future]
      );

      return schoolId;
    });

    return NextResponse.json(
      {
        message: "School registered successfully",
        schoolId: school,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
