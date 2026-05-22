import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AssignTeacherForm } from "./assign-form";

export default async function ClassesPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const classes = await prisma.class.findMany({
    where: { schoolId: session.user.schoolId },
    include: {
      teacher: { select: { id: true, name: true } },
      _count: { select: { students: true } },
    },
    orderBy: { order: "asc" },
  });

  const teachers = await prisma.user.findMany({
    where: { schoolId: session.user.schoolId, role: "TEACHER" },
    select: { id: true, name: true },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Classes</h1>
          <Link href="/admin" className="text-sm text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Class List</h2>
          </div>
          <div className="divide-y">
            {classes.map((cls) => (
              <div key={cls.id} className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">{cls.name}</p>
                  <p className="text-sm text-gray-500">{cls.section}</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-sm text-gray-500">
                    {cls._count.students} students
                  </p>
                </div>
                <div className="flex-1 text-right">
                  <AssignTeacherForm
                    classId={cls.id}
                    currentTeacherId={cls.teacher?.id ?? null}
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
