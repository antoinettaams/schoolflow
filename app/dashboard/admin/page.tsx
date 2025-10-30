"use client";
import React from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { 
  FaChalkboardTeacher, 
  FaUserGraduate, 
  FaUsers,
  FaShieldAlt,
  FaPlus,
  FaSchool,
  FaChartBar,
  FaMoneyBillWave,
  FaBell,
  FaCalendarAlt,
  FaFileAlt,
  FaClipboardList,
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const AdminDashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // Vérification du rôle administrateur
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const userRole = user?.publicMetadata?.role;
      console.log("Rôle utilisateur:", userRole);
      
      if (userRole !== "Administrateur") {
        console.log("❌ Accès refusé - Rôle incorrect");
        router.push("/unauthorized");
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

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
  if (userRole !== "Administrateur") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Accès Refusé</CardTitle>
            <CardDescription className="text-gray-600">
              Vous n&apos;avez pas les permissions d&apos;administrateur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/")}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Retour à l&apos;accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Statistiques simulées
  const stats = {
    totalStudents: 450,
    totalTeachers: 28,
    totalParents: 420,
    totalClasses: 15,
    activePayments: 12,
    pendingTasks: 3
  };

  // Cartes d'ajout rapide
  const quickAddCards = [
    {
      title: "Ajouter un Professeur",
      description: "Créer un nouveau compte professeur",
      icon: <FaChalkboardTeacher className="text-2xl text-blue-600" />,
      href: "/auth/signup",
      color: "bg-blue-50 border-blue-200",
      buttonColor: "bg-blue-600 hover:bg-blue-700"
    },
    {
      title: "Ajouter un Parent", 
      description: "Créer un nouveau compte parent",
      icon: <FaUsers className="text-2xl text-green-600" />,
      href: "/auth/signup",
      color: "bg-green-50 border-green-200",
      buttonColor: "bg-green-600 hover:bg-green-700"
    },
    {
      title: "Ajouter un Élève",
      description: "Inscrire un nouvel élève",
      icon: <FaUserGraduate className="text-2xl text-purple-600" />,
      href: "/auth/signup", 
      color: "bg-purple-50 border-purple-200",
      buttonColor: "bg-purple-600 hover:bg-purple-700"
    },
    {
      title: "Ajouter un Censeur",
      description: "Créer un nouveau compte pour un censeur",
      icon: <FaShieldAlt className="text-2xl text-red-600" />,
      href: "/auth/signup",
      color: "bg-red-50 border-red-200",
      buttonColor: "bg-red-600 hover:bg-red-700"
    },
    {
      title: "Ajouter un Comptable",
      description: "Créer un nouveau compte comptable",
      icon: <FaUsers className="text-2xl text-indigo-600" />,
      href: "/auth/signup",
      color: "bg-indigo-50 border-indigo-200",
      buttonColor: "bg-indigo-600 hover:bg-indigo-700",
    },
    {
      title: "Ajouter un Secrétaire",
      description: "Créer un nouveau compte secrétaire",
      icon: <FaUsers className="text-2xl text-amber-600" />,
      href: "/auth/signup",
      color: "bg-amber-50 border-amber-200",
      buttonColor: "bg-amber-600 hover:bg-amber-700",
    }
  ];

  // Cartes de statistiques
  const statCards = [
    {
      title: "Élèves",
      value: stats.totalStudents,
      icon: <FaUserGraduate className="text-2xl text-blue-600" />,
      color: "bg-blue-50 border-blue-200",
      change: "+5%",
      trend: "up"
    },
    {
      title: "Professeurs", 
      value: stats.totalTeachers,
      icon: <FaChalkboardTeacher className="text-2xl text-green-600" />,
      color: "bg-green-50 border-green-200",
      change: "+2%",
      trend: "up"
    },
    {
      title: "Parents",
      value: stats.totalParents, 
      icon: <FaUsers className="text-2xl text-purple-600" />,
      color: "bg-purple-50 border-purple-200",
      change: "+8%",
      trend: "up"
    },
    {
      title: "Classes",
      value: stats.totalClasses,
      icon: <FaSchool className="text-2xl text-orange-600" />,
      color: "bg-orange-50 border-orange-200",
      change: "0%",
      trend: "neutral"
    }
  ];

  // Actions rapides
  const quickActions = [
    {
      title: "Statistiques Détaillées",
      description: "Analytiques complètes de l&apos;établissement",
      icon: <FaChartBar className="text-xl text-blue-600" />,
      href: "/dashboard/admin/analytics",
      count: "15 rapports"
    },
    {
      title: "Gestion des Paiements", 
      description: "Suivi des frais de scolarité et facturation", 
      icon: <FaMoneyBillWave className="text-xl text-green-600" />,
      href: "/dashboard/admin/payments",
      count: `${stats.activePayments} en attente`
    },
    {
      title: "Emplois du Temps",
      description: "Gestion des horaires et planning",
      icon: <FaCalendarAlt className="text-xl text-purple-600" />,
      href: "/dashboard/admin/schedules",
      count: "4 modifications"
    },
    {
      title: "Système de Notes",
      description: "Configuration des calculs de moyennes",
      icon: <FaFileAlt className="text-xl text-red-600" />,
      href: "/dashboard/admin/grading",
      count: "3 classes"
    },
    {
      title: "Bulletins et Rapports",
      description: "Génération des bulletins scolaires",
      icon: <FaClipboardList className="text-xl text-indigo-600" />,
      href: "/dashboard/admin/reports",
      count: "28 bulletins"
    },
    {
      title: "Notifications",
      description: "Envoi d&apos;alertes et communications",
      icon: <FaBell className="text-xl text-yellow-600" />,
      href: "/dashboard/admin/notifications",
      count: "5 non lues"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Suppression de la transparence avec bg-white sur le conteneur principal */}
      <div className="bg-white min-h-screen">
        <ScrollArea className="h-screen">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              
              {/* En-tête fixe avec fond blanc opaque */}
              <Card className="p-6 mb-6 sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        Tableau de Bord Administrateur
                      </h1>
                      <p className="text-gray-600 mt-2">
                        Bienvenue, {user.firstName} {user.lastName} 👋
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          ✅ Administrateur
                        </Badge>
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
                </CardContent>
              </Card>

              {/* PREMIÈRE LIGNE - 2 cartes d'ajout */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Ajout Rapide d&apos;Utilisateurs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {quickAddCards.slice(0, 2).map((card, index) => (
                    <Card 
                      key={index}
                      className={`${card.color} border-2 transition-all hover:shadow-lg hover:border-gray-300 bg-white`}
                    >
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 bg-white rounded-lg shadow-sm border">
                            {card.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg">{card.title}</h3>
                            <p className="text-gray-600 text-sm">{card.description}</p>
                          </div>
                        </div>
                        
                        <div className="mt-auto">
                          <Link href={card.href}>
                            <Button className={`${card.buttonColor} text-white font-semibold py-3 px-4 w-full flex items-center justify-center gap-2`}>
                              <FaPlus />
                              <span>Ajouter maintenant</span>
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* DEUXIÈME LIGNE - 2 cartes d'ajout */}
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {quickAddCards.slice(2, 4).map((card, index) => (
                    <Card 
                      key={index}
                      className={`${card.color} border-2 transition-all hover:shadow-lg hover:border-gray-300 bg-white`}
                    >
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 bg-white rounded-lg shadow-sm border">
                            {card.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg">{card.title}</h3>
                            <p className="text-gray-600 text-sm">{card.description}</p>
                          </div>
                        </div>
                        
                        <div className="mt-auto">
                          <Link href={card.href}>
                            <Button className={`${card.buttonColor} text-white font-semibold py-3 px-4 w-full flex items-center justify-center gap-2`}>
                              <FaPlus />
                              <span>Ajouter maintenant</span>
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* TROISIÈME LIGNE - 2 dernières cartes d'ajout */}
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {quickAddCards.slice(4, 6).map((card, index) => (
                    <Card 
                      key={index}
                      className={`${card.color} border-2 transition-all hover:shadow-lg hover:border-gray-300 bg-white`}
                    >
                      <CardContent className="p-6 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="p-3 bg-white rounded-lg shadow-sm border">
                            {card.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg">{card.title}</h3>
                            <p className="text-gray-600 text-sm">{card.description}</p>
                          </div>
                        </div>
                        
                        <div className="mt-auto">
                          <Link href={card.href}>
                            <Button className={`${card.buttonColor} text-white font-semibold py-3 px-4 w-full flex items-center justify-center gap-2`}>
                              <FaPlus />
                              <span>Ajouter maintenant</span>
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Contenu central avec défilement */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                
                {/* Colonne de gauche - Contenu principal défilable */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Statistiques */}
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="text-2xl">Aperçu Global</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        {statCards.map((stat, index) => (
                          <Card 
                            key={index}
                            className={`${stat.color} border transition-all hover:shadow-md bg-white`}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-gray-600 text-sm">{stat.title}</div>
                                <div className={`text-xs font-semibold ${
                                  stat.trend === 'up' ? 'text-green-600' : 
                                  stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {stat.change}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                                <div className="p-3 bg-white rounded-lg shadow-sm border">
                                  {stat.icon}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions rapides avec défilement vertical */}
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="text-xl">Actions Rapides</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-80 pr-2">
                        <div className="space-y-4">
                          {quickActions.map((action, index) => (
                            <Link
                              key={index}
                              href={action.href}
                              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all hover:shadow-sm group bg-white"
                            >
                              <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-white transition-colors border">
                                {action.icon}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {action.title}
                                </div>
                                <div className="text-sm text-gray-500">{action.description}</div>
                              </div>
                              <Badge variant="secondary" className="text-xs font-semibold bg-gray-100">
                                {action.count}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                </div>

                {/* Colonne de droite */}
                <div className="space-y-6">
                  
                  {/* Support rapide */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-blue-900 mb-2">Support & Aide</h3>
                      <p className="text-blue-800 text-sm mb-4">
                        Besoin d&apos;aide pour gérer votre établissement ?
                      </p>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                        Contacter le support
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Activité récente */}
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="text-lg">Activité Récente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">5 nouveaux élèves</span> inscrits aujourd&apos;hui
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">3 professeurs</span> ont mis à jour leur profil
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">12 paiements</span> traités cette semaine
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">8 bulletins</span> générés aujourd&apos;hui
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default AdminDashboard;