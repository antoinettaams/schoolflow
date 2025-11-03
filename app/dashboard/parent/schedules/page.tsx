// app/dashboard/parent/schedules/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FaCalendarAlt, FaClock, FaLaptopCode, FaDatabase, FaMobile, FaPalette, FaCode, FaServer, FaSync } from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentData {
  studentName: string;
  studentClass: string;
  studentStatus: "inscrit" | "non-inscrit";
  filiere: string;
  vague: string;
}

interface Course {
  time: string;
  subject: string;
  teacher: string;
  type: string;
  icon: React.ReactNode;
}

export default function ParentSchedulesPage() {
  const { isLoaded, isSignedIn } = useUser(); 
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState("Lundi");
  const [isLoading, setIsLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentData | null>(null);

  // Données d'emploi du temps
  const scheduleData: Record<string, Course[]> = {
    "Lundi": [
      { 
        time: "08:00-09:30", 
        subject: "Programmation Web Frontend", 
        teacher: "M. Martin", 
        type: "Cours",
        icon: <FaCode className="text-blue-600" />
      },
      { 
        time: "10:00-11:30", 
        subject: "Base de Données", 
        teacher: "Mme. Dubois", 
        type: "Cours",
        icon: <FaDatabase className="text-green-600" />
      },
      { 
        time: "13:30-15:00", 
        subject: "UI/UX Design", 
        teacher: "M. Leroy", 
        type: "Cours",
        icon: <FaPalette className="text-purple-600" />
      },
      { 
        time: "15:30-17:00", 
        subject: "JavaScript Avancé", 
        teacher: "Mme. Bernard", 
        type: "Cours",
        icon: <FaLaptopCode className="text-yellow-600" />
      }
    ],
    "Mardi": [
      { 
        time: "09:00-10:30", 
        subject: "Programmation Web Frontend", 
        teacher: "M. Martin", 
        type: "Cours",
        icon: <FaCode className="text-blue-600" />
      },
      { 
        time: "11:00-12:30", 
        subject: "Développement Mobile", 
        teacher: "Mme. Johnson", 
        type: "Cours",
        icon: <FaMobile className="text-indigo-600" />
      },
      { 
        time: "14:00-15:30", 
        subject: "Base de Données", 
        teacher: "Mme. Dubois", 
        type: "TP",
        icon: <FaDatabase className="text-green-600" />
      }
    ],
    "Mercredi": [
      { 
        time: "08:00-10:00", 
        subject: "Projet Full Stack", 
        teacher: "M. Garcia", 
        type: "Projet",
        icon: <FaServer className="text-red-600" />
      },
      { 
        time: "10:30-12:30", 
        subject: "JavaScript Avancé", 
        teacher: "Mme. Bernard", 
        type: "TP",
        icon: <FaLaptopCode className="text-yellow-600" />
      },
      { 
        time: "14:00-17:00", 
        subject: "Développement Mobile", 
        teacher: "Mme. Johnson", 
        type: "TP",
        icon: <FaMobile className="text-indigo-600" />
      }
    ],
    "Jeudi": [
      { 
        time: "09:00-10:30", 
        subject: "Programmation Web Frontend", 
        teacher: "M. Martin", 
        type: "Cours",
        icon: <FaCode className="text-blue-600" />
      },
      { 
        time: "11:00-12:30", 
        subject: "UI/UX Design", 
        teacher: "M. Leroy", 
        type: "TP",
        icon: <FaPalette className="text-purple-600" />
      },
      { 
        time: "14:00-15:30", 
        subject: "Architecture Web", 
        teacher: "M. Moreau", 
        type: "Cours",
        icon: <FaServer className="text-red-600" />
      },
      { 
        time: "16:00-17:30", 
        subject: "Base de Données", 
        teacher: "Mme. Dubois", 
        type: "Cours",
        icon: <FaDatabase className="text-green-600" />
      }
    ],
    "Vendredi": [
      { 
        time: "08:30-10:00", 
        subject: "Développement Mobile", 
        teacher: "Mme. Johnson", 
        type: "Cours",
        icon: <FaMobile className="text-indigo-600" />
      },
      { 
        time: "10:30-12:00", 
        subject: "JavaScript Avancé", 
        teacher: "Mme. Bernard", 
        type: "Cours",
        icon: <FaLaptopCode className="text-yellow-600" />
      },
      { 
        time: "13:30-15:00", 
        subject: "Projet Full Stack", 
        teacher: "M. Garcia", 
        type: "Projet",
        icon: <FaServer className="text-red-600" />
      },
      { 
        time: "15:30-17:00", 
        subject: "UI/UX Design", 
        teacher: "M. Leroy", 
        type: "Cours",
        icon: <FaPalette className="text-purple-600" />
      }
    ]
  };

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

  // Charger les données de l'enfant depuis localStorage
  useEffect(() => {
    const loadStudentData = () => {
      try {
        const savedData = localStorage.getItem('parent_student_data');
        if (savedData) {
          const data = JSON.parse(savedData);
          setStudentData({
            studentName: data.studentName,
            studentClass: data.studentClass,
            studentStatus: data.studentStatus,
            filiere: data.filiere,
            vague: data.vague
          });
        } else {
          // Données par défaut si non trouvées
          setStudentData({
            studentName: "Jean Dupont",
            studentClass: "Terminale S",
            studentStatus: "inscrit",
            filiere: "Développement Web & Mobile",
            vague: "Vague Janvier 2024"
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données élève:", error);
      }
    };

    const timer = setTimeout(() => {
      loadStudentData();
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Redirection si non connecté
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Fonction pour obtenir la couleur du type de cours
  const getTypeColor = (type: string) => {
    switch (type) {
      case "Cours":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "TP":
        return "bg-green-100 text-green-600 border-green-200";
      case "Projet":
        return "bg-purple-100 text-purple-600 border-purple-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Chargement de vos informations...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 lg:pl-5 pt-20 lg:pt-6">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6">
          
          {/* En-tête avec informations de l'enfant */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Emploi du Temps de {studentData?.studentName || "Votre Enfant"}
                </h1>
              </div>
              
              {/* Bouton d'actualisation */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 sm:gap-3 lg:gap-2 lg:items-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none lg:w-full justify-center"
                >
                  <FaSync className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </div>
          </div>

          {/* Sélecteur de jours */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {days.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
                  selectedDay === day
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Liste des cours */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <FaCalendarAlt className="text-blue-600" />
                  {selectedDay} - Emploi du temps
                </CardTitle>
                <Badge variant="outline">
                  {scheduleData[selectedDay]?.length || 0} cours
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-4 p-4 sm:p-6 max-h-96 overflow-y-auto">
                {isLoading ? (
                  // Squelettes de chargement
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                      <Skeleton className="w-6 h-6 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="w-16 h-6" />
                    </div>
                  ))
                ) : scheduleData[selectedDay]?.length ? (
                  scheduleData[selectedDay].map((course, index) => (
                    <div
                      key={index}
                      className="flex items-start p-3 sm:p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors gap-3"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {course.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                            {course.subject}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full border ${getTypeColor(course.type)} flex-shrink-0 w-fit`}>
                            {course.type}
                          </span>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <FaClock className="text-blue-600 flex-shrink-0" />
                            <span className="text-sm">{course.time}</span>
                          </div>
                          <div className="hidden sm:block text-gray-300">•</div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Formateur :</span>
                            <span className="font-medium truncate">{course.teacher}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Cours à venir"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FaCalendarAlt className="mx-auto text-4xl text-gray-300 mb-2" />
                    <p className="text-lg">Aucun cours prévu ce jour</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {studentData?.studentStatus === "inscrit" 
                        ? "Votre enfant n'a pas cours aujourd'hui" 
                        : "L'élève n'est pas inscrit à ce cours"
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}