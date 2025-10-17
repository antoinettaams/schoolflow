"use client";
import Link from "next/link";
import { FaChalkboardTeacher, FaCalendarAlt, FaBookOpen, FaFileAlt, FaGraduationCap, FaClipboardList, FaCog, FaSignOutAlt } from "react-icons/fa";

const SidebarStudent = ({ studentName = "Antoinetta" }) => {
  const initials = studentName.charAt(0).toUpperCase();

  const navItems = [
    { label: "Tableau de Bord", href: "/student/dashboard", icon: <FaChalkboardTeacher className="text-principal text-lg" /> },
    { label: "Emploi du Temps", href: "/student/schedule", icon: <FaCalendarAlt className="text-principal text-lg" />, category: "ACADÉMIQUE" },
    { label: "Examens & Notes", href: "/student/exams", icon: <FaClipboardList className="text-principal text-lg" />, category: "ACADÉMIQUE" },
    { label: "Exercices", href: "/student/homeworks", icon: <FaBookOpen className="text-principal text-lg" />, category: "ACADÉMIQUE" },
    { label: "Évènements Scolaires", href: "/student/events", icon: <FaGraduationCap className="text-principal text-lg" />, category: "ACADÉMIQUE" },
    { label: "Bulletins", href: "/student/grades", icon: <FaFileAlt className="text-principal text-lg" />, category: "ACADÉMIQUE" },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-2 border-b border-gray-200 text-tertiary">
        <h1 className="text-xl font-bold font-title">SchoolFlow</h1>
      </div>

      <div className="p-2 border-b border-gray-200">
        <Link href="/student/dashboard" className="flex items-center gap-3 text-white font-medium bg-principal p-2 rounded-lg transition">
          <FaChalkboardTeacher className="text-white text-lg font-title" />
          <span>Dashboard</span>
        </Link>
      </div>

      <div className="flex-1 border-b border-gray-200 p-4 space-y-2">
        <h3 className="font-title text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Académique</h3>
        {navItems.filter(i => i.category === "ACADÉMIQUE").map((item, idx) => (
          <Link key={idx} href={item.href} className="flex items-center gap-3 text-gray-700 font-medium hover:bg-gray-100 p-2 rounded-lg transition">
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="border-b border-gray-200 p-3">
        <Link href="/student/settings/profile" className="flex items-center gap-3 text-gray-700 font-medium hover:bg-gray-100 p-2 rounded-lg transition">
          <FaCog className="text-principal text-lg" />
          <span>Paramètres du Compte</span>
        </Link>

        <div className="p-3 flex items-center justify-between border-t border-gray-100 mt-2">
          <Link href="/student/profile" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="h-9 w-9 rounded-full bg-principal text-white flex items-center justify-center font-semibold flex-shrink-0">
              {initials}
            </div>
            <span className="font-medium text-gray-700 truncate">{studentName}</span>
          </Link>

          <Link href="/auth/logout" className="text-red-500 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50" title="Déconnexion">
            <FaSignOutAlt />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SidebarStudent;
