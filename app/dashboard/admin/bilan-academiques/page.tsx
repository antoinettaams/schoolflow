// app/dashboard/notes/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, Filter, ChevronDown, Download, Eye, 
  BarChart3, TrendingUp, Award, Users, BookOpen,
  Star, Target, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';

// Import des composants shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface Student {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  filiere: string;
  vagueId: string;
  vagueName: string;
  moyenneGenerale: number;
  rang: number;
  statut: 'excellent' | 'tres_bien' | 'bien' | 'moyen' | 'insuffisant' | 'echec';
  notes: {
    matiere: string;
    note: number;
    coefficient: number;
    appreciation: string;
  }[];
  presence: number; // pourcentage
  dernierSemestre: string;
}

interface Vague {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface Filiere {
  id: string;
  name: string;
}

interface Stats {
  totalStudents: number;
  moyenneGenerale: number;
  meilleureMoyenne: number;
  tauxReussite: number;
  excellents: number;
  echecs: number;
}

export default function NotesPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [vagues, setVagues] = useState<Vague[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [selectedVague, setSelectedVague] = useState<string>('all');
  const [selectedFiliere, setSelectedFiliere] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Données simulées (identique à votre code original)
    const mockVagues: Vague[] = [
      { id: '1', name: 'Vague Janvier-Juin 2024', startDate: '2024-01-15', endDate: '2024-06-30' },
      { id: '2', name: 'Vague Septembre 2024', startDate: '2024-09-01', endDate: '2025-01-31' }
    ];

    const mockFilieres: Filiere[] = [
      { id: 'info', name: 'Informatique' },
      { id: 'gestion', name: 'Gestion' },
      { id: 'marketing', name: 'Marketing' },
      { id: 'design', name: 'Design' }
    ];

    const mockStudents: Student[] = [
      {
        id: 's1',
        nom: 'Dupont',
        prenom: 'Marie',
        email: 'marie.dupont@email.com',
        filiere: 'Informatique',
        vagueId: '1',
        vagueName: 'Vague Janvier-Juin 2024',
        moyenneGenerale: 16.5,
        rang: 1,
        statut: 'excellent',
        presence: 95,
        dernierSemestre: 'S2 2024',
        notes: [
          { matiere: 'Programmation', note: 18, coefficient: 4, appreciation: 'Excellent' },
          { matiere: 'Base de données', note: 17, coefficient: 3, appreciation: 'Très bien' },
          { matiere: 'Réseaux', note: 15, coefficient: 3, appreciation: 'Bien' }
        ]
      },
      {
        id: 's2',
        nom: 'Martin',
        prenom: 'Pierre',
        email: 'pierre.martin@email.com',
        filiere: 'Gestion',
        vagueId: '1',
        vagueName: 'Vague Janvier-Juin 2024',
        moyenneGenerale: 14.2,
        rang: 3,
        statut: 'bien',
        presence: 88,
        dernierSemestre: 'S2 2024',
        notes: [
          { matiere: 'Comptabilité', note: 15, coefficient: 4, appreciation: 'Bien' },
          { matiere: 'Management', note: 13, coefficient: 3, appreciation: 'Assez bien' },
          { matiere: 'Économie', note: 14.5, coefficient: 3, appreciation: 'Bien' }
        ]
      },
      {
        id: 's3',
        nom: 'Bernard',
        prenom: 'Sophie',
        email: 'sophie.bernard@email.com',
        filiere: 'Marketing',
        vagueId: '1',
        vagueName: 'Vague Janvier-Juin 2024',
        moyenneGenerale: 11.8,
        rang: 8,
        statut: 'moyen',
        presence: 92,
        dernierSemestre: 'S2 2024',
        notes: [
          { matiere: 'Communication', note: 12, coefficient: 4, appreciation: 'Passable' },
          { matiere: 'Étude de marché', note: 11.5, coefficient: 3, appreciation: 'Passable' },
          { matiere: 'Stratégie marketing', note: 12, coefficient: 3, appreciation: 'Passable' }
        ]
      },
      {
        id: 's4',
        nom: 'Moreau',
        prenom: 'Thomas',
        email: 'thomas.moreau@email.com',
        filiere: 'Design',
        vagueId: '1',
        vagueName: 'Vague Janvier-Juin 2024',
        moyenneGenerale: 9.5,
        rang: 12,
        statut: 'insuffisant',
        presence: 78,
        dernierSemestre: 'S2 2024',
        notes: [
          { matiere: 'Design graphique', note: 10, coefficient: 4, appreciation: 'Insuffisant' },
          { matiere: 'UI/UX', note: 9, coefficient: 3, appreciation: 'Insuffisant' },
          { matiere: 'Typographie', note: 9.5, coefficient: 3, appreciation: 'Insuffisant' }
        ]
      },
      {
        id: 's5',
        nom: 'Dubois',
        prenom: 'Luc',
        email: 'luc.dubois@email.com',
        filiere: 'Informatique',
        vagueId: '2',
        vagueName: 'Vague Septembre 2024',
        moyenneGenerale: 15.8,
        rang: 2,
        statut: 'tres_bien',
        presence: 96,
        dernierSemestre: 'S1 2024',
        notes: [
          { matiere: 'Algorithmique', note: 17, coefficient: 4, appreciation: 'Très bien' },
          { matiere: 'Web Development', note: 15.5, coefficient: 3, appreciation: 'Bien' },
          { matiere: 'Systèmes', note: 15, coefficient: 3, appreciation: 'Bien' }
        ]
      }
    ];

    setVagues(mockVagues);
    setFilieres(mockFilieres);
    setStudents(mockStudents);
    setIsLoading(false);
  };

  // Filtrer les étudiants
  const filteredStudents = students.filter(student => {
    const matchesVague = selectedVague === 'all' || student.vagueId === selectedVague;
    const matchesFiliere = selectedFiliere === 'all' || student.filiere === selectedFiliere;
    const matchesSearch = searchTerm === '' || 
      student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.filiere.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesVague && matchesFiliere && matchesSearch;
  });

  // Calculer les statistiques
  const stats: Stats = {
    totalStudents: filteredStudents.length,
    moyenneGenerale: filteredStudents.length > 0 
      ? filteredStudents.reduce((sum, student) => sum + student.moyenneGenerale, 0) / filteredStudents.length 
      : 0,
    meilleureMoyenne: filteredStudents.length > 0 
      ? Math.max(...filteredStudents.map(s => s.moyenneGenerale)) 
      : 0,
    tauxReussite: filteredStudents.length > 0 
      ? (filteredStudents.filter(s => s.moyenneGenerale >= 10).length / filteredStudents.length) * 100 
      : 0,
    excellents: filteredStudents.filter(s => s.statut === 'excellent').length,
    echecs: filteredStudents.filter(s => s.statut === 'echec').length
  };

  // Fonctions utilitaires
  const getStatusBadge = (statut: Student['statut']) => {
    const config = {
      excellent: { variant: "default" as const, text: 'Excellent', icon: Award },
      tres_bien: { variant: "success" as const, text: 'Très bien', icon: CheckCircle },
      bien: { variant: "secondary" as const, text: 'Bien', icon: Target },
      moyen: { variant: "outline" as const, text: 'Moyen', icon: Star },
      insuffisant: { variant: "destructive" as const, text: 'Insuffisant', icon: AlertCircle },
      echec: { variant: "destructive" as const, text: 'Échec', icon: XCircle }
    };
    
    const { variant, text, icon: Icon } = config[statut];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  const getRangBadge = (rang: number) => {
    if (rang === 1) return '🥇';
    if (rang === 2) return '🥈';
    if (rang === 3) return '🥉';
    return `#${rang}`;
  };

  const formatNote = (note: number) => {
    return note.toFixed(2);
  };

  const getNoteColor = (note: number) => {
    if (note >= 16) return 'text-purple-600';
    if (note >= 14) return 'text-green-600';
    if (note >= 12) return 'text-blue-600';
    if (note >= 10) return 'text-yellow-600';
    if (note >= 8) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPresenceColor = (presence: number) => {
    if (presence >= 90) return 'bg-green-600';
    if (presence >= 80) return 'bg-yellow-600';
    if (presence >= 70) return 'bg-orange-600';
    return 'bg-red-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Chargement des résultats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden lg:pl-5 pt-20 lg:pt-6">
      
      {/* Header fixe */}
      <header className="border-b p-4 sm:p-6 sticky top-0 z-10 shadow-sm flex-shrink-0 bg-background">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Résultats Académiques
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Suivi des performances et moyennes des étudiants
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Rechercher un étudiant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtres
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtres</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Sélection Vague */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vague</label>
                    <Select value={selectedVague} onValueChange={setSelectedVague}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les vagues" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les vagues</SelectItem>
                        {vagues.map(vague => (
                          <SelectItem key={vague.id} value={vague.id}>
                            {vague.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtre filière */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Filière</label>
                    <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les filières" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les filières</SelectItem>
                        {filieres.map(filiere => (
                          <SelectItem key={filiere.id} value={filiere.name}>
                            {filiere.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Statistiques rapides */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Aperçu</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Étudiants:</span>
                        <span className="font-medium">{filteredStudents.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Moyenne générale:</span>
                        <span className="font-medium text-primary">{formatNote(stats.moyenneGenerale)}/20</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </SheetContent>
            </Sheet>

            <Button className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>
      </header>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
          
          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Moyenne Générale</p>
                    <p className="text-xl font-bold text-foreground">{formatNote(stats.moyenneGenerale)}/20</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-900">
                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Sur {filteredStudents.length} étudiant(s)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taux de Réussite</p>
                    <p className="text-xl font-bold text-foreground">{stats.tauxReussite.toFixed(1)}%</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-full dark:bg-green-900">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {filteredStudents.filter(s => s.moyenneGenerale >= 10).length} réussite(s)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Meilleure Moyenne</p>
                    <p className="text-xl font-bold text-foreground">{formatNote(stats.meilleureMoyenne)}/20</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-full dark:bg-purple-900">
                    <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {stats.excellents} excellent(s)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taux de Présence</p>
                    <p className="text-xl font-bold text-foreground">
                      {filteredStudents.length > 0 
                        ? (filteredStudents.reduce((sum, student) => sum + student.presence, 0) / filteredStudents.length).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-full dark:bg-orange-900">
                    <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Moyenne de présence
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tableau des étudiants */}
          <Card>
            <CardHeader className="bg-muted/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg">
                  Classement des Étudiants ({filteredStudents.length})
                </CardTitle>
                <CardDescription>
                  Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rang</TableHead>
                      <TableHead>Étudiant</TableHead>
                      <TableHead>Filière</TableHead>
                      <TableHead>Vague</TableHead>
                      <TableHead>Moyenne</TableHead>
                      <TableHead>Présence</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-muted-foreground">Aucun étudiant trouvé</p>
                          <p className="text-sm text-muted-foreground mt-1">Ajustez vos critères de recherche</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents
                        .sort((a, b) => b.moyenneGenerale - a.moyenneGenerale)
                        .map((student, index) => (
                        <TableRow key={student.id} className="hover:bg-muted/50">
                          <TableCell className="font-bold">
                            {getRangBadge(index + 1)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {student.prenom} {student.nom}
                              </div>
                              <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                                {student.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{student.filiere}</TableCell>
                          <TableCell>
                            <div className="text-sm truncate max-w-[120px]">
                              {student.vagueName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`text-lg font-bold ${getNoteColor(student.moyenneGenerale)}`}>
                              {formatNote(student.moyenneGenerale)}
                              <span className="text-sm text-muted-foreground">/20</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[100px]">
                              <Progress 
                                value={student.presence} 
                                className="w-16 h-2"
                              />
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {student.presence}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(student.statut)}
                          </TableCell>
                          <TableCell>
                            <Button asChild variant="ghost" size="sm" className="flex items-center gap-1">
                              <Link href="/dashboard/admin/bilan-academiques/student/id">
                                <Eye className="h-4 w-4" />
                                Détails
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Graphiques et analyses */}
          {filteredStudents.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Répartition des statuts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Répartition des Résultats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['excellent', 'tres_bien', 'bien', 'moyen', 'insuffisant', 'echec'].map(statut => {
                      const count = filteredStudents.filter(s => s.statut === statut).length;
                      const percentage = (count / filteredStudents.length) * 100;
                      if (count === 0) return null;
                      
                      return (
                        <div key={statut} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground capitalize">
                            {statut.replace('_', ' ')}
                          </span>
                          <div className="flex items-center gap-3">
                            <Progress value={percentage} className="w-24 h-2" />
                            <span className="text-sm font-medium w-12">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Performance par filière */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance par Filière</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filieres.map(filiere => {
                      const studentsFiliere = filteredStudents.filter(s => s.filiere === filiere.name);
                      if (studentsFiliere.length === 0) return null;
                      
                      const moyenneFiliere = studentsFiliere.reduce((sum, s) => sum + s.moyenneGenerale, 0) / studentsFiliere.length;
                      
                      return (
                        <div key={filiere.id} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{filiere.name}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium">
                              {studentsFiliere.length} étudiant(s)
                            </span>
                            <span className={`text-sm font-bold ${getNoteColor(moyenneFiliere)}`}>
                              {formatNote(moyenneFiliere)}/20
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}