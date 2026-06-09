import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { passThreshold, distinctionThreshold, graduationType, graduationMinCumulative } =
      await req.json();

    await query(
      `UPDATE "SchoolConfig" SET "passThreshold" = $1, "distinctionThreshold" = $2, "graduationType" = $3, "graduationMinCumulative" = $4 WHERE "schoolId" = $5`,
      [passThreshold, distinctionThreshold, graduationType, graduationMinCumulative, session.user.schoolId]
    );

    return NextResponse.json({ message: "Settings saved" });
  } catch (error) {
    console.error("Update config error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
