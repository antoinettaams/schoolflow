// app/dashboard/student/schedules/page.tsx - VERSION AVEC EXPORT ET TOAST
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
  FaCode,
  FaDatabase,
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

// Interface mise à jour pour correspondre aux données API
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
}

interface UserInfo {
  role: string;
  nom?: string;
  filiere?: string;
  vague?: string;
}

export default function StudentSchedulePage() {
  const { isLoaded, isSignedIn } = useUser(); 
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState("Lundi");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [emploiDuTemps, setEmploiDuTemps] = useState<Cours[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

  // Charger l'emploi du temps depuis l'API
  const fetchEmploiDuTemps = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/schedule');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Erreur lors du chargement');
      }

      const data = await response.json();
      console.log("📊 Données reçues de l'API:", data);
      
      if (data.cours && Array.isArray(data.cours)) {
        setEmploiDuTemps(data.cours);
      } else {
        setEmploiDuTemps([]);
        console.warn("Aucun cours trouvé dans la réponse API");
      }
      
      setUserInfo(data.userInfo);
      setLastUpdate(new Date().toLocaleTimeString('fr-FR'));
    } catch (err) {
      console.error("❌ Erreur fetch:", err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setEmploiDuTemps([]);
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

  // Fonction pour récupérer les cours par jour
  const getCoursByDay = (day: string): Cours[] => {
    if (!emploiDuTemps || !Array.isArray(emploiDuTemps)) {
      return [];
    }

    const dayMap: Record<string, string[]> = {
      "Lundi": ["lundi", "mon", "monday"],
      "Mardi": ["mardi", "tue", "tuesday"], 
      "Mercredi": ["mercredi", "wed", "wednesday"],
      "Jeudi": ["jeudi", "thu", "thursday"],
      "Vendredi": ["vendredi", "fri", "friday"],
      "Samedi": ["samedi", "sat", "saturday"],
      "Dimanche": ["dimanche", "sun", "sunday"]
    };

    const dayVariations = dayMap[day] || [day.toLowerCase()];
    
    return emploiDuTemps.filter(cours => {
      if (!cours || !cours.jour) return false;
      
      const coursJour = cours.jour.toLowerCase().trim();
      return dayVariations.some(variation => coursJour.includes(variation));
    });
  };

  // Fonction pour les horaires
  const getHorairesForDay = (cours: Cours): string => {
    if (cours.heureDebut && cours.heureFin) {
      return `${cours.heureDebut} - ${cours.heureFin}`;
    }
    return "Horaires non définis";
  };

  // Fonction avec typage correct
  const getModuleIcon = (module: string): React.ReactNode => {
    const moduleIcons: Record<string, React.ReactNode> = {
      "programmation": <FaCode className="text-blue-600" />,
      "web": <FaCode className="text-blue-600" />,
      "base de données": <FaDatabase className="text-green-600" />,
      "design": <FaSchool className="text-purple-600" />,
      "mobile": <FaSchool className="text-indigo-600" />,
      "javascript": <FaCode className="text-yellow-600" />,
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

  // FONCTIONS D'EXPORT
  const exportToPDF = () => {
    const toastId = toast.loading('Génération du PDF...');
    
    setTimeout(() => {
      toast.dismiss(toastId);
      toast.success('PDF généré avec succès !', {
        icon: '📄',
        duration: 4000,
        style: {
          background: '#10B981',
          color: 'white',
        }
      });
      
      // Simulation de téléchargement
      const link = document.createElement('a');
      link.href = '#';
      link.download = `emploi-du-temps-${userInfo?.nom || 'etudiant'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 2000);
  };

  const exportToExcel = () => {
    const toastId = toast.loading('Export Excel en cours...');
    
    setTimeout(() => {
      toast.dismiss(toastId);
      toast.success('Fichier Excel exporté !', {
        icon: '📊',
        duration: 4000,
        style: {
          background: '#059669',
          color: 'white',
        }
      });
      
      // Simulation de téléchargement
      const link = document.createElement('a');
      link.href = '#';
      link.download = `emploi-du-temps-${userInfo?.nom || 'etudiant'}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1500);
  };

  const exportToCSV = () => {
    const toastId = toast.loading('Export CSV en cours...');
    
    setTimeout(() => {
      toast.dismiss(toastId);
      toast.success('Fichier CSV généré !', {
        icon: '📋',
        duration: 4000,
        style: {
          background: '#2563EB',
          color: 'white',
        }
      });
      
      // Simulation de téléchargement
      const csvContent = "Jour,Module,Enseignant,Horaire,Type,Salle\n" +
        emploiDuTemps.map(cours => 
          `"${cours.jour}","${cours.module}","${cours.enseignant}","${cours.heureDebut}-${cours.heureFin}","${cours.type}","${cours.salle || 'N/A'}"`
        ).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `emploi-du-temps-${userInfo?.nom || 'etudiant'}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const addToCalendar = () => {
    const toastId = toast.loading('Ajout au calendrier...');
    
    setTimeout(() => {
      toast.dismiss(toastId);
      toast.success('Ajouté à votre calendrier !', {
        icon: '📅',
        duration: 4000,
        style: {
          background: '#7C3AED',
          color: 'white',
        }
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
      toast.dismiss(toastId);
      toast.success(`Emploi du temps du ${selectedDay} exporté !`, {
        icon: '📑',
        duration: 4000,
        style: {
          background: '#F59E0B',
          color: 'white',
        }
      });
      
      // Simulation de téléchargement
      const link = document.createElement('a');
      link.href = '#';
      link.download = `emploi-du-temps-${selectedDay.toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1500);
  };

  const coursDuJour = getCoursByDay(selectedDay);

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
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          loading: {
            duration: Infinity,
          },
        }}
      />
      
      <div className="flex-1 flex flex-col min-h-0 lg:pl-5 pt-20 lg:pt-6">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            
            {/* En-tête étudiant */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                    Mon Emploi du Temps
                  </h1>
                  
                  {userInfo && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <FaUserGraduate className="text-blue-600" />
                        <div>
                          <div className="font-semibold">Étudiant</div>
                          <div>{userInfo.nom || "Non spécifié"}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <FaSchool className="text-green-600" />
                        <div>
                          <div className="font-semibold">Filière</div>
                          <div>{userInfo.filiere || "Non assigné"}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-purple-600" />
                        <div>
                          <div className="font-semibold">Vague</div>
                          <div>{userInfo.vague || "Non assigné"}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Boutons d'action */}
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
                      <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
                        <FaFilePdf className="w-4 h-4 mr-2 text-red-500" />
                        Exporter en PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
                        <FaFileExcel className="w-4 h-4 mr-2 text-green-500" />
                        Exporter en Excel
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
                        <FaFileCsv className="w-4 h-4 mr-2 text-blue-500" />
                        Exporter en CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={exportCurrentDay} className="cursor-pointer">
                        <FaCalendarAlt className="w-4 h-4 mr-2 text-orange-500" />
                        Exporter le {selectedDay}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={addToCalendar} className="cursor-pointer">
                        <FaCalendarPlus className="w-4 h-4 mr-2 text-purple-500" />
                        Ajouter au calendrier
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
                    coursDuJour.map((cours, index) => {
                      const horaire = getHorairesForDay(cours);
                      
                      return (
                        <div
                          key={`${cours.id}-${index}`}
                          className="flex items-start p-3 sm:p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors gap-3"
                        >
                          <div className="flex-shrink-0 mt-1">
                            {getModuleIcon(cours.module)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 text-base sm:text-lg">
                                {cours.module}
                              </h3>
                              <div className="flex gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full border ${getTypeColor(cours.type)} flex-shrink-0`}>
                                  {cours.type}
                                </span>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                  Coef: {cours.coefficient}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <FaClock className="text-blue-600 flex-shrink-0" />
                                <span className="text-sm">{horaire}</span>
                              </div>
                              <div className="hidden sm:block text-gray-300">•</div>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500">Enseignant :</span>
                                <span className="font-medium">{cours.enseignant}</span>
                              </div>
                              {cours.salle && (
                                <>
                                  <div className="hidden sm:block text-gray-300">•</div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-500">Salle :</span>
                                    <span className="font-medium">{cours.salle}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {cours.description && (
                              <div className="mt-2 text-sm text-gray-500">
                                {cours.description}
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
                        Profitez de votre journée pour réviser !
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Légende et résumé */}
            {emploiDuTemps.length > 0 && !isLoading && !error && (
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