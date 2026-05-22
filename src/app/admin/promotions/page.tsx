import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ProcessPromotions } from "./process-promotions";

export default async function PromotionsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const currentTerm = await prisma.term.findFirst({
    where: { schoolId: session.user.schoolId, isCurrent: true },
  });

  // Get all students with their annual records
  const students = await prisma.student.findMany({
    where: { schoolId: session.user.schoolId },
    include: {
      class: true,
      academicRecords: {
        where: { status: "ACTIVE" },
        take: 1,
      },
    },
    orderBy: [{ class: { order: "asc" } }, { firstName: "asc" }],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Promotions</h1>
          <Link href="/admin" className="text-sm text-primary hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <p className="text-sm text-gray-600 mb-4">
            This will process end-of-year promotions for all students. Students
            who meet the graduation criteria will advance to the next class.
          </p>
          <ProcessPromotions
            schoolId={session.user.schoolId}
            currentTermName={currentTerm?.name}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Students by Class</h2>
          </div>
          <div className="divide-y">
            {students.map((s) => (
              <div key={s.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {s.firstName} {s.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {s.class.name} - {s.regNumber}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    s.status === "ACTIVE"
                      ? "bg-blue-100 text-blue-700"
                      : s.status === "PROMOTED"
                      ? "bg-green-100 text-green-700"
                      : s.status === "GRADUATED"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
