import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, code, classId, schoolId } = await req.json();

    if (!name || !classId || !schoolId) {
      return NextResponse.json(
        { error: "Name, class, and school are required" },
        { status: 400 }
      );
    }

    const [subject] = await query<{ id: string }>(
      `INSERT INTO "Subject" ("schoolId", "classId", name, code)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [schoolId, classId, name, code || null]
    );

    return NextResponse.json(
      { message: "Subject created", id: subject.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create subject error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
