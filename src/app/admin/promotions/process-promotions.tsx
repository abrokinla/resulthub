"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProcessPromotions({
  schoolId,
  currentTermName,
}: {
  schoolId: string;
  currentTermName?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    promoted: number;
    graduated: number;
    failed: number;
  } | null>(null);

  async function handleProcess() {
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/promotion/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolId }),
    });

    const data = await res.json();
    if (res.ok) {
      setResult(data);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div>
      {currentTermName !== "THIRD" ? (
        <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg text-sm mb-4">
          Promotions can only be processed at the end of the Third Term.
        </div>
      ) : (
        <>
          <button
            onClick={handleProcess}
            disabled={loading}
            className="bg-primary text-white px-6 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? "Processing..." : "Process Promotions"}
          </button>

          {result && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">
                  {result.promoted}
                </p>
                <p className="text-sm text-green-600">Promoted</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-700">
                  {result.graduated}
                </p>
                <p className="text-sm text-purple-600">Graduated</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-700">
                  {result.failed}
                </p>
                <p className="text-sm text-red-600">Repeating</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
