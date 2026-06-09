import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import Link from "next/link";
import { AssignTeacherForm } from "./assign-form";

export default async function ClassesPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const classes = await query<{
    id: string;
    name: string;
    section: string;
    teacherId: string | null;
    teacherName: string | null;
    studentsCount: number;
  }>(
    `SELECT c.id, c.name, c.section, c."teacherId",
            t.name AS "teacherName",
            (SELECT COUNT(*) FROM "Student" WHERE "classId" = c.id)::int AS "studentsCount"
     FROM "Class" c
     LEFT JOIN "User" t ON c."teacherId" = t.id
     WHERE c."schoolId" = $1
     ORDER BY c."order" ASC`,
    [session.user.schoolId]
  );

  const teachers = await query<{ id: string; name: string }>(
    `SELECT id, name FROM "User" WHERE "schoolId" = $1 AND role = 'TEACHER'`,
    [session.user.schoolId]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Classes</h1>
          <Link href="/admin" className="text-sm text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-800">
            <h2 className="font-semibold">Class List</h2>
          </div>
          <div className="divide-y">
            {classes.map((cls) => (
              <div key={cls.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{cls.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{cls.section}</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {cls.studentsCount} students
                  </p>
                </div>
                <div className="flex-1 text-right">
                  <AssignTeacherForm
                    classId={cls.id}
                    currentTeacherId={cls.teacherId ?? null}
                    teachers={teachers}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
