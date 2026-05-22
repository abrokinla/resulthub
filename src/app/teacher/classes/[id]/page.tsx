import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CreateStudentForm } from "./create-student-form";
import { SubjectManager } from "./subject-manager";
import { ScoreEntry } from "./score-entry";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClassDetailPage({ params }: Props) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") redirect("/login");
  const { id } = await params;

  const cls = await prisma.class.findFirst({
    where: { id, teacherId: session.user.id },
    include: {
      students: {
        include: {
          studentSubjects: {
            include: {
              subject: true,
              scoreSummaries: true,
            },
          },
        },
        orderBy: { firstName: "asc" },
      },
      subjects: { orderBy: { name: "asc" } },
    },
  });

  if (!cls) notFound();

  const students = cls.students;
  const subjects = cls.subjects;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{cls.name}</h1>
            <p className="text-sm text-gray-500">{cls.academicYear}</p>
          </div>
          <Link
            href="/teacher"
            className="text-sm text-primary hover:underline"
          >
            Back
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Students & Subjects Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CreateStudentForm classId={cls.id} schoolId={session.user.schoolId} />
          <SubjectManager
            classId={cls.id}
            schoolId={session.user.schoolId}
            subjects={subjects}
          />
        </div>

        {/* Score Entry Table */}
        <ScoreEntry
          classId={cls.id}
          students={students.map((s) => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            regNumber: s.regNumber,
            subjects: s.studentSubjects.map((ss) => ({
              id: ss.id,
              subjectName: ss.subject.name,
              caScore: ss.scoreSummaries[0]?.caScore ?? null,
              examScore: ss.scoreSummaries[0]?.examScore ?? null,
              totalScore: ss.scoreSummaries[0]?.totalScore ?? null,
              grade: ss.scoreSummaries[0]?.grade ?? null,
            })),
          }))}
          subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        />
      </main>
    </div>
  );
}
