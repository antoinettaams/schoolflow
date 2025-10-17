export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <div className="font-text flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      
    </div>
  );
}