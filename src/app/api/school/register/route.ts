import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CLASSES } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.school.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A school with this email already exists" },
        { status: 409 }
      );
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const passwordHash = await hash(password, 12);

    // Get a rating scale config once
    const defaultRatingScale = JSON.stringify([
      { grade: "A", label: "EXCELLENT", range: "100-81" },
      { grade: "B", label: "V. GOOD", range: "80-71" },
      { grade: "C", label: "GOOD", range: "70-61" },
      { grade: "D", label: "SATISFACTORY", range: "60-51" },
      { grade: "E", label: "AVERAGE", range: "50-40" },
      { grade: "F", label: "FAIL", range: "39-0" },
    ]);

    const school = await prisma.school.create({
      data: {
        name,
        slug,
        email,
        config: {
          create: {
            ratingScale: defaultRatingScale,
            affectiveTraits: JSON.stringify([
              "NEATNESS", "ATTENTIVENESS", "CONSISTENCY", "OBEDIENCE",
              "SELF-CONTROL", "LEADERSHIP", "RESPONSE IN CLASS",
              "HOMEWORK RESPONSE", "APPEARANCE", "PUNCTUALITY",
            ]),
            psychomotorSkills: JSON.stringify([
              "CREATIVITY", "WRITING", "DRAMA", "SPORTS",
            ]),
          },
        },
        users: {
          create: {
            email,
            passwordHash,
            name: `${name} Admin`,
            role: "ADMIN",
          },
        },
        classes: {
          create: DEFAULT_CLASSES.map((c) => ({
            name: c.name,
            section: c.section as any,
            sheetType: c.sheetType as any,
            order: c.order,
            academicYear: new Date().getFullYear().toString(),
          })),
        },
        terms: {
          create: [
            {
              name: "FIRST",
              academicYear: new Date().getFullYear().toString(),
              isCurrent: true,
              startsAt: new Date(),
              endsAt: new Date(new Date().setMonth(new Date().getMonth() + 4)),
            },
          ],
        },
      },
      include: {
        users: true,
      },
    });

    return NextResponse.json(
      {
        message: "School registered successfully",
        schoolId: school.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
