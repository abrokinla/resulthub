import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { subjectId, classId } = await req.json();

    const students = await prisma.student.findMany({
      where: { classId },
      select: { id: true },
    });

    const existingAssignments = await prisma.studentSubject.findMany({
      where: { subjectId },
      select: { studentId: true },
    });
    const existingIds = new Set(existingAssignments.map((a) => a.studentId));

    const newAssignments = students
      .filter((s) => !existingIds.has(s.id))
      .map((s) => ({
        studentId: s.id,
        subjectId,
      }));

    if (newAssignments.length > 0) {
      await prisma.studentSubject.createMany({ data: newAssignments });
    }

    return NextResponse.json({
      message: `Assigned to ${newAssignments.length} students`,
    });
  } catch (error) {
    console.error("Assign subject error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
