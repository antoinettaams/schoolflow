// app/dashboard/absences/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { 
  Search, Calendar, CheckCircle, XCircle, 
  Download, FileText, Filter, ChevronDown,
  BarChart3, BookOpen, School, Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Absence {
  id: string;
  date: string;
  matiere: string;
  module: string;
  professeur: string;
  duree: number;
  type: 'justifiee' | 'non_justifiee';
  motif?: string;
  filiere: string;
  semestre: string;
  vague: string;
  etudiant: string;
  emailEtudiant: string;
}

export default function AbsencesPage() {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Filtres
  const [selectedFiliere, setSelectedFiliere] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedSemestre, setSelectedSemestre] = useState<string>('all');
  const [selectedVague, setSelectedVague] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Données simulées des absences avec semestres ET vagues
    const mockAbsences: Absence[] = [
      {
        id: 'a1',
        date: '2024-03-15',
        matiere: 'Programmation Java Avancée',
        module: 'Développement Web Fullstack',
        professeur: 'Dr. Martin',
        duree: 2,
        type: 'justifiee',
        motif: 'Certificat médical',
        filiere: 'Informatique',
        semestre: 'Semestre 1',
        vague: 'Vague Janvier 2024',
        etudiant: 'Marie Dupont',
        emailEtudiant: 'marie.dupont@email.com'
      },
      {
        id: 'a2',
        date: '2024-03-15',
        matiere: 'Base de données NoSQL',
        module: 'Systèmes d information Avancés',
        professeur: 'Prof. Bernard',
        duree: 3,
        type: 'non_justifiee',
        filiere: 'Informatique',
        semestre: 'Semestre 1',
        vague: 'Vague Janvier 2024',
        etudiant: 'Pierre Martin',
        emailEtudiant: 'pierre.martin@email.com'
      },
      {
        id: 'a3',
        date: '2024-03-14',
        matiere: 'Comptabilité analytique',
        module: 'Finance d entreprise',
        professeur: 'Dr. Leroy',
        duree: 2,
        type: 'justifiee',
        motif: 'Rendez-vous administratif',
        filiere: 'Gestion',
        semestre: 'Semestre 1',
        vague: 'Vague Janvier 2024',
        etudiant: 'Sophie Bernard',
        emailEtudiant: 'sophie.bernard@email.com'
      },
      {
        id: 'a4',
        date: '2024-03-13',
        matiere: 'Marketing digital SEO',
        module: 'Communication Digitale',
        professeur: 'Dr. Blanc',
        duree: 3,
        type: 'non_justifiee',
        filiere: 'Marketing',
        semestre: 'Semestre 2',
        vague: 'Vague Mars 2024',
        etudiant: 'Luc Dubois',
        emailEtudiant: 'luc.dubois@email.com'
      },
      {
        id: 'a5',
        date: '2024-03-12',
        matiere: 'Algorithmique avancée',
        module: 'Informatique Fondamentale',
        professeur: 'Dr. Moreau',
        duree: 4,
        type: 'non_justifiee',
        filiere: 'Informatique',
        semestre: 'Semestre 1',
        vague: 'Vague Janvier 2024',
        etudiant: 'Jean Petit',
        emailEtudiant: 'jean.petit@email.com'
      },
      {
        id: 'a6',
        date: '2024-03-11',
        matiere: 'Développement Mobile',
        module: 'Développement Web Fullstack',
        professeur: 'Dr. Martin',
        duree: 2,
        type: 'justifiee',
        motif: 'Problème de transport',
        filiere: 'Informatique',
        semestre: 'Semestre 2',
        vague: 'Vague Janvier 2024',
        etudiant: 'Alice Durand',
        emailEtudiant: 'alice.durand@email.com'
      },
      {
        id: 'a7',
        date: '2024-03-11',
        matiere: 'Gestion de projet',
        module: 'Management',
        professeur: 'Mme. Lambert',
        duree: 3,
        type: 'justifiee',
        motif: 'Congé exceptionnel',
        filiere: 'Gestion',
        semestre: 'Semestre 2',
        vague: 'Vague Janvier 2024',
        etudiant: 'Thomas Morel',
        emailEtudiant: 'thomas.morel@email.com'
      },
      {
        id: 'a8',
        date: '2024-01-20',
        matiere: 'Réseaux et Télécommunications',
        module: 'Infrastructure IT',
        professeur: 'Dr. Garcia',
        duree: 2,
        type: 'justifiee',
        motif: 'Rendez-vous médical',
        filiere: 'Informatique',
        semestre: 'Semestre 1',
        vague: 'Vague Septembre 2023',
        etudiant: 'Emma Laurent',
        emailEtudiant: 'emma.laurent@email.com'
      },
      {
        id: 'a9',
        date: '2024-02-10',
        matiere: 'Analyse Financière',
        module: 'Finance Avancée',
        professeur: 'Dr. Petit',
        duree: 3,
        type: 'non_justifiee',
        filiere: 'Gestion',
        semestre: 'Semestre 2',
        vague: 'Vague Mars 2024',
        etudiant: 'Nicolas Roy',
        emailEtudiant: 'nicolas.roy@email.com'
      }
    ];

    setAbsences(mockAbsences);
    setIsLoading(false);
  };

  // Obtenir les valeurs uniques pour les filtres
  const filieres = [...new Set(absences.map(a => a.filiere))];
  const modules = [...new Set(absences.map(a => a.module))];
  const semestres = [...new Set(absences.map(a => a.semestre))].sort();
  const vagues = [...new Set(absences.map(a => a.vague))].sort();

  // Filtrer les absences selon les critères
  const filteredAbsences = absences.filter(absence => {
    const matchesFiliere = selectedFiliere === 'all' || absence.filiere === selectedFiliere;
    const matchesModule = selectedModule === 'all' || absence.module === selectedModule;
    const matchesSemestre = selectedSemestre === 'all' || absence.semestre === selectedSemestre;
    const matchesVague = selectedVague === 'all' || absence.vague === selectedVague;
    const matchesSearch = searchTerm === '' || 
      absence.etudiant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      absence.matiere.toLowerCase().includes(searchTerm.toLowerCase()) ||
      absence.module.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFiliere && matchesModule && matchesSemestre && matchesVague && matchesSearch;
  });

  // Statistiques globales
  const stats = {
    totalAbsences: absences.length,
    totalHeuresAbsences: absences.reduce((sum, a) => sum + a.duree, 0),
    absencesJustifiees: absences.filter(a => a.type === 'justifiee').length,
    absencesNonJustifiees: absences.filter(a => a.type === 'non_justifiee').length,
    totalModules: modules.length,
    totalFilieres: filieres.length,
    totalSemestres: semestres.length,
    totalVagues: vagues.length
  };

  // Statistiques par semestre
  const statsParSemestre = semestres.map(semestre => {
    const absencesSemestre = absences.filter(a => a.semestre === semestre);
    const tauxJustification = absencesSemestre.length > 0 
      ? (absencesSemestre.filter(a => a.type === 'justifiee').length / absencesSemestre.length) * 100 
      : 0;
    
    return {
      semestre,
      totalAbsences: absencesSemestre.length,
      totalHeures: absencesSemestre.reduce((sum, a) => sum + a.duree, 0),
      tauxJustification: Math.round(tauxJustification),
      absencesJustifiees: absencesSemestre.filter(a => a.type === 'justifiee').length,
      absencesNonJustifiees: absencesSemestre.filter(a => a.type === 'non_justifiee').length
    };
  });

  // Statistiques par vague
  const statsParVague = vagues.map(vague => {
    const absencesVague = absences.filter(a => a.vague === vague);
    const tauxJustification = absencesVague.length > 0 
      ? (absencesVague.filter(a => a.type === 'justifiee').length / absencesVague.length) * 100 
      : 0;
    
    return {
      vague,
      totalAbsences: absencesVague.length,
      totalHeures: absencesVague.reduce((sum, a) => sum + a.duree, 0),
      tauxJustification: Math.round(tauxJustification),
      absencesJustifiees: absencesVague.filter(a => a.type === 'justifiee').length,
      absencesNonJustifiees: absencesVague.filter(a => a.type === 'non_justifiee').length
    };
  });

  // Fonctions utilitaires
  const getTypeAbsenceBadge = (type: Absence['type']) => {
    const config = {
      justifiee: { variant: 'secondary' as const, text: 'Justifiée', icon: CheckCircle },
      non_justifiee: { variant: 'destructive' as const, text: 'Non justifiée', icon: XCircle }
    };
    const { variant, text, icon: Icon } = config[type];
    return (
      <Badge variant={variant} className="flex items-center gap-1 text-xs">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const absencesParModule = modules.map(module => {
    const absencesModule = absences.filter(a => a.module === module);
    const tauxJustification = absencesModule.length > 0 
      ? (absencesModule.filter(a => a.type === 'justifiee').length / absencesModule.length) * 100 
      : 0;
    
    return {
      module,
      totalAbsences: absencesModule.length,
      tauxJustification: Math.round(tauxJustification),
      filiere: absencesModule[0]?.filiere || 'Non spécifiée',
      semestre: absencesModule[0]?.semestre || 'Non spécifié'
    };
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données d&apos;absences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-auto lg:pl-5 pt-20 lg:pt-6">
      <ScrollArea className="h-screen">
        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
          
          {/* Header avec Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                Tableau de Bord des Absences
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                Vue des absences par semestre et vagues
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button variant="outline" size="sm" className="flex items-center gap-2 text-xs sm:text-sm">
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Exporter</span>
              </Button>
              <Button size="sm" className="flex items-center gap-2 text-xs sm:text-sm">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Rapport</span>
              </Button>
            </div>
          </div>

          {/* Cartes de Statistiques */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            <Card className="bg-white border-l-4 border-l-blue-500">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Absences</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.totalAbsences}</p>
                    <p className="text-xs text-gray-500">{stats.totalHeuresAbsences}h total</p>
                  </div>
                  <div className="p-1 sm:p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-green-500">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Absences Justifiées</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{stats.absencesJustifiees}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalAbsences > 0 ? Math.round((stats.absencesJustifiees / stats.totalAbsences) * 100) : 0}%
                    </p>
                  </div>
                  <div className="p-1 sm:p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-red-500">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Absences Non Justifiées</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{stats.absencesNonJustifiees}</p>
                  </div>
                  <div className="p-1 sm:p-2 bg-red-100 rounded-lg">
                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-purple-500">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Modules</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600">{stats.totalModules}</p>
                    <p className="text-xs text-gray-500">{stats.totalFilieres} filières</p>
                  </div>
                  <div className="p-1 sm:p-2 bg-purple-100 rounded-lg">
                    <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-orange-500">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Semestres</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600">{stats.totalSemestres}</p>
                    <p className="text-xs text-gray-500">Actifs</p>
                  </div>
                  <div className="p-1 sm:p-2 bg-orange-100 rounded-lg">
                    <School className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-indigo-500">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Vagues</p>
                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-indigo-600">{stats.totalVagues}</p>
                    <p className="text-xs text-gray-500">Promotions</p>
                  </div>
                  <div className="p-1 sm:p-2 bg-indigo-100 rounded-lg">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtres Collapsibles */}
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <Card>
              <CardHeader className="pb-3 p-4 sm:p-6">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                      <CardTitle className="text-base sm:text-lg">Filtres des Absences</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs sm:text-sm">
                        {filteredAbsences.length} absence(s)
                      </Badge>
                      <ChevronDown className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CollapsibleTrigger>
              </CardHeader>
              
              <CollapsibleContent>
                <CardContent className="space-y-3 sm:space-y-4 pt-0 p-4 sm:p-6">
                  {/* Filtres Principaux */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">Filière</label>
                      <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                        <SelectTrigger className="text-xs sm:text-sm">
                          <SelectValue placeholder="Toutes les filières" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs sm:text-sm">Toutes les filières</SelectItem>
                          {filieres.map(filiere => (
                            <SelectItem key={filiere} value={filiere} className="text-xs sm:text-sm">
                              {filiere}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                          <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">Vague</label>
                      <Select value={selectedVague} onValueChange={setSelectedVague}>
                        <SelectTrigger className="text-xs sm:text-sm">
                          <SelectValue placeholder="Toutes les vagues" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs sm:text-sm">Toutes les vagues</SelectItem>
                          {vagues.map(vague => (
                            <SelectItem key={vague} value={vague} className="text-xs sm:text-sm">
                              {vague}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">Module</label>
                      <Select value={selectedModule} onValueChange={setSelectedModule}>
                        <SelectTrigger className="text-xs sm:text-sm">
                          <SelectValue placeholder="Tous les modules" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs sm:text-sm">Tous les modules</SelectItem>
                          {modules.map(module => (
                            <SelectItem key={module} value={module} className="text-xs sm:text-sm">
                              {module}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700">Semestre</label>
                      <Select value={selectedSemestre} onValueChange={setSelectedSemestre}>
                        <SelectTrigger className="text-xs sm:text-sm">
                          <SelectValue placeholder="Tous les semestres" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-xs sm:text-sm">Tous les semestres</SelectItem>
                          {semestres.map(semestre => (
                            <SelectItem key={semestre} value={semestre} className="text-xs sm:text-sm">
                              {semestre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Recherche */}
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-gray-700">Recherche</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
                      <Input
                        placeholder="Étudiant, matière ou module..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 sm:pl-10 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Contenu Principal en Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Colonne 1: Liste des Absences */}
            <div className="xl:col-span-2 space-y-4 sm:space-y-6">
              
              {/* Carte Liste des Absences */}
              <Card>
                <CardHeader className="pb-3 p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      <CardTitle className="text-base sm:text-lg">Liste des Absences</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      {filteredAbsences.length} absence(s)
                    </Badge>
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    Absences enregistrées par semestre et vagues
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <ScrollArea className="h-[500px] sm:h-[600px]">
                    <div className="space-y-3">
                      {filteredAbsences.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Aucune absence trouvée</p>
                          <p className="text-sm text-gray-400">Ajustez vos critères de filtrage</p>
                        </div>
                      ) : (
                        filteredAbsences.map((absence) => (
                          <div key={absence.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="space-y-2 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm truncate">
                                    {absence.etudiant}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {absence.filiere}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {absence.semestre}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {absence.vague}
                                  </Badge>
                                  {getTypeAbsenceBadge(absence.type)}
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {absence.matiere}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    Module: {absence.module}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Professeur: {absence.professeur}
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(absence.date)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Durée: {absence.duree}h
                                  </span>
                                </div>

                                {absence.motif && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    <span className="font-medium">Motif:</span> {absence.motif}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <div className={`text-sm font-bold ${
                                  absence.type === 'justifiee' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {absence.duree}h
                                </div>
                                <div className="text-xs text-gray-500">
                                  Absence
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Colonne 2: Statistiques et Analyses */}
            <div className="space-y-4 sm:space-y-6">
              
              {/* Carte Statistiques par Semestre */}
              <Card>
                <CardHeader className="pb-3 p-4 sm:p-6">
                  <div className="flex items-center gap-2">
                    <School className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                    <CardTitle className="text-base sm:text-lg">Par Semestre</CardTitle>
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    Répartition des absences par semestre
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-4">
                    {statsParSemestre.map((item) => (
                      <div key={item.semestre} className="space-y-3 p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {item.semestre}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.totalAbsences} absences • {item.totalHeures}h
                            </div>
                          </div>
                          <div className={`text-xs sm:text-sm font-bold ${
                            item.tauxJustification > 70 ? 'text-green-600' :
                            item.tauxJustification > 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {item.tauxJustification}%
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              item.tauxJustification > 70 ? 'bg-green-500' :
                              item.tauxJustification > 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${item.tauxJustification}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>✓ {item.absencesJustifiees} justifiées</span>
                          <span>✗ {item.absencesNonJustifiees} non justifiées</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Carte Statistiques par Vague */}
              <Card>
                <CardHeader className="pb-3 p-4 sm:p-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                    <CardTitle className="text-base sm:text-lg">Par Vague</CardTitle>
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    Performance des différentes promotions
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-4">
                    {statsParVague.map((item) => (
                      <div key={item.vague} className="space-y-3 p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {item.vague}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.totalAbsences} absences • {item.totalHeures}h
                            </div>
                          </div>
                          <div className={`text-xs sm:text-sm font-bold ${
                            item.tauxJustification > 70 ? 'text-green-600' :
                            item.tauxJustification > 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {item.tauxJustification}%
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              item.tauxJustification > 70 ? 'bg-green-500' :
                              item.tauxJustification > 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${item.tauxJustification}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>✓ {item.absencesJustifiees} justifiées</span>
                          <span>✗ {item.absencesNonJustifiees} non justifiées</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}