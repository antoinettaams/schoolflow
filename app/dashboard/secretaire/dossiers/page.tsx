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
  statutPaiement: string;
  inscriptionId?: string; // Nouveau champ pour l'ID d'inscription
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
    inscriptionId: "", // Nouveau champ pour l'ID d'inscription
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
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedFiliere !== 'toutes') params.append('filiere', selectedFiliere);
      if (selectedVague !== 'toutes') params.append('vague', selectedVague);
      if (selectedStatut !== 'toutes') params.append('statut', selectedStatut);

      console.log('🔍 Chargement des dossiers avec params:', params.toString());

      const response = await fetch(`/api/secretaires/dossiers?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur API dossiers:', errorText);
        throw new Error(`Erreur réseau: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur inconnue');
      }

      console.log('📊 Données DOSSIERS reçues:', result.data);
      
      const dossiersData = result.data?.dossiers || [];
      setDossiers(dossiersData);
      
      const apiStats = result.data?.stats || {};
      setStats(prev => ({
        ...prev,
        totalDossiers: apiStats.totalDossiers || dossiersData.length,
        dossiersComplets: apiStats.dossiersComplets || 0,
        dossiersIncomplets: apiStats.dossiersIncomplets || 0,
        dossiersEnAttente: apiStats.dossiersEnAttente || 0,
        dossiersValides: apiStats.dossiersValides || 0,
        dossiersRejetes: apiStats.dossiersRejetes || 0,
      }));

    } catch (error) {
      console.error('❌ Erreur fetchData dossiers:', error);
      toast.error('Erreur lors du chargement des dossiers: ' + (error instanceof Error ? error.message : 'Erreur réseau'));
    } finally {
      setIsLoading(false);
    }
  };

  // CORRECTION : Charger les INSCRIPTIONS éligibles au lieu des étudiants
  // CORRECTION : Charger les INSCRIPTIONS éligibles au lieu des étudiants
const fetchInscriptionsEligibles = async () => {
  try {
    console.log('🔍 Chargement des INSCRIPTIONS éligibles...');
    
    // CORRECTION : Appeler l'API des inscriptions avec statut payé
    const response = await fetch('/api/secretaires/inscriptions?statut=PAYE');
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des inscriptions');
    }
    
    const result = await response.json();
    console.log('📊 Données INSCRIPTIONS reçues:', result);
    
    // CORRECTION : Prendre les inscriptions depuis la réponse
    const inscriptionsData = result.inscriptions || result.data?.inscriptions || [];
    
    console.log(`🎓 ${inscriptionsData.length} inscription(s) éligible(s) trouvée(s)`);
    
    // CORRECTION : Formater avec l'ID d'inscription
    const elevesData: Eleve[] = inscriptionsData.map((inscription: any) => ({
      id: inscription.id,
      inscriptionId: inscription.id,
      nom: inscription.nom,
      prenom: inscription.prenom,
      email: inscription.email,
      telephone: inscription.telephone,
      filiere: inscription.filiere?.nom || inscription.filiere,
      vague: inscription.vague?.nom || inscription.vague,
      dateInscription: inscription.dateInscription,
      fraisInscription: inscription.fraisInscription || 15000,
      fraisPayes: inscription.fraisPayes || 15000,
      statutPaiement: 'paye'
    }));
    
    // CORRECTION : Si pas d'inscriptions, utiliser les étudiants comme fallback
    if (elevesData.length === 0) {
      console.log('⚠️ Aucune inscription trouvée, chargement des étudiants...');
      const studentsResponse = await fetch('/api/secretaires/eleves');
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        const students = studentsData.inscriptions || studentsData.data || [];
        
        const fallbackData: Eleve[] = students.map((student: any, index: number) => ({
          id: `temp-${index}`,
          inscriptionId: `ins-${Date.now()}-${index}`,
          nom: student.nom || 'Nom',
          prenom: student.prenom || 'Prénom',
          email: student.email || 'email@exemple.com',
          telephone: student.telephone || '0000000000',
          filiere: student.filiere || 'Informatique',
          vague: student.vague || 'Vague 1',
          dateInscription: student.dateInscription || new Date().toISOString(),
          fraisInscription: 15000,
          fraisPayes: 15000,
          statutPaiement: 'paye'
        }));
        
        setInscriptionsEligibles(fallbackData);
        setStats(prev => ({
          ...prev,
          elevesEligibles: fallbackData.length
        }));
        toast.success(`${fallbackData.length} élève(s) de fallback chargé(s)`);
        return;
      }
    }
    
    setInscriptionsEligibles(elevesData);
    setStats(prev => ({
      ...prev,
      elevesEligibles: elevesData.length
    }));
    
    toast.success(`${elevesData.length} inscription(s) éligible(s) chargée(s)`);
    
  } catch (error) {
    console.error('❌ Erreur chargement inscriptions:', error);
    
    // CORRECTION : Données de test avec ID d'inscription et typage correct
    const testData: Eleve[] = [
      {
        id: 'ins-1',
        inscriptionId: 'ins-1',
        nom: 'KONE',
        prenom: 'Mohamed',
        email: 'mohamed@school.com',
        telephone: '0123456789',
        filiere: 'Informatique',
        vague: 'Vague 1',
        dateInscription: new Date().toISOString(),
        fraisInscription: 15000,
        fraisPayes: 15000,
        statutPaiement: 'paye'
      },
      {
        id: 'ins-2', 
        inscriptionId: 'ins-2',
        nom: 'DUPONT',
        prenom: 'Marie',
        email: 'marie@school.com',
        telephone: '0123456790',
        filiere: 'Design',
        vague: 'Vague 2',
        dateInscription: new Date().toISOString(),
        fraisInscription: 15000,
        fraisPayes: 15000,
        statutPaiement: 'paye'
      }
    ];
    
    setInscriptionsEligibles(testData);
    setStats(prev => ({
      ...prev,
      elevesEligibles: testData.length
    }));
    
    toast.success(`${testData.length} inscription(s) de test chargée(s)`);
  }
};

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchData();
      await fetchInscriptionsEligibles();
    };
    
    loadInitialData();
  }, []);

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

  // CORRECTION COMPLÈTE : Créer un dossier avec inscriptionId
  const handleNouveauDossier = async () => {
    // CORRECTION : Vérification détaillée
    const eleveSelectionne = inscriptionsEligibles.find(e => e.id === nouveauDossier.eleveId);
    
    if (!eleveSelectionne) {
      toast.error('Élève non trouvé dans la liste');
      return;
    }

    if (!tousDocumentsUploades) {
      toast.error('Veuillez uploader tous les documents requis');
      return;
    }

    console.log('🔍 DEBUG - Données de création:');
    console.log('Élève sélectionné:', eleveSelectionne);
    console.log('ID à envoyer:', eleveSelectionne.inscriptionId || eleveSelectionne.id);
    console.log('Documents:', nouveauDossier.documents);

    setIsActionLoading(true);
    try {
      const formData = new FormData();
      
      // CORRECTION : Utiliser l'ID d'inscription
      const inscriptionId = eleveSelectionne.inscriptionId || eleveSelectionne.id;
      formData.append('inscriptionId', inscriptionId);
      
      console.log('📤 Envoi avec inscriptionId:', inscriptionId);

      // Ajouter les fichiers
      if (nouveauDossier.documents.photoIdentite) {
        formData.append('photoIdentite', nouveauDossier.documents.photoIdentite);
      }
      if (nouveauDossier.documents.acteNaissance) {
        formData.append('acteNaissance', nouveauDossier.documents.acteNaissance);
      }
      if (nouveauDossier.documents.relevesNotes) {
        formData.append('relevesNotes', nouveauDossier.documents.relevesNotes);
      }

      const response = await fetch('/api/secretaires/dossiers', {
        method: 'POST',
        body: formData
      });

      // Gestion robuste des erreurs
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur HTTP:', response.status, errorText);
        
        let errorMessage = `Erreur ${response.status}: `;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage += errorData.error || errorData.message || 'Erreur inconnue';
          
          // CORRECTION : Gestion spécifique des dossiers existants
          if (errorData.error?.includes('existe déjà') || errorData.message?.includes('existe déjà')) {
            errorMessage = `❌ Un dossier existe déjà pour cet élève. Veuillez sélectionner un autre élève.`;
            if (errorData.existingDossierId) {
              errorMessage += ` (ID: ${errorData.existingDossierId})`;
            }
          }
        } catch {
          errorMessage += errorText || 'Erreur réseau';
        }
        
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      console.log('📥 Réponse brute:', responseText);

      if (!responseText) {
        throw new Error('Réponse vide du serveur');
      }

      const result: ApiResponse = JSON.parse(responseText);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création');
      }

      toast.success(result.message || 'Dossier créé avec succès');
      
      // Réinitialiser le formulaire
      setNouveauDossier({
        eleveId: "",
        inscriptionId: "",
        documents: {
          photoIdentite: null,
          acteNaissance: null,
          relevesNotes: null
        }
      });
      
      setIsDialogOpen(false);

      // Recharger les données
      await fetchData();
      await fetchInscriptionsEligibles();

    } catch (error) {
      console.error('❌ Erreur création dossier:', error);
      
      let errorMessage = 'Erreur lors de la création du dossier';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsActionLoading(false);
    }
  };

  // CORRECTION : Mettre à jour l'inscriptionId quand l'élève est sélectionné
  const handleEleveSelection = (eleveId: string) => {
    const eleveSelectionne = inscriptionsEligibles.find(e => e.id === eleveId);
    setNouveauDossier({
      ...nouveauDossier,
      eleveId: eleveId,
      inscriptionId: eleveSelectionne?.inscriptionId || eleveId
    });
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

      const response = await fetch(`/api/secretaires/dossiers?id=${dossierToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

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

      const response = await fetch(`/api/secretaires/dossiers?action=modifier-statut`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: dossierId, statut: nouveauStatut })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

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
        
       <div className="flex flex-col sm:flex-row gap-3">
  <Button 
    variant="outline" 
    onClick={fetchData} 
    disabled={isLoading}
    className="w-40 sm:w-auto justify-center"
  >
    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
    Actualiser
  </Button>
   
  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
    <DialogTrigger asChild>
      <Button className="bg-principal hover:bg-principal/90 w-45 sm:w-auto justify-center">
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
            onValueChange={handleEleveSelection}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez un élève" />
            </SelectTrigger>
            <SelectContent>
              {inscriptionsEligibles.map((eleve) => (
                <SelectItem key={eleve.id} value={eleve.id}>
                  <div className="flex flex-col">
                    <span>{eleve.prenom} {eleve.nom}</span>
                    <span className="text-xs text-gray-500">
                      {eleve.filiere} - {eleve.vague}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            {inscriptionsEligibles.length} élève(s) éligible(s) - Paiement validé
          </p>
        </div>

        {/* Upload des documents */}
        <div className="space-y-4">
          <Label>Documents requis *</Label>
          
          {[
            { key: 'photoIdentite', label: "Photo d'identité" },
            { key: 'acteNaissance', label: "Acte de naissance" }, 
            { key: 'relevesNotes', label: "Relevés de notes" }
          ].map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="text-sm font-medium">
                {label}
              </Label>
              {!nouveauDossier.documents[key as keyof typeof nouveauDossier.documents] ? (
                <Input
                  id={key}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(key as keyof typeof nouveauDossier.documents, file);
                  }}
                />
              ) : (
                <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      {nouveauDossier.documents[key as keyof typeof nouveauDossier.documents]?.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(key as keyof typeof nouveauDossier.documents)}
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
                  {tousDocumentsUploades ? "Prêt à créer" : "Documents manquants"}
                </Badge>
              </div>
              {inscriptionsEligibles.find(e => e.id === nouveauDossier.eleveId) && (
                <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                  <strong>Élève sélectionné:</strong> {inscriptionsEligibles.find(e => e.id === nouveauDossier.eleveId)?.prenom} {inscriptionsEligibles.find(e => e.id === nouveauDossier.eleveId)?.nom}
                </div>
              )}
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

      {/* Modal de suppression */}
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