import { SectionProvider } from "@/lib/section-context";
import { TeacherSidebar } from "./teacher-sidebar";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SectionProvider>
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
        <TeacherSidebar />
        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    </SectionProvider>
  );
}
