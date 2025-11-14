"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Mail, Phone, Euro, Trash2, FileDown, RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// Import des bibliothèques d'export
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  filiere: string;
  vague: string;
  dateInscription: string;
  statut: string;
  fraisInscription: number;
  fraisPayes: number;
  resteAPayer: number;
  dateNaissance?: string;
  createdBy: string;
  paiements: Array<{
    montant: number;
    datePaiement: string;
    modePaiement: string;
  }>;
}

interface ApiResponse {
  inscriptions: Eleve[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalInscriptions: number;
    totalPayes: number;
    totalEnAttente: number;
    totalPartiels: number;
    totalApprouves: number;
    totalRejetes: number;
    chiffreAffaires: number;
    montantTotalPaye: number;
    tauxPaiementComplet: number;
    tauxPaiementPartiel: number;
  };
  filtres?: {
    filieres: Array<{ id: string; nom: string }>;
    vagues: Array<{ id: string; nom: string }>;
  };
}

// Composant Skeleton pour le tableau
const TableSkeleton = () => {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-2">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-8 w-8 ml-auto" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

// Composant Skeleton pour les cartes de statistiques
const StatsSkeleton = () => {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export default function ListeElevesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState<string>("toutes");
  const [selectedVague, setSelectedVague] = useState<string>("toutes");
  const [selectedStatut, setSelectedStatut] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [filieres, setFilieres] = useState<Array<{id: string, nom: string}>>([]);
  const [vagues, setVagues] = useState<Array<{id: string, nom: string}>>([]);
  const [stats, setStats] = useState({
    totalInscriptions: 0,
    totalPayes: 0,
    totalEnAttente: 0,
    totalPartiels: 0,
    totalApprouves: 0,
    totalRejetes: 0,
    chiffreAffaires: 0,
    montantTotalPaye: 0,
    tauxPaiementComplet: 0,
    tauxPaiementPartiel: 0
  });

  // Charger les données depuis l'API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedFiliere !== 'toutes') params.append('filiere', selectedFiliere);
      if (selectedVague !== 'toutes') params.append('vague', selectedVague);
      if (selectedStatut !== 'all') params.append('statut', selectedStatut);

      const response = await fetch(`/api/secretaires/eleves?${params}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const data: ApiResponse = await response.json();
      setEleves(data.inscriptions);
      setStats(data.stats);
      
      // Mettre à jour les filtres avec les données de l'API
      if (data.filtres) {
        setFilieres(data.filtres.filieres);
        setVagues(data.filtres.vagues);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, selectedFiliere, selectedVague, selectedStatut]);

  const getInitials = (prenom: string, nom: string) => {
    return `${prenom[0]}${nom[0]}`.toUpperCase();
  };

  const getStatutBadge = (statut: string) => {
    const statutConfig = {
      'PAYE_COMPLET': { label: 'Payé complet', className: 'bg-green-100 text-green-800 border-green-200' },
      'PAYE_PARTIEL': { label: 'Payé partiel', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'EN_ATTENTE': { label: 'En attente', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'APPROUVE': { label: 'Approuvé', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      'REJETE': { label: 'Rejeté', className: 'bg-red-100 text-red-800 border-red-200' }
    };

    const config = statutConfig[statut as keyof typeof statutConfig] || { label: statut, className: 'bg-gray-100 text-gray-800 border-gray-200' };

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleSupprimerEleve = async (eleveId: string, eleveNom: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'apprenant ${eleveNom} ?`)) {
      return;
    }

    setIsDeleting(eleveId);
    try {
      const response = await fetch(`/api/secretaires/eleves?id=${eleveId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }

      toast.success(`Apprenant ${eleveNom} supprimé avec succès`);
      // Recharger les données
      await fetchData();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(null);
    }
  };

  // FONCTIONS D'EXPORT (garder les mêmes que dans votre code original)
  const exportToPDF = () => {
    // ... garder votre code d'export PDF existant
  };

  const exportToExcel = () => {
    // ... garder votre code d'export Excel existant
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 4000,
          },
        }}
      />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Liste des Apprenants</h1>
          <p className="text-gray-600 mt-2">
            Consultez et gérez les apprenants inscrits
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
  <Button 
    variant="outline" 
    onClick={fetchData}
    disabled={isLoading}
    className="w-full sm:w-auto justify-center"
  >
    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
    Actualiser
  </Button>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto justify-center">
        <FileDown className="w-4 h-4" />
        Exporter
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="bg-white w-48">
      <DropdownMenuItem 
        onClick={exportToPDF}
        className="flex items-center cursor-pointer"
      >
        <FileDown className="w-4 h-4 mr-2 text-red-500" />
        <span>Export PDF</span>
      </DropdownMenuItem>
      <DropdownMenuItem 
        onClick={exportToExcel}
        className="flex items-center cursor-pointer"
      >
        <FileDown className="w-4 h-4 mr-2 text-green-500" />
        <span>Export Excel</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Inscriptions</CardTitle>
                <Euro className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalInscriptions}</div>
                <p className="text-xs text-gray-600">Toutes inscriptions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paiements Validés</CardTitle>
                <Euro className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPayes}</div>
                <p className="text-xs text-gray-600">Inscriptions payées</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de Validation</CardTitle>
                <Euro className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.tauxPaiementComplet}%</div>
                <p className="text-xs text-gray-600">Des inscriptions sont validées</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
                <Euro className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.chiffreAffaires.toLocaleString('fr-FR')}</div>
                <p className="text-xs text-gray-600">FCFA</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>
            Filtrez les apprenants selon vos critères
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Rechercher un apprenant..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes les filières" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les filières</SelectItem>
                {filieres.map(filiere => (
                  <SelectItem key={filiere.id} value={filiere.id}>
                    {filiere.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedVague} onValueChange={setSelectedVague}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes les vagues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les vagues</SelectItem>
                {vagues.map(vague => (
                  <SelectItem key={vague.id} value={vague.id}>
                    {vague.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatut} onValueChange={setSelectedStatut}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="PAYE_COMPLET">Payé complet</SelectItem>
                <SelectItem value="PAYE_PARTIEL">Payé partiel</SelectItem>
                <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                <SelectItem value="APPROUVE">Approuvé</SelectItem>
                <SelectItem value="REJETE">Rejeté</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des élèves */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Apprenants</CardTitle>
          <CardDescription>
            {isLoading ? "Chargement..." : `${eleves.length} apprenant(s) trouvé(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Apprenant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Filière</TableHead>
                  <TableHead>Vague</TableHead>
                  <TableHead>Date d&apos;inscription</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : eleves.length > 0 ? (
                  eleves.map((eleve) => (
                    <TableRow key={eleve.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={`/avatars/${eleve.id}.jpg`} />
                            <AvatarFallback>
                              {getInitials(eleve.prenom, eleve.nom)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {eleve.prenom} {eleve.nom}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {eleve.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3" />
                            {eleve.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="w-3 h-3" />
                            {eleve.telephone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {eleve.filiere}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{eleve.vague}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(eleve.dateInscription).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {eleve.fraisInscription.toLocaleString('fr-FR')} FCFA
                      </TableCell>
                      <TableCell>
                        {getStatutBadge(eleve.statut)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleSupprimerEleve(eleve.id, `${eleve.prenom} ${eleve.nom}`)}
                          disabled={isDeleting === eleve.id}
                        >
                          <Trash2 className={`w-4 h-4 text-red-600 ${isDeleting === eleve.id ? 'opacity-50' : ''}`} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Aucun apprenant trouvé avec les critères sélectionnés
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}