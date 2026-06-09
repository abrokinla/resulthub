"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApproveButton({ resultId }: { resultId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    await fetch("/api/result/approve", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultId }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="text-xs bg-success text-white px-3 py-1 rounded-full hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50"
    >
      {loading ? "..." : "Approve"}
    </button>
  );
}
