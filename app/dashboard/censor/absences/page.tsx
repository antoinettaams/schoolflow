"use client";

import { useState, useEffect } from "react";
import { 
  FaFilter, 
  FaChalkboardTeacher,
  FaUsers,
  FaIdCard, 
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaSync,
  FaFileExcel,
  FaDownload,
  FaCalendarAlt,
  FaClock
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Components Shadcn
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

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

// Composant Skeleton pour le chargement
const AttendanceSkeleton = () => (
  <div className="min-h-screen bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
    <div className="p-6 max-w-7xl mx-auto">
      
      {/* En-tête Skeleton */}
      <div className="mb-8 space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Cartes de statistiques Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Barre d'outils Skeleton */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default function CensorAttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  
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

  // Charger les données
  const fetchAttendanceData = async () => {
    try {
      setIsLoading(true);
      const loadingToast = toast.loading('Chargement des données de présence...');

      // Utilisez Promise.allSettled pour mieux gérer les erreurs
      const [recordsResponse, optionsResponse] = await Promise.allSettled([
        fetch('/api/censor/attendance?action=all-records'),
        fetch('/api/censor/attendance?action=filter-options')
      ]);

      // Vérifiez si les promesses ont été rejetées
      if (recordsResponse.status === 'rejected' || optionsResponse.status === 'rejected') {
        throw new Error('Erreur de réseau lors du chargement des données');
      }

      const recordsData = await recordsResponse.value.json();
      const optionsData = await optionsResponse.value.json();

      if (!recordsData.success) {
        throw new Error(recordsData.error || 'Erreur lors du chargement des enregistrements');
      }

      if (!optionsData.success) {
        throw new Error(optionsData.error || 'Erreur lors du chargement des options de filtre');
      }

      // Validation des données
      const validatedRecords = Array.isArray(recordsData.records) ? recordsData.records : [];
      
      setAttendanceRecords(validatedRecords);
      setFilteredRecords(validatedRecords);
      setFilterOptions({
        filieres: Array.isArray(optionsData.filieres) ? optionsData.filieres : [],
        vagues: Array.isArray(optionsData.vagues) ? optionsData.vagues : [],
        modules: Array.isArray(optionsData.modules) ? optionsData.modules : [],
        teachers: Array.isArray(optionsData.teachers) ? optionsData.teachers : []
      });

      toast.success(recordsData.message || `${validatedRecords.length} enregistrements chargés avec succès`, {
        id: loadingToast
      });

    } catch (error) {
      console.error('Erreur détaillée:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur de chargement inconnue';
      
      toast.error(`Échec du chargement: ${errorMessage}`);
      
      // Réinitialiser les données en cas d'erreur
      setAttendanceRecords([]);
      setFilteredRecords([]);
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
      endDate.setHours(23, 59, 59);
      return recordDate >= startDate && recordDate <= endDate;
    });

    // Filtres supplémentaires
    if (filters.filiere !== "all") {
      filtered = filtered.filter(record => record.course.filiere === filters.filiere);
    }
    if (filters.vague !== "all") {
      filtered = filtered.filter(record => record.course.vague === filters.vague);
    }
    if (filters.module !== "all") {
      filtered = filtered.filter(record => record.course.subject === filters.module);
    }
    if (filters.teacher !== "all") {
      filtered = filtered.filter(record => record.teacher.name === filters.teacher);
    }
    if (filters.status !== "all") {
      filtered = filtered.filter(record => record.status === filters.status);
    }
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

  // EXPORT EXCEL
  const exportToExcel = () => {
    if (filteredRecords.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    const toastId = toast.loading('Export Excel en cours...');

    try {
      // Préparer les données
      const data = filteredRecords.map(record => ({
        'Date': formatFrenchDate(record.date),
        'Étudiant': record.student.name,
        'ID Étudiant': record.student.studentId,
        'Matière': record.course.subject,
        'Classe': record.course.className,
        'Filière': record.course.filiere,
        'Vague': record.course.vague,
        'Professeur': record.teacher.name,
        'Statut': record.status === "present" ? "Présent" : "Absent",
        'Justifié': record.justified ? "Oui" : "Non",
        'Motif': record.reason || "",
        'Semestre': record.semester,
        'Heure Début': record.course.startTime,
        'Heure Fin': record.course.endTime
      }));

      // Créer le workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Ajouter des métadonnées
      const metadata = [
        ["Rapport des Présences - Censeur"],
        [`Période: ${formatFrenchDate(filters.startDate)} - ${formatFrenchDate(filters.endDate)}`],
        [`Total: ${filteredRecords.length} enregistrements`],
        [`Présents: ${stats.presents} | Absents: ${stats.absents}`],
        [`Généré le: ${new Date().toLocaleDateString('fr-FR')}`],
        [""] // ligne vide
      ];

      XLSX.utils.sheet_add_aoa(ws, metadata, { origin: 'A1' });

      // Ajuster les largeurs de colonnes
      const colWidths = [
        { wch: 12 }, // Date
        { wch: 20 }, // Étudiant
        { wch: 15 }, // ID Étudiant
        { wch: 25 }, // Matière
        { wch: 20 }, // Classe
        { wch: 15 }, // Filière
        { wch: 12 }, // Vague
        { wch: 20 }, // Professeur
        { wch: 10 }, // Statut
        { wch: 10 }, // Justifié
        { wch: 30 }, // Motif
        { wch: 10 }, // Semestre
        { wch: 12 }, // Heure Début
        { wch: 12 }  // Heure Fin
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Présences');

      // Sauvegarder le fichier
      const fileName = `presences-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success(`Export réussi: ${data.length} enregistrements`, {
        id: toastId
      });

    } catch (error) {
      console.error('Erreur export:', error);
      toast.error('Erreur lors de l\'export Excel', {
        id: toastId
      });
    }
  };

  // EXPORT PDF
  const exportToPDF = () => {
    if (filteredRecords.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    const toastId = toast.loading('Génération du PDF en cours...');

    try {
      const doc = new jsPDF();
      
      // En-tête
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text("Rapport des Présences - Censeur", 14, 15);
      
      // Métadonnées
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Période: ${formatFrenchDate(filters.startDate)} - ${formatFrenchDate(filters.endDate)}`, 14, 25);
      doc.text(`Total: ${filteredRecords.length} enregistrements`, 14, 32);
      doc.text(`Présents: ${stats.presents} | Absents: ${stats.absents}`, 14, 39);
      doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 46);

      // Préparer les données du tableau
      const tableData = filteredRecords.map(record => [
        formatFrenchDate(record.date),
        record.student.name,
        record.student.studentId,
        record.course.subject,
        record.course.filiere,
        record.teacher.name,
        record.status === "present" ? "Présent" : "Absent",
        record.justified ? "Oui" : "Non"
      ]);

      // Créer le tableau
      autoTable(doc, {
        head: [['Date', 'Étudiant', 'ID', 'Matière', 'Filière', 'Professeur', 'Statut', 'Justifié']],
        body: tableData,
        startY: 55,
        styles: { 
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: { 
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        }
      });

      // Sauvegarder
      const fileName = `presences-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast.success('PDF généré avec succès!', {
        id: toastId
      });

    } catch (error) {
      console.error('Erreur PDF:', error);
      toast.error('Erreur lors de la génération du PDF', {
        id: toastId
      });
    }
  };

  // IMPORT EXCEL
  const handleImport = async () => {
    if (!importFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    const toastId = toast.loading('Import en cours...');

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Ici vous traiteriez les données importées
          console.log('Données importées:', jsonData);

          // Simuler un traitement
          await new Promise(resolve => setTimeout(resolve, 2000));

          toast.success(`${jsonData.length} enregistrements importés avec succès`, {
            id: toastId
          });

          setShowImportModal(false);
          setImportFile(null);

          // Recharger les données
          fetchAttendanceData();

        } catch (error) {
          console.error('Erreur traitement fichier:', error);
          toast.error('Erreur lors du traitement du fichier', {
            id: toastId
          });
        }
      };

      reader.readAsArrayBuffer(importFile);

    } catch (error) {
      console.error('Erreur import:', error);
      toast.error('Erreur lors de l\'import', {
        id: toastId
      });
    }
  };

  // IMPRIMER
  const handlePrint = () => {
    if (filteredRecords.length === 0) {
      toast.error('Aucune donnée à imprimer');
      return;
    }

    toast.loading('Préparation de l\'impression...');
    
    setTimeout(() => {
      window.print();
      toast.success('Document prêt pour l\'impression!');
    }, 1000);
  };

  // Fonctions utilitaires
  const formatFrenchDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const resetFilters = () => {
    setFilters({
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      filiere: "all",
      vague: "all",
      module: "all",
      teacher: "all",
      status: "all",
      justification: "all"
    });
    toast.success('Filtres réinitialisés');
  };

  const showRecordDetails = (record: AttendanceRecord) => {
    toast.success(
      <div className="text-sm">
        <div className="font-semibold mb-2">Détails de présence</div>
        <div><strong>Étudiant:</strong> {record.student.name}</div>
        <div><strong>Matière:</strong> {record.course.subject}</div>
        <div><strong>Date:</strong> {formatFrenchDate(record.date)}</div>
        <div><strong>Statut:</strong> {record.status === "present" ? "Présent" : "Absent"}</div>
        {record.reason && <div><strong>Motif:</strong> {record.reason}</div>}
      </div>,
      { duration: 5000 }
    );
  };

  // Charger les données au démarrage
  useEffect(() => {
    console.log('🔍 Début du chargement des données...');
    fetchAttendanceData();
  }, []);

  if (isLoading) {
    return <AttendanceSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tableau de Bord des Présences - Censeur
          </h1>
          <p className="text-gray-600">
            Supervision de toutes les présences des étudiants
          </p>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Présences</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FaUsers className="text-blue-600 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
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
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
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
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
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
            </CardContent>
          </Card>
        </div>

        {/* Barre d'outils */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <FaFilter />
                  Filtres {showFilters ? "▲" : "▼"}
                </Button>

                <Button
                  onClick={fetchAttendanceData}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FaSync className={isLoading ? "animate-spin" : ""} />
                  Actualiser
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <FaDownload />
                      Exporter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white" align="end">
                    <DropdownMenuItem onClick={exportToExcel} className="flex items-center gap-2 cursor-pointer">
                      <FaFileExcel className="text-green-600" />
                      Excel (.xlsx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToPDF} className="flex items-center gap-2 cursor-pointer">
                      <FaFileExcel className="text-red-600" />
                      PDF (.pdf)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      Période
                    </Label>
                    <div className="space-y-2">
                      <Input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                      <Input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Filière et Vague */}
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      Filière
                    </Label>
                    <Select value={filters.filiere} onValueChange={(value) => setFilters(prev => ({ ...prev, filiere: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les filières" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Toutes les filières</SelectItem>
                        {filterOptions.filieres.map(filiere => (
                          <SelectItem key={filiere} value={filiere}>{filiere}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      Vague
                    </Label>
                    <Select value={filters.vague} onValueChange={(value) => setFilters(prev => ({ ...prev, vague: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les vagues" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Toutes les vagues</SelectItem>
                        {filterOptions.vagues.map(vague => (
                          <SelectItem key={vague} value={vague}>{vague}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Module et Professeur */}
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      Module
                    </Label>
                    <Select value={filters.module} onValueChange={(value) => setFilters(prev => ({ ...prev, module: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les modules" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Tous les modules</SelectItem>
                        {filterOptions.modules.map(module => (
                          <SelectItem key={module} value={module}>{module}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      Professeur
                    </Label>
                    <Select value={filters.teacher} onValueChange={(value) => setFilters(prev => ({ ...prev, teacher: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les professeurs" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Tous les professeurs</SelectItem>
                        {filterOptions.teachers.map(teacher => (
                          <SelectItem key={teacher} value={teacher}>{teacher}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Statut et Justification */}
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      Statut
                    </Label>
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les statuts" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="present">Présents uniquement</SelectItem>
                        <SelectItem value="absent">Absents uniquement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      Justification
                    </Label>
                    <Select value={filters.justification} onValueChange={(value) => setFilters(prev => ({ ...prev, justification: value as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les absences" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Toutes les absences</SelectItem>
                        <SelectItem value="justified">Justifiées uniquement</SelectItem>
                        <SelectItem value="unjustified">Non justifiées uniquement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Boutons de contrôle des filtres */}
                <div className="flex justify-end gap-3 mt-4">
                  <Button
                    onClick={resetFilters}
                    variant="outline"
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tableau des présences */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Présences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FaUsers className="mx-auto text-4xl text-gray-300 mb-4" />
                  <p>Aucune donnée de présence trouvée</p>
                  <p className="text-sm text-gray-400 mt-2 mb-4">
                    Ajustez vos filtres ou réessayez de charger les données
                  </p>
                  <Button
                    onClick={fetchAttendanceData}
                    variant="outline"
                    className="flex items-center gap-2 mx-auto"
                  >
                    <FaSync />
                    Réessayer
                  </Button>
                </div>
              ) : (
                filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-4"
                  >
                    <div className="flex-shrink-0">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FaIdCard className="text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {record.student.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline">
                              {record.course.filiere}
                            </Badge>
                            <span className="text-sm font-medium text-gray-700">{record.course.vague}</span>
                            <span className="text-sm text-gray-600">{record.student.studentId}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-center">
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
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 lg:gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FaChalkboardTeacher className="text-blue-600 flex-shrink-0" />
                          <span className="font-medium">{record.course.subject}</span>
                        </div>
                        <div className="hidden sm:block text-gray-300">•</div>
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-green-600 flex-shrink-0" />
                          <span>{formatFrenchDate(record.date)}</span>
                        </div>
                        <div className="hidden sm:block text-gray-300">•</div>
                        <div className="flex items-center gap-2">
                          <FaClock className="text-red-600 flex-shrink-0" />
                          <span>{record.course.startTime} - {record.course.endTime}</span>
                        </div>
                      </div>
                      {record.reason && (
                        <div className="text-xs text-gray-500 mt-2 max-w-xs">
                          {record.reason}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}