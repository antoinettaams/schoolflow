"use client";
import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar, 
  Play, 
  Pause,  
  Check, 
  List,  
  Users, 
  Eye,
  X,
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
  totalEtudiants: number;
  totalFormateurs: number;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  onViewDetails: (vague: Vague) => void;
}> = ({ vague, onViewDetails }) => {
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
          {vague.description && (
            <p className="text-muted-foreground text-xs line-clamp-2">{vague.description}</p>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2 pt-3">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onViewDetails(vague)}>
          <Eye className="h-4 w-4 mr-1" />
          Détails
        </Button>
      </CardFooter>
    </Card>
  );
};

// Composant Formulaire de Visualisation de Vague
const VagueViewForm: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vague: Vague | null;
}> = ({ open, onOpenChange, vague }) => {
  const [formData, setFormData] = useState<VagueFormData>({
    name: "",
    startDate: "",
    endDate: "",
    description: "",
    semestres: [],
  });

  useEffect(() => {
    if (vague) {
      setFormData({
        name: vague.name,
        startDate: vague.startDate,
        endDate: vague.endDate,
        description: vague.description || "",
        semestres: vague.semestres,
      });
    }
  }, [vague, open]);

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

  const getStatus = (startDate: string, endDate: string): Vague["status"] => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (today < start) return "upcoming";
    if (today > end) return "completed";
    return "active";
  };

  if (!open || !vague) return null;

  return (
    <Card className="mb-6 border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Détails de la vague</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Visualisation des détails de la vague de formation
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la vague</Label>
              <Input
                id="name"
                value={formData.name}
                disabled
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
                    disabled
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                    disabled
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="semestre2" className="text-sm font-normal cursor-pointer flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    Semestre 2
                  </Label>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {formData.semestres.length === 0 
                  ? "Aucun semestre sélectionné"
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
                disabled
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                disabled
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              rows={3}
              disabled
            />
          </div>

          {/* Détails supplémentaires */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informations complémentaires</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="flex items-center gap-2">
                <strong>Statut:</strong> 
                <StatusBadge status={getStatus(formData.startDate, formData.endDate)} />
              </div>
              
              <div className="flex items-center gap-2">
                <strong>Total étudiants:</strong> 
                <span>{vague.totalEtudiants}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <strong>Total formateurs:</strong> 
                <span>{vague.totalFormateurs}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <strong>Filieres associées:</strong> 
                <span>{vague.filieres.length}</span>
              </div>

              {vague.filieres.length > 0 && (
                <div className="mt-2">
                  <strong>Détails des filières:</strong>
                  <div className="mt-2 space-y-2">
                    {vague.filieres.map((filiere) => (
                      <div key={filiere.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{filiere.name}</span>
                        <div className="text-xs text-muted-foreground">
                          {filiere.totalEtudiants} étudiants • {filiere.totalFormateurs} formateurs
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <strong>Créée le:</strong> 
                <span>{new Date(vague.createdAt).toLocaleDateString("fr-FR")}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Fermer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
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

  // Fonction utilitaire pour extraire le message d'erreur
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    } else if (typeof error === 'string') {
      return error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return "Erreur inconnue lors du chargement des vagues";
  };

  // Charger depuis l'API
  const chargerVagues = async () => {
    try {
      setIsLoaded(false);
      const response = await fetch('/api/admin/vagues');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur de chargement');
      }
      
      const vaguesData = await response.json();
      setVagues(vaguesData);
    } catch (error) {
      console.error("Erreur chargement vagues:", error);
      toast.error(getErrorMessage(error));
      setVagues([]);
    } finally {
      setIsLoaded(true);
    }
  };

  // Charger les statistiques
  const chargerStatistiques = async () => {
    try {
      const response = await fetch('/api/admin/vagues?stats=true');
      
      if (response.ok) {
        const statsData = await response.json();
        console.log('Statistiques:', statsData);
        // Vous pouvez utiliser ces statistiques pour enrichir l'interface
      }
    } catch (error) {
      console.error("Erreur chargement statistiques:", error);
    }
  };

  useEffect(() => {
    chargerVagues();
    chargerStatistiques();
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

  // Gestionnaire pour visualiser les détails
  const handleViewDetails = (vague: Vague) => {
    setSelectedVague(vague);
    setShowViewForm(true);
  };

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
          {showViewForm && (
            <VagueViewForm
              open={showViewForm}
              onOpenChange={setShowViewForm}
              vague={selectedVague}
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
                      ? "Aucune vague n'a été créée" 
                      : "Aucune vague ne correspond aux filtres sélectionnés"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredVagues.map((vague) => (
                    <VagueCard
                      key={vague.id}
                      vague={vague}
                      onViewDetails={handleViewDetails}
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