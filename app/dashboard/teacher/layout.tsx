import SidebarTeacher from "@/components/ui/SidebarTeacher";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <SidebarTeacher />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      
    </div>
  );
}