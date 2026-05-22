"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

    const res = await fetch("/api/subject/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code, classId, schoolId }),
    });

    if (res.ok) {
      setName("");
      setCode("");
      router.refresh();
    }
    setLoading(false);
  }

  async function assignToAll(subjectId: string) {
    await fetch("/api/subject/assign-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId, classId }),
    });
    router.refresh();
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="font-semibold mb-4">Subjects</h3>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Subject name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm flex-1"
          required
        />
        <input
          type="text"
          placeholder="Code (opt)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-20"
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
              {s.name} {s.code && <span className="text-gray-400">({s.code})</span>}
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
          <p className="text-sm text-gray-500">No subjects yet</p>
        )}
      </div>
    </div>
  );
}
