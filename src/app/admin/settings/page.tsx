import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const school = await prisma.school.findUnique({
    where: { id: session.user.schoolId },
    include: { config: true },
  });

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

        <SettingsForm config={school.config!} />
      </main>
    </div>
  );
}
