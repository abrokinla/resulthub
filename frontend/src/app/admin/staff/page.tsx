import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api";
import { CreateStaffForm } from "./create-form";

const ROLE_LABELS: Record<string, string> = {
  PRINCIPAL: "Principal",
  VICE_PRINCIPAL: "Vice Principal",
  SECRETARY: "Secretary",
  ACCOUNTANT: "Accountant",
};

export default async function StaffPage() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) redirect("/login");

  const user = await apiServer("auth/me/", { token });
  if (!["ADMIN", "PRINCIPAL", "VICE_PRINCIPAL"].includes(user.role)) redirect("/login");

  const roles = ["PRINCIPAL", "VICE_PRINCIPAL", "SECRETARY", "ACCOUNTANT"];
  const staff = await Promise.all(
    roles.map(async (role) => {
      const data = await apiServer(`users/?role=${role}`, { token }).catch(() => []);
      return data.map((s: any) => ({ ...s, role }));
    })
  ).then((results) => results.flat());

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Staff Management</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 w-full">
        {user.role === "ADMIN" && <CreateStaffForm schoolId={user.schoolId} />}

        <div className="mt-8 bg-white dark:bg-gray-900 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
          <div className="p-4 border-b dark:border-gray-800">
            <h2 className="font-semibold">All Staff</h2>
          </div>
          {staff.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No staff members yet.</div>
          ) : (
            <div className="divide-y">
              {staff.map((s: any) => (
                <div key={s.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{s.email}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {ROLE_LABELS[s.role] || s.role}
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
