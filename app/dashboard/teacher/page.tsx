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
  FaClock,
  FaUsers,
  FaChalkboardTeacher,
  FaPlus,
  FaEdit
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// --- Simulation des Données Professeur ---
const teacherInfo = {
  name: "Professeur",
  specialite: "Développement Web & Mobile",
  statut: "actif",
  matieres: ["React", "JavaScript", "HTML/CSS"]
};

const nextCourses = [
  { course: "React Avancé", time: "09:00 - 10:30", location: "Lab Info A", filiere: "DWWM" },
  { course: "JavaScript Moderne", time: "14:00 - 15:30", location: "Salle B201", filiere: "DWWM" },
];

const exercisesToCorrect = [
  { subject: "React", task: "Projet site e-commerce", students: 24, due: "Aujourd'hui" },
  { subject: "JavaScript", task: "Algorithmes avancés", students: 18, due: "Demain" },
];

const recentGrades = [
  { subject: "HTML/CSS", average: "14.2/20", graded: 15, total: 24 },
  { subject: "React Basics", average: "16.8/20", graded: 20, total: 24 },
];

const upcomingEvents = [
  { event: "Réunion Pédagogique", date: "20 Oct", type: "réunion" },
  { event: "Session d'examens", date: "25 Oct", type: "examen" },
  { event: "Formation continue", date: "2 Nov", type: "formation" },
];

const teachingStats = {
  totalStudents: 72,
  activeCourses: 4,
  exercisesPosted: 12,
  averageClassSize: 18
};

const ProfessorDashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
 

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

  // Vérification finale du rôle
  

  // Données dynamiques 
  const teacherName = user ? `${user.firstName} ${user.lastName}` : teacherInfo.name;

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "actif":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            <FaUserCheck className="w-3 h-3 mr-1" />
            Actif
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
        
        {/* 1. SECTION ACCUEIL ET BIENVENUE */}
        <header className="pb-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="font-title text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 truncate">
                Bonjour, {teacherName}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1 sm:mt-2">
                <p className="text-gray-500 text-sm sm:text-base">
                  Spécialité <strong className="text-blue-600">{teacherInfo.specialite}</strong>
                </p>
                <div className="hidden sm:block text-gray-400 mx-2">•</div>
                <p className="text-gray-500 text-sm sm:text-base">
                  Espace de gestion pédagogique
                </p>
              </div>
            </div>
            <div className="text-sm sm:text-base text-gray-500 bg-gray-100 px-3 py-2 rounded-lg shrink-0">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* 2. Aperçus Pédagogiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

          {/* --- Emploi du Temps --- */}
          <Card className="md:col-span-2 lg:col-span-1 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mon Emploi du Temps</CardTitle>
              <FaCalendarAlt className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {nextCourses.map((course, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1 sm:gap-0">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800 block truncate">{course.course}</span>
                    <span className="text-gray-500 text-xs">{course.filiere}</span>
                  </div>
                  <div className="flex flex-col sm:items-end">
                    <span className="text-gray-600 text-xs sm:text-sm">{course.time}</span>
                    <span className="text-gray-400 text-xs">{course.location}</span>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <Link href="/dashboard/professor/schedule" passHref>
                  <Button variant="link" className="p-0 h-auto text-blue-600 text-xs font-medium">
                    Voir mon EDT Complet <FaArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* --- Mes Filières --- */}
          <Card className="md:col-span-2 lg:col-span-1 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes Filières</CardTitle>
              <FaUsers className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Développement Web</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Data Science</span>
                </div>
              </div>
              <div className="pt-2">
                <Link href="/dashboard/professor/filieres" passHref>
                  <Button variant="link" className="p-0 h-auto text-blue-600 text-xs font-medium">
                    Gérer mes filières <FaArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* --- Exercices à Corriger --- */}
          <Card className="md:col-span-2 lg:col-span-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exercices à Corriger</CardTitle>
              <FaBookOpen className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {/* Exercice urgent */}
              <div className="space-y-2">
                <p className="text-xs uppercase text-gray-500 font-medium">À rendre aujourd'hui</p>
                <div className="text-lg font-bold text-gray-800 truncate">
                  {exercisesToCorrect[0].task}
                </div>
                <div className="text-xs text-gray-700">
                  {exercisesToCorrect[0].subject}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {exercisesToCorrect[0].students} étudiants
                  </Badge>
                </div>
                <Progress value={65} className="h-2" />
                <div className="text-xs text-gray-500">65% corrigés</div>
              </div>
              
              {/* Prochain exercice */}
              <div className="space-y-2">
                <p className="text-xs uppercase text-gray-500 font-medium">À rendre demain</p>
                <div className="text-lg font-bold text-gray-800 truncate">
                  {exercisesToCorrect[1].task}
                </div>
                <div className="text-xs text-gray-700">
                  {exercisesToCorrect[1].subject}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {exercisesToCorrect[1].students} étudiants
                  </Badge>
                </div>
                <Progress value={30} className="h-2" />
                <div className="text-xs text-gray-500">30% corrigés</div>
              </div>
              
              <div className="col-span-1 sm:col-span-2 pt-2">
                <Link href="/dashboard/professor/exercices" passHref>
                  <Button variant="outline" className="w-full border-blue-600 hover:bg-blue-600/10 text-blue-600 text-sm">
                    Gérer tous les exercices
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes et Actions Rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* --- Notes Récentes --- */}
          <Card className="md:col-span-1 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notes Récentes</CardTitle>
              <FaFileAlt className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {recentGrades.map((grade, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800 text-sm">{grade.subject}</span>
                    <span className="text-lg font-bold text-green-600">{grade.average}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{grade.graded}/{grade.total} corrigés</span>
                    <span>Moyenne</span>
                  </div>
                  <Progress value={(grade.graded/grade.total)*100} className="h-1" />
                </div>
              ))}
              <Link href="/dashboard/professor/grades" passHref>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm">
                  <FaEdit className="mr-2 h-3 w-3" />
                  Ajouter des notes
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* --- Actions Rapides --- */}
          <Card className="md:col-span-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actions Rapides</CardTitle>
              <FaChalkboardTeacher className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Carte 1: Ajouter un exercice */}
                <Link href="/dashboard/professor/exercices/ajouter" passHref>
                  <Card className="hover:shadow-md transition-all cursor-pointer border-2 border-dashed border-blue-200 hover:border-blue-400">
                    <CardContent className="p-4 text-center">
                      <FaPlus className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <h3 className="font-semibold text-gray-800 text-sm">Ajouter un exercice</h3>
                      <p className="text-xs text-gray-500 mt-1">Créer un nouveau devoir</p>
                    </CardContent>
                  </Card>
                </Link>

                {/* Carte 2: Voir mes filières */}
                <Link href="/dashboard/professor/filieres" passHref>
                  <Card className="hover:shadow-md transition-all cursor-pointer border-2 border-dashed border-green-200 hover:border-green-400">
                    <CardContent className="p-4 text-center">
                      <FaUsers className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <h3 className="font-semibold text-gray-800 text-sm">Voir mes filières</h3>
                      <p className="text-xs text-gray-500 mt-1">Gérer les étudiants</p>
                    </CardContent>
                  </Card>
                </Link>

                {/* Carte 3: Ajouter des notes */}
                <Link href="/dashboard/professor/grades/ajouter" passHref>
                  <Card className="hover:shadow-md transition-all cursor-pointer border-2 border-dashed border-purple-200 hover:border-purple-400">
                    <CardContent className="p-4 text-center">
                      <FaEdit className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <h3 className="font-semibold text-gray-800 text-sm">Ajouter des notes</h3>
                      <p className="text-xs text-gray-500 mt-1">Saisir les évaluations</p>
                    </CardContent>
                  </Card>
                </Link>

                {/* Carte 4: Voir emploi du temps */}
                <Link href="/dashboard/professor/schedule" passHref>
                  <Card className="hover:shadow-md transition-all cursor-pointer border-2 border-dashed border-orange-200 hover:border-orange-400">
                    <CardContent className="p-4 text-center">
                      <FaCalendarAlt className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                      <h3 className="font-semibold text-gray-800 text-sm">Voir mon EDT</h3>
                      <p className="text-xs text-gray-500 mt-1">Consulter planning</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section statistiques et alertes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FaChartLine className="text-blue-500" />
                Mes Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{teachingStats.totalStudents}</div>
                  <div className="text-xs text-gray-600">Étudiants total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{teachingStats.activeCourses}</div>
                  <div className="text-xs text-gray-600">Cours actifs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{teachingStats.exercisesPosted}</div>
                  <div className="text-xs text-gray-600">Exercices postés</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{teachingStats.averageClassSize}</div>
                  <div className="text-xs text-gray-600">Moyenne par classe</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Événements à venir */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FaExclamationTriangle className="text-orange-500" />
                Événements à Venir
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        event.type === 'réunion' ? 'bg-blue-500' : 
                        event.type === 'examen' ? 'bg-red-500' : 'bg-green-500'
                      }`}></div>
                      <span className="text-sm font-medium">{event.event}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {event.date}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfessorDashboard;