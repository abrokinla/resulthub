"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSection } from "@/lib/section-context";
import { ProcessPromotions } from "./process-promotions";

export default function PromotionsPage() {
  const { sectionGroup } = useSection();
  const [user, setUser] = useState<any>(null);
  const [terms, setTerms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const u = (await api.get("/auth/me/")).data;
        setUser(u);
        const sgParam = sectionGroup !== "all" ? { section_group: sectionGroup } : {};
        const [termsData, studentsData] = await Promise.all([
          api.get("/terms/"),
          api.get("/students/", { params: sgParam }).catch(() => ({ data: [] })),
        ]);
        setTerms(termsData.data);
        setStudents(studentsData.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sectionGroup]);

  const currentTerm = Array.isArray(terms) ? terms.find((t: any) => t.is_current) : null;

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Promotions</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            This will process end-of-year promotions for all students. Students
            who meet the graduation criteria will advance to the next class.
          </p>
          <ProcessPromotions
            schoolId={user?.schoolId}
            currentTermName={currentTerm?.name}
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-800">
            <h2 className="font-semibold">Students by Class</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : (
            <div className="divide-y">
              {students.map((s: any) => (
                <div key={s.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{s.first_name} {s.last_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{s.className} - {s.reg_number}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      s.status === "ACTIVE"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        : s.status === "PROMOTED"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : s.status === "GRADUATED"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
