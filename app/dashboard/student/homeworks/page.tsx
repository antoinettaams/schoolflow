// app/dashboard/professeur/exercices/page.tsx
"use client";
import React, { useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
}

interface ExerciseForm {
  id?: string;
  filiere: string;
  title: string;
  exerciseType: string;
  pages: string;
  content: string;
  date: string;
  vague: string;
  module: string;
  deadline: string;
  file?: File;
}

// --- Données simulées ---
const initialExercises: Exercise[] = [
  {
    id: "1",
    filiere: "Développement Web",
    title: "Exercices React & Next.js",
    exerciseType: "Projet Frontend",
    pages: "Pages 45 à 52",
    content: "Création d'une application React avec Next.js. Implémenter le routing et les composants fonctionnels.",
    date: "2024-10-15",
    vague: "Vague Janvier 2024",
    module: "React Avancé",
    deadline: "2024-10-25",
    status: "actif"
  },
  {
    id: "2",
    filiere: "Data Science",
    title: "Analyse de données avec Pandas",
    exerciseType: "TP Data Analysis",
    pages: "Chapitre 3",
    content: "Manipulation de datasets avec Pandas. Nettoyage des données et création de visualisations.",
    date: "2024-10-16",
    vague: "Vague Janvier 2024",
    module: "Python pour Data Science",
    deadline: "2024-10-26",
    status: "actif"
  },
  {
    id: "3",
    filiere: "Cybersécurité",
    title: "Tests de pénétration réseau",
    exerciseType: "Lab Sécurité",
    pages: "Module 2 - Sécurité Réseau",
    content: "Analyse de vulnérabilités réseau et tests d'intrusion. Utilisation de Nmap et Metasploit.",
    date: "2024-10-13",
    vague: "Vague Mars 2024",
    module: "Sécurité Réseau",
    deadline: "2024-10-23",
    status: "actif"
  },
  {
    id: "4",
    filiere: "Développement Mobile",
    title: "Application React Native",
    exerciseType: "Projet Mobile",
    pages: "Partie 1 - Fondamentaux",
    content: "Développement d'une application mobile cross-platform avec React Native. Gestion d'état avec Redux.",
    date: "2024-10-12",
    vague: "Vague Mars 2024",
    module: "React Native",
    deadline: "2024-10-22",
    status: "archivé"
  }
];

const iconMap = {
  "Développement Web": Code,
  "Data Science": Calculator,
  "Cybersécurité": FlaskConical,
  "Développement Mobile": Globe,
  "Cloud Computing": GraduationCap,
  "Intelligence Artificielle": Mic,
  "Design UX/UI": Pencil,
};

const filieres = [
  "Développement Web",
  "Data Science",
  "Cybersécurité",
  "Développement Mobile",
  "Cloud Computing",
  "Intelligence Artificielle",
  "Design UX/UI"
];

// Modules par filière
const modulesParFiliere = {
  "Développement Web": [
    "HTML/CSS Avancé",
    "JavaScript Moderne",
    "React Avancé",
    "Next.js",
    "Node.js & Express",
    "Base de données",
    "API REST",
    "Testing Frontend"
  ],
  "Data Science": [
    "Python pour Data Science",
    "Pandas & NumPy",
    "Visualisation de données",
    "Machine Learning",
    "Deep Learning",
    "Analyse statistique",
    "Big Data",
    "Data Mining"
  ],
  "Cybersécurité": [
    "Sécurité Réseau",
    "Cryptographie",
    "Ethical Hacking",
    "Forensique numérique",
    "Sécurité Cloud",
    "Sécurité Mobile",
    "Audit de sécurité",
    "Gestion des vulnérabilités"
  ],
  "Développement Mobile": [
    "React Native",
    "Flutter",
    "iOS Development",
    "Android Development",
    "Mobile UX/UI",
    "APIs Mobiles",
    "Performance Mobile",
    "Publication d'apps"
  ],
  "Cloud Computing": [
    "AWS Fundamentals",
    "Azure Services",
    "Google Cloud Platform",
    "Docker & Kubernetes",
    "DevOps Practices",
    "Serverless Architecture",
    "Cloud Security",
    "Microservices"
  ],
  "Intelligence Artificielle": [
    "Machine Learning",
    "Deep Learning",
    "Computer Vision",
    "Natural Language Processing",
    "Reinforcement Learning",
    "AI Ethics",
    "Neural Networks",
    "AI Project Management"
  ],
  "Design UX/UI": [
    "Design Thinking",
    "Wireframing",
    "Prototypage",
    "User Research",
    "UI Design Principles",
    "Design Systems",
    "Accessibilité",
    "Design Tools"
  ]
};

const vagues = [
  "Vague Janvier 2024",
  "Vague Mars 2024",
  "Vague Mai 2024",
  "Vague Septembre 2024"
];

// --- Composant Item d'Exercice ---
interface ExerciseItemProps {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

const ExerciseItem = ({ exercise, onEdit, onDelete, onToggleStatus }: ExerciseItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = iconMap[exercise.filiere as keyof typeof iconMap] || BookOpen;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Card className="w-full hover:shadow-lg transition-all duration-300 border border-gray-200">
      <CardContent className="p-4">
        {/* En-tête */}
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
                    {exercise.filiere}
                  </Badge>
                  <Badge 
                    variant={exercise.status === "actif" ? "default" : "secondary"} 
                    className="text-xs px-2 py-0"
                  >
                    {exercise.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Bouton pour mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 h-8 w-8 p-0 ml-2"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {/* Informations de base */}
          <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3 text-blue-600 flex-shrink-0" />
              <span className="truncate">Créé: {formatDate(exercise.date)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium flex-shrink-0">Module:</span>
              <span className="truncate">{exercise.module}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium flex-shrink-0">Vague:</span>
              <span className="truncate">{exercise.vague}</span>
            </div>
          </div>

          {/* Actions pour mobile */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleStatus(exercise.id)}
                className="h-8 text-xs"
              >
                {exercise.status === "actif" ? "Archiver" : "Activer"}
              </Button>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(exercise)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(exercise.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Contenu détaillé */}
        {isExpanded && (
          <div className="mt-4 space-y-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-700 text-sm">Type d'exercice:</span>
                  <span className="text-sm text-gray-600 text-right">{exercise.exerciseType}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-700 text-sm">Pages:</span>
                  <span className="text-sm text-gray-600 text-right">{exercise.pages}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="font-medium text-gray-700 text-sm">Date limite:</span>
                  <span className={`text-sm ${new Date(exercise.deadline) < new Date() ? "text-red-600 font-semibold" : "text-gray-600"}`}>
                    {formatDate(exercise.deadline)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2 text-sm">Instructions:</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm leading-relaxed">
                {exercise.content}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- Page Principale ---
export default function ProfesseurExercices() {
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>(initialExercises);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState<string>("all");
  const [selectedVague, setSelectedVague] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  // États pour les modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);
  
  // État du formulaire
  const [exerciseForm, setExerciseForm] = useState<ExerciseForm>({
    filiere: "",
    title: "",
    exerciseType: "",
    pages: "",
    content: "",
    date: new Date().toISOString().split('T')[0],
    vague: "",
    module: "",
    deadline: ""
  });
  const [isEditing, setIsEditing] = useState(false);

  // Récupérer les modules selon la filière sélectionnée
  const getModulesForFiliere = (filiere: string) => {
    return modulesParFiliere[filiere as keyof typeof modulesParFiliere] || [];
  };

  // Filtrage des exercices
  React.useEffect(() => {
    let result = exercises;

    if (searchTerm) {
      result = result.filter(ex =>
        ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.filiere.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.module.toLowerCase().includes(searchTerm.toLowerCase())
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
  const handleFormChange = (field: keyof ExerciseForm, value: string | File) => {
    setExerciseForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Réinitialiser le module
    if (field === 'filiere' && value !== exerciseForm.filiere) {
      setExerciseForm(prev => ({
        ...prev,
        module: ""
      }));
    }
  };

  const resetForm = () => {
    setExerciseForm({
      filiere: "",
      title: "",
      exerciseType: "",
      pages: "",
      content: "",
      date: new Date().toISOString().split('T')[0],
      vague: "",
      module: "",
      deadline: ""
    });
    setIsEditing(false);
  };

  const handleSubmit = () => {
    if (!exerciseForm.filiere || !exerciseForm.title || !exerciseForm.vague || !exerciseForm.module) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (isEditing && exerciseForm.id) {
      // Modification
      setExercises(prev => prev.map(ex =>
        ex.id === exerciseForm.id
          ? {
              ...ex,
              filiere: exerciseForm.filiere,
              title: exerciseForm.title,
              exerciseType: exerciseForm.exerciseType,
              pages: exerciseForm.pages,
              content: exerciseForm.content,
              vague: exerciseForm.vague,
              module: exerciseForm.module,
              deadline: exerciseForm.deadline
            }
          : ex
      ));
    } else {
      // Ajout
      const newExercise: Exercise = {
        id: Date.now().toString(),
        filiere: exerciseForm.filiere,
        title: exerciseForm.title,
        exerciseType: exerciseForm.exerciseType,
        pages: exerciseForm.pages,
        content: exerciseForm.content,
        date: exerciseForm.date,
        vague: exerciseForm.vague,
        module: exerciseForm.module,
        deadline: exerciseForm.deadline,
        status: "actif"
      };
      setExercises(prev => [newExercise, ...prev]);
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleEdit = (exercise: Exercise) => {
    setExerciseForm({
      id: exercise.id,
      filiere: exercise.filiere,
      title: exercise.title,
      exerciseType: exercise.exerciseType,
      pages: exercise.pages,
      content: exercise.content,
      date: exercise.date,
      vague: exercise.vague,
      module: exercise.module,
      deadline: exercise.deadline
    });
    setIsEditing(true);
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setExerciseToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (exerciseToDelete) {
      setExercises(prev => prev.filter(ex => ex.id !== exerciseToDelete));
      setIsDeleteModalOpen(false);
      setExerciseToDelete(null);
    }
  };

  const handleToggleStatus = (id: string) => {
    setExercises(prev => prev.map(ex =>
      ex.id === id
        ? { ...ex, status: ex.status === "actif" ? "archivé" : "actif" }
        : ex
    ));
  };

  const stats = {
    total: exercises.length,
    actifs: exercises.filter(ex => ex.status === "actif").length,
    archives: exercises.filter(ex => ex.status === "archivé").length,
    differentesVagues: [...new Set(exercises.map(ex => ex.vague))].length,
    differentesFilieres: [...new Set(exercises.map(ex => ex.filiere))].length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixe */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="p-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Gestion des Exercices</h1>
                <p className="text-gray-600 text-sm mt-1">Créez et gérez les exercices</p>
              </div>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                size="sm"
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden xs:inline">Nouveau</span>
              </Button>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                className="pl-10 bg-white border-gray-300 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal scrollable */}
      <div className="p-4 space-y-4">
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
              <div className="text-xs font-medium text-gray-700 mb-1">Actifs</div>
              <div className="text-lg font-bold text-green-600">{stats.actifs}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-3">
              <div className="text-xs font-medium text-gray-700 mb-1">Archivés</div>
              <div className="text-lg font-bold text-orange-600">{stats.archives}</div>
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
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filtres</span>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                  <SelectTrigger className="bg-white border-gray-300 text-sm">
                    <SelectValue placeholder="Toutes filières" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes filières</SelectItem>
                    {filieres.map(filiere => (
                      <SelectItem key={filiere} value={filiere}>{filiere}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedVague} onValueChange={setSelectedVague}>
                  <SelectTrigger className="bg-white border-gray-300 text-sm">
                    <SelectValue placeholder="Toutes vagues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes vagues</SelectItem>
                    {vagues.map(vague => (
                      <SelectItem key={vague} value={vague}>{vague}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="bg-white border-gray-300 text-sm">
                    <SelectValue placeholder="Tous statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    <SelectItem value="actif">Actifs</SelectItem>
                    <SelectItem value="archivé">Archivés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des exercices */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Exercices</h2>
            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {filteredExercises.length} trouvé(s)
            </span>
          </div>

          {filteredExercises.length === 0 ? (
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium text-sm mb-2">
                  Aucun exercice trouvé
                </p>
                <p className="text-gray-500 text-xs mb-4">
                  Aucun exercice ne correspond à vos critères de recherche.
                </p>
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un exercice
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredExercises.map((exercise) => (
                <ExerciseItem
                  key={exercise.id}
                  exercise={exercise}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal d'ajout/modification */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-white w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg">
              {isEditing ? "Modifier l'Exercice" : "Créer un Exercice"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {isEditing ? "Modifiez les informations de l'exercice" : "Remplissez les informations pour créer un nouvel exercice"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filiere" className="text-sm font-medium">Filière *</Label>
                <Select 
                  value={exerciseForm.filiere}
                  onValueChange={(value) => handleFormChange('filiere', value)}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Sélectionner une filière" />
                  </SelectTrigger>
                  <SelectContent>
                    {filieres.map(filiere => (
                      <SelectItem key={filiere} value={filiere}>{filiere}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vague" className="text-sm font-medium">Vague *</Label>
                <Select 
                  value={exerciseForm.vague}
                  onValueChange={(value) => handleFormChange('vague', value)}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Sélectionner une vague" />
                  </SelectTrigger>
                  <SelectContent>
                    {vagues.map(vague => (
                      <SelectItem key={vague} value={vague}>{vague}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="module" className="text-sm font-medium">Module *</Label>
                <Select 
                  value={exerciseForm.module}
                  onValueChange={(value) => handleFormChange('module', value)}
                  disabled={!exerciseForm.filiere}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder={
                      exerciseForm.filiere 
                        ? "Sélectionner un module" 
                        : "Choisissez d'abord une filière"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {getModulesForFiliere(exerciseForm.filiere).map(module => (
                      <SelectItem key={module} value={module}>{module}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Titre de l'exercice *</Label>
                <Input 
                  placeholder="Ex: Exercices React & Next.js..."
                  value={exerciseForm.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exerciseType" className="text-sm font-medium">Type d'exercice</Label>
                <Input 
                  placeholder="Ex: Projet Frontend, TP Data Analysis..."
                  value={exerciseForm.exerciseType}
                  onChange={(e) => handleFormChange('exerciseType', e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pages" className="text-sm font-medium">Pages/Chapitre</Label>
                  <Input 
                    placeholder="Ex: Pages 45-52..."
                    value={exerciseForm.pages}
                    onChange={(e) => handleFormChange('pages', e.target.value)}
                    className="bg-white border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium">Date création *</Label>
                  <Input 
                    type="date"
                    value={exerciseForm.date}
                    onChange={(e) => handleFormChange('date', e.target.value)}
                    className="bg-white border-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-sm font-medium">Date limite *</Label>
                <Input 
                  type="date"
                  value={exerciseForm.deadline}
                  onChange={(e) => handleFormChange('deadline', e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="text-sm font-medium">Instructions et contenu *</Label>
                <Textarea 
                  placeholder="Décrivez les instructions, les objectifs et le contenu de l'exercice..."
                  value={exerciseForm.content}
                  onChange={(e) => handleFormChange('content', e.target.value)}
                  className="bg-white border-gray-300 min-h-[100px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file" className="text-sm font-medium">Fichier (optionnel)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-gray-50">
                  <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-600 mb-2">Glissez-déposez ou cliquez pour télécharger</p>
                  <Input 
                    type="file" 
                    className="hidden"
                    onChange={(e) => handleFormChange('file', e.target.files?.[0] as File)}
                    id="file-upload"
                  />
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    size="sm"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choisir un fichier
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button onClick={handleSubmit} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Modifier" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-white w-[90vw] max-w-md">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-sm">
              Êtes-vous sûr de vouloir supprimer cet exercice ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}