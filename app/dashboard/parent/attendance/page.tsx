// app/parent/attendance/page.tsx
"use client";

import React, { useState } from "react";
import { FaCalendarTimes, FaCheck, FaTimes, FaExclamationTriangle, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function ParentAttendancePage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const router = useRouter();

  // Données d'assiduité simulées
  const attendanceData = [
    { date: "15/12/2024", day: "Lundi", subject: "Mathématiques", time: "08:00-09:30", teacher: "M. Martin", status: "absent", justified: false, reason: "" },
    { date: "12/12/2024", day: "Vendredi", subject: "Physique-Chimie", time: "10:00-11:30", teacher: "Mme. Dubois", status: "present", justified: true, reason: "" },
    { date: "10/12/2024", day: "Mercredi", subject: "Histoire-Géographie", time: "13:30-15:00", teacher: "Mme. Bernard", status: "absent", justified: true, reason: "Maladie avec certificat médical" },
    { date: "08/12/2024", day: "Lundi", subject: "Français", time: "15:30-17:00", teacher: "M. Leroy", status: "present", justified: true, reason: "" },
    { date: "05/12/2024", day: "Vendredi", subject: "Anglais", time: "09:00-10:30", teacher: "Mme. Johnson", status: "absent", justified: false, reason: "" },
    { date: "03/12/2024", day: "Mercredi", subject: "SVT", time: "14:00-15:30", teacher: "M. Petit", status: "present", justified: true, reason: "" },
    { date: "28/11/2024", day: "Jeudi", subject: "Philosophie", time: "16:00-17:30", teacher: "M. Moreau", status: "absent", justified: true, reason: "Rendez-vous médical" },
  ];

  const periods = [
    { id: "week", name: "Cette semaine" },
    { id: "month", name: "Ce mois" },
    { id: "semester", name: "Ce semestre" }
  ];

  // Statistiques
  const stats = {
    totalClasses: attendanceData.length,
    present: attendanceData.filter(item => item.status === "present").length,
    absent: attendanceData.filter(item => item.status === "absent").length,
    justifiedAbsences: attendanceData.filter(item => item.status === "absent" && item.justified).length,
    unjustifiedAbsences: attendanceData.filter(item => item.status === "absent" && !item.justified).length,
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <FaSort className="text-gray-400" />;
    return sortDirection === "asc" ? <FaSortUp className="text-blue-600" /> : <FaSortDown className="text-blue-600" />;
  };

  // Trier les données
  const sortedData = [...attendanceData].sort((a, b) => {
    let aValue: string | Date = a[sortField as keyof typeof a] as string;
    let bValue: string | Date = b[sortField as keyof typeof b] as string;

    if (sortField === "date") {
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = new Date(aValue.split('/').reverse().join('-'));
        bValue = new Date(bValue.split('/').reverse().join('-'));
      }
    } else {
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-6xl mx-auto">
          {/* Grand titre */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Emploi du Temps</h1>
            <p className="text-gray-600 mt-1">
              Élève : <span className="font-semibold">Jean Dupont - Terminale S</span>
            </p>
          </div>

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FaCalendarTimes className="text-blue-600 text-xl" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Taux de Présence</h3>
              <p className="text-3xl font-bold text-blue-600">
                {Math.round((stats.present / stats.totalClasses) * 100)}%
              </p>
              <p className="text-sm text-gray-500 mt-1">{stats.present}/{stats.totalClasses} cours</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Absences Justifiées</h3>
              <p className="text-3xl font-bold text-green-600">{stats.justifiedAbsences}</p>
              <p className="text-sm text-gray-500 mt-1">Avec motif</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Absences Non Justifiées</h3>
              <p className="text-3xl font-bold text-red-600">{stats.unjustifiedAbsences}</p>
              <p className="text-sm text-gray-500 mt-1">Sans motif</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Total Absences</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.absent}</p>
              <p className="text-sm text-gray-500 mt-1">Toutes absences</p>
            </div>
          </div>

          {/* Sélecteur de période */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 justify-center">
            {periods.map(period => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap min-w-[160px] text-center border ${
                  selectedPeriod === period.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                }`}
              >
                {period.name}
              </button>
            ))}
          </div>

          {/* Tableau d'assiduité */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FaCalendarTimes className="text-blue-600" />
                  Détail de l'Assiduité
                </h2>
                <div className="text-sm text-gray-500">
                  {sortedData.length} cours enregistré(s)
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th 
                        className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("date")}
                      >
                        <div className="flex items-center gap-2">
                          Date
                          {getSortIcon("date")}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort("subject")}
                      >
                        <div className="flex items-center gap-2">
                          Cours
                          {getSortIcon("subject")}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Horaire</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Professeur</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Statut</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Motif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900">{item.date}</div>
                          <div className="text-sm text-gray-500">{item.day}</div>
                        </td>
                        <td className="py-4 px-4 font-medium text-gray-900">{item.subject}</td>
                        <td className="py-4 px-4 text-gray-700">{item.time}</td>
                        <td className="py-4 px-4 text-gray-700">{item.teacher}</td>
                        <td className="py-4 px-4">
                          {item.status === "present" ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <FaCheck className="text-green-500" />
                              <span className="font-medium">Présent</span>
                            </div>
                          ) : item.justified ? (
                            <div className="flex items-center gap-2 text-orange-600">
                              <FaExclamationTriangle className="text-orange-500" />
                              <span className="font-medium">Absent justifié</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-600">
                              <FaTimes className="text-red-500" />
                              <span className="font-medium">Absent non justifié</span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-700">
                          {item.reason ? (
                            <span className="italic">{item.reason}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {sortedData.length === 0 && (
                <div className="text-center py-12">
                  <FaCalendarTimes className="text-5xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucune donnée d'assiduité
                  </h3>
                  <p className="text-gray-500">
                    Aucune information d'assiduité n'est disponible pour cette période.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Légende */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">Légende :</h3>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <FaCheck className="text-green-500" />
                <span className="text-blue-800">Présent en cours</span>
              </div>
              <div className="flex items-center gap-2">
                <FaExclamationTriangle className="text-orange-500" />
                <span className="text-blue-800">Absence justifiée (avec motif valable)</span>
              </div>
              <div className="flex items-center gap-2">
                <FaTimes className="text-red-500" />
                <span className="text-blue-800">Absence non justifiée (sans motif)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
