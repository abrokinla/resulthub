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
  const [classTeacherClasses, setClassTeacherClasses] = useState<any[]>([]);
  const [groupedSubjectClasses, setGroupedSubjectClasses] = useState<Record<string, { classId: string; className: string; section: string; subjects: any[] }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const u = (await api.get("/auth/me/")).data;
        if (u.role !== "TEACHER") { router.push("/login"); return; }
        if (!u.profileComplete) { router.push("/teacher/profile"); return; }
        setUser(u);

        const sgParam = sectionGroup !== "all" ? { section_group: sectionGroup } : {};

        const [ctClassesData, subjectsData] = await Promise.all([
          api.get("/classes/", { params: { ...sgParam, assignment_type: "class_teacher" } }).catch(() => ({ data: [] })),
          api.get("/subjects/", { params: sgParam }).catch(() => ({ data: [] })),
        ]);

        setClassTeacherClasses(ctClassesData.data);

        const grouped: Record<string, any> = {};
        for (const subj of subjectsData.data) {
          const key = subj.class_group;
          if (!grouped[key]) {
            grouped[key] = { classId: key, className: subj.class_group_name ?? "Unknown", section: subj.class_group_section ?? "", subjects: [] };
          }
          grouped[key].subjects.push(subj);
        }
        setGroupedSubjectClasses(grouped);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sectionGroup, router]);

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>;

  const subjectGroups = Object.values(groupedSubjectClasses);

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Teacher Dashboard</h1>
          <span className="text-sm text-gray-600 dark:text-gray-300">{user?.name}</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 w-full">
        <h2 className="text-lg font-semibold mb-4">My Class{classTeacherClasses.length !== 1 ? "es" : ""}</h2>

        {classTeacherClasses.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">You are not assigned as a class teacher for any class.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {classTeacherClasses.map((cls: any) => (
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

        <h2 className="text-lg font-semibold mt-8 mb-4">My Subject Areas</h2>

        {subjectGroups.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400">No subjects assigned to you yet.</p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {subjectGroups.map((group: any) => (
              <div key={group.classId} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 overflow-hidden">
                <Link
                  href={`/teacher/classes/${group.classId}`}
                  className="block px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750 transition"
                >
                  <h3 className="font-semibold">{group.className}</h3>
                  {group.section && <p className="text-xs text-gray-500 dark:text-gray-400">{group.section.replace(/_/g, " ")}</p>}
                </Link>
                <div className="divide-y dark:divide-gray-700">
                  {group.subjects.map((s: any) => (
                    <Link
                      key={s.id}
                      href={`/teacher/classes/${group.classId}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        {s.code && <p className="text-xs text-gray-500 dark:text-gray-400">{s.code}</p>}
                      </div>
                      <span className="text-xs text-primary font-medium">Enter Scores</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
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
