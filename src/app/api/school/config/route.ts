import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { passThreshold, distinctionThreshold, graduationType, graduationMinCumulative } =
      await req.json();

    await prisma.schoolConfig.update({
      where: { schoolId: session.user.schoolId },
      data: {
        passThreshold,
        distinctionThreshold,
        graduationType,
        graduationMinCumulative,
      },
    });

    return NextResponse.json({ message: "Settings saved" });
  } catch (error) {
    console.error("Update config error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
