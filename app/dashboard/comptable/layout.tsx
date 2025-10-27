import SidebarComptable from "@/components/ui/SidebarComptable";

export default function SidebarComptableLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <SidebarComptable />
      <div className="font-text flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      
    </div>
  );
}