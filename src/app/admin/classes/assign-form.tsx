"use client";

import { useRouter } from "next/navigation";

interface Props {
  classId: string;
  currentTeacherId: string | null;
  teachers: { id: string; name: string }[];
}

export function AssignTeacherForm({
  classId,
  currentTeacherId,
  teachers,
}: Props) {
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const teacherId = e.target.value || null;

    await fetch("/api/class/assign-teacher", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId, teacherId }),
    });

    router.refresh();
  }

  return (
    <select
      defaultValue={currentTeacherId ?? ""}
      onChange={handleChange}
      className="text-sm border rounded-lg px-2 py-1"
    >
      <option value="">Unassigned</option>
      {teachers.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}
