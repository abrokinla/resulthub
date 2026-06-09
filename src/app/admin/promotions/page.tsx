import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { queryOne, query } from "@/lib/db";
import Link from "next/link";
import { ProcessPromotions } from "./process-promotions";

export default async function PromotionsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const currentTerm = await queryOne<{ name: string }>(
    `SELECT name FROM "Term" WHERE "schoolId" = $1 AND "isCurrent" = true LIMIT 1`,
    [session.user.schoolId]
  );

  const students = await query<{
    id: string;
    firstName: string;
    lastName: string;
    regNumber: string;
    status: string;
    className: string;
    classOrder: number;
  }>(
    `SELECT s.id, s."firstName", s."lastName", s."regNumber", s.status,
            c.name AS "className", c."order" AS "classOrder"
     FROM "Student" s
     JOIN "Class" c ON s."classId" = c.id
     WHERE s."schoolId" = $1
     ORDER BY c."order" ASC, s."firstName" ASC`,
    [session.user.schoolId]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Promotions</h1>
          <Link href="/admin" className="text-sm text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700 mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            This will process end-of-year promotions for all students. Students
            who meet the graduation criteria will advance to the next class.
          </p>
          <ProcessPromotions
            schoolId={session.user.schoolId}
            currentTermName={currentTerm?.name}
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-800">
            <h2 className="font-semibold">Students by Class</h2>
          </div>
          <div className="divide-y">
            {students.map((s) => (
              <div key={s.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {s.firstName} {s.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {s.className} - {s.regNumber}
                  </p>
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
        </div>
      </main>
    </div>
  );
}
