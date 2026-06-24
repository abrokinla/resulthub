"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const STAFF_ROLES = [
  { value: "PRINCIPAL", label: "Principal" },
  { value: "VICE_PRINCIPAL", label: "Vice Principal" },
  { value: "SECRETARY", label: "Secretary" },
  { value: "ACCOUNTANT", label: "Accountant" },
];

export function CreateStaffForm({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", role: "PRINCIPAL" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await api.post("/staff/create", { name: form.name, email: form.email, role: form.role, schoolId });
      setIsSuccess(true);
      setMessage("Staff created. Login details sent to their email.");
      setForm({ name: "", email: "", role: "PRINCIPAL" });
      router.refresh();
    } catch {
      setIsSuccess(false);
      setMessage("Failed to create staff member");
    }
    setLoading(false);
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border dark:border-gray-700">
      <h2 className="font-semibold mb-4">Create Staff Account</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
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
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            {STAFF_ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
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
          {loading ? "Creating..." : "Create Staff"}
        </button>
      </form>
    </div>
  );
}