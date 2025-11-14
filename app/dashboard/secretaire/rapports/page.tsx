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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Download, FileText, Calendar, Eye, MoreHorizontal, BarChart3, Plus, Trash2, Edit } from "lucide-react";
import { Toaster, toast } from 'react-hot-toast';

interface Rapport {
  id: string;
  titre: string;
  type: "vague" | "mensuel" | "annuel" | "special";
  vague: string;
  vagueId?: string;
  periode: string;
  dateGeneration: string;
  generePar: string;
  statut: "en_cours" | "genere" | "erreur";
  taille: string;
  resume: string;
  statistiques: {
    inscriptions: number;
    paiements: number;
    cartesGenerees: number;
    dossiersComplets: number;
  };
}

interface Vague {
  id: string;
  nom: string;
}

interface NouveauRapport {
  titre: string;
  type: "vague" | "mensuel" | "annuel" | "special";
  vague: string;
  periode: string;
  resume: string;
  inclusions: {
    inscriptions: boolean;
    paiements: boolean;
    cartes: boolean;
    dossiers: boolean;
  };
}

export default function RapportsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("tous");
  const [selectedVague, setSelectedVague] = useState<string>("toutes");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [vagues, setVagues] = useState<Vague[]>([]);
  const [statistiques, setStatistiques] = useState({
    totalRapports: 0,
    rapportsVague: 0,
    rapportsMensuels: 0,
    espaceUtilise: '0 MB'
  });
  
  const [nouveauRapport, setNouveauRapport] = useState<NouveauRapport>({
    titre: "",
    type: "vague",
    vague: "",
    periode: "",
    resume: "",
    inclusions: {
      inscriptions: true,
      paiements: true,
      cartes: true,
      dossiers: true
    }
  });

  const [rapportEnEdition, setRapportEnEdition] = useState<Rapport | null>(null);
  const [rapportASupprimer, setRapportASupprimer] = useState<Rapport | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Charger les données
  useEffect(() => {
    fetchRapports();
  }, []);

  const fetchRapports = async () => {
    try {
      setLoading(true);
      const apiUrl = '/api/secretaires/rapports';
      console.log('🔄 Début appel API:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('📡 Statut réponse:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur réponse:', errorText);
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Données reçues:', data);
      
      if (data.success) {
        setRapports(data.data.rapports || []);
        setVagues(data.data.vagues || []);
        setStatistiques(data.data.statistiques || {
          totalRapports: 0,
          rapportsVague: 0,
          rapportsMensuels: 0,
          espaceUtilise: '0 MB'
        });
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('❌ Erreur complète:', error);
      toast.error(`Erreur lors du chargement des rapports: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const types = {
      vague: { label: "Par Vague", variant: "default" as const },
      mensuel: { label: "Mensuel", variant: "secondary" as const },
      annuel: { label: "Annuel", variant: "outline" as const },
      special: { label: "Spécial", variant: "destructive" as const }
    };
    
    const config = types[type as keyof typeof types];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatutBadge = (statut: string) => {
    const config = {
      genere: { label: "Généré", variant: "default" as const },
      en_cours: { label: "En cours", variant: "outline" as const },
      erreur: { label: "Erreur", variant: "destructive" as const }
    };

    const { label, variant } = config[statut as keyof typeof config];
    return <Badge variant={variant}>{label}</Badge>;
  };

  // Filtrage des rapports
  const filteredRapports = rapports.filter(rapport => {
    const matchesSearch = 
      rapport.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rapport.resume.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === "tous" || rapport.type === selectedType;
    const matchesVague = selectedVague === "toutes" || rapport.vague === selectedVague;

    return matchesSearch && matchesType && matchesVague;
  });

  const handleNouveauRapport = async () => {
    try {
      setCreating(true);
      console.log('🔄 Création rapport:', nouveauRapport);
      
      const response = await fetch('/api/secretaires/rapports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nouveauRapport)
      });

      console.log('📡 Statut création:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur création:', errorText);
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Rapport créé:', data);

      if (data.success) {
        setRapports([data.data.rapport, ...rapports]);
        setIsDialogOpen(false);
        
        // Reset du formulaire
        setNouveauRapport({
          titre: "",
          type: "vague",
          vague: "",
          periode: "",
          resume: "",
          inclusions: {
            inscriptions: true,
            paiements: true,
            cartes: true,
            dossiers: true
          }
        });

        toast.success('Rapport créé avec succès!');
      }
    } catch (error: any) {
      console.error('❌ Erreur création rapport:', error);
      toast.error(error.message || 'Erreur lors de la création du rapport');
    } finally {
      setCreating(false);
    }
  };

  const handleModifierRapport = async () => {
    if (!rapportEnEdition) return;

    try {
      setUpdating(true);
      setActionLoading(rapportEnEdition.id);
      console.log('🔄 Modification rapport:', rapportEnEdition);
      
      const response = await fetch('/api/secretaires/rapports', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: rapportEnEdition.id,
          titre: rapportEnEdition.titre,
          type: rapportEnEdition.type,
          vague: rapportEnEdition.vagueId || rapportEnEdition.vague,
          periode: rapportEnEdition.periode,
          resume: rapportEnEdition.resume,
          inclusions: {
            inscriptions: true,
            paiements: true,
            cartes: true,
            dossiers: true
          }
        })
      });

      console.log('📡 Statut modification:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur modification:', errorText);
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Rapport modifié:', data);

      if (data.success) {
        // Mettre à jour la liste des rapports
        setRapports(rapports.map(r => 
          r.id === rapportEnEdition.id ? data.data.rapport : r
        ));
        setIsEditDialogOpen(false);
        setRapportEnEdition(null);

        toast.success('Rapport modifié avec succès!');
      }
    } catch (error: any) {
      console.error('❌ Erreur modification rapport:', error);
      toast.error(error.message || 'Erreur lors de la modification du rapport');
    } finally {
      setUpdating(false);
      setActionLoading(null);
    }
  };

  const handleSupprimerRapport = async () => {
    if (!rapportASupprimer) return;

    try {
      setDeleting(true);
      setActionLoading(rapportASupprimer.id);
      console.log('🔄 Suppression rapport:', rapportASupprimer.id);
      
      const response = await fetch(`/api/secretaires/rapports?id=${rapportASupprimer.id}`, {
        method: 'DELETE',
      });

      console.log('📡 Statut suppression:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur suppression:', errorText);
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Rapport supprimé:', data);

      if (data.success) {
        // Retirer le rapport de la liste
        setRapports(rapports.filter(r => r.id !== rapportASupprimer.id));
        setIsDeleteDialogOpen(false);
        setRapportASupprimer(null);
        toast.success('Rapport supprimé avec succès!');
      }
    } catch (error: any) {
      console.error('❌ Erreur suppression rapport:', error);
      toast.error(error.message || 'Erreur lors de la suppression du rapport');
    } finally {
      setDeleting(false);
      setActionLoading(null);
    }
  };

  const handleOuvrirModification = (rapport: Rapport) => {
    setRapportEnEdition(rapport);
    setIsEditDialogOpen(true);
  };

  const handleOuvrirSuppression = (rapport: Rapport) => {
    setRapportASupprimer(rapport);
    setIsDeleteDialogOpen(true);
  };

  const handleExport = async (rapportId: string, format: 'pdf' | 'excel') => {
    const toastId = toast.loading(`Export ${format.toUpperCase()} en cours...`);
    
    try {
      // Simulation d'export
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`Rapport exporté en ${format.toUpperCase()}`, { id: toastId });
    } catch (error) {
      toast.error('Erreur lors de l\'export', { id: toastId });
    }
  };

  // Composants Skeleton
  const SkeletonCard = () => (
    <Card className="bg-white border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-6 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );

  const SkeletonTableRow = () => (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
    </TableRow>
  );

  return (
    <div className="p-6 overflow-y-auto space-y-6 lg:pl-5 pt-20 lg:pt-6">
      {/* Toaster pour les notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapports d&apos;Activité</h1>
          <p className="text-gray-600 mt-2">
            Consultez et générez les rapports du centre de formation
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild className="w-48">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Rapport
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un nouveau rapport</DialogTitle>
              <DialogDescription>
                Rédigez un rapport détaillé sur les activités du centre
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Informations de base */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="titre">Titre du rapport *</Label>
                  <Input
                    id="titre"
                    placeholder="Ex: Rapport Vague 1 - Bilan complet"
                    value={nouveauRapport.titre}
                    onChange={(e) => setNouveauRapport({ ...nouveauRapport, titre: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type de rapport *</Label>
                  <Select
                    value={nouveauRapport.type}
                    onValueChange={(value: "vague" | "mensuel" | "annuel" | "special") => 
                      setNouveauRapport({ ...nouveauRapport, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type de rapport" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="vague">Par Vague</SelectItem>
                      <SelectItem value="mensuel">Mensuel</SelectItem>
                      <SelectItem value="annuel">Annuel</SelectItem>
                      <SelectItem value="special">Spécial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vague">Vague</Label>
                  <Select
                    value={nouveauRapport.vague}
                    onValueChange={(value) => setNouveauRapport({ ...nouveauRapport, vague: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une vague" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="toutes">Toutes les vagues</SelectItem>
                      {vagues.map((vague) => (
                        <SelectItem key={vague.id} value={vague.id}>
                          {vague.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periode">Période couverte *</Label>
                  <Input
                    id="periode"
                    placeholder="Ex: Janvier - Mars 2024"
                    value={nouveauRapport.periode}
                    onChange={(e) => setNouveauRapport({ ...nouveauRapport, periode: e.target.value })}
                  />
                </div>
              </div>

              {/* Résumé et observations */}
              <div className="space-y-2">
                <Label htmlFor="resume">Résumé et observations</Label>
                <Textarea
                  id="resume"
                  placeholder="Décrivez les activités principales, les réussites, les défis rencontrés et les recommandations..."
                  value={nouveauRapport.resume}
                  onChange={(e) => setNouveauRapport({ ...nouveauRapport, resume: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Inclusions statistiques */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Données à inclure</CardTitle>
                  <CardDescription>
                    Sélectionnez les données statistiques à intégrer au rapport
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="inscriptions"
                        checked={nouveauRapport.inclusions.inscriptions}
                        onChange={(e) => setNouveauRapport({
                          ...nouveauRapport,
                          inclusions: {
                            ...nouveauRapport.inclusions,
                            inscriptions: e.target.checked
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="inscriptions" className="text-sm">
                        Nombre d&apos;inscriptions
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="paiements"
                        checked={nouveauRapport.inclusions.paiements}
                        onChange={(e) => setNouveauRapport({
                          ...nouveauRapport,
                          inclusions: {
                            ...nouveauRapport.inclusions,
                            paiements: e.target.checked
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="paiements" className="text-sm">
                        État des paiements
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="cartes"
                        checked={nouveauRapport.inclusions.cartes}
                        onChange={(e) => setNouveauRapport({
                          ...nouveauRapport,
                          inclusions: {
                            ...nouveauRapport.inclusions,
                            cartes: e.target.checked
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="cartes" className="text-sm">
                        Cartes générées
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="dossiers"
                        checked={nouveauRapport.inclusions.dossiers}
                        onChange={(e) => setNouveauRapport({
                          ...nouveauRapport,
                          inclusions: {
                            ...nouveauRapport.inclusions,
                            dossiers: e.target.checked
                          }
                        })}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="dossiers" className="text-sm">
                        Dossiers complétés
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Aperçu du rapport */}
              {nouveauRapport.titre && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Aperçu du rapport</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800">Type:</span>
                      <span className="font-medium">{getTypeBadge(nouveauRapport.type)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800">Vague:</span>
                      <span className="font-medium">
                        {nouveauRapport.vague ? 
                          vagues.find(v => v.id === nouveauRapport.vague)?.nom || nouveauRapport.vague 
                          : "Toutes les vagues"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800">Période:</span>
                      <span className="font-medium">{nouveauRapport.periode || "-"}</span>
                    </div>
                    {nouveauRapport.resume && (
                      <div>
                        <div className="text-blue-800 font-medium mb-1">Résumé:</div>
                        <div className="text-sm text-blue-700">{nouveauRapport.resume}</div>
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
                onClick={handleNouveauRapport}
                disabled={!nouveauRapport.titre || !nouveauRapport.periode || creating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {creating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Création...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Générer le rapport
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog de modification */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le rapport</DialogTitle>
            <DialogDescription>
              Modifiez les informations du rapport
            </DialogDescription>
          </DialogHeader>

          {rapportEnEdition && (
            <div className="space-y-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-titre">Titre du rapport *</Label>
                  <Input
                    id="edit-titre"
                    value={rapportEnEdition.titre}
                    onChange={(e) => setRapportEnEdition({
                      ...rapportEnEdition,
                      titre: e.target.value
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-type">Type de rapport *</Label>
                  <Select
                    value={rapportEnEdition.type}
                    onValueChange={(value: "vague" | "mensuel" | "annuel" | "special") => 
                      setRapportEnEdition({
                        ...rapportEnEdition,
                        type: value
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type de rapport" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="vague">Par Vague</SelectItem>
                      <SelectItem value="mensuel">Mensuel</SelectItem>
                      <SelectItem value="annuel">Annuel</SelectItem>
                      <SelectItem value="special">Spécial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-vague">Vague</Label>
                  <Select
                    value={rapportEnEdition.vagueId || rapportEnEdition.vague}
                    onValueChange={(value) => setRapportEnEdition({
                      ...rapportEnEdition,
                      vagueId: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une vague" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="toutes">Toutes les vagues</SelectItem>
                      {vagues.map((vague) => (
                        <SelectItem key={vague.id} value={vague.id}>
                          {vague.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-periode">Période couverte *</Label>
                  <Input
                    id="edit-periode"
                    value={rapportEnEdition.periode}
                    onChange={(e) => setRapportEnEdition({
                      ...rapportEnEdition,
                      periode: e.target.value
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-resume">Résumé et observations</Label>
                <Textarea
                  id="edit-resume"
                  value={rapportEnEdition.resume}
                  onChange={(e) => setRapportEnEdition({
                    ...rapportEnEdition,
                    resume: e.target.value
                  })}
                  rows={4}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleModifierRapport}
              disabled={!rapportEnEdition?.titre || !rapportEnEdition?.periode || updating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Modification...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier le rapport
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Supprimer le rapport</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le rapport "{rapportASupprimer?.titre}" ? 
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSupprimerRapport}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
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
        </DialogContent>
      </Dialog>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rapports</CardTitle>
                <FileText className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistiques.totalRapports}</div>
                <p className="text-xs text-gray-600">Rapports générés</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Par Vague</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistiques.rapportsVague}</div>
                <p className="text-xs text-gray-600">Rapports de vagues</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mensuels</CardTitle>
                <BarChart3 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistiques.rapportsMensuels}</div>
                <p className="text-xs text-gray-600">Cette année</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Espace</CardTitle>
                <FileText className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistiques.espaceUtilise}</div>
                <p className="text-xs text-gray-600">Rapports stockés</p>
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
            Filtrez les rapports par type ou vague
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Rechercher un rapport..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                <SelectItem value="vague">Par Vague</SelectItem>
                <SelectItem value="mensuel">Mensuels</SelectItem>
                <SelectItem value="annuel">Annuels</SelectItem>
                <SelectItem value="special">Spéciaux</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedVague} onValueChange={setSelectedVague}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes les vagues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les vagues</SelectItem>
                {vagues.map((vague) => (
                  <SelectItem key={vague.id} value={vague.nom}>
                    {vague.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter la liste
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des rapports */}
      <Card>
        <CardHeader>
          <CardTitle>Rapports Disponibles</CardTitle>
          <CardDescription>
            {loading ? "Chargement..." : `${filteredRapports.length} rapport(s) trouvé(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre du rapport</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Vague</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Statistiques</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Skeleton pour le tableau
                  Array.from({ length: 5 }).map((_, index) => (
                    <SkeletonTableRow key={index} />
                  ))
                ) : filteredRapports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Aucun rapport trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRapports.map((rapport) => (
                    <TableRow key={rapport.id} className="group hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            {rapport.titre}
                          </div>
                          <div className="text-sm text-gray-500 max-w-md">
                            {rapport.resume}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(rapport.type)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{rapport.vague}</Badge>
                      </TableCell>
                      <TableCell>{rapport.periode}</TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          <div>Inscriptions: {rapport.statistiques.inscriptions}</div>
                          <div>Paiements: {rapport.statistiques.paiements}</div>
                          <div>Cartes: {rapport.statistiques.cartesGenerees}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(rapport.dateGeneration).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {getStatutBadge(rapport.statut)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleExport(rapport.id, 'pdf')}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 data-[state=open]:bg-muted"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Ouvrir le menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white w-[160px]">
                              <DropdownMenuItem 
                                onClick={() => handleOuvrirModification(rapport)}
                                disabled={updating && actionLoading === rapport.id}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                {updating && actionLoading === rapport.id ? 'Modification...' : 'Modifier'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleOuvrirSuppression(rapport)}
                                disabled={deleting && actionLoading === rapport.id}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {deleting && actionLoading === rapport.id ? 'Suppression...' : 'Supprimer'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}