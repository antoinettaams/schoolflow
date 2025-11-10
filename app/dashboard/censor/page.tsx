"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {  
  FaUserGraduate, 
  FaChalkboardTeacher, 
  FaLayerGroup,
  FaChartLine,
  FaProjectDiagram,
  FaArrowRight,
  FaPlus,
  FaUsers
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

// Interface pour les données du dashboard
interface DashboardData {
  pendingAbsences: number;
  pendingRetards: number;
  activeVagues: number;
  activeFilieres: number;
  teacherEvaluations: number;
  totalStudents: number;
  totalTeachers: number;
  stats: {
    attendanceRate: number;
    disciplineIncidents: number;
    pedagogicalProgress: number;
  };
  quickStats: {
    totalClasses: number;
    activeTeachers: number;
    completedEvaluations: number;
  };
}

// Composant Skeleton pour le dashboard
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
    <div className="h-screen overflow-y-auto">
      <div className="p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Skeleton En-tête */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <div className="space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </div>

          {/* Skeleton Cartes d'ajout rapide */}
          <div className="my-6 sm:my-8">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {[1, 2].map((item) => (
                <div key={item} className="border rounded-lg sm:rounded-xl p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Contenu principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            
            {/* Colonne de gauche */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              
              {/* Skeleton Statistiques */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>

                {/* Skeleton Widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {[1, 2].map((item) => (
                    <div key={item} className="space-y-3 p-3 sm:p-4 border rounded-lg">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-8 w-1/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Colonne de droite */}
            <div className="space-y-4 sm:space-y-6">
              
              {/* Skeleton Structure pédagogique */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
                <Skeleton className="h-5 w-40 mb-4" />
                <div className="space-y-3">
                  {[1, 2].map((item) => (
                    <div key={item} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Skeleton className="w-5 h-5" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-2 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
                <Skeleton className="h-9 w-full mt-4 rounded-lg" />
              </div>

              {/* Skeleton Stats rapides */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
                <Skeleton className="h-5 w-32 mb-4" />
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-8" />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CenseurDashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour récupérer les données du dashboard
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/censor/dashboard');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }
      
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  // Vérification du rôle censeur et chargement des données
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const userRole = user?.publicMetadata?.role;
      if (userRole !== "Censeur") {
        router.push("/unauthorized");
      } else {
        fetchDashboardData();
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  // États de chargement
  if (!isLoaded || isLoading) {
    return <DashboardSkeleton />;
  }

  // Non connecté
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Redirection vers la connexion...</div>
      </div>
    );
  }

  const userRole = user?.publicMetadata?.role;
  if (userRole !== "Censeur") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Accès Refusé</CardTitle>
            <CardDescription className="text-gray-600">
              Vous n&apos;avez pas les permissions de censeur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/")}
              className="bg-blue-600 text-white hover:bg-blue-700 w-full"
            >
              Retour à l&apos;accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Données par défaut si l'API échoue
  const data = dashboardData || {
    pendingAbsences: 0,
    pendingRetards: 0,
    activeVagues: 0,
    activeFilieres: 0,
    teacherEvaluations: 0,
    totalStudents: 0,
    totalTeachers: 0,
    stats: {
      attendanceRate: 0,
      disciplineIncidents: 0,
      pedagogicalProgress: 0
    },
    quickStats: {
      totalClasses: 0,
      activeTeachers: 0,
      completedEvaluations: 0
    }
  };

  const quickAddCards = [
    {
      title: "Nouvelle Vague",
      description: "Créer une nouvelle vague de formation",
      icon: <FaLayerGroup className="text-xl sm:text-2xl text-blue-600" />,
      href: "/dashboard/censor/vagues",
      color: "bg-blue-50 border-blue-200",
      buttonColor: "bg-blue-600 hover:bg-blue-700"
    },
    {
      title: "Créer une Filière", 
      description: "Ajouter une nouvelle filière et modules",
      icon: <FaProjectDiagram className="text-xl sm:text-2xl text-green-600" />,
      href: "/dashboard/censor/filieres",
      color: "bg-green-50 border-green-200",
      buttonColor: "bg-green-600 hover:bg-green-700"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <div className="h-screen overflow-y-auto">
        <div className="p-3 sm:p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* En-tête */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 sticky top-0 z-10 backdrop-blur-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                    Tableau de Bord Censeur
                  </h1>
                  <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                    Bienvenue, {user.firstName} {user.lastName} 🎓
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="bg-purple-100 text-purple-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                      Censeur
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500 truncate">
                      {user.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 sm:py-2 rounded-lg shrink-0 mt-2 sm:mt-0">
                  {new Date().toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-red-800">
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Cartes d'ajout rapide */}
            <div className="my-6 sm:my-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Planification Pédagogique</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {quickAddCards.map((card, index) => (
                  <div 
                    key={index}
                    className={`${card.color} border-2 rounded-lg sm:rounded-xl p-4 sm:p-6 flex flex-col h-full transition-all hover:shadow-lg hover:border-gray-300`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="p-2 sm:p-3 bg-white rounded-lg shadow-sm flex-shrink-0">
                        {card.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">{card.title}</h3>
                        <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">{card.description}</p>
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <Link
                        href={card.href}
                        className={`${card.buttonColor} text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 rounded-lg w-full flex items-center justify-center gap-2 transition-colors hover:shadow-md text-sm sm:text-base`}
                      >
                        <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Commencer</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contenu principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              
              {/* Colonne de gauche */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                
                {/* Statistiques */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Aperçu Pédagogique</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <Card className="bg-white border-l-4 border-l-blue-500">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Taux de présence</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">{data.stats.attendanceRate}%</p>
                          </div>
                          <FaUserGraduate className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0 ml-2" />
                        </div>
                        <Progress value={data.stats.attendanceRate} className="mt-2 h-1.5 sm:h-2" />
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-l-4 border-l-green-500">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Progression pédagogique</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">{data.stats.pedagogicalProgress}%</p>
                          </div>
                          <FaChartLine className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0 ml-2" />
                        </div>
                        <Progress value={data.stats.pedagogicalProgress} className="mt-2 h-1.5 sm:h-2" />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Widgets principaux */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                        <CardTitle className="text-xs sm:text-sm font-medium truncate">Absences en Attente</CardTitle>
                        <FaUserGraduate className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0 ml-2" />
                      </CardHeader>
                      <CardContent className="pt-2 sm:pt-4 space-y-1 sm:space-y-2 p-3 sm:p-4">
                        <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                          {data.pendingAbsences}
                        </div>
                        <p className="text-xs text-gray-700">À traiter aujourd&apos;hui</p>
                        <Link href="/dashboard/censeur/absences" passHref>
                          <Button variant="link" className="p-0 h-auto text-blue-600 text-xs">
                            Vérifier <FaArrowRight className="ml-1 h-2 w-2 sm:h-3 sm:w-3" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                        <CardTitle className="text-xs sm:text-sm font-medium truncate">Évaluations Enseignants</CardTitle>
                        <FaChalkboardTeacher className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0 ml-2" />
                      </CardHeader>
                      <CardContent className="pt-2 sm:pt-4 space-y-1 sm:space-y-2 p-3 sm:p-4">
                        <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                          {data.teacherEvaluations}
                        </div>
                        <p className="text-xs text-gray-700">En attente</p>
                        <Link href="/dashboard/censeur/evaluation-enseignants" passHref>
                          <Button variant="link" className="p-0 h-auto text-blue-600 text-xs">
                            Évaluer <FaArrowRight className="ml-1 h-2 w-2 sm:h-3 sm:w-3" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                </div>

              </div>

              {/* Colonne de droite */}
              <div className="space-y-4 sm:space-y-6">
                
                {/* Structure pédagogique */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Structure Pédagogique</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-50 rounded-lg">
                      <FaLayerGroup className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium truncate">Vagues actives</p>
                        <p className="text-xs text-gray-600">{data.activeVagues} en cours</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-green-50 rounded-lg">
                      <FaProjectDiagram className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium truncate">Filières actives</p>
                        <p className="text-xs text-gray-600">{data.activeFilieres} avec modules</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-purple-50 rounded-lg">
                      <FaUsers className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium truncate">Total étudiants</p>
                        <p className="text-xs text-gray-600">{data.totalStudents} inscrits</p>
                      </div>
                    </div>
                  </div>
                  <Link href="/dashboard/censor/planning" className="w-full mt-3 sm:mt-4 block">
                    <Button variant="outline" className="w-full text-xs sm:text-sm">
                      Gérer le planning
                    </Button>
                  </Link>
                </div>

                {/* Stats rapides */}
                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Aperçu Rapide</h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Classes actives</span>
                      <span className="font-semibold text-gray-900">{data.quickStats.totalClasses}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Enseignants actifs</span>
                      <span className="font-semibold text-gray-900">{data.quickStats.activeTeachers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Évaluations terminées</span>
                      <span className="font-semibold text-gray-900">{data.quickStats.completedEvaluations}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CenseurDashboard;