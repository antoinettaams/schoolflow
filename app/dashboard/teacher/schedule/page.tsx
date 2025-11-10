"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { 
  FaCalendarAlt, 
  FaClock, 
  FaChalkboardTeacher, 
  FaSync, 
  FaDownload, 
  FaFilter, 
  FaMapMarkerAlt,
  FaFilePdf,
  FaFileExcel,
  FaFileCsv,
  FaPrint
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import toast, { Toaster } from "react-hot-toast";

// Import des bibliothèques d'export
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';

// Interface pour les données de l'emploi du temps
interface ScheduleData {
  schedule: {
    [key: string]: Array<{ 
      time: string;
      subject: string;
      filiere: string;
      vague: string;
      type: string;
      classroom: string;
      studentsCount: number;
    }>;
  };
  totalCourses: number;
  lastUpdate: string;
}

export default function TeacherSchedulePage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  
  // États pour les données
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [selectedDay, setSelectedDay] = useState("all");
  const [selectedFiliere, setSelectedFiliere] = useState("all");
  const [selectedVague, setSelectedVague] = useState("all");
  const [selectedModule, setSelectedModule] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  
  // Charger les données de l'emploi du temps
  useEffect(() => {
    const loadScheduleData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/teacher/schedule');
        
        if (response.ok) {
          const data = await response.json();
          console.log("📊 Données reçues de l'API:", data);
          setScheduleData(data);
          setLastUpdate(new Date(data.lastUpdate).toLocaleTimeString('fr-FR'));
        } else {
          const errorText = await response.text();
          console.error('Erreur API:', response.status, errorText);
          setScheduleData(null);
        }
      } catch (error) {
        console.error('Erreur chargement emploi du temps:', error);
        setScheduleData(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (isSignedIn) {
      loadScheduleData();
    }
  }, [isSignedIn]);

  // Redirection si non connecté
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Utiliser les données réelles de l'API
  const teacherScheduleData = scheduleData?.schedule || {
    "Lundi": [],
    "Mardi": [],
    "Mercredi": [],
    "Jeudi": [],
    "Vendredi": [],
    "Samedi": []
  };

  // Extraire les filières, vagues et modules uniques des données RÉELLES
  const allCourses = Object.values(teacherScheduleData).flat();
  
  // Filtrer les valeurs vides ou non définies
  const filieres = [...new Set(allCourses
    .map(course => course.filiere)
    .filter(filiere => filiere && filiere !== "Filière non assignée")
  )];
  
  const vagues = [...new Set(allCourses
    .map(course => course.vague)
    .filter(vague => vague && vague !== "Vague 2024")
  )];
  
  const modules = [...new Set(allCourses
    .map(course => course.subject)
    .filter(subject => subject && subject !== "Module non assigné")
  )];

  // FONCTIONS D'EXPORT
  const exportToPDF = () => {
    if (!scheduleData || allCourses.length === 0) {
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
        doc.text("Emploi du Temps - Enseignant", 14, 15);
        
        // Informations générales
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(`Total des cours: ${scheduleData.totalCourses}`, 14, 25);
        doc.text(`Filières: ${filieres.length}`, 14, 32);
        doc.text(`Modules: ${modules.length}`, 14, 39);
        doc.text(`Dernière mise à jour: ${lastUpdate}`, 14, 46);
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 53);

        // Préparation des données du tableau
        const tableData = allCourses.map(course => {
          const day = Object.keys(teacherScheduleData).find(day => 
            teacherScheduleData[day as keyof typeof teacherScheduleData]?.includes(course)
          );
          
          return [
            day || 'N/A',
            course.time,
            course.subject,
            course.filiere,
            course.vague,
            course.type,
            course.classroom,
            course.studentsCount.toString()
          ];
        });

        // Tableau principal
        autoTable(doc, {
          head: [['Jour', 'Horaire', 'Module', 'Filière', 'Vague', 'Type', 'Salle', 'Étudiants']],
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

        // Résumé par jour
        const summaryY = (doc as any).lastAutoTable.finalY + 15;
        if (summaryY < 250) {
          doc.setFontSize(12);
          doc.setTextColor(40, 40, 40);
          doc.text("Résumé par Jour", 14, summaryY);
          
          const summaryData = days.map(day => [
            day,
            (teacherScheduleData[day as keyof typeof teacherScheduleData]?.length || 0).toString()
          ]);

          autoTable(doc, {
            body: summaryData,
            startY: summaryY + 5,
            styles: { fontSize: 9 },
            columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 60 },
              1: { cellWidth: 40, halign: 'center' }
            },
            head: [['Jour', 'Nombre de cours']],
            headStyles: { 
              fillColor: [16, 185, 129],
              textColor: 255
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
            `Page ${i} / ${pageCount} - Emploi du temps enseignant`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }

        // Sauvegarde du fichier
        const fileName = `emploi-du-temps-enseignant-${new Date().toISOString().split('T')[0]}.pdf`;
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
    if (!scheduleData || allCourses.length === 0) {
      toast.error("Aucune donnée à exporter en Excel");
      return;
    }

    const toastId = toast.loading("Export Excel en cours...");

    setTimeout(() => {
      try {
        // Préparation des données
        const data = allCourses.map(course => {
          const day = Object.keys(teacherScheduleData).find(day => 
            teacherScheduleData[day as keyof typeof teacherScheduleData]?.includes(course)
          );

          return {
            'Jour': day || 'N/A',
            'Horaire': course.time,
            'Module': course.subject,
            'Filière': course.filiere,
            'Vague': course.vague,
            'Type': course.type,
            'Salle': course.classroom,
            'Nombre d\'étudiants': course.studentsCount
          };
        });

        // Création du workbook
        const wb = utils.book_new();
        
        // Feuille principale
        const ws = utils.json_to_sheet(data);
        
        // En-têtes et métadonnées
        const metadata = [
          ["Emploi du Temps - Enseignant"],
          [`Total des cours: ${scheduleData.totalCourses}`],
          [`Filières: ${filieres.length}`],
          [`Modules: ${modules.length}`],
          [`Dernière mise à jour: ${lastUpdate}`],
          [`Généré le: ${new Date().toLocaleDateString('fr-FR')}`],
          [] // ligne vide
        ];
        
        utils.sheet_add_aoa(ws, metadata, { origin: 'A1' });
        
        // Ajuster la largeur des colonnes
        const colWidths = [
          { wch: 12 }, // Jour
          { wch: 15 }, // Horaire
          { wch: 25 }, // Module
          { wch: 20 }, // Filière
          { wch: 15 }, // Vague
          { wch: 12 }, // Type
          { wch: 15 }, // Salle
          { wch: 15 }  // Étudiants
        ];
        ws['!cols'] = colWidths;

        utils.book_append_sheet(wb, ws, 'Emploi du temps');

        // Feuille de résumé par jour
        const summaryData = days.map(day => ({
          'Jour': day,
          'Nombre de cours': teacherScheduleData[day as keyof typeof teacherScheduleData]?.length || 0
        }));
        
        const wsSummary = utils.json_to_sheet(summaryData);
        utils.book_append_sheet(wb, wsSummary, 'Résumé par jour');

        // Sauvegarde
        const fileName = `emploi-du-temps-enseignant-${new Date().toISOString().split('T')[0]}.xlsx`;
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
    if (!scheduleData || allCourses.length === 0) {
      toast.error("Aucune donnée à exporter en CSV");
      return;
    }

    const toastId = toast.loading("Export CSV en cours...");

    setTimeout(() => {
      try {
        const headers = ['Jour', 'Horaire', 'Module', 'Filière', 'Vague', 'Type', 'Salle', 'Étudiants'];
        
        const csvContent = [
          "Emploi du Temps - Enseignant",
          `Total des cours: ${scheduleData.totalCourses}`,
          `Généré le: ${new Date().toLocaleDateString('fr-FR')}`,
          '',
          headers.join(','),
          ...allCourses.map(course => {
            const day = Object.keys(teacherScheduleData).find(day => 
              teacherScheduleData[day as keyof typeof teacherScheduleData]?.includes(course)
            );
            
            return [
              `"${day || 'N/A'}"`,
              `"${course.time}"`,
              `"${course.subject}"`,
              `"${course.filiere}"`,
              `"${course.vague}"`,
              `"${course.type}"`,
              `"${course.classroom}"`,
              course.studentsCount
            ].join(',');
          })
        ].join('\n');

        // Création et téléchargement du fichier
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `emploi-du-temps-enseignant-${new Date().toISOString().split('T')[0]}.csv`);
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

  // Couleur du type de cours basée sur les types RÉELS
  const getTypeColor = (type: string) => {
    switch (type) {
      case "Cours":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "TP":
        return "bg-green-100 text-green-600 border-green-200";
      case "Projet":
        return "bg-purple-100 text-purple-600 border-purple-200";
      case "Théorique":
        return "bg-orange-100 text-orange-600 border-orange-200";
      case "Pratique":
        return "bg-red-100 text-red-600 border-red-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  // Couleur de la filière basée sur les filières RÉELLES
  const getFiliereColor = (filiere: string) => {
    // Générer une couleur basée sur le nom de la filière
    const colors = [
      "bg-blue-50 text-blue-700 border-blue-200",
      "bg-green-50 text-green-700 border-green-200",
      "bg-red-50 text-red-700 border-red-200",
      "bg-purple-50 text-purple-700 border-purple-200",
      "bg-orange-50 text-orange-700 border-orange-200",
      "bg-teal-50 text-teal-700 border-teal-200",
      "bg-indigo-50 text-indigo-700 border-indigo-200",
      "bg-pink-50 text-pink-700 border-pink-200"
    ];
    
    // Hash simple pour avoir une couleur cohérente par filière
    const hash = filiere.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/teacher/schedule');
      if (response.ok) {
        const data = await response.json();
        setScheduleData(data);
        setLastUpdate(new Date(data.lastUpdate).toLocaleTimeString('fr-FR'));
        toast.success("Emploi du temps actualisé!");
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      toast.error("Erreur lors de l'actualisation");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = getFilteredCourses();

  // Calcul du total d'heures basé sur les horaires RÉELS
  const totalHours = filteredCourses.reduce((total, course) => {
    try {
      const [start, end] = course.time.split('-');
      if (start && end) {
        const startHour = parseInt(start.split(':')[0]);
        const endHour = parseInt(end.split(':')[0]);
        return total + (endHour - startHour);
      }
    } catch (error) {
      console.warn("Erreur calcul horaire pour:", course);
    }
    return total;
  }, 0);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Chargement de vos informations...</div>
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
                  <p className="text-sm text-gray-600 mt-1">
                    {scheduleData?.totalCourses || 0} cours programmés
                  </p>
                  {lastUpdate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Dernière mise à jour: {lastUpdate}
                    </p>
                  )}
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
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <FaDownload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm">Exporter</span>
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
                      {totalHours}h
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
                    filteredCourses.map((course, index) => {
                      // Trouver le jour réel du cours
                      const courseDay = Object.keys(teacherScheduleData).find(day => 
                        teacherScheduleData[day as keyof typeof teacherScheduleData]?.some(c => 
                          c.time === course.time && 
                          c.subject === course.subject &&
                          c.filiere === course.filiere
                        )
                      );

                      return (
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
                                  {course.studentsCount > 0 && (
                                    <>
                                      <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">•</span>
                                      <span className="text-xs sm:text-sm text-gray-600">{course.studentsCount} étudiants</span>
                                    </>
                                  )}
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
                                <span>{courseDay || "Jour non défini"}</span>
                              </div>
                              <div className="hidden sm:block text-gray-300">•</div>
                              <div className="flex items-center gap-1 sm:gap-2">
                                <FaMapMarkerAlt className="text-red-600 flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{course.classroom}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse" title="Cours à venir"></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 sm:py-12 text-gray-500">
                      <FaFilter className="mx-auto text-3xl sm:text-4xl text-gray-300 mb-3 sm:mb-4" />
                      <p className="text-base sm:text-lg font-semibold">
                        {allCourses.length === 0 ? "Aucun cours programmé" : "Aucun cours trouvé"}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">
                        {allCourses.length === 0 
                          ? "Votre emploi du temps est vide pour le moment" 
                          : "Aucun cours ne correspond aux filtres sélectionnés"}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}