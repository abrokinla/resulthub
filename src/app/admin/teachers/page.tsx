import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import Link from "next/link";
import { CreateTeacherForm } from "./create-form";

export default async function TeachersPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const teachers = await query<{
    id: string;
    name: string;
    email: string;
    classesCount: number;
    createdAt: string;
  }>(
    `SELECT u.id, u.name, u.email, u."createdAt",
            (SELECT COUNT(*) FROM "Class" WHERE "teacherId" = u.id)::int AS "classesCount"
     FROM "User" u
     WHERE u."schoolId" = $1 AND u.role = 'TEACHER'
     ORDER BY u."createdAt" DESC`,
    [session.user.schoolId]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Teachers</h1>
          <Link href="/admin" className="text-sm text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <CreateTeacherForm schoolId={session.user.schoolId} />

        <div className="mt-8 bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-800">
            <h2 className="font-semibold">All Teachers</h2>
          </div>
          {teachers.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No teachers yet.</div>
          ) : (
            <div className="divide-y">
              {teachers.map((t) => (
                <div key={t.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.email}</p>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t.classesCount} classes
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
