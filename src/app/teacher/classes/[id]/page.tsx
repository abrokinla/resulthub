import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { queryOne, query } from "@/lib/db";
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

  const cls = await queryOne<{ id: string; name: string; academicYear: string }>(
    `SELECT id, name, "academicYear" FROM "Class" WHERE id = $1 AND "teacherId" = $2`,
    [id, session.user.id]
  );

  if (!cls) notFound();

  const students = await query<{
    id: string;
    firstName: string;
    lastName: string;
    regNumber: string;
  }>(
    `SELECT id, "firstName", "lastName", "regNumber" FROM "Student"
     WHERE "classId" = $1 ORDER BY "firstName" ASC`,
    [id]
  );

  const subjects = await query<{ id: string; name: string; code: string | null }>(
    `SELECT id, name, code FROM "Subject" WHERE "classId" = $1 ORDER BY name ASC`,
    [id]
  );

  const studentSubjects = await query<{
    id: string;
    studentId: string;
    subjectName: string;
    caScore: number | null;
    examScore: number | null;
    totalScore: number | null;
    grade: string | null;
  }>(
    `SELECT ss.id, ss."studentId", sub.name AS "subjectName",
            sc."caScore", sc."examScore", sc."totalScore", sc.grade
     FROM "StudentSubject" ss
     JOIN "Subject" sub ON ss."subjectId" = sub.id
     LEFT JOIN "ScoreSummary" sc ON sc."studentSubjectId" = ss.id
     WHERE ss."studentId" IN (SELECT id FROM "Student" WHERE "classId" = $1)
     ORDER BY sub.name ASC`,
    [id]
  );

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
            subjects: studentSubjects
              .filter((ss) => ss.studentId === s.id)
              .map((ss) => ({
                id: ss.id,
                subjectName: ss.subjectName,
                caScore: ss.caScore ?? null,
                examScore: ss.examScore ?? null,
                totalScore: ss.totalScore ?? null,
                grade: ss.grade ?? null,
              })),
          }))}
          subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        />
      </main>
    </div>
  );
}
