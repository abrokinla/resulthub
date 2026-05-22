import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, termId, affectiveDomain, psychomotorData } =
      await req.json();

    // Find or create result for this student + term
    let result = await prisma.result.findUnique({
      where: {
        studentId_termId: { studentId, termId },
      },
    });

    if (!result) {
      const term = await prisma.term.findUnique({ where: { id: termId } });
      result = await prisma.result.create({
        data: {
          studentId,
          termId,
          academicYear: term?.academicYear ?? "",
          status: "DRAFT",
          affectiveDomain: affectiveDomain ?? [],
          psychomotorData: psychomotorData ?? [],
        },
      });
    } else {
      result = await prisma.result.update({
        where: { id: result.id },
        data: {
          affectiveDomain: affectiveDomain ?? [],
          psychomotorData: psychomotorData ?? [],
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Save domains error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
