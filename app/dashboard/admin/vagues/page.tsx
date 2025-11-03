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
  X,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "react-hot-toast";

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
  createdBy?: string;
}

interface VagueFormData {
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  semestres: string[];
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

// Composant Badge Semestre
const SemestreBadge: React.FC<{ semestres: string[] }> = ({ semestres }) => {
  if (semestres.length === 2) {
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Semestre 1 & 2</Badge>;
  }
  if (semestres.includes("Semestre 1")) {
    return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Semestre 1</Badge>;
  }
  return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Semestre 2</Badge>;
};

// Composant Carte de Vague
const VagueCard: React.FC<{
  vague: Vague;
  onEdit: (vague: Vague) => void;
  onDelete: (id: string) => void;
  onViewDetails: (vague: Vague) => void;
  isAdmin?: boolean;
}> = ({ vague, onEdit, onDelete, onViewDetails, isAdmin = false }) => {
  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
  {/* CardHeader OUVERTE ici */}
  <CardHeader className="pb-3">
    <div className="flex justify-between items-start">
      <CardTitle className="text-lg">{vague.name}</CardTitle>
      <div className="flex flex-col items-end gap-2">
        <StatusBadge status={vague.status} />
        <SemestreBadge semestres={vague.semestres} />
      </div>
    </div>
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
    {!isAdmin && (
      <>
        <Button variant="outline" size="sm" onClick={() => onEdit(vague)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(vague.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </>
    )}
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
  isAdmin?: boolean;
}> = ({ open, onOpenChange, onSubmit, initialData, title, isAdmin = false }) => {
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
    
    if (formData.semestres.length === 0 && !isAdmin) {
      toast.error("Veuillez sélectionner au moins un semestre");
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
    if (isAdmin) return;
    
    const newSemestres = checked
      ? [...formData.semestres, semestre]
      : formData.semestres.filter(s => s !== semestre);
    setFormData(prev => ({ ...prev, semestres: newSemestres }));
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
          {isAdmin ? "Visualisation des détails de la vague" : "Créez une nouvelle vague de formation avec ses dates, semestres et description."}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la vague</Label>
              <Input
                id="name"
                placeholder="Ex: Vague Janvier-Juin 2024"
                value={formData.name}
                onChange={(e) => !isAdmin && setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                disabled={isAdmin}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="semestres">Semestre(s)</Label>
              <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="semestre1"
                    checked={formData.semestres.includes("Semestre 1")}
                    onChange={(e) => handleSemestreChange("Semestre 1", e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isAdmin}
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
                    disabled={isAdmin}
                  />
                  <Label htmlFor="semestre2" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    Semestre 2
                  </Label>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {formData.semestres.length === 0 
                  ? isAdmin ? "Aucun semestre sélectionné" : "Sélectionnez au moins un semestre"
                  : formData.semestres.length === 2
                    ? "✓ Cette vague couvre les deux semestres"
                    : `✓ Cette vague couvre le ${formData.semestres[0]}`
                }
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => !isAdmin && setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
                disabled={isAdmin}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => !isAdmin && setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
                disabled={isAdmin}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description optionnelle de la vague..."
              value={formData.description}
              onChange={(e) => !isAdmin && setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              disabled={isAdmin}
            />
          </div>

          {/* Aperçu */}
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
                    <span>{new Date(formData.startDate).toLocaleDateString("fr-FR")}</span>
                  </div>
                )}
                {formData.endDate && (
                  <div className="flex items-center gap-2">
                    <strong>Fin:</strong> 
                    <span>{new Date(formData.endDate).toLocaleDateString("fr-FR")}</span>
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
            <Button type="button" variant="outline" onClick={handleCancel}>
              {isAdmin ? "Fermer" : "Annuler"}
            </Button>
            {!isAdmin && (
              <Button type="submit">
                {initialData ? "Modifier" : "Créer"} la vague
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Composant de confirmation de suppression
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

// Composant Principal pour Admin
export default function VaguesPageAdmin() {
  const [vagues, setVagues] = useState<Vague[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showViewForm, setShowViewForm] = useState(false);
  const [selectedVague, setSelectedVague] = useState<Vague | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSemestre, setFilterSemestre] = useState<string>("Tous");

  // Charger depuis l'API
  const chargerVagues = async () => {
    try {
      const response = await fetch('/api/admin/vagues');
      
      if (!response.ok) {
        throw new Error('Erreur de chargement');
      }
      
      const vaguesData = await response.json();
      setVagues(vaguesData);
    } catch (error) {
      console.error("Erreur chargement vagues:", error);
      toast.error("Erreur lors du chargement des vagues");
      setVagues([
        {
          id: "1",
          name: "Vague Janvier 2024",
          startDate: "2024-01-01",
          endDate: "2024-06-30",
          status: "active",
          description: "Session de formation principale créée par le censeur",
          filieres: [
            { id: "1", name: "Informatique", description: "Filière informatique" },
            { id: "2", name: "Commerce", description: "Filière commerce" }
          ],
          totalEtudiants: 150,
          totalFormateurs: 12,
          semestres: ["Semestre 1", "Semestre 2"],
          createdBy: "Censeur Dupont"
        },
        {
          id: "2",
          name: "Vague Juillet 2024",
          startDate: "2024-07-01",
          endDate: "2024-12-31",
          status: "upcoming",
          description: "Session de formation estivale",
          filieres: [
            { id: "3", name: "Design", description: "Filière design" },
            { id: "4", name: "Marketing", description: "Filière marketing" }
          ],
          totalEtudiants: 80,
          totalFormateurs: 8,
          semestres: ["Semestre 1"],
          createdBy: "Censeur Martin"
        },
        {
          id: "3",
          name: "Vague 2023",
          startDate: "2023-01-01",
          endDate: "2023-12-31",
          status: "completed",
          description: "Session de formation de l'année dernière",
          filieres: [
            { id: "1", name: "Informatique", description: "Filière informatique" },
            { id: "2", name: "Commerce", description: "Filière commerce" },
            { id: "3", name: "Design", description: "Filière design" }
          ],
          totalEtudiants: 200,
          totalFormateurs: 15,
          semestres: ["Semestre 2"],
          createdBy: "Censeur Dubois"
        },
      ]);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    chargerVagues();
  }, []);

  const availableSemestres = useMemo(() => {
    const allSemestres = vagues.flatMap(vague => vague.semestres);
    const uniqueSemestres = Array.from(new Set(allSemestres));
    
    return ["Tous", ...uniqueSemestres.sort()];
  }, [vagues]);

  const filteredVagues = vagues.filter((vague) => {
    const statusMatch = filterStatus === "all" ? true : vague.status === filterStatus;
    const semestreMatch = filterSemestre === "Tous" ? true : vague.semestres.includes(filterSemestre);
    return statusMatch && semestreMatch;
  });

  // Statistiques par créateur
  const statsParCreateur = useMemo(() => {
    const createurs: { [key: string]: number } = {};
    vagues.forEach(vague => {
      const createur = vague.createdBy || "Non spécifié";
      createurs[createur] = (createurs[createur] || 0) + 1;
    });
    return createurs;
  }, [vagues]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Chargement des vagues...</div>
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
              <h1 className="text-3xl font-bold tracking-tight">Supervision des Vagues</h1>
              <p className="text-muted-foreground">
                {vagues.length} vague(s) créée(s) 
              </p>
            </div>
          </div>

          {/* Formulaire de visualisation */}
          {showViewForm && selectedVague && (
            <VagueForm
              open={showViewForm}
              onOpenChange={setShowViewForm}
              onSubmit={() => {}}
              initialData={{
                name: selectedVague.name,
                startDate: selectedVague.startDate,
                endDate: selectedVague.endDate,
                description: selectedVague.description || "",
                semestres: selectedVague.semestres,
              }}
              title="Détails de la vague"
              isAdmin={true}
            />
          )}

          {/* Statistiques générales */}
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-2">
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
                  
                  <Select value={filterSemestre} onValueChange={setFilterSemestre}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tous les semestres" />
                    </SelectTrigger>
                    <SelectContent>
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
              {filteredVagues.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune vague trouvée</h3>
                  <p className="text-muted-foreground mb-4">
                    {filterStatus === "all" && filterSemestre === "Tous"
                      ? "Aucune vague n'a été créée par les censeurs" 
                      : "Aucune vague ne correspond aux filtres sélectionnés"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVagues.map((vague) => (
                    <VagueCard
                      key={vague.id}
                      vague={vague}
                      onEdit={() => {}} 
                      onDelete={() => {}}
                      onViewDetails={(v) => {
                        setSelectedVague(v);
                        setShowViewForm(true);
                      }}
                      isAdmin={true}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}