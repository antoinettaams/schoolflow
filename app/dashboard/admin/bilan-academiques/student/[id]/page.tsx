"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, BookOpen, BarChart3, Target, Award, 
  TrendingUp, Users, Download,
  CheckCircle,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Matiere {
  id: string;
  nom: string;
  coefficient: number;
  note: number;
  appreciation: string;
  professeur: string;
  credit: number;
  statut: 'valide' | 'echec' | 'en_cours';
}

interface Filiere {
  id: string;
  nom: string;
  modules: {
    semestre: string;
    matieres: Matiere[];
    moyenneSemestre: number;
    creditsObtenus: number;
    creditsTotaux: number;
  }[];
}

interface Student {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  filiere: string;
  vagueName: string;
  moyenneGenerale: number;
  rang: number;
  presence: number;
  creditsObtenus: number;
  creditsTotaux: number;
  filiereDetails: Filiere;
}

// Composant Skeleton pour le chargement
const StudentDetailsSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <ScrollArea className="h-screen">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          
          {/* Header Skeleton */}
          <div className="flex flex-col">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="mt-4 h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Cartes de statistiques Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contenu principal Skeleton */}
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <div className="h-6 w-64 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Tabs Skeleton */}
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                
                {/* Tableau Skeleton */}
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>

                {/* Statistiques Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Graphique Skeleton */}
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3 animate-pulse"></div>
                    </div>
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default function StudentNotesDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSemestre, setSelectedSemestre] = useState<string>('S1');

 const loadStudentData = useCallback(async () => {
  try {
    setIsLoading(true);
    console.log('Chargement des données pour l\'étudiant ID:', params.id);
    
    // CORRECTION : Route dynamique [id] - sans "id/" supplémentaire
    const response = await fetch(`/api/admin/bilan-academiques/student/${params.id}`);
    
    console.log('Response status:', response.status);
    console.log('URL appelée:', `/api/admin/bilan-academiques/student/${params.id}`);
    
    if (!response.ok) {
      // Vérifier si c'est du HTML (404)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const text = await response.text();
        console.error('Page 404 reçue au lieu de JSON');
        throw new Error('Route API non trouvée - Vérifiez le chemin');
      }
      
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur ${response.status}`);
      } catch (e) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
    }
    
    const studentData = await response.json();
    console.log('✅ Données reçues avec succès');
    setStudent(studentData);
    
    if (studentData.filiereDetails?.modules?.[0]) {
      setSelectedSemestre(studentData.filiereDetails.modules[0].semestre);
    }
  } catch (error) {
    console.error('❌ Erreur lors du chargement des données:', error);
    setStudent(null);
  } finally {
    setIsLoading(false);
  }
}, [params.id]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  // Fonctions utilitaires
  const getNoteColor = (note: number) => {
    if (note >= 16) return 'text-purple-600';
    if (note >= 14) return 'text-green-600';
    if (note >= 12) return 'text-blue-600';
    if (note >= 10) return 'text-yellow-600';
    if (note >= 8) return 'text-orange-600';
    return 'text-red-600';
  };

  const getNoteBgColor = (note: number) => {
    if (note >= 16) return 'bg-purple-100';
    if (note >= 14) return 'bg-green-100';
    if (note >= 12) return 'bg-blue-100';
    if (note >= 10) return 'bg-yellow-100';
    if (note >= 8) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getStatusVariant = (statut: Matiere['statut']): "default" | "secondary" | "destructive" => {
    const config: Record<Matiere['statut'], "default" | "secondary" | "destructive"> = {
      valide: 'default',
      echec: 'destructive',
      en_cours: 'secondary'
    };
    return config[statut];
  };

  const getStatusText = (statut: Matiere['statut']): string => {
    const config: Record<Matiere['statut'], string> = {
      valide: 'Validé',
      echec: 'Échec',
      en_cours: 'En cours'
    };
    return config[statut];
  };

  const getAppreciationVariant = (appreciation: string): "default" | "secondary" | "destructive" | "outline" => {
    const config: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'Excellent': 'default',
      'Très bien': 'default',
      'Bien': 'secondary',
      'Assez bien': 'secondary',
      'Passable': 'outline',
      'Insuffisant': 'destructive'
    };
    return config[appreciation] || 'outline';
  };

  if (isLoading) {
    return <StudentDetailsSkeleton />;
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Étudiant non trouvé</h1>
          <Button onClick={() => router.back()}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <ScrollArea className="h-screen">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex flex-col">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex flex-col">
                <h1 className="text-3xl font-bold tracking-tight">
                  {student.prenom} {student.nom}
                </h1>
                <p className="text-gray-600">{student.email}</p>
              </div>
            </div>
            <Button className="mt-4 w-48">
              <Download className="h-4 w-4 mr-2" />
              Relevé de notes
            </Button>
          </div>

          {/* Cartes de statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Moyenne Générale</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getNoteColor(student.moyenneGenerale)}`}>
                  {student.moyenneGenerale.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  /20 - Rang #{student.rang}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Crédits</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {student.creditsObtenus}/{student.creditsTotaux}
                </div>
                <div className="mt-2">
                  <Progress value={(student.creditsObtenus / student.creditsTotaux) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Présence</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{student.presence}%</div>
                <p className="text-xs text-muted-foreground">
                  Taux de présence global
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Filière</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{student.filiere}</div>
                <p className="text-xs text-muted-foreground">
                  {student.vagueName}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contenu principal avec tabs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Résultats par Semestre</CardTitle>
                  <CardDescription>
                    Consultez les notes détaillées pour chaque semestre
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const currentIndex = student.filiereDetails.modules.findIndex(m => m.semestre === selectedSemestre);
                      const prevIndex = currentIndex > 0 ? currentIndex - 1 : student.filiereDetails.modules.length - 1;
                      setSelectedSemestre(student.filiereDetails.modules[prevIndex].semestre);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const currentIndex = student.filiereDetails.modules.findIndex(m => m.semestre === selectedSemestre);
                      const nextIndex = currentIndex < student.filiereDetails.modules.length - 1 ? currentIndex + 1 : 0;
                      setSelectedSemestre(student.filiereDetails.modules[nextIndex].semestre);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedSemestre} onValueChange={setSelectedSemestre}>
                <TabsList className="grid w-full grid-cols-2">
                  {student.filiereDetails.modules.map(module => (
                    <TabsTrigger key={module.semestre} value={module.semestre}>
                      {module.semestre}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {student.filiereDetails.modules.map(module => (
                  <TabsContent key={module.semestre} value={module.semestre}>
                    {/* En-tête du semestre */}
                    <div className="mb-6 p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">Semestre {module.semestre}</h3>
                          <p className="text-sm text-muted-foreground">
                            {module.matieres.length} matières - Moyenne: {module.moyenneSemestre.toFixed(2)}/20
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">Crédits</div>
                          <div className="text-lg font-bold">
                            {module.creditsObtenus}/{module.creditsTotaux}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tableau des matières */}
                    <ScrollArea className="h-[400px] rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Matière</TableHead>
                            <TableHead>Professeur</TableHead>
                            <TableHead>Coeff</TableHead>
                            <TableHead>Crédits</TableHead>
                            <TableHead>Note</TableHead>
                            <TableHead>Appréciation</TableHead>
                            <TableHead>Statut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {module.matieres.map((matiere) => (
                            <TableRow key={matiere.id}>
                              <TableCell className="font-medium">{matiere.nom}</TableCell>
                              <TableCell>{matiere.professeur}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{matiere.coefficient}</Badge>
                              </TableCell>
                              <TableCell>{matiere.credit}</TableCell>
                              <TableCell>
                                <div className={`flex items-center gap-2 ${getNoteColor(matiere.note)}`}>
                                  <div className={`w-3 h-3 rounded-full ${getNoteBgColor(matiere.note)}`}></div>
                                  <span className="font-bold">{matiere.note.toFixed(2)}/20</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getAppreciationVariant(matiere.appreciation)}>
                                  {matiere.appreciation}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusVariant(matiere.statut)}>
                                  {getStatusText(matiere.statut)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>

                    {/* Statistiques du semestre */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Matières Validées</CardTitle>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">
                            {module.matieres.filter(m => m.statut === 'valide').length}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            sur {module.matieres.length} matières
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Meilleure Note</CardTitle>
                          <Target className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-purple-600">
                            {Math.max(...module.matieres.map(m => m.note)).toFixed(2)}/20
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Performance maximale
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Taux de Réussite</CardTitle>
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-600">
                            {((module.matieres.filter(m => m.statut === 'valide').length / module.matieres.length) * 100).toFixed(0)}%
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Matières validées
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Graphique des performances */}
          <Card>
            <CardHeader>
              <CardTitle>Performance par Semestre</CardTitle>
              <CardDescription>
                Évolution des moyennes sur les différents semestres
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {student.filiereDetails.modules.map(module => {
                  const moyenne = module.moyenneSemestre;
                  return (
                    <div key={module.semestre} className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="font-medium w-20">{module.semestre}</span>
                        <div className="flex-1 bg-secondary rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${getNoteBgColor(moyenne)}`}
                            style={{ width: `${(moyenne / 20) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className={`font-bold ${getNoteColor(moyenne)} w-16 text-right`}>
                        {moyenne.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}