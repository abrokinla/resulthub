"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  resultId?: string;
  studentId: string;
  termId: string;
  affectiveTraits: string[];
  psychomotorSkills: string[];
  initialAffective?: { trait: string; rating: string }[];
  initialPsychomotor?: { skill: string; rating: string }[];
}

const RATINGS = ["A", "B", "C", "D", "E"];

export function AffectivePsychomotorForm({
  studentId,
  termId,
  affectiveTraits,
  psychomotorSkills,
  initialAffective,
  initialPsychomotor,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [affective, setAffective] = useState<
    { trait: string; rating: string }[]
  >(
    initialAffective ??
      affectiveTraits.map((t) => ({ trait: t, rating: "C" }))
  );

  const [psychomotor, setPsychomotor] = useState<
    { skill: string; rating: string }[]
  >(
    initialPsychomotor ??
      psychomotorSkills.map((s) => ({ skill: s, rating: "C" }))
  );

  function setAffectiveRating(trait: string, rating: string) {
    setAffective((prev) =>
      prev.map((a) => (a.trait === trait ? { ...a, rating } : a))
    );
  }

  function setPsychomotorRating(skill: string, rating: string) {
    setPsychomotor((prev) =>
      prev.map((p) => (p.skill === skill ? { ...p, rating } : p))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await fetch("/api/result/save-domains", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        termId,
        affectiveDomain: affective,
        psychomotorData: psychomotor,
      }),
    });

    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
      <h3 className="font-semibold mb-4">Affective & Psychomotor Ratings</h3>

      {affectiveTraits.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-sm mb-2">Affective Domain</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-800">
                <th className="text-left py-1">Trait</th>
                {RATINGS.map((r) => (
                  <th key={r} className="text-center py-1 w-10">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {affective.map((item) => (
                <tr key={item.trait} className="border-b dark:border-gray-800">
                  <td className="py-1">{item.trait}</td>
                  {RATINGS.map((r) => (
                    <td key={r} className="text-center py-1">
                      <input
                        type="radio"
                        name={`aff-${item.trait}`}
                        checked={item.rating === r}
                        onChange={() => setAffectiveRating(item.trait, r)}
                        className="accent-primary"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {psychomotorSkills.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-sm mb-2">Psychomotor Domain</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-800">
                <th className="text-left py-1">Skill</th>
                {RATINGS.map((r) => (
                  <th key={r} className="text-center py-1 w-10">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {psychomotor.map((item) => (
                <tr key={item.skill} className="border-b dark:border-gray-800">
                  <td className="py-1">{item.skill}</td>
                  {RATINGS.map((r) => (
                    <td key={r} className="text-center py-1">
                      <input
                        type="radio"
                        name={`psy-${item.skill}`}
                        checked={item.rating === r}
                        onChange={() => setPsychomotorRating(item.skill, r)}
                        className="accent-primary"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-white px-6 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Ratings"}
        </button>
      </div>
    </form>
  );
}
