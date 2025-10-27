// app/dashboard/finances/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ChevronDown, Plus, Download, Eye, 
  DollarSign, Users, Calendar, CreditCard, CheckCircle, 
  XCircle, Clock, AlertCircle, BarChart3, TrendingUp 
} from 'lucide-react';
import Link from 'next/link';

// Import des composants shadcn
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface Student {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  filiere: string;
  statutInscription: 'complete' | 'partielle' | 'en_attente';
  statutPaiement: 'paye' | 'partiel' | 'en_retard' | 'non_paye';
  montantInscription: number;
  montantScolarite: number;
  montantPaye: number;
  dernierPaiement?: string;
  dateInscription: string;
}

interface Vague {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  students: Student[];
}

interface PaymentStats {
  totalInscription: number;
  totalScolarite: number;
  totalPaye: number;
  totalRestant: number;
  tauxPaiement: number;
  studentsCount: number;
  completeInscriptions: number;
  paiementsEnRetard: number;
}

export default function FinancesPage() {
  const [vagues, setVagues] = useState<Vague[]>([]);
  const [selectedVague, setSelectedVague] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Charger les données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Données simulées
    const mockVagues: Vague[] = [
      {
        id: '1',
        name: 'Vague Janvier-Juin 2024',
        startDate: '2024-01-15',
        endDate: '2024-06-30',
        students: [
          {
            id: 's1',
            nom: 'Dupont',
            prenom: 'Marie',
            email: 'marie.dupont@email.com',
            filiere: 'Informatique',
            statutInscription: 'complete',
            statutPaiement: 'paye',
            montantInscription: 50000,
            montantScolarite: 300000,
            montantPaye: 350000,
            dernierPaiement: '2024-01-10',
            dateInscription: '2024-01-05'
          },
          {
            id: 's2',
            nom: 'Martin',
            prenom: 'Pierre',
            email: 'pierre.martin@email.com',
            filiere: 'Gestion',
            statutInscription: 'complete',
            statutPaiement: 'partiel',
            montantInscription: 50000,
            montantScolarite: 250000,
            montantPaye: 150000,
            dernierPaiement: '2024-01-15',
            dateInscription: '2024-01-08'
          },
          {
            id: 's3',
            nom: 'Bernard',
            prenom: 'Sophie',
            email: 'sophie.bernard@email.com',
            filiere: 'Marketing',
            statutInscription: 'partielle',
            statutPaiement: 'en_retard',
            montantInscription: 25000,
            montantScolarite: 200000,
            montantPaye: 50000,
            dateInscription: '2024-01-12'
          },
          {
            id: 's4',
            nom: 'Moreau',
            prenom: 'Thomas',
            email: 'thomas.moreau@email.com',
            filiere: 'Design',
            statutInscription: 'complete',
            statutPaiement: 'non_paye',
            montantInscription: 50000,
            montantScolarite: 280000,
            montantPaye: 0,
            dateInscription: '2024-01-18'
          }
        ]
      },
      {
        id: '2',
        name: 'Vague Septembre 2024',
        startDate: '2024-09-01',
        endDate: '2025-01-31',
        students: [
          {
            id: 's5',
            nom: 'Dubois',
            prenom: 'Luc',
            email: 'luc.dubois@email.com',
            filiere: 'Informatique',
            statutInscription: 'en_attente',
            statutPaiement: 'non_paye',
            montantInscription: 0,
            montantScolarite: 300000,
            montantPaye: 0,
            dateInscription: '2024-08-20'
          }
        ]
      }
    ];

    setVagues(mockVagues);
    setIsLoading(false);
  };

  // Calculer les statistiques
  const getStats = (students: Student[]): PaymentStats => {
    const totalInscription = students.reduce((sum, student) => sum + student.montantInscription, 0);
    const totalScolarite = students.reduce((sum, student) => sum + student.montantScolarite, 0);
    const totalPaye = students.reduce((sum, student) => sum + student.montantPaye, 0);
    const totalRestant = totalInscription + totalScolarite - totalPaye;
    const tauxPaiement = totalScolarite > 0 ? (totalPaye / (totalInscription + totalScolarite)) * 100 : 0;
    
    const completeInscriptions = students.filter(s => s.statutInscription === 'complete').length;
    const paiementsEnRetard = students.filter(s => s.statutPaiement === 'en_retard').length;

    return {
      totalInscription,
      totalScolarite,
      totalPaye,
      totalRestant,
      tauxPaiement,
      studentsCount: students.length,
      completeInscriptions,
      paiementsEnRetard
    };
  };

  // Filtrer les étudiants
  const filteredStudents = vagues.flatMap(vague => 
    vague.students.map(student => ({ ...student, vagueName: vague.name, vagueId: vague.id }))
  ).filter(student => {
    const matchesVague = selectedVague === 'all' || student.vagueId === selectedVague;
    const matchesSearch = searchTerm === '' || 
      student.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.filiere.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatut = selectedStatut === 'all' || student.statutPaiement === selectedStatut;
    
    return matchesVague && matchesSearch && matchesStatut;
  });

  const globalStats = getStats(filteredStudents);

  // Fonctions utilitaires
  const getStatusBadge = (statut: Student['statutPaiement']) => {
    const config = {
      paye: { variant: "default" as const, text: 'Payé', icon: CheckCircle },
      partiel: { variant: "secondary" as const, text: 'Partiel', icon: Clock },
      en_retard: { variant: "destructive" as const, text: 'En retard', icon: AlertCircle },
      non_paye: { variant: "outline" as const, text: 'Non payé', icon: XCircle }
    };
    
    const { variant, text, icon: Icon } = config[statut];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  const getInscriptionBadge = (statut: Student['statutInscription']) => {
    const config = {
      complete: { variant: "default" as const, text: 'Complète' },
      partielle: { variant: "secondary" as const, text: 'Partielle' },
      en_attente: { variant: "outline" as const, text: 'En attente' }
    };
    
    const { variant, text } = config[statut];
    return (
      <Badge variant={variant}>
        {text}
      </Badge>
    );
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Chargement des données financières...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      
      {/* Header fixe */}
      <header className="border-b p-4 sm:p-6 sticky top-0 z-10 shadow-sm flex-shrink-0 bg-background">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Gestion Financière
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Suivi des paiements et finances par vague - Vue Directeur
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

                  {/* Filtre statut paiement */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Statut paiement</label>
                    <Select value={selectedStatut} onValueChange={setSelectedStatut}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les statuts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="paye">Payé</SelectItem>
                        <SelectItem value="partiel">Partiel</SelectItem>
                        <SelectItem value="en_retard">En retard</SelectItem>
                        <SelectItem value="non_paye">Non payé</SelectItem>
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
                        <span className="text-muted-foreground">Solde dû:</span>
                        <span className="font-medium text-red-600">{formatMoney(globalStats.totalRestant)}</span>
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
      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
          
          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Perçu</p>
                    <p className="text-xl font-bold text-foreground">{formatMoney(globalStats.totalPaye)}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-full dark:bg-green-900">
                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {globalStats.tauxPaiement.toFixed(1)}% du total attendu
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Étudiants</p>
                    <p className="text-xl font-bold text-foreground">{globalStats.studentsCount}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-900">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {globalStats.completeInscriptions} inscriptions complètes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">En retard</p>
                    <p className="text-xl font-bold text-foreground">{globalStats.paiementsEnRetard}</p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-full dark:bg-red-900">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Paiements en attente
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Solde dû</p>
                    <p className="text-xl font-bold text-foreground">{formatMoney(globalStats.totalRestant)}</p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-full dark:bg-orange-900">
                    <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Montant restant à payer
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tableau des étudiants */}
          <Card>
            <CardHeader className="bg-muted/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg">
                  Détail des étudiants ({filteredStudents.length})
                </CardTitle>
                <CardDescription>
                  Solde total dû: <span className="font-semibold text-red-600">{formatMoney(globalStats.totalRestant)}</span>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Étudiant</TableHead>
                      <TableHead>Filière</TableHead>
                      <TableHead>Vague</TableHead>
                      <TableHead>Inscription</TableHead>
                      <TableHead>Paiement</TableHead>
                      <TableHead>Montants</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-muted-foreground">Aucun étudiant trouvé</p>
                          <p className="text-sm text-muted-foreground mt-1">Ajustez vos critères de recherche</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow key={student.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <div className="font-medium text-foreground">
                                {student.prenom} {student.nom}
                              </div>
                              <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                                {student.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-foreground">{student.filiere}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-foreground truncate max-w-[120px]">
                              {student.vagueName}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getInscriptionBadge(student.statutInscription)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(student.statutPaiement)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1 min-w-[140px]">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Insc:</span>
                                <span className="font-medium">{formatMoney(student.montantInscription)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Scol:</span>
                                <span className="font-medium">{formatMoney(student.montantScolarite)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Payé:</span>
                                <span className={`font-medium ${
                                  student.montantPaye === student.montantInscription + student.montantScolarite 
                                    ? 'text-green-600' 
                                    : 'text-orange-600'
                                }`}>
                                  {formatMoney(student.montantPaye)}
                                </span>
                              </div>
                              {student.montantPaye < student.montantInscription + student.montantScolarite && (
                                <div className="flex justify-between pt-1 border-t">
                                  <span className="text-muted-foreground text-xs">Reste:</span>
                                  <span className="font-medium text-red-600 text-xs">
                                    {formatMoney((student.montantInscription + student.montantScolarite) - student.montantPaye)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/dashboard/finances/student/${student.id}`}>
                                <Eye className="h-3 w-3" />
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

          {/* Résumé détaillé */}
          {filteredStudents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Résumé détaillé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <h4 className="font-medium text-foreground mb-3">Répartition par vague</h4>
                    <div className="space-y-2">
                      {vagues.map(vague => {
                        const count = filteredStudents.filter(s => s.vagueId === vague.id).length
                        if (count === 0) return null
                        return (
                          <div key={vague.id} className="flex justify-between items-center py-1">
                            <span className="text-muted-foreground truncate flex-1 mr-2">{vague.name}</span>
                            <Badge variant="secondary">
                              {count} étudiant{count > 1 ? 's' : ''}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-3">Statut des paiements</h4>
                    <div className="space-y-2">
                      {['paye', 'partiel', 'en_retard', 'non_paye'].map(statut => {
                        const count = filteredStudents.filter(s => s.statutPaiement === statut).length
                        if (count === 0) return null
                        return (
                          <div key={statut} className="flex justify-between items-center py-1">
                            <span className="text-muted-foreground capitalize">{statut.replace('_', ' ')}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-3">Synthèse financière</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total inscriptions:</span>
                        <span className="font-medium">{formatMoney(globalStats.totalInscription)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total scolarité:</span>
                        <span className="font-medium">{formatMoney(globalStats.totalScolarite)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-muted-foreground font-medium">Total attendu:</span>
                        <span className="font-bold">{formatMoney(globalStats.totalInscription + globalStats.totalScolarite)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total perçu:</span>
                        <span className="font-bold text-green-600">{formatMoney(globalStats.totalPaye)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}