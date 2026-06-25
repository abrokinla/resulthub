"use client";

import { useState } from "react";
import { SectionProvider } from "@/lib/section-context";
import TeacherSidebar from "./teacher-sidebar";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SectionProvider>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        <TeacherSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center px-4 bg-white dark:bg-gray-900 border-b dark:border-gray-800 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Open sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="ml-2 font-semibold text-sm text-gray-500 dark:text-gray-400">Teacher</span>
          </header>

          {children}
        </div>
      </div>
    </SectionProvider>
  );
}
