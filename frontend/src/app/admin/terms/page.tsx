import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api";
import Link from "next/link";

export default async function TermsPage() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) redirect("/login");

  const user = await apiServer("auth/me/", { token });
  if (user.role !== "ADMIN") redirect("/login");

  const terms = await apiServer("terms/", { token });

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
              {terms.map((t: any) => (
                <div key={t.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t.name} Term - {t.academic_year}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(t.starts_at).toLocaleDateString()} - {new Date(t.ends_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      t.is_current
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {t.is_current ? "Current" : "Inactive"}
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
