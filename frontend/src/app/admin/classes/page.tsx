import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api";
import Link from "next/link";
import { AssignTeacherForm } from "./assign-form";

export default async function ClassesPage() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) redirect("/login");

  const user = await apiServer("auth/me/", { token });
  if (user.role !== "ADMIN") redirect("/login");

  const [classes, teachers] = await Promise.all([
    apiServer("classes/", { token }),
    apiServer("users/?role=TEACHER", { token }).catch(() => []),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Classes</h1>
          <Link href="/admin" className="text-sm text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-800">
            <h2 className="font-semibold">Class List</h2>
          </div>
          <div className="divide-y">
            {classes.map((cls: any) => (
              <div key={cls.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{cls.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{cls.section}</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {cls.studentsCount ?? 0} students
                  </p>
                </div>
                <div className="flex-1 text-right">
                  <AssignTeacherForm
                    classId={cls.id}
                    currentTeacherId={cls.teacher ?? null}
                    teachers={teachers}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
