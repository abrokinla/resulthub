"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useSection } from "@/lib/section-context";

export default function TeacherDashboard() {
  const router = useRouter();
  const { sectionGroup } = useSection();
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const u = (await api.get("/auth/me/")).data;
        if (u.role !== "TEACHER") { router.push("/login"); return; }
        if (!u.profileComplete) { router.push("/teacher/profile"); return; }
        setUser(u);

        const sg = sectionGroup !== "all" ? `&section_group=${sectionGroup}` : "";
        const [classesData, subjectsData] = await Promise.all([
          api.get(`/classes/${sg}`),
          api.get(`/subjects/${sg}`).catch(() => ({ data: [] })),
        ]);
        setClasses(classesData.data);
        setSubjects(subjectsData.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sectionGroup, router]);

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Teacher Dashboard</h1>
          <span className="text-sm text-gray-600 dark:text-gray-300">{user?.name}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 w-full">
        <h2 className="text-lg font-semibold mb-4">My Classes</h2>

        {classes.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">No classes assigned to you yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {classes.map((cls: any) => (
              <Link
                key={cls.id}
                href={`/teacher/classes/${cls.id}`}
                className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{cls.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{cls.academic_year}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{cls.studentsCount ?? 0}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Students</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <h2 className="text-lg font-semibold mt-8 mb-4">My Subjects</h2>
        {subjects.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">No subjects assigned to you yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {subjects.map((s: any) => (
              <div key={s.id} className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
                <p className="font-medium text-sm">{s.name}</p>
                {s.code && <p className="text-xs text-gray-500 dark:text-gray-400">{s.code}</p>}
              </div>
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
    </>
  );
}
