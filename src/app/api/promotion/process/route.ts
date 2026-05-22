import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { schoolId } = await req.json();

    const config = await prisma.schoolConfig.findUnique({
      where: { schoolId },
    });
    if (!config) {
      return NextResponse.json(
        { error: "School config not found" },
        { status: 404 }
      );
    }

    const students = await prisma.student.findMany({
      where: { schoolId, status: "ACTIVE" },
      include: {
        class: true,
        results: {
          where: { status: "APPROVED" },
          include: {
            student: {
              include: {
                studentSubjects: {
                  include: { scoreSummaries: true },
                },
              },
            },
          },
        },
      },
      orderBy: { classId: "asc" },
    });

    let promoted = 0;
    let graduated = 0;
    let failed = 0;

    for (const student of students) {
      const totalScore = student.results.reduce(
        (sum, r) => sum + (r.cumulative ?? 0),
        0
      );
      const totalSubjects = student.results.reduce(
        (sum, r) =>
          sum + r.student.studentSubjects.filter((ss) => ss.scoreSummaries[0]).length,
        0
      );
      const totalPossible = totalSubjects * 100;

      let qualifies = false;
      if (config.graduationType === "passAll") {
        qualifies = totalScore >= totalPossible * (config.passThreshold / 100);
      } else {
        qualifies = totalScore >= config.graduationMinCumulative;
      }

      // Determine next class
      const currentOrder = student.class.order;
      const nextClass = await prisma.class.findFirst({
        where: {
          schoolId,
          order: currentOrder + 1,
          academicYear: student.class.academicYear,
        },
      });

      if (qualifies) {
        if (student.class.section === "SENIOR_SECONDARY" && student.class.name === "SSS 3") {
          // Graduate
          await prisma.student.update({
            where: { id: student.id },
            data: { status: "GRADUATED" },
          });
          graduated++;
        } else if (nextClass) {
          // Promote
          await prisma.student.update({
            where: { id: student.id },
            data: { classId: nextClass.id, status: "PROMOTED" },
          });
          promoted++;
        } else {
          // No next class found
          failed++;
        }
      } else {
        // Repeat
        await prisma.student.update({
          where: { id: student.id },
          data: { status: "REPEATING" },
        });
        failed++;
      }
    }

    return NextResponse.json({ promoted, graduated, failed });
  } catch (error) {
    console.error("Process promotion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
