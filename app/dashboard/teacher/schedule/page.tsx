// app/teacher/schedule/page.tsx
"use client";

import React, { useState } from "react";
import { FaCalendarAlt, FaClock, FaChalkboardTeacher, FaDownload, FaUser } from "react-icons/fa";

export default function TeacherSchedulePage() {
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedDay, setSelectedDay] = useState("all");

  // Données respectant vos contraintes - TD uniquement le samedi
  const teacherSchedule = {
    teacher: "Monsieur Diallo",
    subject: "Mathématiques",
    classes: ["Terminale S1", "Première S2", "Seconde C"],
    weeklyHours: 14,
    maxHours: 18,
    
    // Emploi du temps fixe - même pour toutes les semaines
    schedule: {
      "Terminale S1": [ // Cours très important - 3 fois/semaine (6h)
        { day: "LUNDI", start: "08:00", end: "10:00", classroom: "Salle 301", type: "Cours" },
        { day: "MERCREDI", start: "10:00", end: "12:00", classroom: "Salle 301", type: "Cours" },
        { day: "SAMEDI", start: "08:00", end: "10:00", classroom: "Salle 301", type: "TD" } // TD le samedi
      ],
      "Première S2": [ // Cours important - 2 fois/semaine (4h)
        { day: "MARDI", start: "08:00", end: "10:00", classroom: "Salle 205", type: "Cours" },
        { day: "SAMEDI", start: "10:00", end: "12:00", classroom: "Salle 205", type: "TD" } // TD le samedi
      ],
      "Seconde C": [ // Cours important - 2 fois/semaine (4h)
        { day: "LUNDI", start: "16:00", end: "18:00", classroom: "Salle 102", type: "Cours" },
        { day: "SAMEDI", start: "14:00", end: "16:00", classroom: "Salle 102", type: "TD" } // TD le samedi
      ]
    }
  };

  // Jours de la semaine
  const days = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
  
  // Créneau horaires standards
  const timeSlots = [
    "08:00-10:00", "10:00-12:00", "12:00-14:00", 
    "14:00-16:00", "16:00-18:00", "18:00-20:00"
  ];

  // Fonction pour obtenir la couleur selon le type de cours
  const getTypeColor = (type: string) => {
    switch (type) {
      case "TD": return "bg-green-100 border-green-300 text-green-800";
      case "Cours": return "bg-blue-100 border-blue-300 text-blue-800";
      default: return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  // Récupérer tous les cours du professeur avec filtres
  const getAllTeacherClasses = () => {
    const allClasses = [];
    for (const [className, schedules] of Object.entries(teacherSchedule.schedule)) {
      // Filtre par classe
      if (selectedClass === "all" || selectedClass === className) {
        for (const schedule of schedules) {
          // Filtre par jour
          if (selectedDay === "all" || selectedDay === schedule.day) {
            allClasses.push({ className, ...schedule });
          }
        }
      }
    }
    return allClasses.sort((a, b) => {
      const dayOrder = { "LUNDI": 1, "MARDI": 2, "MERCREDI": 3, "JEUDI": 4, "VENDREDI": 5, "SAMEDI": 6 };
      return dayOrder[a.day] - dayOrder[b.day] || a.start.localeCompare(b.start);
    });
  };

  // Fonction pour obtenir les cours d'un jour donné pour la grille
  const getClassesForDay = (day: string) => {
    const classes = [];
    
    for (const [className, schedules] of Object.entries(teacherSchedule.schedule)) {
      const classSchedule = schedules.find(s => s.day === day);
      if (classSchedule) {
        if (selectedClass === "all" || selectedClass === className) {
          classes.push({
            className,
            ...classSchedule
          });
        }
      }
    }
    
    return classes.sort((a, b) => a.start.localeCompare(b.start));
  };

  // Calculer le total des heures par jour
  const getDailyHours = (day: string) => {
    const classes = getClassesForDay(day);
    return classes.length * 2; // 2 heures par cours
  };

  // Obtenir le nombre total de cours filtrés
  const getFilteredCourseCount = () => {
    return getAllTeacherClasses().length;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      {/* Barre de défilement principale */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          
          {/* En-tête */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaCalendarAlt className="text-2xl text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Mon Emploi du Temps</h1>
                  <p className="text-gray-600">
                    {teacherSchedule.teacher} - {teacherSchedule.subject}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Emploi du temps fixe - Même horaire toutes les semaines</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Charge horaire hebdomadaire</p>
                <p className="text-2xl font-bold text-blue-600">
                  {teacherSchedule.weeklyHours}h
                </p>
              </div>
            </div>
          </div>

          {/* Filtres par Classe et Jour */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtre par Classe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par classe</label>
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes les classes</option>
                  {teacherSchedule.classes.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              {/* Filtre par Jour */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filtrer par jour</label>
                <select 
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous les jours</option>
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Bouton Export PDF */}
              <div className="flex items-end">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <FaDownload className="w-4 h-4" />
                  Exporter PDF
                </button>
              </div>
            </div>

            {/* Indicateur des filtres actifs */}
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Filtres actifs:</span>
                {selectedClass !== "all" && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    Classe: {selectedClass}
                  </span>
                )}
                {selectedDay !== "all" && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    Jour: {selectedDay}
                  </span>
                )}
                {(selectedClass === "all" && selectedDay === "all") && (
                  <span className="text-gray-500">Aucun filtre actif</span>
                )}
              </div>
              <div className="ml-auto text-gray-600">
                {getFilteredCourseCount()} cours trouvé(s)
              </div>
            </div>
          </div>

          {/* Mes jours et heures de cours - Vue détaillée avec filtres */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FaUser className="text-blue-600" />
                Mes Cours
                {selectedClass !== "all" && ` - ${selectedClass}`}
                {selectedDay !== "all" && ` - ${selectedDay}`}
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Jour</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Horaire</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Classe</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Type</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Durée</th>
                  </tr>
                </thead>
                <tbody>
                  {getAllTeacherClasses().map((course, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-gray-900">{course.day}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <FaClock className="text-gray-400 w-4 h-4" />
                          <span className="font-medium text-gray-900">
                            {course.start} - {course.end}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-gray-900">{course.className}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(course.type)}`}>
                          {course.type}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-medium text-blue-600">2 heures</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {getAllTeacherClasses().length === 0 && (
                <div className="text-center py-12">
                  <FaChalkboardTeacher className="text-5xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun cours trouvé</h3>
                  <p className="text-gray-500">
                    Aucun cours ne correspond aux filtres sélectionnés.
                    {selectedClass !== "all" || selectedDay !== "all" ? " Essayez de modifier vos filtres." : ""}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Emploi du temps hebdomadaire (seulement si pas de filtre par jour) */}
          {selectedDay === "all" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FaClock className="text-blue-600" />
                  Vue Hebdomadaire - Grille des Cours
                  {selectedClass !== "all" && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      - Classe: {selectedClass}
                    </span>
                  )}
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-32 p-4 text-sm font-semibold text-gray-900 text-center border-r border-gray-200">
                        Horaire
                      </th>
                      {days.map(day => (
                        <th key={day} className="p-4 text-sm font-semibold text-gray-900 text-center border-r border-gray-200 last:border-r-0">
                          {day}
                          <div className="text-xs font-normal text-gray-500 mt-1">
                            {getDailyHours(day)}h
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map(timeSlot => (
                      <tr key={timeSlot} className="border-b border-gray-100">
                        <td className="w-32 p-4 text-sm font-medium text-gray-900 text-center border-r border-gray-200 bg-gray-50">
                          {timeSlot}
                        </td>
                        {days.map(day => {
                          const classes = getClassesForDay(day);
                          const classInSlot = classes.find(cls => {
                            const [slotStart] = timeSlot.split('-');
                            return cls.start === slotStart;
                          });

                          return (
                            <td key={day} className="p-2 border-r border-gray-200 last:border-r-0 min-w-[200px] h-24 align-top">
                              {classInSlot && (
                                <div className={`p-3 rounded-lg border-2 h-full flex flex-col justify-between ${getTypeColor(classInSlot.type)}`}>
                                  <div>
                                    <div className="font-semibold text-sm mb-1">{classInSlot.className}</div>
                                    <div className="text-xs opacity-75 mb-2">
                                      {classInSlot.start} - {classInSlot.end}
                                    </div>
                                  </div>
                                  <div className="text-xs">
                                    <div className={`font-medium ${classInSlot.type === "TD" ? "text-green-700" : "text-blue-700"}`}>
                                      {classInSlot.type}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Résumé par jour (seulement si pas de filtre par jour) */}
          {selectedDay === "all" && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Répartition par Jour {selectedClass !== "all" ? `- ${selectedClass}` : ""}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {days.map(day => {
                  const dailyHours = getDailyHours(day);
                  const dailyClasses = getClassesForDay(day);
                  
                  return (
                    <div key={day} className={`text-center p-4 rounded-lg border-2 ${
                      dailyHours > 0 
                        ? "bg-blue-50 border-blue-200" 
                        : "bg-gray-50 border-gray-200"
                    }`}>
                      <p className="font-semibold text-gray-900 mb-2">{day}</p>
                      <p className="text-2xl font-bold text-blue-600 mb-1">{dailyHours}h</p>
                      <p className="text-sm text-gray-600">
                        {dailyClasses.length} cours
                      </p>
                      {dailyClasses.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {dailyClasses.map((cls, idx) => (
                            <div key={idx} className="text-xs text-gray-700">
                              {cls.start} - {cls.className}
                              <span className={`ml-1 ${cls.type === "TD" ? "text-green-600" : "text-blue-600"}`}>
                                ({cls.type})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Légende */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Légende</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
                <div>
                  <p className="font-medium text-gray-900">Cours Normaux</p>
                  <p className="text-sm text-gray-600">Séances de cours en semaine</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
                <div>
                  <p className="font-medium text-gray-900">Travaux Dirigés (TD)</p>
                  <p className="text-sm text-gray-600">Séances de TD le samedi uniquement</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}