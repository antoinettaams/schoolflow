"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { 
  FaUserGraduate, 
  FaFileAlt, 
  FaIdCard, 
  FaCalendarAlt,
  FaBell, 
  FaChartLine, 
  FaArrowRight,
  FaExclamationTriangle,
  FaCheckCircle,
  FaPlus
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const SecretaryDashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Chargement de vos informations...</div>
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
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès Refusé</h1>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas les permissions de secrétaire.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Données de la secrétaire
  const secretaryData = {
    pendingInscriptions: 12,
    cardsToPrint: 25,
    upcomingEvents: 3,
    unreadMessages: 7,
    monthlyStats: {
      inscriptions: 45,
      documentsProcessed: 128,
      completionRate: 85
    }
  };

  const recentActivities = [
    { id: 1, action: "Nouvelle inscription", student: "Jean Martin", time: "10:30", status: "pending" },
    { id: 2, action: "Carte étudiante générée", student: "Marie Curie", time: "09:15", status: "completed" },
    { id: 3, action: "Document archivé", student: "Pierre Durand", time: "08:45", status: "completed" },
  ];

  const quickAddCards = [
    {
      title: "Nouvelle Inscription",
      description: "Inscrire un nouvel étudiant",
      icon: <FaUserGraduate className="text-2xl text-blue-600" />,
      href: "/dashboard/secretaire/inscriptions",
      color: "bg-blue-50 border-blue-200",
      buttonColor: "bg-blue-600 hover:bg-blue-700"
    },
    {
      title: "Créer un Événement", 
      description: "Planifier un événement scolaire",
      icon: <FaCalendarAlt className="text-2xl text-green-600" />,
      href: "/dashboard/secretaire/evenements",
      color: "bg-green-50 border-green-200",
      buttonColor: "bg-green-600 hover:bg-green-700"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <div className="h-screen overflow-y-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* En-tête avec info utilisateur */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 sticky top-0 z-10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Tableau de Bord Secrétaire
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Bienvenue, {user.firstName} {user.lastName} 👩‍💼
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      ✅ Secrétaire
                    </span>
                    <span className="text-sm text-gray-500">
                      {user.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                  {new Date().toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>

            {/* Cartes d'ajout rapide */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Actions Rapides</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickAddCards.map((card, index) => (
                  <div 
                    key={index}
                    className={`${card.color} border-2 rounded-xl p-6 flex flex-col h-full transition-all hover:shadow-lg hover:border-gray-300`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        {card.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{card.title}</h3>
                        <p className="text-gray-600 text-sm">{card.description}</p>
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <Link
                        href={card.href}
                        className={`${card.buttonColor} text-white font-semibold py-3 px-4 rounded-lg w-full flex items-center justify-center gap-2 transition-colors hover:shadow-md`}
                      >
                        <FaPlus />
                        <span>Commencer</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contenu principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              
              {/* Colonne de gauche */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Statistiques */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Aperçu Administratif</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-white border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Inscriptions ce mois</p>
                            <p className="text-2xl font-bold text-gray-900">{secretaryData.monthlyStats.inscriptions}</p>
                          </div>
                          <FaUserGraduate className="h-8 w-8 text-blue-500" />
                        </div>
                        <Progress value={75} className="mt-2" />
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Documents traités</p>
                            <p className="text-2xl font-bold text-gray-900">{secretaryData.monthlyStats.documentsProcessed}</p>
                          </div>
                          <FaFileAlt className="h-8 w-8 text-green-500" />
                        </div>
                        <Progress value={90} className="mt-2" />
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Taux de complétion</p>
                            <p className="text-2xl font-bold text-gray-900">{secretaryData.monthlyStats.completionRate}%</p>
                          </div>
                          <FaChartLine className="h-8 w-8 text-purple-500" />
                        </div>
                        <Progress value={secretaryData.monthlyStats.completionRate} className="mt-2" />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Widgets principaux */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inscriptions en Attente</CardTitle>
                        <FaUserGraduate className="h-4 w-4 text-orange-500" />
                      </CardHeader>
                      <CardContent className="pt-4 space-y-2">
                        <div className="text-3xl font-bold text-orange-600">
                          {secretaryData.pendingInscriptions}
                        </div>
                        <p className="text-xs text-gray-700">À traiter aujourd'hui</p>
                        <Link href="/dashboard/secretaire/inscriptions" passHref>
                          <Button variant="link" className="p-0 h-auto text-principal text-xs">
                            Traiter maintenant <FaArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cartes à Imprimer</CardTitle>
                        <FaIdCard className="h-4 w-4 text-blue-500" />
                      </CardHeader>
                      <CardContent className="pt-4 space-y-2">
                        <div className="text-3xl font-bold text-blue-600">
                          {secretaryData.cardsToPrint}
                        </div>
                        <p className="text-xs text-gray-700">En attente</p>
                        <Link href="/dashboard/secretaire/cartes" passHref>
                          <Button variant="link" className="p-0 h-auto text-principal text-xs">
                            Imprimer <FaArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Activités récentes */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Activités Récentes</h3>
                  <div className="space-y-3">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          {activity.status === 'completed' ? (
                            <FaCheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <FaExclamationTriangle className="h-4 w-4 text-orange-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-gray-500">{activity.student}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Colonne de droite */}
              <div className="space-y-6">
                
                {/* Alertes */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <FaBell className="text-red-600" />
                    Alertes Urgentes
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="text-sm text-red-800">
                        <span className="font-medium">{secretaryData.pendingInscriptions} inscriptions</span> en attente
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="text-sm text-red-800">
                        <span className="font-medium">{secretaryData.cardsToPrint} cartes</span> à imprimer
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="text-sm text-red-800">
                        <span className="font-medium">{secretaryData.unreadMessages} messages</span> non lus
                      </div>
                    </div>
                  </div>
                  <button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    Voir les alertes
                  </button>
                </div>

                {/* Événements à venir */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Événements à Venir</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <FaCalendarAlt className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Réunion parents</p>
                        <p className="text-xs text-gray-600">Demain, 14h00</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <FaCalendarAlt className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Commission pédagogique</p>
                        <p className="text-xs text-gray-600">Vendredi, 10h00</p>
                      </div>
                    </div>
                  </div>
                  <Link href="/dashboard/secretaire/evenements" className="w-full mt-4 block">
                    <Button variant="outline" className="w-full">
                      Voir tous les événements
                    </Button>
                  </Link>
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