import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api";

export default async function DashboardPage() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) redirect("/login");

  let user: any;
  try {
    user = await apiServer("auth/me/", { token });
  } catch {
    redirect("/login");
  }

  if (["ADMIN", "PRINCIPAL", "VICE_PRINCIPAL", "SECRETARY"].includes(user.role)) redirect("/admin");
  if (user.role === "TEACHER") redirect("/teacher");

  return null;
}
