import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/crypto";
import { queryOne, query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, email, password, schoolId } = await req.json();

    if (!name || !email || !password || !schoolId) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const existing = await queryOne(
      `SELECT id FROM "User" WHERE email = $1`,
      [email]
    );
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [teacher] = await query<{ id: string }>(
      `INSERT INTO "User" ("schoolId", email, "passwordHash", name, role)
       VALUES ($1, $2, $3, $4, 'TEACHER') RETURNING id`,
      [schoolId, email, passwordHash, name]
    );

    return NextResponse.json(
      { message: "Teacher created", id: teacher.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create teacher error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
