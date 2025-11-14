// app/dashboard/parent/attendance/page.tsx
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
  studentStatus: "inscrit" | "non_trouve" | "non_associe";
  filiere: string;
  vague: string;
  studentNumber?: string;
}

interface AttendanceRecord {
  id: string;
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

interface ApiResponse {
  success: boolean;
  student: StudentData;
  attendance: AttendanceRecord[];
  stats: {
    totalClasses: number;
    present: number;
    absent: number;
    justifiedAbsences: number;
    unjustifiedAbsences: number;
    attendanceRate: number;
  };
  filters: {
    vagues: string[];
    modules: string[];
    semestres: string[];
  };
  metadata?: {
    parentName?: string;
    enfantName?: string;
    generatedAt?: string;
    dataSource?: string;
  };
  error?: string;
  message?: string;
}

// --- Composant Skeleton pour le chargement ---
const AttendanceSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Skeleton pour le header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-6 w-32 bg-gray-200 rounded-full animate-pulse"></div>
      </div>

      {/* Skeleton pour les cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((card) => (
          <Card key={card} className="animate-pulse">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="p-3 bg-gray-200 rounded-lg">
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                </div>
              </div>
              <div className="h-6 w-32 bg-gray-200 rounded mx-auto mb-3"></div>
              <div className="h-10 w-16 bg-gray-200 rounded mx-auto mb-2"></div>
              <div className="h-4 w-24 bg-gray-200 rounded mx-auto"></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skeleton pour les filtres */}
      <Card className="mb-6 animate-pulse">
        <CardHeader>
          <div className="h-6 w-24 bg-gray-200 rounded mb-2"></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((filter) => (
              <div key={filter}>
                <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-10 w-full bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skeleton pour le tableau */}
      <Card className="animate-pulse">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="h-6 w-40 bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {[1, 2, 3, 4, 5, 6].map((header) => (
                    <th key={header} className="text-left py-3 px-4">
                      <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((row) => (
                  <tr key={row} className="border-b border-gray-100">
                    {[1, 2, 3, 4, 5, 6].map((cell) => (
                      <td key={cell} className="py-4 px-4">
                        <div className="space-y-2">
                          <div className="h-4 w-16 bg-gray-200 rounded"></div>
                          {cell === 1 && <div className="h-3 w-12 bg-gray-200 rounded"></div>}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Composant principal ---
export default function ParentAttendancePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [sortField, setSortField] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedVague, setSelectedVague] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedSemestre, setSelectedSemestre] = useState<string>("all");
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    present: 0,
    absent: 0,
    justifiedAbsences: 0,
    unjustifiedAbsences: 0,
    attendanceRate: 0
  });
  const [filters, setFilters] = useState({
    vagues: [] as string[],
    modules: [] as string[],
    semestres: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les données depuis l'API
  const fetchAttendanceData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Début du chargement des données...');
      
      const response = await fetch('/api/attendance', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      });
      
      console.log('📡 Statut HTTP:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data: ApiResponse = await response.json();
      
      // Vérifier le succès de l'API
      if (!data.success || data.error) {
        throw new Error(data.error || data.message || "Erreur inconnue");
      }
      
      // Vérifier si des étudiants sont associés
      if (data.student.studentStatus === "non_associe") {
        setError("Aucun étudiant associé à votre compte. Veuillez contacter l'administration.");
        setIsLoading(false);
        return;
      }
      
      if (data.student.studentStatus === "non_trouve") {
        setError("Aucun étudiant trouvé pour votre compte.");
        setIsLoading(false);
        return;
      }
      
      console.log('📊 Données reçues:', {
        student: data.student.studentName,
        attendanceCount: data.attendance.length,
        stats: data.stats
      });
      
      // Mettre à jour l'état
      setStudentData(data.student);
      setAttendanceData(data.attendance);
      setStats(data.stats);
      setFilters(data.filters);
      setSelectedVague(data.student.vague);
      
    } catch (error) {
      console.error("💥 Erreur lors du chargement des données:", error);
      setError(error instanceof Error ? error.message : "Impossible de charger les données d'assiduité");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      console.log('👤 Utilisateur connecté, chargement des données...');
      fetchAttendanceData();
    }
  }, [isLoaded, isSignedIn]);

  // Redirection si non connecté
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      console.log('🔒 Utilisateur non connecté, redirection...');
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Filtrer les données
  const filteredData = attendanceData.filter(item => {
    const vagueMatch = selectedVague === "all" || item.vague === selectedVague;
    const moduleMatch = selectedModule === "all" || item.module === selectedModule;
    const semestreMatch = selectedSemestre === "all" || item.semestre === selectedSemestre;
    return vagueMatch && moduleMatch && semestreMatch;
  });

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

  // États de chargement et d'erreur
  if (!isLoaded || isLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-6xl mx-auto">
            <AttendanceSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-6xl mx-auto">
            <div className="text-center py-12">
              <FaExclamationTriangle className="text-5xl text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Erreur de chargement
              </h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={fetchAttendanceData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Réessayer
                </button>
                <button
                  onClick={() => router.push('/dashboard/parent')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Retour au tableau de bord
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // États spécifiques des étudiants
  if (studentData?.studentStatus === "non_associe" || studentData?.studentStatus === "non_trouve") {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-6xl mx-auto">
            <div className="text-center py-12">
              <FaExclamationTriangle className="text-5xl text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {studentData.studentStatus === "non_associe" 
                  ? "Aucun étudiant associé" 
                  : "Étudiant non trouvé"}
              </h3>
              <p className="text-gray-500 mb-4">
                {studentData.studentStatus === "non_associe"
                  ? "Aucun étudiant n'est actuellement associé à votre compte parent."
                  : "Aucun étudiant correspondant n'a été trouvé."}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/dashboard/parent/associate-student')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Associer un étudiant
                </button>
                <button
                  onClick={() => router.push('/dashboard/parent')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Retour au tableau de bord
                </button>
              </div>
            </div>
          </div>
        </div>
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
                  {stats.attendanceRate}%
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
                      {filters.vagues.map(vague => (
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
                      {filters.modules.map(module => (
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
                      {filters.semestres.map(semestre => (
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
                  {sortedData.length} cours sur {attendanceData.length} total
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
                    {sortedData.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
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

              {sortedData.length === 0 && attendanceData.length > 0 && (
                <div className="text-center py-12">
                  <FaCalendarTimes className="text-5xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucun résultat
                  </h3>
                  <p className="text-gray-500">
                    Aucune information d&apos;assiduité ne correspond aux filtres sélectionnés.
                  </p>
                </div>
              )}

              {attendanceData.length === 0 && (
                <div className="text-center py-12">
                  <FaCalendarTimes className="text-5xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucune donnée d&apos;assiduité
                  </h3>
                  <p className="text-gray-500">
                    Aucune information d&apos;assiduité n&apos;est disponible pour cet étudiant.
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