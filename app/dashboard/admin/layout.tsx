import SidebarAdmin from "@/components/ui/SidebarAdmin";

export default function SidebarAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <SidebarAdmin />
      <div className="font-text flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      
    </div>
  );
}