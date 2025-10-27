"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  FaTachometerAlt,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaClipboardList,
  FaLayerGroup,
  FaChartLine,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUser,
  FaChevronDown,
  FaCalendarAlt,
  FaProjectDiagram,
  FaExclamationTriangle,
  FaBell, // Icône notifications
  FaCalendarCheck, // Icône événements
  FaFileSignature, // Icône notes d'examens
} from "react-icons/fa";

import { Button } from "@/components/ui/button";

const SidebarCenseur = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  useEffect(() => setIsMounted(true), []);
  useEffect(() => setIsMobileOpen(false), [pathname]);

  const userName = user ? `${user.firstName} ${user.lastName}` : "Censeur";
  const userInitials = user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}` : "C";

  const getLinkClasses = (href: string, exact = false) => {
    const base = "flex items-center gap-2 text-sm font-medium p-2 rounded-md transition";
    if (!isMounted) return `${base} text-gray-700`;
    const isActive = exact ? pathname === href : pathname.startsWith(href);
    return isActive ? `${base} text-white bg-principal font-semibold` : `${base} text-gray-700 hover:bg-gray-100`;
  };

  const getIconClasses = (href: string, exact = false) => {
    if (!isMounted) return "text-principal text-base";
    const isActive = exact ? pathname === href : pathname.startsWith(href);
    return isActive ? "text-white text-base" : "text-principal text-base";
  };

  const navItems = [
    { label: "Tableau de Bord", href: "/dashboard/censor", icon: <FaTachometerAlt /> },
    { label: "Vagues de Formation", href: "/dashboard/censor/vagues", icon: <FaLayerGroup />, category: "ORGANISATION PÉDAGOGIQUE" },
    { label: "Filières & Modules", href: "/dashboard/censor/filieres", icon: <FaProjectDiagram />, category: "ORGANISATION PÉDAGOGIQUE" },
    { label: "Planning & Assignation", href: "/dashboard/censor/planning", icon: <FaChalkboardTeacher />, category: "ORGANISATION PÉDAGOGIQUE" },
    { label: "Emplois du Temps", href: "/dashboard/censor/schedules", icon: <FaCalendarAlt />, category: "ORGANISATION PÉDAGOGIQUE" },
    
    // NOUVEAUX MENUS AJOUTÉS
    { label: "Gestion des notes", href: "/dashboard/censor/notes-examens", icon: <FaFileSignature />, category: "ÉVALUATION" },
    { label: "Événements Scolaires", href: "/dashboard/censor/events", icon: <FaCalendarCheck />, category: "ÉVÉNEMENTS" },
    
    { label: "Absences", href: "/dashboard/censor/absences", icon: <FaUserGraduate />, category: "SURVEILLANCE" },
    { label: "Statistiques", href: "/dashboard/censor/statistiques", icon: <FaChartLine />, category: "ANALYSE" },
    { label: "Rapports Hebdomadaires", href: "/dashboard/censor/rapports", icon: <FaClipboardList />, category: "ANALYSE" },
  ];

  const groupedItems = {
    "ORGANISATION PÉDAGOGIQUE": navItems.filter(i => i.category === "ORGANISATION PÉDAGOGIQUE"),
    "ÉVALUATION": navItems.filter(i => i.category === "ÉVALUATION"),
    "ÉVÉNEMENTS": navItems.filter(i => i.category === "ÉVÉNEMENTS"),
    "SURVEILLANCE": navItems.filter(i => i.category === "SURVEILLANCE"),
    "ANALYSE": navItems.filter(i => i.category === "ANALYSE"),
  };

  const dashboardItem = navItems.find(i => !i.category);

  const handleProfileClick = () => setIsProfileModalOpen(!isProfileModalOpen);
  const handleCloseModal = () => setIsProfileModalOpen(false);
  const handleLogoutClick = () => { setIsProfileModalOpen(false); setIsLogoutModalOpen(true); };
  const handleConfirmLogout = () => signOut({ redirectUrl: "/auth/signin" });
  const handleCancelLogout = () => setIsLogoutModalOpen(false);

  if (!isLoaded) {
    return (
      <>
        <Button variant="outline" onClick={() => setIsMobileOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 bg-white border shadow-sm">
          <FaBars className="text-principal" />
        </Button>

        <aside className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50 lg:translate-x-0 -translate-x-full">
          <div className="p-3 border-b border-gray-200">
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex-1 p-3 space-y-2">
            {[...Array(6)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse"></div>)}
          </div>
          <div className="p-3 border-t border-gray-200">
            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </aside>

        <div className="hidden lg:block lg:w-64 flex-shrink-0" />
      </>
    );
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsMobileOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 bg-white border shadow-sm">
        <FaBars className="text-principal" />
      </Button>

      {isMobileOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileOpen(false)} />}

      <aside className={`fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="p-3 border-b border-gray-200 flex justify-between items-center text-tertiary">
          <h1 className="text-lg font-bold text-principal">SchoolFlow</h1>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)} className="lg:hidden">
            <FaTimes className="text-gray-600" />
          </Button>
        </div>

        {dashboardItem && (
          <div className="p-3 border-b border-gray-200">
            <Link href={dashboardItem.href} className={getLinkClasses(dashboardItem.href, true)}>
              {React.cloneElement(dashboardItem.icon, { className: getIconClasses(dashboardItem.href, true) })}
              <span>{dashboardItem.label}</span>
            </Link>
          </div>
        )}

        <div className="flex-1 overflow-y-auto border-b border-gray-200 text-sm">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="p-3 space-y-1 border-t border-gray-100">
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{category}</h3>
              {items.map((item, index) => (
                <Link key={index} href={item.href} className={getLinkClasses(item.href)}>
                  {React.cloneElement(item.icon, { className: getIconClasses(item.href) })}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-auto border-t border-gray-100 p-3 relative">
          <Button variant="ghost" onClick={handleProfileClick} className="w-full flex items-center gap-2 text-sm justify-between hover:bg-gray-50">
            <div className="flex items-center gap-2">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt={userName} className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-principal text-white flex items-center justify-center text-xs font-medium">{userInitials}</div>
              )}
              <div className="text-left leading-tight">
                <div className="font-medium text-gray-700 text-[13px] truncate max-w-[120px]">{userName}</div>
                <div className="text-[10px] text-gray-500">Censeur</div>
              </div>
            </div>
            <FaChevronDown className={`text-gray-400 text-sm transition-transform duration-200 ${isProfileModalOpen ? "rotate-180" : ""}`} />
          </Button>

          {isProfileModalOpen && (
            <>
              <div className="fixed inset-0 bg-black bg-opacity-10 z-40" onClick={handleCloseModal} />
              <div className="absolute bottom-14 left-3 right-3 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                <div className="p-2 space-y-1">
                  <Link href="/dashboard/censeur/profile" className="flex items-center gap-2 text-xs p-2 rounded-md hover:bg-gray-100 text-gray-700 transition-colors font-medium" onClick={handleCloseModal}>
                    <FaUser className="text-gray-600 text-sm" />
                    <span>Mon Profil</span>
                  </Link>

                  {/* NOUVEAU MENU NOTIFICATIONS AJOUTÉ */}
                  <Link href="/dashboard/censeur/notifications" className="flex items-center gap-2 text-xs p-2 rounded-md hover:bg-gray-100 text-gray-700 transition-colors font-medium" onClick={handleCloseModal}>
                    <FaBell className="text-gray-600 text-sm" />
                    <span>Notifications</span>
                  </Link>

                  <Link href="/dashboard/censeur/settings" className="flex items-center gap-2 text-xs p-2 rounded-md hover:bg-gray-100 text-gray-700 transition-colors font-medium" onClick={handleCloseModal}>
                    <FaCog className="text-gray-600 text-sm" />
                    <span>Paramètres</span>
                  </Link>
                  <button onClick={handleLogoutClick} className="flex items-center gap-2 text-xs p-2 rounded-md hover:bg-red-50 text-red-600 transition-colors font-medium w-full text-left">
                    <FaSignOutAlt className="text-sm" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>

      <div className="hidden lg:block lg:w-64 flex-shrink-0" />

      {isLogoutModalOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]" onClick={handleCancelLogout} />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl z-[70] w-80 max-w-[90vw]">
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FaExclamationTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Confirmer la déconnexion</h3>
              <p className="text-gray-600 text-sm text-center mb-6">Êtes-vous sûr de vouloir vous déconnecter de votre compte ?</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancelLogout} className="flex-1 border-gray-300 hover:bg-gray-50">Annuler</Button>
                <Button onClick={handleConfirmLogout} className="flex-1 bg-red-600 hover:bg-red-700 text-white">Se déconnecter</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SidebarCenseur;