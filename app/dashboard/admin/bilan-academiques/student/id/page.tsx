// app/dashboard/notes/student/[id]/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, BookOpen, BarChart3, Target, Award, 
  TrendingUp, Clock, Users, FileText, Download,
  CheckCircle, XCircle, AlertCircle,
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

export default function StudentNotesDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSemestre, setSelectedSemestre] = useState<string>('S1');

  useEffect(() => {
    loadStudentData();
  }, [params.id]);

  const loadStudentData = () => {
    // Données simulées
    const mockStudent: Student = {
      id: params.id as string,
      nom: 'Dupont',
      prenom: 'Marie',
      email: 'marie.dupont@email.com',
      filiere: 'Informatique',
      vagueName: 'Vague Janvier-Juin 2024',
      moyenneGenerale: 16.5,
      rang: 1,
      presence: 95,
      creditsObtenus: 45,
      creditsTotaux: 60,
      filiereDetails: {
        id: 'info',
        nom: 'Informatique',
        modules: [
          {
            semestre: 'S1',
            matieres: [
              {
                id: 'm1',
                nom: 'Algorithmique et Programmation',
                coefficient: 4,
                note: 18,
                appreciation: 'Excellent',
                professeur: 'Dr. Martin',
                credit: 6,
                statut: 'valide'
              },
              {
                id: 'm2',
                nom: 'Base de Données',
                coefficient: 3,
                note: 17,
                appreciation: 'Très bien',
                professeur: 'Prof. Bernard',
                credit: 4,
                statut: 'valide'
              },
              {
                id: 'm3',
                nom: 'Mathématiques pour l\'Informatique',
                coefficient: 3,
                note: 15,
                appreciation: 'Bien',
                professeur: 'Dr. Moreau',
                credit: 5,
                statut: 'valide'
              },
              {
                id: 'm4',
                nom: 'Systèmes d\'Exploitation',
                coefficient: 2,
                note: 16,
                appreciation: 'Très bien',
                professeur: 'Prof. Dubois',
                credit: 3,
                statut: 'valide'
              },
              {
                id: 'm5',
                nom: 'Architecture des Ordinateurs',
                coefficient: 2,
                note: 14,
                appreciation: 'Assez bien',
                professeur: 'Prof. Leroy',
                credit: 3,
                statut: 'valide'
              }
            ]
          },
          {
            semestre: 'S2',
            matieres: [
              {
                id: 'm6',
                nom: 'Développement Web',
                coefficient: 4,
                note: 17.5,
                appreciation: 'Très bien',
                professeur: 'Dr. Laurent',
                credit: 6,
                statut: 'valide'
              },
              {
                id: 'm7',
                nom: 'Réseaux et Télécommunications',
                coefficient: 3,
                note: 15,
                appreciation: 'Bien',
                professeur: 'Prof. Girard',
                credit: 4,
                statut: 'valide'
              },
              {
                id: 'm8',
                nom: 'Intelligence Artificielle',
                coefficient: 3,
                note: 16,
                appreciation: 'Très bien',
                professeur: 'Dr. Petit',
                credit: 5,
                statut: 'valide'
              },
              {
                id: 'm9',
                nom: 'Gestion de Projet Informatique',
                coefficient: 2,
                note: 14,
                appreciation: 'Assez bien',
                professeur: 'Prof. Roux',
                credit: 3,
                statut: 'valide'
              },
              {
                id: 'm10',
                nom: 'Sécurité Informatique',
                coefficient: 2,
                note: 13,
                appreciation: 'Assez bien',
                professeur: 'Dr. Blanc',
                credit: 3,
                statut: 'valide'
              }
            ]
          }
        ]
      }
    };

    setStudent(mockStudent);
    setIsLoading(false);
  };

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

  const getStatusVariant = (statut: Matiere['statut']) => {
    const config = {
      valide: 'default',
      echec: 'destructive',
      en_cours: 'secondary'
    };
    return config[statut];
  };

  const getStatusText = (statut: Matiere['statut']) => {
    const config = {
      valide: 'Validé',
      echec: 'Échec',
      en_cours: 'En cours'
    };
    return config[statut];
  };

  const getAppreciationVariant = (appreciation: string) => {
    const config: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      'Excellent': 'default',
      'Très bien': 'default',
      'Bien': 'secondary',
      'Assez bien': 'secondary',
      'Passable': 'outline',
      'Insuffisant': 'destructive'
    };
    return config[appreciation] || 'outline';
  };

  const calculateMoyenneSemestre = (semestre: string) => {
    if (!student) return 0;
    const semestreData = student.filiereDetails.modules.find(m => m.semestre === semestre);
    if (!semestreData) return 0;

    const totalNotes = semestreData.matieres.reduce((sum, matiere) => sum + (matiere.note * matiere.coefficient), 0);
    const totalCoefficients = semestreData.matieres.reduce((sum, matiere) => sum + matiere.coefficient, 0);
    
    return totalCoefficients > 0 ? totalNotes / totalCoefficients : 0;
  };

  const calculateCreditsSemestre = (semestre: string) => {
    if (!student) return { obtenus: 0, totaux: 0 };
    const semestreData = student.filiereDetails.modules.find(m => m.semestre === semestre);
    if (!semestreData) return { obtenus: 0, totaux: 0 };

    const obtenus = semestreData.matieres
      .filter(m => m.statut === 'valide')
      .reduce((sum, matiere) => sum + matiere.credit, 0);
    
    const totaux = semestreData.matieres.reduce((sum, matiere) => sum + matiere.credit, 0);

    return { obtenus, totaux };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des détails académiques...</p>
        </div>
      </div>
    );
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

  const currentSemestre = student.filiereDetails.modules.find(m => m.semestre === selectedSemestre);
  const moyenneSemestre = calculateMoyenneSemestre(selectedSemestre);
  const creditsSemestre = calculateCreditsSemestre(selectedSemestre);

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <ScrollArea className="h-screen">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {student.prenom} {student.nom}
                </h1>
                <p className="text-muted-foreground">
                  Détails académiques et notes par matière - {student.filiere}
                </p>
              </div>
            </div>
            <Button>
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
                            {module.matieres.length} matières - Moyenne: {calculateMoyenneSemestre(module.semestre).toFixed(2)}/20
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">Crédits</div>
                          <div className="text-lg font-bold">
                            {calculateCreditsSemestre(module.semestre).obtenus}/
                            {calculateCreditsSemestre(module.semestre).totaux}
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
                                  <span className="font-bold">{matiere.note}/20</span>
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
                            {Math.max(...module.matieres.map(m => m.note))}/20
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
                  const moyenne = calculateMoyenneSemestre(module.semestre);
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