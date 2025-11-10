"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback} from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileText, User, Mail, Plus, Upload, X, RefreshCw, Trash2, Edit, AlertTriangle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// Types
interface Dossier {
  id: string;
  eleve: string;
  email: string;
  telephone: string;
  filiere: string;
  vague: string;
  dateInscription: string;
  dateCreation: string;
  statut: "complet" | "incomplet" | "en_attente" | "valide" | "rejete";
  documents: {
    photoIdentite: string | null;
    acteNaissance: string | null;
    relevesNotes: string | null;
  };
  documentsManquants: string[];
  createdBy: string;
}

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  filiere: string;
  vague: string;
  dateInscription: string;
  fraisInscription: number;
  fraisPayes: number;
  statutPaiement: "paye";
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export default function DossiersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState<string>("toutes");
  const [selectedVague, setSelectedVague] = useState<string>("toutes");
  const [selectedStatut, setSelectedStatut] = useState<string>("toutes");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [dossierToDelete, setDossierToDelete] = useState<Dossier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // États pour les données
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [inscriptionsEligibles, setInscriptionsEligibles] = useState<Eleve[]>([]);
  const [stats, setStats] = useState({
    totalDossiers: 0,
    dossiersComplets: 0,
    dossiersIncomplets: 0,
    dossiersEnAttente: 0,
    dossiersValides: 0,
    dossiersRejetes: 0,
    elevesEligibles: 0
  });

  const [nouveauDossier, setNouveauDossier] = useState({
    eleveId: "",
    documents: {
      photoIdentite: null as File | null,
      acteNaissance: null as File | null,
      relevesNotes: null as File | null,
    }
  });

  // Charger les données DOSSIERS
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Paramètre endpoint OBLIGATOIRE
      params.append('endpoint', 'dossiers');
      
      // CORRECTION : Utiliser les mêmes noms de paramètres que l'API attend
      if (searchTerm) params.append('search', searchTerm);
      if (selectedFiliere !== 'toutes') params.append('filiere', selectedFiliere);
      if (selectedVague !== 'toutes') params.append('vague', selectedVague);
      if (selectedStatut !== 'toutes') params.append('statut', selectedStatut);

      console.log('🔍 Paramètres de requête DOSSIERS:', params.toString());

      const response = await fetch(`/api/secretaires/dossiers?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur détaillée:', errorText);
        throw new Error(`Erreur réseau: ${response.status} - ${errorText}`);
      }

      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur inconnue');
      }

      console.log('📊 Données DOSSIERS reçues:', result.data);
      
      // CORRECTION : Adapter à la structure exacte de votre API
      const dossiersData = result.data.dossiers || [];
      setDossiers(dossiersData);
      
      // CORRECTION : Utiliser les stats de l'API si disponibles
      const apiStats = result.data.stats || {};
      setStats(prev => ({
        ...prev,
        totalDossiers: apiStats.totalDossiers || dossiersData.length,
        dossiersComplets: apiStats.dossiersComplets || dossiersData.filter((d: Dossier) => d.statut === 'complet').length,
        dossiersIncomplets: apiStats.dossiersIncomplets || dossiersData.filter((d: Dossier) => d.statut === 'incomplet').length,
        dossiersEnAttente: apiStats.dossiersEnAttente || dossiersData.filter((d: Dossier) => d.statut === 'en_attente').length,
        dossiersValides: apiStats.dossiersValides || dossiersData.filter((d: Dossier) => d.statut === 'valide').length,
        dossiersRejetes: apiStats.dossiersRejetes || dossiersData.filter((d: Dossier) => d.statut === 'rejete').length,
      }));

    } catch (error) {
      console.error('❌ Erreur fetchData:', error);
      toast.error('Erreur lors du chargement des données: ' + (error instanceof Error ? error.message : 'Erreur réseau'));
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les inscriptions éligibles pour les nouveaux dossiers
  const fetchInscriptionsEligibles = async () => {
    try {
      console.log('🔍 Chargement des inscriptions éligibles...');
      
      // CORRECTION : Utiliser uniquement l'API unifiée avec le bon endpoint
      const params = new URLSearchParams();
      params.append('endpoint', 'inscriptions');
      
      const response = await fetch(`/api/secretaires/dossiers?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur inscriptions:', errorText);
        throw new Error(`Erreur réseau: ${response.status} - ${errorText}`);
      }
      
      const result: ApiResponse = await response.json();
      
      console.log('📊 Réponse API inscriptions:', result);
      
      if (result.success) {
        console.log('📊 INSCRIPTIONS éligibles reçues:', result.data);
        
        // CORRECTION : Adapter à la structure exacte de votre API
        const inscriptionsData = result.data?.inscriptions || [];
        console.log('📋 Données inscriptions formatées:', inscriptionsData);
        
        setInscriptionsEligibles(inscriptionsData);
        
        // Mettre à jour les stats avec le nombre d'élèves éligibles
        setStats(prev => ({
          ...prev,
          elevesEligibles: inscriptionsData.length
        }));
        
        console.log('✅ Inscriptions chargées avec succès:', inscriptionsData.length);
      } else {
        throw new Error(result.error || 'Erreur lors du chargement des inscriptions');
      }
    } catch (error) {
      console.error('❌ Erreur chargement inscriptions:', error);
      toast.error('Erreur lors du chargement des inscriptions éligibles');
    }
  };

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchData();
      // Charger aussi les inscriptions éligibles pour les stats
      await fetchInscriptionsEligibles();
    };
    
    loadInitialData();
  }, []); // Seulement au montage du composant

  // Recharger les données quand les filtres changent
  useEffect(() => {
    fetchData();
  }, [searchTerm, selectedFiliere, selectedVague, selectedStatut]);

  useEffect(() => {
    if (isDialogOpen) {
      fetchInscriptionsEligibles();
    }
  }, [isDialogOpen]);

  // Fonctions utilitaires
  const getInitials = (nomComplet: string) => {
    return nomComplet
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getStatutBadge = (statut: string) => {
    const config = {
      complet: { label: "Complet", variant: "default" as const },
      incomplet: { label: "Incomplet", variant: "destructive" as const },
      en_attente: { label: "En attente", variant: "outline" as const },
      valide: { label: "Validé", variant: "default" as const },
      rejete: { label: "Rejeté", variant: "destructive" as const }
    };
    
    const { label, variant } = config[statut as keyof typeof config] || config.en_attente;
    
    // Appliquer les classes CSS conditionnellement
    let className = "";
    switch (statut) {
      case "complet":
        className = "bg-green-100 text-green-800";
        break;
      case "en_attente":
        className = "bg-yellow-100 text-yellow-800";
        break;
      case "valide":
        className = "bg-blue-100 text-blue-800";
        break;
      default:
        className = "";
    }
    
    return <Badge variant={variant} className={className}>{label}</Badge>;
  };

  // Gestion des fichiers
  const handleFileUpload = (documentType: keyof typeof nouveauDossier.documents, file: File) => {
    setNouveauDossier({
      ...nouveauDossier,
      documents: {
        ...nouveauDossier.documents,
        [documentType]: file
      }
    });
  };

  const removeFile = (documentType: keyof typeof nouveauDossier.documents) => {
    setNouveauDossier({
      ...nouveauDossier,
      documents: {
        ...nouveauDossier.documents,
        [documentType]: null
      }
    });
  };

  // Créer un dossier
  const handleNouveauDossier = async () => {
    if (!nouveauDossier.eleveId || !tousDocumentsUploades) return;

    setIsActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('inscriptionId', nouveauDossier.eleveId);
      
      if (nouveauDossier.documents.photoIdentite) {
        formData.append('photoIdentite', nouveauDossier.documents.photoIdentite);
      }
      if (nouveauDossier.documents.acteNaissance) {
        formData.append('acteNaissance', nouveauDossier.documents.acteNaissance);
      }
      if (nouveauDossier.documents.relevesNotes) {
        formData.append('relevesNotes', nouveauDossier.documents.relevesNotes);
      }

      console.log('📤 Création dossier avec inscriptionId:', nouveauDossier.eleveId);

      // Ajouter le paramètre action pour la création
      const response = await fetch('/api/secretaires/dossiers?action=creer-dossier', {
        method: 'POST',
        body: formData
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création');
      }

      toast.success(result.message || 'Dossier créé avec succès');
      
      setIsDialogOpen(false);
      setNouveauDossier({
        eleveId: "",
        documents: {
          photoIdentite: null,
          acteNaissance: null,
          relevesNotes: null
        }
      });

      await fetchData();
    } catch (error) {
      console.error('❌ Erreur création dossier:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création du dossier');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Ouvrir la modal de suppression
  const openDeleteDialog = (dossier: Dossier) => {
    setDossierToDelete(dossier);
    setIsDeleteDialogOpen(true);
  };

  // Supprimer un dossier
  const handleSupprimerDossier = async () => {
    if (!dossierToDelete) return;

    setIsActionLoading(true);
    try {
      console.log('🗑️ Suppression dossier:', dossierToDelete.id);

      const response = await fetch('/api/secretaires/dossiers?action=supprimer-dossier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: dossierToDelete.id })
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }

      toast.success(result.message || 'Dossier supprimé avec succès');
      setIsDeleteDialogOpen(false);
      setDossierToDelete(null);
      await fetchData();
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Modifier le statut d'un dossier
  const handleModifierStatut = async (dossierId: string, nouveauStatut: string) => {
    setIsActionLoading(true);
    try {
      console.log('✏️ Modification statut:', dossierId, nouveauStatut);

      const response = await fetch('/api/secretaires/dossiers?action=modifier-statut-dossier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: dossierId, statut: nouveauStatut })
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la modification');
      }

      toast.success(result.message || 'Statut mis à jour avec succès');
      setIsEditDialogOpen(false);
      setSelectedDossier(null);
      await fetchData();
    } catch (error) {
      console.error('❌ Erreur modification statut:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la modification');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Vérifications
  const tousDocumentsUploades = 
    nouveauDossier.documents.photoIdentite && 
    nouveauDossier.documents.acteNaissance && 
    nouveauDossier.documents.relevesNotes;

  // Extraire les filières et vagues uniques pour les filtres
  const filieres = [...new Set(dossiers.map(d => d.filiere).filter(Boolean))];
  const vagues = [...new Set(dossiers.map(d => d.vague).filter(Boolean))];

  return (
    <div className="p-6 space-y-6 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <Toaster position="top-right" />
      
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Dossiers</h1>
          <p className="text-gray-600 mt-2">
            Gérez et suivez l'état des dossiers des élèves
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-principal hover:bg-principal/90">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Dossier
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouveau Dossier</DialogTitle>
                <DialogDescription>
                  Sélectionnez un élève et téléversez les documents requis
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Sélection de l'élève */}
                <div className="space-y-2">
                  <Label htmlFor="eleve">Élève *</Label>
                  <Select
                    value={nouveauDossier.eleveId}
                    onValueChange={(value) => setNouveauDossier({ ...nouveauDossier, eleveId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un élève" />
                    </SelectTrigger>
                    <SelectContent>
                      {inscriptionsEligibles.map((eleve) => (
                        <SelectItem key={eleve.id} value={eleve.id}>
                          {eleve.prenom} {eleve.nom} - {eleve.filiere}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {inscriptionsEligibles.length} élève(s) éligible(s)
                  </p>
                </div>

                {/* Upload des documents */}
                <div className="space-y-4">
                  <Label>Documents requis *</Label>
                  
                  {['photoIdentite', 'acteNaissance', 'relevesNotes'].map((docType) => (
                    <div key={docType} className="space-y-2">
                      <Label htmlFor={docType} className="text-sm font-medium capitalize">
                        {docType.replace(/([A-Z])/g, ' $1').replace('Identite', 'd\'identité').replace('Naissance', 'de naissance').replace('Notes', 'de notes')}
                      </Label>
                      {!nouveauDossier.documents[docType as keyof typeof nouveauDossier.documents] ? (
                        <Input
                          id={docType}
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(docType as keyof typeof nouveauDossier.documents, file);
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-800">
                              {nouveauDossier.documents[docType as keyof typeof nouveauDossier.documents]?.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(docType as keyof typeof nouveauDossier.documents)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Récapitulatif */}
                {nouveauDossier.eleveId && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-blue-900 text-lg">Récapitulatif</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-800">Documents uploadés:</span>
                        <Badge variant={tousDocumentsUploades ? "default" : "outline"}>
                          {Object.values(nouveauDossier.documents).filter(Boolean).length}/3
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-800">Statut du dossier:</span>
                        <Badge variant={tousDocumentsUploades ? "default" : "destructive"}>
                          {tousDocumentsUploades ? "Complet" : "Incomplet"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleNouveauDossier}
                  disabled={!nouveauDossier.eleveId || !tousDocumentsUploades || isActionLoading}
                  className="bg-principal hover:bg-principal/90"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isActionLoading ? "Création..." : "Créer le dossier"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dossiers</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-2xl font-bold">{stats.totalDossiers}</div>
                <p className="text-xs text-gray-600">Dossiers élèves</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complets</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-2xl font-bold">{stats.dossiersComplets}</div>
                <p className="text-xs text-gray-600">Dossiers finalisés</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incomplets</CardTitle>
            <FileText className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-2xl font-bold">{stats.dossiersIncomplets}</div>
                <p className="text-xs text-gray-600">Documents manquants</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Élèves Éligibles</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-2xl font-bold">{stats.elevesEligibles}</div>
                <p className="text-xs text-gray-600">Paiement validé</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>
            Filtrez les dossiers par filière, vague ou statut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Rechercher un dossier..."
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
                  <SelectItem key={filiere} value={filiere}>{filiere}</SelectItem>
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
                  <SelectItem key={vague} value={vague}>{vague}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatut} onValueChange={setSelectedStatut}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Tous les statuts</SelectItem>
                <SelectItem value="complet">Complets</SelectItem>
                <SelectItem value="incomplet">Incomplets</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="valide">Validés</SelectItem>
                <SelectItem value="rejete">Rejetés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des dossiers */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Dossiers</CardTitle>
          <CardDescription>
            {isLoading ? "Chargement..." : `${dossiers.length} dossier(s) trouvé(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Élève</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Filière</TableHead>
                  <TableHead>Vague</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Skeleton pour le chargement
                  Array.from({ length: 5 }).map((_, index) => (
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
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-20 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : dossiers.length > 0 ? (
                  dossiers.map((dossier) => (
                    <TableRow key={dossier.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {getInitials(dossier.eleve)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{dossier.eleve}</div>
                            <div className="text-sm text-gray-500">
                              Créé par: {dossier.createdBy}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3" />
                            {dossier.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {dossier.telephone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {dossier.filiere}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{dossier.vague}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(dossier.dateCreation).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {getStatutBadge(dossier.statut)}
                      </TableCell>
                      <TableCell>
                        {dossier.documentsManquants.length > 0 ? (
                          <div className="space-y-1">
                            <div className="text-sm text-red-600 font-medium">
                              {dossier.documentsManquants.length} manquant(s)
                            </div>
                            <div className="text-xs text-red-500">
                              {dossier.documentsManquants.slice(0, 2).join(', ')}
                              {dossier.documentsManquants.length > 2 && '...'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-green-600 font-medium">Complet</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedDossier(dossier);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openDeleteDialog(dossier)}
                            disabled={isActionLoading}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Aucun dossier trouvé avec les critères sélectionnés
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour modifier le statut */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Modifier le statut du dossier</DialogTitle>
            <DialogDescription>
              Modifiez le statut du dossier de {selectedDossier?.eleve}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDossier && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nouveau statut</Label>
                <Select
                  defaultValue={selectedDossier.statut}
                  onValueChange={(value) => handleModifierStatut(selectedDossier.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un statut" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="complet">Complet</SelectItem>
                    <SelectItem value="incomplet">Incomplet</SelectItem>
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="valide">Validé</SelectItem>
                    <SelectItem value="rejete">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de suppression personnalisée */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-red-600">Supprimer le dossier</DialogTitle>
                <DialogDescription>
                  Cette action est irréversible
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {dossierToDelete && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium">
                  Êtes-vous sûr de vouloir supprimer le dossier de <span className="font-bold">{dossierToDelete.eleve}</span> ?
                </p>
                <div className="mt-2 text-xs text-red-600 space-y-1">
                  <p>• Filière: {dossierToDelete.filiere}</p>
                  <p>• Vague: {dossierToDelete.vague}</p>
                  <p>• Statut: {dossierToDelete.statut}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setDossierToDelete(null);
                  }}
                  disabled={isActionLoading}
                >
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleSupprimerDossier}
                  disabled={isActionLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isActionLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}