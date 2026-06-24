"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export function ResendInvitationButton({ teacherId }: { teacherId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await api.post("/teacher/resend-invitation", { teacherId });
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch {
      alert("Failed to resend invitation");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs text-primary hover:underline disabled:opacity-50"
    >
      {loading ? "..." : done ? "Sent!" : "Resend Invitation"}
    </button>
  );
}
