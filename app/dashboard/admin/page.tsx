"use client";
import React from "react";
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
  FaClipboardList
} from "react-icons/fa";

const AdminDashboard = () => {
  // Statistiques simulées
  const stats = {
    totalStudents: 450,
    totalTeachers: 28,
    totalParents: 420,
    totalClasses: 15,
    activePayments: 12,
    pendingTasks: 3
  };

  // Cartes d'ajout rapide - 2 en haut, 2 en bas
  const quickAddCards = [
    {
      title: "Ajouter un Professeur",
      description: "Créer un nouveau compte professeur",
      icon: <FaChalkboardTeacher className="text-2xl text-blue-600" />,
      href: "/dashboard/admin/teachers/create",
      color: "bg-blue-50 border-blue-200",
      buttonColor: "bg-blue-600 hover:bg-blue-700"
    },
    {
      title: "Ajouter un Parent", 
      description: "Créer un nouveau compte parent",
      icon: <FaUsers className="text-2xl text-green-600" />,
      href: "/dashboard/admin/parents/create",
      color: "bg-green-50 border-green-200",
      buttonColor: "bg-green-600 hover:bg-green-700"
    },
    {
      title: "Ajouter un Élève",
      description: "Inscrire un nouvel élève",
      icon: <FaUserGraduate className="text-2xl text-purple-600" />,
      href: "/dashboard/admin/students/create", 
      color: "bg-purple-50 border-purple-200",
      buttonColor: "bg-purple-600 hover:bg-purple-700"
    },
    {
      title: "Ajouter un Admin",
      description: "Créer un nouveau compte administrateur",
      icon: <FaShieldAlt className="text-2xl text-red-600" />,
      href: "/dashboard/admin/admins/create",
      color: "bg-red-50 border-red-200",
      buttonColor: "bg-red-600 hover:bg-red-700"
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
      description: "Analytiques complètes de l'établissement",
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
      description: "Envoi d'alertes et communications",
      icon: <FaBell className="text-xl text-yellow-600" />,
      href: "/dashboard/admin/notifications",
      count: "5 non lues"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre de défilement principale */}
      <div className="h-screen overflow-y-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* En-tête fixe */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 sticky top-0 z-10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Administrateur</h1>
                  <p className="text-gray-600 mt-2">
                    Gérez l'ensemble de votre établissement scolaire
                  </p>
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

            {/* PREMIÈRE LIGNE - 2 cartes d'ajout */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Ajout Rapide d'Utilisateurs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickAddCards.slice(0, 2).map((card, index) => (
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
                        <span>Ajouter maintenant</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
             <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickAddCards.slice(2, 4).map((card, index) => (
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
                        <span>Ajouter maintenant</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contenu central avec défilement */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              
              {/* Colonne de gauche - Contenu principal défilable */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Statistiques */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Aperçu Global</h2>
                  <div className="grid grid-cols-2 gap-6">
                    {statCards.map((stat, index) => (
                      <div 
                        key={index}
                        className={`${stat.color} border rounded-xl p-6 transition-all hover:shadow-md`}
                      >
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
                          <div className="p-3 bg-white rounded-lg shadow-sm">
                            {stat.icon}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions rapides avec défilement vertical */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Actions Rapides</h3>
                  <div className="max-h-80 overflow-y-auto pr-2">
                    <div className="space-y-4">
                      {quickActions.map((action, index) => (
                        <Link
                          key={index}
                          href={action.href}
                          className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all hover:shadow-sm group"
                        >
                          <div className="p-3 bg-gray-100 rounded-lg group-hover:bg-white transition-colors">
                            {action.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {action.title}
                            </div>
                            <div className="text-sm text-gray-500">{action.description}</div>
                          </div>
                          <div className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            {action.count}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Colonne de droite - Contenu fixe */}
              <div className="space-y-6">
                
                {/* Alertes urgentes */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <FaBell className="text-red-600" />
                    Alertes Urgentes
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="text-sm text-red-800">
                        <span className="font-medium">{stats.pendingTasks} tâches critiques</span> nécessitent votre attention
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="text-sm text-red-800">
                        <span className="font-medium">{stats.activePayments} paiements</span> en attente de validation
                      </div>
                    </div>
                  </div>
                  <button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    Voir les alertes
                  </button>
                </div>

                {/* Performance système */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Performance du Système</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Utilisation stockage</span>
                        <span className="font-semibold">65%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Utilisateurs actifs</span>
                        <span className="font-semibold">89%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '89%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Taux de satisfaction</span>
                        <span className="font-semibold">92%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Support rapide */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl  py-11 px-10">
                  <h3 className="font-semibold text-blue-900 mb-2">Support & Aide</h3>
                  <p className="text-blue-800 text-sm mb-4">
                    Besoin d'aide pour gérer votre établissement ?
                  </p>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    Contacter le support
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;