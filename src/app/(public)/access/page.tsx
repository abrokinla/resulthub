"use client";

import { useState } from "react";
import Link from "next/link";

export default function ParentAccessPage() {
  const [regNumber, setRegNumber] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!regNumber || !pin) {
      setError("Please enter both registration number and PIN");
      return;
    }

    window.location.href = `/access/${regNumber}/${pin}`;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-primary">ResultHub</Link>
          <p className="text-gray-600 mt-2">Access your child&apos;s results</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Student Registration Number
            </label>
            <input
              type="text"
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g. STU-2024-001"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Access PIN</label>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value.toUpperCase())}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g. ABC123"
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary-dark"
          >
            View Result
          </button>
        </form>
      </div>
    </div>
  );
}
