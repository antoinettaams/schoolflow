"use client";

import React, { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FaCalendarAlt, 
  FaBookOpen, 
  FaFileAlt, 
  FaGraduationCap, 
  FaClipboardList, 
  FaArrowRight,
  FaChartLine,
  FaExclamationTriangle,
  FaUserCheck,
  FaClock
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// --- Données fictives ---
const studentInfo = {
  name: "Antoinetta",
  filiere: "Développement Web & Mobile",
  statut: "inscrit", 
};

const nextCourses = [
  { course: "Programmation Web", time: "09:00 - 10:30", location: "Lab Info A" },
  { course: "Base de Données", time: "10:45 - 12:15", location: "Salle B201" },
];

const currentHomeworks = [
  { subject: "JavaScript", task: "Projet site e-commerce", due: "25 Oct" },
  { subject: "React", task: "Composants avancés", due: "28 Oct" },
];

const nextExams = [
  { subject: "Algorithmie", date: "10 Nov", topic: "Structures de données" },
  { subject: "UI/UX Design", date: "15 Nov", topic: "Design responsive" },
];

const latestGrade = {
  subject: "HTML/CSS",
  grade: "16/20",
  date: "Hier",
};

const latestBulletin = {
  name: "Bulletin Trimestre 1",
  average: "14.2 / 20",
};

const StudentDashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // Vérification du rôle student
  

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-lg text-center">Chargement de vos informations...</div>
      </div>
    );
  }

  // Non connecté
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-lg text-center">Redirection vers la connexion...</div>
      </div>
    );
  }

  

  // Données dynamiques basées sur l'utilisateur
  const studentName = user ? `${user.firstName} ${user.lastName}` : studentInfo.name;

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "inscrit":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            <FaUserCheck className="w-3 h-3 mr-1" />
            Inscrit
          </Badge>
        );
      case "en_attente":
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">
            <FaClock className="w-3 h-3 mr-1" />
            En attente de paiement
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {statut}
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <div className="p-4 sm:p-6 space-y-6 h-full overflow-y-auto">
        
        {/* 1. HEADER */}
        <header className="pb-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="font-title text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 truncate">
                Bonjour, {studentName}! 
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1 sm:mt-2">
                <p className="text-gray-500 text-sm sm:text-base">
                  Filière <strong className="text-blue-600">{studentInfo.filiere}</strong>
                </p>
                <div className="hidden sm:block text-gray-400 mx-2">•</div>
                <p className="text-gray-500 text-sm sm:text-base">
                  Aperçu de votre parcours de formation
                </p>
              </div>
            </div>
            <div className="text-sm sm:text-base text-gray-500 bg-gray-100 px-3 py-2 rounded-lg shrink-0">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(studentInfo.statut)}
            </div>
          </div>
        </header>

        {/* Aperçus Académiques Majeurs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

          {/* --- Emploi du Temps --- */}
          <Card className="md:col-span-2 lg:col-span-1 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emploi du Temps</CardTitle>
              <FaCalendarAlt className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {nextCourses.map((course, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1 sm:gap-0">
                  <span className="font-semibold text-gray-800 truncate">{course.course}</span>
                  <div className="flex flex-col sm:items-end">
                    <span className="text-gray-600 text-xs sm:text-sm">{course.time}</span>
                    <span className="text-gray-400 text-xs">{course.location}</span>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <Link href="/dashboard/student/schedule" passHref>
                  <Button variant="link" className="p-0 h-auto text-blue-600 text-xs font-medium">
                    Voir l&apos;EDT Complet <FaArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* --- Devoirs / Exercices --- */}
          <Card className="md:col-span-2 lg:col-span-1 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devoirs en Attente</CardTitle>
              <FaBookOpen className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {currentHomeworks.map((hw, index) => (
                <div key={index} className="flex justify-between text-sm items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-800 block truncate">{hw.task}</span>
                    <span className="text-xs text-gray-500 truncate">{hw.subject}</span>
                  </div>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs flex-shrink-0">
                    {hw.due}
                  </Badge>
                </div>
              ))}
              <div className="pt-2">
                <Link href="/dashboard/student/homeworks" passHref>
                  <Button variant="link" className="p-0 h-auto text-blue-600 text-xs font-medium">
                    Voir tous les devoirs <FaArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* --- Prochains Examens & Notes Récentes --- */}
          <Card className="md:col-span-2 lg:col-span-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Examens & Notes</CardTitle>
              <FaClipboardList className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {/* Colonne 1: Dernière Note */}
              <div className="space-y-2">
                <p className="text-xs uppercase text-gray-500 font-medium">Dernière Note</p>
                <div className="text-2xl font-bold text-green-600">
                  {latestGrade.grade}
                </div>
                <div className="text-xs text-gray-700">
                  {latestGrade.subject} 
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {latestGrade.date}
                  </Badge>
                </div>
                <Progress value={80} className="h-2" />
              </div>
              
              {/* Colonne 2: Prochain Examen */}
              <div className="space-y-2">
                <p className="text-xs uppercase text-gray-500 font-medium">Prochain Examen</p>
                <div className="text-lg font-bold text-gray-800 truncate">
                  {nextExams[0].subject}
                </div>
                <div className="text-xs text-gray-700">
                  Le {nextExams[0].date}
                  <div className="text-xs text-gray-500 mt-1 truncate">{nextExams[0].topic}</div>
                </div>
                <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">
                  À réviser
                </Badge>
              </div>
              
              <div className="col-span-1 sm:col-span-2 pt-2">
                <Link href="/dashboard/student/exams" passHref>
                  <Button variant="outline" className="w-full border-blue-600 hover:bg-blue-600/10 text-blue-600 text-sm">
                    Accéder au Tableau des Examens
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bulletins et Évènements */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* --- Bulletins --- */}
          <Card className="md:col-span-1 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bulletins de Notes</CardTitle>
              <FaFileAlt className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-2">
                <p className="text-gray-700 text-sm truncate">{latestBulletin.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-900">{latestBulletin.average}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    Très bien
                  </Badge>
                </div>
                <Progress value={71} className="h-2" />
              </div>
              <Link href="/dashboard/student/grades" passHref>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm">
                  Télécharger le PDF
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* ---Évènements Scolaires --- */}
          <Card className="md:col-span-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Évènements de Formation</CardTitle>
              <FaGraduationCap className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 text-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FaChartLine className="h-3 w-3 text-blue-500 flex-shrink-0" />
                    <span className="font-semibold truncate">Workshop Développement Web</span>
                  </div>
                  <Badge variant="outline" className="text-xs w-fit">20 Octobre</Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FaExclamationTriangle className="h-3 w-3 text-orange-500 flex-shrink-0" />
                    <span className="font-semibold truncate">Session de révision intensive</span>
                  </div>
                  <Badge variant="outline" className="text-xs w-fit">22 Octobre</Badge>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FaGraduationCap className="h-3 w-3 text-green-500 flex-shrink-0" />
                    <span className="font-semibold truncate">Rencontre avec les formateurs</span>
                  </div>
                  <Badge variant="outline" className="text-xs w-fit">5 Novembre</Badge>
                </div>
              </div>
              <div className="pt-3">
                <Link href="/dashboard/student/events" passHref>
                  <Button variant="link" className="p-0 h-auto text-blue-600 text-xs font-medium">
                    Voir le calendrier complet <FaArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section notifications et alertes */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FaExclamationTriangle className="text-orange-500" />
              Alertes et Rappels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 sm:p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Projet JavaScript à rendre demain</p>
                  <p className="text-xs text-muted-foreground truncate">Site e-commerce avec React</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 sm:p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Nouvelle note disponible en HTML/CSS</p>
                  <p className="text-xs text-muted-foreground truncate">16/20 - Excellent travail !</p>
                </div>
              </div>
              {studentInfo.statut === "en_attente" && (
                <div className="flex items-center gap-3 p-2 sm:p-3 bg-orange-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Finalisez votre inscription</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Paiement des frais d&apos;inscription en attente
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;