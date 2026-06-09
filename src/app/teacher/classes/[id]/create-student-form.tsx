"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateStudentForm({
  classId,
  schoolId,
}: {
  classId: string;
  schoolId: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    regNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/student/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, classId, schoolId }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("Student created! PIN: " + data.pin);
      setForm({ firstName: "", lastName: "", regNumber: "" });
      router.refresh();
    } else {
      setMessage(data.error || "Failed to create student");
    }
    setLoading(false);
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm dark:shadow-gray-900/50 border dark:border-gray-700">
      <h3 className="font-semibold mb-4">Add Student</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="First Name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className="border dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="border dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>
        <input
          type="text"
          placeholder="Registration Number"
          value={form.regNumber}
          onChange={(e) => setForm({ ...form, regNumber: e.target.value })}
          className="border dark:border-gray-700 rounded-lg px-3 py-2 text-sm w-full"
          required
        />
        {message && (
          <p
            className={`text-sm ${
              message.includes("PIN") ? "text-success dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Student"}
        </button>
      </form>
    </div>
  );
}
