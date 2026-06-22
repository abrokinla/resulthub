import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api";
import Link from "next/link";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) redirect("/login");

  const user = await apiServer("auth/me/", { token });
  if (user.role !== "ADMIN") redirect("/login");

  const config = await apiServer("config/", { token });
  const school = await apiServer(`schools/${user.schoolSlug}/`, { token });

  if (!school) redirect("/admin");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">School Settings</h1>
          <Link href="/admin" className="text-sm text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
          <h2 className="font-semibold mb-4">School Profile</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">School Name</label>
              <p className="font-medium">{school.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
              <p className="font-medium">{school.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Logo</label>
              {school.logo_url ? (
                <img src={school.logo_url} alt="Logo" className="h-16 mt-1" />
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">No logo uploaded</p>
              )}
            </div>
          </div>
        </div>

        <SettingsForm config={{
          id: school.id,
          passThreshold: config.pass_threshold,
          distinctionThreshold: config.distinction_threshold,
          graduationType: config.graduation_type,
          graduationMinCumulative: config.graduation_min_cumulative,
        }} />
      </main>
    </div>
  );
}
