// app/teacher/schedule/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FaCalendarAlt, FaClock, FaChalkboardTeacher, FaSync, FaDownload, FaFilter } from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function TeacherSchedulePage() {
  const { isLoaded, isSignedIn} = useUser();
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState("all");
  const [selectedFiliere, setSelectedFiliere] = useState("all");
  const [selectedVague, setSelectedVague] = useState("all");
  const [selectedModule, setSelectedModule] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  // Données fictives de l'emploi du temps du professeur
  const teacherScheduleData = {
    "Lundi": [
      { 
        time: "08:00-10:00", 
        subject: "React & Next.js", 
        filiere: "Développement Web",
        vague: "Vague 1",
        type: "Cours",
        classroom: "Lab Info A",
        studentsCount: 24
      },
      { 
        time: "10:30-12:30", 
        subject: "Base de Données", 
        filiere: "Développement Web",
        vague: "Vague 2",
        type: "Cours",
        classroom: "Lab Info B",
        studentsCount: 22
      },
      { 
        time: "14:00-16:00", 
        subject: "Python & Pandas", 
        filiere: "Data Science",
        vague: "Vague 1",
        type: "TP",
        classroom: "Lab Data A",
        studentsCount: 18
      }
    ],
    "Mardi": [
      { 
        time: "08:00-10:00", 
        subject: "Node.js & Express", 
        filiere: "Développement Web",
        vague: "Vague 1",
        type: "Cours",
        classroom: "Lab Info B",
        studentsCount: 24
      },
      { 
        time: "10:30-12:30", 
        subject: "Machine Learning", 
        filiere: "Data Science",
        vague: "Vague 1",
        type: "Cours",
        classroom: "Lab Data B",
        studentsCount: 18
      },
      { 
        time: "14:00-16:00", 
        subject: "Développement Mobile", 
        filiere: "Développement Web",
        vague: "Vague 2",
        type: "TP",
        classroom: "Lab Mobile A",
        studentsCount: 22
      }
    ],
    "Mercredi": [
      { 
        time: "08:00-10:00", 
        subject: "React & Next.js", 
        filiere: "Développement Web",
        vague: "Vague 1",
        type: "TP",
        classroom: "Lab Info A",
        studentsCount: 24
      },
      { 
        time: "10:30-12:30", 
        subject: "Visualisation de données", 
        filiere: "Data Science",
        vague: "Vague 1",
        type: "Cours",
        classroom: "Lab Data C",
        studentsCount: 18
      },
      { 
        time: "14:00-16:00", 
        subject: "Ethical Hacking", 
        filiere: "Cybersécurité",
        vague: "Vague 1",
        type: "TP",
        classroom: "Lab Secu B",
        studentsCount: 20
      }
    ],
    "Jeudi": [
      { 
        time: "08:00-10:00", 
        subject: "Cryptographie", 
        filiere: "Cybersécurité",
        vague: "Vague 1",
        type: "Cours",
        classroom: "Lab Secu C",
        studentsCount: 20
      },
      { 
        time: "10:30-12:30", 
        subject: "Node.js & Express", 
        filiere: "Développement Web",
        vague: "Vague 1",
        type: "TP",
        classroom: "Lab Info B",
        studentsCount: 24
      },
      { 
        time: "14:00-16:00", 
        subject: "Python & Pandas", 
        filiere: "Data Science",
        vague: "Vague 1",
        type: "TP",
        classroom: "Lab Data A",
        studentsCount: 18
      }
    ],
    "Vendredi": [
      { 
        time: "08:00-10:00", 
        subject: "React & Next.js", 
        filiere: "Développement Web",
        vague: "Vague 1",
        type: "Cours",
        classroom: "Lab Info A",
        studentsCount: 24
      },
      { 
        time: "10:30-12:30", 
        subject: "Machine Learning", 
        filiere: "Data Science",
        vague: "Vague 1",
        type: "TP",
        classroom: "Lab Data B",
        studentsCount: 18
      },
      { 
        time: "14:00-16:00", 
        subject: "Sécurité Réseau", 
        filiere: "Cybersécurité",
        vague: "Vague 1",
        type: "TP",
        classroom: "Lab Secu A",
        studentsCount: 20
      }
    ]
  };

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
  
  // Extraire les filières, vagues et modules uniques
  const allCourses = Object.values(teacherScheduleData).flat();
  const filieres = [...new Set(allCourses.map(course => course.filiere))];
  const vagues = [...new Set(allCourses.map(course => course.vague))];
  const modules = [...new Set(allCourses.map(course => course.subject))];

  // Fonction pour filtrer les cours
  const getFilteredCourses = () => {
    let filtered = allCourses;

    // Filtre par jour
    if (selectedDay !== "all") {
      filtered = teacherScheduleData[selectedDay as keyof typeof teacherScheduleData] || [];
    }

    // Filtre par filière
    if (selectedFiliere !== "all") {
      filtered = filtered.filter(course => course.filiere === selectedFiliere);
    }

    // Filtre par vague
    if (selectedVague !== "all") {
      filtered = filtered.filter(course => course.vague === selectedVague);
    }

    // Filtre par module
    if (selectedModule !== "all") {
      filtered = filtered.filter(course => course.subject === selectedModule);
    }

    return filtered;
  };

  // Simuler le chargement des données
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setLastUpdate(new Date().toLocaleTimeString('fr-FR'));
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Redirection si non connecté
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Couleur du type de cours
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

  // Couleur de la filière
  const getFiliereColor = (filiere: string) => {
    switch (filiere) {
      case "Développement Web":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Data Science":
        return "bg-green-50 text-green-700 border-green-200";
      case "Cybersécurité":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLastUpdate(new Date().toLocaleTimeString('fr-FR'));
    }, 800);
  };

  const handleExportSchedule = () => {
    alert("Export de l'emploi du temps en cours...");
  };

  const filteredCourses = getFilteredCourses();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Chargement de vos informations...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-4 lg:p-6">
          
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 lg:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
                  Emploi du Temps
                </h1>
              </div>
              <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  <FaSync className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="text-xs sm:text-sm">Actualiser</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportSchedule}
                  className="flex-1 sm:flex-none"
                >
                  <FaDownload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Exporter</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <Card className="mb-4 lg:mb-6">
            <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FaFilter className="text-blue-600 w-4 h-4" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {/* Filtre par Jour */}
                <div className="space-y-2">
                  <Label htmlFor="day-filter" className="text-sm">Jour</Label>
                  <Select value={selectedDay} onValueChange={setSelectedDay}>
                    <SelectTrigger id="day-filter" className="text-sm">
                      <SelectValue placeholder="Tous les jours" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les jours</SelectItem>
                      {days.map(day => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre par Filière */}
                <div className="space-y-2">
                  <Label htmlFor="filiere-filter" className="text-sm">Filière</Label>
                  <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                    <SelectTrigger id="filiere-filter" className="text-sm">
                      <SelectValue placeholder="Toutes les filières" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les filières</SelectItem>
                      {filieres.map(filiere => (
                        <SelectItem key={filiere} value={filiere}>{filiere}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre par Vague */}
                <div className="space-y-2">
                  <Label htmlFor="vague-filter" className="text-sm">Vague</Label>
                  <Select value={selectedVague} onValueChange={setSelectedVague}>
                    <SelectTrigger id="vague-filter" className="text-sm">
                      <SelectValue placeholder="Toutes les vagues" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les vagues</SelectItem>
                      {vagues.map(vague => (
                        <SelectItem key={vague} value={vague}>{vague}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre par Module */}
                <div className="space-y-2">
                  <Label htmlFor="module-filter" className="text-sm">Module</Label>
                  <Select value={selectedModule} onValueChange={setSelectedModule}>
                    <SelectTrigger id="module-filter" className="text-sm">
                      <SelectValue placeholder="Tous les modules" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les modules</SelectItem>
                      {modules.map(module => (
                        <SelectItem key={module} value={module}>{module}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Indicateur des filtres actifs */}
              <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm text-gray-600">Filtres actifs :</span>
                {selectedDay !== "all" && (
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    Jour: {selectedDay}
                  </Badge>
                )}
                {selectedFiliere !== "all" && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    Filière: {selectedFiliere}
                  </Badge>
                )}
                {selectedVague !== "all" && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    Vague: {selectedVague}
                  </Badge>
                )}
                {selectedModule !== "all" && (
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    Module: {selectedModule}
                  </Badge>
                )}
                {(selectedDay === "all" && selectedFiliere === "all" && selectedVague === "all" && selectedModule === "all") && (
                  <span className="text-xs sm:text-sm text-gray-500">Aucun filtre actif</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Résultats des cours filtrés */}
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
                  Mes Cours
                  {filteredCourses.length > 0 && (
                    <span className="text-xs sm:text-sm font-normal text-gray-500">
                      ({filteredCourses.length} cours trouvé(s))
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {filteredCourses.length} cours
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {filteredCourses.reduce((total, course) => {
                      const [start, end] = course.time.split('-');
                      return total + (parseInt(end.split(':')[0]) - parseInt(start.split(':')[0]));
                    }, 0)}h
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 lg:p-6">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                      <Skeleton className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2 min-w-0">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                      <Skeleton className="w-12 h-5 sm:w-16 sm:h-6 flex-shrink-0" />
                    </div>
                  ))
                ) : filteredCourses.length > 0 ? (
                  filteredCourses.map((course, index) => (
                    <div
                      key={index}
                      className="flex items-start p-3 sm:p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors gap-3 sm:gap-4"
                    >
                      <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                        <FaChalkboardTeacher className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2 sm:mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-base sm:text-lg break-words">
                              {course.subject}
                            </h3>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                              <Badge variant="outline" className={`text-xs ${getFiliereColor(course.filiere)}`}>
                                {course.filiere}
                              </Badge>
                              <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">•</span>
                              <span className="text-xs sm:text-sm font-medium text-gray-700">{course.vague}</span>
                              <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">•</span>
                              <span className="text-xs sm:text-sm text-gray-600">{course.studentsCount} étudiants</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 self-start sm:self-center">
                            <span className={`text-xs px-2 py-1 rounded-full border ${getTypeColor(course.type)} flex-shrink-0`}>
                              {course.type}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 lg:gap-6 text-xs sm:text-sm text-gray-600">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <FaClock className="text-blue-600 flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="font-medium">{course.time}</span>
                          </div>
                          <div className="hidden sm:block text-gray-300">•</div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <FaCalendarAlt className="text-green-600 flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{Object.keys(teacherScheduleData).find(day => 
                              teacherScheduleData[day as keyof typeof teacherScheduleData]?.includes(course)
                            )}</span>
                          </div>
                          <div className="hidden sm:block text-gray-300">•</div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span>Salle: {course.classroom}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse" title="Cours à venir"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 sm:py-12 text-gray-500">
                    <FaFilter className="mx-auto text-3xl sm:text-4xl text-gray-300 mb-3 sm:mb-4" />
                    <p className="text-base sm:text-lg font-semibold">Aucun cours trouvé</p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">
                      Aucun cours ne correspond aux filtres sélectionnés
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