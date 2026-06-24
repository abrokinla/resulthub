import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api";

export default async function DashboardPage() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) redirect("/login");

  const user = await apiServer("auth/me/", { token });

  if (["ADMIN", "PRINCIPAL", "VICE_PRINCIPAL", "SECRETARY"].includes(user.role)) redirect("/admin");
  if (["CLASS_TEACHER", "SUBJECT_TEACHER"].includes(user.role)) redirect("/teacher");

  return null;
}
