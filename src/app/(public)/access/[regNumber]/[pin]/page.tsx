import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ResultCard } from "@/components/results/result-card";

interface Props {
  params: Promise<{ regNumber: string; pin: string }>;
}

export default async function ViewResultPage({ params }: Props) {
  const { regNumber, pin } = await params;

  const student = await prisma.student.findFirst({
    where: { regNumber },
    include: {
      class: true,
      school: { include: { config: true } },
      results: {
        where: { status: "APPROVED" },
        include: { term: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      studentSubjects: {
        include: {
          subject: true,
          scoreSummaries: true,
        },
      },
    },
  });

  if (!student || student.parentPinHash !== pin) notFound();

  const result = student.results[0];
  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-sm border">
          <h1 className="text-2xl font-bold mb-2">No Results Available</h1>
          <p className="text-gray-600">
            No approved results found for this student.
          </p>
          <Link
            href="/access"
            className="text-primary hover:underline mt-4 inline-block"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  // Build scores for the card
  const scores = student.studentSubjects
    .map((ss) => {
      const s = ss.scoreSummaries[0];
      return {
        subject: ss.subject.name,
        caScore: s?.caScore ?? undefined,
        examScore: s?.examScore ?? undefined,
        totalScore: s?.totalScore ?? undefined,
        grade: s?.grade ?? undefined,
        subjectPosition: s?.subjectPosition ?? undefined,
        isFail: s?.isFail ?? undefined,
      };
    })
    .filter((s) => s.totalScore !== undefined);

  // Parse affective & psychomotor data
  const affectiveDomain = result.affectiveDomain
    ? (result.affectiveDomain as { trait: string; rating: string }[])
    : undefined;
  const psychomotorData = result.psychomotorData
    ? (result.psychomotorData as { skill: string; rating: string }[])
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white print:p-0">
      <div className="max-w-[800px] mx-auto">
        {/* Print button (hidden when printing) */}
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
            name: student.school.name,
            address: student.school.address ?? "",
            logoUrl: student.school.logoUrl,
          }}
          student={{
            firstName: student.firstName,
            lastName: student.lastName,
            regNumber: student.regNumber,
            className: student.class.name,
          }}
          term={{
            name: result.term.name,
            academicYear: result.academicYear,
          }}
          scores={scores}
          sheetTypeId={student.class.sheetType}
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
