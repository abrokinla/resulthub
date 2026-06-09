import { queryOne, query } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ResultCard } from "@/components/results/result-card";

interface Props {
  params: Promise<{ regNumber: string; pin: string }>;
}

export default async function ViewResultPage({ params }: Props) {
  const { regNumber, pin } = await params;

  const student = await queryOne<{
    id: string;
    firstName: string;
    lastName: string;
    regNumber: string;
    parentPinHash: string;
    className: string;
    sheetType: string;
    schoolId: string;
    schoolName: string;
    schoolAddress: string | null;
    schoolLogoUrl: string | null;
  }>(
    `SELECT s.id, s."firstName", s."lastName", s."regNumber", s."parentPinHash",
            c.name AS "className", c."sheetType",
            sch.id AS "schoolId", sch.name AS "schoolName",
            sch.address AS "schoolAddress", sch."logoUrl" AS "schoolLogoUrl"
     FROM "Student" s
     JOIN "Class" c ON s."classId" = c.id
     JOIN "School" sch ON s."schoolId" = sch.id
     WHERE s."regNumber" = $1`,
    [regNumber]
  );

  if (!student || student.parentPinHash !== pin) notFound();

  const results = await query<{
    id: string;
    termName: string;
    academicYear: string;
    cumulative: number | null;
    average: number | null;
    position: number | null;
    positionOutOf: number | null;
    teacherComment: string | null;
    adminComment: string | null;
    adminGrade: string | null;
    affectiveDomain: any;
    psychomotorData: any;
    daysPresent: number | null;
    daysAbsent: number | null;
    outstandingFees: string | null;
    resumptionDate: string | null;
    createdAt: string;
  }>(
    `SELECT r.id, t.name AS "termName", r."academicYear",
            r.cumulative, r.average, r.position, r."positionOutOf",
            r."teacherComment", r."adminComment", r."adminGrade",
            r."affectiveDomain", r."psychomotorData",
            r."daysPresent", r."daysAbsent", r."outstandingFees",
            r."resumptionDate", r."createdAt"
     FROM "Result" r
     JOIN "Term" t ON r."termId" = t.id
     WHERE r."studentId" = $1 AND r.status = 'APPROVED'
     ORDER BY r."createdAt" DESC
     LIMIT 1`,
    [student.id]
  );

  const result = results[0];
  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center bg-white dark:bg-gray-900 p-8 rounded-xl shadow-sm border dark:border-gray-700">
          <h1 className="text-2xl font-bold mb-2">No Results Available</h1>
          <p className="text-gray-600 dark:text-gray-300">
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

  const scoreRows = await query<{
    subjectName: string;
    caScore: number | null;
    examScore: number | null;
    totalScore: number | null;
    grade: string | null;
    subjectPosition: number | null;
    isFail: boolean | null;
  }>(
    `SELECT sub.name AS "subjectName", sc."caScore", sc."examScore",
            sc."totalScore", sc.grade, sc."subjectPosition", sc."isFail"
     FROM "StudentSubject" ss
     JOIN "Subject" sub ON ss."subjectId" = sub.id
     LEFT JOIN "ScoreSummary" sc ON sc."studentSubjectId" = ss.id
     WHERE ss."studentId" = $1 AND sc."totalScore" IS NOT NULL`,
    [student.id]
  );
  const scores = scoreRows.map((r) => ({ subject: r.subjectName, ...r }));

  const affectiveDomain = result.affectiveDomain
    ? (result.affectiveDomain as { trait: string; rating: string }[])
    : undefined;
  const psychomotorData = result.psychomotorData
    ? (result.psychomotorData as { skill: string; rating: string }[])
    : undefined;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 print:bg-white print:p-0">
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
