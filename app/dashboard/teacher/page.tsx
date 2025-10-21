"use client";

import Link from "next/link";
import { FaCalendarAlt, FaUserGraduate, FaFileAlt, FaClipboardList, FaTasks, FaRegChartBar, FaArrowRight, FaClock, FaComments } from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

const TeacherDashboard = ({ teacherName = "Monsieur Lebrun" }) => {
  return (
    <div className="p-6 space-y-6 h-full bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-6"> 
      
      {/* 1. SECTION ACCUEIL ET BIENVENUE */}
      <header className="pb-4 border-b border-gray-200">
        <h1 className="font-title text-3xl font-extrabold tracking-tight text-gray-900">
          Bonjour, {teacherName}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Aperçu de vos tâches pédagogiques ({teacherInfo.subject}).
        </p>
      </header>

      {/* 2. GRILLE D'APERÇUS PÉDAGOGIQUES (Les 6 éléments demandés) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* --- WIDGET 1: Emploi du Temps --- */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-title">Emploi du Temps</CardTitle>
            <FaCalendarAlt className="h-4 w-4 text-principal" />
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <div className="text-xl font-bold text-gray-900">
                {nextClass.name}
            </div>
            <p className="text-xs text-gray-700 flex items-center gap-1">
                <FaClock className="h-3 w-3" /> {nextClass.time}
            </p>
            <Link href="/teacher/schedule" passHref className="mt-2 block">
              <Button variant="link" className="font-link p-0 h-auto text-principal text-xs">
                Voir l'EDT complet <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        {/* --- WIDGET 2: Gestion des Notes --- */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-title">Gestion des Notes</CardTitle>
            <FaFileAlt className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <div className="text-3xl font-bold text-red-600">
              {teacherInfo.pendingGrades}
            </div>
            <p className="text-xs text-gray-700">Évaluations à publier.</p>
            <Link href="/teacher/grades" passHref className="mt-2 block">
              <Button variant="link" className="font-link p-0 h-auto text-principal text-xs">
                Saisir les notes <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* --- WIDGET 3: Dates des Examens --- */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-title">Dates des Examens</CardTitle>
            <FaRegChartBar className="h-4 w-4 text-principal" />
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <div className="text-xl font-bold text-gray-900">
                {nextExamDate.date}
            </div>
            <p className="text-xs text-gray-700 truncate">{nextExamDate.subject}</p>
            <Link href="/teacher/exams" passHref className="mt-2 block">
              <Button variant="link" className="font-link p-0 h-auto text-principal text-xs">
                Gérer le calendrier <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* --- WIDGET 4: Classes Gérées --- */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-title">Classes Gérées</CardTitle>
            <FaUserGraduate className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <div className="text-3xl font-bold text-green-600">
              {teacherInfo.classesCount}
            </div>
            <p className="text-xs text-gray-700">Total de classes enseignées.</p>
            <Link href="/teacher/classes" passHref className="mt-2 block">
              <Button variant="link" className="font-link p-0 h-auto text-principal text-xs">
                Voir mes classes <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        {/* --- WIDGET 5: Devoirs & Exercices --- */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-title">Devoirs & Exercices</CardTitle>
            <FaTasks className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <div className="text-3xl font-bold text-amber-600">
              {pendingHomeworks}
            </div>
            <p className="text-xs text-gray-700">Soumissions en attente de correction.</p>
            <Link href="/teacher/homeworks" passHref className="mt-2 block">
              <Button variant="link" className="font-link p-0 h-auto text-principal text-xs">
                Gérer les devoirs <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* --- WIDGET 6: Assiduité --- */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-title">Assiduité</CardTitle>
            <FaClipboardList className="h-4 w-4 text-green-700" />
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <div className="text-xl font-bold text-gray-900">
              Vérification à
            </div>
            <p className="text-xs text-gray-700">{teacherInfo.nextAbsenceCheck}</p>
            <Link href="/teacher/attendance" passHref className="mt-2 block">
              <Button variant="link" className="font-link p-0 h-auto text-principal text-xs">
                Pointer les Absences <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 3. SECTION RACCOURCIS RAPIDES (Communication) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        
        {/* --- WIDGET 7: Raccourcis Communication --- */}
        <Card className="md:col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-800 font-title">Raccourcis & Communication</CardTitle>
            <CardDescription>Accès rapide aux messages et autres outils</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex flex-wrap gap-4">
            
            {/* Raccourci 1: Forum/Messages */}
            <Link href="/teacher/forum" passHref>
                <Button variant="outline" className="font-link text-principal border-principal hover:bg-principal/10">
                    <FaComments className="h-4 w-4 mr-2" />
                    Forum
                </Button>
            </Link>

            {/* Raccourci 2: Paramètres (du pied de la sidebar) */}
            <Link href="/teacher/settings" passHref>
                <Button variant="outline" className="font-link text-gray-700 border-gray-300 hover:bg-gray-100">
                    Paramètres du Compte
                </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
};

export default TeacherDashboard;