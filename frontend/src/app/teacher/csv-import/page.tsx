"use client";
import Link from "next/link";

export default function CsvImportPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">CSV Import</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">This feature is coming soon.</p>
        <Link href="/teacher" className="text-primary hover:underline">&larr; Back to Dashboard</Link>
      </div>
    </div>
  );
}
