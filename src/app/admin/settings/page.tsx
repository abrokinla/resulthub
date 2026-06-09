import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { queryOne } from "@/lib/db";
import Link from "next/link";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const school = await queryOne<{
    id: string;
    name: string;
    email: string;
    logoUrl: string | null;
    address: string | null;
    passThreshold: number;
    distinctionThreshold: number;
    graduationType: string;
    graduationMinCumulative: number;
  }>(
    `SELECT s.id, s.name, s.email, s."logoUrl", s.address,
            COALESCE(sc."passThreshold", 50) AS "passThreshold",
            COALESCE(sc."distinctionThreshold", 75) AS "distinctionThreshold",
            COALESCE(sc."graduationType", 'passAll') AS "graduationType",
            COALESCE(sc."graduationMinCumulative", 50) AS "graduationMinCumulative"
     FROM "School" s
     LEFT JOIN "SchoolConfig" sc ON sc."schoolId" = s.id
     WHERE s.id = $1`,
    [session.user.schoolId]
  );

  if (!school) redirect("/admin");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">School Settings</h1>
          <Link href="/admin" className="text-sm text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="font-semibold mb-4">School Profile</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">School Name</label>
              <p className="font-medium">{school.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="font-medium">{school.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Logo</label>
              {school.logoUrl ? (
                <img
                  src={school.logoUrl}
                  alt="Logo"
                  className="h-16 mt-1"
                />
              ) : (
                <p className="text-sm text-gray-400">No logo uploaded</p>
              )}
            </div>
          </div>
        </div>

        <SettingsForm config={{
          id: school.id,
          passThreshold: school.passThreshold,
          distinctionThreshold: school.distinctionThreshold,
          graduationType: school.graduationType,
          graduationMinCumulative: school.graduationMinCumulative,
        }} />
      </main>
    </div>
  );
}
