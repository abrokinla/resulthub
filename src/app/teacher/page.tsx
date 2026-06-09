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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Teacher Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.user.name}</span>
            <Link
              href="/api/auth/signout"
              className="text-sm text-red-600 hover:underline"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold mb-4">My Classes</h2>

        {classes.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <p className="text-gray-500">No classes assigned to you yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/teacher/classes/${cls.id}`}
                className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{cls.name}</h3>
                    <p className="text-sm text-gray-500">{cls.academicYear}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{cls.studentsCount}</p>
                    <p className="text-sm text-gray-500">Students</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-4">
          <Link
            href="/teacher/csv-import"
            className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition text-center"
          >
            <h3 className="font-semibold">CSV Import</h3>
            <p className="text-sm text-gray-500">Bulk import students/scores</p>
          </Link>
          <Link
            href="/teacher/exports"
            className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition text-center"
          >
            <h3 className="font-semibold">Exports</h3>
            <p className="text-sm text-gray-500">Export results</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
