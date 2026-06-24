"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const SECTION_COLORS: Record<string, string> = {
  NURSERY: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  PRIMARY: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  JUNIOR_SECONDARY: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  SENIOR_SECONDARY: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

interface ClassItem {
  id: string;
  name: string;
  section: string;
  order: number;
  teacher: string | null;
  teacherName?: string;
}

interface Teacher {
  id: string;
  name: string;
}

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newSection, setNewSection] = useState("NURSERY");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSection, setEditSection] = useState("");

  async function fetchData() {
    try {
      const [classesData, teachersData] = await Promise.all([
        api.get("/classes/"),
        api.get("/users/").catch(() => ({ data: [] })),
      ]);
      setClasses(classesData.data);
      setTeachers(teachersData.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData() }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const maxOrder = classes.reduce((max, c) => Math.max(max, c.order), 0);
    await api.post("/classes/", {
      name: newName.trim(),
      section: newSection,
      order: maxOrder + 1,
      academic_year: String(new Date().getFullYear()),
    });
    setNewName("");
    fetchData();
  }

  async function handleEdit(cls: ClassItem) {
    await api.patch(`/classes/${cls.id}/`, {
      name: editName,
      section: editSection,
    });
    setEditingId(null);
    fetchData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this class?")) return;
    await api.delete(`/classes/${id}/`);
    fetchData();
  }

  async function handleAssignTeacher(classId: string, teacherId: string | null) {
    await api.put(`/classes/${classId}/assign_teacher/`, { teacherId });
    fetchData();
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Classes</h1>
          <Link href="/admin" className="text-sm text-primary hover:underline">Back to Dashboard</Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border dark:border-gray-700">
          <form onSubmit={handleAdd} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Class Name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full border dark:border-gray-700 rounded-lg px-3 py-2" placeholder="e.g. Nursery 3" required />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium mb-1">Section</label>
              <select value={newSection} onChange={e => setNewSection(e.target.value)} className="w-full border dark:border-gray-700 rounded-lg px-3 py-2">
                <option value="NURSERY">Nursery</option>
                <option value="PRIMARY">Primary</option>
                <option value="JUNIOR_SECONDARY">Junior Secondary</option>
                <option value="SENIOR_SECONDARY">Senior Secondary</option>
              </select>
            </div>
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark">Add Class</button>
          </form>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-800 font-semibold">Class List</div>
          {classes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No classes defined.</div>
          ) : (
            <div className="divide-y dark:divide-gray-800">
              {classes.sort((a, b) => a.order - b.order).map(cls => (
                <div key={cls.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    {editingId === cls.id ? (
                      <div className="flex gap-2 items-center">
                        <input value={editName} onChange={e => setEditName(e.target.value)} className="border dark:border-gray-700 rounded px-2 py-1 text-sm flex-1" />
                        <select value={editSection} onChange={e => setEditSection(e.target.value)} className="border dark:border-gray-700 rounded px-2 py-1 text-sm">
                          <option value="NURSERY">Nursery</option>
                          <option value="PRIMARY">Primary</option>
                          <option value="JUNIOR_SECONDARY">Junior Secondary</option>
                          <option value="SENIOR_SECONDARY">Senior Secondary</option>
                        </select>
                        <button onClick={() => handleEdit(cls)} className="text-green-600 text-sm hover:underline">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 text-sm hover:underline">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <p className="font-medium">{cls.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${SECTION_COLORS[cls.section] || "bg-gray-100"}`}>{cls.section.replace('_', ' ')}</span>
                        <button onClick={() => { setEditingId(cls.id); setEditName(cls.name); setEditSection(cls.section); }} className="text-xs text-primary hover:underline">Edit</button>
                      </div>
                    )}
                  </div>
                  <div className="w-48">
                    <select
                      value={cls.teacher ?? ""}
                      onChange={e => handleAssignTeacher(cls.id, e.target.value || null)}
                      className="text-sm border dark:border-gray-700 rounded-lg px-2 py-1 w-full"
                    >
                      <option value="">Unassigned</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <button onClick={() => handleDelete(cls.id)} className="text-red-500 text-sm hover:underline">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
