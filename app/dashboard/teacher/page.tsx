"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FaCalendarAlt, 
  FaBookOpen,  
  FaFileAlt,
  FaChartLine,
  FaExclamationTriangle,
  FaUsers,
  FaChalkboardTeacher,
  FaPlus,
  FaEdit
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardData {
  teacherInfo: {
    name: string;
    specialite: string;
    statut: string;
    matieres: string[];
  };
  nextCourses: Array<{
    course: string;
    time: string;
    location: string;
    filiere: string;
    jour: string;
    typeModule: string;
    coefficient: number;
  }>;
  filieres: string[];
  teachingStats: {
    totalStudents: number;
    activeCourses: number;
    exercisesPosted: number;
    averageClassSize: number;
  };
  totalModules: number;
  exercisesToCorrect: Array<{
    subject: string;
    task: string;
    students: number;
    due: string;
  }>;
  recentGrades: Array<{
    subject: string;
    average: string;
    graded: number;
    total: number;
  }>;
  upcomingEvents: Array<{
    event: string;
    date: string;
    type: string;
  }>;
}

// Composants Skeleton
const HeaderSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 animate-pulse">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div className="flex-1 space-y-3">
        <Skeleton className="h-8 w-64" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-8 w-40" />
    </div>
  </div>
);

const CourseCardSkeleton = () => (
  <Card className="hover:shadow-lg transition-all animate-pulse">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-5 w-5 rounded-full" />
    </CardHeader>
    <CardContent className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
      <Skeleton className="h-10 w-full rounded-lg" />
    </CardContent>
  </Card>
);

const FiliereCardSkeleton = () => (
  <Card className="hover:shadow-lg transition-all animate-pulse">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-5 w-5 rounded-full" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </CardContent>
  </Card>
);

const ExerciseCardSkeleton = () => (
  <Card className="hover:shadow-lg transition-all animate-pulse">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-5 w-5 rounded-full" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="flex justify-between items-center text-xs mb-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </CardContent>
  </Card>
);

const GradeCardSkeleton = () => (
  <Card className="hover:shadow-lg transition-all animate-pulse">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-5 w-5 rounded-full" />
    </CardHeader>
    <CardContent className="space-y-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
          <div className="flex justify-between text-sm mb-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-full rounded-lg" />
    </CardContent>
  </Card>
);

const QuickActionsSkeleton = () => (
  <Card className="hover:shadow-lg transition-all animate-pulse">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-5 w-5 rounded-full" />
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-2 border-dashed border-gray-200 text-center p-4">
            <Skeleton className="h-8 w-8 mx-auto mb-2 rounded-full" />
            <Skeleton className="h-4 w-20 mx-auto mb-1" />
            <Skeleton className="h-3 w-16 mx-auto" />
          </Card>
        ))}
      </div>
    </CardContent>
  </Card>
);

const StatsCardSkeleton = () => (
  <Card className="hover:shadow-lg transition-all animate-pulse">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-5 w-5 rounded-full" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
              <Skeleton className="h-7 w-12 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

const EventsCardSkeleton = () => (
  <Card className="hover:shadow-lg transition-all animate-pulse">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-5 w-5 rounded-full" />
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const ProfessorDashboard = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérification du rôle professeur
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const userRole = user?.publicMetadata?.role;
      if (userRole !== "Enseignant") {
        router.push("/unauthorized");
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/teacher/dashboard');
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Erreur chargement dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isSignedIn) {
      loadDashboardData();
    }
  }, [isSignedIn]);

  // Afficher le skeleton pendant le chargement
  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
        <div className="p-4 sm:p-6 space-y-6">
          <HeaderSkeleton />
          
          {/* PREMIÈRE LIGNE */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <CourseCardSkeleton />
            <FiliereCardSkeleton />
            <ExerciseCardSkeleton />
          </div>

          {/* DEUXIÈME LIGNE */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <GradeCardSkeleton />
            <QuickActionsSkeleton />
            <StatsCardSkeleton />
          </div>

          {/* TROISIÈME LIGNE */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            <ExerciseCardSkeleton />
            <StatsCardSkeleton />
            <EventsCardSkeleton />
          </div>
        </div>
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

  const userRole = user?.publicMetadata?.role;
  if (userRole !== "Enseignant") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Accès Refusé</CardTitle>
            <CardDescription className="text-gray-600">
              Vous n&apos;avez pas les permissions de professeur.
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

  const teacherInfo = dashboardData?.teacherInfo;
  const nextCourses = dashboardData?.nextCourses || [];
  const filieres = dashboardData?.filieres || [];
  const teachingStatsData = dashboardData?.teachingStats;
  const exercisesToCorrect = dashboardData?.exercisesToCorrect || [];
  const recentGrades = dashboardData?.recentGrades || [];
  const upcomingEvents = dashboardData?.upcomingEvents || [];

  const teacherName = user ? `${user.firstName} ${user.lastName}` : teacherInfo?.name || "Professeur";

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <div className="p-4 sm:p-6 space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Bonjour, {teacherName}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                <p className="text-gray-600">
                  Spécialité <strong className="text-blue-600">{teacherInfo?.specialite || "Développement Web & Mobile"}</strong>
                </p>
                <div className="hidden sm:block text-gray-400 mx-2">•</div>
                <p className="text-gray-500">
                  Espace de gestion pédagogique
                </p>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Professeur
                </Badge>
                <span className="text-sm text-gray-500">
                  {user.primaryEmailAddress?.emailAddress}
                </span>
              </div>
            </div>
            <div className="text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* PREMIÈRE LIGNE - 3 COLONNES SUR DESKTOP, 2 SUR TABLETTE */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Colonne 1 - Emploi du temps */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">Mon Emploi du Temps</CardTitle>
              <FaCalendarAlt className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent className="space-y-4">
              {nextCourses.map((course, index) => (
                <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">{course.course}</h4>
                    <p className="text-gray-600 text-xs mt-1">{course.filiere}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900 text-sm font-medium">{course.time}</p>
                    <p className="text-gray-500 text-xs">{course.location}</p>
                  </div>
                </div>
              ))}
              {nextCourses.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  Aucun cours programmé
                </div>
              )}
              <Link href="/dashboard/teacher/schedule">
                <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                  Voir mon EDT Complet
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Colonne 2 - Mes Filières */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">Mes Filières</CardTitle>
              <FaUsers className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {filieres.map((filiere, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-semibold text-gray-900">{filiere}</span>
                    <Badge variant="secondary">{teachingStatsData?.averageClassSize || 18} étudiants</Badge>
                  </div>
                ))}
                {filieres.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    Aucune filière assignée
                  </div>
                )}
              </div>
              <Link href="/dashboard/teacher/filieres">
                <Button variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-50">
                  Gérer mes filières
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Colonne 3 - Exercices à Corriger (visible seulement sur desktop) */}
          <Card className="hover:shadow-lg transition-all md:hidden xl:block">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">Exercices à Corriger</CardTitle>
              <FaBookOpen className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {exercisesToCorrect.map((exercise, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{exercise.task}</h4>
                        <p className="text-gray-600 text-xs">{exercise.subject}</p>
                      </div>
                      <Badge variant={exercise.due === "Aujourd'hui" ? "destructive" : "secondary"}>
                        {exercise.due}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
                      <span>{exercise.students} étudiants</span>
                      <span>{exercise.due === "Aujourd'hui" ? "65%" : "30%"} corrigés</span>
                    </div>
                    <Progress 
                      value={exercise.due === "Aujourd'hui" ? 65 : 30} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
              <Link href="/dashboard/teacher/exercices">
                <Button variant="outline" className="w-full border-orange-600 text-orange-600 hover:bg-orange-50">
                  Gérer tous les exercices
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* DEUXIÈME LIGNE - 3 COLONNES SUR DESKTOP, 2 SUR TABLETTE */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Colonne 1 - Notes Récentes */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">Notes Récentes</CardTitle>
              <FaFileAlt className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent className="space-y-4">
              {recentGrades.map((grade, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900">{grade.subject}</span>
                    <span className="text-lg font-bold text-green-600">{grade.average}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{grade.graded}/{grade.total} corrigés</span>
                    <span>Moyenne</span>
                  </div>
                  <Progress value={(grade.graded/grade.total)*100} className="h-2" />
                </div>
              ))}
              <Link href="/dashboard/teacher/grades">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  <FaEdit className="mr-2 h-4 w-4" />
                  Ajouter des notes
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Colonne 2 - Actions Rapides */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">Actions Rapides</CardTitle>
              <FaChalkboardTeacher className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/teacher/exercices/ajouter">
                  <Card className="hover:shadow-md transition-all cursor-pointer border-2 border-dashed border-blue-200 hover:border-blue-400 text-center p-4">
                    <FaPlus className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-800 text-sm">Ajouter un exercice</h3>
                    <p className="text-gray-500 text-xs mt-1">Créer un nouveau devoir</p>
                  </Card>
                </Link>

                <Link href="/dashboard/teacher/filieres">
                  <Card className="hover:shadow-md transition-all cursor-pointer border-2 border-dashed border-green-200 hover:border-green-400 text-center p-4">
                    <FaUsers className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-800 text-sm">Voir mes filières</h3>
                    <p className="text-gray-500 text-xs mt-1">Gérer les étudiants</p>
                  </Card>
                </Link>

                <Link href="/teacher/grades/ajouter">
                  <Card className="hover:shadow-md transition-all cursor-pointer border-2 border-dashed border-purple-200 hover:border-purple-400 text-center p-4">
                    <FaEdit className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-800 text-sm">Ajouter des notes</h3>
                    <p className="text-gray-500 text-xs mt-1">Saisir les évaluations</p>
                  </Card>
                </Link>

                <Link href="/teacher/schedule">
                  <Card className="hover:shadow-md transition-all cursor-pointer border-2 border-dashed border-orange-200 hover:border-orange-400 text-center p-4">
                    <FaCalendarAlt className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-800 text-sm">Voir mon EDT</h3>
                    <p className="text-gray-500 text-xs mt-1">Consulter planning</p>
                  </Card>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Colonne 3 - Statistiques (visible seulement sur desktop) */}
          <Card className="hover:shadow-lg transition-all md:hidden xl:block">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">Mes Statistiques</CardTitle>
              <FaChartLine className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{teachingStatsData?.totalStudents || 72}</div>
                    <div className="text-sm text-gray-600 mt-1">Étudiants total</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{teachingStatsData?.activeCourses || 4}</div>
                    <div className="text-sm text-gray-600 mt-1">Cours actifs</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{teachingStatsData?.exercisesPosted || 12}</div>
                    <div className="text-sm text-gray-600 mt-1">Exercices postés</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{teachingStatsData?.averageClassSize || 18}</div>
                    <div className="text-sm text-gray-600 mt-1">Moyenne/classe</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TROISIÈME LIGNE - 3 COLONNES SUR DESKTOP, 2 SUR TABLETTE */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Colonne 1 - Exercices à Corriger (visible sur tablette, caché sur desktop car déjà affiché) */}
          <Card className="hover:shadow-lg transition-all md:block xl:hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">Exercices à Corriger</CardTitle>
              <FaBookOpen className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {exercisesToCorrect.map((exercise, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{exercise.task}</h4>
                        <p className="text-gray-600 text-xs">{exercise.subject}</p>
                      </div>
                      <Badge variant={exercise.due === "Aujourd'hui" ? "destructive" : "secondary"}>
                        {exercise.due}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
                      <span>{exercise.students} étudiants</span>
                      <span>{exercise.due === "Aujourd'hui" ? "65%" : "30%"} corrigés</span>
                    </div>
                    <Progress 
                      value={exercise.due === "Aujourd'hui" ? 65 : 30} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
              <Link href="/dashboard/teacher/exercices">
                <Button variant="outline" className="w-full border-orange-600 text-orange-600 hover:bg-orange-50">
                  Gérer tous les exercices
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Colonne 2 - Statistiques (visible sur tablette, caché sur desktop car déjà affiché) */}
          <Card className="hover:shadow-lg transition-all md:block xl:hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">Mes Statistiques</CardTitle>
              <FaChartLine className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{teachingStatsData?.totalStudents || 72}</div>
                    <div className="text-sm text-gray-600 mt-1">Étudiants total</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{teachingStatsData?.activeCourses || 4}</div>
                    <div className="text-sm text-gray-600 mt-1">Cours actifs</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{teachingStatsData?.exercisesPosted || 12}</div>
                    <div className="text-sm text-gray-600 mt-1">Exercices postés</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{teachingStatsData?.averageClassSize || 18}</div>
                    <div className="text-sm text-gray-600 mt-1">Moyenne/classe</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Colonne 3 - Événements à venir (toujours visible) */}
          <Card className="hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-semibold">Événements à Venir</CardTitle>
              <FaExclamationTriangle className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        event.type === 'réunion' ? 'bg-blue-500' : 
                        event.type === 'examen' ? 'bg-red-500' : 'bg-green-500'
                      }`}></div>
                      <span className="font-medium text-gray-800">{event.event}</span>
                    </div>
                    <Badge variant="outline">
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