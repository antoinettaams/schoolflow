"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FaUserGraduate, 
  FaFileAlt, 
  FaIdCard, 
  FaCalendarAlt,
  FaArrowRight,
  FaExclamationTriangle,
  FaCheckCircle,
  FaPlus, 
  FaInfoCircle
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

// Types pour les données
interface MonthlyStats {
  inscriptions: number;
  revenue: number;
  paiements: number;
  approvalRate: number;
  completionRate: number;
}

interface RecentActivity {
  id: string;
  action: string;
  description: string;
  student: string;
  time: string;
  type: string;
  status: string;
}

interface FinancialSummary {
  totalRevenue: number;
  pendingRevenue: number;
  monthlyRevenue: number;
  totalTransactions: number;
}

interface SecretaryData {
  pendingInscriptions: number;
  cardsToPrint: number;
  upcomingEvents: number;
  unreadMessages: number;
  monthlyStats: MonthlyStats;
  recentActivities: RecentActivity[];
  totalStudents: number;
  totalInscriptions: number;
  financialSummary: FinancialSummary;
  metadata?: {
    hasData: boolean;
    lastUpdated: string;
    dataStatus: string;
    error?: string;
  };
}

const SecretaryDashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<SecretaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupération des données depuis l'API
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/secretaires/dashboard');
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Vérifier si c'est une réponse d'erreur structurée
      if (data.error) {
        throw new Error(data.error);
      }
      
      setDashboardData(data);
    } catch (err) {
      console.error('Erreur détaillée:', err);
      setError(err instanceof Error ? err.message : 'Impossible de charger les données du tableau de bord');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchDashboardData();
    }
  }, [isLoaded, isSignedIn]);

  // Vérification du rôle Secrétaire
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const userRole = user?.publicMetadata?.role;
      if (userRole !== "Secretaire") {
        router.push("/unauthorized");
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-lg">Chargement de vos informations...</div>
        </div>
      </div>
    );
  }

  // Non connecté
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Redirection vers la connexion...</div>
      </div>
    );
  }

  // Vérification finale du rôle
  const userRole = user?.publicMetadata?.role;
  if (userRole !== "Secretaire") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Accès Refusé</CardTitle>
            <CardDescription className="text-gray-600">
              Vous n&apos;avez pas les permissions de secrétaire.
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

  // Données par défaut pendant le chargement ou en cas d'erreur
  const secretaryData = dashboardData || {
    pendingInscriptions: 0,
    cardsToPrint: 0,
    upcomingEvents: 0,
    unreadMessages: 0,
    monthlyStats: {
      inscriptions: 0,
      revenue: 0,
      paiements: 0,
      approvalRate: 0,
      completionRate: 0
    },
    recentActivities: [],
    totalStudents: 0,
    totalInscriptions: 0,
    financialSummary: {
      totalRevenue: 0,
      pendingRevenue: 0,
      monthlyRevenue: 0,
      totalTransactions: 0
    }
  };

  const quickAddCards = [
    {
      title: "Nouvelle Inscription",
      description: "Inscrire un nouvel étudiant",
      icon: <FaUserGraduate className="text-xl sm:text-2xl text-blue-600" />,
      href: "/auth/signup",
      color: "bg-blue-50 border-blue-200",
      buttonColor: "bg-blue-600 hover:bg-blue-700"
    },
    {
      title: "Générer un dossier", 
      description: "Créer des dossiers étudiants",
      icon: <FaIdCard className="text-xl sm:text-2xl text-green-600" />,
      href: "/dashboard/secretaire/dossiers",
      color: "bg-green-50 border-green-200",
      buttonColor: "bg-green-600 hover:bg-green-700"
    }
  ];

  // Composants Squelette
  const HeaderSkeleton = () => (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 sticky top-0 z-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-48 mb-3" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-8 w-48 rounded-lg" />
      </div>
    </div>
  );

  const QuickActionsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {[...Array(2)].map((_, index) => (
        <div key={index} className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 sm:p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-10 w-full rounded-lg mt-auto" />
        </div>
      ))}
    </div>
  );

  const StatsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
      {[...Array(2)].map((_, index) => (
        <Card key={index} className="bg-white border-l-4 border-l-gray-300">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="mt-2 h-2 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const WidgetsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {[...Array(2)].map((_, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent className="pt-3 sm:pt-4 space-y-1 sm:space-y-2">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const ActivitiesSkeleton = () => (
    <div className="space-y-2 sm:space-y-3">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="flex items-center justify-between p-2 sm:p-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Skeleton className="h-4 w-4 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );

  const EventsSkeleton = () => (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
        <Skeleton className="h-5 w-5 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );

  // Fonction pour formater les montants
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <div className="h-screen overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* En-tête */}
            {isLoading ? (
              <HeaderSkeleton />
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 sticky top-0 z-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                      Tableau de Bord Secrétaire
                    </h1>
                    <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                      Bienvenue, {user.firstName} {user.lastName} 👩‍💼
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                      <span className="bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-fit">
                        Secrétaire
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500 truncate">
                        {user.primaryEmailAddress?.emailAddress}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg mt-2 sm:mt-0 w-fit sm:w-auto">
                    {new Date().toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Cartes d'ajout rapide */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                Actions Rapides
              </h2>
              {isLoading ? (
                <QuickActionsSkeleton />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {quickAddCards.map((card, index) => (
                    <div 
                      key={index}
                      className={`${card.color} border-2 rounded-xl p-4 sm:p-6 flex flex-col h-full transition-all hover:shadow-lg hover:border-gray-300`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div className="p-2 sm:p-3 bg-white rounded-lg shadow-sm flex-shrink-0">
                          {card.icon}
                        </div>
                        <div className="flex-1 min-w-0">
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
              )}
            </div>

            {/* Contenu principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              
              {/* Colonne de gauche */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                
                {/* Statistiques */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
                    Aperçu Administratif
                  </h2>
                  
                  {isLoading ? (
                    <>
                      <StatsSkeleton />
                      <WidgetsSkeleton />
                    </>
                  ) : error ? (
                    <div className="text-center py-8">
                      <FaExclamationTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <div className="text-red-600 mb-4 text-sm">{error}</div>
                      <Button 
                        onClick={fetchDashboardData}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      > 
                        Réessayer
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <Card className="bg-white border-l-4 border-l-blue-500">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Inscriptions ce mois</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                                  {secretaryData.monthlyStats.inscriptions}
                                </p>
                              </div>
                              <FaUserGraduate className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0 ml-2" />
                            </div>
                            <Progress 
                              value={secretaryData.monthlyStats.completionRate} 
                              className="mt-2 h-1 sm:h-2" 
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Objectif: {secretaryData.monthlyStats.completionRate}%
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-white border-l-4 border-l-green-500">
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Revenus ce mois</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                                  {formatCurrency(secretaryData.monthlyStats.revenue)}
                                </p>
                              </div>
                              <FaFileAlt className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0 ml-2" />
                            </div>
                            <Progress 
                              value={Math.min(100, (secretaryData.monthlyStats.paiements / 50) * 100)} 
                              className="mt-2 h-1 sm:h-2" 
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {secretaryData.monthlyStats.paiements} paiements traités
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium truncate">Inscriptions en Attente</CardTitle>
                            <FaUserGraduate className="h-4 w-4 text-orange-500 flex-shrink-0 ml-2" />
                          </CardHeader>
                          <CardContent className="pt-3 sm:pt-4 space-y-1 sm:space-y-2">
                            <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                              {secretaryData.pendingInscriptions}
                            </div>
                            <p className="text-xs text-gray-700">
                              {secretaryData.pendingInscriptions === 0 
                                ? "Aucune inscription en attente" 
                                : "À traiter cette semaine"
                              }
                            </p>
                            <Link href="/dashboard/secretaire/inscriptions" passHref>
                              <Button variant="link" className="p-0 h-auto text-blue-600 text-xs">
                                {secretaryData.pendingInscriptions === 0 ? "Voir" : "Traiter maintenant"} <FaArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium truncate">Cartes à Imprimer</CardTitle>
                            <FaIdCard className="h-4 w-4 text-blue-500 flex-shrink-0 ml-2" />
                          </CardHeader>
                          <CardContent className="pt-3 sm:pt-4 space-y-1 sm:space-y-2">
                            <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                              {secretaryData.cardsToPrint}
                            </div>
                            <p className="text-xs text-gray-700">
                              {secretaryData.cardsToPrint === 0 
                                ? "Toutes les cartes sont à jour" 
                                : "En attente d'impression"
                              }
                            </p>
                            <Link href="/dashboard/secretaire/cartes" passHref>
                              <Button variant="link" className="p-0 h-auto text-blue-600 text-xs">
                                {secretaryData.cardsToPrint === 0 ? "Vérifier" : "Imprimer"} <FaArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Résumé financier */}
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3 text-sm">Résumé Financier</h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-gray-600">Revenu total</p>
                            <p className="font-semibold text-green-600">{formatCurrency(secretaryData.financialSummary.totalRevenue)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Revenu ce mois</p>
                            <p className="font-semibold text-blue-600">{formatCurrency(secretaryData.financialSummary.monthlyRevenue)}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Activités récentes */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    Activités Récentes
                  </h3>
                  
                  {isLoading ? (
                    <ActivitiesSkeleton />
                  ) : error ? (
                    <div className="text-center py-8 text-red-600">
                      Impossible de charger les activités
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {secretaryData.recentActivities && secretaryData.recentActivities.length > 0 ? (
                        secretaryData.recentActivities.map((activity) => (
                          <div key={activity.id} className="flex items-center justify-between p-2 sm:p-3 hover:bg-gray-50 rounded">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              {activity.status === 'completed' || activity.status === 'paye_complet' ? (
                                <FaCheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <FaExclamationTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-medium truncate">{activity.action}</p>
                                <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{activity.time}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <FaInfoCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500 mb-2">Aucune activité récente</p>
                          <p className="text-sm text-gray-400">Les activités apparaîtront ici</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Colonne de droite */}
              <div className="space-y-4 sm:space-y-6">
                {/* Événements à venir */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
                    Événements à Venir
                  </h3>
                  
                  {isLoading ? (
                    <EventsSkeleton />
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {secretaryData.upcomingEvents > 0 ? (
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-50 rounded-lg">
                          <FaCalendarAlt className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium truncate">Événements programmés</p>
                            <p className="text-xs text-gray-600">{secretaryData.upcomingEvents} au total</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                          <FaCalendarAlt className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium truncate">Aucun événement</p>
                            <p className="text-xs text-gray-600">Voir les évènements</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Link href="/dashboard/secretaire/evenements" className="w-full mt-3 sm:mt-4 block">
                    <Button variant="outline" className="w-full text-xs sm:text-sm">
                      {secretaryData.upcomingEvents === 0 ? "Voir tous les événements" : "Voir tous les événements"}
                    </Button>
                  </Link>
                </div>

                {/* Statistiques globales */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                  <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
                    Statistiques Globales
                  </h3>
                  
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total étudiants</span>
                        <span className="font-semibold text-blue-600">{secretaryData.totalStudents}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total inscriptions</span>
                        <span className="font-semibold text-green-600">{secretaryData.totalInscriptions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Taux d'approbation</span>
                        <span className="font-semibold text-orange-600">{secretaryData.monthlyStats.approvalRate}%</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecretaryDashboard;