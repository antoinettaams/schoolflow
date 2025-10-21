"use client";

import React, { useState } from "react";
import { FaCalendarAlt, FaClock } from "react-icons/fa";

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState("Lundi");

  const scheduleData: Record<string, { time: string; subject: string; teacher: string; type: string }[]> = {
    "Lundi": [
      { time: "08:00-09:30", subject: "Mathématiques", teacher: "M. Martin", type: "Cours" },
      { time: "10:00-11:30", subject: "Physique", teacher: "Mme. Dubois", type: "Cours" },
      { time: "13:30-15:00", subject: "Français", teacher: "M. Leroy", type: "Cours" },
      { time: "15:30-17:00", subject: "Histoire", teacher: "Mme. Bernard", type: "Cours" }
    ],
    "Mardi": [
      { time: "09:00-10:30", subject: "SVT", teacher: "M. Petit", type: "Cours" },
      { time: "11:00-12:30", subject: "Anglais", teacher: "Mme. Johnson", type: "Cours" }
    ],
    "Mercredi": [
      { time: "08:00-12:00", subject: "Projet Informatique", teacher: "M. Garcia", type: "Cours" }
    ],
    "Jeudi": [
      { time: "14:00-15:30", subject: "Philosophie", teacher: "M. Moreau", type: "Cours" },
      { time: "16:00-17:30", subject: "EPS", teacher: "M. Laurent", type: "Sport" }
    ],
    "Vendredi": [
      { time: "10:00-11:30", subject: "Mathématiques", teacher: "M. Martin", type: "Cours" },
      { time: "13:00-14:30", subject: "Chimie", teacher: "Mme. Robert", type: "Cours" }
    ]
  };

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

  return (
    <div className="flex-1 flex flex-col min-h-0 lg:pl-5 pt-20 lg:pt-6">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Emploi du Temps</h1>
          </div>

          {/* Sélecteur de jours */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            {days.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  selectedDay === day
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Liste des cours */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaCalendarAlt className="text-blue-600" />
                {selectedDay}
              </h2>
              
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {scheduleData[selectedDay]?.length ? (
                  scheduleData[selectedDay].map((course, index) => (
                    <div
                      key={index}
                      className="flex items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{course.subject}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            course.type === "Cours" ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                          }`}>
                            {course.type}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <FaClock className="text-blue-600" />
                            <span>{course.time}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">avec </span>
                            <span className="font-medium">{course.teacher}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" title="Cours à venir"></div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucun cours prévu ce jour
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
