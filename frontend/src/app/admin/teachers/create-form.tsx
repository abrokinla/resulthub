"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function CreateTeacherForm({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await api.post("/teacher/create", { name: form.name, email: form.email, schoolId });
      setIsSuccess(true);
      setMessage("Teacher created. Login details sent to their email.");
      setForm({ name: "", email: "" });
      router.refresh();
    } catch {
      setIsSuccess(false);
      setMessage("Failed to create teacher");
    }
    setLoading(false);
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border dark:border-gray-700">
      <h2 className="font-semibold mb-4">Create Teacher Account</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        After creating the teacher, assign them to a class or subject to give them access.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        {message && (
          <p className={`text-sm ${isSuccess ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Teacher"}
        </button>
      </form>
    </div>
  );
}
