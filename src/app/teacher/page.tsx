import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import Link from "next/link";

export default async function TeacherDashboard() {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") redirect("/login");

  const classes = await query<{
    id: string;
    name: string;
    academicYear: string;
    studentsCount: number;
  }>(
    `SELECT c.id, c.name, c."academicYear",
            (SELECT COUNT(*) FROM "Student" WHERE "classId" = c.id)::int AS "studentsCount"
     FROM "Class" c
     WHERE c."teacherId" = $1`,
    [session.user.id]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Teacher Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">{session.user.name}</span>
            <Link
              href="/api/auth/signout"
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold mb-4">My Classes</h2>

        {classes.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">No classes assigned to you yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/teacher/classes/${cls.id}`}
                className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{cls.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{cls.academicYear}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{cls.studentsCount}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Students</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-4">
          <Link
            href="/teacher/csv-import"
            className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition text-center"
          >
            <h3 className="font-semibold">CSV Import</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Bulk import students/scores</p>
          </Link>
          <Link
            href="/teacher/exports"
            className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition text-center"
          >
            <h3 className="font-semibold">Exports</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Export results</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
