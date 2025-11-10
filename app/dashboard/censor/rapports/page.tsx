// app/(dashboard)/censeur/rapports-personnels/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, BookOpen, School, UserCog, Filter, MessageSquare, Trash2, Plus, Clock, Edit, Search, AlertCircle } from 'lucide-react';

// Interfaces
interface Rapport {
  id: string;
  module: string;
  formateur: string;
  vague: string;
  date: string;
  chapitre: string;
  objectif: string;
  dureePlanifiee: string;
  dureeReelle: string;
  progression: "Terminé" | "Partiel" | "Non terminé";
  difficulte: string;
  correctionTemps: string;
  evaluation: number;
  commentaireProf: string;
  commentaireCenseur: string;
  filiere: string;
}

interface Module {
  id: number;
  nom: string;
  formateurs: {
    id: string;
    nom: string;
  }[];
}

interface Filiere {
  id: number;
  nom: string;
  modules: Module[];
  vagues: {
    id: string;
    nom: string;
  }[];
  tousLesFormateurs: {
    id: string;
    nom: string;
  }[];
}

interface StatsData {
  filiere: string;
  progressionMoyenne: number;
  evaluationMoyenne: number;
  respectDelaisMoyen: number;
}

// Composants Skeleton personnalisés
const ReportSkeleton = () => (
  <div className="border border-gray-200 rounded-lg p-4 bg-white animate-pulse">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
      <div className="flex-1">
        <Skeleton className="h-6 w-1/3 mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <Skeleton className="h-4 w-20 mb-1" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="h-80 bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
    <div className="text-gray-400">Chargement du graphique...</div>
  </div>
);

const StatsCardSkeleton = () => (
  <Card className="bg-white border-gray-200">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-12 w-12 rounded-lg" />
      </div>
    </CardContent>
  </Card>
);

const FilterSkeleton = () => (
  <div className="flex flex-wrap gap-2">
    <Skeleton className="h-10 w-[200px]" />
    <Skeleton className="h-10 w-[140px]" />
    <Skeleton className="h-10 w-[180px]" />
  </div>
);

export default function RapportsPersonnelsPage() {
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [stats, setStats] = useState<StatsData[]>([]);
  const [selectedFiliere, setSelectedFiliere] = useState<string>('all');
  const [selectedVague, setSelectedVague] = useState('all');
  const [selectedFormateur, setSelectedFormateur] = useState('all');
  const [commentaire, setCommentaire] = useState('');
  const [editingRapport, setEditingRapport] = useState<string | null>(null);
  const [editRapportData, setEditRapportData] = useState<Partial<Rapport> | null>(null);
  const [isNewRapportOpen, setIsNewRapportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rapportToDelete, setRapportToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allTeachers, setAllTeachers] = useState<{id: string, nom: string}[]>([]);

  // Nouveau rapport state - CORRIGÉ
  const [newRapport, setNewRapport] = useState({
    filiereId: '', // Changé de 'filiere' à 'filiereId'
    moduleId: '',
    formateurId: '',
    vagueId: '',
    date: new Date().toISOString().split('T')[0],
    chapitre: '',
    objectif: '',
    dureePlanifiee: '',
    dureeReelle: '',
    progression: 'Terminé' as "Terminé" | "Partiel" | "Non terminé",
    difficulte: '',
    evaluation: 4.0,
    commentaireProf: '',
    commentaireCenseur: ''
  });

  // Charger les données
  useEffect(() => {
    fetchData();
  }, []);

  // Recharger les rapports quand les filtres changent
  useEffect(() => {
    if (selectedFiliere && selectedFiliere !== 'all') {
      fetchRapports();
    }
  }, [selectedFiliere, selectedVague, selectedFormateur]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Début du chargement des données...');

      const [filieresResponse, statsResponse] = await Promise.all([
        fetch('/api/censor/reports?action=filieres'),
        fetch('/api/censor/reports?action=stats')
      ]);

      console.log('📊 Réponses reçues:', { 
        filieres: filieresResponse?.status, 
        stats: statsResponse?.status 
      });

      if (!filieresResponse?.ok) {
        const errorData = await filieresResponse.json().catch(() => ({ error: 'Erreur inconnue' }));
        throw new Error(errorData.error || `Erreur ${filieresResponse.status}`);
      }

      if (!statsResponse?.ok) {
        const errorData = await statsResponse.json().catch(() => ({ error: 'Erreur inconnue' }));
        throw new Error(errorData.error || `Erreur ${statsResponse.status}`);
      }

      const filieresData = await filieresResponse.json();
      const statsData = await statsResponse.json();

      console.log('✅ Données chargées:', { 
        filieres: filieresData.filieres?.length,
        allTeachers: filieresData.allTeachers?.length,
        stats: statsData.stats?.length 
      });

      if (filieresData.success) {
        setFilieres(filieresData.filieres || []);
        setAllTeachers(filieresData.allTeachers || []);
        
        if (filieresData.filieres?.length > 0) {
          setSelectedFiliere(filieresData.filieres[0].id.toString());
        }
      } else {
        throw new Error(filieresData.error || 'Erreur lors du chargement des filières');
      }

      if (statsData.success) {
        setStats(statsData.stats || []);
      } else {
        throw new Error(statsData.error || 'Erreur lors du chargement des statistiques');
      }

    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur de chargement des données';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRapports = async () => {
    try {
      const params = new URLSearchParams({
        action: 'reports',
        filiereId: selectedFiliere,
        vagueId: selectedVague,
        teacherId: selectedFormateur
      });

      console.log('🔍 Chargement rapports avec params:', params.toString());

      const response = await fetch(`/api/censor/reports?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Rapports chargés:', data.reports?.length);
        setRapports(data.reports || []);
      } else {
        throw new Error(data.error || 'Erreur lors du chargement des rapports');
      }
    } catch (error) {
      console.error('❌ Erreur chargement rapports:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur de chargement des rapports';
      setError(errorMessage);
      setRapports([]);
    }
  };

  // DONNÉES DÉRIVÉES - CORRIGÉES
  const selectedFiliereData = filieres.find(f => f.id.toString() === selectedFiliere);
  
  // Tous les formateurs disponibles pour les filtres
  const allFormateurs = selectedFiliereData?.tousLesFormateurs || allTeachers;

  // Toutes les vagues disponibles
  const allVagues = selectedFiliereData?.vagues || [];

  // Modules pour la filière sélectionnée dans le formulaire
  const modulesForSelectedFiliere = newRapport.filiereId 
    ? filieres.find(f => f.id.toString() === newRapport.filiereId)?.modules || []
    : [];

  // Formateurs pour le module sélectionné dans le formulaire - CORRIGÉ
  const formateursForSelectedModule = newRapport.moduleId 
    ? modulesForSelectedFiliere.find(m => m.id.toString() === newRapport.moduleId)?.formateurs || []
    : [];

  // Vagues pour la filière sélectionnée dans le formulaire
  const vaguesForSelectedFiliere = newRapport.filiereId
    ? filieres.find(f => f.id.toString() === newRapport.filiereId)?.vagues || []
    : [];

  // Préparer les données pour les graphiques
  const selectedStatsData = stats
    .filter(stat => selectedFiliereData ? stat.filiere === selectedFiliereData.nom : false)
    .map(stat => ({
      module: stat.filiere,
      progression: stat.progressionMoyenne,
      evaluation: stat.evaluationMoyenne,
      respectDelais: stat.respectDelaisMoyen
    }));

  // Filtrer les rapports
  const filteredRapports = rapports.filter(rapport => {
    const matchesSearch = 
      rapport.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rapport.formateur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rapport.chapitre.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Gestion des rapports
  const handleCreateRapport = async () => {
    try {
      // Validation améliorée
      if (!newRapport.filiereId || !newRapport.moduleId || !newRapport.formateurId || !newRapport.vagueId) {
        alert('Veuillez remplir tous les champs obligatoires (filière, module, formateur, vague)');
        return;
      }

      if (!newRapport.chapitre || !newRapport.objectif) {
        alert('Veuillez remplir le chapitre et l\'objectif pédagogique');
        return;
      }

      const response = await fetch('/api/censor/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-report',
          reportData: {
            filiereId: parseInt(newRapport.filiereId),
            moduleId: parseInt(newRapport.moduleId),
            teacherId: newRapport.formateurId,
            vagueId: newRapport.vagueId,
            date: newRapport.date,
            chapitre: newRapport.chapitre,
            objectif: newRapport.objectif,
            dureePlanifiee: newRapport.dureePlanifiee,
            dureeReelle: newRapport.dureeReelle,
            progression: newRapport.progression,
            difficulte: newRapport.difficulte,
            evaluation: newRapport.evaluation,
            commentaireProf: newRapport.commentaireProf,
            commentaireCenseur: newRapport.commentaireCenseur
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRapports(prev => [data.report, ...prev]);
          setIsNewRapportOpen(false);
          resetNewRapportForm();
          alert('Rapport créé avec succès!');
          
          // Recharger les rapports pour mettre à jour la liste
          fetchRapports();
        } else {
          alert(data.error || 'Erreur lors de la création');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création rapport:', error);
      alert('Erreur lors de la création du rapport');
    }
  };

  const handleUpdateRapport = async (rapportId: string) => {
    if (!editRapportData) return;

    try {
      const response = await fetch('/api/censor/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update-report',
          reportId: rapportId,
          updates: {
            evaluation: editRapportData.evaluation,
            progression: editRapportData.progression,
            commentaireCenseur: editRapportData.commentaireCenseur,
            difficulte: editRapportData.difficulte
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRapports(prev => prev.map(r => r.id === rapportId ? data.report : r));
          setEditingRapport(null);
          setEditRapportData(null);
          alert('Rapport mis à jour avec succès!');
        } else {
          alert(data.error || 'Erreur lors de la mise à jour');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur mise à jour rapport:', error);
      alert('Erreur lors de la mise à jour du rapport');
    }
  };

  const handleDeleteRapport = async (rapportId: string) => {
    try {
      const response = await fetch('/api/censor/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete-report',
          reportId: rapportId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRapports(prev => prev.filter(r => r.id !== rapportId));
          setDeleteDialogOpen(false);
          setRapportToDelete(null);
          alert('Rapport supprimé avec succès!');
        } else {
          alert(data.error || 'Erreur lors de la suppression');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression rapport:', error);
      alert('Erreur lors de la suppression du rapport');
    }
  };

  const resetNewRapportForm = () => {
    setNewRapport({
      filiereId: '',
      moduleId: '',
      formateurId: '',
      vagueId: '',
      date: new Date().toISOString().split('T')[0],
      chapitre: '',
      objectif: '',
      dureePlanifiee: '',
      dureeReelle: '',
      progression: 'Terminé',
      difficulte: '',
      evaluation: 4.0,
      commentaireProf: '',
      commentaireCenseur: ''
    });
  };

  const handleEditRapport = (rapportId: string) => {
    const rapport = rapports.find(r => r.id === rapportId);
    if (rapport) {
      setEditRapportData(rapport);
      setEditingRapport(rapportId);
    }
  };

  const handleCancelEdit = () => {
    setEditingRapport(null);
    setEditRapportData(null);
  };

  const getCorrectionTempsColor = (correction: string) => {
    if (correction.startsWith('+')) return 'text-red-600';
    if (correction.startsWith('-')) return 'text-green-600';
    return 'text-gray-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculer les statistiques pour la carte
  const statsCount = {
    total: filteredRapports.length,
    moyenneEvaluation: filteredRapports.length > 0 
      ? parseFloat((filteredRapports.reduce((acc, r) => acc + r.evaluation, 0) / filteredRapports.length).toFixed(1))
      : 0,
    progressionTermine: filteredRapports.filter(r => r.progression === 'Terminé').length,
    respectDelais: filteredRapports.filter(r => {
      const correction = r.correctionTemps;
      return correction === '0' || correction.startsWith('-');
    }).length
  };

  return (
    <div className="h-screen flex flex-col lg:pl-5 pt-20 lg:pt-6">
      {/* Header fixe */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                Rapports Personnels
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Suivi détaillé des cours et évaluation des formateurs
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {isLoading ? (
                <FilterSkeleton />
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                    <SelectTrigger className="w-full sm:w-[200px] bg-white">
                      <School className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filière" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les filières</SelectItem>
                      {filieres.map(filiere => (
                        <SelectItem key={filiere.id} value={filiere.id.toString()}>
                          {filiere.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedVague} onValueChange={setSelectedVague}>
                    <SelectTrigger className="w-full sm:w-[140px] bg-white">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Vague" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes vagues</SelectItem>
                      {allVagues.map(vague => (
                        <SelectItem key={vague.id} value={vague.id}>
                          {vague.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedFormateur} onValueChange={setSelectedFormateur}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white">
                      <UserCog className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Formateur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous formateurs</SelectItem>
                      {allFormateurs.map((formateur) => (
                        <SelectItem key={formateur.id} value={formateur.id}>
                          {formateur.nom}
                        </SelectItem>
                      ))}
                      {allFormateurs.length === 0 && (
                        <SelectItem value="none" disabled>
                          Aucun formateur disponible
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Dialog open={isNewRapportOpen} onOpenChange={setIsNewRapportOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Rapport
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                  <DialogHeader>
                    <DialogTitle>Créer un Nouveau Rapport</DialogTitle>
                    <DialogDescription>
                      Remplissez les informations du nouveau rapport de cours
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    {/* Sélection de la filière - CORRIGÉ */}
                    <div className="space-y-2">
                      <Label htmlFor="filiere">Filière *</Label>
                      <Select 
                        value={newRapport.filiereId} 
                        onValueChange={(value) => {
                          setNewRapport(prev => ({ 
                            ...prev, 
                            filiereId: value,
                            moduleId: '', // Reset les sélections dépendantes
                            formateurId: '',
                            vagueId: ''
                          }));
                        }}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Sélectionner une filière" />
                        </SelectTrigger>
                        <SelectContent>
                          {filieres.map(filiere => (
                            <SelectItem key={filiere.id} value={filiere.id.toString()}>
                              {filiere.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sélection du module - CORRIGÉ */}
                    <div className="space-y-2">
                      <Label htmlFor="module">Module *</Label>
                      <Select
                        value={newRapport.moduleId}
                        onValueChange={(value) => setNewRapport(prev => ({ 
                          ...prev, 
                          moduleId: value,
                          formateurId: '' // Reset formateur quand le module change
                        }))}
                        disabled={!newRapport.filiereId}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder={
                            !newRapport.filiereId 
                              ? "Sélectionnez d'abord une filière" 
                              : "Sélectionner un module"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {modulesForSelectedFiliere.map(module => (
                            <SelectItem key={module.id} value={module.id.toString()}>
                              {module.nom}
                            </SelectItem>
                          ))}
                          {modulesForSelectedFiliere.length === 0 && newRapport.filiereId && (
                            <SelectItem value="none" disabled>
                              Aucun module disponible dans cette filière
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sélection du formateur - CORRIGÉ */}
                    <div className="space-y-2">
                      <Label htmlFor="formateur">Formateur *</Label>
                      <Select 
                        value={newRapport.formateurId} 
                        onValueChange={(value) => setNewRapport(prev => ({ ...prev, formateurId: value }))}
                        disabled={!newRapport.moduleId}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder={
                            !newRapport.moduleId 
                              ? "Sélectionnez d'abord un module" 
                              : "Sélectionner un formateur"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {formateursForSelectedModule.map(formateur => (
                            <SelectItem key={formateur.id} value={formateur.id}>
                              {formateur.nom}
                            </SelectItem>
                          ))}
                          {formateursForSelectedModule.length === 0 && newRapport.moduleId && (
                            <SelectItem value="none" disabled>
                              Aucun formateur assigné à ce module
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {!newRapport.moduleId && (
                        <p className="text-sm text-gray-500">Veuillez d'abord sélectionner un module</p>
                      )}
                    </div>

                    {/* Sélection de la vague - CORRIGÉ */}
                    <div className="space-y-2">
                      <Label htmlFor="vague">Vague *</Label>
                      <Select 
                        value={newRapport.vagueId} 
                        onValueChange={(value) => setNewRapport(prev => ({ ...prev, vagueId: value }))}
                        disabled={!newRapport.filiereId}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder={
                            !newRapport.filiereId 
                              ? "Sélectionnez d'abord une filière" 
                              : "Sélectionner une vague"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {vaguesForSelectedFiliere.map(vague => (
                            <SelectItem key={vague.id} value={vague.id}>
                              {vague.nom}
                            </SelectItem>
                          ))}
                          {vaguesForSelectedFiliere.length === 0 && newRapport.filiereId && (
                            <SelectItem value="none" disabled>
                              Aucune vague disponible dans cette filière
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Date du cours *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newRapport.date}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, date: e.target.value }))}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="chapitre">Chapitre traité *</Label>
                      <Input
                        id="chapitre"
                        placeholder="Chapitre du cours"
                        value={newRapport.chapitre}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, chapitre: e.target.value }))}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="objectif">Objectif pédagogique *</Label>
                      <Textarea
                        id="objectif"
                        placeholder="Objectif principal du cours"
                        value={newRapport.objectif}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, objectif: e.target.value }))}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dureePlanifiee">Durée planifiée *</Label>
                      <Input
                        id="dureePlanifiee"
                        placeholder="Ex: 2h"
                        value={newRapport.dureePlanifiee}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, dureePlanifiee: e.target.value }))}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dureeReelle">Durée réelle *</Label>
                      <Input
                        id="dureeReelle"
                        placeholder="Ex: 2h15"
                        value={newRapport.dureeReelle}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, dureeReelle: e.target.value }))}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="progression">Progression</Label>
                      <Select 
                        value={newRapport.progression} 
                        onValueChange={(value) => setNewRapport(prev => ({ ...prev, progression: value as "Terminé" | "Partiel" | "Non terminé" }))}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Terminé">Terminé</SelectItem>
                          <SelectItem value="Partiel">Partiel</SelectItem>
                          <SelectItem value="Non terminé">Non terminé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="evaluation">Évaluation (1-5)</Label>
                      <Input
                        id="evaluation"
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={newRapport.evaluation}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, evaluation: parseFloat(e.target.value) }))}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="difficulte">Difficultés rencontrées</Label>
                      <Textarea
                        id="difficulte"
                        placeholder="Problèmes techniques ou pédagogiques rencontrés"
                        value={newRapport.difficulte}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, difficulte: e.target.value }))}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="commentaireProf">Commentaire du formateur</Label>
                      <Textarea
                        id="commentaireProf"
                        placeholder="Observations du formateur sur la séance"
                        value={newRapport.commentaireProf}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, commentaireProf: e.target.value }))}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="commentaireCenseur">Commentaire du censeur</Label>
                      <Textarea
                        id="commentaireCenseur"
                        placeholder="Vos observations et recommandations"
                        value={newRapport.commentaireCenseur}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, commentaireCenseur: e.target.value }))}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewRapportOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateRapport}>
                      Créer le rapport
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
          {/* Alertes d'erreur */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Erreur:</span>
                <span>{error}</span>
              </div>
              <button
                onClick={fetchData}
                className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* En-tête de la filière */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {isLoading ? (
                    <>
                      <Skeleton className="h-8 w-64 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </>
                  ) : (
                    <>
                      <CardTitle className="text-2xl text-gray-900">
                        {selectedFiliereData ? selectedFiliereData.nom : 'Toutes les filières'}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {selectedFiliereData 
                          ? `Formateurs: ${selectedFiliereData.tousLesFormateurs.map(f => f.nom).join(', ')}`
                          : 'Aperçu de toutes les filières'
                        }
                      </CardDescription>
                    </>
                  )}
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <>
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
                <StatsCardSkeleton />
              </>
            ) : (
              <>
                <Card className="bg-white border-gray-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Rapports</p>
                        <p className="text-2xl font-bold text-gray-900">{statsCount.total}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <BookOpen className="text-blue-600 text-xl" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Moyenne Évaluation</p>
                        <p className="text-2xl font-bold text-green-600">{statsCount.moyenneEvaluation}/5</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Download className="text-green-600 text-xl" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Progression Terminée</p>
                        <p className="text-2xl font-bold text-orange-600">{statsCount.progressionTermine}</p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <Clock className="text-orange-600 text-xl" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Respect Délais</p>
                        <p className="text-2xl font-bold text-purple-600">{statsCount.respectDelais}</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Filter className="text-purple-600 text-xl" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Graphiques de la filière */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading ? (
              <>
                <ChartSkeleton />
                <ChartSkeleton />
              </>
            ) : selectedStatsData.length > 0 ? (
              <>
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle>Progression par Filière</CardTitle>
                    <CardDescription>Avancement et respect des délais</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={selectedStatsData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="module" stroke="#666" />
                          <YAxis domain={[0, 100]} stroke="#666" />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="progression" name="Progression %" fill="#3b82f6" />
                          <Bar dataKey="respectDelais" name="Respect délais %" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle>Évaluation des Filières</CardTitle>
                    <CardDescription>Notes moyennes par filière</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={selectedStatsData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" domain={[0, 5]} stroke="#666" />
                          <YAxis 
                            type="category" 
                            dataKey="module" 
                            width={100} 
                            stroke="#666"
                            fontSize={12}
                          />
                          <Tooltip />
                          <Bar 
                            dataKey="evaluation" 
                            name="Évaluation /5" 
                            fill="#f59e0b" 
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="lg:col-span-2 text-center py-12 text-gray-500">
                <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium">Aucune donnée statistique disponible</p>
                <p className="text-sm mt-2">Les statistiques apparaîtront après la création de rapports</p>
              </div>
            )}
          </div>

          {/* Barre de recherche et statistiques des filtres */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-white border-gray-200 lg:col-span-2">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher un rapport par module, formateur ou chapitre..."
                    className="pl-10 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="text-center">
                    <Skeleton className="h-8 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-32 mx-auto" />
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{filteredRapports.length}</div>
                    <div className="text-sm text-gray-600">Rapport(s) trouvé(s)</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {selectedVague !== 'all' && `Vague: ${selectedVague}`}
                      {selectedFormateur !== 'all' && ` • Formateur: ${selectedFormateur}`}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rapports détaillés par cours */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Rapports de Cours
                {!isLoading && (
                  <Badge variant="secondary" className="ml-2">
                    {filteredRapports.length} rapport(s)
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Détail des séances avec suivi temps réel des formateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  <ReportSkeleton />
                  <ReportSkeleton />
                  <ReportSkeleton />
                </div>
              ) : filteredRapports.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-lg font-medium">Aucun rapport trouvé</p>
                  <p className="text-sm mt-2">
                    {rapports.length === 0 
                      ? "Aucun rapport n'a été créé pour le moment"
                      : "Aucun résultat pour les critères de recherche et filtres sélectionnés"
                    }
                  </p>
                  {rapports.length === 0 && (
                    <Button 
                      onClick={() => setIsNewRapportOpen(true)}
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Créer le premier rapport
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredRapports.map((rapport) => (
                    <div key={rapport.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:border-gray-300 transition-colors">
                      {/* En-tête du rapport */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{rapport.module}</h3>
                          <p className="text-sm text-gray-600">
                            {rapport.formateur} • {rapport.filiere} • {rapport.vague} • {formatDate(rapport.date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            rapport.evaluation >= 4.5 ? 'default' :
                            rapport.evaluation >= 4.0 ? 'default' :
                            rapport.evaluation >= 3.5 ? 'secondary' : 'destructive'
                          }>
                            {rapport.evaluation}/5
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRapport(rapport.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRapportToDelete(rapport.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Mode édition */}
                      {editingRapport === rapport.id && editRapportData && (
                        <div className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                          <h4 className="font-medium text-gray-900 mb-3">Modifier le rapport</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm">Évaluation</Label>
                              <Input 
                                type="number" 
                                step="0.1" 
                                min="1" 
                                max="5" 
                                value={editRapportData.evaluation || 0}
                                onChange={(e) => setEditRapportData(prev => prev ? {...prev, evaluation: parseFloat(e.target.value)} : null)}
                                className="bg-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Progression</Label>
                              <Select 
                                value={editRapportData.progression || 'Terminé'}
                                onValueChange={(value) => setEditRapportData(prev => prev ? {...prev, progression: value as "Terminé" | "Partiel" | "Non terminé"} : null)}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Terminé">Terminé</SelectItem>
                                  <SelectItem value="Partiel">Partiel</SelectItem>
                                  <SelectItem value="Non terminé">Non terminé</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label className="text-sm">Commentaire Censeur</Label>
                              <Textarea 
                                value={editRapportData.commentaireCenseur || ''}
                                onChange={(e) => setEditRapportData(prev => prev ? {...prev, commentaireCenseur: e.target.value} : null)}
                                className="bg-white"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label className="text-sm">Difficultés Rencontrées</Label>
                              <Textarea 
                                value={editRapportData.difficulte || ''}
                                onChange={(e) => setEditRapportData(prev => prev ? {...prev, difficulte: e.target.value} : null)}
                                className="bg-white"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button onClick={() => handleUpdateRapport(rapport.id)}>
                              Sauvegarder
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={handleCancelEdit}
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Informations du cours (affichage normal) */}
                      {editingRapport !== rapport.id && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
                            <div>
                              <span className="font-medium">Chapitre:</span>
                              <p className="text-gray-600">{rapport.chapitre}</p>
                            </div>
                            <div>
                              <span className="font-medium">Objectif:</span>
                              <p className="text-gray-600">{rapport.objectif}</p>
                            </div>
                            <div>
                              <span className="font-medium">Durée:</span>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">
                                  {rapport.dureeReelle} ({rapport.dureePlanifiee} prévu)
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={getCorrectionTempsColor(rapport.correctionTemps)}
                                >
                                  {rapport.correctionTemps}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <span className="font-medium">Progression:</span>
                              <Badge 
                                variant="outline"
                                className={
                                  rapport.progression === 'Terminé' ? 'text-green-600 border-green-600' :
                                  rapport.progression === 'Partiel' ? 'text-orange-600 border-orange-600' :
                                  'text-red-600 border-red-600'
                                }
                              >
                                {rapport.progression}
                              </Badge>
                            </div>
                          </div>

                          {/* Commentaires */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Commentaire Formateur</h4>
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-sm text-blue-800">{rapport.commentaireProf}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Commentaire Censeur</h4>
                              <div className="bg-green-50 p-3 rounded-lg">
                                <p className="text-sm text-green-800">{rapport.commentaireCenseur}</p>
                              </div>
                            </div>
                          </div>

                          {/* Difficultés rencontrées */}
                          {rapport.difficulte && (
                            <div className="mt-4">
                              <h4 className="font-medium text-gray-900 mb-2">Difficultés Rencontrées</h4>
                              <div className="bg-orange-50 p-3 rounded-lg">
                                <p className="text-sm text-orange-800">{rapport.difficulte}</p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section pour ajouter un nouveau commentaire général */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle>Commentaire Général sur la Filière</CardTitle>
              <CardDescription>
                Observations globales et recommandations pour {selectedFiliereData?.nom || 'les filières'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Ajouter vos observations générales sur la filière, les points forts, axes d'amélioration..."
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  className="min-h-[100px] bg-white"
                />
                <div className="flex justify-end">
                  <Button disabled={!commentaire.trim()}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Enregistrer le Commentaire
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modale de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => rapportToDelete && handleDeleteRapport(rapportToDelete)}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}