import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, password, schoolId } = await req.json();

    if (!name || !email || !password || !schoolId) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);

    const teacher = await prisma.user.create({
      data: {
        schoolId,
        email,
        passwordHash,
        name,
        role: "TEACHER",
      },
    });

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
