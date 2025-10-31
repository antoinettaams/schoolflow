"use client";
import React, { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
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
      if (userRole !== "Administrateur") {
        router.push("/unauthorized");
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Chargement de vos informations...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Redirection vers la connexion...</div>
      </div>
    );
  }

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
              className="bg-blue-600 text-white hover:bg-blue-700 w-full"
            >
              Retour à l&apos;accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = {
    totalStudents: 450,
    totalTeachers: 28,
    totalParents: 420,
    totalClasses: 15,
    activePayments: 12,
    pendingTasks: 3
  };

  const quickAddCards = [
    { title: "Ajouter un Professeur", description: "Créer un nouveau compte professeur", icon: <FaChalkboardTeacher className="text-2xl text-blue-600" />, href: "/auth/signup", color: "bg-blue-50 border-blue-200", buttonColor: "bg-blue-600 hover:bg-blue-700" },
    { title: "Ajouter un Parent", description: "Créer un nouveau compte parent", icon: <FaUsers className="text-2xl text-green-600" />, href: "/auth/signup", color: "bg-green-50 border-green-200", buttonColor: "bg-green-600 hover:bg-green-700" },
    { title: "Ajouter un Élève", description: "Inscrire un nouvel élève", icon: <FaUserGraduate className="text-2xl text-purple-600" />, href: "/auth/signup", color: "bg-purple-50 border-purple-200", buttonColor: "bg-purple-600 hover:bg-purple-700" },
    { title: "Ajouter un Censeur", description: "Créer un nouveau compte pour un censeur", icon: <FaShieldAlt className="text-2xl text-red-600" />, href: "/auth/signup", color: "bg-red-50 border-red-200", buttonColor: "bg-red-600 hover:bg-red-700" },
    { title: "Ajouter un Comptable", description: "Créer un nouveau compte comptable", icon: <FaUsers className="text-2xl text-indigo-600" />, href: "/auth/signup", color: "bg-indigo-50 border-indigo-200", buttonColor: "bg-indigo-600 hover:bg-indigo-700" },
    { title: "Ajouter un Secrétaire", description: "Créer un nouveau compte secrétaire", icon: <FaUsers className="text-2xl text-amber-600" />, href: "/auth/signup", color: "bg-amber-50 border-amber-200", buttonColor: "bg-amber-600 hover:bg-amber-700" },
  ];

  const statCards = [
    { title: "Élèves", value: stats.totalStudents, icon: <FaUserGraduate className="text-2xl text-blue-600" />, color: "bg-blue-50 border-blue-200", change: "+5%", trend: "up" },
    { title: "Professeurs", value: stats.totalTeachers, icon: <FaChalkboardTeacher className="text-2xl text-green-600" />, color: "bg-green-50 border-green-200", change: "+2%", trend: "up" },
    { title: "Parents", value: stats.totalParents, icon: <FaUsers className="text-2xl text-purple-600" />, color: "bg-purple-50 border-purple-200", change: "+8%", trend: "up" },
    { title: "Classes", value: stats.totalClasses, icon: <FaSchool className="text-2xl text-orange-600" />, color: "bg-orange-50 border-orange-200", change: "0%", trend: "neutral" }
  ];

  const quickActions = [
    { title: "Statistiques Détaillées", description: "Analytiques complètes de l&apos;établissement", icon: <FaChartBar className="text-xl text-blue-600" />, href: "/dashboard/admin/analytics", count: "15 rapports" },
    { title: "Gestion des Paiements", description: "Suivi des frais de scolarité et facturation", icon: <FaMoneyBillWave className="text-xl text-green-600" />, href: "/dashboard/admin/payments", count: `${stats.activePayments} en attente` },
    { title: "Emplois du Temps", description: "Gestion des horaires et planning", icon: <FaCalendarAlt className="text-xl text-purple-600" />, href: "/dashboard/admin/schedules", count: "4 modifications" },
    { title: "Système de Notes", description: "Configuration des calculs de moyennes", icon: <FaFileAlt className="text-xl text-red-600" />, href: "/dashboard/admin/grading", count: "3 classes" },
    { title: "Bulletins et Rapports", description: "Génération des bulletins scolaires", icon: <FaClipboardList className="text-xl text-indigo-600" />, href: "/dashboard/admin/reports", count: "28 bulletins" },
    { title: "Notifications", description: "Envoi d&apos;alertes et communications", icon: <FaBell className="text-xl text-yellow-600" />, href: "/dashboard/admin/notifications", count: "5 non lues" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <div className="bg-white min-h-screen">
        <ScrollArea className="h-screen">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

              {/* Header */}
              <Card className="p-4 sm:p-6 sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Tableau de Bord Administrateur
                      </h1>
                      <p className="text-gray-600 mt-1 sm:mt-2">
                        Bienvenue, {user.firstName} {user.lastName} 👋
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          ✅ Administrateur
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {user.primaryEmailAddress?.emailAddress}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm sm:text-base text-gray-500 bg-gray-100 px-3 py-2 rounded-lg shrink-0">
                      {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Add Users */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Ajout Rapide d&apos;Utilisateurs</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {quickAddCards.map((card, index) => (
                    <Card key={index} className={`${card.color} border-2 transition-all hover:shadow-lg hover:border-gray-300 bg-white flex flex-col`}>
                      <CardContent className="p-4 sm:p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-3 bg-white rounded-lg shadow-sm border">{card.icon}</div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-lg">{card.title}</h3>
                            <p className="text-gray-600 text-xs sm:text-sm">{card.description}</p>
                          </div>
                        </div>
                        <div className="mt-auto">
                          <Link href={card.href}>
                            <Button className={`${card.buttonColor} text-white font-semibold py-2 sm:py-3 px-3 sm:px-4 w-full flex items-center justify-center gap-2`}>
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

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Statistiques */}
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="text-xl sm:text-2xl">Aperçu Global</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {statCards.map((stat, index) => (
                          <Card key={index} className={`${stat.color} border transition-all hover:shadow-md bg-white`}>
                            <CardContent className="p-4 sm:p-6 flex flex-col">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-gray-600 text-sm sm:text-base">{stat.title}</div>
                                <div className={`text-xs sm:text-sm font-semibold ${
                                  stat.trend === 'up' ? 'text-green-600' : 
                                  stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {stat.change}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</div>
                                <div className="p-2 sm:p-3 bg-white rounded-lg shadow-sm border">{stat.icon}</div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="text-lg sm:text-xl">Actions Rapides</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64 sm:h-80 pr-2">
                        <div className="space-y-3 sm:space-y-4">
                          {quickActions.map((action, index) => (
                            <Link
                              key={index}
                              href={action.href}
                              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all hover:shadow-sm group bg-white"
                            >
                              <div className="p-2 sm:p-3 bg-gray-100 rounded-lg group-hover:bg-white transition-colors border">{action.icon}</div>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base">{action.title}</div>
                                <div className="text-xs sm:text-sm text-gray-500">{action.description}</div>
                              </div>
                              <Badge variant="secondary" className="text-xs sm:text-sm font-semibold bg-gray-100">{action.count}</Badge>
                            </Link>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">

                  {/* Support */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="font-semibold text-blue-900 mb-1 sm:mb-2">Support & Aide</h3>
                      <p className="text-blue-800 text-xs sm:text-sm mb-3 sm:mb-4">
                        Besoin d&apos;aide pour gérer votre établissement ?
                      </p>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-3">Contacter le support</Button>
                    </CardContent>
                  </Card>

                  {/* Activité récente */}
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Activité Récente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 sm:space-y-4">
                        {[
                          { color: "bg-green-500", text: "5 nouveaux élèves inscrits aujourd'hui", bold: "5 nouveaux élèves" },
                          { color: "bg-blue-500", text: "3 professeurs ont mis à jour leur profil", bold: "3 professeurs" },
                          { color: "bg-purple-500", text: "12 paiements traités cette semaine", bold: "12 paiements" },
                          { color: "bg-amber-500", text: "8 bulletins générés aujourd'hui", bold: "8 bulletins" },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 sm:gap-3">
                            <div className={`w-2 h-2 sm:w-3 sm:h-3 ${item.color} rounded-full shrink-0`}></div>
                            <div className="text-xs sm:text-sm text-gray-600">
                              <span className="font-medium">{item.bold}</span> {item.text.replace(item.bold, "")}
                            </div>
                          </div>
                        ))}
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
