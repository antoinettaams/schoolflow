import SidebarSecretaire from "@/components/ui/SidebarSecretaire";

export default function SidebarSecretaireLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <SidebarSecretaire />
      <div className="font-text flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      
    </div>
  );
}