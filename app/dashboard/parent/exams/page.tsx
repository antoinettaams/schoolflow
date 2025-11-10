"use client";

import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  FaAward,
  FaChartLine,
  FaArrowDown,
  FaClipboardList,
  FaFilter,
  FaDownload,
  FaFilePdf,
  FaFileExcel,
  FaFileCsv,
  FaPrint,
} from "react-icons/fa";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import des bibliothèques d'export
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';

/* ---------- Types ---------- */

type ExamType = "Interrogation" | "Devoir" | "Composition";

interface GradeDetail {
  module: string;
  examType: ExamType;
  grade: number;
  coefficient: number;
  key: string;
  semestre: string;
}

interface GradeSummaryItem {
  title: string;
  value: string;
  icon: string;
  color: string;
  description: string;
}

interface GradeDetailWithTitle extends GradeDetail {
  title: string;
}

interface ModuleMapEntry {
  grades: GradeDetailWithTitle[];
  totalWeightedGrade: number;
  totalCoefficient: number;
  moduleCoefficient: number;
}

interface FinalRow {
  module: string;
  moduleAvg: number;
  coefficient: number;
  notes: Record<string, { grade: number; coefficient: number }>;
}

interface StudentData {
  studentName: string;
  studentClass: string;
  studentStatus: "inscrit" | "non-inscrit";
  filiere: string;
  vague: string;
}

interface ApiResponse {
  studentData: StudentData;
  gradesSummary: GradeSummaryItem[];
  detailedGrades: GradeDetail[];
  generalAverage: number;
  allSemestres: string[];
  allModules: string[];
  success: boolean;
}

/* ---------- SVG Icons ---------- */

const FileText = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

/* ---------- Hook utilitaire ---------- */

const useGradeData = (grades: GradeDetail[]) =>
  useMemo(() => {
    const moduleMap: Record<string, ModuleMapEntry> = {};
    let totalWeightedGradeSum = 0;
    let totalCoefficientSum = 0;
    const allExamTitles = new Set<string>();

    // Initialiser tous les modules avec des données vides
    const allModules = Array.from(new Set(grades.map(g => g.module)));
    allModules.forEach(module => {
      moduleMap[module] = {
        grades: [],
        totalWeightedGrade: 0,
        totalCoefficient: 0,
        moduleCoefficient: grades.find(g => g.module === module)?.coefficient || 1,
      };
    });

    grades.forEach((g) => {
      const moduleData = moduleMap[g.module];
      const title = g.key;
      allExamTitles.add(title);

      const withTitle: GradeDetailWithTitle = { ...g, title };
      moduleData.grades.push(withTitle);

      // Ne compter que les notes existantes (grade > 0)
      if (g.grade > 0) {
        moduleData.totalWeightedGrade += g.grade * g.coefficient;
        moduleData.totalCoefficient += g.coefficient;
      }
    });

    const modulesList = Object.keys(moduleMap).sort();

    const finalData: FinalRow[] = modulesList.map((moduleName) => {
      const data = moduleMap[moduleName];

      // Calculer la moyenne seulement si des notes existent
      const moduleAvg = data.totalCoefficient > 0 ? data.totalWeightedGrade / data.totalCoefficient : 0;

      if (data.totalCoefficient > 0) {
        totalWeightedGradeSum += data.totalWeightedGrade;
        totalCoefficientSum += data.totalCoefficient;
      }

      const row: FinalRow = {
        module: moduleName,
        moduleAvg,
        coefficient: data.moduleCoefficient,
        notes: {},
      };

      data.grades.forEach((g) => {
        row.notes[g.title] = { grade: g.grade, coefficient: g.coefficient };
      });

      return row;
    });

    const generalAverage = totalCoefficientSum > 0 ? totalWeightedGradeSum / totalCoefficientSum : 0;

    const sortedExamTitles = Array.from(allExamTitles).sort((a, b) => {
      const getType = (s: string) => s.match(/^([A-Z])/i)?.[1] ?? "";
      const getIndex = (s: string) => parseInt(s.match(/(\d+)/)?.[1] || "99", 10);

      const typeA = getType(a).toUpperCase();
      const typeB = getType(b).toUpperCase();

      if (typeA !== typeB) {
        const order = ["I", "D", "C", "P"];
        return order.indexOf(typeA) - order.indexOf(typeB);
      }
      return getIndex(a) - getIndex(b);
    });

    return { finalData, generalAverage, sortedExamTitles };
  }, [grades]);

// Mapping des icônes
const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  FaAward,
  FaChartLine,
  FaArrowDown,
  FaClipboardList,
};

/* ---------- Composant principal ---------- */

const ParentExams: React.FC = () => {
  const [selectedSemestre, setSelectedSemestre] = useState<string>("all");
  const [showFullCoeff] = useState<boolean>(false);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [gradesSummary, setGradesSummary] = useState<GradeSummaryItem[]>([]);
  const [detailedGrades, setDetailedGrades] = useState<GradeDetail[]>([]);
  const [generalAverage, setGeneralAverage] = useState<number>(0);
  const [allSemestres, setAllSemestres] = useState<string[]>([]);
  const [allModules, setAllModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Charger les données depuis l'API
  const fetchGradesData = async () => {
    try {
      setIsLoading(true);
      const loadingToast = toast.loading("Chargement des notes...");

      const response = await fetch('/api/parents/grades');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Erreur lors du chargement');
      }

      const data: ApiResponse = await response.json();
      
      setStudentData(data.studentData);
      setGradesSummary(data.gradesSummary);
      setDetailedGrades(data.detailedGrades);
      setGeneralAverage(data.generalAverage);
      setAllSemestres(data.allSemestres);
      setAllModules(data.allModules);

      toast.success("Notes chargées avec succès!", {
        description: `${data.allModules.length} modules trouvés`,
        id: loadingToast
      });

    } catch (error) {
      console.error("Erreur lors du chargement des notes:", error);
      toast.error("Erreur lors du chargement des notes", {
        description: error instanceof Error ? error.message : "Erreur inconnue"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGradesData();
  }, []);

  // FONCTIONS D'EXPORT
  const exportToPDF = () => {
    if (!studentData || detailedGrades.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const toastId = toast.loading("Génération du PDF en cours...");

    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        // En-tête du document
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text(`Relevé de Notes - ${studentData.studentName}`, 14, 15);
        
        // Informations de l'étudiant
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(`Filière: ${studentData.filiere}`, 14, 25);
        doc.text(`Classe: ${studentData.studentClass}`, 14, 32);
        doc.text(`Vague: ${studentData.vague}`, 14, 39);
        doc.text(`Moyenne Générale: ${generalAverage.toFixed(2)}/20`, 14, 46);
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 53);
        
        // Préparation des données du tableau
        const { finalData, sortedExamTitles } = useGradeData(detailedGrades);
        
        const tableData = finalData.map(moduleData => {
          const row = [
            moduleData.module,
            moduleData.coefficient.toString(),
            ...sortedExamTitles.map(titleKey => {
              const note = moduleData.notes[titleKey];
              return note && note.grade > 0 ? note.grade.toFixed(1) : '-';
            }),
            moduleData.moduleAvg > 0 ? moduleData.moduleAvg.toFixed(2) : '-'
          ];
          return row;
        });

        // En-têtes du tableau
        const headers = [
          'Module', 
          'Coeff', 
          ...sortedExamTitles.map(formatExamTitle), 
          'Moyenne'
        ];

        // Tableau principal
        autoTable(doc, {
          head: [headers],
          body: tableData,
          startY: 65,
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
          },
          margin: { top: 65 },
          theme: 'grid'
        });

        // Résumé statistique
        const summaryY = (doc as any).lastAutoTable.finalY + 15;
        if (summaryY < 250) {
          doc.setFontSize(12);
          doc.setTextColor(40, 40, 40);
          doc.text("Résumé Statistique", 14, summaryY);
          
          const summaryData = [
            ['Total Modules', allModules.length.toString()],
            ['Moyenne Générale', generalAverage.toFixed(2)],
            ['Statut', studentData.studentStatus],
            ['Semestres', allSemestres.join(', ')]
          ];

          autoTable(doc, {
            body: summaryData,
            startY: summaryY + 5,
            styles: { fontSize: 9 },
            columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 60 },
              1: { cellWidth: 40 }
            },
            margin: { top: 10 }
          });
        }

        // Pied de page
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${i} / ${pageCount} - Relevé de notes ${studentData.studentName}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }

        // Sauvegarde du fichier
        const fileName = `releve-notes-${studentData.studentName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        toast.success("PDF généré avec succès!", {
          description: "Le fichier a été téléchargé",
          id: toastId
        });
        
      } catch (error) {
        console.error("Erreur lors de l'export PDF:", error);
        toast.error("Erreur lors de la génération du PDF", {
          description: "Veuillez réessayer",
          id: toastId
        });
      }
    }, 1500);
  };

  const exportToExcel = () => {
    if (!studentData || detailedGrades.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const toastId = toast.loading("Export Excel en cours...");

    setTimeout(() => {
      try {
        const { finalData, sortedExamTitles } = useGradeData(detailedGrades);
        
        // Préparation des données
        const data = finalData.map(moduleData => {
          const row: any = {
            'Module': moduleData.module,
            'Coefficient': moduleData.coefficient,
          };

          // Ajouter chaque examen
          sortedExamTitles.forEach(titleKey => {
            const note = moduleData.notes[titleKey];
            row[formatExamTitle(titleKey)] = note && note.grade > 0 ? note.grade : '-';
          });

          row['Moyenne Module'] = moduleData.moduleAvg > 0 ? moduleData.moduleAvg : '-';
          
          return row;
        });

        // Création du workbook
        const wb = utils.book_new();
        
        // Feuille principale
        const ws = utils.json_to_sheet(data);
        
        // En-têtes et métadonnées
        const metadata = [
          [`Relevé de Notes - ${studentData.studentName}`],
          [`Filière: ${studentData.filiere}`],
          [`Classe: ${studentData.studentClass}`],
          [`Vague: ${studentData.vague}`],
          [`Moyenne Générale: ${generalAverage.toFixed(2)}/20`],
          [`Statut: ${studentData.studentStatus}`],
          [`Généré le: ${new Date().toLocaleDateString('fr-FR')}`],
          [] // ligne vide
        ];
        
        utils.sheet_add_aoa(ws, metadata, { origin: 'A1' });
        
        // Ajuster la largeur des colonnes
        const colWidths = [
          { wch: 25 }, // Module
          { wch: 12 }, // Coefficient
          ...sortedExamTitles.map(() => ({ wch: 15 })), // Examens
          { wch: 15 }  // Moyenne
        ];
        ws['!cols'] = colWidths;

        utils.book_append_sheet(wb, ws, 'Relevé de Notes');

        // Sauvegarde
        const fileName = `releve-notes-${studentData.studentName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;
        writeFile(wb, fileName);
        
        toast.success("Fichier Excel exporté!", {
          description: "Le fichier a été téléchargé",
          id: toastId
        });
        
      } catch (error) {
        console.error("Erreur lors de l'export Excel:", error);
        toast.error("Erreur lors de l'export Excel", {
          description: "Veuillez réessayer",
          id: toastId
        });
      }
    }, 1000);
  };

  const exportToCSV = () => {
    if (!studentData || detailedGrades.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const toastId = toast.loading("Export CSV en cours...");

    setTimeout(() => {
      try {
        const { finalData, sortedExamTitles } = useGradeData(detailedGrades);
        
        const headers = [
          'Module',
          'Coefficient',
          ...sortedExamTitles.map(formatExamTitle),
          'Moyenne Module'
        ];
        
        const csvContent = [
          `Relevé de Notes - ${studentData.studentName}`,
          `Filière: ${studentData.filiere}`,
          `Classe: ${studentData.studentClass}`,
          `Moyenne Générale: ${generalAverage.toFixed(2)}/20`,
          `Généré le: ${new Date().toLocaleDateString('fr-FR')}`,
          '',
          headers.join(','),
          ...finalData.map(moduleData => {
            const row = [
              `"${moduleData.module}"`,
              moduleData.coefficient,
              ...sortedExamTitles.map(titleKey => {
                const note = moduleData.notes[titleKey];
                return note && note.grade > 0 ? note.grade.toFixed(1) : '';
              }),
              moduleData.moduleAvg > 0 ? moduleData.moduleAvg.toFixed(2) : ''
            ];
            return row.join(',');
          })
        ].join('\n');

        // Création et téléchargement du fichier
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `releve-notes-${studentData.studentName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Fichier CSV généré!", {
          description: "Le fichier a été téléchargé",
          id: toastId
        });
        
      } catch (error) {
        console.error("Erreur lors de l'export CSV:", error);
        toast.error("Erreur lors de l'export CSV", {
          description: "Veuillez réessayer",
          id: toastId
        });
      }
    }, 800);
  };

  const handlePrint = () => {
    toast.info("Impression en cours de préparation...", {
      description: "Ouverture de la fenêtre d'impression"
    });
    
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const filteredDetailedGrades = useMemo(
    () => detailedGrades.filter((grade) => selectedSemestre === "all" || grade.semestre === selectedSemestre),
    [selectedSemestre, detailedGrades]
  );

  const { finalData, generalAverage: filteredAverage, sortedExamTitles } = useGradeData(filteredDetailedGrades);

  const getGradeColor = (grade: number) => {
    if (grade === 0) return "bg-gray-100 text-gray-500 border-gray-200"; // Pas de note
    if (grade >= 16) return "bg-green-100 text-green-800 border-green-200";
    if (grade >= 14) return "bg-blue-100 text-blue-800 border-blue-200";
    if (grade >= 12) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const formatExamTitle = (titleKey: string) => {
    if (titleKey.startsWith("I")) return `Interro ${titleKey.substring(1)}`;
    if (titleKey.startsWith("D")) return `Devoir ${titleKey.substring(1)}`;
    if (titleKey.startsWith("C")) return `Comp. ${titleKey.substring(1)}`;
    return titleKey;
  };

  const formatGradeDisplay = (grade: number) => {
    return grade === 0 ? "-" : grade.toFixed(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-10">
        <div className="p-4 sm:p-6 space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded mt-6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-10">
      <div className="p-4 sm:p-6 space-y-6">
        {/* En-tête avec bouton d'export */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex-1">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Examens & Notes
            </CardTitle>
            <CardDescription className="text-lg">
              Élève : 
              <span className="font-semibold text-gray-700 ml-2">
                {studentData?.studentName || "Chargement..."}
              </span>
            </CardDescription>
          </div>
          
          {/* Menu d'export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="justify-center">
                <FaDownload className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white">
              <DropdownMenuItem 
                onClick={exportToPDF}
                className="flex items-center cursor-pointer"
              >
                <FaFilePdf className="w-4 h-4 mr-2 text-red-500" />
                <span>Export PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={exportToExcel}
                className="flex items-center cursor-pointer"
              >
                <FaFileExcel className="w-4 h-4 mr-2 text-green-500" />
                <span>Export Excel</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={exportToCSV}
                className="flex items-center cursor-pointer"
              >
                <FaFileCsv className="w-4 h-4 mr-2 text-blue-500" />
                <span>Export CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handlePrint}
                className="flex items-center cursor-pointer"
              >
                <FaPrint className="w-4 h-4 mr-2 text-gray-500" />
                <span>Imprimer</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Résumé des notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gradesSummary.map((item, index) => {
            const Icon = iconMap[item.icon] || FaAward;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-500 truncate">{item.title}</h3>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className={`text-2xl font-bold ${item.color} truncate`}>{item.value}</div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tableau détaillé des notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span className="flex items-center gap-2 min-w-0">
                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="truncate">Relevé de Notes Détaillé</span>
                <Badge variant="outline" className="ml-2">
                  {allModules.length} modules
                </Badge>
              </span>

              <div className="min-w-[120px] sm:min-w-[200px]">
                <Select onValueChange={(val) => setSelectedSemestre(val)} defaultValue={selectedSemestre}>
                  <SelectTrigger className="bg-white">
                    <div className="flex items-center">
                      <FaFilter className="w-3 h-3 text-gray-400 mr-2" />
                      <SelectValue placeholder="Choisir un semestre" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">Tous les semestres</SelectItem>
                    {allSemestres.map((sem) => (
                      <SelectItem key={sem} value={sem}>
                        Semestre {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex justify-center items-center border-b border-gray-100">
              <div className="font-bold text-gray-800 bg-blue-50/50 p-2 rounded-lg shadow-inner flex items-center gap-2 md:flex flex-col text-sm">
                <span className="whitespace-nowrap">
                  Moyenne Générale du {selectedSemestre !== "all" ? `Semestre ${selectedSemestre}` : "Global"} :
                </span>
                <Badge className={`ml-2 text-xl py-1 px-3 ${getGradeColor(filteredAverage)}`}>
                  {filteredAverage > 0 ? filteredAverage.toFixed(2) : "N/A"}
                </Badge>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <div className="min-w-[720px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-900 w-1/4">Module</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-center">Coefficient</TableHead>

                      {sortedExamTitles.map((titleKey) => (
                        <TableHead
                          key={titleKey}
                          className="text-center font-semibold text-gray-900 uppercase text-xs sm:text-sm border-l border-gray-200 min-w-[70px]"
                        >
                          {formatExamTitle(titleKey)}
                        </TableHead>
                      ))}

                      <TableHead className="text-center font-semibold text-gray-900 bg-blue-50/50 border-l border-gray-200 min-w-[120px]">
                        Moy. Module
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {finalData.map((moduleData) => (
                      <TableRow key={moduleData.module} className="hover:bg-gray-50">
                        <TableCell className="font-medium sticky left-0 text-sm sm:text-base truncate">
                          {moduleData.module}
                        </TableCell>

                        <TableCell className="text-center font-medium text-gray-700 bg-gray-50/50 text-sm">
                          {moduleData.coefficient}
                        </TableCell>

                        {sortedExamTitles.map((titleKey) => {
                          const note = moduleData.notes[titleKey];
                          const grade = note?.grade || 0;
                          const coeff = note?.coefficient;

                          return (
                            <TableCell key={titleKey} className="text-center border-l border-gray-100 p-2">
                              <Badge className={`px-2 py-1 text-xs sm:text-sm ${getGradeColor(grade)}`}>
                                {formatGradeDisplay(grade)}
                                {showFullCoeff && grade > 0 && <span className="ml-1 text-xs">({coeff})</span>}
                              </Badge>
                            </TableCell>
                          );
                        })}

                        <TableCell className="text-center bg-blue-50/20 border-l border-gray-200">
                          <Badge className={`font-bold text-sm sm:text-base ${getGradeColor(moduleData.moduleAvg)}`}>
                            {moduleData.moduleAvg > 0 ? moduleData.moduleAvg.toFixed(2) : "-"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentExams;