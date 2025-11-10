// components/ParentDashboard.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { FaCalendarAlt, FaRegChartBar, FaClipboardList, FaGraduationCap, FaArrowRight, FaClock, FaFileAlt, FaExclamationTriangle } from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Types pour les données
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
  financialInfo: {
    amountDue: string;
    dueDate: string;
    status: 'en_retard' | 'a_jour' | 'en_attente';
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

  const { childInfo, nextSchedule, nextEvent, latestBulletin, financialInfo } = dashboardData;

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
            <div className={`text-3xl font-bold ${childInfo.absencesLastWeek > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {childInfo.absencesLastWeek}
            </div>
            <p className="text-xs text-gray-700">
              {childInfo.absencesLastWeek <= 1 ? "Absence signalée" : "Absences signalées"}
            </p>
            <p className="text-xs text-gray-500">
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

      {/* GRID BAS: Évènement, Bulletins, Frais Scolaires */}
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

        {/* Bulletins */}
        <Card className="hover:shadow-lg transition">
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium font-title">Bulletins</CardTitle>
            <FaFileAlt className="text-principal h-5 w-5" />
          </CardHeader>
          <CardContent className="pt-2 space-y-1">
            <div className="text-sm font-semibold text-gray-900">{latestBulletin.trimester}</div>
            <p className="text-xs text-gray-700">Moyenne : {latestBulletin.average}</p>
            <p className="text-xs text-gray-700">Mention : {latestBulletin.mention}</p>
            <Link href={latestBulletin.link} className="mt-1 inline-block" target="_blank">
              <Button variant="link" className="font-link p-0 text-principal text-xs">
                Télécharger le bulletin <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Frais Scolaires */}
        <Card className="hover:shadow-lg transition">
          <CardHeader>
            <CardTitle className="font-title text-lg font-bold text-gray-800">Frais Scolaires</CardTitle>
            <CardDescription>Facture en attente ou prochaine échéance</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 space-y-2">
            <div className="text-3xl font-bold text-red-500">{financialInfo.amountDue}</div>
            <p className="text-sm text-gray-700">Échéance : {financialInfo.dueDate}</p>
            <p className={`text-xs font-medium ${
              financialInfo.status === 'en_retard' ? 'text-red-600' :
              financialInfo.status === 'a_jour' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              Statut: {financialInfo.status.replace('_', ' ')}
            </p>
            <Link href="/dashboard/parent/finance" className="mt-2 block">
              <Button className="w-full font-link bg-red-500 hover:bg-red-600">Payer Maintenant</Button>
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