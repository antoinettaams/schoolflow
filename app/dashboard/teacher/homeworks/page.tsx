// app/dashboard/professeur/exercices/page.tsx
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
  Plus,
  Edit,
  Trash2,
  Filter,
  Download,
  Upload,
  Save,
  X,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

// --- Interfaces ---
interface Exercise {
  id: string;
  filiere: string;
  title: string;
  exerciseType: string;
  pages: string;
  content: string;
  date: string;
  vague: string;
  module: string;
  deadline: string;
  status: "actif" | "archivé";
  fileUrl?: string;
  filiereId?: number;
  vagueId?: string;
  moduleId?: number;
}

interface ExerciseForm {
  id?: string;
  filiereId: string;
  title: string;
  exerciseType: string;
  pages: string;
  content: string;
  date: string;
  vagueId: string;
  moduleId: string;
  deadline: string;
  file?: File;
}

interface AvailableData {
  filieres: { id: number; nom: string }[];
  vagues: { id: string; nom: string }[];
  modules: { id: number; nom: string; filiere: string; filiereId: number }[];
}

const iconMap = {
  "Développement Web": Code,
  "Data Science": Calculator,
  "Cybersécurité": FlaskConical,
  "Développement Mobile": Globe,
  "Cloud Computing": GraduationCap,
  "Intelligence Artificielle": Mic,
  "Design UX/UI": Pencil,
};

// --- Composant Item d'Exercice ---
interface ExerciseItemProps {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  isUpdating?: boolean;
}

const ExerciseItem = ({ exercise, onEdit, onDelete, onToggleStatus, isUpdating = false }: ExerciseItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = iconMap[exercise.filiere as keyof typeof iconMap] || BookOpen;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const isOverdue = new Date(exercise.deadline) < new Date();

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
      <CardContent className="p-4 sm:p-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1">
            <div className="p-2 sm:p-3 bg-blue-600 rounded-xl flex-shrink-0">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words">{exercise.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{exercise.filiere}</Badge>
                    <Badge variant={exercise.status === "actif" ? "default" : "secondary"} className="text-xs">
                      {exercise.status}
                    </Badge>
                    {isOverdue && (
                      <Badge variant="destructive" className="text-xs">
                        En retard
                      </Badge>
                    )}
                    <span className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                      {formatDate(exercise.date)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <span className="break-words"><strong>Vague:</strong> {exercise.vague}</span>
                <span className="break-words"><strong>Module:</strong> {exercise.module}</span>
                <span className={`break-words ${isOverdue ? "text-red-600 font-semibold" : ""}`}>
                  <strong>Échéance:</strong> {formatDate(exercise.deadline)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleStatus(exercise.id)}
                disabled={isUpdating}
                className="h-8 sm:h-9 text-xs"
              >
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  exercise.status === "actif" ? "Archiver" : "Activer"
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(exercise)}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 sm:p-2"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(exercise.id)}
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 sm:p-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 sm:h-9 sm:w-9 p-0"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Contenu détaillé */}
        {isExpanded && (
          <div className="mt-4 sm:mt-6 space-y-4 border-t pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="font-medium text-gray-700 text-sm">Type d&apos;exercice:</span>
                  <span className="text-sm">{exercise.exerciseType || "Non spécifié"}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="font-medium text-gray-700 text-sm">Pages:</span>
                  <span className="text-sm">{exercise.pages || "Non spécifié"}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="font-medium text-gray-700 text-sm">Date de création:</span>
                  <span className="text-sm">{formatDate(exercise.date)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="font-medium text-gray-700 text-sm">Date limite:</span>
                  <span className={`text-sm ${isOverdue ? "text-red-600 font-semibold" : ""}`}>
                    {formatDate(exercise.deadline)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 text-sm mb-2">Instructions:</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm leading-relaxed">
                {exercise.content || "Aucune instruction spécifiée."}
              </p>
            </div>

            {exercise.fileUrl && (
              <div>
                <h4 className="font-medium text-gray-700 text-sm mb-2">Fichier joint:</h4>
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
      </CardContent>
    </Card>
  );
};

// --- Skeleton Loader ---
const ExerciseSkeleton = () => {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Page Principale ---
export default function ProfesseurExercices() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [availableData, setAvailableData] = useState<AvailableData>({
    filieres: [],
    vagues: [],
    modules: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState<string>("all");
  const [selectedVague, setSelectedVague] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [updatingExerciseId, setUpdatingExerciseId] = useState<string | null>(null);
  
  // États pour les modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);
  
  // État du formulaire
  const [exerciseForm, setExerciseForm] = useState<ExerciseForm>({
    filiereId: "",
    title: "",
    exerciseType: "",
    pages: "",
    content: "",
    date: new Date().toISOString().split('T')[0],
    vagueId: "",
    moduleId: "",
    deadline: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les données depuis l'API
  const fetchExercises = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/teacher/homeworks');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du chargement des exercices');
      }

      const data = await response.json();
      setExercises(data.homeworks || []);
      setAvailableData(data.availableData || {
        filieres: [],
        vagues: [],
        modules: []
      });
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

  // Récupérer les modules selon la filière sélectionnée
  const getModulesForFiliere = (filiereId: string) => {
    return availableData.modules.filter(module => module.filiereId === parseInt(filiereId));
  };

  // Filtrage des exercices
  useEffect(() => {
    let result = exercises;

    if (searchTerm) {
      result = result.filter(ex =>
        ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.filiere.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.exerciseType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedFiliere !== "all") {
      result = result.filter(ex => ex.filiere === selectedFiliere);
    }

    if (selectedVague !== "all") {
      result = result.filter(ex => ex.vague === selectedVague);
    }

    if (selectedStatus !== "all") {
      result = result.filter(ex => ex.status === selectedStatus);
    }

    setFilteredExercises(result);
  }, [exercises, searchTerm, selectedFiliere, selectedVague, selectedStatus]);

  // Gestion du formulaire
  const handleFormChange = (field: keyof ExerciseForm, value: string) => {
    setExerciseForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Réinitialiser le module si la filière change
    if (field === 'filiereId' && value !== exerciseForm.filiereId) {
      setExerciseForm(prev => ({
        ...prev,
        moduleId: ""
      }));
    }
  };

  const resetForm = () => {
    setExerciseForm({
      filiereId: "",
      title: "",
      exerciseType: "",
      pages: "",
      content: "",
      date: new Date().toISOString().split('T')[0],
      vagueId: "",
      moduleId: "",
      deadline: ""
    });
    setIsEditing(false);
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!exerciseForm.filiereId || !exerciseForm.title || !exerciseForm.vagueId || !exerciseForm.moduleId || !exerciseForm.deadline) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const url = '/api/teacher/homeworks';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isEditing ? exerciseForm : {
          filiereId: exerciseForm.filiereId,
          title: exerciseForm.title,
          exerciseType: exerciseForm.exerciseType,
          pages: exerciseForm.pages,
          content: exerciseForm.content,
          date: exerciseForm.date,
          vagueId: exerciseForm.vagueId,
          moduleId: exerciseForm.moduleId,
          deadline: exerciseForm.deadline
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur lors de la ${isEditing ? 'modification' : 'création'}`);
      }

      const result = await response.json();
      
      if (isEditing) {
        setExercises(prev => prev.map(ex =>
          ex.id === exerciseForm.id ? result.homework : ex
        ));
      } else {
        setExercises(prev => [result.homework, ...prev]);
      }

      setIsAddModalOpen(false);
      resetForm();
      setError(null);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : `Erreur lors de la ${isEditing ? 'modification' : 'création'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (exercise: Exercise) => {
    setExerciseForm({
      id: exercise.id,
      filiereId: exercise.filiereId?.toString() || "",
      title: exercise.title,
      exerciseType: exercise.exerciseType,
      pages: exercise.pages,
      content: exercise.content,
      date: exercise.date,
      vagueId: exercise.vagueId || "",
      moduleId: exercise.moduleId?.toString() || "",
      deadline: exercise.deadline
    });
    setIsEditing(true);
    setIsAddModalOpen(true);
    setError(null);
  };

  const handleDelete = (id: string) => {
    setExerciseToDelete(id);
    setIsDeleteModalOpen(true);
    setError(null);
  };

  const confirmDelete = async () => {
    if (!exerciseToDelete) return;

    try {
      const response = await fetch(`/api/teacher/homeworks?id=${exerciseToDelete}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      setExercises(prev => prev.filter(ex => ex.id !== exerciseToDelete));
      setIsDeleteModalOpen(false);
      setExerciseToDelete(null);
      setError(null);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    }
  };

  const handleToggleStatus = async (id: string) => {
    setUpdatingExerciseId(id);
    setError(null);

    try {
      const exercise = exercises.find(ex => ex.id === id);
      if (!exercise) return;

      const newStatus = exercise.status === "actif" ? "archivé" : "actif";
      
      const response = await fetch('/api/teacher/homeworks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          status: newStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du changement de statut');
      }

      setExercises(prev => prev.map(ex =>
        ex.id === id ? { ...ex, status: newStatus } : ex
      ));
      
      setError(null);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du changement de statut');
    } finally {
      setUpdatingExerciseId(null);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedFiliere("all");
    setSelectedVague("all");
    setSelectedStatus("all");
    setShowMobileFilters(false);
  };

  const hasActiveFilters = selectedFiliere !== "all" || selectedVague !== "all" || selectedStatus !== "all" || searchTerm !== "";

  const stats = {
    total: exercises.length,
    actifs: exercises.filter(ex => ex.status === "actif").length,
    archives: exercises.filter(ex => ex.status === "archivé").length,
    differentesVagues: [...new Set(exercises.map(ex => ex.vague))].length,
    differentesFilieres: [...new Set(exercises.map(ex => ex.filiere))].length,
    enRetard: exercises.filter(ex => new Date(ex.deadline) < new Date() && ex.status === "actif").length
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-32" />
              </div>
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-12" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Exercises Skeleton */}
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <ExerciseSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">Gestion des Exercices</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Créez et gérez les exercices pour vos étudiants</p>
          </div>
          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 sm:flex-none"
              onClick={fetchExercises}
              disabled={isLoading}
            >
              <Loader2 className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : 'hidden'}`} />
              Actualiser
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nouvel Exercice</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Alert d'erreur */}
      {error && (
        <div className="p-4 sm:p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
          {/* Cartes de statistiques */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Exercices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.total}</div>
                <p className="text-xs text-gray-600 mt-1">exercices créés</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium">Exercices Actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.actifs}</div>
                <p className="text-xs text-gray-600 mt-1">disponibles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium">Archivés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-orange-600">{stats.archives}</div>
                <p className="text-xs text-gray-600 mt-1">non visibles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium">Filières</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.differentesFilieres}</div>
                <p className="text-xs text-gray-600 mt-1">filières différentes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium">En retard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.enRetard}</div>
                <p className="text-xs text-gray-600 mt-1">échéance dépassée</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtres et recherche */}
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex flex-col gap-4">
                {/* Barre de recherche */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher par titre, filière ou module..."
                      className="pl-10 bg-white border-gray-300"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {/* Bouton filtre mobile */}
                  <Button
                    variant="outline"
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="md:hidden flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filtres</span>
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                        !
                      </Badge>
                    )}
                  </Button>
                </div>

                {/* Filtres Desktop */}
                <div className="hidden md:flex flex-col sm:flex-row gap-3">
                  <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white border-gray-300">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Toutes filières" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes filières</SelectItem>
                      {availableData.filieres.map(filiere => (
                        <SelectItem key={filiere.id} value={filiere.nom}>{filiere.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedVague} onValueChange={setSelectedVague}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white border-gray-300">
                      <SelectValue placeholder="Toutes vagues" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes vagues</SelectItem>
                      {availableData.vagues.map(vague => (
                        <SelectItem key={vague.id} value={vague.nom}>{vague.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full sm:w-[130px] bg-white border-gray-300">
                      <SelectValue placeholder="Tous statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous statuts</SelectItem>
                      <SelectItem value="actif">Actifs</SelectItem>
                      <SelectItem value="archivé">Archivés</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="ghost" onClick={resetFilters} className="sm:w-auto">
                      <X className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </Button>
                  )}
                </div>

                {/* Filtres Mobile */}
                {showMobileFilters && (
                  <div className="md:hidden space-y-3 p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-700">Filtres</h4>
                      <Button variant="ghost" size="sm" onClick={() => setShowMobileFilters(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                        <SelectTrigger className="bg-white border-gray-300">
                          <SelectValue placeholder="Toutes filières" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes filières</SelectItem>
                          {availableData.filieres.map(filiere => (
                            <SelectItem key={filiere.id} value={filiere.nom}>{filiere.nom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedVague} onValueChange={setSelectedVague}>
                        <SelectTrigger className="bg-white border-gray-300">
                          <SelectValue placeholder="Toutes vagues" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes vagues</SelectItem>
                          {availableData.vagues.map(vague => (
                            <SelectItem key={vague.id} value={vague.nom}>{vague.nom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="bg-white border-gray-300">
                          <SelectValue placeholder="Tous statuts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous statuts</SelectItem>
                          <SelectItem value="actif">Actifs</SelectItem>
                          <SelectItem value="archivé">Archivés</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" onClick={resetFilters} className="flex-1">
                        Réinitialiser
                      </Button>
                      <Button onClick={() => setShowMobileFilters(false)} className="flex-1">
                        Appliquer
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Indicateurs de filtres actifs (Mobile) */}
          {hasActiveFilters && (
            <div className="md:hidden bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-blue-800 font-medium">Filtres actifs:</span>
                  {selectedFiliere !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedFiliere}
                    </Badge>
                  )}
                  {selectedVague !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedVague}
                    </Badge>
                  )}
                  {selectedStatus !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedStatus}
                    </Badge>
                  )}
                  {searchTerm && (
                    <Badge variant="secondary" className="text-xs">
                      &quot;{searchTerm}&quot;
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={resetFilters} className="h-6 text-xs">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Liste des exercices */}
          <Card>
            <CardHeader>
              <CardTitle>Exercices Créés</CardTitle>
              <CardDescription>
                {filteredExercises.length} exercice(s) trouvé(s) sur {exercises.length} au total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredExercises.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium text-sm sm:text-base">
                      {exercises.length === 0 
                        ? "Vous n'avez pas encore créé d'exercices." 
                        : "Aucun exercice ne correspond à vos critères."
                      }
                    </p>
                    <Button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="mt-4"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer le premier exercice
                    </Button>
                  </div>
                ) : (
                  filteredExercises.map((exercise) => (
                    <ExerciseItem
                      key={exercise.id}
                      exercise={exercise}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleStatus={handleToggleStatus}
                      isUpdating={updatingExerciseId === exercise.id}
                    />
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal d'ajout/modification */}
      <Dialog open={isAddModalOpen} onOpenChange={(open) => {
        setIsAddModalOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl bg-white h-screen sm:h-auto sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {isEditing ? "Modifier l'Exercice" : "Créer un Nouvel Exercice"}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              {isEditing ? "Modifiez les informations de l'exercice" : "Remplissez les informations pour créer un nouvel exercice"}
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 bg-white">
            <div className="space-y-2">
              <Label htmlFor="filiere" className="text-gray-700 text-sm sm:text-base">Filière *</Label>
              <Select 
                value={exerciseForm.filiereId}
                onValueChange={(value) => handleFormChange('filiereId', value)}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Sélectionner une filière" />
                </SelectTrigger>
                <SelectContent>
                  {availableData.filieres.map(filiere => (
                    <SelectItem key={filiere.id} value={filiere.id.toString()}>{filiere.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vague" className="text-gray-700 text-sm sm:text-base">Vague *</Label>
              <Select 
                value={exerciseForm.vagueId}
                onValueChange={(value) => handleFormChange('vagueId', value)}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Sélectionner une vague" />
                </SelectTrigger>
                <SelectContent>
                  {availableData.vagues.map(vague => (
                    <SelectItem key={vague.id} value={vague.id}>{vague.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="module" className="text-gray-700 text-sm sm:text-base">Module *</Label>
              <Select 
                value={exerciseForm.moduleId}
                onValueChange={(value) => handleFormChange('moduleId', value)}
                disabled={!exerciseForm.filiereId}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder={
                    exerciseForm.filiereId 
                      ? "Sélectionner un module" 
                      : "Choisissez d'abord une filière"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {getModulesForFiliere(exerciseForm.filiereId).map(module => (
                    <SelectItem key={module.id} value={module.id.toString()}>{module.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exerciseType" className="text-gray-700 text-sm sm:text-base">Type d&apos;exercice</Label>
              <Input 
                placeholder="Ex: Projet Frontend, TP Data Analysis..."
                value={exerciseForm.exerciseType}
                onChange={(e) => handleFormChange('exerciseType', e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title" className="text-gray-700 text-sm sm:text-base">Titre de l&apos;exercice *</Label>
              <Input 
                placeholder="Ex: Exercices React & Next.js, Analyse de données..."
                value={exerciseForm.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pages" className="text-gray-700 text-sm sm:text-base">Pages/Chapitre</Label>
              <Input 
                placeholder="Ex: Pages 45-52, Chapitre 3, Module 2..."
                value={exerciseForm.pages}
                onChange={(e) => handleFormChange('pages', e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-gray-700 text-sm sm:text-base">Date de création *</Label>
              <Input 
                type="date"
                value={exerciseForm.date}
                onChange={(e) => handleFormChange('date', e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-gray-700 text-sm sm:text-base">Date limite *</Label>
              <Input 
                type="date"
                value={exerciseForm.deadline}
                onChange={(e) => handleFormChange('deadline', e.target.value)}
                className="bg-white border-gray-300"
                min={exerciseForm.date}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="file" className="text-gray-700 text-sm sm:text-base">Fichier (optionnel)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 text-center bg-white">
                <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs sm:text-sm text-gray-600">Cliquez pour télécharger un fichier</p>
                <Input 
                  type="file" 
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Pour l'instant, on stocke juste le nom du fichier
                      // L'upload réel serait implémenté séparément
                      handleFormChange('exerciseType', `Avec fichier: ${file.name}`);
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => {
                    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                    fileInput?.click();
                  }}
                  className="mt-2 text-xs sm:text-sm"
                  size="sm"
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Télécharger
                </Button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="content" className="text-gray-700 text-sm sm:text-base">Instructions et contenu *</Label>
              <Textarea 
                placeholder="Décrivez les instructions, les objectifs et le contenu de l'exercice..."
                value={exerciseForm.content}
                onChange={(e) => handleFormChange('content', e.target.value)}
                className="bg-white border-gray-300 min-h-[100px] sm:min-h-[120px] text-sm sm:text-base"
              />
            </div>
          </div>

          <DialogFooter className="bg-white flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }} 
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditing ? "Modifier" : "Créer"} l&apos;Exercice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-white max-w-sm sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Êtes-vous sûr de vouloir supprimer cet exercice ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="bg-white flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="w-full sm:w-auto">
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}