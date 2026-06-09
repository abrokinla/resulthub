import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { queryOne } from "@/lib/db";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const schoolId = session.user.schoolId;

  const teachersCount = (await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text FROM "User" WHERE "schoolId" = $1 AND role = 'TEACHER'`,
    [schoolId]
  ))?.count ?? "0";
  const studentsCount = (await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text FROM "Student" WHERE "schoolId" = $1`,
    [schoolId]
  ))?.count ?? "0";
  const classesCount = (await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text FROM "Class" WHERE "schoolId" = $1`,
    [schoolId]
  ))?.count ?? "0";
  const pendingResults = (await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text FROM "Result" r
     JOIN "Student" s ON r."studentId" = s.id
     WHERE s."schoolId" = $1 AND r.status = 'PENDING_APPROVAL'`,
    [schoolId]
  ))?.count ?? "0";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
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
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
            <p className="text-2xl font-bold">{teachersCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Teachers</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
            <p className="text-2xl font-bold">{studentsCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Students</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
            <p className="text-2xl font-bold">{classesCount}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Classes</p>
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
            <p className="text-2xl font-bold text-warning">{pendingResults}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending Approval</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            href="/admin/teachers"
            className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition"
          >
            <h3 className="font-semibold">Teachers</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage teacher accounts</p>
          </Link>
          <Link
            href="/admin/classes"
            className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition"
          >
            <h3 className="font-semibold">Classes</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage classes & assignments</p>
          </Link>
          <Link
            href="/admin/results"
            className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition"
          >
            <h3 className="font-semibold">Results</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Approve and manage results</p>
          </Link>
          <Link
            href="/admin/terms"
            className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition"
          >
            <h3 className="font-semibold">Terms</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage academic terms</p>
          </Link>
          <Link
            href="/admin/promotions"
            className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition"
          >
            <h3 className="font-semibold">Promotions</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">End-of-year promotions</p>
          </Link>
          <Link
            href="/admin/settings"
            className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition"
          >
            <h3 className="font-semibold">Settings</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">School profile & thresholds</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
