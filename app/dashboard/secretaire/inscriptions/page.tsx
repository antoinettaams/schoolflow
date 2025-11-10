"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MoreHorizontal, UserPlus, Euro, Settings, Loader2, Users, Calendar, Mail, Phone } from "lucide-react";

interface Inscription {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateInscription: string;
  dateNaissance?: string;
  statut: "en_attente" | "approuve" | "rejete" | "paye_partiel" | "paye_complet";
  fraisInscription: number;
  fraisPayes: number;
  filiere: string;
  vague: string;
  filiereId?: number;
  vagueId?: string;
}

interface Filiere {
  value: string;
  label: string;
}

interface Vague {
  value: string;
  label: string;
}

interface Statistiques {
  totalInscriptions: number;
  enAttente: number;
  approuvees: number;
  payeComplet: number;
  totalFraisCollectes: number;
  totalFraisEnAttente: number;
}

// Composant Skeleton pour les cartes de statistiques
const StatsSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-4 mb-6">
    {[...Array(4)].map((_, index) => (
      <Card key={index}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-16 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// Composant Skeleton pour les lignes du tableau
const TableRowSkeleton = () => (
  <>
    {[...Array(5)].map((_, index) => (
      <TableRow key={index}>
        <TableCell>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-24" />
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-6 w-20 rounded-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-6 w-16 rounded-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-16" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-14" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-14" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-6 w-20 rounded-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-8 rounded-md ml-auto" />
        </TableCell>
      </TableRow>
    ))}
  </>
);

// Composant Skeleton pour les filtres
const FiltersSkeleton = () => (
  <Card className="mb-6">
    <CardHeader>
      <Skeleton className="h-5 w-32 mb-2" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>
    </CardContent>
  </Card>
);

// Composant Skeleton pour le header
const HeaderSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-48" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-44" />
      </div>
    </div>
  </div>
);

export default function InscriptionsPage() { 
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState<string>("toutes");
  const [selectedVague, setSelectedVague] = useState<string>("toutes");
  const [selectedStatut, setSelectedStatut] = useState<string>("toutes");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isPaiementDialogOpen, setIsPaiementDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedInscription, setSelectedInscription] = useState<Inscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [fraisInscription, setFraisInscription] = useState<number>(15000);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [vagues, setVagues] = useState<Vague[]>([]);
  const [statistiques, setStatistiques] = useState<Statistiques>({
    totalInscriptions: 0,
    enAttente: 0,
    approuvees: 0,
    payeComplet: 0,
    totalFraisCollectes: 0,
    totalFraisEnAttente: 0
  });

  const [nouvelleInscription, setNouvelleInscription] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    dateNaissance: "",
    filiere: "",
    vague: ""
  });

  const [paiementData, setPaiementData] = useState({
    montant: 0,
    modePaiement: "",
    reference: ""
  });

  // Charger les données depuis l'API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedFiliere !== 'toutes') params.append('filiereId', selectedFiliere);
      if (selectedVague !== 'toutes') params.append('vagueId', selectedVague);
      if (selectedStatut !== 'toutes') params.append('statut', selectedStatut);

      console.log('🔄 Chargement des données...');
      const response = await fetch(`/api/secretaires/inscriptions?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur HTTP:', response.status, errorText);
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Données reçues:', data);
      
      setInscriptions(data.inscriptions || []);
      setFilieres(data.filieres || []);
      setVagues(data.vagues || []);
      setStatistiques(data.statistiques || {
        totalInscriptions: 0,
        enAttente: 0,
        approuvees: 0,
        payeComplet: 0,
        totalFraisCollectes: 0,
        totalFraisEnAttente: 0
      });
      setFraisInscription(data.fraisInscription || 15000);
      
    } catch (err) {
      console.error('💥 Erreur chargement données:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors du chargement des données');
      
      // Données par défaut en cas d'erreur
      setInscriptions([]);
      setFilieres([]);
      setVagues([]);
      setStatistiques({
        totalInscriptions: 0,
        enAttente: 0,
        approuvees: 0,
        payeComplet: 0,
        totalFraisCollectes: 0,
        totalFraisEnAttente: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, selectedFiliere, selectedVague, selectedStatut]);

  const getStatutBadge = (statut: string) => {
    const config = {
      en_attente: { variant: "secondary" as const, text: "En attente", color: "text-yellow-800 bg-yellow-100" },
      approuve: { variant: "default" as const, text: "Approuvé", color: "text-blue-800 bg-blue-100" },
      rejete: { variant: "destructive" as const, text: "Rejeté", color: "text-red-800 bg-red-100" },
      paye_partiel: { variant: "outline" as const, text: "Payé partiel", color: "text-orange-800 bg-orange-100" },
      paye_complet: { variant: "default" as const, text: "Payé complet", color: "text-green-800 bg-green-100" }
    };
    
    const { variant, text, color } = config[statut as keyof typeof config] || config.en_attente;
    
    return (
      <Badge variant={variant} className={color}>
        {text}
      </Badge>
    );
  };

  const handleNouvelleInscription = async () => {
    try {
      setActionLoading(true);
      
      const response = await fetch('/api/secretaires/inscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'CREATE_INSCRIPTION',
          data: {
            nom: nouvelleInscription.nom,
            prenom: nouvelleInscription.prenom,
            email: nouvelleInscription.email,
            telephone: nouvelleInscription.telephone,
            dateNaissance: nouvelleInscription.dateNaissance,
            filiereId: nouvelleInscription.filiere,
            vagueId: nouvelleInscription.vague
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création');
      }

      // Recharger les données
      await fetchData();
      setIsDialogOpen(false);
      
      // Reset du formulaire
      setNouvelleInscription({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        dateNaissance: "",
        filiere: "",
        vague: ""
      });

      alert('Inscription créée avec succès!');
    } catch (error) {
      console.error('Erreur création inscription:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la création');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateFrais = async () => {
    try {
      setActionLoading(true);
      
      const response = await fetch('/api/secretaires/inscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'UPDATE_FRAIS',
          data: {
            montant: fraisInscription
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la mise à jour');
      }

      setFraisInscription(result.fraisInscription || 15000);
      setIsConfigDialogOpen(false);
      alert('Frais mis à jour avec succès!');
    } catch (error) {
      console.error('Erreur mise à jour frais:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la mise à jour des frais');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatut = async (inscriptionId: string, nouveauStatut: string) => {
    try {
      const response = await fetch('/api/secretaires/inscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'UPDATE_STATUT',
          data: {
            id: inscriptionId,
            statut: nouveauStatut
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la mise à jour');
      }

      // Recharger les données
      await fetchData();
      alert('Statut mis à jour avec succès!');
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la mise à jour du statut');
    }
  };

  const handleCreatePaiement = async () => {
    if (!selectedInscription) return;

    try {
      setActionLoading(true);
      
      const response = await fetch('/api/secretaires/inscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'CREATE_PAIEMENT',
          data: {
            inscriptionId: selectedInscription.id,
            montant: paiementData.montant,
            modePaiement: paiementData.modePaiement,
            reference: paiementData.reference
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'enregistrement');
      }

      // Recharger les données
      await fetchData();
      setIsPaiementDialogOpen(false);
      setSelectedInscription(null);
      setPaiementData({ montant: 0, modePaiement: "", reference: "" });
      
      alert('Paiement enregistré avec succès!');
    } catch (error) {
      console.error('Erreur création paiement:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement du paiement');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteInscription = async (inscriptionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette inscription ?')) {
      return;
    }

    try {
      const response = await fetch('/api/secretaires/inscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'DELETE_INSCRIPTION',
          data: {
            id: inscriptionId
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }

      // Recharger les données
      await fetchData();
      alert('Inscription supprimée avec succès!');
    } catch (error) {
      console.error('Erreur suppression inscription:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    }
  };

  const openPaiementDialog = (inscription: Inscription) => {
    setSelectedInscription(inscription);
    setPaiementData({
      montant: inscription.fraisInscription - inscription.fraisPayes,
      modePaiement: "",
      reference: ""
    });
    setIsPaiementDialogOpen(true);
  };

  // Fonctions sécurisées pour l'affichage
  const safeToLocaleString = (value: number | undefined | null): string => {
    return (value || 0).toLocaleString('fr-FR');
  };

  const safeDateDisplay = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return 'Date invalide';
    }
  };

  const getResteAPayer = (inscription: Inscription) => {
    return inscription.fraisInscription - inscription.fraisPayes;
  };

  if (error && inscriptions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="text-red-600 text-lg font-semibold mb-2">Erreur de chargement</div>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={fetchData} className="bg-red-600 hover:bg-red-700">
              <Loader2 className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <div className="h-screen overflow-y-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            
            {/* Header avec configuration des frais */}
            {loading ? (
              <HeaderSkeleton />
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestion des Inscriptions</h1>
                    <p className="text-gray-600 mt-2">
                      Gérez les demandes d&apos;inscription des apprenants
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Card className="bg-orange-50 border-orange-200">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <Euro className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-semibold text-orange-800">
                            Inscription: {safeToLocaleString(fraisInscription)} FCFA
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Bouton de configuration des frais */}
                    <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Settings className="w-4 h-4 mr-2" />
                          Configurer les Frais
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[80vh] overflow-y-auto max-w-md bg-white">
                        <DialogHeader>
                          <DialogTitle>Configuration des Frais d&apos;Inscription</DialogTitle>
                          <DialogDescription>
                            Définissez le montant universel des frais d&apos;inscription
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <Card>
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="frais" className="text-sm font-medium text-gray-700">
                                    Frais d&apos;Inscription Universel (FCFA)
                                  </Label>
                                  <p className="text-sm text-gray-600 mb-2">
                                    Ce montant s&apos;applique à toutes les filières
                                  </p>
                                  <Input
                                    id="frais"
                                    type="number"
                                    placeholder="15000"
                                    value={fraisInscription}
                                    onChange={(e) => setFraisInscription(parseInt(e.target.value) || 15000)}
                                    className="text-lg font-semibold"
                                  />
                                </div>
                                
                                <div className="p-3 bg-blue-50 rounded-lg">
                                  <div className="text-sm font-medium text-blue-900">Nouveau montant:</div>
                                  <div className="text-2xl font-bold text-blue-900 mt-1">
                                    {safeToLocaleString(fraisInscription)} FCFA
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                          <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                            Annuler
                          </Button>
                          <Button 
                            onClick={handleUpdateFrais}
                            disabled={actionLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Sauvegarder
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Dialog nouvelle inscription */}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Nouvelle Inscription
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Nouvelle Inscription</DialogTitle>
                          <DialogDescription>
                            Remplissez les informations du nouvel apprenant
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                          {/* Information sur les frais */}
                          <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold text-blue-900">Frais d&apos;Inscription Universel</h4>
                                  <p className="text-blue-700 text-sm">
                                    Applicable à toutes les filières
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-blue-900">
                                    {safeToLocaleString(fraisInscription)} FCFA
                                  </div>
                                  <div className="text-sm text-blue-600">TTC</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Formulaire */}
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="prenom">Prénom *</Label>
                              <Input
                                id="prenom"
                                placeholder="Prénom de l'apprenant"
                                value={nouvelleInscription.prenom}
                                onChange={(e) => setNouvelleInscription({ ...nouvelleInscription, prenom: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="nom">Nom *</Label>
                              <Input
                                id="nom"
                                placeholder="Nom de l'apprenant"
                                value={nouvelleInscription.nom}
                                onChange={(e) => setNouvelleInscription({ ...nouvelleInscription, nom: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="email">Email *</Label>
                              <Input
                                id="email"
                                type="email"
                                placeholder="email@exemple.com"
                                value={nouvelleInscription.email}
                                onChange={(e) => setNouvelleInscription({ ...nouvelleInscription, email: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="telephone">Téléphone *</Label>
                              <Input
                                id="telephone"
                                placeholder="+229 01 23 45 67"
                                value={nouvelleInscription.telephone}
                                onChange={(e) => setNouvelleInscription({ ...nouvelleInscription, telephone: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="dateNaissance">Date de Naissance</Label>
                              <Input
                                id="dateNaissance"
                                type="date"
                                value={nouvelleInscription.dateNaissance}
                                onChange={(e) => setNouvelleInscription({ ...nouvelleInscription, dateNaissance: e.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="filiere">Filière *</Label>
                              <Select
                                value={nouvelleInscription.filiere}
                                onValueChange={(value) => setNouvelleInscription({ ...nouvelleInscription, filiere: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez une filière" />
                                </SelectTrigger>
                                <SelectContent>
                                  {filieres.map((filiere) => (
                                    <SelectItem key={filiere.value} value={filiere.value}>
                                      {filiere.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="vague">Vague *</Label>
                              <Select
                                value={nouvelleInscription.vague}
                                onValueChange={(value) => setNouvelleInscription({ ...nouvelleInscription, vague: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez une vague" />
                                </SelectTrigger>
                                <SelectContent>
                                  {vagues.map((vague) => (
                                    <SelectItem key={vague.value} value={vague.value}>
                                      {vague.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Récapitulatif */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Récapitulatif</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-gray-600">Frais d&apos;inscription:</span>
                                <span className="font-semibold">{safeToLocaleString(fraisInscription)} FCFA</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-gray-600">Statut:</span>
                                <Badge variant="secondary">En attente de paiement</Badge>
                              </div>
                              <div className="flex justify-between items-center py-2">
                                <span className="text-lg font-semibold">Total à payer:</span>
                                <span className="text-lg font-bold text-blue-600">
                                  {safeToLocaleString(fraisInscription)} FCFA
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Annuler
                          </Button>
                          <Button 
                            onClick={handleNouvelleInscription}
                            disabled={!nouvelleInscription.nom || !nouvelleInscription.prenom || !nouvelleInscription.email || !nouvelleInscription.telephone || !nouvelleInscription.filiere || !nouvelleInscription.vague || actionLoading}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <UserPlus className="w-4 h-4 mr-2" />
                            Créer l&apos;inscription
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            )}

            {/* Statistiques */}
            {loading ? (
              <StatsSkeleton />
            ) : (
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Inscriptions</CardTitle>
                    <Users className="h-4 w-4 text-gray-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{safeToLocaleString(statistiques.totalInscriptions)}</div>
                    <p className="text-xs text-gray-600">Apprenants inscrits</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                    <Users className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {safeToLocaleString(statistiques.enAttente)}
                    </div>
                    <p className="text-xs text-gray-600">En attente de validation</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Frais Collectés</CardTitle>
                    <Euro className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {safeToLocaleString(statistiques.totalFraisCollectes)} FCFA
                    </div>
                    <div className="text-xs text-gray-600">Total perçu</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">En Attente de Paiement</CardTitle>
                    <Euro className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {safeToLocaleString(statistiques.totalFraisEnAttente)} FCFA
                    </div>
                    <p className="text-xs text-gray-600">À percevoir</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filtres */}
            {loading ? (
              <FiltersSkeleton />
            ) : (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Filtres</CardTitle>
                  <CardDescription>
                    Filtrez les inscriptions par filière, vague ou statut
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 mb-6">
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
                        {filieres.map((filiere) => (
                          <SelectItem key={filiere.value} value={filiere.value}>
                            {filiere.label}
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
                        {vagues.map((vague) => (
                          <SelectItem key={vague.value} value={vague.value}>
                            {vague.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedStatut} onValueChange={setSelectedStatut}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Tous les statuts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="toutes">Tous les statuts</SelectItem>
                        <SelectItem value="en_attente">En attente</SelectItem>
                        <SelectItem value="approuve">Approuvé</SelectItem>
                        <SelectItem value="paye_partiel">Payé partiel</SelectItem>
                        <SelectItem value="paye_complet">Payé complet</SelectItem>
                        <SelectItem value="rejete">Rejeté</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline" onClick={fetchData}>
                      <Loader2 className="w-4 h-4 mr-2" />
                      Actualiser
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tableau des inscriptions */}
            <Card>
              <CardHeader>
                <CardTitle>Liste des Inscriptions</CardTitle>
                <CardDescription>
                  {loading ? "Chargement..." : `${inscriptions.length} inscription(s) trouvée(s)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Apprenant</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Filière</TableHead>
                          <TableHead>Vague</TableHead>
                          <TableHead>Date Inscription</TableHead>
                          <TableHead>Frais</TableHead>
                          <TableHead>Payé</TableHead>
                          <TableHead>Reste</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRowSkeleton />
                      </TableBody>
                    </Table>
                  </div>
                ) : inscriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">Aucune inscription trouvée</p>
                    <p className="text-gray-400 text-sm">
                      {searchTerm || selectedFiliere !== 'toutes' || selectedVague !== 'toutes' || selectedStatut !== 'toutes' 
                        ? "Aucun résultat ne correspond à vos critères de recherche" 
                        : "Commencez par créer votre première inscription"}
                    </p>
                    {!searchTerm && selectedFiliere === 'toutes' && selectedVague === 'toutes' && selectedStatut === 'toutes' && (
                      <Button 
                        onClick={() => setIsDialogOpen(true)}
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Créer une inscription
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Apprenant</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Filière</TableHead>
                          <TableHead>Vague</TableHead>
                          <TableHead>Date Inscription</TableHead>
                          <TableHead>Frais</TableHead>
                          <TableHead>Payé</TableHead>
                          <TableHead>Reste</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inscriptions.map((inscription) => (
                          <TableRow key={inscription.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">
                              <div>
                                <div className="font-semibold">{inscription.prenom} {inscription.nom}</div>
                                {inscription.dateNaissance && (
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {safeDateDisplay(inscription.dateNaissance)}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="w-3 h-3 text-gray-500" />
                                  {inscription.email}
                                </div>
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="w-3 h-3 text-gray-500" />
                                  {inscription.telephone}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {inscription.filiere || 'Non assigné'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                {inscription.vague || 'Non assigné'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {safeDateDisplay(inscription.dateInscription)}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {safeToLocaleString(inscription.fraisInscription)} FCFA
                            </TableCell>
                            <TableCell className="font-semibold">
                              <span className={inscription.fraisPayes > 0 ? "text-green-600" : "text-gray-600"}>
                                {safeToLocaleString(inscription.fraisPayes)} FCFA
                              </span>
                            </TableCell>
                            <TableCell className="font-semibold">
                              <span className={getResteAPayer(inscription) > 0 ? "text-orange-600" : "text-green-600"}>
                                {safeToLocaleString(getResteAPayer(inscription))} FCFA
                              </span>
                            </TableCell>
                            <TableCell>
                              {getStatutBadge(inscription.statut)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => handleUpdateStatut(inscription.id, 'approuve')}>
                                    Approuver l&apos;inscription
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openPaiementDialog(inscription)}>
                                    Enregistrer un paiement
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatut(inscription.id, 'rejete')}>
                                    Rejeter l&apos;inscription
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600"
                                    onClick={() => handleDeleteInscription(inscription.id)}
                                  >
                                    Supprimer l&apos;inscription
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dialog de paiement */}
            <Dialog open={isPaiementDialogOpen} onOpenChange={setIsPaiementDialogOpen}>
              <DialogContent className="max-h-[80vh] overflow-y-auto max-w-md bg-white">
                <DialogHeader>
                  <DialogTitle>Enregistrer un Paiement</DialogTitle>
                  <DialogDescription>
                    Enregistrez un paiement pour {selectedInscription?.prenom} {selectedInscription?.nom}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {selectedInscription && (
                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Frais d&apos;inscription:</span>
                          <span className="font-semibold">{safeToLocaleString(selectedInscription.fraisInscription)} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Déjà payé:</span>
                          <span className="font-semibold">{safeToLocaleString(selectedInscription.fraisPayes)} FCFA</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600 font-semibold">Reste à payer:</span>
                          <span className="font-bold text-blue-600">
                            {safeToLocaleString(getResteAPayer(selectedInscription))} FCFA
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="montant">Montant du paiement (FCFA) *</Label>
                      <Input
                        id="montant"
                        type="number"
                        placeholder="15000"
                        value={paiementData.montant}
                        onChange={(e) => setPaiementData({ ...paiementData, montant: parseInt(e.target.value) || 0 })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="modePaiement">Mode de paiement *</Label>
                      <Select
                        value={paiementData.modePaiement}
                        onValueChange={(value) => setPaiementData({ ...paiementData, modePaiement: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un mode de paiement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ESPECES">Espèces</SelectItem>
                          <SelectItem value="VIREMENT">Virement</SelectItem>
                          <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                          <SelectItem value="CHEQUE">Chèque</SelectItem>
                          <SelectItem value="CARTE">Carte bancaire</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reference">Référence</Label>
                      <Input
                        id="reference"
                        placeholder="Numéro de référence"
                        value={paiementData.reference}
                        onChange={(e) => setPaiementData({ ...paiementData, reference: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsPaiementDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCreatePaiement}
                    disabled={!paiementData.montant || !paiementData.modePaiement || actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Enregistrer le paiement
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}