import { notFound } from "next/navigation";
import Link from "next/link";
import { ResultCard } from "@/components/results/result-card";

interface Props {
  params: Promise<{ regNumber: string; pin: string }>;
}

export default async function ViewResultPage({ params }: Props) {
  const { regNumber, pin } = await params;

  // This is a public view — query Django via server-side fetch (no auth needed)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(
    `${API_URL}/api/public/access/${regNumber}/${pin}/`,
    { cache: "no-store" }
  );

  if (!res.ok) notFound();

  const data = await res.json();
  const { student, result, scores } = data;

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border dark:border-gray-700">
          <h1 className="text-2xl font-bold mb-2">No Results Available</h1>
          <p className="text-gray-600 dark:text-gray-300">
            No approved results found for this student.
          </p>
          <Link href="/access" className="text-primary hover:underline mt-4 inline-block">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  const affectiveDomain = result.affectiveDomain
    ? (result.affectiveDomain as { trait: string; rating: string }[])
    : undefined;
  const psychomotorData = result.psychomotorData
    ? (result.psychomotorData as { skill: string; rating: string }[])
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 print:bg-white print:p-0">
      <div className="max-w-[800px] mx-auto">
        <div className="mb-4 text-center print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-dark"
          >
            Print Result
          </button>
        </div>

        <ResultCard
          school={{
            name: student.schoolName,
            address: student.schoolAddress ?? "",
            logoUrl: student.schoolLogoUrl,
          }}
          student={{
            firstName: student.firstName,
            lastName: student.lastName,
            regNumber: student.regNumber,
            className: student.className,
          }}
          term={{
            name: result.termName,
            academicYear: result.academicYear,
          }}
          scores={scores}
          sheetTypeId={student.sheetType}
          affectiveDomain={affectiveDomain}
          psychomotorData={psychomotorData}
          teacherComment={result.teacherComment}
          adminComment={result.adminComment}
          adminGrade={result.adminGrade ?? undefined}
          cumulative={result.cumulative ?? undefined}
          average={result.average ?? undefined}
          position={result.position ?? undefined}
          positionOutOf={result.positionOutOf ?? undefined}
          daysPresent={result.daysPresent ?? undefined}
          daysAbsent={result.daysAbsent ?? undefined}
          outstandingFees={result.outstandingFees ?? undefined}
          resumptionDate={result.resumptionDate ?? undefined}
        />
      </div>
    </div>
  );
}
