import { NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db";
import { generatePin } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { firstName, lastName, regNumber, classId, schoolId } =
      await req.json();

    if (!firstName || !lastName || !regNumber || !classId || !schoolId) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const existing = await queryOne(
      `SELECT id FROM "Student" WHERE "schoolId" = $1 AND "regNumber" = $2`,
      [schoolId, regNumber]
    );
    if (existing) {
      return NextResponse.json(
        { error: "A student with this registration number already exists" },
        { status: 409 }
      );
    }

    const pin = generatePin();

    const [student] = await query<{ id: string }>(
      `INSERT INTO "Student" ("schoolId", "classId", "firstName", "lastName", "regNumber", "parentPinHash")
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [schoolId, classId, firstName, lastName, regNumber, pin]
    );

    return NextResponse.json(
      { message: "Student created", id: student.id, pin },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create student error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
