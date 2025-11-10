// app/dashboard/parent/schedules/page.tsx - VERSION AVEC TOAST
"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { 
  FaCalendarAlt, 
  FaClock, 
  FaSync, 
  FaDownload, 
  FaUserGraduate, 
  FaSchool, 
  FaExclamationTriangle,
  FaFilePdf,
  FaFileExcel,
  FaFileCsv,
  FaCalendarPlus
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import toast, { Toaster } from "react-hot-toast";

// Import des bibliothèques d'export
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';

interface Cours {
  id: string;
  module: string;
  enseignant: string;
  emailEnseignant?: string;
  filiere: string;
  vague: string;
  coefficient: number;
  type: string;
  description?: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  salle?: string;
  dureeFormation?: string;
  periodeVague?: string;
}

interface UserInfo {
  role: string;
  nom?: string;
  filiere?: string;
  vague?: string;
  enfant?: string;
  filiereEnfant?: string;
  vagueEnfant?: string;
  relation?: string;
  matiere?: string;
}

export default function ParentSchedulesPage() {
  const { isLoaded, isSignedIn } = useUser(); 
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState("Lundi");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [cours, setCours] = useState<Cours[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

  // Charger l'emploi du temps depuis l'API
  const fetchEmploiDuTemps = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("🔄 Chargement des données depuis l'API parent...");
      const response = await fetch('/api/parents/schedule');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Erreur lors du chargement');
      }

      const data = await response.json();
      console.log("📦 Données reçues de l'API parent:", data);
      
      setCours(data.cours || []);
      setUserInfo(data.userInfo);
      setLastUpdate(new Date().toLocaleTimeString('fr-FR'));
      
      // Debug
      if (data.cours && data.cours.length > 0) {
        const joursUniques = [...new Set(data.cours.map((c: Cours) => c.jour))];
        console.log("📅 Jours disponibles:", joursUniques);
        console.log("📊 Total des cours:", data.cours.length);
      }
    } catch (err) {
      console.error("❌ Erreur lors du chargement:", err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setCours([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmploiDuTemps();
  }, []);

  // Redirection si non connecté
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Fonction pour obtenir les cours par jour
  const getCoursByDay = (day: string) => {
    if (!cours || !Array.isArray(cours) || cours.length === 0) {
      console.log("📭 Aucun cours disponible pour le filtrage");
      return [];
    }
    
    console.log(`🔍 Filtrage des cours pour le jour: ${day}`);
    
    // Normaliser le jour sélectionné pour la comparaison
    const dayNormalized = day.trim().toLowerCase();
    
    const coursFiltres = cours.filter(coursItem => {
      if (!coursItem.jour) {
        console.log("❌ Cours sans jour:", coursItem);
        return false;
      }
      
      const coursJourNormalized = coursItem.jour.trim().toLowerCase();
      const match = coursJourNormalized === dayNormalized;
      
      if (match) {
        console.log(`✅ Cours correspondant: ${coursItem.module} - ${coursItem.jour}`);
      }
      
      return match;
    });
    
    console.log(`📊 ${coursFiltres.length} cours trouvés pour ${day}`);
    return coursFiltres;
  };

  // Fonction pour obtenir les horaires formatés
  const getHorairesFormatted = (coursItem: Cours) => {
    if (coursItem.heureDebut && coursItem.heureFin) {
      return `${coursItem.heureDebut} - ${coursItem.heureFin}`;
    }
    return null;
  };

  // Fonction pour obtenir l'icône du module
  const getModuleIcon = (module: string) => {
    const moduleIcons: Record<string, React.ReactNode> = {
      "programmation": <FaSchool className="text-blue-600" />,
      "web": <FaSchool className="text-blue-600" />,
      "base de données": <FaSchool className="text-green-600" />,
      "design": <FaSchool className="text-purple-600" />,
      "mobile": <FaSchool className="text-indigo-600" />,
      "javascript": <FaSchool className="text-yellow-600" />,
      "projet": <FaSchool className="text-red-600" />,
      "architecture": <FaSchool className="text-red-600" />
    };

    const moduleLower = module.toLowerCase();
    for (const [key, icon] of Object.entries(moduleIcons)) {
      if (moduleLower.includes(key)) {
        return icon;
      }
    }

    return <FaSchool className="text-gray-600" />;
  };

  // Fonction pour obtenir la couleur du type de cours
  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "theorique":
      case "cours":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "pratique":
      case "tp":
        return "bg-green-100 text-green-600 border-green-200";
      case "projet":
        return "bg-purple-100 text-purple-600 border-purple-200";
      case "mixte":
        return "bg-orange-100 text-orange-600 border-orange-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const handleRefresh = () => {
    const refreshToast = toast.loading('Actualisation en cours...');
    fetchEmploiDuTemps();
    setTimeout(() => {
      toast.dismiss(refreshToast);
      toast.success('Emploi du temps actualisé !', {
        icon: '🔄',
        duration: 3000
      });
    }, 1000);
  };

  // FONCTIONS D'EXPORT AVEC TOAST
  const exportToPDF = () => {
    if (!cours || cours.length === 0) {
      toast.error('Aucun cours à exporter en PDF', {
        icon: '📭',
        duration: 4000
      });
      return;
    }

    const toastId = toast.loading('Génération du PDF en cours...');
    
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        // En-tête du document
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text(`Emploi du temps - ${userInfo?.enfant || "Votre Enfant"}`, 14, 15);
        
        // Informations de l'enfant
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        if (userInfo) {
          doc.text(`Filière: ${userInfo.filiereEnfant}`, 14, 25);
          doc.text(`Vague: ${userInfo.vagueEnfant}`, 14, 32);
          doc.text(`Relation: ${userInfo.relation}`, 14, 39);
        }
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 46);
        
        // Préparation des données du tableau
        const tableData = cours.map(coursItem => [
          normaliserJourPourAffichage(coursItem.jour),
          `${coursItem.heureDebut} - ${coursItem.heureFin}`,
          coursItem.module,
          coursItem.enseignant,
          coursItem.type,
          coursItem.salle || 'Non assigné'
        ]);

        // Tableau principal
        autoTable(doc, {
          head: [['Jour', 'Horaire', 'Module', 'Enseignant', 'Type', 'Salle']],
          body: tableData,
          startY: 55,
          styles: { 
            fontSize: 9,
            cellPadding: 3,
          },
          headStyles: { 
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          margin: { top: 55 },
          theme: 'grid'
        });

        // Résumé par jour
        const summaryY = (doc as any).lastAutoTable.finalY + 15;
        if (summaryY < 250) {
          doc.setFontSize(12);
          doc.setTextColor(40, 40, 40);
          doc.text("Résumé par jour", 14, summaryY);
          
          const summaryData = days.map(day => [
            day,
            getCoursByDay(day).length.toString()
          ]);

          autoTable(doc, {
            body: summaryData,
            startY: summaryY + 5,
            styles: { fontSize: 9 },
            columnStyles: {
              0: { fontStyle: 'bold' },
              1: { halign: 'center' }
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
            `Page ${i} / ${pageCount} - Emploi du temps ${userInfo?.enfant || ''}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }

        // Sauvegarde du fichier
        const fileName = `emploi-du-temps-${userInfo?.enfant?.replace(/\s+/g, '-') || 'enfant'}-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        toast.dismiss(toastId);
        toast.success('PDF généré avec succès !', {
          icon: '📄',
          duration: 4000,
        });
        
      } catch (error) {
        console.error("Erreur lors de l'export PDF:", error);
        toast.dismiss(toastId);
        toast.error('Erreur lors de la génération du PDF', {
          icon: '❌',
          duration: 4000
        });
      }
    }, 1500);
  };

  // Fonction d'export Excel
  const exportToExcel = () => {
    if (!cours || cours.length === 0) {
      toast.error('Aucun cours à exporter en Excel', {
        icon: '📭',
        duration: 4000
      });
      return;
    }

    const toastId = toast.loading('Export Excel en cours...');
    
    setTimeout(() => {
      try {
        // Préparation des données
        const data = cours.map(coursItem => ({
          'Jour': normaliserJourPourAffichage(coursItem.jour),
          'Horaire': `${coursItem.heureDebut} - ${coursItem.heureFin}`,
          'Module': coursItem.module,
          'Enseignant': coursItem.enseignant,
          'Type': coursItem.type,
          'Coefficient': coursItem.coefficient,
          'Salle': coursItem.salle || 'Non assigné',
          'Description': coursItem.description || '',
          'Email Enseignant': coursItem.emailEnseignant || ''
        }));

        // Création du workbook
        const wb = utils.book_new();
        
        // Feuille principale
        const ws = utils.json_to_sheet(data);
        
        // En-têtes et métadonnées
        const metadata = [
          [`Emploi du temps - ${userInfo?.enfant || "Votre Enfant"}`],
          [`Filière: ${userInfo?.filiereEnfant || ''}`],
          [`Vague: ${userInfo?.vagueEnfant || ''}`],
          [`Relation: ${userInfo?.relation || ''}`],
          [`Généré le: ${new Date().toLocaleDateString('fr-FR')}`],
          [] // ligne vide
        ];
        
        utils.sheet_add_aoa(ws, metadata, { origin: 'A1' });
        
        // Ajuster la largeur des colonnes
        const colWidths = [
          { wch: 10 }, // Jour
          { wch: 15 }, // Horaire
          { wch: 25 }, // Module
          { wch: 20 }, // Enseignant
          { wch: 12 }, // Type
          { wch: 12 }, // Coefficient
          { wch: 15 }, // Salle
          { wch: 30 }, // Description
          { wch: 25 }  // Email
        ];
        ws['!cols'] = colWidths;

        utils.book_append_sheet(wb, ws, 'Emploi du temps');

        // Feuille de résumé
        const summaryData = days.map(day => ({
          'Jour': day,
          'Nombre de cours': getCoursByDay(day).length
        }));
        
        const wsSummary = utils.json_to_sheet(summaryData);
        utils.book_append_sheet(wb, wsSummary, 'Résumé');

        // Sauvegarde
        const fileName = `emploi-du-temps-${userInfo?.enfant?.replace(/\s+/g, '-') || 'enfant'}-${new Date().toISOString().split('T')[0]}.xlsx`;
        writeFile(wb, fileName);
        
        toast.dismiss(toastId);
        toast.success('Fichier Excel exporté !', {
          icon: '📊',
          duration: 4000,
        });
        
      } catch (error) {
        console.error("Erreur lors de l'export Excel:", error);
        toast.dismiss(toastId);
        toast.error('Erreur lors de l\'export Excel', {
          icon: '❌',
          duration: 4000
        });
      }
    }, 1000);
  };

  // Fonction d'export CSV
  const exportToCSV = () => {
    if (!cours || cours.length === 0) {
      toast.error('Aucun cours à exporter en CSV', {
        icon: '📭',
        duration: 4000
      });
      return;
    }

    const toastId = toast.loading('Export CSV en cours...');
    
    setTimeout(() => {
      try {
        const headers = ['Jour', 'Horaire', 'Module', 'Enseignant', 'Type', 'Coefficient', 'Salle', 'Description'];
        
        const csvContent = [
          `Emploi du temps - ${userInfo?.enfant || "Votre Enfant"}`,
          `Filière: ${userInfo?.filiereEnfant || ''}`,
          `Vague: ${userInfo?.vagueEnfant || ''}`,
          `Généré le: ${new Date().toLocaleDateString('fr-FR')}`,
          '',
          headers.join(','),
          ...cours.map(coursItem => [
            normaliserJourPourAffichage(coursItem.jour),
            `"${coursItem.heureDebut} - ${coursItem.heureFin}"`,
            `"${coursItem.module}"`,
            `"${coursItem.enseignant}"`,
            `"${coursItem.type}"`,
            coursItem.coefficient,
            `"${coursItem.salle || 'Non assigné'}"`,
            `"${coursItem.description || ''}"`
          ].join(','))
        ].join('\n');

        // Création et téléchargement du fichier
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `emploi-du-temps-${userInfo?.enfant?.replace(/\s+/g, '-') || 'enfant'}-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.dismiss(toastId);
        toast.success('Fichier CSV généré !', {
          icon: '📋',
          duration: 4000,
        });
        
      } catch (error) {
        console.error("Erreur lors de l'export CSV:", error);
        toast.dismiss(toastId);
        toast.error('Erreur lors de l\'export CSV', {
          icon: '❌',
          duration: 4000
        });
      }
    }, 800);
  };

  const addToCalendar = () => {
    const toastId = toast.loading('Ajout au calendrier...');
    
    setTimeout(() => {
      toast.dismiss(toastId);
      toast.success('Ajouté à votre calendrier !', {
        icon: '📅',
        duration: 4000,
      });
    }, 1500);
  };

  const exportCurrentDay = () => {
    const coursDuJour = getCoursByDay(selectedDay);
    
    if (coursDuJour.length === 0) {
      toast.error(`Aucun cours à exporter pour le ${selectedDay}`, {
        icon: '⚠️',
        duration: 4000
      });
      return;
    }

    const toastId = toast.loading(`Export du ${selectedDay}...`);
    
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        // En-tête spécifique au jour
        doc.setFontSize(18);
        doc.text(`Emploi du temps - ${selectedDay}`, 14, 15);
        doc.setFontSize(11);
        doc.text(`Enfant: ${userInfo?.enfant || "Votre Enfant"}`, 14, 25);
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 32);

        // Données du jour
        const tableData = coursDuJour.map(coursItem => [
          `${coursItem.heureDebut} - ${coursItem.heureFin}`,
          coursItem.module,
          coursItem.enseignant,
          coursItem.type,
          coursItem.salle || 'Non assigné'
        ]);

        autoTable(doc, {
          head: [['Horaire', 'Module', 'Enseignant', 'Type', 'Salle']],
          body: tableData,
          startY: 45,
          styles: { fontSize: 9 },
          headStyles: { 
            fillColor: [59, 130, 246],
            textColor: 255
          }
        });

        const fileName = `emploi-du-temps-${selectedDay.toLowerCase()}-${userInfo?.enfant?.replace(/\s+/g, '-') || 'enfant'}.pdf`;
        doc.save(fileName);
        
        toast.dismiss(toastId);
        toast.success(`Emploi du temps du ${selectedDay} exporté !`, {
          icon: '📑',
          duration: 4000,
        });
        
      } catch (error) {
        console.error("Erreur lors de l'export du jour:", error);
        toast.dismiss(toastId);
        toast.error('Erreur lors de l\'export', {
          icon: '❌',
          duration: 4000
        });
      }
    }, 1200);
  };

  // Fonction utilitaire pour normaliser l'affichage des jours
  const normaliserJourPourAffichage = (jour: string): string => {
    const jours: Record<string, string> = {
      'lundi': 'Lundi',
      'mardi': 'Mardi',
      'mercredi': 'Mercredi',
      'jeudi': 'Jeudi',
      'vendredi': 'Vendredi',
      'samedi': 'Samedi',
      'dimanche': 'Dimanche'
    };

    const jourMinuscule = jour.toLowerCase().trim();
    return jours[jourMinuscule] || jour;
  };

  const coursDuJour = getCoursByDay(selectedDay);

  // Debug: afficher l'état actuel
  console.log("🎯 État actuel:", {
    selectedDay,
    totalCours: cours.length,
    coursDuJour: coursDuJour.length,
    isLoading,
    error
  });

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
      
      <div className="flex-1 flex flex-col min-h-0 lg:pl-5 pt-20 lg:pt-6">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            
            {/* En-tête avec informations de l'enfant */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                    Emploi du Temps de {userInfo?.enfant || "Votre Enfant"}
                  </h1>
                  
                  {userInfo && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <FaUserGraduate className="text-blue-600" />
                        <div>
                          <div className="font-semibold">Enfant</div>
                          <div>{userInfo.enfant}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <FaSchool className="text-green-600" />
                        <div>
                          <div className="font-semibold">Filière</div>
                          <div>{userInfo.filiereEnfant}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-purple-600" />
                        <div>
                          <div className="font-semibold">Vague</div>
                          <div>{userInfo.vagueEnfant}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <FaUserGraduate className="text-orange-600" />
                        <div>
                          <div className="font-semibold">Relation</div>
                          <div>{userInfo.relation}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Boutons d'action - VERSION AVEC DROPDOWN */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="justify-center"
                  >
                    <FaSync className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualiser
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-center">
                        <FaDownload className="w-4 h-4 mr-2" />
                        Exporter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem 
                        onClick={exportToPDF}
                        className="flex items-center cursor-pointer"
                      >
                        <FaFilePdf className="w-4 h-4 mr-2 text-red-500" />
                        <span>Exporter en PDF</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={exportToExcel}
                        className="flex items-center cursor-pointer"
                      >
                        <FaFileExcel className="w-4 h-4 mr-2 text-green-500" />
                        <span>Exporter en Excel</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={exportToCSV}
                        className="flex items-center cursor-pointer"
                      >
                        <FaFileCsv className="w-4 h-4 mr-2 text-blue-500" />
                        <span>Exporter en CSV</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={exportCurrentDay}
                        className="flex items-center cursor-pointer"
                      >
                        <FaCalendarAlt className="w-4 h-4 mr-2 text-orange-500" />
                        <span>Exporter le {selectedDay}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={addToCalendar}
                        className="flex items-center cursor-pointer"
                      >
                        <FaCalendarPlus className="w-4 h-4 mr-2 text-purple-500" />
                        <span>Ajouter au calendrier</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Alert d'erreur */}
            {error && (
              <Alert className="bg-red-50 border-red-200 mb-6">
                <FaExclamationTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Alert de mise à jour */}
            {lastUpdate && !error && (
              <Alert className="bg-blue-50 border-blue-200 mb-6">
                <FaSync className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Dernière mise à jour : {lastUpdate}
                  {cours.length > 0 && ` - ${cours.length} cours au total`}
                </AlertDescription>
              </Alert>
            )}

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
                  <span className="ml-2 text-xs">
                    ({getCoursByDay(day).length})
                  </span>
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
                    {coursDuJour.length} cours
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
                  ) : coursDuJour.length > 0 ? (
                    coursDuJour.map((coursItem, index) => {
                      const horaire = getHorairesFormatted(coursItem);
                      
                      return (
                        <div
                          key={`${coursItem.id}-${index}`}
                          className="flex items-start p-3 sm:p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors gap-3"
                        >
                          <div className="flex-shrink-0 mt-1">
                            {getModuleIcon(coursItem.module)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                                {coursItem.module}
                              </h3>
                              <div className="flex gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full border ${getTypeColor(coursItem.type)} flex-shrink-0`}>
                                  {coursItem.type}
                                </span>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                  Coef: {coursItem.coefficient}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                              {horaire ? (
                                <>
                                  <div className="flex items-center gap-1">
                                    <FaClock className="text-blue-600 flex-shrink-0" />
                                    <span className="text-sm">{horaire}</span>
                                  </div>
                                  <div className="hidden sm:block text-gray-300">•</div>
                                </>
                              ) : null}
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500">Enseignant :</span>
                                <span className="font-medium">{coursItem.enseignant}</span>
                              </div>
                              {coursItem.salle && coursItem.salle !== "Non assigné" && (
                                <>
                                  <div className="hidden sm:block text-gray-300">•</div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-500">Salle :</span>
                                    <span className="font-medium">{coursItem.salle}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {coursItem.description && (
                              <div className="mt-2 text-sm text-gray-500">
                                {coursItem.description}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Cours à venir"></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FaCalendarAlt className="mx-auto text-4xl text-gray-300 mb-2" />
                      <p className="text-lg">Aucun cours prévu ce jour</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {userInfo?.enfant || "Votre enfant"} n'a pas cours ce {selectedDay.toLowerCase()}
                      </p>
                      {cours.length > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                          (Mais il y a {cours.length} cours au total dans la semaine)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informations supplémentaires */}
            {cours.length > 0 && !isLoading && !error && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Résumé de la semaine</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {days.map(day => {
                        const coursCount = getCoursByDay(day).length;
                        return (
                          <div key={day} className="flex justify-between items-center">
                            <span>{day}</span>
                            <Badge variant={coursCount > 0 ? "default" : "outline"}>
                              {coursCount} cours
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Légende</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Cours Théorique</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Travaux Pratiques</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span>Projet</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Cours à venir</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}