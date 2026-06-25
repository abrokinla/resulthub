"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSection } from "@/lib/section-context";

interface ClassGroup {
  id: string;
  name: string;
  section: string;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
}

interface Subject {
  id: string;
  name: string;
  code: string | null;
  class_group: string;
  teacher: string | null;
  teacherName?: string;
  className?: string;
}

export default function SubjectsPage() {
  const { sectionGroup } = useSection();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newClassIds, setNewClassIds] = useState<string[]>([]);
  const [newTeacherId, setNewTeacherId] = useState("");
  const [pendingSubjectTeachers, setPendingSubjectTeachers] = useState<Record<string, string>>({});

  const ROLE_LABELS: Record<string, string> = {
    TEACHER: "Teacher",
    PRINCIPAL: "Principal",
    VICE_PRINCIPAL: "Vice Principal",
    SECRETARY: "Secretary",
    ACCOUNTANT: "Accountant",
    ADMIN: "Admin",
  };

  async function fetchData() {
    try {
      const sgParam = sectionGroup !== "all" ? { section_group: sectionGroup } : {};
      const [subjectsData, classesData, staffData] = await Promise.all([
        api.get("/subjects/", { params: sgParam }),
        api.get("/classes/", { params: sgParam }),
        api.get("/users/"),
      ]);
      const classesList: ClassGroup[] = classesData.data ?? [];
      const staffList: StaffMember[] = (staffData.data ?? []).filter(
        (u: StaffMember) => u.role !== "ADMIN"
      );
      setSubjects((subjectsData.data ?? []).map((s: Subject) => ({
        ...s,
        className: classesList.find((c) => c.id === s.class_group)?.name ?? "",
        teacherName: staffList.find((st: StaffMember) => st.id === s.teacher)?.name ?? "",
      })));
      setClasses(classesList);
      setStaff(staffList);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData() }, [sectionGroup]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || newClassIds.length === 0) return;
    await api.post("/subject/create", {
      name: newName.trim(),
      code: newCode.trim() || undefined,
      classIds: newClassIds,
      teacherId: newClassIds.length > 1 ? undefined : newTeacherId || undefined,
    });
    setNewName("");
    setNewCode("");
    setNewClassIds([]);
    setNewTeacherId("");
    fetchData();
  }

  async function handleAssignTeacher(subjectId: string, teacherId: string | null) {
    await api.patch(`/subjects/${subjectId}/`, { teacher: teacherId || null });
    fetchData();
  }

  const groupedSubjects = classes.map((cls) => ({
    ...cls,
    subjects: subjects.filter((s) => s.class_group === cls.id),
  }));

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Subjects</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6 w-full">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border dark:border-gray-700">
          <h2 className="font-semibold mb-3">Create Subject</h2>
          <form onSubmit={handleAdd} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Subject Name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white" placeholder="e.g. Mathematics" required />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium mb-1">Code</label>
              <input value={newCode} onChange={e => setNewCode(e.target.value)} className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white" placeholder="e.g. MTH" />
            </div>
            <div className="w-56">
              <label className="block text-sm font-medium mb-1">Classes</label>
              <div className="border dark:border-gray-700 rounded-lg px-3 py-2 max-h-32 overflow-y-auto dark:bg-gray-800">
                {classes.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                  <label key={c.id} className="flex items-center gap-2 py-0.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newClassIds.includes(c.id)}
                      onChange={e => setNewClassIds(prev =>
                        e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id)
                      )}
                      className="accent-primary"
                    />
                    <span className="dark:text-white">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium mb-1">Assign Teacher</label>
              <select
                value={newTeacherId}
                onChange={e => setNewTeacherId(e.target.value)}
                disabled={newClassIds.length > 1}
                className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{newClassIds.length > 1 ? "Assign per subject below" : "Unassigned"}</option>
                {newClassIds.length <= 1 && staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({ROLE_LABELS[s.role] || s.role})</option>
                ))}
              </select>
            </div>
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark">Create</button>
          </form>
        </div>

        {groupedSubjects.map(cls => (
          cls.subjects.length > 0 && (
            <div key={cls.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-700">
              <div className="p-4 border-b dark:border-gray-800 font-semibold">{cls.name}</div>
              <div className="divide-y dark:divide-gray-800">
                {cls.subjects.map(subj => (
                  <div key={subj.id} className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <p className="font-medium">{subj.name}</p>
                      {subj.code && <p className="text-xs text-gray-500">{subj.code}</p>}
                    </div>
                    <div className="w-56 flex gap-2 items-center">
                      <select
                        value={pendingSubjectTeachers[subj.id] ?? subj.teacher ?? ""}
                        onChange={e => setPendingSubjectTeachers(prev => ({ ...prev, [subj.id]: e.target.value }))}
                        className="text-sm border dark:border-gray-700 rounded-lg px-2 py-1 flex-1 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Unassigned</option>
                        {staff.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      {pendingSubjectTeachers[subj.id] !== undefined && (
                        <button
                          onClick={() => handleAssignTeacher(subj.id, pendingSubjectTeachers[subj.id] || null)}
                          className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary-dark"
                        >
                          Update
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}

        {subjects.length === 0 && (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-sm border dark:border-gray-700 text-center text-gray-500">
            No subjects yet. Create one above.
          </div>
        )}
      </main>
    </>
  );
}
