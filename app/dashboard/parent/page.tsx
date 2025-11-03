"use client";

import React, { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaCalendarAlt,
  FaClipboardList,
  FaGraduationCap,
  FaRegChartBar,
  FaFileAlt,
  FaArrowRight, 
  FaClock
} from "react-icons/fa";
import { Card, CardContent,CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Composant Header avec vérification de rôle
const HeaderSection = ({ 
  parentName, 
  childName, 
  className 
}: { 
  parentName: string; 
  childName: string; 
  className: string; 
}) => (
  <header className="pb-4 border-b border-gray-200">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="font-title text-3xl font-extrabold tracking-tight text-gray-900">
          Bonjour, {parentName}! 
        </h1>
        <p className="text-gray-500 mt-1">
          Supervision de votre enfant : <span className="font-semibold">{childName} ({className})</span>.
        </p>
      </div>
      <div className="text-sm sm:text-base text-gray-500 bg-gray-100 px-3 py-2 rounded-lg shrink-0">
        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  </header>
);

// Carte de statistiques avec composants shadcn
const StatCard = ({ 
  title, 
  icon, 
  value, 
  description, 
  link, 
  linkText,
  progress 
}: { 
  title: string; 
  icon: React.ReactNode; 
  value: string | number; 
  description?: string; 
  link?: string; 
  linkText?: string;
  progress?: number;
}) => (
  <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-principal">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      {progress !== undefined && (
        <Progress value={progress} className="mt-2 h-2" />
      )}
      {link && linkText && (
        <Link href={link} className="mt-3 inline-block">
          <Button variant="link" className="p-0 h-auto text-principal text-xs font-medium">
            {linkText} <FaArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      )}
    </CardContent>
  </Card>
);

// Carte d'info avec composants shadcn
const InfoCard = ({ 
  title, 
  icon, 
  content, 
  link, 
  linkText, 
  button,
  badge 
}: { 
  title: string; 
  icon?: React.ReactNode; 
  content: React.ReactNode; 
  link?: string; 
  linkText?: string; 
  button?: React.ReactNode;
  badge?: string;
}) => (
  <Card className="hover:shadow-lg transition-all duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="flex items-center gap-2">
        {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
        {icon}
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      {content}
      <div className="flex items-center justify-between">
        {link && linkText && (
          <Link href={link}>
            <Button variant="link" className="p-0 h-auto text-principal text-xs font-medium">
              {linkText} <FaArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        )}
        {button && button}
      </div>
    </CardContent>
  </Card>
);

const ParentDashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  

  // Données simulées avec mise à jour en temps réel
  const childInfo = {
    name: "Antoine Dupont",
    className: "4ème B",
    latestGrade: "17/20 en Histoire-Géographie",
    absencesLastWeek: 1,
    nextInvoiceDue: "30 Novembre",
    attendanceRate: 92,
    overallAverage: 15.3
  };

  const nextSchedule = {
    subject: "Anglais",
    time: "Demain, 14:00",
    location: "Salle B103"
  };

  const nextEvent = {
    name: "Réunion des Parents",
    date: "25 Octobre",
    type: "important"
  };

  const latestBulletin = {
    trimester: "1er Trimestre",
    average: "15,3 / 20",
    mention: "Très bien",
    link: "/parent/bulletins/1er-trimestre.pdf",
  };

  const financialInfo = {
    amountDue: "50000 FCFA",
    dueDate: "30 Novembre",
    status: "en_retard"
  };

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
 
  const parentName = user ? `${user.firstName} ${user.lastName}` : "Parent";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6 h-full overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
        <HeaderSection 
          parentName={parentName} 
          childName={childInfo.name} 
          className={childInfo.className} 
        />

        {/* Grid Haut - Statistiques principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard 
            title="Dernière Note" 
            icon={<FaRegChartBar className="text-principal h-5 w-5" />} 
            value={childInfo.latestGrade.split('/')[0]} 
            description={childInfo.latestGrade.split(' en ')[1]} 
            link="/parent/notes" 
            linkText="Voir toutes les notes"
            progress={85} // 17/20 = 85%
          />
          <StatCard 
            title="Taux de Présence" 
            icon={<FaClipboardList className="text-principal h-5 w-5" />} 
            value={`${childInfo.attendanceRate}%`} 
            description={`${childInfo.absencesLastWeek} absence(s) cette semaine`} 
            link="/parent/attendance" 
            linkText="Détails complets"
            progress={childInfo.attendanceRate}
          />
          <StatCard 
            title="Prochain Cours" 
            icon={<FaCalendarAlt className="text-principal h-5 w-5" />} 
            value={nextSchedule.subject} 
            description={`${nextSchedule.time} • ${nextSchedule.location}`} 
            link="/parent/schedules" 
            linkText="Voir l&apos;EDT complet"
          />
        </div>

        {/* Grid Bas - Informations détaillées */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoCard 
            title="Évènement à Venir" 
            icon={<FaGraduationCap className="text-principal h-5 w-5" />}
            badge="Important"
            content={
              <div className="space-y-2">
                <div className="text-lg font-semibold text-gray-900">{nextEvent.name}</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FaClock className="h-3 w-3" />
                  <span>Date : {nextEvent.date}</span>
                </div>
              </div>
            }
            link="/parent/events"
            linkText="Calendrier complet"
          />
          <InfoCard 
            title="Bulletin Scolaire" 
            icon={<FaFileAlt className="text-principal h-5 w-5" />}
            badge="Nouveau"
            content={
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-900">{latestBulletin.trimester}</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Moyenne générale</span>
                  <span className="text-lg font-bold text-green-600">{latestBulletin.average}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Mention</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {latestBulletin.mention}
                  </Badge>
                </div>
              </div>
            }
            link={latestBulletin.link}
            linkText="Télécharger le bulletin"
          />
          <InfoCard 
            title="Frais Scolaires" 
            content={
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Montant dû</span>
                  <div className="text-2xl font-bold text-red-600">{financialInfo.amountDue}</div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Échéance</span>
                  <span className={`font-medium ${
                    financialInfo.status === 'en_retard' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {financialInfo.dueDate}
                  </span>
                </div>
                {financialInfo.status === 'en_retard' && (
                  <Badge variant="destructive" className="w-full justify-center">
                    Paiement en retard
                  </Badge>
                )}
              </div>
            }
            button={
              <Link href="/parent/finance">
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  Payer Maintenant
                </Button>
              </Link>
            }
          />
        </div>

        {/* Section notifications en temps réel */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaClipboardList className="text-principal" />
              Notifications Récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nouvelle note ajoutée en Mathématiques</p>
                  <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Absence justifiée avec succès</p>
                  <p className="text-xs text-muted-foreground">Il y a 1 jour</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentDashboard;