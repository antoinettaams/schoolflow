"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { 
  FaMoneyBillWave, 
  FaCreditCard, 
  FaFileInvoiceDollar, 
  FaCalculator,
  FaChartLine,
  FaArrowRight,
  FaBalanceScale,
  FaRegMoneyBillAlt,
  FaExclamationTriangle,
  FaPlus
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const ComptableDashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // Vérification du rôle comptable
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const userRole = user?.publicMetadata?.role;
      console.log("Rôle utilisateur:", userRole);
      
      if (userRole !== "Comptable") {
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
  if (userRole !== "Comptable") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès Refusé</h1>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas les permissions de comptable.
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

  // Données du comptable
  const comptableData = {
    pendingPayments: 18,
    unpaidInvoices: 7,
    pendingReceipts: 12,
    monthlyRevenue: 125430,
    expensesThisMonth: 89450,
    budgetUtilization: 72
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const quickAddCards = [
    {
      title: "Nouvelle Facture",
      description: "Créer une nouvelle facture",
      icon: <FaFileInvoiceDollar className="text-2xl text-blue-600" />,
      href: "/dashboard/comptable/invoices",
      color: "bg-blue-50 border-blue-200",
      buttonColor: "bg-blue-600 hover:bg-blue-700"
    },
    {
      title: "Enregistrer Paiement", 
      description: "Enregistrer un nouveau paiement",
      icon: <FaCreditCard className="text-2xl text-green-600" />,
      href: "/dashboard/comptable/payments",
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
                    Tableau de Bord Comptable
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Bienvenue, {user.firstName} {user.lastName} 💰
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      ✅ Comptable
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Opérations Financières</h2>
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Aperçu Financier</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-white border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Chiffre d'Affaires</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(comptableData.monthlyRevenue)}
                            </p>
                          </div>
                          <FaChartLine className="h-8 w-8 text-green-500" />
                        </div>
                        <div className="text-xs text-green-600 mt-2">+12% ce mois</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Dépenses du Mois</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(comptableData.expensesThisMonth)}
                            </p>
                          </div>
                          <FaMoneyBillWave className="h-8 w-8 text-red-500" />
                        </div>
                        <div className="text-xs text-red-600 mt-2">+8% ce mois</div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Utilisation Budget</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {comptableData.budgetUtilization}%
                            </p>
                          </div>
                          <FaRegMoneyBillAlt className="h-8 w-8 text-blue-500" />
                        </div>
                        <Progress value={comptableData.budgetUtilization} className="mt-2" />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Widgets principaux */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paiements en Attente</CardTitle>
                        <FaCreditCard className="h-4 w-4 text-orange-500" />
                      </CardHeader>
                      <CardContent className="pt-4 space-y-2">
                        <div className="text-3xl font-bold text-orange-600">
                          {comptableData.pendingPayments}
                        </div>
                        <p className="text-xs text-gray-700">À traiter</p>
                        <Link href="/dashboard/comptable/payments" passHref>
                          <Button variant="link" className="p-0 h-auto text-principal text-xs">
                            Traiter <FaArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Factures Impayées</CardTitle>
                        <FaFileInvoiceDollar className="h-4 w-4 text-red-500" />
                      </CardHeader>
                      <CardContent className="pt-4 space-y-2">
                        <div className="text-3xl font-bold text-red-600">
                          {comptableData.unpaidInvoices}
                        </div>
                        <p className="text-xs text-gray-700">Relance nécessaire</p>
                        <Link href="/dashboard/comptable/invoices" passHref>
                          <Button variant="link" className="p-0 h-auto text-principal text-xs">
                            Relancer <FaArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                </div>

              </div>

              {/* Colonne de droite */}
              <div className="space-y-6">
                
                {/* Alertes */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <FaExclamationTriangle className="text-red-600" />
                    Alertes Financières
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="text-sm text-red-800">
                        <span className="font-medium">{comptableData.unpaidInvoices} factures</span> impayées
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="text-sm text-red-800">
                        <span className="font-medium">{comptableData.pendingPayments} paiements</span> en attente
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="text-sm text-red-800">
                        <span className="font-medium">{comptableData.pendingReceipts} reçus</span> à générer
                      </div>
                    </div>
                  </div>
                  <button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    Voir les alertes
                  </button>
                </div>

                {/* État comptable */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">État Comptable</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <FaBalanceScale className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Balance équilibrée</p>
                        <p className="text-xs text-gray-600">Dernière vérification</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <FaCalculator className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Calcul des frais</p>
                        <p className="text-xs text-gray-600">12 filières à jour</p>
                      </div>
                    </div>
                  </div>
                  <Link href="/dashboard/comptable/balance" className="w-full mt-4 block">
                    <Button variant="outline" className="w-full">
                      Vérifier la balance
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

export default ComptableDashboard;