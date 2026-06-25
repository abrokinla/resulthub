"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSection, type SectionGroup } from "@/lib/section-context";

const NAV_ITEMS = [
  { href: "/teacher", label: "Dashboard" },
  { href: "/teacher/profile", label: "Profile" },
];

const GROUPS: { value: SectionGroup; label: string }[] = [
  { value: "all", label: "All" },
  { value: "nursery_primary", label: "Nur/Pri" },
  { value: "secondary", label: "Secondary" },
];

export function TeacherSidebar() {
  const pathname = usePathname();
  const { sectionGroup, setSectionGroup } = useSection();

  return (
    <aside className="w-56 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col flex-shrink-0">
      <div className="h-14 flex items-center px-4 border-b dark:border-gray-800">
        <span className="font-bold text-lg">ResultHub</span>
      </div>

      <div className="p-3 border-b dark:border-gray-800">
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
          {GROUPS.map((g) => (
            <button
              key={g.value}
              onClick={() => setSectionGroup(g.value)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${
                sectionGroup === g.value
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/teacher"
              ? pathname === "/teacher"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t dark:border-gray-800">
        <Link
          href="/api/auth/logout"
          className="block px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
        >
          Sign Out
        </Link>
      </div>
    </aside>
  );
}
