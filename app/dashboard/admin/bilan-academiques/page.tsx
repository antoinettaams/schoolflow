"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, Download, Eye, 
  BarChart3, TrendingUp, Award, Users, BookOpen,
  Star, Target, AlertCircle, CheckCircle, XCircle,
  RefreshCw
} from 'lucide-react'; 

// Import des composants shadcn
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// Interfaces
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
  presence: number;
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

interface ApiResponse {
  students: Student[];
  stats: Stats;
  vagues: Vague[];
  filieres: Filiere[];
}

export default function BilanAcademiquesPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [vagues, setVagues] = useState<Vague[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [selectedVague, setSelectedVague] = useState<string>('all');
  const [selectedFiliere, setSelectedFiliere] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Charger les données depuis l'API
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Chargement des données académiques...');
      
      const params = new URLSearchParams();
      if (selectedVague !== 'all') params.append('vague', selectedVague);
      if (selectedFiliere !== 'all') params.append('filiere', selectedFiliere);
      
      const response = await fetch(`/api/admin/bilan-academiques?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      setStudents(data.students);
      setVagues(data.vagues);
      setFilieres(data.filieres);
      
      console.log(`✅ ${data.students.length} étudiants chargés`);
      toast.success(`Données chargées: ${data.students.length} étudiants`);
      
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur de chargement des données';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedVague, selectedFiliere]);

  // Fonction d'export
  const handleExport = async () => {
    try {
      setIsExporting(true);
      toast.loading("Préparation de l'export...");

      const params = new URLSearchParams();
      if (selectedVague !== 'all') params.append('vague', selectedVague);
      if (selectedFiliere !== 'all') params.append('filiere', selectedFiliere);

      const response = await fetch(`/api/admin/bilan-academiques/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bilan-academique-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Export réalisé avec succès!');
      
    } catch (error) {
      console.error('❌ Erreur export:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setIsExporting(false);
      toast.dismiss();
    }
  };

  // Skeleton Components
  const StatsSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const TableSkeleton = () => (
    <Card>
      <CardHeader className="bg-muted/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* En-têtes du tableau */}
          <div className="grid grid-cols-8 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
          {/* Lignes du tableau */}
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-8 gap-4">
              {Array.from({ length: 8 }).map((_, cellIndex) => (
                <Skeleton key={cellIndex} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const FiltersSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex items-end">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );

  // Filtrer les étudiants par recherche
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.filiere.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Calculer les statistiques
  const stats: Stats = {
    totalStudents: filteredStudents.length,
    moyenneGenerale: filteredStudents.length > 0 
      ? Number((filteredStudents.reduce((sum, student) => sum + student.moyenneGenerale, 0) / filteredStudents.length).toFixed(2))
      : 0,
    meilleureMoyenne: filteredStudents.length > 0 
      ? Number(Math.max(...filteredStudents.map(s => s.moyenneGenerale)).toFixed(2))
      : 0,
    tauxReussite: filteredStudents.length > 0 
      ? Number((filteredStudents.filter(s => s.moyenneGenerale >= 10).length / filteredStudents.length * 100).toFixed(1))
      : 0,
    excellents: filteredStudents.filter(s => s.statut === 'excellent').length,
    echecs: filteredStudents.filter(s => s.statut === 'echec').length
  };

  // Fonctions utilitaires
  const getStatusBadge = (statut: Student['statut']) => {
    const config = {
      excellent: { variant: "default" as const, text: 'Excellent', icon: Award, color: 'bg-green-100 text-green-800 border-green-200' },
      tres_bien: { variant: "secondary" as const, text: 'Très bien', icon: CheckCircle, color: 'bg-blue-100 text-blue-800 border-blue-200' },
      bien: { variant: "outline" as const, text: 'Bien', icon: Target, color: 'bg-purple-100 text-purple-800 border-purple-200' },
      moyen: { variant: "outline" as const, text: 'Moyen', icon: Star, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      insuffisant: { variant: "destructive" as const, text: 'Insuffisant', icon: AlertCircle, color: 'bg-orange-100 text-orange-800 border-orange-200' },
      echec: { variant: "destructive" as const, text: 'Échec', icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200' }
    };
    
    const { text, icon: Icon, color } = config[statut];
    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  const getRangBadge = (rang: number) => {
    if (rang === 1) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">🥇 1er</Badge>;
    if (rang === 2) return <Badge className="bg-gray-100 text-gray-800 border-gray-200">🥈 2ème</Badge>;
    if (rang === 3) return <Badge className="bg-orange-100 text-orange-800 border-orange-200">🥉 3ème</Badge>;
    return <Badge variant="outline">#{rang}</Badge>;
  };

  const formatNote = (note: number) => {
    return note.toFixed(2);
  };

  const getNoteColor = (note: number) => {
    if (note >= 16) return 'text-green-600';
    if (note >= 14) return 'text-blue-600';
    if (note >= 12) return 'text-purple-600';
    if (note >= 10) return 'text-yellow-600';
    if (note >= 8) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPresenceColor = (presence: number) => {
    if (presence >= 90) return 'bg-green-500';
    if (presence >= 80) return 'bg-blue-500';
    if (presence >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (error && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Erreur de chargement</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadData} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
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
              Bilan Académique
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Tableau de bord des performances étudiantes
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
            <Button 
              onClick={handleExport} 
              disabled={isExporting || students.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Export...' : 'Exporter'}
            </Button>
          </div>
        </div>
      </header>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
          
          {/* Filtres */}
          {isLoading ? (
            <FiltersSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Sélecteur Vague */}
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

              {/* Sélecteur Filière */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Filière</label>
                <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les filières" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les filières</SelectItem>
                    {filieres.map(filiere => (
                      <SelectItem key={filiere.id} value={filiere.id}>
                        {filiere.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Espace vide pour l'alignement */}
              <div></div>

              {/* Bouton Actualiser */}
              <div className="flex items-end">
                <Button onClick={loadData} className="w-full flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Actualiser
                </Button>
              </div>
            </div>
          )}

          {/* Cartes de statistiques */}
          {isLoading ? (
            <StatsSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Moyenne Générale</p>
                      <p className="text-2xl font-bold text-foreground">{formatNote(stats.moyenneGenerale)}/20</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900">
                      <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Sur {stats.totalStudents} étudiant(s)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Taux de Réussite</p>
                      <p className="text-2xl font-bold text-foreground">{stats.tauxReussite}%</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full dark:bg-green-900">
                      <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.totalStudents - stats.echecs} réussite(s)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Meilleure Moyenne</p>
                      <p className="text-2xl font-bold text-foreground">{formatNote(stats.meilleureMoyenne)}/20</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full dark:bg-purple-900">
                      <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.excellents} excellent(s)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Échecs</p>
                      <p className="text-2xl font-bold text-foreground">{stats.echecs}</p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-full dark:bg-red-900">
                      <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Nécessitent un suivi
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tableau des étudiants */}
          {isLoading ? (
            <TableSkeleton />
          ) : (
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
                        <TableHead className="w-20">Rang</TableHead>
                        <TableHead>Étudiant</TableHead>
                        <TableHead>Filière</TableHead>
                        <TableHead>Vague</TableHead>
                        <TableHead className="w-32">Moyenne</TableHead>
                        <TableHead className="w-40">Présence</TableHead>
                        <TableHead className="w-32">Statut</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12">
                            <BookOpen className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                            <p className="text-muted-foreground text-lg font-medium">Aucun étudiant trouvé</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Ajustez vos critères de recherche ou de filtrage
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStudents.map((student) => (
                          <TableRow key={student.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell>
                              {getRangBadge(student.rang)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {student.prenom} {student.nom}
                                </div>
                                <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                  {student.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-gray-50">
                                {student.filiere}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground truncate max-w-[150px]">
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
                              <div className="flex items-center gap-3">
                                <div className="w-20">
                                  <Progress 
                                    value={student.presence} 
                                    className="h-2"
                                  />
                                </div>
                                <span className="text-sm font-medium whitespace-nowrap">
                                  {Math.round(student.presence)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(student.statut)}
                            </TableCell>
                            <TableCell>
                              <Button asChild variant="ghost" size="sm" className="flex items-center gap-1">
                                 <Link href={`/dashboard/admin/bilan-academiques/student/${student.id}`}>
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Détails</span>
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
          )}

          {/* Graphiques et analyses */}
          {!isLoading && filteredStudents.length > 0 && (
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
                            <span className="text-sm font-medium w-12">{count} ({percentage.toFixed(1)}%)</span>
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