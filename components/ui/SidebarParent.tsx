"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaUsers,
  FaCalendarAlt,
  FaFileInvoiceDollar,
  FaRegChartBar,
  FaClipboardList,
  FaComments,
  FaCog,
  FaSignOutAlt,
  FaGraduationCap,
  FaBars,
  FaUser,
  FaFileAlt,
  FaChevronDown,
} from "react-icons/fa";

const SidebarParent = ({ parentName = "Marie Dupont" }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const initials = parentName.charAt(0).toUpperCase();

  // --- Fonction utilitaire pour les liens actifs ---
  const getLinkClasses = (href: string) => {
    const isActive =
      pathname === href ||
      (href !== "/dashboard/parent" && pathname.startsWith(href));

    return [
      "flex items-center gap-3 font-medium p-2 rounded-lg transition",
      isActive ? "text-white bg-principal font-semibold" : "text-gray-700 hover:bg-gray-100",
    ].join(" ");
  };

  const getIconClasses = (href: string) => {
    const isActive =
      pathname === href ||
      (href !== "/dashboard/parent" && pathname.startsWith(href));
    return isActive ? "text-white text-lg" : "text-principal text-lg";
  };

  // --- Navigation ---
  const navItems = [
    {
      label: "Tableau de Bord",
      href: "/dashboard/parent",
      icon: <FaUsers />,
    },
    {
      label: "Emplois du Temps",
      href: "/dashboard/parent/schedules",
      icon: <FaCalendarAlt />,
      category: "SUPERVISION",
    },
    {
      label: "Examens & Notes",
      href: "/dashboard/parent/exams",
      icon: <FaRegChartBar />,
      category: "SUPERVISION",
    },
    {
      label: "Assiduité",
      href: "/dashboard/parent/attendance",
      icon: <FaClipboardList />,
      category: "SUPERVISION",
    },
    {
      label: "Évènements Scolaires",
      href: "/dashboard/parent/events",
      icon: <FaGraduationCap />,
      category: "SUPERVISION",
    },
    {
      label: "Bulletins",
      href: "/dashboard/parent/grades",
      icon: <FaFileAlt />,
      category: "SUPERVISION",
    },
    {
      label: "Frais Scolaires",
      href: "/dashboard/parent/finance",
      icon: <FaFileInvoiceDollar />,
      category: "ADMINISTRATION",
    },
    {
      label: "Forum",
      href: "/dashboard/parent/forum",
      icon: <FaComments />,
      category: "ADMINISTRATION",
    },
  ];

  // --- Organisation des menus ---
  const dashboardItem = navItems.find((i) => !i.category);
  const supervisionItems = navItems.filter((i) => i.category === "SUPERVISION");
  const adminItems = navItems.filter((i) => i.category === "ADMINISTRATION");

  const profileOptions = [
    { label: "Profil", icon: <FaUser className="text-gray-600" />, href: "/dashboard/parent/profile" },
    { label: "Paramètres", icon: <FaCog className="text-gray-600" />, href: "/dashboard/parent/settings" },
    { label: "Déconnexion", icon: <FaSignOutAlt className="text-red-500" />, href: "/auth/logout" },
  ];

  // Contenu de la sidebar
  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 text-tertiary flex justify-between items-center">
        <h1 className="text-xl font-bold font-title">SchoolFlow</h1>
        {/* Bouton fermer pour mobile */}
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <FaUsers className="text-gray-600" />
        </button>
      </div>

      {/* Dashboard */}
      {dashboardItem && (
        <div className="p-3 border-b border-gray-200">
          <Link href={dashboardItem.href} className={getLinkClasses(dashboardItem.href)}>
            {React.cloneElement(dashboardItem.icon, { className: getIconClasses(dashboardItem.href) })}
            <span>{dashboardItem.label}</span>
          </Link>
        </div>
      )}

      {/* Menus SUPERVISION */}
      <div className="flex-1 overflow-y-auto border-b border-gray-200">
        <div className="p-4 space-y-2">
          <h3 className="font-title text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Supervision
          </h3>
          {supervisionItems.map((item, index) => (
            <Link key={index} href={item.href} className={getLinkClasses(item.href)}>
              {React.cloneElement(item.icon, { className: getIconClasses(item.href) })}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Menus ADMINISTRATION */}
        <div className="p-4 space-y-2 border-t border-gray-100">
          <h3 className="font-title text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Administration
          </h3>
          {adminItems.map((item, index) => (
            <Link key={index} href={item.href} className={getLinkClasses(item.href)}>
              {React.cloneElement(item.icon, { className: getIconClasses(item.href) })}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Section accordéon pour le profil */}
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
                <div className="font-medium text-gray-700">{parentName}</div>
                <div className="text-xs text-gray-500">Parent</div>
              </div>
            </div>
            <FaChevronDown className={`transform transition-transform ${isProfileExpanded ? 'rotate-180' : ''} text-gray-400`} />
          </div>
        </button>
        
        {isProfileExpanded && (
          <div className="px-3 pb-3 space-y-1">
            <Link 
              href="/dashboard/parent/profile" 
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
              onClick={() => setIsProfileExpanded(false)}
            >
              <FaUser className="text-gray-600" />
              <span>Mon Profil</span>
            </Link>
            <Link 
              href="/dashboard/parent/settings" 
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
      {/* Bouton Hamburger pour mobile */}
      <button
        id="parent-hamburger-button"
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200"
      >
        <FaBars className="text-principal text-lg" />
      </button>

      {/* Overlay pour mobile */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" />
      )}

      {/* Sidebar pour desktop */}
      <div className="hidden lg:flex lg:w-64 lg:bg-white lg:border-r lg:border-gray-200 lg:h-screen lg:flex-col">
        {sidebarContent}
      </div>

      {/* Sidebar pour mobile */}
      <div
        id="parent-sidebar"
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

export default SidebarParent;