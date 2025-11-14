// components/ParentDashboard.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { 
  FaCalendarAlt, 
  FaRegChartBar, 
  FaClipboardList, 
  FaGraduationCap, 
  FaArrowRight, 
  FaClock, 
  FaFileAlt, 
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock as FaClockIcon,
  FaExclamationCircle
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Types pour les données - CORRIGÉ
interface DashboardData {
  childInfo: {
    name: string;
    className: string;
    latestGrade: string;
    absencesLastWeek: number;
    attendanceRate: number;
    overallAverage: number;
  };
  nextSchedule: {
    subject: string;
    time: string;
    location: string;
  };
  nextEvent: {
    name: string;
    date: string;
    type: string;
  };
  latestBulletin: {
    trimester: string;
    average: string;
    mention: string;
    link: string;
  };
  inscriptionInfo: { // CORRECTION: financialInfo → inscriptionInfo
    montantTotal: string;
    montantPaye: string;
    montantRestant: string;
    statut: 'en_attente' | 'partiel' | 'complet';
    dueDate: string;
    hasInscription: boolean;
  };
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    timestamp: string;
    type: 'grade' | 'attendance' | 'homework' | 'payment';
    isRead: boolean;
  }>;
}

const ParentDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/parents/dashboard');
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données');
      }
      
      const data: DashboardData = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les données du dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour obtenir la couleur du statut des frais
  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'complet':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partiel':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'en_attente':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Fonction pour obtenir l'icône du statut
  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'complet':
        return <FaCheckCircle className="h-4 w-4" />;
      case 'partiel':
        return <FaClockIcon className="h-4 w-4" />;
      case 'en_attente':
        return <FaExclamationCircle className="h-4 w-4" />;
      default:
        return <FaMoneyBillWave className="h-4 w-4" />;
    }
  };

  // Fonction pour obtenir le libellé du statut
  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'complet':
        return 'Complètement payé';
      case 'partiel':
        return 'Paiement partiel';
      case 'en_attente':
        return 'En attente de paiement';
      default:
        return statut;
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 h-full bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <FaExclamationTriangle className="mx-auto text-red-500 text-4xl mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchDashboardData}>Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6 h-full bg-gray-50 flex items-center justify-center">
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  // CORRECTION: Utiliser inscriptionInfo au lieu de financialInfo
  const { childInfo, nextSchedule, nextEvent, latestBulletin, inscriptionInfo } = dashboardData;

  // Fonction pour déterminer la couleur en fonction du taux d'absence
  const getAbsenceColor = (absences: number) => {
    if (absences === 0) return 'text-green-600';
    if (absences <= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Fonction pour déterminer la couleur du taux de présence
  const getAttendanceColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6 h-full bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">

      {/* SECTION BIENVENUE */}
      <header className="pb-4 border-b border-gray-200">
        <h1 className="font-title text-3xl font-extrabold tracking-tight text-gray-900">
          Bonjour! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Supervision de votre enfant : <span className="font-semibold">{childInfo.name} ({childInfo.className})</span>.
        </p>
      </header>

      {/* GRID HAUT: Dernière Note, Assiduité, Prochain Cours */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Dernière Note */}
        <Card className="hover:shadow-lg transition">
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="font-title text-sm font-medium">Dernière Note</CardTitle>
            <FaRegChartBar className="text-principal h-5 w-5" />
          </CardHeader>
          <CardContent className="pt-2 space-y-1">
            <div className="text-3xl font-bold text-green-600">
              {childInfo.latestGrade.split('/')[0]}
            </div>
            <p className="text-xs text-gray-700">
              {childInfo.latestGrade.includes('en ') 
                ? childInfo.latestGrade.split('en ')[1]
                : childInfo.latestGrade
              }
            </p>
            <Link href="/dashboard/parent/exams" className="mt-1 inline-block">
              <Button variant="link" className="font-link p-0 text-principal text-xs">
                Voir toutes les notes <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Assiduité */}
        <Card className="hover:shadow-lg transition">
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="font-title text-sm font-medium">Assiduité (7 jours)</CardTitle>
            <FaClipboardList className="text-principal h-5 w-5" />
          </CardHeader>
          <CardContent className="pt-2 space-y-1">
            <div className={`text-3xl font-bold ${getAbsenceColor(childInfo.absencesLastWeek)}`}>
              {childInfo.absencesLastWeek}
            </div>
            <p className="text-xs text-gray-700">
              {childInfo.absencesLastWeek === 0 ? "Aucune absence" : 
               childInfo.absencesLastWeek === 1 ? "Absence signalée" : 
               "Absences signalées"}
            </p>
            <p className={`text-xs font-medium ${getAttendanceColor(childInfo.attendanceRate)}`}>
              Taux de présence: {childInfo.attendanceRate}%
            </p>
            <Link href="/dashboard/parent/attendance" className="mt-1 inline-block">
              <Button variant="link" className="font-link p-0 text-principal text-xs">
                Détails complets <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Prochain Cours */}
        <Card className="hover:shadow-lg transition">
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium font-title">Prochain Cours</CardTitle>
            <FaCalendarAlt className="text-principal h-5 w-5" />
          </CardHeader>
          <CardContent className="pt-2 space-y-1">
            <div className="text-xl font-bold text-gray-900">{nextSchedule.subject}</div>
            <p className="text-xs text-gray-700 flex items-center gap-1">
              <FaClock className="h-3 w-3" /> {nextSchedule.time} à {nextSchedule.location}
            </p>
            <Link href="/dashboard/parent/schedules" className="mt-1 inline-block">
              <Button variant="link" className="font-link p-0 text-principal text-xs">
                Voir l'EDT complet <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* GRID BAS: Évènement, Bulletins, Frais d'Inscription */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Évènement à Venir */}
        <Card className="hover:shadow-lg transition">
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium font-title">Évènement à Venir</CardTitle>
            <FaGraduationCap className="text-principal h-5 w-5" />
          </CardHeader>
          <CardContent className="pt-2 space-y-1">
            <div className="text-xl font-bold text-gray-900">{nextEvent.name}</div>
            <p className="text-xs text-gray-700">Date : {nextEvent.date}</p>
            <Link href="/dashboard/parent/events" className="mt-1 inline-block">
              <Button variant="link" className="font-link p-0 text-principal text-xs">
                Calendrier complet <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Bulletin */}
        <Card className="hover:shadow-lg transition">
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium font-title">Dernier Bulletin</CardTitle>
            <FaFileAlt className="text-principal h-5 w-5" />
          </CardHeader>
          <CardContent className="pt-2 space-y-1">
            <div className="text-xl font-bold text-gray-900">{latestBulletin.trimester}</div>
            <p className="text-sm text-gray-700">Moyenne: {latestBulletin.average}</p>
            <p className="text-xs text-gray-600">Mention: {latestBulletin.mention}</p>
            <Link href="/parent/exams" className="mt-1 inline-block">
              <Button variant="link" className="font-link p-0 text-principal text-xs">
                Voir les notes <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Frais d'Inscription - CORRIGÉ */}
        <Card className="hover:shadow-lg transition">
          <CardHeader>
            <CardTitle className="font-title text-lg font-bold text-gray-800 flex items-center gap-2">
              <FaMoneyBillWave className="text-principal" />
              Frais d'Inscription
            </CardTitle>
            <CardDescription>
              {inscriptionInfo.hasInscription ? "État des paiements d'inscription" : "Aucune inscription trouvée - Montant par défaut"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 space-y-3">
            {/* Badge de statut */}
            <div className="flex justify-between items-center">
              <Badge variant="outline" className={`${getStatusColor(inscriptionInfo.statut)} flex items-center gap-1`}>
                {getStatusIcon(inscriptionInfo.statut)}
                {getStatusLabel(inscriptionInfo.statut)}
              </Badge>
              {!inscriptionInfo.hasInscription && (
                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                  Données par défaut
                </Badge>
              )}
            </div>

            {/* Montants */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total à payer:</span>
                <span className="font-semibold text-gray-900">{inscriptionInfo.montantTotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Déjà payé:</span>
                <span className={`font-semibold ${
                  inscriptionInfo.montantPaye === "0 FCFA" ? 'text-gray-600' : 'text-green-600'
                }`}>
                  {inscriptionInfo.montantPaye}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm font-medium text-gray-700">Reste à payer:</span>
                <span className={`font-bold ${
                  inscriptionInfo.statut === 'en_attente' ? 'text-red-600' : 
                  inscriptionInfo.statut === 'partiel' ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {inscriptionInfo.montantRestant}
                </span>
              </div>
            </div>

            {/* Date d'échéance */}
            <div className="text-xs text-gray-500 border-t pt-2">
              Échéance: {inscriptionInfo.dueDate}
            </div>

            {/* Bouton d'action */}
            <Link href="/dashboard/parent/paiements" className="text-white block mt-3">
              <Button className={`w-full font-link ${
                inscriptionInfo.statut === 'complet' ? 
                'bg-green-600 hover:bg-green-700' : 
                'bg-blue-600 hover:bg-blue-700'
              
              }`}>
                {inscriptionInfo.statut === 'complet' ? 'Consulter' : 'Consulter maintenant'}
              </Button>
            </Link>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

// Composant Skeleton pour le chargement
const DashboardSkeleton = () => {
  return (
    <div className="p-6 space-y-6 h-full bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      {/* Skeleton pour la section bienvenue */}
      <div className="pb-4 border-b border-gray-200">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Skeleton pour les cartes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex justify-between items-center pb-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </CardHeader>
            <CardContent className="pt-2 space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ParentDashboard;