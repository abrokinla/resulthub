"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useSection } from "@/lib/section-context";

export default function AdminDashboard() {
  const { sectionGroup } = useSection();
  const [user, setUser] = useState<any>(null);
  const [teachersCount, setTeachersCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [classesCount, setClassesCount] = useState(0);
  const [pendingResults, setPendingResults] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const u = (await api.get("/auth/me/")).data;
        setUser(u);
        const schoolId = u.schoolId;
        const sg = sectionGroup !== "all" ? `&section_group=${sectionGroup}` : "";
        const [teachers, students, classesData, pendingData] = await Promise.all([
          api.get(`/users/?schoolId=${schoolId}&role=TEACHER`).catch(() => ({ data: [] })),
          api.get(`/students/?schoolId=${schoolId}${sg}`).catch(() => ({ data: [] })),
          api.get(`/classes/?schoolId=${schoolId}${sg}`).catch(() => ({ data: [] })),
          api.get(`/results/?schoolId=${schoolId}&status=PENDING_APPROVAL${sg}`).catch(() => ({ data: [] })),
        ]);
        setTeachersCount(teachers.data.length);
        setStudentsCount(students.data.length);
        setClassesCount(classesData.data.length);
        setPendingResults(pendingData.data.length);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sectionGroup]);

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <span className="text-sm text-gray-600 dark:text-gray-300">{user?.name}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 w-full">
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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link href="/admin/teachers" className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition">
            <h3 className="font-semibold">Teachers</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create & invite teachers</p>
          </Link>
          <Link href="/admin/subjects" className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition">
            <h3 className="font-semibold">Subjects</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create & assign teachers</p>
          </Link>
          {user && ["ADMIN", "PRINCIPAL", "VICE_PRINCIPAL"].includes(user.role) && (
            <Link href="/admin/staff" className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition">
              <h3 className="font-semibold">Staff</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage school staff roles</p>
            </Link>
          )}
          <Link href="/admin/classes" className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition">
            <h3 className="font-semibold">Classes</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage classes & assignments</p>
          </Link>
          <Link href="/admin/results" className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition">
            <h3 className="font-semibold">Results</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Approve and manage results</p>
          </Link>
          <Link href="/admin/terms" className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition">
            <h3 className="font-semibold">Terms</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage academic terms</p>
          </Link>
          <Link href="/admin/promotions" className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition">
            <h3 className="font-semibold">Promotions</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">End-of-year promotions</p>
          </Link>
          <Link href="/admin/settings" className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition">
            <h3 className="font-semibold">Settings</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">School profile & thresholds</p>
          </Link>
        </div>
      </main>
    </>
  );
}
