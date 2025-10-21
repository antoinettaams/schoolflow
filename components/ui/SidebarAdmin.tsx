"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FaTachometerAlt, 
  FaUsers, 
  FaUserGraduate, 
  FaChalkboardTeacher,
  FaCalendarAlt,
  FaFileAlt,
  FaClipboardList,
  FaChartBar,
  FaCog,
  FaDatabase,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUser,
  FaChevronDown,
  FaSchool,
  FaBook,
  FaChartLine,
  FaShieldAlt,
  FaBell,
  FaMoneyBillWave,
  FaCreditCard,
  FaFileInvoiceDollar,
  FaCalculator,
  FaWhatsapp
} from "react-icons/fa";

const SidebarAdmin = ({ adminName = "Administrateur" }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Initiales pour l'avatar
  const initials = adminName.charAt(0).toUpperCase();

  // --- Fonction utilitaire pour les liens actifs ---
  const getLinkClasses = (href: string, exact = false) => {
    const isActive = exact ? pathname === href : pathname.startsWith(href);
    return [
      "flex items-center gap-3 font-medium p-2 rounded-lg transition",
      isActive ? "text-white bg-principal font-semibold" : "text-gray-700 hover:bg-gray-100",
    ].join(" ");
  };

  const getIconClasses = (href: string, exact = false) => {
    const isActive = exact ? pathname === href : pathname.startsWith(href);
    return isActive ? "text-white text-lg" : "text-principal text-lg";
  };

  const navItems = [
    // DASHBOARD
    {
      label: "Tableau de Bord",
      href: "/dashboard/admin",
      icon: <FaTachometerAlt />,
    },

    // GESTION DES UTILISATEURS
    {
      label: "Élèves",
      href: "/dashboard/admin/students",
      icon: <FaUserGraduate />,
      category: "UTILISATEURS",
    },
    {
      label: "Professeurs",
      href: "/dashboard/admin/teachers",
      icon: <FaChalkboardTeacher />,
      category: "UTILISATEURS",
    },
    {
      label: "Administrateurs",
      href: "/dashboard/admin/admins",
      icon: <FaShieldAlt />,
      category: "UTILISATEURS",
    },
    {
      label: "Parents",
      href: "/dashboard/admin/parents",
      icon: <FaUsers />,
      category: "UTILISATEURS",
    },

    // GESTION PÉDAGOGIQUE
    {
      label: "Classes & Niveaux",
      href: "/dashboard/admin/classes",
      icon: <FaSchool />,
      category: "PÉDAGOGIE",
    },
    {
      label: "Matières",
      href: "/dashboard/admin/subjects",
      icon: <FaBook />,
      category: "PÉDAGOGIE",
    },
    {
      label: "Emplois du Temps",
      href: "/dashboard/admin/schedules",
      icon: <FaCalendarAlt />,
      category: "PÉDAGOGIE",
    },
    // ← NOUVEAU : GROUPES WHATSAPP
    {
      label: "Groupes WhatsApp",
      href: "/dashboard/admin/whatsapp-groups",
      icon: <FaWhatsapp />,
      category: "PÉDAGOGIE",
    },

    // NOTES & ÉVALUATIONS
    {
      label: "Système de Notes",
      href: "/dashboard/admin/grading",
      icon: <FaFileAlt />,
      category: "NOTES",
    },
    {
      label: "Calcul des Moyennes",
      href: "/dashboard/admin/grades-calculation",
      icon: <FaCalculator />,
      category: "NOTES",
    },
    {
      label: "Bulletins",
      href: "/dashboard/admin/reports",
      icon: <FaClipboardList />,
      category: "NOTES",
    },

    // FINANCES & SCOLARITÉ
    {
      label: "Frais de Scolarité",
      href: "/dashboard/admin/tuition",
      icon: <FaMoneyBillWave />,
      category: "FINANCES",
    },
    {
      label: "Paiements",
      href: "/dashboard/admin/payments",
      icon: <FaCreditCard />,
      category: "FINANCES",
    },
    {
      label: "Facturation",
      href: "/dashboard/admin/invoices",
      icon: <FaFileInvoiceDollar />,
      category: "FINANCES",
    },

    // ANALYTICS & RAPPORTS
    {
      label: "Statistiques",
      href: "/dashboard/admin/analytics",
      icon: <FaChartLine />,
      category: "ANALYSE",
    },
    {
      label: "Rapports",
      href: "/dashboard/admin/reports",
      icon: <FaChartBar />,
      category: "ANALYSE",
    },

    // CONFIGURATION
    {
      label: "Paramètres",
      href: "/dashboard/admin/settings",
      icon: <FaCog />,
      category: "SYSTÈME",
    },
    {
      label: "Sauvegarde",
      href: "/dashboard/admin/backup",
      icon: <FaDatabase />,
      category: "SYSTÈME",
    },
    {
      label: "Notifications",
      href: "/dashboard/admin/notifications",
      icon: <FaBell />,
      category: "SYSTÈME",
    },
  ];

  // Filtre les éléments de navigation par catégorie
  const dashboardItem = navItems.find((item) => !item.category);
  const usersItems = navItems.filter((item) => item.category === "UTILISATEURS");
  const pedagogyItems = navItems.filter((item) => item.category === "PÉDAGOGIE");
  const notesItems = navItems.filter((item) => item.category === "NOTES");
  const financesItems = navItems.filter((item) => item.category === "FINANCES");
  const analyseItems = navItems.filter((item) => item.category === "ANALYSE");
  const systemeItems = navItems.filter((item) => item.category === "SYSTÈME");

  // Contenu de la sidebar
  const sidebarContent = (
    <>
      {/* Nom du site */}
      <div className="p-4 border-b border-gray-200 text-tertiary flex justify-between items-center">
        <h1 className="text-xl font-bold font-title">SchoolFlow</h1>
        {/* Bouton fermer pour mobile */}
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <FaTimes className="text-gray-600" />
        </button>
      </div>

      {/* Section Dashboard */}
      {dashboardItem && (
        <div className="p-3 border-b border-gray-200">
          <Link
            href={dashboardItem.href}
            className={getLinkClasses(dashboardItem.href, true)}
          >
            {React.cloneElement(dashboardItem.icon, { className: getIconClasses(dashboardItem.href, true) })}
            <span>{dashboardItem.label}</span>
          </Link>
        </div>
      )}

      {/* Menus de Navigation */}
      <div className="flex-1 overflow-y-auto border-b border-gray-200">
        
        {/* UTILISATEURS */}
        <div className="p-4 space-y-2">
          <h3 className="font-title text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Utilisateurs
          </h3>
          {usersItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={getLinkClasses(item.href)}
            >
              {React.cloneElement(item.icon, { className: getIconClasses(item.href) })}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* PÉDAGOGIE */}
        <div className="p-4 space-y-2 border-t border-gray-100">
          <h3 className="font-title text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Pédagogie
          </h3>
          {pedagogyItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={getLinkClasses(item.href)}
            >
              {React.cloneElement(item.icon, { className: getIconClasses(item.href) })}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* NOTES & ÉVALUATIONS */}
        <div className="p-4 space-y-2 border-t border-gray-100">
          <h3 className="font-title text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Notes & Évaluations
          </h3>
          {notesItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={getLinkClasses(item.href)}
            >
              {React.cloneElement(item.icon, { className: getIconClasses(item.href) })}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* FINANCES & SCOLARITÉ */}
        <div className="p-4 space-y-2 border-t border-gray-100">
          <h3 className="font-title text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Finances & Scolarité
          </h3>
          {financesItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={getLinkClasses(item.href)}
            >
              {React.cloneElement(item.icon, { className: getIconClasses(item.href) })}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* ANALYSE */}
        <div className="p-4 space-y-2 border-t border-gray-100">
          <h3 className="font-title text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Analyse
          </h3>
          {analyseItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={getLinkClasses(item.href)}
            >
              {React.cloneElement(item.icon, { className: getIconClasses(item.href) })}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* SYSTÈME */}
        <div className="p-4 space-y-2 border-t border-gray-100">
          <h3 className="font-title text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Système
          </h3>
          {systemeItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={getLinkClasses(item.href)}
            >
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
                <div className="font-medium text-gray-700">{adminName}</div>
                <div className="text-xs text-gray-500">Administrateur</div>
              </div>
            </div>
            <FaChevronDown className={`transform transition-transform ${isProfileExpanded ? 'rotate-180' : ''} text-gray-400`} />
          </div>
        </button>
        
        {isProfileExpanded && (
          <div className="px-3 pb-3 space-y-1">
            <Link 
              href="/dashboard/admin/profile" 
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
              onClick={() => setIsProfileExpanded(false)}
            >
              <FaUser className="text-gray-600" />
              <span>Mon Profil</span>
            </Link>
            <Link 
              href="/dashboard/admin/settings" 
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
        id="admin-hamburger-button"
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
        id="admin-sidebar"
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

export default SidebarAdmin;