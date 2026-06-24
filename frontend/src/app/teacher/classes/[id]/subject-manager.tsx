"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Subject {
  id: string;
  name: string;
  code: string | null;
  teacher?: string | null;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
}

export function SubjectManager({
  classId,
  schoolId,
  subjects,
  userRole,
  teachers,
}: {
  classId: string;
  schoolId: string;
  subjects: Subject[];
  userRole?: string;
  teachers?: Teacher[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(false);
  const isAdmin = userRole === "ADMIN";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      const payload: any = { name, code, classId, schoolId };
      if (isAdmin && teacherId) {
        payload.teacherId = teacherId;
      }
      await api.post("/subject/create", payload);
      setName("");
      setCode("");
      setTeacherId("");
      router.refresh();
    } catch {
      // silently fail
    }
    setLoading(false);
  }

  async function assignToAll(subjectId: string) {
    try {
      await api.post("/subject/assign-all", { subjectId, classId });
      router.refresh();
    } catch {
      // silently fail
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
      <h3 className="font-semibold mb-4">Subjects</h3>

      <form onSubmit={handleSubmit} className="space-y-3 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Subject name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border dark:border-gray-700 rounded-lg px-3 py-2 text-sm flex-1"
            required
          />
          <input
            type="text"
            placeholder="Code (opt)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="border dark:border-gray-700 rounded-lg px-3 py-2 text-sm w-20"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-3 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {isAdmin && teachers && teachers.length > 0 && (
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="w-full border dark:border-gray-700 rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
          >
            <option value="">Assign to teacher (optional)</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.email})
              </option>
            ))}
          </select>
        )}
      </form>

      <div className="space-y-2">
        {subjects.map((s) => (
          <div key={s.id} className="flex items-center justify-between text-sm">
            <span>
              {s.name} {s.code && <span className="text-gray-400 dark:text-gray-500">({s.code})</span>}
            </span>
            <button
              onClick={() => assignToAll(s.id)}
              className="text-primary hover:underline text-xs"
            >
              Assign to all
            </button>
          </div>
        ))}
        {subjects.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No subjects yet</p>
        )}
      </div>
    </div>
  );
}
