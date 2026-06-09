import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PUT(req: Request) {
  try {
    const { classId, teacherId } = await req.json();

    await query(
      `UPDATE "Class" SET "teacherId" = $1 WHERE id = $2`,
      [teacherId, classId]
    );

    return NextResponse.json({ message: "Teacher assigned" });
  } catch (error) {
    console.error("Assign teacher error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
