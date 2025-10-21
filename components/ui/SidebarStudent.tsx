"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
  FaUserGraduate,
  FaCalendarAlt,
  FaBookOpen,
  FaFileAlt,
  FaGraduationCap,
  FaClipboardList,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUser,
  FaChevronDown,
} from "react-icons/fa";

const SidebarStudent = ({ studentName = "Antoinetta Dupont" }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const initials = "AD";

  const navItems = [
    { label: "Tableau de Bord", href: "/dashboard/student", icon: <FaUserGraduate /> },
    { label: "Emploi du Temps", href: "/dashboard/student/schedule", icon: <FaCalendarAlt />, category: "ACADÉMIQUE" },
    { label: "Examens & Notes", href: "/dashboard/student/exams", icon: <FaClipboardList />, category: "ACADÉMIQUE" },
    { label: "Exercices", href: "/dashboard/student/homeworks", icon: <FaBookOpen />, category: "ACADÉMIQUE" },
    { label: "Évènements Scolaires", href: "/dashboard/student/events", icon: <FaGraduationCap />, category: "ACADÉMIQUE" },
    { label: "Bulletins", href: "/dashboard/student/grades", icon: <FaFileAlt />, category: "ACADÉMIQUE" },
  ];

  const getLinkClasses = (href: string) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    return [
      "flex items-center gap-3 font-medium p-2 rounded-lg transition",
      isActive ? "text-white bg-principal font-semibold" : "text-gray-700 hover:bg-gray-100",
    ].join(" ");
  };

  const getIconClasses = (href: string) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    return isActive ? "text-white text-lg" : "text-principal text-lg";
  };

  const dashboardItem = navItems[0];
  const isDashboardActive = pathname === dashboardItem.href;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 text-tertiary flex justify-between items-center">
        <h1 className="text-xl font-bold font-title">SchoolFlow</h1>
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <FaTimes className="text-gray-600" />
        </button>
      </div>

      {/* Dashboard */}
      <div className="p-3 border-b border-gray-200">
        <Link
          href={dashboardItem.href}
          className={`flex items-center gap-3 font-medium p-2 rounded-lg transition ${
            isDashboardActive ? "text-white bg-principal" : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <FaUserGraduate
            className={isDashboardActive ? "text-white text-lg" : "text-principal text-lg"}
          />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Menu académique */}
      <div className="flex-1 overflow-y-auto border-b border-gray-200 p-4 space-y-2">
        <h3 className="font-title text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Académique
        </h3>

        {navItems
          .filter((i) => i.category === "ACADÉMIQUE")
          .map((item, idx) => (
            <Link key={idx} href={item.href} className={getLinkClasses(item.href)}>
              {React.cloneElement(item.icon, { className: getIconClasses(item.href) })}
              <span>{item.label}</span>
            </Link>
          ))}
      </div>

      {/* Section accordéon */}
      <div className="border-t border-gray-100">
        <button
          onClick={() => setIsProfileExpanded(!isProfileExpanded)}
          className="w-full p-3 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-principal text-white flex items-center justify-center font-semibold">
                {initials}
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-700">{studentName}</div>
                <div className="text-xs text-gray-500">Élève</div>
              </div>
            </div>
            <FaChevronDown className={`transform transition-transform ${isProfileExpanded ? 'rotate-180' : ''} text-gray-400`} />
          </div>
        </button>
        
        {isProfileExpanded && (
          <div className="px-3 pb-3 space-y-1">
            <Link 
              href="/dashboard/student/profile" 
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
              onClick={() => setIsProfileExpanded(false)}
            >
              <FaUser className="text-gray-600" />
              <span>Mon Profil</span>
            </Link>
            <Link 
              href="/dashboard/student/settings" 
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
              onClick={() => setIsProfileExpanded(false)}
            >
              <FaCog className="text-gray-600" />
              <span>Paramètres</span>
            </Link>
            <Link 
              href="/auth/logout" 
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
              onClick={() => setIsProfileExpanded(false)}
            >
              <FaSignOutAlt />
              <span>Déconnexion</span>
            </Link>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <button
        id="hamburger-button"
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200"
      >
        <FaBars className="text-principal text-lg" />
      </button>

      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" />
      )}

      <div className="hidden lg:flex lg:w-64 lg:bg-white lg:border-r lg:border-gray-200 lg:h-screen lg:flex-col">
        {sidebarContent}
      </div>

      <div
        id="student-sidebar"
        className={`
          lg:hidden fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 
          transform transition-transform duration-300 ease-in-out z-50
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </div>
    </>
  );
};

export default SidebarStudent;