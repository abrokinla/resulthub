import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, code, classId, schoolId } = await req.json();

    if (!name || !classId || !schoolId) {
      return NextResponse.json(
        { error: "Name, class, and school are required" },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.create({
      data: { schoolId, classId, name, code: code || null },
    });

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
