"use client";

import { useState, useEffect } from "react";
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
  FaSync
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

// Interfaces pour les données
interface StudentInfo {
  name: string;
  filiere: string;
  statut: string;
  vague: string;
}

interface Course {
  course: string;
  time: string;
  location: string;
  enseignant?: string;
}

interface Homework {
  subject: string;
  task: string;
  due: string;
}

interface Exam {
  subject: string;
  date: string;
  topic: string;
}

interface Grade {
  subject: string;
  grade: string;
  date: string;
}

interface Bulletin {
  name: string;
  average: string;
}

interface Event {
  title: string;
  date: string;
  type: string;
  location: string;
}

interface DashboardData {
  studentInfo: StudentInfo;
  nextCourses: Course[];
  currentHomeworks: Homework[];
  nextExams: Exam[];
  latestGrade: Grade;
  latestBulletin: Bulletin;
  events: Event[];
}

const StudentDashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vérification du rôle étudiant
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const userRole = user?.publicMetadata?.role;
      if (userRole !== "Etudiant") {
        router.push("/unauthorized");
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Charger les données du dashboard
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/student/dashboard');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchDashboardData();
    }
  }, [isSignedIn]);

  // Loading state
  if (!isLoaded || isLoading) {
    return <DashboardSkeleton />;
  }

  // Non connecté
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-lg text-center">Redirection vers la connexion...</div>
      </div>
    );
  }

  // Vérification du rôle
  const userRole = user?.publicMetadata?.role;
  if (userRole !== "Etudiant") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Accès Refusé</CardTitle>
            <CardDescription className="text-gray-600">
              Vous n&apos;avez pas les permissions d&apos;étudiant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/")}
              className="bg-blue-600 text-white hover:bg-blue-700 w-full"
            >
              Retour à l&apos;accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Données dynamiques
  const studentInfo = dashboardData?.studentInfo || {
    name: `${user?.firstName} ${user?.lastName}`,
    filiere: "Non assigné",
    statut: "inscrit",
    vague: "Non assigné"
  };

  const nextCourses = dashboardData?.nextCourses || [];
  const currentHomeworks = dashboardData?.currentHomeworks || [];
  const nextExams = dashboardData?.nextExams || [];
  const latestGrade = dashboardData?.latestGrade;
  const latestBulletin = dashboardData?.latestBulletin;
  const events = dashboardData?.events || [];

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
        
        {/* HEADER avec bouton actualiser */}
        <header className="pb-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="font-title text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 truncate">
                  Bonjour, {studentInfo.name}! 
                </h1>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1 sm:mt-2">
                <p className="text-gray-500 text-sm sm:text-base">
                  Filière <strong className="text-blue-600">{studentInfo.filiere}</strong>
                </p>
                <div className="hidden sm:block text-gray-400 mx-2">•</div>
                <p className="text-gray-500 text-sm sm:text-base">
                  <strong className="text-purple-600">{studentInfo.vague}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Étudiant
                </Badge>
                <span className="text-sm text-gray-500">
                  {user.primaryEmailAddress?.emailAddress}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm sm:text-base text-gray-500 bg-gray-100 px-3 py-2 rounded-lg shrink-0">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(studentInfo.statut)}
              </div>
            </div>
          </div>
        </header>

        {/* Alert d'erreur */}
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <FaExclamationTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* APERÇUS ACADÉMIQUES - RESPONSIVE GRID */}
        {/* Mobile: 1 colonne, Tablet: 2 colonnes, Desktop: 3 colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          
          {/* --- Emploi du Temps --- */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emploi du Temps</CardTitle>
              <FaCalendarAlt className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {nextCourses.length > 0 ? nextCourses.map((course, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1 sm:gap-0">
                  <span className="font-semibold text-gray-800 truncate">{course.course}</span>
                  <div className="flex flex-col sm:items-end">
                    <span className="text-gray-600 text-xs sm:text-sm">{course.time}</span>
                    <span className="text-gray-400 text-xs">{course.location}</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-500 text-center py-2">Aucun cours à venir</p>
              )}
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
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devoirs en Attente</CardTitle>
              <FaBookOpen className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {currentHomeworks.length > 0 ? currentHomeworks.map((hw, index) => (
                <div key={index} className="flex justify-between text-sm items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-800 block truncate">{hw.task}</span>
                    <span className="text-xs text-gray-500 truncate">{hw.subject}</span>
                  </div>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs flex-shrink-0">
                    {hw.due}
                  </Badge>
                </div>
              )) : (
                <p className="text-sm text-gray-500 text-center py-2">Aucun devoir en attente</p>
              )}
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
          <Card className="md:col-span-2 xl:col-span-1 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Examens & Notes</CardTitle>
              <FaClipboardList className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {/* Colonne 1: Dernière Note */}
              <div className="space-y-2">
                <p className="text-xs uppercase text-gray-500 font-medium">Dernière Note</p>
                {latestGrade ? (
                  <>
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
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Aucune note récente</p>
                )}
              </div>
              
              {/* Colonne 2: Prochain Examen */}
              <div className="space-y-2">
                <p className="text-xs uppercase text-gray-500 font-medium">Prochain Examen</p>
                {nextExams.length > 0 ? (
                  <>
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
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Aucun examen programmé</p>
                )}
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

        {/* DEUXIÈME LIGNE - 3 COLONNES SUR DESKTOP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* --- Bulletins --- */}
          <Card className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bulletins de Notes</CardTitle>
              <FaFileAlt className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {latestBulletin ? (
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
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Aucun bulletin disponible</p>
              )}
              <Link href="/dashboard/student/grades" passHref>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm">
                  Télécharger le PDF
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* --- Évènements Scolaires --- */}
          <Card className="md:col-span-2 hover:shadow-lg transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Évènements de Formation</CardTitle>
              <FaGraduationCap className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 text-sm">
                {events.length > 0 ? events.map((event, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b pb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FaChartLine className="h-3 w-3 text-blue-500 flex-shrink-0" />
                      <span className="font-semibold truncate">{event.title}</span>
                    </div>
                    <Badge variant="outline" className="text-xs w-fit">{event.date}</Badge>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500 text-center py-4">Aucun événement à venir</p>
                )}
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
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <FaExclamationTriangle className="text-orange-500" />
              Alertes et Rappels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentHomeworks.length > 0 && (
                <div className="flex items-center gap-3 p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Devoir à rendre: {currentHomeworks[0].task}</p>
                    <p className="text-xs text-muted-foreground truncate">Échéance: {currentHomeworks[0].due}</p>
                  </div>
                </div>
              )}
              {latestGrade && (
                <div className="flex items-center gap-3 p-2 sm:p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Nouvelle note disponible en {latestGrade.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">{latestGrade.grade} - Excellent travail !</p>
                  </div>
                </div>
              )}
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

// Skeleton loader pour le chargement
const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="pb-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
                <Skeleton className="h-8 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;