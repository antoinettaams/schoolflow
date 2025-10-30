"use client";
import React, { useState, useEffect } from "react";
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

// Interfaces
interface Vague {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "active" | "upcoming" | "completed";
  description?: string;
  filieres: string[];
  totalEtudiants: number;
  totalFormateurs: number;
}

interface VagueFormData {
  name: string;
  startDate: string;
  endDate: string;
  description: string;
}

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

// Composant Carte de Vague
const VagueCard: React.FC<{
  vague: Vague;
  onEdit: (vague: Vague) => void;
  onDelete: (id: string) => void;
  onViewDetails: (vague: Vague) => void;
}> = ({ vague, onEdit, onDelete, onViewDetails }) => {
  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{vague.name}</CardTitle>
          <StatusBadge status={vague.status} />
        </div>
        <CardDescription className="line-clamp-2">{vague.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-3 flex-grow">
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>Du {new Date(vague.startDate).toLocaleDateString("fr-FR")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>Au {new Date(vague.endDate).toLocaleDateString("fr-FR")}</span>
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
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onViewDetails(vague)}>
          <Eye className="h-4 w-4 mr-1" />
          Détails
        </Button>
        <Button variant="outline" size="sm" onClick={() => onEdit(vague)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(vague.id)}>
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
}> = ({ open, onOpenChange, onSubmit, initialData, title }) => {
  const [formData, setFormData] = useState<VagueFormData>({
    name: "",
    startDate: "",
    endDate: "",
    description: "",
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
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      startDate: "",
      endDate: "",
      description: "",
    });
    onOpenChange(false);
  };

  const getStatus = (startDate: string, endDate: string): Vague["status"] => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (today < start) return "upcoming";
    if (today > end) return "completed";
    return "active";
  };

  if (!open) return null;

  return (
    <Card className="mb-6 border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Créez une nouvelle vague de formation avec ses dates et description.
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
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
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
            />
          </div>

          {/* Aperçu */}
          {(formData.name || formData.startDate || formData.endDate) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Aperçu de la vague</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                {formData.name && <p><strong>Nom:</strong> {formData.name}</p>}
                {formData.startDate && (
                  <p><strong>Début:</strong> {new Date(formData.startDate).toLocaleDateString("fr-FR")}</p>
                )}
                {formData.endDate && (
                  <p><strong>Fin:</strong> {new Date(formData.endDate).toLocaleDateString("fr-FR")}</p>
                )}
                {formData.startDate && formData.endDate && (
                  <p>
                    <strong>Statut:</strong>{" "}
                    <StatusBadge status={getStatus(formData.startDate, formData.endDate)} />
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Annuler
            </Button>
            <Button type="submit">
              {initialData ? "Modifier" : "Créer"} la vague
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
}> = ({ open, onOpenChange, onConfirm }) => {
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
            >
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={onConfirm}
            >
              Supprimer
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedVague, setSelectedVague] = useState<Vague | null>(null);
  const [vagueToDelete, setVagueToDelete] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Charger depuis localStorage
  useEffect(() => {
    const savedVagues = localStorage.getItem("schoolflow_vagues_directeur");
    if (savedVagues) {
      try {
        setVagues(JSON.parse(savedVagues));
      } catch (error) {
        console.error("Erreur lors du chargement des vagues:", error);
        setVagues([]);
      }
    } else {
      // Données exemple
      setVagues([
        {
          id: "1",
          name: "Vague Janvier 2024",
          startDate: "2024-01-01",
          endDate: "2024-06-30",
          status: "active",
          description: "Session de formation principale",
          filieres: ["Informatique", "Commerce"],
          totalEtudiants: 150,
          totalFormateurs: 12,
        },
        {
          id: "2",
          name: "Vague Juillet 2024",
          startDate: "2024-07-01",
          endDate: "2024-12-31",
          status: "upcoming",
          description: "Session de formation estivale",
          filieres: ["Design", "Marketing"],
          totalEtudiants: 80,
          totalFormateurs: 8,
        },
        {
          id: "3",
          name: "Vague 2023",
          startDate: "2023-01-01",
          endDate: "2023-12-31",
          status: "completed",
          description: "Session de formation de l&apos;année dernière",
          filieres: ["Informatique", "Commerce", "Design"],
          totalEtudiants: 200,
          totalFormateurs: 15,
        },
      ]);
    }
    setIsLoaded(true);
  }, []);

  // Sauvegarder dans localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("schoolflow_vagues_directeur", JSON.stringify(vagues));
    }
  }, [vagues, isLoaded]);

  const getVagueStatus = (startDate: string, endDate: string): Vague["status"] => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (today < start) return "upcoming";
    if (today > end) return "completed";
    return "active";
  };

  const ajouterVague = (data: VagueFormData) => {
    const status = getVagueStatus(data.startDate, data.endDate);
    const vague: Vague = {
      id: Date.now().toString(),
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      status: status,
      description: data.description,
      filieres: [],
      totalEtudiants: 0,
      totalFormateurs: 0,
    };

    setVagues((prev) => [...prev, vague]);
    setShowAddForm(false);
  };

  const modifierVague = (data: VagueFormData) => {
    if (!selectedVague) return;

    const status = getVagueStatus(data.startDate, data.endDate);
    setVagues((prev) =>
      prev.map((v) =>
        v.id === selectedVague.id
          ? {
              ...v,
              ...data,
              status: status,
            }
          : v
      )
    );
    setShowEditForm(false);
    setSelectedVague(null);
  };

  const supprimerVague = (id: string) => {
    setVagues((prev) => prev.filter((v) => v.id !== id));
    setShowDeleteDialog(false);
    setVagueToDelete(null);
  };

  const filteredVagues = vagues.filter((vague) =>
    filterStatus === "all" ? true : vague.status === filterStatus
  );

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Chargement des vagues...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-y-auto">
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
            <Button onClick={() => setShowAddForm(true)} disabled={showAddForm || showEditForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle vague
            </Button>
          </div>

          {/* Formulaire d'ajout */}
          {showAddForm && (
            <VagueForm
              open={showAddForm}
              onOpenChange={setShowAddForm}
              onSubmit={ajouterVague}
              title="Nouvelle vague de formation"
            />
          )}

          {/* Formulaire de modification */}
          {showEditForm && selectedVague && (
            <VagueForm
              open={showEditForm}
              onOpenChange={setShowEditForm}
              onSubmit={modifierVague}
              initialData={{
                name: selectedVague.name,
                startDate: selectedVague.startDate,
                endDate: selectedVague.endDate,
                description: selectedVague.description || "",
              }}
              title="Modifier la vague"
            />
          )}

          {/* Statistiques */}
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

          {/* Filtres et Liste */}
          <Card>
            <CardHeader className="flex-shrink-0">
              <div className="flex justify-between items-center">
                <CardTitle>Liste des vagues</CardTitle>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
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
              </div>
            </CardHeader>
            
            <CardContent>
              {filteredVagues.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune vague trouvée</h3>
                  <p className="text-muted-foreground mb-4">
                    {filterStatus === "all" 
                      ? "Créez votre première vague de formation" 
                      : `Aucune vague ${filterStatus === "active" ? "en cours" : filterStatus === "upcoming" ? "à venir" : "terminée"}`}
                  </p>
                  {filterStatus === "all" && (
                    <Button onClick={() => setShowAddForm(true)}>
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
                        // Navigation vers la page de détails
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
        onConfirm={() => vagueToDelete && supprimerVague(vagueToDelete)}
      />
    </div>
  );
}