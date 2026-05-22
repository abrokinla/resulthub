"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface StudentData {
  id: string;
  name: string;
  regNumber: string;
  subjects: {
    id: string;
    subjectName: string;
    caScore: number | null;
    examScore: number | null;
    totalScore: number | null;
    grade: string | null;
  }[];
}

export function ScoreEntry({
  classId,
  students,
  subjects,
}: {
  classId: string;
  students: StudentData[];
  subjects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [selectedSubject, setSelectedSubject] = useState(
    subjects[0]?.id ?? ""
  );
  const [scores, setScores] = useState<
    Record<string, { ca: string; exam: string }>
  >({});
  const [saving, setSaving] = useState(false);

  const currentSubject = subjects.find((s) => s.id === selectedSubject);
  const studentSubjectMap = new Map<string, StudentData["subjects"][0]>();
  for (const s of students) {
    for (const ss of s.subjects) {
      if (ss.subjectName === currentSubject?.name) {
        studentSubjectMap.set(s.id, ss);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const entries = Object.entries(scores).map(([studentSubjectId, s]) => ({
      studentSubjectId,
      caScore: s.ca ? parseInt(s.ca) : null,
      examScore: s.exam ? parseInt(s.exam) : null,
      classId,
    }));

    await fetch("/api/score/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });

    setSaving(false);
    setScores({});
    router.refresh();
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="font-semibold mb-4">Score Entry</h3>

      <div className="mb-4">
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <form onSubmit={handleSubmit}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Student</th>
              <th className="text-center py-2">CA Score</th>
              <th className="text-center py-2">Exam Score</th>
              <th className="text-center py-2">Total</th>
              <th className="text-center py-2">Grade</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const ss = studentSubjectMap.get(student.id);
              const key = ss?.id ?? "";
              const caVal = scores[key]?.ca ?? ss?.caScore ?? "";
              const examVal = scores[key]?.exam ?? ss?.examScore ?? "";
              const total = ss?.totalScore ?? null;
              const grade = ss?.grade ?? null;

              return (
                <tr key={student.id} className="border-b">
                  <td className="py-2">{student.name}</td>
                  <td className="py-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={40}
                      value={caVal}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], ca: e.target.value },
                        }))
                      }
                      className="w-16 border rounded px-2 py-1 text-center"
                      disabled={!key}
                    />
                  </td>
                  <td className="py-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={70}
                      value={examVal}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], exam: e.target.value },
                        }))
                      }
                      className="w-16 border rounded px-2 py-1 text-center"
                      disabled={!key}
                    />
                  </td>
                  <td
                    className={`py-2 text-center font-medium ${
                      grade === "F" ? "text-red-600" : ""
                    }`}
                  >
                    {total !== null ? total : "-"}
                  </td>
                  <td className="py-2 text-center font-medium">{grade ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {selectedSubject && (
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-white px-6 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Scores"}
            </button>
          </div>
        )}
      </form>

      {!currentSubject && (
        <p className="text-sm text-gray-500">
          Create subjects first to enter scores.
        </p>
      )}
    </div>
  );
}
