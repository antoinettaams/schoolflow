"use client";
import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Play, 
  Pause, 
  Check, 
  List, 
  Users, 
  Eye,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

// Interfaces
interface Filiere {
  id: string;
  name: string;
  description?: string;
}

interface Vague {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "active" | "upcoming" | "completed";
  description?: string;
  filieres: Filiere[];
  totalEtudiants: number;
  totalFormateurs: number;
  semestres: string[];
}

interface VagueFormData {
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  semestres: string[];
}

// Service API
class VagueApiService {
  private baseUrl = "/api/censor/vagues";

  async getAllVagues(): Promise<Vague[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des vagues");
    }
    return response.json();
  }

  async createVague(data: VagueFormData): Promise<Vague> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur lors de la création de la vague");
    }
    
    return response.json();
  }

  async updateVague(id: string, data: VagueFormData): Promise<Vague> {
    const response = await fetch(this.baseUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, ...data }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur lors de la modification de la vague");
    }
    
    return response.json();
  }

  async deleteVague(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}?id=${id}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur lors de la suppression de la vague");
    }
  }
}

const vagueApiService = new VagueApiService();

// Composant Skeleton pour les cartes de vagues
const VagueCardSkeleton: React.FC = () => {
  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-32" />
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-3/4 mt-1" />
      </CardHeader>
      
      <CardContent className="pb-3 flex-grow space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2 pt-3">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
      </CardFooter>
    </Card>
  );
};

// Composant Skeleton pour les statistiques
const StatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Composant Badge de Statut
const StatusBadge: React.FC<{ status: Vague["status"] }> = ({ status }) => {
  const statusConfig = {
    active: {
      text: "En cours",
      variant: "default" as const,
      icon: <Play className="h-3 w-3" />,
    },
    upcoming: {
      text: "À venir",
      variant: "secondary" as const,
      icon: <Pause className="h-3 w-3" />,
    },
    completed: {
      text: "Terminée",
      variant: "outline" as const,
      icon: <Check className="h-3 w-3" />,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {config.text}
    </Badge>
  );
};

// Composant Badge Semestre
const SemestreBadge: React.FC<{ semestres: string[] }> = ({ semestres }) => {
  if (semestres.length === 2) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Semestre 1 & 2
      </Badge>
    );
  }
  
  if (semestres.includes("Semestre 1")) {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        Semestre 1
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
      Semestre 2
    </Badge>
  );
};

// Composant Carte de Vague
const VagueCard: React.FC<{
  vague: Vague;
  onEdit: (vague: Vague) => void;
  onDelete: (id: string) => void;
  onViewDetails: (vague: Vague) => void;
}> = ({ vague, onEdit, onDelete, onViewDetails }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{vague.name}</CardTitle>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={vague.status} />
            <SemestreBadge semestres={vague.semestres} />
          </div>
        </div>
        <CardDescription className="line-clamp-2">{vague.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-3 flex-grow">
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>Du {formatDate(vague.startDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>Au {formatDate(vague.endDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{vague.filieres.length} filière(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{vague.totalEtudiants} étudiant(s)</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2 pt-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onEdit(vague)}
          aria-label="Modifier la vague"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => onDelete(vague.id)}
          aria-label="Supprimer la vague"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

// Composant Formulaire de Vague
const VagueForm: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: VagueFormData) => void;
  initialData?: VagueFormData;
  title: string;
  isLoading?: boolean;
}> = ({ open, onOpenChange, onSubmit, initialData, title, isLoading = false }) => {
  const [formData, setFormData] = useState<VagueFormData>({
    name: "",
    startDate: "",
    endDate: "",
    description: "",
    semestres: [],
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: "",
        startDate: "",
        endDate: "",
        description: "",
        semestres: [],
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.semestres.length === 0) {
      alert("Veuillez sélectionner au moins un semestre");
      return;
    }
    
    onSubmit(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      startDate: "",
      endDate: "",
      description: "",
      semestres: [],
    });
    onOpenChange(false);
  };

  const handleSemestreChange = (semestre: string, checked: boolean) => {
    const newSemestres = checked
      ? [...formData.semestres, semestre]
      : formData.semestres.filter(s => s !== semestre);
    
    setFormData(prev => ({ ...prev, semestres: newSemestres }));
  };

  const getStatus = (startDate: string, endDate: string) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (today < start) return "upcoming";
    if (today > end) return "completed";
    return "active";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!open) return null;

  return (
    <Card className="mb-6 border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isLoading}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Créez une nouvelle vague de formation avec ses dates, semestres et description.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la vague *</Label>
              <Input
                id="name"
                placeholder="Ex: Vague Janvier-Juin 2024"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="semestres">Semestre(s) *</Label>
              <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="semestre1"
                    checked={formData.semestres.includes("Semestre 1")}
                    onChange={(e) => handleSemestreChange("Semestre 1", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <Label htmlFor="semestre1" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Semestre 1
                  </Label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="semestre2"
                    checked={formData.semestres.includes("Semestre 2")}
                    onChange={(e) => handleSemestreChange("Semestre 2", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <Label htmlFor="semestre2" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    Semestre 2
                  </Label>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {formData.semestres.length === 0 
                  ? "Sélectionnez au moins un semestre"
                  : formData.semestres.length === 2
                    ? "✓ Cette vague couvre les deux semestres"
                    : `✓ Cette vague couvre le ${formData.semestres[0]}`
                }
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description optionnelle de la vague..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              disabled={isLoading}
            />
          </div>

          {(formData.name || formData.startDate || formData.endDate || formData.semestres.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Aperçu de la vague</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                {formData.name && (
                  <div className="flex items-center gap-2">
                    <strong>Nom:</strong> 
                    <span>{formData.name}</span>
                  </div>
                )}
                {formData.semestres.length > 0 && (
                  <div className="flex items-center gap-2">
                    <strong>Semestre(s):</strong> 
                    <SemestreBadge semestres={formData.semestres} />
                  </div>
                )}
                {formData.startDate && (
                  <div className="flex items-center gap-2">
                    <strong>Début:</strong> 
                    <span>{formatDate(formData.startDate)}</span>
                  </div>
                )}
                {formData.endDate && (
                  <div className="flex items-center gap-2">
                    <strong>Fin:</strong> 
                    <span>{formatDate(formData.endDate)}</span>
                  </div>
                )}
                {formData.startDate && formData.endDate && (
                  <div className="flex items-center gap-2">
                    <strong>Statut:</strong> 
                    <StatusBadge status={getStatus(formData.startDate, formData.endDate)} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Chargement..." : initialData ? "Modifier" : "Créer"} la vague
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Composant de confirmation de suppression personnalisé
const DeleteConfirmation: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}> = ({ open, onOpenChange, onConfirm, isLoading = false }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background p-6 rounded-lg border shadow-lg max-w-md w-full mx-auto">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Êtes-vous sûr ?</h2>
            <p className="text-sm text-muted-foreground">
              Cette action supprimera définitivement la vague et toutes ses données associées.
              Cette action ne peut pas être annulée.
            </p>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Suppression..." : "Supprimer"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant Principal
export default function VaguesPageDirecteur() {
  const [vagues, setVagues] = useState<Vague[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedVague, setSelectedVague] = useState<Vague | null>(null);
  const [vagueToDelete, setVagueToDelete] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSemestre, setFilterSemestre] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  // Charger depuis l'API
  const loadVagues = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await vagueApiService.getAllVagues();
      setVagues(data);
    } catch (err) {
      console.error("Erreur lors du chargement des vagues:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des vagues");
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    loadVagues();
  }, []);

  const ajouterVague = async (data: VagueFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      const nouvelleVague = await vagueApiService.createVague(data);
      setVagues((prev) => [...prev, nouvelleVague]);
      setShowAddForm(false);
    } catch (err) {
      console.error("Erreur lors de l'ajout de la vague:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la création de la vague");
    } finally {
      setIsLoading(false);
    }
  };

  const modifierVague = async (data: VagueFormData) => {
    if (!selectedVague) return;

    try {
      setIsLoading(true);
      setError(null);
      const vagueModifiee = await vagueApiService.updateVague(selectedVague.id, data);
      setVagues((prev) =>
        prev.map((v) =>
          v.id === selectedVague.id ? vagueModifiee : v
        )
      );
      setShowEditForm(false);
      setSelectedVague(null);
    } catch (err) {
      console.error("Erreur lors de la modification de la vague:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la modification de la vague");
    } finally {
      setIsLoading(false);
    }
  };

  const supprimerVague = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await vagueApiService.deleteVague(id);
      setVagues((prev) => prev.filter((v) => v.id !== id));
      setShowDeleteDialog(false);
      setVagueToDelete(null);
    } catch (err) {
      console.error("Erreur lors de la suppression de la vague:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression de la vague");
    } finally {
      setIsLoading(false);
    }
  };

  // Semestres disponibles pour le filtre
  const availableSemestres = useMemo(() => {
    const allSemestres = vagues.flatMap(vague => vague.semestres);
    const uniqueSemestres = Array.from(new Set(allSemestres));
    
    return ["Tous", ...uniqueSemestres.sort()];
  }, [vagues]);

  const filteredVagues = vagues.filter((vague) => {
    const statusMatch = filterStatus === "all" ? true : vague.status === filterStatus;
    
    const semestreMatch = filterSemestre === "Tous" 
      ? true 
      : vague.semestres.includes(filterSemestre);
    
    return statusMatch && semestreMatch;
  });

  // Affichage du skeleton pendant le chargement initial
  if (!isLoaded) {
    return (
      <div className="flex flex-col h-screen bg-background overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
        <ScrollArea className="flex-1">
          <div className="container mx-auto p-6 space-y-6 max-w-7xl">
            {/* Skeleton pour l'en-tête */}
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>

            {/* Skeleton pour les statistiques */}
            <StatsSkeleton />

            {/* Skeleton pour la section des filtres */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <Skeleton className="h-6 w-40" />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-10 w-40" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, index) => (
                    <VagueCardSkeleton key={index} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      {/* Zone de contenu avec défilement vertical */}
      <ScrollArea className="flex-1">
        <div className="container mx-auto p-6 space-y-6 max-w-7xl">
          {/* En-tête */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestion des Vagues</h1>
              <p className="text-muted-foreground">
                {vagues.length} vague(s) créée(s) - Supervision de toutes les sessions de formation
              </p>
            </div>
            <Button 
              onClick={() => setShowAddForm(true)} 
              disabled={showAddForm || showEditForm || isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle vague
            </Button>
          </div>

          {/* Affichage des erreurs */}
          {error && (
            <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Formulaire d'ajout */}
          {showAddForm && (
            <VagueForm
              open={showAddForm}
              onOpenChange={setShowAddForm}
              onSubmit={ajouterVague}
              title="Nouvelle vague de formation"
              isLoading={isLoading}
            />
          )}

          {/* Formulaire de modification */}
          {showEditForm && (
            <VagueForm
              open={showEditForm}
              onOpenChange={setShowEditForm}
              onSubmit={modifierVague}
              initialData={selectedVague as VagueFormData}
              title="Modifier la vague"
              isLoading={isLoading}
            />
          )}

          {/* Statistiques */}
          {isLoading ? (
            <StatsSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Vagues</CardTitle>
                  <List className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{vagues.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En cours</CardTitle>
                  <Play className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {vagues.filter(v => v.status === "active").length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">À venir</CardTitle>
                  <Pause className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {vagues.filter(v => v.status === "upcoming").length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Terminées</CardTitle>
                  <Check className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {vagues.filter(v => v.status === "completed").length}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtres et Liste */}
          <Card>
            <CardHeader className="flex-shrink-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Liste des vagues</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus} disabled={isLoading}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les vagues</SelectItem>
                      <SelectItem value="active">En cours</SelectItem>
                      <SelectItem value="upcoming">À venir</SelectItem>
                      <SelectItem value="completed">Terminées</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterSemestre} onValueChange={setFilterSemestre} disabled={isLoading}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tous les semestres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les semestres</SelectItem>
                      {availableSemestres.map(semestre => (
                        <SelectItem key={semestre} value={semestre}>
                          {semestre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {isLoading && filteredVagues.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, index) => (
                    <VagueCardSkeleton key={index} />
                  ))}
                </div>
              ) : filteredVagues.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune vague trouvée</h3>
                  <p className="text-muted-foreground mb-4">
                    {filterStatus === "all" && filterSemestre === "Tous"
                      ? "Commencez par créer votre première vague de formation" 
                      : "Ajustez vos filtres pour voir plus de résultats"}
                  </p>
                  {(filterStatus === "all" && filterSemestre === "Tous") && (
                    <Button onClick={() => setShowAddForm(true)} disabled={isLoading}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une vague
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVagues.map((vague) => (
                    <VagueCard
                      key={vague.id}
                      vague={vague}
                      onEdit={(v) => {
                        setSelectedVague(v);
                        setShowEditForm(true);
                      }}
                      onDelete={(id) => {
                        setVagueToDelete(id);
                        setShowDeleteDialog(true);
                      }}
                      onViewDetails={(v) => {
                        setSelectedVague(v);
                        console.log("Voir détails de la vague:", v.name);
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Dialogue de suppression personnalisé */}
      <DeleteConfirmation
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={() => {
          if (vagueToDelete) {
            supprimerVague(vagueToDelete);
          }
        }}
        isLoading={isLoading}
      />
    </div>
  );
}