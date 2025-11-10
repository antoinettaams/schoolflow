"use client";

import React, { useState, useEffect } from "react";
import { 
  FaFilter, 
  FaEye,
  FaChalkboardTeacher,
  FaUsers,
  FaIdCard,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaSync,
  FaFileExcel,
  FaPrint
} from "react-icons/fa";

interface AttendanceRecord {
  id: string;
  date: string;
  student: {
    id: string;
    name: string;
    studentId: string;
  };
  teacher: {
    id: string;
    name: string;
  };
  course: {
    subject: string;
    className: string;
    filiere: string;
    vague: string;
    startTime: string;
    endTime: string;
  };
  status: "present" | "absent";
  justified: boolean;
  reason?: string;
  semester: string;
}

interface FilterOptions {
  startDate: string;
  endDate: string;
  filiere: string;
  vague: string;
  module: string;
  teacher: string;
  status: "all" | "present" | "absent";
  justification: "all" | "justified" | "unjustified";
}

interface Stats {
  total: number;
  presents: number;
  absents: number;
  justified: number;
  unjustified: number;
}

export default function CensorAttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // États pour les filtres
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    filiere: "all",
    vague: "all",
    module: "all",
    teacher: "all",
    status: "all",
    justification: "all"
  });

  // États pour les options de filtre
  const [filterOptions, setFilterOptions] = useState({
    filieres: [] as string[],
    vagues: [] as string[],
    modules: [] as string[],
    teachers: [] as string[]
  });

  const [stats, setStats] = useState<Stats>({
    total: 0,
    presents: 0,
    absents: 0,
    justified: 0,
    unjustified: 0
  });

  // Charger les données des présences
  const fetchAttendanceData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/censor/attendance?action=all-records');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const data = await response.json();
      setAttendanceRecords(data.records || []);
      setFilteredRecords(data.records || []);
      
      // Extraire les options de filtre
      const filieres = [...new Set(data.records.map((r: AttendanceRecord) => r.course.filiere))];
      const vagues = [...new Set(data.records.map((r: AttendanceRecord) => r.course.vague))];
      const modules = [...new Set(data.records.map((r: AttendanceRecord) => r.course.subject))];
      const teachers = [...new Set(data.records.map((r: AttendanceRecord) => r.teacher.name))];

      setFilterOptions({
        filieres: filieres as string[],
        vagues: vagues as string[],
        modules: modules as string[],
        teachers: teachers as string[]
      });

    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...attendanceRecords];

    // Filtre par date
    filtered = filtered.filter(record => {
      const recordDate = new Date(record.date);
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59); // Inclure toute la journée de fin

      return recordDate >= startDate && recordDate <= endDate;
    });

    // Filtre par filière
    if (filters.filiere !== "all") {
      filtered = filtered.filter(record => record.course.filiere === filters.filiere);
    }

    // Filtre par vague
    if (filters.vague !== "all") {
      filtered = filtered.filter(record => record.course.vague === filters.vague);
    }

    // Filtre par module
    if (filters.module !== "all") {
      filtered = filtered.filter(record => record.course.subject === filters.module);
    }

    // Filtre par professeur
    if (filters.teacher !== "all") {
      filtered = filtered.filter(record => record.teacher.name === filters.teacher);
    }

    // Filtre par statut
    if (filters.status !== "all") {
      filtered = filtered.filter(record => record.status === filters.status);
    }

    // Filtre par justification
    if (filters.justification !== "all") {
      if (filters.justification === "justified") {
        filtered = filtered.filter(record => record.justified);
      } else {
        filtered = filtered.filter(record => !record.justified && record.status === "absent");
      }
    }

    setFilteredRecords(filtered);
    calculateStats(filtered);
  }, [filters, attendanceRecords]);

  // Calculer les statistiques
  const calculateStats = (records: AttendanceRecord[]) => {
    const total = records.length;
    const presents = records.filter(r => r.status === "present").length;
    const absents = records.filter(r => r.status === "absent").length;
    const justified = records.filter(r => r.justified).length;
    const unjustified = records.filter(r => r.status === "absent" && !r.justified).length;

    setStats({
      total,
      presents,
      absents,
      justified,
      unjustified
    });
  };

  // Exporter en Excel
  const exportToExcel = () => {
    // Simuler l'export Excel
    const data = filteredRecords.map(record => ({
      Date: formatFrenchDate(record.date),
      Étudiant: record.student.name,
      'ID Étudiant': record.student.studentId,
      Matière: record.course.subject,
      Classe: record.course.className,
      Filière: record.course.filiere,
      Vague: record.course.vague,
      Professeur: record.teacher.name,
      Statut: record.status === "present" ? "Présent" : "Absent",
      Justifié: record.justified ? "Oui" : "Non",
      Motif: record.reason || "",
      Semestre: record.semester
    }));

    console.log('Export Excel:', data);
    alert(`Export de ${data.length} enregistrements préparé`);
    // Ici vous intégrerez une bibliothèque d'export Excel comme xlsx
  };

  // Imprimer le rapport
  const printReport = () => {
    window.print();
  };

  // Formater la date en français
  const formatFrenchDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Formater la date longue
  const formatLongDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Charger les données au démarrage
  useEffect(() => {
    fetchAttendanceData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <div className="p-6 max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tableau de Bord des Présences - Censeur
          </h1>
          <p className="text-gray-600">
            Supervision de toutes les présences des étudiants - Filtres avancés disponibles
          </p>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Présences</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaUsers className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Présents</p>
                <p className="text-2xl font-bold text-green-600">{stats.presents}</p>
                <p className="text-xs text-gray-500">
                  {stats.total > 0 ? ((stats.presents / stats.total) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FaCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Absents</p>
                <p className="text-2xl font-bold text-red-600">{stats.absents}</p>
                <p className="text-xs text-gray-500">
                  {stats.total > 0 ? ((stats.absents / stats.total) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <FaTimesCircle className="text-red-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Non Justifiés</p>
                <p className="text-2xl font-bold text-orange-600">{stats.unjustified}</p>
                <p className="text-xs text-gray-500">
                  {stats.absents > 0 ? ((stats.unjustified / stats.absents) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FaExclamationTriangle className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Barre d'outils */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                <FaFilter />
                Filtres {showFilters ? "▲" : "▼"}
              </button>

              <button
                onClick={fetchAttendanceData}
                disabled={isLoading}
                className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                <FaSync className={isLoading ? "animate-spin" : ""} />
                Actualiser
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 border border-green-600 hover:bg-green-50 text-green-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                <FaFileExcel />
                Excel
              </button>

              <button
                onClick={printReport}
                className="flex items-center gap-2 border border-gray-600 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                <FaPrint />
                Imprimer
              </button>

              <div className="text-sm text-gray-500">
                {filteredRecords.length} enregistrements
              </div>
            </div>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Période */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Période
                  </label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Filière et Vague */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filière
                  </label>
                  <select
                    value={filters.filiere}
                    onChange={(e) => setFilters(prev => ({ ...prev, filiere: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Toutes les filières</option>
                    {filterOptions.filieres.map(filiere => (
                      <option key={filiere} value={filiere}>{filiere}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vague
                  </label>
                  <select
                    value={filters.vague}
                    onChange={(e) => setFilters(prev => ({ ...prev, vague: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Toutes les vagues</option>
                    {filterOptions.vagues.map(vague => (
                      <option key={vague} value={vague}>{vague}</option>
                    ))}
                  </select>
                </div>

                {/* Module et Professeur */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Module
                  </label>
                  <select
                    value={filters.module}
                    onChange={(e) => setFilters(prev => ({ ...prev, module: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tous les modules</option>
                    {filterOptions.modules.map(module => (
                      <option key={module} value={module}>{module}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Professeur
                  </label>
                  <select
                    value={filters.teacher}
                    onChange={(e) => setFilters(prev => ({ ...prev, teacher: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tous les professeurs</option>
                    {filterOptions.teachers.map(teacher => (
                      <option key={teacher} value={teacher}>{teacher}</option>
                    ))}
                  </select>
                </div>

                {/* Statut et Justification */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="present">Présents uniquement</option>
                    <option value="absent">Absents uniquement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Justification
                  </label>
                  <select
                    value={filters.justification}
                    onChange={(e) => setFilters(prev => ({ ...prev, justification: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Toutes les absences</option>
                    <option value="justified">Justifiées uniquement</option>
                    <option value="unjustified">Non justifiées uniquement</option>
                  </select>
                </div>
              </div>

              {/* Boutons de contrôle des filtres */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setFilters({
                    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0],
                    filiere: "all",
                    vague: "all",
                    module: "all",
                    teacher: "all",
                    status: "all",
                    justification: "all"
                  })}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tableau des présences */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <div className="flex items-center gap-2 text-red-800">
                <FaExclamationTriangle />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Étudiant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matière
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Professeur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  // Squelette de chargement
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <FaUsers className="text-4xl text-gray-300 mx-auto mb-3" />
                      <p>Aucune donnée de présence trouvée</p>
                      <p className="text-sm">Ajustez vos filtres ou actualisez les données</p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatFrenchDate(record.date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.course.startTime} - {record.course.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FaIdCard className="text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {record.student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {record.student.studentId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{record.course.subject}</div>
                        <div className="text-sm text-gray-500">{record.semester}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{record.course.className}</div>
                        <div className="text-sm text-gray-500">
                          {record.course.filiere} - {record.course.vague}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                            <FaChalkboardTeacher className="text-green-600 text-sm" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {record.teacher.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.status === "present"
                            ? "bg-green-100 text-green-800"
                            : record.justified
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {record.status === "present" ? (
                            <>✅ Présent</>
                          ) : record.justified ? (
                            <>⚠️ Absent Justifié</>
                          ) : (
                            <>❌ Absent Non Justifié</>
                          )}
                        </span>
                        {record.reason && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            {record.reason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                          <FaEye />
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}