import SidebarParent from "@/components/ui/SidebarParent";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <SidebarParent />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      
    </div>
  );
}