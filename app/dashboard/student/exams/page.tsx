"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { FaAward, FaChartLine, FaArrowDown, FaClipboardList, FaFilter, FaDownload, FaFilePdf, FaFileExcel, FaFileCsv, FaPrint } from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import toast, { Toaster } from "react-hot-toast";

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

/* ---------- Composant Skeleton ---------- */

const GradesSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-10">
      <div className="p-4 sm:p-6 space-y-6">
        {/* En-tête Skeleton */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-9 w-32" />
            </div>
          </CardHeader>
        </Card>

        {/* Résumé Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tableau Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-40" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-64 mx-auto" />
            
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <div className="min-w-[720px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                      <TableHead><Skeleton className="h-4 w-16 mx-auto" /></TableHead>
                      {[...Array(6)].map((_, index) => (
                        <TableHead key={index}><Skeleton className="h-4 w-12 mx-auto" /></TableHead>
                      ))}
                      <TableHead><Skeleton className="h-4 w-16 mx-auto" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(5)].map((_, rowIndex) => (
                      <TableRow key={rowIndex}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                        {[...Array(6)].map((_, cellIndex) => (
                          <TableCell key={cellIndex}><Skeleton className="h-6 w-12 mx-auto" /></TableCell>
                        ))}
                        <TableCell><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
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

/* ---------- Hook utilitaire ---------- */

const useGradeData = (grades: GradeDetail[]) =>
  useMemo(() => {
    const moduleMap: Record<string, ModuleMapEntry> = {};
    let totalWeightedGradeSum = 0;
    let totalCoefficientSum = 0;
    const allExamTitles = new Set<string>();

    grades.forEach((g) => {
      if (!moduleMap[g.module]) {
        moduleMap[g.module] = {
          grades: [],
          totalWeightedGrade: 0,
          totalCoefficient: 0,
          moduleCoefficient: g.coefficient,
        };
      }

      const moduleData = moduleMap[g.module];

      const title = g.key;
      allExamTitles.add(title);

      const withTitle: GradeDetailWithTitle = { ...g, title };
      moduleData.grades.push(withTitle);

      // Ne compter que les notes > 0 (notes existantes)
      if (g.grade > 0) {
        moduleData.totalWeightedGrade += g.grade * g.coefficient;
        moduleData.totalCoefficient += g.coefficient;
      }
    });

    const modulesList = Object.keys(moduleMap).sort();

    const finalData: FinalRow[] = modulesList.map((moduleName) => {
      const data = moduleMap[moduleName];

      const moduleAvg = data.totalCoefficient > 0 ? data.totalWeightedGrade / data.totalCoefficient : 0;

      if (moduleAvg > 0) {
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
        const order = ["I", "D", "C"];
        return order.indexOf(typeA) - order.indexOf(typeB);
      }
      return getIndex(a) - getIndex(b);
    });

    return { finalData, generalAverage, sortedExamTitles };
  }, [grades]);

/* ---------- Composant principal ---------- */

const StudentExams: React.FC = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [selectedSemestre, setSelectedSemestre] = useState<string>("all");

  // Fetch data from API
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/student/grades');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de la récupération des notes');
        }
        
        if (data.success) {
          setApiData(data);
          // Sélectionner le premier semestre par défaut si disponible
          if (data.allSemestres.length > 0) {
            setSelectedSemestre(data.allSemestres[0]);
          }
        } else {
          throw new Error('Données invalides reçues du serveur');
        }
      } catch (err) {
        console.error('Erreur fetch:', err);
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, []);

  // FONCTIONS D'EXPORT
  const exportToPDF = () => {
    if (!apiData || apiData.detailedGrades.length === 0) {
      toast.error("Aucune donnée à exporter en PDF");
      return;
    }

    const toastId = toast.loading("Génération du PDF en cours...");

    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        // En-tête du document
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text(`Relevé de Notes - ${apiData.studentData.studentName}`, 14, 15);
        
        // Informations de l'étudiant
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(`Filière: ${apiData.studentData.filiere}`, 14, 25);
        doc.text(`Classe: ${apiData.studentData.studentClass}`, 14, 32);
        doc.text(`Vague: ${apiData.studentData.vague}`, 14, 39);
        doc.text(`Moyenne Générale: ${apiData.generalAverage.toFixed(2)}/20`, 14, 46);
        doc.text(`Statut: ${apiData.studentData.studentStatus}`, 14, 53);
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 60);
        
        // Préparation des données du tableau
        const { finalData, sortedExamTitles } = useGradeData(apiData.detailedGrades);
        
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
          ...sortedExamTitles.map(titleKey => {
            if (titleKey.startsWith("I")) return `Interro ${titleKey.substring(1)}`;
            if (titleKey.startsWith("D")) return `Devoir ${titleKey.substring(1)}`;
            if (titleKey.startsWith("C")) return `Comp. ${titleKey.substring(1)}`;
            return titleKey;
          }), 
          'Moyenne'
        ];

        // Tableau principal
        autoTable(doc, {
          head: [headers],
          body: tableData,
          startY: 70,
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
          margin: { top: 70 },
          theme: 'grid'
        });

        // Résumé statistique
        const summaryY = (doc as any).lastAutoTable.finalY + 15;
        if (summaryY < 250) {
          doc.setFontSize(12);
          doc.setTextColor(40, 40, 40);
          doc.text("Résumé Statistique", 14, summaryY);
          
          const summaryData = [
            ['Total Modules', apiData.allModules.length.toString()],
            ['Moyenne Générale', apiData.generalAverage.toFixed(2)],
            ['Semestres', apiData.allSemestres.join(', ')],
            ['Statut', apiData.studentData.studentStatus]
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
            `Page ${i} / ${pageCount} - Relevé de notes ${apiData.studentData.studentName}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }

        // Sauvegarde du fichier
        const fileName = `releve-notes-${apiData.studentData.studentName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        toast.success("PDF généré avec succès!", {
          icon: "📄",
          id: toastId
        });
        
      } catch (error) {
        console.error("Erreur lors de l'export PDF:", error);
        toast.error("Erreur lors de la génération du PDF", {
          icon: "❌",
          id: toastId
        });
      }
    }, 2000);
  };

  const exportToExcel = () => {
    if (!apiData || apiData.detailedGrades.length === 0) {
      toast.error("Aucune donnée à exporter en Excel");
      return;
    }

    const toastId = toast.loading("Export Excel en cours...");

    setTimeout(() => {
      try {
        const { finalData, sortedExamTitles } = useGradeData(apiData.detailedGrades);
        
        // Préparation des données
        const data = finalData.map(moduleData => {
          const row: any = {
            'Module': moduleData.module,
            'Coefficient': moduleData.coefficient,
          };

          // Ajouter chaque examen
          sortedExamTitles.forEach(titleKey => {
            const note = moduleData.notes[titleKey];
            const formattedTitle = titleKey.startsWith("I") ? `Interro ${titleKey.substring(1)}` :
                                titleKey.startsWith("D") ? `Devoir ${titleKey.substring(1)}` :
                                titleKey.startsWith("C") ? `Comp. ${titleKey.substring(1)}` : titleKey;
            row[formattedTitle] = note && note.grade > 0 ? note.grade : '';
          });

          row['Moyenne Module'] = moduleData.moduleAvg > 0 ? moduleData.moduleAvg : '';
          
          return row;
        });

        // Création du workbook
        const wb = utils.book_new();
        
        // Feuille principale
        const ws = utils.json_to_sheet(data);
        
        // En-têtes et métadonnées
        const metadata = [
          [`Relevé de Notes - ${apiData.studentData.studentName}`],
          [`Filière: ${apiData.studentData.filiere}`],
          [`Classe: ${apiData.studentData.studentClass}`],
          [`Vague: ${apiData.studentData.vague}`],
          [`Moyenne Générale: ${apiData.generalAverage.toFixed(2)}/20`],
          [`Statut: ${apiData.studentData.studentStatus}`],
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
        const fileName = `releve-notes-${apiData.studentData.studentName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;
        writeFile(wb, fileName);
        
        toast.success("Fichier Excel exporté!", {
          icon: "📊",
          id: toastId
        });
        
      } catch (error) {
        console.error("Erreur lors de l'export Excel:", error);
        toast.error("Erreur lors de l'export Excel", {
          icon: "❌",
          id: toastId
        });
      }
    }, 1500);
  };

  const exportToCSV = () => {
    if (!apiData || apiData.detailedGrades.length === 0) {
      toast.error("Aucune donnée à exporter en CSV");
      return;
    }

    const toastId = toast.loading("Export CSV en cours...");

    setTimeout(() => {
      try {
        const { finalData, sortedExamTitles } = useGradeData(apiData.detailedGrades);
        
        const headers = [
          'Module',
          'Coefficient',
          ...sortedExamTitles.map(titleKey => {
            if (titleKey.startsWith("I")) return `Interro ${titleKey.substring(1)}`;
            if (titleKey.startsWith("D")) return `Devoir ${titleKey.substring(1)}`;
            if (titleKey.startsWith("C")) return `Comp. ${titleKey.substring(1)}`;
            return titleKey;
          }),
          'Moyenne Module'
        ];
        
        const csvContent = [
          `Relevé de Notes - ${apiData.studentData.studentName}`,
          `Filière: ${apiData.studentData.filiere}`,
          `Classe: ${apiData.studentData.studentClass}`,
          `Moyenne Générale: ${apiData.generalAverage.toFixed(2)}/20`,
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
        link.setAttribute('download', `releve-notes-${apiData.studentData.studentName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Fichier CSV généré!", {
          icon: "📋",
          id: toastId
        });
        
      } catch (error) {
        console.error("Erreur lors de l'export CSV:", error);
        toast.error("Erreur lors de l'export CSV", {
          icon: "❌",
          id: toastId
        });
      }
    }, 1000);
  };

  const handlePrint = () => {
    toast.loading("Préparation de l'impression...");
    
    setTimeout(() => {
      window.print();
      toast.success("Document prêt pour l'impression!", {
        icon: "🖨️"
      });
    }, 1000);
  };

  // Filtrage des données
  const filteredDetailedGrades = useMemo(() => {
    if (!apiData) return [];
    
    return selectedSemestre === "all" 
      ? apiData.detailedGrades 
      : apiData.detailedGrades.filter(grade => grade.semestre === selectedSemestre);
  }, [apiData, selectedSemestre]);

  const { finalData, generalAverage, sortedExamTitles } = useGradeData(filteredDetailedGrades);

  const getGradeColor = (grade: number) => {
    if (grade === 0) return "bg-gray-100 text-gray-600 border-gray-200"; // Note manquante
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

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: React.ComponentType<{ className?: string }> } = {
      "FaAward": FaAward,
      "FaChartLine": FaChartLine,
      "FaArrowDown": FaArrowDown,
      "FaClipboardList": FaClipboardList,
    };
    return icons[iconName] || FaAward;
  };

  // Afficher le skeleton pendant le chargement
  if (loading) {
    return <GradesSkeleton />;
  }

  // Afficher l'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-10 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Aucune donnée
  if (!apiData) {
    return (
      <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-10 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <div className="text-gray-500 text-6xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Aucune donnée</h2>
            <p className="text-gray-600">Aucune note disponible pour le moment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 4000,
          },
        }}
      />
      
      <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-10">
        <div className="p-4 sm:p-6 space-y-6">
          {/* En-tête */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-2xl sm:text-3xl font-bold truncate">
                    Examens & Notes - {apiData.studentData.studentName}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    {apiData.studentData.filiere} • {apiData.studentData.vague}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <FaDownload className="w-4 h-4 mr-2" />
                        Exporter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
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
              </div>
            </CardHeader>
          </Card>

          {/* Résumé */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {apiData.gradesSummary.map((item, index) => {
              const Icon = getIconComponent(item.icon);
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

          {/* Tableau détaillé */}
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <span className="flex items-center gap-2 min-w-0">
                  <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span className="truncate">Relevé de Notes Détaillé</span>
                </span>

                <div className="min-w-[120px] sm:min-w-[200px]">
                  <Select onValueChange={setSelectedSemestre} value={selectedSemestre}>
                    <SelectTrigger className="bg-white">
                      <div className="flex items-center">
                        <FaFilter className="w-3 h-3 text-gray-400 mr-2" />
                        <SelectValue placeholder="Choisir un semestre" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">Tous les semestres</SelectItem>
                      {apiData.allSemestres.map((sem) => (
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
                  <Badge className={`ml-2 text-xl py-1 px-3 ${getGradeColor(generalAverage)}`}>
                    {generalAverage > 0 ? generalAverage.toFixed(2) : "N/A"}
                  </Badge>
                </div>
              </div>

              {finalData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucune note disponible pour ce semestre.
                </div>
              ) : (
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
                            <TableCell className="font-medium sticky left-0 text-sm sm:text-base truncate bg-white">
                              {moduleData.module}
                            </TableCell>

                            <TableCell className="text-center font-medium text-gray-700 bg-gray-50/50 text-sm">
                              {moduleData.coefficient}
                            </TableCell>

                            {sortedExamTitles.map((titleKey) => {
                              const note = moduleData.notes[titleKey];
                              const grade = note?.grade || 0;

                              return (
                                <TableCell key={titleKey} className="text-center border-l border-gray-100 p-2">
                                  {grade > 0 ? (
                                    <Badge className={`px-2 py-1 text-xs sm:text-sm ${getGradeColor(grade)}`}>
                                      {grade.toFixed(1)}
                                    </Badge>
                                  ) : (
                                    <span className="text-gray-400 text-xs sm:text-sm">-</span>
                                  )}
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default StudentExams;