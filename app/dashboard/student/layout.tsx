// app/dashboard/student/layout.tsx
"use client";

import React, { ReactNode } from "react";
import SidebarStudent from "@/components/ui/SidebarStudent";

interface StudentDashboardLayoutProps {
  children: ReactNode;
}

const StudentDashboardLayout = ({ children }: StudentDashboardLayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar fixe */}
      <SidebarStudent />

      {/* Contenu principal */}
      <main className="flex-1 overflow-y-auto lg:ml-0">
        {children}
      </main>
    </div>
  );
};

export default StudentDashboardLayout;