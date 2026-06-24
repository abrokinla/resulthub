import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { apiServer } from "@/lib/api";
import Link from "next/link";
import { CreateStudentForm } from "./create-student-form";
import { SubjectManager } from "./subject-manager";
import { ScoreEntry } from "./score-entry";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClassDetailPage({ params }: Props) {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) redirect("/login");

  const user = await apiServer("auth/me/", { token });
  if (!["TEACHER", "ADMIN", "PRINCIPAL"].includes(user.role)) redirect("/login");

  const { id } = await params;

  const classes = await apiServer("classes/", { token });
  const cls = Array.isArray(classes) ? classes.find((c: any) => c.id === id) : null;
  if (!cls) notFound();

  const [students, subjects, studentSubjects, teachers] = await Promise.all([
    apiServer(`students/?classId=${id}`, { token }).catch(() => []),
    apiServer(`subjects/?classId=${id}`, { token }).catch(() => []),
    apiServer(`student-subjects/?classId=${id}`, { token }).catch(() => []),
    apiServer('users/?role=TEACHER', { token }).catch(() => []),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{cls.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{cls.academic_year}</p>
          </div>
          <Link href={user.role === 'ADMIN' ? '/admin/classes' : '/teacher'} className="text-sm text-primary hover:underline">Back</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CreateStudentForm classId={cls.id} schoolId={user.schoolId} />
          <SubjectManager classId={cls.id} schoolId={user.schoolId} subjects={subjects} userRole={user.role} teachers={teachers} />
        </div>

        <ScoreEntry
          classId={cls.id}
          students={students.map((s: any) => ({
            id: s.id,
            name: `${s.first_name} ${s.last_name}`,
            regNumber: s.reg_number,
            subjects: studentSubjects
              .filter((ss: any) => ss.studentId === s.id)
              .map((ss: any) => ({
                id: ss.id,
                subjectName: ss.subject?.name ?? '',
                caScore: ss.score_summary?.ca_score ?? null,
                examScore: ss.score_summary?.exam_score ?? null,
                totalScore: ss.score_summary?.total_score ?? null,
                grade: ss.score_summary?.grade ?? null,
              })),
          }))}
          subjects={subjects.map((s: any) => ({ id: s.id, name: s.name }))}
        />
      </main>
    </div>
  );
}
