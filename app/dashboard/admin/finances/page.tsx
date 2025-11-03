// app/dashboard/finances/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ChevronDown, Download, Eye, 
  DollarSign, Users, CreditCard, CheckCircle, 
  XCircle, Clock, AlertCircle 
} from 'lucide-react';
import Link from 'next/link';

// Import des composants shadcn
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
  const [showFilters, setShowFilters] = useState(false);

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
      <Badge variant={variant} className="flex items-center gap-1 text-xs">
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
      <Badge variant={variant} className="text-xs">
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

  // Types de statut pour les filtres
  const statutTypes = ["Tous", "paye", "partiel", "en_retard", "non_paye"];

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
    <div className="flex flex-col min-h-screen bg-background lg:pl-5 pt-20 lg:pt-6">
      
      {/* Header fixe */}
      <header className="border-b p-4 sm:p-6 sticky top-0 z-[100] shadow-sm bg-background">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground truncate">
              Gestion Financière
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base truncate">
              Suivi des paiements et finances par vague - Vue Directeur
            </p>
          </div>

          <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48 lg:w-64 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 flex-1 sm:flex-none"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden xs:inline">Filtres</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>

            <Button className="flex items-center gap-2 flex-1 sm:flex-none">
              <Download className="h-4 w-4" />
              <span className="hidden xs:inline">Exporter</span>
            </Button>
          </div>
        </div>

        {/* Filtres dépliants */}
        {showFilters && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Filtre par vague */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Filtrer par vague :</h4>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  <Badge
                    variant={selectedVague === 'all' ? "default" : "outline"}
                    className="cursor-pointer transition-colors text-xs"
                    onClick={() => setSelectedVague('all')}
                  >
                    Toutes
                  </Badge>
                  {vagues.map(vague => (
                    <Badge
                      key={vague.id}
                      variant={selectedVague === vague.id ? "default" : "outline"}
                      className="cursor-pointer transition-colors text-xs truncate max-w-[120px] sm:max-w-none"
                      onClick={() => setSelectedVague(vague.id)}
                    >
                      {vague.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Filtre par statut de paiement */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Statut de paiement :</h4>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {statutTypes.map(statut => (
                    <Badge
                      key={statut}
                      variant={selectedStatut === statut ? "default" : "outline"}
                      className="cursor-pointer transition-colors capitalize text-xs"
                      onClick={() => setSelectedStatut(statut)}
                    >
                      {statut === 'en_retard' ? 'En retard' : 
                       statut === 'non_paye' ? 'Non payé' : 
                       statut === 'partiel' ? 'Partiel' : 
                       statut === 'paye' ? 'Payé' : statut}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Statistiques rapides des filtres */}
            <div className="mt-3 pt-3 border-t">
              <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{filteredStudents.length} étudiant(s)</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{formatMoney(globalStats.totalPaye)} perçu(s)</span>
                </div>
                <div className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-red-600">{formatMoney(globalStats.totalRestant)} dû(s)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-auto">
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6 max-w-7xl mx-auto">
          
          {/* Cartes de statistiques */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            <Card className="min-w-0">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Perçu</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground truncate">{formatMoney(globalStats.totalPaye)}</p>
                  </div>
                  <div className="p-1 sm:p-2 bg-green-100 rounded-full dark:bg-green-900 flex-shrink-0 ml-2">
                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 sm:mt-2 truncate">
                  {globalStats.tauxPaiement.toFixed(1)}% du total
                </p>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Étudiants</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground truncate">{globalStats.studentsCount}</p>
                  </div>
                  <div className="p-1 sm:p-2 bg-blue-100 rounded-full dark:bg-blue-900 flex-shrink-0 ml-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 sm:mt-2 truncate">
                  {globalStats.completeInscriptions} complètes
                </p>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">En retard</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground truncate">{globalStats.paiementsEnRetard}</p>
                  </div>
                  <div className="p-1 sm:p-2 bg-red-100 rounded-full dark:bg-red-900 flex-shrink-0 ml-2">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 sm:mt-2 truncate">
                  Paiements en attente
                </p>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Solde dû</p>
                    <p className="text-lg sm:text-xl font-bold text-foreground truncate">{formatMoney(globalStats.totalRestant)}</p>
                  </div>
                  <div className="p-1 sm:p-2 bg-orange-100 rounded-full dark:bg-orange-900 flex-shrink-0 ml-2">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 sm:mt-2 truncate">
                  Restant à payer
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tableau des étudiants */}
          <Card>
            <CardHeader className="bg-muted/50 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-base sm:text-lg truncate">
                  Détail des étudiants ({filteredStudents.length})
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Solde dû: <span className="font-semibold text-red-600">{formatMoney(globalStats.totalRestant)}</span>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px] sm:w-[200px]">Étudiant</TableHead>
                        <TableHead className="w-[100px] sm:w-[120px]">Filière</TableHead>
                        <TableHead className="w-[120px] sm:w-[140px]">Vague</TableHead>
                        <TableHead className="w-[100px]">Inscription</TableHead>
                        <TableHead className="w-[100px]">Paiement</TableHead>
                        <TableHead className="w-[140px] sm:w-[160px]">Montants</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Users className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">Aucun étudiant trouvé</p>
                            <p className="text-xs text-muted-foreground mt-1">Ajustez vos critères de recherche</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStudents.map((student) => (
                          <TableRow key={student.id} className="hover:bg-muted/50">
                            <TableCell className="py-2">
                              <div className="min-w-0">
                                <div className="font-medium text-foreground text-sm truncate">
                                  {student.prenom} {student.nom}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {student.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs sm:text-sm text-foreground truncate">{student.filiere}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs sm:text-sm text-foreground truncate">
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
                              <div className="text-xs space-y-1 min-w-[120px]">
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
                                    <span className="text-muted-foreground text-[10px]">Reste:</span>
                                    <span className="font-medium text-red-600 text-[10px]">
                                      {formatMoney((student.montantInscription + student.montantScolarite) - student.montantPaye)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Link href="/dashboard/admin/finances/student/id">
                                  <Eye className="h-3 w-3" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Résumé détaillé */}
          {filteredStudents.length > 0 && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Résumé détaillé</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 text-sm">
                  <div>
                    <h4 className="font-medium text-foreground mb-2 sm:mb-3 text-sm sm:text-base">Répartition par vague</h4>
                    <div className="space-y-1 sm:space-y-2">
                      {vagues.map(vague => {
                        const count = filteredStudents.filter(s => s.vagueId === vague.id).length
                        if (count === 0) return null
                        return (
                          <div key={vague.id} className="flex justify-between items-center py-1">
                            <span className="text-muted-foreground truncate flex-1 mr-2 text-xs sm:text-sm">{vague.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {count} étudiant{count > 1 ? 's' : ''}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2 sm:mb-3 text-sm sm:text-base">Statut des paiements</h4>
                    <div className="space-y-1 sm:space-y-2">
                      {['paye', 'partiel', 'en_retard', 'non_paye'].map(statut => {
                        const count = filteredStudents.filter(s => s.statutPaiement === statut).length
                        if (count === 0) return null
                        return (
                          <div key={statut} className="flex justify-between items-center py-1">
                            <span className="text-muted-foreground capitalize text-xs sm:text-sm">{statut.replace('_', ' ')}</span>
                            <span className="font-medium text-xs sm:text-sm">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-2 sm:mb-3 text-sm sm:text-base">Synthèse financière</h4>
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-xs sm:text-sm">Total inscriptions:</span>
                        <span className="font-medium text-xs sm:text-sm">{formatMoney(globalStats.totalInscription)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-xs sm:text-sm">Total scolarité:</span>
                        <span className="font-medium text-xs sm:text-sm">{formatMoney(globalStats.totalScolarite)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-muted-foreground font-medium text-xs sm:text-sm">Total attendu:</span>
                        <span className="font-bold text-xs sm:text-sm">{formatMoney(globalStats.totalInscription + globalStats.totalScolarite)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-xs sm:text-sm">Total perçu:</span>
                        <span className="font-bold text-green-600 text-xs sm:text-sm">{formatMoney(globalStats.totalPaye)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}