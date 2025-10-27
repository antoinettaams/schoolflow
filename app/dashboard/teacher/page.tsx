"use client";

import React, { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FaCalendarAlt, 
  FaUserGraduate, 
  FaFileAlt, 
  FaClipboardList, 
  FaTasks, 
  FaRegChartBar, 
  FaArrowRight, 
  FaClock, 
  FaComments,
  FaExclamationTriangle,
  FaChartLine
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// --- Simulation des Données Actuelles du Professeur ---
const teacherInfo = {
  name: "Monsieur Lebrun",
  subject: "Mathématiques",
  classesCount: 3,
  pendingGrades: 3, 
  nextAbsenceCheck: "10:45 (Terminale S1)",
};

const nextClass = {
  name: "Terminale S1",
  time: "10:45 - 12:15",
  location: "Salle B204",
};

const nextExamDate = {
    date: "25 Octobre",
    subject: "Première L - Contrôle de Géométrie",
}

const pendingHomeworks = 22;

const TeacherDashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // Vérification du rôle professeur - CORRIGÉ
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const userRole = user?.publicMetadata?.role;
      console.log("Rôle utilisateur:", userRole);
      
      // CORRIGÉ : Vérifier "Enseignant" au lieu de "Professeur"
      if (userRole !== "Enseignant") {
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

  // Vérification finale du rôle - CORRIGÉ
  const userRole = user?.publicMetadata?.role;
  if (userRole !== "Enseignant") { // CORRIGÉ : "Enseignant" au lieu de "Professeur"
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès Refusé</h1>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas les permissions d'enseignant.
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

  const teacherName = user ? `${user.firstName} ${user.lastName}` : teacherInfo.name;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6 h-full overflow-y-auto lg:pl-5 pt-20 lg:pt-6"> 
        
        {/* 1. SECTION ACCUEIL ET BIENVENUE */}
        <header className="pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-title text-3xl font-extrabold tracking-tight text-gray-900">
                Bonjour, {teacherName}! 👋
              </h1>
              <p className="text-gray-500 mt-1">
                Aperçu de vos tâches pédagogiques ({teacherInfo.subject}).
              </p>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              Enseignant {/* CORRIGÉ : "Enseignant" au lieu de "Professeur" */}
            </Badge>
          </div>
        </header>

        {/* 2. GRILLE D'APERÇUS PÉDAGOGIQUES (Les 6 éléments demandés) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* --- WIDGET 1: Emploi du Temps --- */}
          <Card className="hover:shadow-lg transition-all border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emploi du Temps</CardTitle>
              <FaCalendarAlt className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="text-xl font-bold text-gray-900">
                  {nextClass.name}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FaClock className="h-3 w-3" />
                <span>{nextClass.time}</span>
              </div>
              <p className="text-xs text-gray-600">{nextClass.location}</p>
              <div className="pt-2">
                <Link href="/teacher/schedule" passHref>
                  <Button variant="link" className="p-0 h-auto text-blue-600 text-xs font-medium">
                    Voir l'EDT complet <FaArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* --- WIDGET 2: Gestion des Notes --- */}
          <Card className="hover:shadow-lg transition-all border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gestion des Notes</CardTitle>
              <FaFileAlt className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="text-3xl font-bold text-red-600">
                {teacherInfo.pendingGrades}
              </div>
              <p className="text-xs text-muted-foreground">Évaluations à publier</p>
              <Badge variant="outline" className="bg-red-50 text-red-700">
                En attente
              </Badge>
              <div className="pt-2">
                <Link href="/teacher/grades" passHref>
                  <Button variant="link" className="p-0 h-auto text-red-600 text-xs font-medium">
                    Saisir les notes <FaArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* --- WIDGET 3: Dates des Examens --- */}
          <Card className="hover:shadow-lg transition-all border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dates des Examens</CardTitle>
              <FaRegChartBar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="text-xl font-bold text-gray-900">
                  {nextExamDate.date}
              </div>
              <p className="text-xs text-muted-foreground truncate">{nextExamDate.subject}</p>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                À préparer
              </Badge>
              <div className="pt-2">
                <Link href="/teacher/exams" passHref>
                  <Button variant="link" className="p-0 h-auto text-green-600 text-xs font-medium">
                    Gérer le calendrier <FaArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* --- WIDGET 4: Classes Gérées --- */}
          <Card className="hover:shadow-lg transition-all border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes Gérées</CardTitle>
              <FaUserGraduate className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="text-3xl font-bold text-purple-600">
                {teacherInfo.classesCount}
              </div>
              <p className="text-xs text-muted-foreground">Total de classes enseignées</p>
              <Progress value={100} className="h-2" />
              <div className="pt-2">
                <Link href="/teacher/classes" passHref>
                  <Button variant="link" className="p-0 h-auto text-purple-600 text-xs font-medium">
                    Voir mes classes <FaArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* --- WIDGET 5: Devoirs & Exercices --- */}
          <Card className="hover:shadow-lg transition-all border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devoirs & Exercices</CardTitle>
              <FaTasks className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="text-3xl font-bold text-amber-600">
                {pendingHomeworks}
              </div>
              <p className="text-xs text-muted-foreground">Soumissions en attente de correction</p>
              <Badge variant="outline" className="bg-amber-50 text-amber-700">
                Prioritaire
              </Badge>
              <div className="pt-2">
                <Link href="/teacher/homeworks" passHref>
                  <Button variant="link" className="p-0 h-auto text-amber-600 text-xs font-medium">
                    Gérer les devoirs <FaArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* --- WIDGET 6: Assiduité --- */}
          <Card className="hover:shadow-lg transition-all border-l-4 border-l-indigo-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assiduité</CardTitle>
              <FaClipboardList className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="text-xl font-bold text-gray-900">
                Vérification à
              </div>
              <p className="text-xs text-muted-foreground">{teacherInfo.nextAbsenceCheck}</p>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                Aujourd'hui
              </Badge>
              <div className="pt-2">
                <Link href="/teacher/attendance" passHref>
                  <Button variant="link" className="p-0 h-auto text-indigo-600 text-xs font-medium">
                    Pointer les Absences <FaArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. SECTION RACCOURCIS RAPIDES ET NOTIFICATIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          
          {/* --- WIDGET 7: Raccourcis Communication --- */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FaComments className="text-blue-500" />
                Raccourcis & Communication
              </CardTitle>
              <CardDescription>Accès rapide aux messages et autres outils</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-wrap gap-3">
              
              {/* Raccourci 1: Forum/Messages */}
              <Link href="/teacher/forum" passHref>
                  <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                      <FaComments className="h-4 w-4 mr-2" />
                      Forum
                  </Button>
              </Link>

              {/* Raccourci 2: Paramètres */}
              <Link href="/teacher/settings" passHref>
                  <Button variant="outline" className="text-gray-700 border-gray-300 hover:bg-gray-100">
                      Paramètres du Compte
                  </Button>
              </Link>

              {/* Raccourci 3: Statistiques */}
              <Link href="/teacher/analytics" passHref>
                  <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                      <FaChartLine className="h-4 w-4 mr-2" />
                      Statistiques
                  </Button>
              </Link>
            </CardContent>
          </Card>

          {/* --- WIDGET 8: Alertes et Notifications --- */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FaExclamationTriangle className="text-orange-500" />
                Alertes Récentes
              </CardTitle>
              <CardDescription>Vos notifications importantes</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Réunion pédagogique demain</p>
                  <p className="text-xs text-muted-foreground">Salle des professeurs - 14h00</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Devoirs en retard</p>
                  <p className="text-xs text-muted-foreground">5 étudiants n'ont pas rendu leur travail</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Nouveaux messages parents</p>
                  <p className="text-xs text-muted-foreground">3 messages non lus</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;