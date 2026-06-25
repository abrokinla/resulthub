"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useSection } from "@/lib/section-context";
import { CreateStudentForm } from "./create-student-form";
import { SubjectManager } from "./subject-manager";
import { ScoreEntry } from "./score-entry";

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { sectionGroup } = useSection();
  const id = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [cls, setCls] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [studentSubjects, setStudentSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const u = (await api.get("/auth/me/")).data;
        if (!["TEACHER", "ADMIN", "PRINCIPAL"].includes(u.role)) { router.push("/login"); return; }
        setUser(u);

        const sgParam = sectionGroup !== "all" ? { section_group: sectionGroup } : {};
        const [classesData, studentsData, subjectsData, studentSubjectsData, teachersData] = await Promise.all([
          api.get("/classes/", { params: sgParam }),
          api.get("/students/", { params: { classId: id, ...sgParam } }).catch(() => ({ data: [] })),
          api.get("/subjects/", { params: { classId: id, ...sgParam } }).catch(() => ({ data: [] })),
          api.get("/student-subjects/?classId=" + id).catch(() => ({ data: [] })),
          api.get("/users/?role=TEACHER").catch(() => ({ data: [] })),
        ]);
        const found = classesData.data.find((c: any) => c.id === id);
        setCls(found);
        setStudents(studentsData.data);
        setSubjects(subjectsData.data);
        setStudentSubjects(studentSubjectsData.data);
        setTeachers(teachersData.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, sectionGroup, router]);

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>;
  if (!cls) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Class not found.</div>;

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{cls.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{cls.academic_year}</p>
          </div>
          <Link href={user?.role === "ADMIN" ? "/admin/classes" : "/teacher"} className="text-sm text-primary hover:underline">Back</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CreateStudentForm classId={cls.id} schoolId={user?.schoolId} />
          <SubjectManager classId={cls.id} schoolId={user?.schoolId} subjects={subjects} userRole={user?.role} teachers={teachers} />
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
                subjectName: ss.subject?.name ?? "",
                caScore: ss.score_summary?.ca_score ?? null,
                examScore: ss.score_summary?.exam_score ?? null,
                totalScore: ss.score_summary?.total_score ?? null,
                grade: ss.score_summary?.grade ?? null,
              })),
          }))}
          subjects={subjects.map((s: any) => ({ id: s.id, name: s.name }))}
        />
      </main>
    </>
  );
}
