"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSection } from "@/lib/section-context";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/teachers", label: "Teachers" },
  { href: "/admin/subjects", label: "Subjects" },
  { href: "/admin/classes", label: "Classes" },
  { href: "/admin/results", label: "Results" },
  { href: "/admin/promotions", label: "Promotions" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/settings", label: "Settings" },
];

const GROUPS = [
  { value: "all" as const, label: "All" },
  { value: "nursery_primary" as const, label: "Nur/Pri" },
  { value: "secondary" as const, label: "Secondary" },
];

export default function AdminSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { sectionGroup, setSectionGroup } = useSection();

  function handleNav() {
    onClose();
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 w-56 flex flex-col bg-white dark:bg-gray-900 border-r dark:border-gray-800 transform transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0`}
      >
        <div className="h-14 flex items-center px-4 border-b dark:border-gray-800">
          <Link href="/admin" className="text-lg font-bold text-primary">
            ResultHub
          </Link>
        </div>

        <div className="p-3 border-b dark:border-gray-800">
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
            {GROUPS.map((g) => (
              <button
                key={g.value}
                onClick={() => setSectionGroup(g.value)}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
                  sectionGroup === g.value
                    ? "bg-white dark:bg-gray-700 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNav}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
            className="block px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Sign Out
          </Link>
        </div>
      </aside>
    </>
  );
}
