import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const { classId, teacherId } = await req.json();

    await prisma.class.update({
      where: { id: classId },
      data: { teacherId },
    });

    return NextResponse.json({ message: "Teacher assigned" });
  } catch (error) {
    console.error("Assign teacher error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
