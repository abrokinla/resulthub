"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

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

    try {
      await api.put("/class/assign-teacher", { classId, teacherId });
      router.refresh();
    } catch {
      // silently fail
    }
  }

  return (
    <select
      defaultValue={currentTeacherId ?? ""}
      onChange={handleChange}
      className="text-sm border dark:border-gray-700 rounded-lg px-2 py-1"
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
