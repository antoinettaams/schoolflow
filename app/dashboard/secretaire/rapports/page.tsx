"use client";

import { useState } from "react";
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
import { Search, Download, FileText, Calendar, Eye, MoreHorizontal, BarChart3, Plus } from "lucide-react";

interface Rapport {
  id: string;
  titre: string;
  type: "vague" | "mensuel" | "annuel" | "special";
  vague: string;
  periode: string;
  dateGeneration: string;
  generePar: string;
  statut: "generé" | "en_cours" | "erreur";
  taille: string;
  resume: string;
  statistiques: {
    inscriptions: number;
    paiements: number;
    cartesGenerees: number;
    dossiersComplets: number;
  };
}

export default function RapportsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("tous");
  const [selectedVague, setSelectedVague] = useState<string>("toutes");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [nouveauRapport, setNouveauRapport] = useState({
    titre: "",
    type: "vague" as "vague" | "mensuel" | "annuel" | "special",
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

  const VAGUES = [
    "Vague 1 - 2024",
    "Vague 2 - 2024", 
    "Vague 3 - 2024"
  ];

  const [rapports, setRapports] = useState<Rapport[]>([
    {
      id: "RAP-V1-2024",
      titre: "Rapport Vague 1 - 2024",
      type: "vague",
      vague: "Vague 1 - 2024",
      periode: "Janvier - Mars 2024",
      dateGeneration: "2024-04-01",
      generePar: "Marie Dubois",
      statut: "generé",
      taille: "3.2 MB",
      resume: "Rapport complet de la première vague de formation avec analyse des performances",
      statistiques: {
        inscriptions: 45,
        paiements: 42,
        cartesGenerees: 40,
        dossiersComplets: 38
      }
    },
    {
      id: "RAP-M01-2024",
      titre: "Rapport Mensuel - Janvier 2024",
      type: "mensuel",
      vague: "Vague 1 - 2024",
      periode: "Janvier 2024",
      dateGeneration: "2024-02-01",
      generePar: "Système Automatique",
      statut: "generé",
      taille: "1.8 MB",
      resume: "Activités du mois de janvier : inscriptions, paiements et génération de cartes",
      statistiques: {
        inscriptions: 25,
        paiements: 22,
        cartesGenerees: 20,
        dossiersComplets: 18
      }
    },
  ]);

const getTypeBadge = (type: string) => {
  const types = {
    vague: { label: "Par Vague", variant: "default" as const },
    mensuel: { label: "Mensuel", variant: "secondary" as const },
    annuel: { label: "Annuel", variant: "outline" as const },
    special: { label: "Spécial", variant: "destructive" as const } // "success" → "destructive"
  };
  
  const config = types[type as keyof typeof types];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

  const getStatutBadge = (statut: string) => {
    const config = {
  generé: { label: "Généré", variant: "default" as const },
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

  const rapportsVague = rapports.filter(r => r.type === "vague").length;
  const rapportsMensuels = rapports.filter(r => r.type === "mensuel").length;

  const handleNouveauRapport = () => {
    // Simuler des statistiques basées sur les inclusions choisies
    const statistiques = {
      inscriptions: nouveauRapport.inclusions.inscriptions ? Math.floor(Math.random() * 50) + 20 : 0,
      paiements: nouveauRapport.inclusions.paiements ? Math.floor(Math.random() * 45) + 15 : 0,
      cartesGenerees: nouveauRapport.inclusions.cartes ? Math.floor(Math.random() * 40) + 10 : 0,
      dossiersComplets: nouveauRapport.inclusions.dossiers ? Math.floor(Math.random() * 35) + 5 : 0
    };

    const nouveauRapportData: Rapport = {
      id: `RAP-${Date.now()}`,
      titre: nouveauRapport.titre,
      type: nouveauRapport.type,
      vague: nouveauRapport.vague,
      periode: nouveauRapport.periode,
      dateGeneration: new Date().toISOString().split('T')[0],
      generePar: "Secrétaire",
      statut: "generé",
      taille: "2.1 MB",
      resume: nouveauRapport.resume,
      statistiques
    };

    setRapports([...rapports, nouveauRapportData]);
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
  };

  return (
    <div className="p-6 overflow-y-auto space-y-6 lg:pl-5 pt-20 lg:pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapports d&apos;Activité</h1>
          <p className="text-gray-600 mt-2">
            Consultez et générez les rapports du centre de formation
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-principal hover:bg-principal/90">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Rapport
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    <SelectContent>
                      <SelectItem value="vague">Par Vague</SelectItem>
                      <SelectItem value="mensuel">Mensuel</SelectItem>
                      <SelectItem value="annuel">Annuel</SelectItem>
                      <SelectItem value="special">Spécial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vague">Vague *</Label>
                  <Select
                    value={nouveauRapport.vague}
                    onValueChange={(value) => setNouveauRapport({ ...nouveauRapport, vague: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une vague" />
                    </SelectTrigger>
                    <SelectContent>
                      {VAGUES.map((vague) => (
                        <SelectItem key={vague} value={vague}>
                          {vague}
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
                      <span className="font-medium">{nouveauRapport.vague || "-"}</span>
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
                disabled={!nouveauRapport.titre || !nouveauRapport.vague || !nouveauRapport.periode}
                className="bg-principal hover:bg-principal/90"
              >
                <FileText className="w-4 h-4 mr-2" />
                Générer le rapport
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rapports</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rapports.length}</div>
            <p className="text-xs text-gray-600">Rapports générés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Par Vague</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rapportsVague}</div>
            <p className="text-xs text-gray-600">Rapports de vagues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensuels</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rapportsMensuels}</div>
            <p className="text-xs text-gray-600">Cette année</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espace</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45.2 MB</div>
            <p className="text-xs text-gray-600">Rapports stockés</p>
          </CardContent>
        </Card>
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
                {VAGUES.map((vague) => (
                  <SelectItem key={vague} value={vague}>
                    {vague}
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
            {filteredRapports.length} rapport(s) trouvé(s)
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
                {filteredRapports.map((rapport) => (
                  <TableRow key={rapport.id}>
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm">
                            <DropdownMenuItem>Modifier</DropdownMenuItem>
                            <DropdownMenuItem>Dupliquer</DropdownMenuItem>
                            <DropdownMenuItem>Partager</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}