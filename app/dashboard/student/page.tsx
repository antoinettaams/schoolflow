"use client";

import Link from "next/link";
import { FaCalendarAlt, FaBookOpen, FaFileAlt, FaGraduationCap, FaClipboardList, FaArrowRight } from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  { subject: "Anglais", task: "Rédaction d'un essai", due: "25 Oct" },
  { subject: "Physique", task: "Série d'exercices 3", due: "28 Oct" },
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
  return (
    <div className="p-6 space-y-6 h-full bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-6"> 
      
      {/* 1. SECTION ACCUEIL ET BIENVENUE */}
      <header className="pb-4 border-b border-gray-200">
        <h1 className="font-title text-3xl font-extrabold tracking-tight text-gray-900">
          Bonjour, {studentInfo.name}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Aperçu de votre statut académique pour **{studentInfo.className}**.
        </p>
      </header>

      {/* 2. Aperçus Académiques Majeurs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

        {/* --- WIDGET 1: Emploi du Temps --- */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-title">Emploi du Temps</CardTitle>
            <FaCalendarAlt className="h-4 w-4 text-principal" />
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {nextCourses.map((course, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="font-semibold text-gray-800">{course.course}</span>
                <span className="text-gray-600">{course.time}</span>
              </div>
            ))}
            <Link href="/dashboard/student/schedule" passHref className="mt-3 block">
              <Button variant="link" className="font-link p-0 h-auto text-link text-xs">
                Voir l'EDT Complet <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        {/* --- WIDGET 2: Devoirs / Exercices --- */}
        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-title">Devoirs en Attente</CardTitle>
            <FaBookOpen className="h-4 w-4 text-principal" />
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {currentHomeworks.map((hw, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="font-semibold text-gray-800 truncate">{hw.task}</span>
                <span className="text-tertiary font-medium flex-shrink-0">{hw.due}</span>
              </div>
            ))}
            <Link href="/dashboard/student/homeworks" passHref className="mt-3 block">
              <Button variant="link" className="font-link p-0 h-auto text-link text-xs">
                Voir tous les devoirs <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* --- WIDGET 3: Prochains Examens & Notes Récentes --- */}
        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-title">Examens & Notes</CardTitle>
            <FaClipboardList className="h-4 w-4 text-principal" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 pt-4">
            {/* Colonne 1: Dernière Note */}
            <div>
              <p className="text-xs uppercase text-gray-500">Dernière Note</p>
              <div className="text-2xl font-bold text-green-600">
                {latestGrade.grade}
              </div>
              <p className="text-xs text-gray-700">{latestGrade.subject} ({latestGrade.date})</p>
            </div>
            {/* Colonne 2: Prochain Examen */}
            <div>
              <p className="text-xs uppercase text-gray-500">Prochain Examen</p>
              <div className="text-lg font-bold text-gray-800">
                {nextExams[0].subject}
              </div>
              <p className="text-xs text-gray-700">Le {nextExams[0].date} ({nextExams[0].topic})</p>
            </div>
            <div className="col-span-2">
              <Link href="/dashboard/student/exams" passHref>
                <Button variant="outline" className="font-link w-full text-link border-principal hover:bg-principal/10 text-xs">
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
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium font-title">Bulletins de Notes</CardTitle>
            <FaFileAlt className="h-4 w-4 text-principal" />
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <p className="text-gray-700 text-sm">{latestBulletin.name}</p>
            <p className="text-xl font-bold text-gray-900">{latestBulletin.average}</p>
            <Link href="/dashboard/student/grades" passHref className="mt-3 block">
                <Button className="font-link text-white w-full" size="sm">
                    Télécharger le PDF
                </Button>
            </Link>
          </CardContent>
        </Card>

        {/* --- WIDGET 5: Évènements Scolaires --- */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium font-title">Évènements Scolaires</CardTitle>
            <FaGraduationCap className="h-4 w-4 text-principal" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold">Journée Portes Ouvertes</span>
                    <span className="text-gray-600">20 Octobre</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold">Fermeture pour Toussaint</span>
                    <span className="text-gray-600">22 Octobre</span>
                </div>
                {/* Ajout d'un événement de plus pour tester le défilement si nécessaire */}
                <div className="flex justify-between border-b pb-1">
                    <span className="font-semibold">Rencontre Parents-Profs</span>
                    <span className="text-gray-600">5 Novembre</span>
                </div>
            </div>
            <Link href="/dashboard/student/events" passHref className="mt-4 block">
              <Button variant="link" className="font-link p-0 h-auto text-link text-xs">
                Voir le calendrier complet <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
};

export default StudentDashboard;