import { getSheetType, type SheetTypeConfig } from "@/lib/sheet-types";

interface ScoreRow {
  subject: string;
  caScore?: number | null;
  ca1Score?: number | null;
  ca2Score?: number | null;
  examScore?: number | null;
  totalScore?: number | null;
  grade?: string | null;
  subjectPosition?: number | null;
  isFail?: boolean | null;
}

interface ResultCardProps {
  school: {
    name: string;
    address?: string | null;
    logoUrl?: string | null;
  };
  student: {
    firstName: string;
    lastName: string;
    regNumber: string;
    className: string;
  };
  term: {
    name: string;
    academicYear: string;
  };
  scores: ScoreRow[];
  sheetTypeId: string;
  affectiveDomain?: { trait: string; rating: string }[];
  psychomotorData?: { skill: string; rating: string }[];
  teacherComment?: string | null;
  adminComment?: string | null;
  adminGrade?: string | null;
  cumulative?: number | null;
  average?: number | null;
  position?: number | null;
  positionOutOf?: number | null;
  daysPresent?: number | null;
  daysAbsent?: number | null;
  outstandingFees?: string | null;
  resumptionDate?: string | null;
}

export function ResultCard({
  school,
  student,
  term,
  scores,
  sheetTypeId,
  affectiveDomain,
  psychomotorData,
  teacherComment,
  adminComment,
  adminGrade,
  cumulative,
  average,
  position,
  positionOutOf,
  daysPresent,
  daysAbsent,
  outstandingFees,
  resumptionDate,
}: ResultCardProps) {
  const sheetConfig = getSheetType("", sheetTypeId);
  const scale = sheetConfig.ratingScale;

  return (
    <div className="bg-white shadow-sm border print:shadow-none print:border-none dark:bg-gray-900 dark:border-gray-700">
      {/* School Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        {school.logoUrl && (
          <img
            src={school.logoUrl}
            alt="School Logo"
            className="h-16 mx-auto mb-2"
          />
        )}
        <h1 className="text-xl font-bold uppercase tracking-wide">{school.name}</h1>
        {school.address && (
          <p className="text-xs text-gray-600 dark:text-gray-300">{school.address}</p>
        )}
        <h2 className="text-lg font-semibold mt-2 uppercase">Terminal Report Sheet</h2>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mb-6 border-b pb-4">
        <div className="flex">
          <span className="font-medium w-32">Name of Student:</span>
          <span>{student.lastName} {student.firstName}</span>
        </div>
        <div className="flex">
          <span className="font-medium w-32">Class:</span>
          <span>{student.className}</span>
        </div>
        <div className="flex">
          <span className="font-medium w-32">Term:</span>
          <span>{term.name} Term</span>
        </div>
        <div className="flex">
          <span className="font-medium w-32">Session:</span>
          <span>{term.academicYear}</span>
        </div>
        {daysPresent !== undefined && (
          <div className="flex">
            <span className="font-medium w-32">Days Present:</span>
            <span>{daysPresent}</span>
          </div>
        )}
        {daysAbsent !== undefined && (
          <div className="flex">
            <span className="font-medium w-32">Days Absent:</span>
            <span>{daysAbsent}</span>
          </div>
        )}
      </div>

      {/* Score Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse border border-black">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border border-black px-2 py-1 text-left w-1">
                S/N
              </th>
              <th className="border border-black px-2 py-1 text-left">
                SUBJECTS
              </th>
              {sheetConfig.scoreColumns.map((col) => (
                <th
                  key={col.key}
                  className="border border-black px-2 py-1 text-center"
                >
                  {col.label}
                </th>
              ))}
              <th className="border border-black px-2 py-1 text-center w-12">
                GRADE
              </th>
              <th className="border border-black px-2 py-1 text-center w-20">
                POSTN/SIGN
              </th>
            </tr>
          </thead>
          <tbody>
            {scores.map((row, i) => {
              const grade = row.grade || "-";
              const isF = grade === "F";
              return (
                <tr key={i} className={isF ? "text-red-600 dark:text-red-400" : ""}>
                  <td className="border border-black px-2 py-1 text-center">
                    {i + 1}
                  </td>
                  <td className="border border-black px-2 py-1 font-medium">
                    {row.subject}
                  </td>
                  {sheetConfig.scoreColumns.map((col) => {
                    let val: number | string | null | undefined;
                    if (col.key === "ca1") val = row.ca1Score;
                    else if (col.key === "ca2") val = row.ca2Score;
                    else if (col.key === "ca") val = row.caScore;
                    else if (col.key === "exam") val = row.examScore;
                    else if (col.key === "total") val = row.totalScore;
                    else val = "-";

                    const disp = val ?? "-";
                    return (
                      <td
                        key={col.key}
                        className={`border border-black px-2 py-1 text-center font-bold ${
                          col.key === "total" && isF ? "text-red-600 dark:text-red-400" : ""
                        }`}
                      >
                        {typeof disp === "number" ? disp.toFixed(0) : disp}
                      </td>
                    );
                  })}
                  <td className="border border-black px-2 py-1 text-center font-bold">
                    {grade}
                  </td>
                  <td className="border border-black px-2 py-1 text-center">
                    {row.subjectPosition ?? "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rating Scale */}
      <div className="mb-6">
        <h3 className="font-semibold text-sm mb-1">RATING SCALE</h3>
        <div className="flex flex-wrap gap-1 text-xs">
          {scale.map((entry) => (
            <span key={entry.grade} className="border px-2 py-0.5">
              {entry.grade} = {entry.label} ({entry.range})
            </span>
          ))}
        </div>
      </div>

      {/* Cumulative & Average */}
      {(cumulative != null || average != null) && (
        <div className="flex gap-8 text-sm mb-4">
          {cumulative != null && (
            <p>
              <span className="font-medium">Total Score:</span>{" "}
              {cumulative.toFixed(0)}
            </p>
          )}
          {average != null && (
            <p>
              <span className="font-medium">Average:</span> {average.toFixed(1)}
            </p>
          )}
          {position != null && (
            <p>
              <span className="font-medium">Position:</span>{" "}
              {position}{positionOutOf ? ` out of ${positionOutOf}` : ""}
            </p>
          )}
        </div>
      )}

      {/* Affective Domain */}
      {affectiveDomain && affectiveDomain.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 border border-black">
            AFFECTIVE DOMAIN
          </h3>
          <table className="w-full text-sm border-collapse border border-black">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="border border-black px-2 py-1 text-left">TRAITS</th>
                {["A", "B", "C", "D", "E"].map((c) => (
                  <th key={c} className="border border-black px-2 py-1 text-center w-10">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {affectiveDomain.map((item, i) => (
                <tr key={i}>
                  <td className="border border-black px-2 py-1">{item.trait}</td>
                  {["A", "B", "C", "D", "E"].map((c) => (
                    <td
                      key={c}
                      className={`border border-black px-2 py-1 text-center font-bold ${
                        item.rating === c ? "bg-gray-200" : ""
                      }`}
                    >
                      {item.rating === c ? "✓" : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Psychomotor Domain */}
      {psychomotorData && psychomotorData.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 border border-black">
            PSYCHOMOTOR DOMAIN
          </h3>
          <table className="w-full text-sm border-collapse border border-black">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="border border-black px-2 py-1 text-left">SKILLS</th>
                {["A", "B", "C", "D", "E"].map((c) => (
                  <th key={c} className="border border-black px-2 py-1 text-center w-10">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {psychomotorData.map((item, i) => (
                <tr key={i}>
                  <td className="border border-black px-2 py-1">{item.skill}</td>
                  {["A", "B", "C", "D", "E"].map((c) => (
                    <td
                      key={c}
                      className={`border border-black px-2 py-1 text-center font-bold ${
                        item.rating === c ? "bg-gray-200" : ""
                      }`}
                    >
                      {item.rating === c ? "✓" : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Comments */}
      <div className="mb-6 space-y-3">
        {teacherComment && (
          <div className="text-sm">
            <span className="font-medium">Form Teacher&apos;s Comment:</span>
            <p className="border-b border-dotted border-gray-400 dark:border-gray-600 mt-1 min-h-[2rem]">
              {teacherComment}
            </p>
          </div>
        )}
        {adminComment && (
          <div className="text-sm">
            <span className="font-medium">
              {sheetConfig.comments.admin === "principalComment"
                ? "Principal&apos;s Comment"
                : "Head Teacher&apos;s Comment"}
              {adminGrade && <span> ({adminGrade})</span>}:
            </span>
            <p className="border-b border-dotted border-gray-400 dark:border-gray-600 mt-1 min-h-[2rem]">
              {adminComment}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t pt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        {outstandingFees && (
          <div className="flex">
            <span className="font-medium w-40">Outstanding School Fees:</span>
            <span>{outstandingFees}</span>
          </div>
        )}
        {resumptionDate && (
          <div className="flex">
            <span className="font-medium w-40">Resumption Date:</span>
            <span>{resumptionDate}</span>
          </div>
        )}
        {/* Signature spaces */}
        <div className="col-span-2 flex justify-between mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="h-10" />
            <p className="text-xs border-t border-black pt-1">
              Class Teacher&apos;s Signature
            </p>
          </div>
          <div className="text-center">
            <div className="h-10" />
            <p className="text-xs border-t border-black pt-1">
              {sheetConfig.comments.admin === "principalComment"
                ? "Principal's Signature"
                : "Head Teacher's Signature"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
