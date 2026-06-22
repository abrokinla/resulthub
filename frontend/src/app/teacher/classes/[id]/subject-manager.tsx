"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Subject {
  id: string;
  name: string;
  code: string | null;
}

export function SubjectManager({
  classId,
  schoolId,
  subjects,
}: {
  classId: string;
  schoolId: string;
  subjects: Subject[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      await api.post("/subject/create", { name, code, classId, schoolId });
      setName("");
      setCode("");
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

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
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
