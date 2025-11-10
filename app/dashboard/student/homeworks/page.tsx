// app/dashboard/student/exercices/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Calculator,
  Pencil,
  FlaskConical,
  Globe,
  GraduationCap,
  Mic,
  Code,
  ChevronDown,
  ChevronUp,
  Calendar,
  Search,
  Download,
  User,
  AlertCircle,
  Layers,
  School
} from "lucide-react";
import { Card, CardContent} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Interface pour les exercices
interface Homework {
  id: string;
  filiere: { nom: string } | null;
  title: string;
  exerciseType: string;
  pages: string | null;
  content: string | null;
  date: string;
  vague: { nom: string } | null;
  module: { nom: string } | null;
  deadline: string;
  status: "actif" | "archivé";
  fileUrl?: string;
  teacher: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

// Composant Item d'Exercice
const ExerciseItem = ({ exercise }: { exercise: Homework }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isOverdue = new Date(exercise.deadline) < new Date();
  const isDueSoon = new Date(exercise.deadline) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 jours

  const iconMap = {
    "Développement Web": Code,
    "Data Science": Calculator,
    "Cybersécurité": FlaskConical,
    "Développement Mobile": Globe,
    "Cloud Computing": GraduationCap,
    "Intelligence Artificielle": Mic,
    "Design UX/UI": Pencil,
  };

  const filiereName = exercise.filiere?.nom || "Général";
  const Icon = iconMap[filiereName as keyof typeof iconMap] || BookOpen;

  return (
    <Card className={`w-full hover:shadow-lg transition-all duration-300 border ${
      isOverdue ? 'border-red-200 bg-red-50' : isDueSoon ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
    }`}>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className="p-2 bg-blue-600 rounded-lg flex-shrink-0 mt-1">
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 truncate">{exercise.title}</h3>
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  <Badge variant="outline" className="text-xs px-2 py-0">
                    {exercise.module?.nom || "Sans module"}
                  </Badge>
                  {exercise.vague?.nom && (
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      {exercise.vague.nom}
                    </Badge>
                  )}
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs px-2 py-0">
                      En retard
                    </Badge>
                  )}
                  {isDueSoon && !isOverdue && (
                    <Badge variant="outline" className="text-xs px-2 py-0 text-orange-600 border-orange-300">
                      Bientôt dû
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 h-8 w-8 p-0 ml-2"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <User className="h-3 w-3 text-blue-600 flex-shrink-0" />
              <span className="truncate">
                Par: {exercise.teacher.user.firstName} {exercise.teacher.user.lastName}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3 text-blue-600 flex-shrink-0" />
              <span className="truncate">À rendre: {formatDate(exercise.deadline)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Layers className="h-3 w-3 text-blue-600 flex-shrink-0" />
              <span className="truncate">{filiereName}</span>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-4 pt-4 border-t border-gray-200">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-700 text-sm">Type d'exercice:</span>
                  <span className="text-sm text-gray-600 text-right">{exercise.exerciseType || "Non spécifié"}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-700 text-sm">Pages/Chapitre:</span>
                  <span className="text-sm text-gray-600 text-right">{exercise.pages || "Non spécifié"}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-700 text-sm">Date de création:</span>
                  <span className="text-sm text-gray-600 text-right">{formatDate(exercise.date)}</span>
                </div>
                {exercise.vague?.nom && (
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-700 text-sm">Semestre:</span>
                    <span className="text-sm text-gray-600 text-right">{exercise.vague.nom}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2 text-sm">Instructions:</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm leading-relaxed">
                  {exercise.content || "Aucune instruction spécifiée."}
                </p>
              </div>

              {exercise.fileUrl && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2 text-sm">Fichier joint:</h4>
                  <Button variant="outline" size="sm" asChild>
                    <a href={exercise.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger le fichier
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Skeleton Loader
const ExerciseSkeleton = () => {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="flex gap-2">
              <div className="h-5 bg-gray-300 rounded-full w-16"></div>
              <div className="h-5 bg-gray-300 rounded-full w-12"></div>
            </div>
            <div className="space-y-1">
              <div className="h-3 bg-gray-300 rounded w-32"></div>
              <div className="h-3 bg-gray-300 rounded w-28"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Page Principale
export default function StudentExercices() {
  const [exercises, setExercises] = useState<Homework[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");

  // Charger les exercices depuis l'API
  const fetchExercises = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/student/homeworks');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des exercices');
      }

      const data = await response.json();
      setExercises(data.homeworks || []);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement des exercices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  // Filtrer les exercices
  useEffect(() => {
    let result = exercises;

    if (searchTerm) {
      result = result.filter(ex =>
        ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.teacher.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.teacher.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.module?.nom.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedModule !== "all") {
      result = result.filter(ex => ex.module?.nom === selectedModule);
    }

    if (selectedSemester !== "all") {
      result = result.filter(ex => ex.vague?.nom === selectedSemester);
    }

    setFilteredExercises(result);
  }, [exercises, searchTerm, selectedModule, selectedSemester]);

  const stats = {
    total: exercises.length,
    enRetard: exercises.filter(ex => new Date(ex.deadline) < new Date()).length,
    bientotDus: exercises.filter(ex => 
      new Date(ex.deadline) > new Date() && 
      new Date(ex.deadline) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    ).length,
    differentesFilieres: [...new Set(exercises.map(ex => ex.filiere?.nom).filter(Boolean))].length
  };

  const modules = [...new Set(exercises.map(ex => ex.module?.nom).filter(Boolean))];
  const semesters = [...new Set(exercises.map(ex => ex.vague?.nom).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 space-y-4">
        {/* Header Skeleton */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white border border-gray-200">
              <CardContent className="p-3">
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-6 w-8" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Exercises Skeleton */}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <ExerciseSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="p-4">
          <div className="flex flex-col space-y-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mes Exercices</h1>
              <p className="text-gray-600 text-sm mt-1">Exercices assignés par vos professeurs</p>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par titre, professeur ou module..."
                className="pl-10 bg-white border-gray-300 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-4 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-3">
              <div className="text-xs font-medium text-gray-700 mb-1">Total</div>
              <div className="text-lg font-bold text-blue-600">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-3">
              <div className="text-xs font-medium text-gray-700 mb-1">En retard</div>
              <div className="text-lg font-bold text-red-600">{stats.enRetard}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-3">
              <div className="text-xs font-medium text-gray-700 mb-1">Bientôt dû</div>
              <div className="text-lg font-bold text-orange-600">{stats.bientotDus}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-3">
              <div className="text-xs font-medium text-gray-700 mb-1">Filières</div>
              <div className="text-lg font-bold text-purple-600">{stats.differentesFilieres}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        {(modules.length > 0 || semesters.length > 0) && (
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Filtrer les exercices</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Filtre par module */}
                  {modules.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Layers className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Module</span>
                      </div>
                      <Select value={selectedModule} onValueChange={setSelectedModule}>
                        <SelectTrigger className="bg-white border-gray-300 text-sm">
                          <SelectValue placeholder="Tous les modules" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les modules</SelectItem>
                          {modules.map(module => (
                            <SelectItem key={module} value={module || ""}>{module}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Filtre par semestre */}
                  {semesters.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <School className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Semestre</span>
                      </div>
                      <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                        <SelectTrigger className="bg-white border-gray-300 text-sm">
                          <SelectValue placeholder="Tous les semestres" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les semestres</SelectItem>
                          {semesters.map(semester => (
                            <SelectItem key={semester} value={semester || ""}>{semester}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Boutons de réinitialisation */}
                {(selectedModule !== "all" || selectedSemester !== "all") && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedModule("all");
                        setSelectedSemester("all");
                      }}
                    >
                      Réinitialiser les filtres
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des exercices */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Exercices à faire</h2>
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {filteredExercises.length} exercice(s)
            </span>
          </div>

          {filteredExercises.length === 0 ? (
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium text-sm mb-2">
                  {exercises.length === 0 ? "Aucun exercice assigné" : "Aucun exercice trouvé"}
                </p>
                <p className="text-gray-500 text-xs">
                  {exercises.length === 0 
                    ? "Vos professeurs n'ont pas encore assigné d'exercices." 
                    : "Aucun exercice ne correspond à vos critères de recherche."
                  }
                </p>
                {(selectedModule !== "all" || selectedSemester !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setSelectedModule("all");
                      setSelectedSemester("all");
                    }}
                  >
                    Réinitialiser les filtres
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredExercises.map((exercise) => (
                <ExerciseItem
                  key={exercise.id}
                  exercise={exercise}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}