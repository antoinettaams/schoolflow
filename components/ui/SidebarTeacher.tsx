"use client";
import Link from "next/link";
import { FaChalkboardTeacher, FaCalendarAlt, FaBookOpen, FaUserGraduate, FaFileAlt, FaClipboardList, FaComments, FaCog, FaSignOutAlt, FaTasks, FaRegChartBar } from "react-icons/fa";

const SidebarTeacher = ({ teacherName = "Monsieur Lebrun" }) => {

  const initials = teacherName.charAt(0).toUpperCase();

  const navItems = [
    // DASHBOARD
    {
      label: "Tableau de Bord",
      href: "/teacher/dashboard",
      icon: <FaChalkboardTeacher className="text-principal text-lg" />,
    },

    // GESTION PÉDAGOGIQUE
    {
      label: "Mes Classes",
      href: "/teacher/classes",
      icon: <FaUserGraduate className="text-principal text-lg" />,
      category: "PÉDAGOGIE",
    },
    {
      label: "Emploi du Temps",
      href: "/teacher/schedule",
      icon: <FaCalendarAlt className="text-principal text-lg" />,
      category: "PÉDAGOGIE",
    },
    {
      label: "Gestion des Notes",
      href: "/teacher/grades",
      icon: <FaFileAlt className="text-principal text-lg" />,
      category: "PÉDAGOGIE",
    },
    {
      label: "Dates d'Examens", 
      href: "/teacher/exams",
      icon: <FaRegChartBar className="text-principal text-lg" />, 
      category: "PÉDAGOGIE",
    },
    {
      label: "Devoirs & Exercices",
      href: "/teacher/homeworks",
      icon: <FaTasks className="text-principal text-lg" />,
      category: "PÉDAGOGIE",
    },
    {
      label: "Assiduité",
      href: "/teacher/attendance",
      icon: <FaClipboardList className="text-principal text-lg" />,
      category: "PÉDAGOGIE",
    },

    // COMMUNICATION & DOCUMENTS
    {
    label: "Forum",
    href: "/teacher/forum", 
    icon: <FaComments className="text-principal text-lg" />,
    category: "COMMUNICATION",
    },
  ];

  // Filtre les éléments de navigation par catégorie
  const dashboardItem = navItems.find((item) => !item.category);
  const pedagogyItems = navItems.filter((item) => item.category === "PÉDAGOGIE");
  const communicationItems = navItems.filter((item) => item.category === "COMMUNICATION");

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Nom du site */}
      <div className="p-4 border-b border-gray-200 text-tertiary">
        <h1 className="text-xl font-bold font-title">SchoolFlow</h1>
      </div>

      {/* Section Dashboard (Lien actif) */}
      {dashboardItem && (
        <div className="p-2 border-b border-gray-200">
          <Link
            href={dashboardItem.href}
            className="flex items-center gap-3 text-white font-semibold bg-principal p-2 rounded-lg transition"
          >
            {<FaChalkboardTeacher className="text-white text-lg" />} 
            <span>{dashboardItem.label}</span>
          </Link>
        </div>
      )}

      {/* Menus de Navigation (PÉDAGOGIE & COMMUNICATION) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* PÉDAGOGIE */}
        <nav className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Pédagogie
          </h3>
          {pedagogyItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="flex items-center gap-3 text-gray-700 font-medium hover:bg-gray-100 p-2 rounded-lg transition"
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* COMMUNICATION & DOCUMENTS */}
        <nav className="space-y-2 pt-4 border-t border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            ADMINISTRATION
          </h3>
          {communicationItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="flex items-center gap-3 text-gray-700 font-medium hover:bg-gray-100 p-2 rounded-lg transition"
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Paramètres & Profil en bas */}
      <div className="border-t border-gray-200 p-2">
        {/* Lien Paramètres du Compte */}
        <Link
          href="/teacher/settings"
          className="flex items-center gap-3 text-gray-700 font-medium hover:bg-gray-100 p-2 rounded-lg transition"
        >
          <FaCog className="text-principal text-lg" />
          <span>Paramètres du Compte</span>
        </Link>
        
        {/* Profil & Déconnexion */}
        <div className="p-3 flex items-center justify-between border-t border-gray-100 mt-2">
          {/* Informations Utilisateur */}
          <Link href="/teacher/settings/profile" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="h-9 w-9 rounded-full bg-principal text-white flex items-center justify-center font-semibold flex-shrink-0">
              {initials}
            </div>
            <span className="font-medium text-gray-700 truncate">{teacherName}</span>
          </Link>

          {/* Lien de Déconnexion */}
          <Link
            href="/auth/logout"
            className="text-red-500 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50"
            title="Déconnexion"
          >
            <FaSignOutAlt />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SidebarTeacher;