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
  FaExclamationTriangle
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// --- Simulation des Données Actuelles ---
const studentInfo = {
  name: "Antoinetta",
  className: "Terminale S1 - Classe B",
};

const nextCourses = [
  { course: "Maths", time: "09:00 - 10:30", location: "Salle B101" },
  { course: "Français", time: "10:45 - 12:15", location: "Amphi 1" },
];

const currentHomeworks = [
  { subject: "Anglais", task: "Rédaction d&apos;un essai", due: "25 Oct" },
  { subject: "Physique", task: "Série d&apos;exercices 3", due: "28 Oct" },
];

const nextExams = [
  { subject: "Histoire-Géo", date: "10 Nov", topic: "Guerre Froide" },
  { subject: "SVT", date: "15 Nov", topic: "Génétique" },
];

const latestGrade = {
  subject: "Philosophie",
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

  // Vérification du rôle étudiant
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const userRole = user?.publicMetadata?.role;
      console.log("Rôle utilisateur:", userRole);
      
      if (userRole !== "Élève") {
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
  if (userRole !== "Élève") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès Refusé</h1>
          <p className="text-gray-600 mb-4">
            Vous n&apos;avez pas les permissions d&lsquo;étudiant.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  // Données dynamiques basées sur l'utilisateur
  const studentName = user ? `${user.firstName} ${user.lastName}` : studentInfo.name;

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <div className="p-6 space-y-6 h-full overflow-y-auto lg:pl-5 pt-20 lg:pt-6"> 
        
        {/* 1. SECTION ACCUEIL ET BIENVENUE */}
        <header className="pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-title text-3xl font-extrabold tracking-tight text-gray-900">
                Bonjour, {studentName}! 👋
              </h1>
              <p className="text-gray-500 mt-1">
                Aperçu de votre statut académique pour <strong>{studentInfo.className}</strong>.
              </p>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Élève
            </Badge>
          </div>
        </header>

        {/* 2. Aperçus Académiques Majeurs */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

          {/* --- WIDGET 1: Emploi du Temps --- */}
          <Card className="md:col-span-2 lg:col-span-1 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emploi du Temps</CardTitle>
              <FaCalendarAlt className="h-4 w-4 text-principal" />
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {nextCourses.map((course, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-800">{course.course}</span>
                  <span className="text-gray-600">{course.time}</span>
                </div>
              ))}
              <div className="pt-2">
                <Link href="/dashboard/student/schedule" passHref>
                  <Button variant="link" className="p-0 h-auto text-principal text-xs font-medium">
                    Voir l&apos;EDT Complet <FaArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* --- WIDGET 2: Devoirs / Exercices --- */}
          <Card className="md:col-span-1 lg:col-span-1 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devoirs en Attente</CardTitle>
              <FaBookOpen className="h-4 w-4 text-principal" />
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {currentHomeworks.map((hw, index) => (
                <div key={index} className="flex justify-between text-sm items-start">
                  <div className="flex-1">
                    <span className="font-semibold text-gray-800 block truncate">{hw.task}</span>
                    <span className="text-xs text-gray-500">{hw.subject}</span>
                  </div>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs">
                    {hw.due}
                  </Badge>
                </div>
              ))}
              <div className="pt-2">
                <Link href="/dashboard/student/homeworks" passHref>
                  <Button variant="link" className="p-0 h-auto text-principal text-xs font-medium">
                    Voir tous les devoirs <FaArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* --- WIDGET 3: Prochains Examens & Notes Récentes --- */}
          <Card className="md:col-span-2 lg:col-span-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Examens & Notes</CardTitle>
              <FaClipboardList className="h-4 w-4 text-principal" />
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 pt-4">
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
                <div className="text-lg font-bold text-gray-800">
                  {nextExams[0].subject}
                </div>
                <div className="text-xs text-gray-700">
                  Le {nextExams[0].date}
                  <div className="text-xs text-gray-500 mt-1">{nextExams[0].topic}</div>
                </div>
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  À réviser
                </Badge>
              </div>
              
              <div className="col-span-2 pt-2">
                <Link href="/dashboard/student/exams" passHref>
                  <Button variant="outline" className="w-full border-principal hover:bg-principal/10 text-principal">
                    Accéder au Tableau des Examens
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. LIGNE INFÉRIEURE : Bulletins et Évènements */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* --- WIDGET 4: Bulletins --- */}
          <Card className="md:col-span-1 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bulletins de Notes</CardTitle>
              <FaFileAlt className="h-4 w-4 text-principal" />
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-2">
                <p className="text-gray-700 text-sm">{latestBulletin.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-900">{latestBulletin.average}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Très bien
                  </Badge>
                </div>
                <Progress value={71} className="h-2" />
              </div>
              <Link href="/dashboard/student/grades" passHref>
                <Button className="w-full bg-principal hover:bg-principal/90 text-white">
                  Télécharger le PDF
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* --- WIDGET 5: Évènements Scolaires --- */}
          <Card className="md:col-span-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Évènements Scolaires</CardTitle>
              <FaGraduationCap className="h-4 w-4 text-principal" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center border-b pb-2">
                  <div className="flex items-center gap-2">
                    <FaChartLine className="h-3 w-3 text-blue-500" />
                    <span className="font-semibold">Journée Portes Ouvertes</span>
                  </div>
                  <Badge variant="outline">20 Octobre</Badge>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <div className="flex items-center gap-2">
                    <FaExclamationTriangle className="h-3 w-3 text-orange-500" />
                    <span className="font-semibold">Fermeture pour Toussaint</span>
                  </div>
                  <Badge variant="outline">22 Octobre</Badge>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <div className="flex items-center gap-2">
                    <FaGraduationCap className="h-3 w-3 text-green-500" />
                    <span className="font-semibold">Rencontre Parents-Profs</span>
                  </div>
                  <Badge variant="outline">5 Novembre</Badge>
                </div>
              </div>
              <div className="pt-3">
                <Link href="/dashboard/student/events" passHref>
                  <Button variant="link" className="p-0 h-auto text-principal text-xs font-medium">
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
              <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Devoir d&apos;Anglais à rendre demain</p>
                  <p className="text-xs text-muted-foreground">Rédaction d&apos;un essai</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nouvelle note disponible en Philosophie</p>
                  <p className="text-xs text-muted-foreground">16/20 - Très bon travail !</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;