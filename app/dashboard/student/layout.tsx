import SidebarStudent from "@/components/ui/SidebarStudent";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <SidebarStudent />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      
    </div>
  );
}