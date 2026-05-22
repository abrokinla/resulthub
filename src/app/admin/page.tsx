import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const teachersCount = await prisma.user.count({
    where: { schoolId: session.user.schoolId, role: "TEACHER" },
  });
  const studentsCount = await prisma.student.count({
    where: { schoolId: session.user.schoolId },
  });
  const classesCount = await prisma.class.count({
    where: { schoolId: session.user.schoolId },
  });
  const pendingResults = await prisma.result.count({
    where: {
      student: { schoolId: session.user.schoolId },
      status: "PENDING_APPROVAL",
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
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
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-2xl font-bold">{teachersCount}</p>
            <p className="text-sm text-gray-500">Teachers</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-2xl font-bold">{studentsCount}</p>
            <p className="text-sm text-gray-500">Students</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-2xl font-bold">{classesCount}</p>
            <p className="text-sm text-gray-500">Classes</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-2xl font-bold text-warning">{pendingResults}</p>
            <p className="text-sm text-gray-500">Pending Approval</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            href="/admin/teachers"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
          >
            <h3 className="font-semibold">Teachers</h3>
            <p className="text-sm text-gray-500">Manage teacher accounts</p>
          </Link>
          <Link
            href="/admin/classes"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
          >
            <h3 className="font-semibold">Classes</h3>
            <p className="text-sm text-gray-500">Manage classes & assignments</p>
          </Link>
          <Link
            href="/admin/results"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
          >
            <h3 className="font-semibold">Results</h3>
            <p className="text-sm text-gray-500">Approve and manage results</p>
          </Link>
          <Link
            href="/admin/terms"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
          >
            <h3 className="font-semibold">Terms</h3>
            <p className="text-sm text-gray-500">Manage academic terms</p>
          </Link>
          <Link
            href="/admin/promotions"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
          >
            <h3 className="font-semibold">Promotions</h3>
            <p className="text-sm text-gray-500">End-of-year promotions</p>
          </Link>
          <Link
            href="/admin/settings"
            className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition"
          >
            <h3 className="font-semibold">Settings</h3>
            <p className="text-sm text-gray-500">School profile & thresholds</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
