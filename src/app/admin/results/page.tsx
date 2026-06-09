import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import Link from "next/link";
import { ApproveButton } from "./approve-button";

export default async function ResultsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const results = await query<{
    id: string;
    status: string;
    firstName: string;
    lastName: string;
    regNumber: string;
    termName: string;
    updatedAt: string;
  }>(
    `SELECT r.id, r.status, s."firstName", s."lastName", s."regNumber",
            t.name AS "termName", r."updatedAt"
     FROM "Result" r
     JOIN "Student" s ON r."studentId" = s.id
     JOIN "Term" t ON r."termId" = t.id
     WHERE s."schoolId" = $1
     ORDER BY r."updatedAt" DESC
     LIMIT 50`,
    [session.user.schoolId]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Results</h1>
          <Link href="/admin" className="text-sm text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-800">
            <h2 className="font-semibold">All Results</h2>
          </div>
          {results.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No results found.
            </div>
          ) : (
            <div className="divide-y">
              {results.map((r) => (
                <div key={r.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {r.firstName} {r.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {r.regNumber} - {r.termName} Term
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        r.status === "APPROVED"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : r.status === "PENDING_APPROVAL"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {r.status.replace(/_/g, " ")}
                    </span>
                    {r.status === "PENDING_APPROVAL" && (
                      <ApproveButton resultId={r.id} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
