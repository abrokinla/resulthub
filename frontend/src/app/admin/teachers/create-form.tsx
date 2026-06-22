"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateTeacherForm({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/teacher/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, schoolId }),
    });

    const data = await res.json();
    if (res.ok) {
      setIsSuccess(true);
      setMessage("Teacher created successfully!");
      setForm({ name: "", email: "", password: "" });
      router.refresh();
    } else {
      setIsSuccess(false);
      setMessage(data.error || "Failed to create teacher");
    }
    setLoading(false);
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border dark:border-gray-700">
      <h2 className="font-semibold mb-4">Create Teacher Account</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border rounded-lg px-3 py-2"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border rounded-lg px-3 py-2"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border rounded-lg px-3 py-2"
            minLength={6}
            required
          />
        </div>
        {message && (
          <p className={`text-sm ${isSuccess ? "text-success dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
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
