// app/teacher/schedule/page.tsx
"use client";

import React, { useState } from "react";
import { FaCalendarAlt, FaClock, FaChalkboardTeacher, FaDownload, FaUser} from "react-icons/fa";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";

export default function TeacherSchedulePage() {
  const [selectedFiliere, setSelectedFiliere] = useState("all");
  const [selectedModule, setSelectedModule] = useState("all");
  const [selectedDay, setSelectedDay] = useState("all");
  const { user } = useUser();

  // Données structurées par Filières et Modules - uniquement du lundi au vendredi
  const teacherSchedule = {
    teacher: user?.fullName || "Professeur",
    subject: "Informatique",
    weeklyHours: 16,
    maxHours: 20,
    
    // Structure: Filières → Modules → Cours (uniquement du lundi au vendredi)
    filieres: {
      "Développement Web": {
        modules: {
          "React & Next.js": [
            { day: "LUNDI", start: "08:00", end: "10:00", classroom: "Lab Info A", type: "Cours" },
            { day: "MERCREDI", start: "10:00", end: "12:00", classroom: "Lab Info A", type: "Cours" },
            { day: "VENDREDI", start: "14:00", end: "16:00", classroom: "Lab Info A", type: "Cours" }
          ],
          "Node.js & Express": [
            { day: "MARDI", start: "08:00", end: "10:00", classroom: "Lab Info B", type: "Cours" },
            { day: "JEUDI", start: "16:00", end: "18:00", classroom: "Lab Info B", type: "Cours" }
          ],
          "Base de données": [
            { day: "LUNDI", start: "14:00", end: "16:00", classroom: "Lab Info C", type: "Cours" },
            { day: "MERCREDI", start: "16:00", end: "18:00", classroom: "Lab Info C", type: "Cours" }
          ]
        }
      },
      "Data Science": {
        modules: {
          "Python & Pandas": [
            { day: "LUNDI", start: "10:00", end: "12:00", classroom: "Lab Data A", type: "Cours" },
            { day: "VENDREDI", start: "08:00", end: "10:00", classroom: "Lab Data A", type: "Cours" }
          ],
          "Machine Learning": [
            { day: "MARDI", start: "14:00", end: "16:00", classroom: "Lab Data B", type: "Cours" },
            { day: "JEUDI", start: "10:00", end: "12:00", classroom: "Lab Data B", type: "Cours" }
          ],
          "Visualisation de données": [
            { day: "MERCREDI", start: "08:00", end: "10:00", classroom: "Lab Data C", type: "Cours" },
            { day: "VENDREDI", start: "16:00", end: "18:00", classroom: "Lab Data C", type: "Cours" }
          ]
        }
      },
      "Cybersécurité": {
        modules: {
          "Sécurité Réseau": [
            { day: "MARDI", start: "10:00", end: "12:00", classroom: "Lab Secu A", type: "Cours" },
            { day: "JEUDI", start: "14:00", end: "16:00", classroom: "Lab Secu A", type: "Cours" }
          ],
          "Ethical Hacking": [
            { day: "LUNDI", start: "16:00", end: "18:00", classroom: "Lab Secu B", type: "Cours" },
            { day: "MERCREDI", start: "14:00", end: "16:00", classroom: "Lab Secu B", type: "Cours" }
          ],
          "Cryptographie": [
            { day: "MARDI", start: "16:00", end: "18:00", classroom: "Lab Secu C", type: "Cours" },
            { day: "JEUDI", start: "08:00", end: "10:00", classroom: "Lab Secu C", type: "Cours" }
          ]
        }
      }
    }
  };

  // Jours de la semaine - uniquement du lundi au vendredi
  const days = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI"];
  
  // Créneau horaires standards
  const timeSlots = [
    "08:00-10:00", "10:00-12:00", "12:00-14:00", 
    "14:00-16:00", "16:00-18:00"
  ];

  // Récupérer toutes les filières
  const filieres = Object.keys(teacherSchedule.filieres);

  // Récupérer les modules selon la filière sélectionnée
 const getModules = () => {
  if (selectedFiliere === "all") {
    const allModules: string[] = [];
    for (const filiere of Object.values(teacherSchedule.filieres)) {
      allModules.push(...Object.keys(filiere.modules));
    }
    return [...new Set(allModules)];
  }
  
  return Object.keys(teacherSchedule.filieres[selectedFiliere as keyof typeof teacherSchedule.filieres].modules);
};

  // Fonction pour obtenir la couleur selon le type de cours
  const getTypeColor = (type: string) => {
    switch (type) {
      case "Cours": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Fonction pour obtenir la variante du badge
  const getTypeVariant = (type: string) => {
    switch (type) {
      case "Cours": return "default";
      default: return "outline";
    }
  };

  // Récupérer tous les cours du professeur avec filtres
  const getAllTeacherClasses = () => {
    const allClasses = [];
    
    for (const [filiereName, filiere] of Object.entries(teacherSchedule.filieres)) {
      // Filtre par filière
      if (selectedFiliere === "all" || selectedFiliere === filiereName) {
        for (const [moduleName, schedules] of Object.entries(filiere.modules)) {
          // Filtre par module
          if (selectedModule === "all" || selectedModule === moduleName) {
            for (const schedule of schedules) {
              // Filtre par jour
              if (selectedDay === "all" || selectedDay === schedule.day) {
                allClasses.push({ 
                  filiere: filiereName, 
                  module: moduleName, 
                  ...schedule 
                });
              }
            }
          }
        }
      }
    }
    
    return allClasses.sort((a, b) => {
  const dayOrder: Record<string, number> = { 
    "LUNDI": 1, "MARDI": 2, "MERCREDI": 3, "JEUDI": 4, "VENDREDI": 5 
  };
  return (dayOrder[a.day] || 6) - (dayOrder[b.day] || 6) || a.start.localeCompare(b.start);
});
  };

  // Fonction pour obtenir les cours d'un jour donné pour la grille
  const getClassesForDay = (day: string) => {
    const classes = [];
    
    for (const [filiereName, filiere] of Object.entries(teacherSchedule.filieres)) {
      for (const [moduleName, schedules] of Object.entries(filiere.modules)) {
        const classSchedule = schedules.find(s => s.day === day);
        if (classSchedule) {
          // Filtres par filière et module
          if ((selectedFiliere === "all" || selectedFiliere === filiereName) &&
              (selectedModule === "all" || selectedModule === moduleName)) {
            classes.push({
              filiere: filiereName,
              module: moduleName,
              ...classSchedule
            });
          }
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
          <Card>
            <CardContent className="p-6">
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
                    <p className="text-sm text-gray-500 mt-1">Emploi du temps fixe - Semaine du lundi au vendredi</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Charge horaire hebdomadaire</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {teacherSchedule.weeklyHours}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtres par Filière, Module et Jour */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Filtre par Filière */}
                <div className="space-y-2">
                  <Label htmlFor="filiere-filter">Filtrer par filière</Label>
                  <Select value={selectedFiliere} onValueChange={(value) => {
                    setSelectedFiliere(value);
                    setSelectedModule("all"); // Reset module quand la filière change
                  }}>
                    <SelectTrigger id="filiere-filter">
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

                {/* Filtre par Module */}
                <div className="space-y-2">
                  <Label htmlFor="module-filter">Filtrer par module</Label>
                  <Select value={selectedModule} onValueChange={setSelectedModule}>
                    <SelectTrigger id="module-filter">
                      <SelectValue placeholder="Tous les modules" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les modules</SelectItem>
                      {getModules().map(module => (
                        <SelectItem key={module} value={module}>{module}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtre par Jour */}
                <div className="space-y-2">
                  <Label htmlFor="day-filter">Filtrer par jour</Label>
                  <Select value={selectedDay} onValueChange={setSelectedDay}>
                    <SelectTrigger id="day-filter">
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

                {/* Bouton Export PDF */}
                <div className="flex items-end">
                  <Button className="w-full flex items-center justify-center gap-2">
                    <FaDownload className="w-4 h-4" />
                    Exporter PDF
                  </Button>
                </div>
              </div>

              {/* Indicateur des filtres actifs */}
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Filtres actifs:</span>
                  {selectedFiliere !== "all" && (
                    <Badge variant="secondary">
                      Filière: {selectedFiliere}
                    </Badge>
                  )}
                  {selectedModule !== "all" && (
                    <Badge variant="outline">
                      Module: {selectedModule}
                    </Badge>
                  )}
                  {selectedDay !== "all" && (
                    <Badge variant="outline">
                      Jour: {selectedDay}
                    </Badge>
                  )}
                  {(selectedFiliere === "all" && selectedModule === "all" && selectedDay === "all") && (
                    <span className="text-gray-500">Aucun filtre actif</span>
                  )}
                </div>
                <div className="ml-auto text-gray-600">
                  {getFilteredCourseCount()} cours trouvé(s)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mes jours et heures de cours - Vue détaillée avec filtres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaUser className="text-blue-600" />
                Mes Cours
                {selectedFiliere !== "all" && ` - ${selectedFiliere}`}
                {selectedModule !== "all" && ` - ${selectedModule}`}
                {selectedDay !== "all" && ` - ${selectedDay}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jour</TableHead>
                      <TableHead>Horaire</TableHead>
                      <TableHead>Filière</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Salle</TableHead>
                      <TableHead>Durée</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getAllTeacherClasses().map((course, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="font-semibold">{course.day}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FaClock className="text-gray-400 w-4 h-4" />
                            <span className="font-medium">
                              {course.start} - {course.end}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {course.filiere}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{course.module}</TableCell>
                        <TableCell>
                          <Badge variant={getTypeVariant(course.type)} className={getTypeColor(course.type)}>
                            {course.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{course.classroom}</TableCell>
                        <TableCell>
                          <span className="font-medium text-blue-600">2 heures</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {getAllTeacherClasses().length === 0 && (
                  <div className="text-center py-12">
                    <FaChalkboardTeacher className="text-5xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun cours trouvé</h3>
                    <p className="text-gray-500">
                      Aucun cours ne correspond aux filtres sélectionnés.
                      {(selectedFiliere !== "all" || selectedModule !== "all" || selectedDay !== "all") ? " Essayez de modifier vos filtres." : ""}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Emploi du temps hebdomadaire (seulement si pas de filtre par jour) */}
          {selectedDay === "all" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FaClock className="text-blue-600" />
                  Vue Hebdomadaire - Grille des Cours
                  {selectedFiliere !== "all" && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      - Filière: {selectedFiliere}
                    </span>
                  )}
                  {selectedModule !== "all" && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      - Module: {selectedModule}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32 text-center bg-gray-50">
                          Horaire
                        </TableHead>
                        {days.map(day => (
                          <TableHead key={day} className="text-center bg-gray-50">
                            {day}
                            <div className="text-xs font-normal text-gray-500 mt-1">
                              {getDailyHours(day)}h
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeSlots.map(timeSlot => (
                        <TableRow key={timeSlot}>
                          <TableCell className="w-32 text-center font-medium bg-gray-50">
                            {timeSlot}
                          </TableCell>
                          {days.map(day => {
                            const classes = getClassesForDay(day);
                            const classInSlot = classes.find(cls => {
                              const [slotStart] = timeSlot.split('-');
                              return cls.start === slotStart;
                            });

                            return (
                              <TableCell key={day} className="min-w-[200px] h-24 align-top p-2">
                                {classInSlot && (
                                  <div className={`p-3 rounded-lg border-2 h-full flex flex-col justify-between ${getTypeColor(classInSlot.type)}`}>
                                    <div>
                                      <div className="font-semibold text-sm mb-1">{classInSlot.module}</div>
                                      <div className="text-xs text-gray-600 mb-1">{classInSlot.filiere}</div>
                                      <div className="text-xs opacity-75 mb-2">
                                        {classInSlot.start} - {classInSlot.end}
                                      </div>
                                    </div>
                                    <div className="text-xs">
                                      <div className="font-medium text-blue-700">
                                        {classInSlot.type} • {classInSlot.classroom}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Résumé par jour (seulement si pas de filtre par jour) */}
          {selectedDay === "all" && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Répartition par Jour {selectedFiliere !== "all" ? `- ${selectedFiliere}` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {days.map(day => {
                    const dailyHours = getDailyHours(day);
                    const dailyClasses = getClassesForDay(day);
                    
                    return (
                      <Card key={day} className={`text-center ${
                        dailyHours > 0 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-gray-50 border-gray-200"
                      }`}>
                        <CardContent className="p-4">
                          <p className="font-semibold text-gray-900 mb-2">{day}</p>
                          <p className="text-2xl font-bold text-blue-600 mb-1">{dailyHours}h</p>
                          <p className="text-sm text-gray-600">
                            {dailyClasses.length} cours
                          </p>
                          {dailyClasses.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {dailyClasses.map((cls, idx) => (
                                <div key={idx} className="text-xs text-gray-700">
                                  {cls.start} - {cls.module}
                                  <span className="text-blue-600 ml-1">
                                    ({cls.filiere})
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}