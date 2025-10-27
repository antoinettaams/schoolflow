// app/dashboard/absences/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Calendar, Clock, Users, BookOpen,
  AlertTriangle, CheckCircle, XCircle, Building,
  Download, Eye, FileText, Filter, ChevronDown,
  BarChart3, UserCheck, School
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  heureCours: string;
  filiere: string;
  vague: string;
}

interface Student {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  filiere: string;
  vague: string;
  absences: Absence[];
  totalHeuresAbsences: number;
  tauxAbsentéisme: number;
  statut: 'critique' | 'eleve' | 'bon';
}

export default function AbsencesPage() {
  const router = useRouter();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);

  // Filtres
  const [selectedFiliere, setSelectedFiliere] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedVague, setSelectedVague] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Données simulées des absences remplies par les professeurs
    const mockAbsences: Absence[] = [
      {
        id: 'a1',
        date: '2024-03-15',
        matiere: 'Programmation Java',
        module: 'Développement Web',
        professeur: 'Dr. Martin',
        duree: 2,
        type: 'justifiee',
        motif: 'Maladie',
        heureCours: '08:00-10:00',
        filiere: 'Informatique',
        vague: 'Vague Janvier 2024'
      },
      {
        id: 'a2',
        date: '2024-03-15',
        matiere: 'Base de données',
        module: 'Systèmes d information',
        professeur: 'Prof. Bernard',
        duree: 3,
        type: 'non_justifiee',
        heureCours: '10:30-13:30',
        filiere: 'Informatique',
        vague: 'Vague Janvier 2024'
      },
      {
        id: 'a3',
        date: '2024-03-14',
        matiere: 'Comptabilité générale',
        module: 'Finance d entreprise',
        professeur: 'Dr. Leroy',
        duree: 2,
        type: 'justifiee',
        motif: 'Rendez-vous médical',
        heureCours: '14:00-16:00',
        filiere: 'Gestion',
        vague: 'Vague Janvier 2024'
      },
      {
        id: 'a4',
        date: '2024-03-13',
        matiere: 'Marketing digital',
        module: 'Communication',
        professeur: 'Dr. Blanc',
        duree: 3,
        type: 'non_justifiee',
        heureCours: '09:00-12:00',
        filiere: 'Marketing',
        vague: 'Vague Mars 2024'
      },
      {
        id: 'a5',
        date: '2024-03-12',
        matiere: 'Algorithmique',
        module: 'Informatique fondamentale',
        professeur: 'Dr. Moreau',
        duree: 4,
        type: 'non_justifiee',
        heureCours: '08:00-12:00',
        filiere: 'Informatique',
        vague: 'Vague Janvier 2024'
      }
    ];

    // Données simulées des étudiants avec leurs absences
    const mockStudents: Student[] = [
      {
        id: 's1',
        nom: 'Dupont',
        prenom: 'Marie',
        email: 'marie.dupont@email.com',
        filiere: 'Informatique',
        vague: 'Vague Janvier 2024',
        totalHeuresAbsences: 12,
        tauxAbsentéisme: 8.5,
        statut: 'eleve',
        absences: [mockAbsences[0], mockAbsences[1]]
      },
      {
        id: 's2',
        nom: 'Martin',
        prenom: 'Pierre',
        email: 'pierre.martin@email.com',
        filiere: 'Informatique',
        vague: 'Vague Janvier 2024',
        totalHeuresAbsences: 25,
        tauxAbsentéisme: 18.2,
        statut: 'critique',
        absences: [mockAbsences[4]]
      },
      {
        id: 's3',
        nom: 'Bernard',
        prenom: 'Sophie',
        email: 'sophie.bernard@email.com',
        filiere: 'Gestion',
        vague: 'Vague Janvier 2024',
        totalHeuresAbsences: 5,
        tauxAbsentéisme: 3.2,
        statut: 'bon',
        absences: [mockAbsences[2]]
      },
      {
        id: 's4',
        nom: 'Dubois',
        prenom: 'Luc',
        email: 'luc.dubois@email.com',
        filiere: 'Marketing',
        vague: 'Vague Mars 2024',
        totalHeuresAbsences: 8,
        tauxAbsentéisme: 4.8,
        statut: 'bon',
        absences: [mockAbsences[3]]
      }
    ];

    setAbsences(mockAbsences);
    setStudents(mockStudents);
    setIsLoading(false);
  };

  // Obtenir les valeurs uniques pour les filtres
  const filieres = [...new Set(students.map(s => s.filiere))];
  const modules = [...new Set(absences.map(a => a.module))];
  const vagues = [...new Set(students.map(s => s.vague))];
  const dates = [...new Set(absences.map(a => a.date))].sort().reverse();

  // Filtrer les absences selon les critères
  const filteredAbsences = absences.filter(absence => {
    const matchesFiliere = selectedFiliere === 'all' || absence.filiere === selectedFiliere;
    const matchesModule = selectedModule === 'all' || absence.module === selectedModule;
    const matchesVague = selectedVague === 'all' || absence.vague === selectedVague;
    const matchesDate = selectedDate === 'all' || absence.date === selectedDate;
    
    return matchesFiliere && matchesModule && matchesVague && matchesDate;
  });

  // Filtrer les étudiants selon les critères
  const filteredStudents = students.filter(student => {
    const matchesFiliere = selectedFiliere === 'all' || student.filiere === selectedFiliere;
    const matchesVague = selectedVague === 'all' || student.vague === selectedVague;
    const matchesSearch = searchTerm === '' || 
      student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.prenom.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFiliere && matchesVague && matchesSearch;
  });

  // Statistiques globales
  const stats = {
    totalStudents: students.length,
    totalAbsences: absences.length,
    totalHeuresAbsences: absences.reduce((sum, a) => sum + a.duree, 0),
    studentsCritiques: students.filter(s => s.statut === 'critique').length,
    absencesJustifiees: absences.filter(a => a.type === 'justifiee').length,
    absencesNonJustifiees: absences.filter(a => a.type === 'non_justifiee').length
  };

  // Fonctions utilitaires
  const getStatutBadge = (statut: Student['statut']) => {
    const config = {
      critique: { variant: 'destructive' as const, text: 'Critique' },
      eleve: { variant: 'default' as const, text: 'Élevé' },
      bon: { variant: 'secondary' as const, text: 'Bon' }
    };
    const { variant, text } = config[statut];
    return <Badge variant={variant}>{text}</Badge>;
  };

  const getTypeAbsenceBadge = (type: Absence['type']) => {
    const config = {
      justifiee: { variant: 'secondary' as const, text: 'Justifiée', icon: CheckCircle },
      non_justifiee: { variant: 'destructive' as const, text: 'Non justifiée', icon: XCircle }
    };
    const { variant, text, icon: Icon } = config[type];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  const getTauxColor = (taux: number) => {
    if (taux > 15) return 'text-red-600';
    if (taux > 10) return 'text-orange-600';
    if (taux > 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données d'absences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ScrollArea className="h-screen">
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
          
          {/* Header avec Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                Tableau de Bord des Absences
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Vue consolidée des absences remplies par les professeurs
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exporter</span>
              </Button>
              <Button size="sm" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Rapport Complet</span>
              </Button>
            </div>
          </div>

          {/* Cartes de Statistiques en Grid Responsive */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-white border-l-4 border-l-blue-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Étudiants</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-orange-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Absences</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalAbsences}</p>
                    <p className="text-xs text-gray-500">{stats.totalHeuresAbsences}h total</p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FileText className="h-4 w-4 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-red-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cas Critiques</p>
                    <p className="text-2xl font-bold text-red-600">{stats.studentsCritiques}</p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-l-4 border-l-green-500">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taux Justification</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.totalAbsences > 0 ? Math.round((stats.absencesJustifiees / stats.totalAbsences) * 100) : 0}%
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtres Collapsibles */}
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <Card>
              <CardHeader className="pb-3">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-gray-600" />
                      <CardTitle className="text-lg">Filtres et Recherche</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {filteredStudents.length} étudiant(s)
                      </Badge>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </CollapsibleTrigger>
              </CardHeader>
              
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  {/* Filtres Principaux */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Filière</label>
                      <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes les filières" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les filières</SelectItem>
                          {filieres.map(filiere => (
                            <SelectItem key={filiere} value={filiere}>
                              {filiere}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Module</label>
                      <Select value={selectedModule} onValueChange={setSelectedModule}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tous les modules" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les modules</SelectItem>
                          {modules.map(module => (
                            <SelectItem key={module} value={module}>
                              {module}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Vague</label>
                      <Select value={selectedVague} onValueChange={setSelectedVague}>
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes les vagues" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les vagues</SelectItem>
                          {vagues.map(vague => (
                            <SelectItem key={vague} value={vague}>
                              {vague}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Date</label>
                      <Select value={selectedDate} onValueChange={setSelectedDate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes les dates" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les dates</SelectItem>
                          {dates.map(date => (
                            <SelectItem key={date} value={date}>
                              {formatDate(date)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Recherche */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Recherche par étudiant</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Nom ou prénom de l'étudiant..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Contenu Principal en Grid Responsive */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Colonne 1: Absences Récentes */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Carte Absences Récentes */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">Absences Récentes</CardTitle>
                    </div>
                    <Badge variant="outline">
                      {filteredAbsences.length} absence(s)
                    </Badge>
                  </div>
                  <CardDescription>
                    Dernières absences enregistrées par les professeurs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {filteredAbsences.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Aucune absence trouvée</p>
                          <p className="text-sm text-gray-400">Ajustez vos critères de filtrage</p>
                        </div>
                      ) : (
                        filteredAbsences.map((absence) => {
                          const student = students.find(s => s.absences.some(a => a.id === absence.id));
                          return (
                            <div key={absence.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">
                                      {student ? `${student.prenom} ${student.nom}` : 'Étudiant non trouvé'}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {absence.filiere}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {absence.matiere} • {absence.module}
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {absence.heureCours}
                                    </span>
                                    <span>{formatDate(absence.date)}</span>
                                    <span>{absence.professeur}</span>
                                  </div>
                                  {absence.motif && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      <span className="font-medium">Motif:</span> {absence.motif}
                                    </p>
                                  )}
                                </div>
                                <div className="ml-4">
                                  {getTypeAbsenceBadge(absence.type)}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Carte Liste des Étudiants */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg">Synthèse par Étudiant</CardTitle>
                    </div>
                    <Badge variant="outline">
                      {filteredStudents.length} étudiant(s)
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {filteredStudents.map((student) => {
                        const dernierAbsence = student.absences
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                        
                        return (
                          <div key={student.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {student.prenom} {student.nom}
                                  </span>
                                  {getStatutBadge(student.statut)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {student.email}
                                </div>
                                <div className="flex items-center gap-4 text-xs">
                                  <Badge variant="outline">{student.filiere}</Badge>
                                  <span>{student.vague}</span>
                                </div>
                                {dernierAbsence && (
                                  <div className="text-xs text-gray-500">
                                    Dernière absence: {formatDate(dernierAbsence.date)} - {dernierAbsence.matiere}
                                  </div>
                                )}
                              </div>
                              <div className="text-right space-y-1 ml-4">
                                <div className={`text-lg font-bold ${getTauxColor(student.tauxAbsentéisme)}`}>
                                  {student.tauxAbsentéisme}%
                                </div>
                                <div className="text-xs text-red-600">
                                  {student.totalHeuresAbsences}h
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/dashboard/absences/student/${student.id}`)}
                                  className="mt-2"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Colonne 2: Statistiques et Analyses */}
            <div className="space-y-6">
              
              {/* Carte Statistiques par Filière */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <School className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-lg">Par Filière</CardTitle>
                  </div>
                  <CardDescription>
                    Analyse comparative
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filieres.map(filiere => {
                      const studentsFiliere = students.filter(s => s.filiere === filiere);
                      const absencesFiliere = absences.filter(a => a.filiere === filiere);
                      const tauxMoyen = studentsFiliere.length > 0 
                        ? studentsFiliere.reduce((sum, s) => sum + s.tauxAbsentéisme, 0) / studentsFiliere.length 
                        : 0;
                      
                      return (
                        <div key={filiere} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{filiere}</span>
                            <span className={`text-sm font-bold ${getTauxColor(tauxMoyen)}`}>
                              {tauxMoyen.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                tauxMoyen > 15 ? 'bg-red-500' :
                                tauxMoyen > 10 ? 'bg-orange-500' :
                                tauxMoyen > 5 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(tauxMoyen * 5, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{studentsFiliere.length} étudiants</span>
                            <span>{absencesFiliere.length} absences</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Carte Répartition des Types */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    <CardTitle className="text-lg">Types d'Absences</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Justifiées</span>
                      </div>
                      <Badge variant="secondary">
                        {stats.absencesJustifiees}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Non justifiées</span>
                      </div>
                      <Badge variant="destructive">
                        {stats.absencesNonJustifiees}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Carte Actions Rapides */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Actions Rapides</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exporter les données
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Voir les cas critiques
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Générer un rapport
                    </Button>
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