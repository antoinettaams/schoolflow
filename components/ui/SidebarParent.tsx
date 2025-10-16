"use client";
import Link from "next/link";
import { FaChalkboardTeacher, FaCalendarAlt, FaFileInvoiceDollar, FaRegChartBar, FaClipboardList, FaComments, FaFileContract, FaCog, FaSignOutAlt, FaGraduationCap } from "react-icons/fa";

const SidebarParent = ({ parentName = "Marie Dupont" }) => {

  const initials = parentName.charAt(0).toUpperCase();

  const navItems = [
    // DASHBOARD
    {
      label: "Tableau de Bord",
      href: "/parent/dashboard",
      icon: <FaChalkboardTeacher className="text-principal text-lg" />,
    },

    // SUPERVISION (Élève(s) supervisé(s))

    {
      label: "Emplois du Temps",
      href: "/parent/schedules",
      icon: <FaCalendarAlt className="text-principal text-lg" />,
      category: "SUPERVISION",
    },

     {
      label: "Examens & Notes", 
      href: "/parent/exams", 
      icon: <FaRegChartBar className="text-principal text-lg" />,
      category: "SUPERVISION",
    },

    {
      label: "Assiduité",
      href: "/parent/attendance",
      icon: <FaClipboardList className="text-principal text-lg" />,
      category: "SUPERVISION",
    },
   
    {
      label: "Évènements Scolaires",
      href: "/parent/events", 
      icon: <FaGraduationCap className="text-principal text-lg" />,
      category: "SUPERVISION",
    },

    // ADMINISTRATION & COMMUNICATION
    {
      label: "Frais Scolaires",
      href: "/parent/finance",
      icon: <FaFileInvoiceDollar className="text-principal text-lg" />,
      category: "ADMINISTRATION",
    },

    {
    label: "Forum",
    href: "/teacher/forum", 
    icon: <FaComments className="text-principal text-lg" />,
    category: "ADMINISTRATION",
    },
  ];

  // Filtre les éléments 
  const dashboardItem = navItems.find((item) => !item.category);
  const supervisionItems = navItems.filter((item) => item.category === "SUPERVISION");
  const adminItems = navItems.filter((item) => item.category === "ADMINISTRATION");

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Nom du site */}
      <div className="p-4 border-b border-gray-200 text-tertiary">
        <h1 className="text-xl font-bold font-title">SchoolFlow</h1>
      </div>

      {/* Section Dashboard */}
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

      {/*. Menus de Navigation (SUPERVISION & ADMINISTRATION) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* SUPERVISION */}
        <nav className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Supervision
          </h3>
          {supervisionItems.map((item, index) => (
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

        {/* ADMINISTRATION */}
        <nav className="space-y-2 pt-4 border-t border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Administration
          </h3>
          {adminItems.map((item, index) => (
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
          href="/parent/settings"
          className="flex items-center gap-3 text-gray-700 font-medium hover:bg-gray-100 p-2 rounded-lg transition"
        >
          <FaCog className="text-principal text-lg" />
          <span>Paramètres du Compte</span>
        </Link>
        
        {/* Profil & Déconnexion */}
        <div className="p-3 flex items-center justify-between border-t border-gray-100 mt-2">
          {/* Informations Utilisateur */}
          <Link href="/parent/settings/profile" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="h-9 w-9 rounded-full bg-principal text-white flex items-center justify-center font-semibold flex-shrink-0">
              {initials}
            </div>
            <span className="font-medium text-gray-700 truncate">{parentName}</span>
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

export default SidebarParent;