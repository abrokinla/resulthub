import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import Link from "next/link";

export default async function TermsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const terms = await query<{
    id: string;
    name: string;
    academicYear: string;
    isCurrent: boolean;
    startsAt: string;
    endsAt: string;
  }>(
    `SELECT id, name, "academicYear", "isCurrent", "startsAt", "endsAt"
     FROM "Term" WHERE "schoolId" = $1
     ORDER BY "academicYear" DESC, name ASC`,
    [session.user.schoolId]
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Academic Terms</h1>
          <Link href="/admin" className="text-sm text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-800">
            <h2 className="font-semibold">Terms</h2>
          </div>
          {terms.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No terms defined.</div>
          ) : (
            <div className="divide-y">
              {terms.map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {t.name} Term - {t.academicYear}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(t.startsAt).toLocaleDateString()} -{" "}
                      {new Date(t.endsAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      t.isCurrent
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {t.isCurrent ? "Current" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
