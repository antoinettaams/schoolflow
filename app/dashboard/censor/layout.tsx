import SidebarCensor from "@/components/ui/SidebarCensor";

export default function SidebarCensorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <SidebarCensor />
      <div className="font-text flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      
    </div>
  );
}