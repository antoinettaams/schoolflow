// app/parent/grades/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { FaFileAlt, FaSort, FaSortUp, FaSortDown, FaCalendarAlt, FaClock } from "react-icons/fa";

// --- Types ---
interface Grade {
  subject: string;
  grade: number;
  coefficient: number;
  examType: string;
  teacher: string;
  date: string; // format "DD/MM/YYYY"
}

interface UpcomingExam {
  subject: string;
  type: string;
  date: string; // format "DD/MM/YYYY"
  time: string;
  location: string;
}

export default function ParentGradesPage() {
  const [sortField, setSortField] = useState<keyof Grade>("subject");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // --- Données mémoïsées ---
  const gradesData = useMemo((): Grade[] => [
    { subject: "Mathématiques", grade: 16.5, coefficient: 4, examType: "Devoir Surveillé", teacher: "M. Martin", date: "15/09/2024" },
    { subject: "Physique", grade: 14.0, coefficient: 3, examType: "Composition", teacher: "Mme. Dubois", date: "20/09/2024" },
    { subject: "Français", grade: 15.0, coefficient: 4, examType: "Interrogation", teacher: "M. Leroy", date: "25/09/2024" },
    { subject: "Histoire-Géographie", grade: 13.5, coefficient: 3, examType: "Devoir Surveillé", teacher: "Mme. Bernard", date: "30/09/2024" },
    { subject: "SVT", grade: 17.0, coefficient: 3, examType: "Composition", teacher: "M. Petit", date: "05/10/2024" },
    { subject: "Anglais", grade: 16.0, coefficient: 2, examType: "Interrogation", teacher: "Mme. Johnson", date: "10/10/2024" },
    { subject: "Philosophie", grade: 12.0, coefficient: 3, examType: "Interrogation", teacher: "M. Moreau", date: "15/10/2024" },
  ], []);

  const upcomingExams = useMemo((): UpcomingExam[] => [
    { subject: "Mathématiques", type: "Composition", date: "25/11/2024", time: "08:30-10:30", location: "Salle 301" },
    { subject: "Physique-Chimie", type: "Devoir Surveillé", date: "28/11/2024", time: "14:00-16:00", location: "Labo Physique" },
    { subject: "SVT", type: "Interrogation", date: "02/12/2024", time: "10:00-11:00", location: "Salle 205" },
    { subject: "Histoire-Géographie", type: "Composition", date: "05/12/2024", time: "09:00-11:00", location: "Salle 104" },
  ], []);

  // --- Fonctions utilitaires ---
  const handleSort = (field: keyof Grade) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: keyof Grade) => {
    if (sortField !== field) return <FaSort className="text-gray-400" />;
    return sortDirection === "asc" ? <FaSortUp className="text-blue-600" /> : <FaSortDown className="text-blue-600" />;
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 16) return "text-green-600 bg-green-100";
    if (grade >= 14) return "text-blue-600 bg-blue-100";
    if (grade >= 12) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getExamTypeColor = (examType: string) => {
    switch (examType) {
      case "Composition":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Devoir":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Interrogation":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Devoir Surveillé":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // --- Tri optimisé avec useMemo ---
  const sortedGrades = useMemo(() => {
    return [...gradesData].sort((a, b) => {
      let aValue: string | number | Date = a[sortField];
      let bValue: string | number | Date = b[sortField];

      if (sortField === "grade" || sortField === "coefficient") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (sortField === "date") {
        // Convertir la date en objet Date pour un tri correct
        const parseDate = (str: string) => {
          const [day, month, year] = str.split("/").map(Number);
          return new Date(year, month - 1, day);
        };
        aValue = parseDate(aValue as string);
        bValue = parseDate(bValue as string);
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
  }, [gradesData, sortField, sortDirection]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-6xl mx-auto">
          {/* Grand titre */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Examens & Notes</h1>
            <p className="text-gray-600 mt-1">
              Élève : <span className="font-semibold">Jean Dupont - Terminale S</span>
            </p>
          </div>

          {/* Section Résultats des Examens */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FaFileAlt className="text-blue-600" />
                  Résultats des Examens - Premier Semestre
                </h2>
                <div className="text-sm text-gray-500">
                  {sortedGrades.length} évaluation(s)
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {(["subject", "grade", "coefficient", "examType", "teacher", "date"] as (keyof Grade)[]).map((field) => (
                        <th
                          key={field}
                          className={`text-left py-3 px-4 font-semibold text-gray-900 ${field !== "teacher" ? "cursor-pointer hover:bg-gray-50" : ""}`}
                          onClick={field !== "teacher" ? () => handleSort(field) : undefined}
                        >
                          <div className="flex items-center gap-2">
                            {field === "subject" && "Matière"}
                            {field === "grade" && "Note"}
                            {field === "coefficient" && "Coefficient"}
                            {field === "examType" && "Type d'Examen"}
                            {field === "teacher" && "Professeur"}
                            {field === "date" && "Date"}
                            {field !== "teacher" && getSortIcon(field)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedGrades.map((grade, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 font-medium text-gray-900">{grade.subject}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(grade.grade)}`}>
                            {grade.grade}/20
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-700">{grade.coefficient}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getExamTypeColor(grade.examType)}`}>
                            {grade.examType}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-700">{grade.teacher}</td>
                        <td className="py-4 px-4 text-gray-700">{grade.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {sortedGrades.length === 0 && (
                  <div className="text-center py-12">
                    <FaFileAlt className="text-5xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Aucun examen disponible
                    </h3>
                    <p className="text-gray-500">
                      Aucun examen n&lsquo;a été enregistré pour ce semestre.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section Examens à Venir */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FaCalendarAlt className="text-orange-600" />
                  Examens à Venir
                </h2>
                <div className="text-sm text-gray-500">
                  {upcomingExams.length} examen(s) programmé(s)
                </div>
              </div>

              <div className="space-y-4">
                {upcomingExams.map((exam, index) => (
                  <div
                    key={index}
                    className="flex items-center p-4 border border-gray-100 rounded-lg hover:bg-orange-50 transition-colors group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{exam.subject}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getExamTypeColor(exam.type)}`}>
                          {exam.type}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FaCalendarAlt className="text-orange-600" />
                          <span>{exam.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaClock className="text-orange-600" />
                          <span>{exam.time}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Lieu : </span>
                          <span className="font-medium">{exam.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" title="Examen à venir"></div>
                  </div>
                ))}
              </div>

              {upcomingExams.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucun examen à venir pour le moment
                </div>
              )}
            </div>
          </div>

          {/* Légende des types d'examens */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">Légende des types d&lsquo;examens :</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              {["Composition", "Interrogation", "Devoir Surveillé"].map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getExamTypeColor(type)}`}>
                    {type}
                  </span>
                  <span className="text-blue-800">
                    {type === "Composition" && "Examen complet et formel"}
                    {type === "Interrogation" && "Contrôle court en classe"}
                    {type === "Devoir Surveillé" && "Examen surveillé en temps limité"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}