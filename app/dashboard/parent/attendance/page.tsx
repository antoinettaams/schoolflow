// app/parent/attendance/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FaCalendarTimes, FaCheck, FaTimes, FaExclamationTriangle, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StudentData {
  studentName: string;
  studentClass: string;
  studentStatus: "inscrit" | "non-inscrit";
  filiere: string;
  vague: string;
}

interface AttendanceRecord {
  date: string;
  day: string;
  subject: string;
  time: string;
  teacher: string;
  status: "present" | "absent";
  justified: boolean;
  reason: string;
  semestre: string;
  module: string;
  vague: string;
}

export default function ParentAttendancePage() {
  const { isLoaded, isSignedIn } = useUser(); // user retiré car non utilisé
  const router = useRouter();
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedVague, setSelectedVague] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedSemestre, setSelectedSemestre] = useState<string>("all");
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Données d'assiduité avec les matières de l'emploi du temps et les vrais noms de professeurs
  const attendanceData: AttendanceRecord[] = [
    { date: "15/12/2024", day: "Lundi", subject: "Programmation Web Frontend", time: "08:00-09:30", teacher: "M. Martin", status: "absent", justified: false, reason: "", semestre: "Semestre 1", module: "Programmation Web Frontend", vague: "Vague Janvier 2024" },
    { date: "12/12/2024", day: "Vendredi", subject: "Base de Données", time: "10:00-11:30", teacher: "Mme. Dubois", status: "present", justified: true, reason: "", semestre: "Semestre 1", module: "Base de Données", vague: "Vague Janvier 2024" },
    { date: "10/12/2024", day: "Mercredi", subject: "UI/UX Design", time: "13:30-15:00", teacher: "M. Leroy", status: "absent", justified: true, reason: "Maladie avec certificat médical", semestre: "Semestre 1", module: "UI/UX Design", vague: "Vague Janvier 2024" },
    { date: "08/12/2024", day: "Lundi", subject: "JavaScript Avancé", time: "15:30-17:00", teacher: "Mme. Bernard", status: "present", justified: true, reason: "", semestre: "Semestre 1", module: "JavaScript Avancé", vague: "Vague Janvier 2024" },
    { date: "05/12/2024", day: "Vendredi", subject: "Développement Mobile", time: "09:00-10:30", teacher: "Mme. Johnson", status: "absent", justified: false, reason: "", semestre: "Semestre 1", module: "Développement Mobile", vague: "Vague Janvier 2024" },
    { date: "03/12/2024", day: "Mercredi", subject: "Projet Full Stack", time: "14:00-15:30", teacher: "M. Garcia", status: "present", justified: true, reason: "", semestre: "Semestre 2", module: "Projet Full Stack", vague: "Vague Septembre 2024" },
    { date: "28/11/2024", day: "Jeudi", subject: "Architecture Web", time: "16:00-17:30", teacher: "M. Moreau", status: "absent", justified: true, reason: "Rendez-vous médical", semestre: "Semestre 2", module: "Architecture Web", vague: "Vague Septembre 2024" },
    { date: "25/11/2024", day: "Lundi", subject: "Programmation Web Frontend", time: "08:00-09:30", teacher: "M. Martin", status: "present", justified: true, reason: "", semestre: "Semestre 2", module: "Programmation Web Frontend", vague: "Vague Septembre 2024" },
    { date: "22/11/2024", day: "Vendredi", subject: "Base de Données", time: "10:00-11:30", teacher: "Mme. Dubois", status: "absent", justified: true, reason: "Problème de transport", semestre: "Semestre 2", module: "Base de Données", vague: "Vague Septembre 2024" },
    { date: "20/11/2024", day: "Mercredi", subject: "UI/UX Design", time: "13:30-15:00", teacher: "M. Leroy", status: "present", justified: true, reason: "", semestre: "Semestre 2", module: "UI/UX Design", vague: "Vague Septembre 2024" },
  ];

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
          // Définir la vague de l'enfant comme filtre par défaut
          setSelectedVague(data.vague);
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

  // Obtenir les options de filtre uniques
  const vagues = Array.from(new Set(attendanceData.map(item => item.vague)));
  const modules = Array.from(new Set(attendanceData.map(item => item.module)));
  const semestres = Array.from(new Set(attendanceData.map(item => item.semestre)));

  // Filtrer les données
  const filteredData = attendanceData.filter(item => {
    const vagueMatch = selectedVague === "all" || item.vague === selectedVague;
    const moduleMatch = selectedModule === "all" || item.module === selectedModule;
    const semestreMatch = selectedSemestre === "all" || item.semestre === selectedSemestre;
    return vagueMatch && moduleMatch && semestreMatch;
  });

  // Statistiques basées sur les données filtrées
  const stats = {
    totalClasses: filteredData.length,
    present: filteredData.filter(item => item.status === "present").length,
    absent: filteredData.filter(item => item.status === "absent").length,
    justifiedAbsences: filteredData.filter(item => item.status === "absent" && item.justified).length,
    unjustifiedAbsences: filteredData.filter(item => item.status === "absent" && !item.justified).length,
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

  // Trier les données filtrées
  const sortedData = [...filteredData].sort((a, b) => {
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

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Chargement de vos informations...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-6xl mx-auto">
          {/* Grand titre */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vue des absences</h1>
              <p className="text-gray-600 mt-1">
                Élève : <span className="font-semibold">{studentData?.studentName || "Non spécifié"} - {studentData?.filiere || "Non spécifié"}</span>
              </p>
            </div>
            {studentData?.vague && (
              <Badge variant="secondary" className="w-fit">
                Vague : {studentData.vague}
              </Badge>
            )}
          </div>

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FaCalendarTimes className="text-blue-600 text-xl" />
                  </div>
                </div>
                <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                  Taux de Présence
                </CardTitle>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.totalClasses > 0 ? Math.round((stats.present / stats.totalClasses) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-500 mt-1">{stats.present}/{stats.totalClasses} cours</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                  Absences Justifiées
                </CardTitle>
                <p className="text-3xl font-bold text-green-600">{stats.justifiedAbsences}</p>
                <p className="text-sm text-gray-500 mt-1">Avec motif</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                  Absences Non Justifiées
                </CardTitle>
                <p className="text-3xl font-bold text-red-600">{stats.unjustifiedAbsences}</p>
                <p className="text-sm text-gray-500 mt-1">Sans motif</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                  Total Absences
                </CardTitle>
                <p className="text-3xl font-bold text-orange-600">{stats.absent}</p>
                <p className="text-sm text-gray-500 mt-1">Toutes absences</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtres */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FaCalendarTimes className="text-blue-600" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Vague</label>
                  <Select value={selectedVague} onValueChange={setSelectedVague}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une vague" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les vagues</SelectItem>
                      {vagues.map(vague => (
                        <SelectItem key={vague} value={vague}>
                          {vague}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Module</label>
                  <Select value={selectedModule} onValueChange={setSelectedModule}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les modules</SelectItem>
                      {modules.map(module => (
                        <SelectItem key={module} value={module}>
                          {module}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Semestre</label>
                  <Select value={selectedSemestre} onValueChange={setSelectedSemestre}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un semestre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les semestres</SelectItem>
                      {semestres.map(semestre => (
                        <SelectItem key={semestre} value={semestre}>
                          {semestre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tableau d'assiduité */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FaCalendarTimes className="text-blue-600" />
                  Détail de l&apos;Assiduité
                </CardTitle>
                <div className="text-sm text-gray-500">
                  {sortedData.length} cours enregistré(s)
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <FaCheck className="mr-1" />
                              Présent
                            </Badge>
                          ) : item.justified ? (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                              <FaExclamationTriangle className="mr-1" />
                              Absent justifié
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              <FaTimes className="mr-1" />
                              Absent non justifié
                            </Badge>
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
                    Aucune donnée d&apos;assiduité
                  </h3>
                  <p className="text-gray-500">
                    Aucune information d&apos;assiduité n&apos;est disponible pour les filtres sélectionnés.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Légende */}
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}