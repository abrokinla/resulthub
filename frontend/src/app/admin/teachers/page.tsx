import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api";
import { CreateTeacherForm } from "./create-form";
import { ResendInvitationButton } from "./resend-button";

export default async function TeachersPage() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) redirect("/login");

  let user: any;
  try {
    user = await apiServer("auth/me/", { token });
  } catch {
    redirect("/login");
  }
  if (!user?.role || !["ADMIN", "PRINCIPAL"].includes(user.role)) redirect("/login");

  const teachers = await apiServer("users/?role=TEACHER", { token }).catch(() => []);

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Teachers</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 w-full">
        <CreateTeacherForm schoolId={user.schoolId} />

        <div className="mt-8 bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-800">
            <h2 className="font-semibold">All Teachers</h2>
          </div>
          {teachers.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No teachers yet.</div>
          ) : (
            <div className="divide-y">
              {teachers.map((t: any) => (
                <div key={t.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t.classesCount ?? 0} classes
                    </span>
                    <ResendInvitationButton teacherId={t.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
