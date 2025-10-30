"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Search, Download, Printer, MoreHorizontal, CreditCard, Mail } from "lucide-react";

interface CarteEtudiante {
  id: string;
  eleve: string;
  email: string;
  filiere: string;
  vague: string;
  numeroCarte: string;
  dateExpiration: string;
  statut: "active" | "inactive" | "en_attente" | "expiree";
  dateCreation: string;
  photo: string | null;
  qrCode: string | null;
}

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  filiere: string;
  vague: string;
  dateNaissance: string;
  statutPaiement: "paye" | "en_retard" | "en_attente";
}

export default function CartesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState<string>("toutes");
  const [selectedVague, setSelectedVague] = useState<string>("toutes");
  const [selectedStatut, setSelectedStatut] = useState<string>("toutes");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [nouvelleCarte, setNouvelleCarte] = useState({
    eleveId: "",
    dateExpiration: "",
    includeQRCode: true,
    includePhoto: true,
    restrictions: "",
    particularites: ""
  });

  // Liste des élèves éligibles (paiement validé)
  const [eleves] = useState<Eleve[]>([
    {
      id: "1",
      nom: "Dupont",
      prenom: "Marie",
      email: "marie.dupont@email.com",
      filiere: "Développement Web Fullstack",
      vague: "Vague 1 - 2024",
      dateNaissance: "2000-05-15",
      statutPaiement: "paye"
    },
    {
      id: "2",
      nom: "Martin",
      prenom: "Luc",
      email: "luc.martin@email.com",
      filiere: "Design Graphique & UI/UX",
      vague: "Vague 1 - 2024",
      dateNaissance: "1999-08-22",
      statutPaiement: "paye"
    },
    {
      id: "3",
      nom: "Bernard",
      prenom: "Sophie",
      email: "sophie.bernard@email.com",
      filiere: "Marketing Digital",
      vague: "Vague 2 - 2024",
      dateNaissance: "2001-03-10",
      statutPaiement: "en_attente"
    },
  ]);

  const [cartes, setCartes] = useState<CarteEtudiante[]>([
    {
      id: "1",
      eleve: "Marie Dupont",
      email: "marie.dupont@email.com",
      filiere: "Développement Web Fullstack",
      vague: "Vague 1 - 2024",
      numeroCarte: "CF-2024-001",
      dateExpiration: "2025-08-31",
      statut: "active",
      dateCreation: "2024-01-15",
      photo: null,
      qrCode: null
    },
    {
      id: "2",
      eleve: "Luc Martin",
      email: "luc.martin@email.com",
      filiere: "Design Graphique & UI/UX",
      vague: "Vague 1 - 2024",
      numeroCarte: "CF-2024-002",
      dateExpiration: "2024-06-30",
      statut: "expiree",
      dateCreation: "2024-01-10",
      photo: null,
      qrCode: null
    },
  ]);

  const getInitials = (nomComplet: string) => {
    return nomComplet
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getStatutBadge = (statut: string) => {
  const config = {
    active: { label: "Active", variant: "default" as const },
    inactive: { label: "Inactive", variant: "secondary" as const },
    en_attente: { label: "En attente", variant: "outline" as const },
    expiree: { label: "Expirée", variant: "destructive" as const }
  };
  
  const { label, variant } = config[statut as keyof typeof config] || config.inactive;
  return <Badge variant={variant}>{label}</Badge>;
};

  // Élèves éligibles pour une carte (paiement payé)
  const elevesEligibles = eleves.filter(eleve => eleve.statutPaiement === "paye");

  // Filtrage des cartes
  const filteredCartes = cartes.filter(carte => {
    const matchesSearch = 
      carte.eleve.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carte.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      carte.numeroCarte.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFiliere = selectedFiliere === "toutes" || carte.filiere === selectedFiliere;
    const matchesVague = selectedVague === "toutes" || carte.vague === selectedVague;
    const matchesStatut = selectedStatut === "toutes" || carte.statut === selectedStatut;

    return matchesSearch && matchesFiliere && matchesVague && matchesStatut;
  });

  const genererNumeroCarte = () => {
    const prefixe = "CF"; // Centre de Formation
    const annee = new Date().getFullYear();
    const sequence = (cartes.length + 1).toString().padStart(3, '0');
    return `${prefixe}-${annee}-${sequence}`;
  };

  const handleGenererCarte = () => {
    const eleve = eleves.find(e => e.id === nouvelleCarte.eleveId);
    if (!eleve) return;

    const nouvelleCarteData: CarteEtudiante = {
      id: (cartes.length + 1).toString(),
      eleve: `${eleve.prenom} ${eleve.nom}`,
      email: eleve.email,
      filiere: eleve.filiere,
      vague: eleve.vague,
      numeroCarte: genererNumeroCarte(),
      dateExpiration: nouvelleCarte.dateExpiration,
      statut: "active",
      dateCreation: new Date().toISOString().split('T')[0],
      photo: nouvelleCarte.includePhoto ? `/photos/${eleve.id}.jpg` : null,
      qrCode: nouvelleCarte.includeQRCode ? `QR-${eleve.id}` : null
    };

    setCartes([...cartes, nouvelleCarteData]);
    setIsDialogOpen(false);
    
    // Reset du formulaire
    setNouvelleCarte({
      eleveId: "",
      dateExpiration: "",
      includeQRCode: true,
      includePhoto: true,
      restrictions: "",
      particularites: ""
    });
  };

  const cartesExpirees = cartes.filter(c => c.statut === "expiree").length;
  const cartesActives = cartes.filter(c => c.statut === "active").length;

  return (
    <div className="p-6 space-y-6 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cartes d&apos;Apprenant</h1>
          <p className="text-gray-600 mt-2">
            Gérez les cartes d&apos;identification des apprenants
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Imprimer en lot
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-principal hover:bg-principal/90">
                <CreditCard className="w-4 h-4 mr-2" />
                Générer une carte
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Générer une nouvelle carte</DialogTitle>
                <DialogDescription>
                  Créez une carte d&apos;identification pour un apprenant
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Sélection de l'apprenant */}
                <div className="space-y-2">
                  <Label htmlFor="eleve">Apprenant *</Label>
                  <Select
                    value={nouvelleCarte.eleveId}
                    onValueChange={(value) => setNouvelleCarte({ ...nouvelleCarte, eleveId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un apprenant" />
                    </SelectTrigger>
                    <SelectContent>
                      {elevesEligibles.map((eleve) => (
                        <SelectItem key={eleve.id} value={eleve.id}>
                          {eleve.prenom} {eleve.nom} - {eleve.filiere}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Seuls les apprenants avec paiement validé sont affichés
                  </p>
                </div>

                {/* Date d'expiration */}
                <div className="space-y-2">
                  <Label htmlFor="dateExpiration">Date d&apos;expiration *</Label>
                  <Input
                    id="dateExpiration"
                    type="date"
                    value={nouvelleCarte.dateExpiration}
                    onChange={(e) => setNouvelleCarte({ ...nouvelleCarte, dateExpiration: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Options de la carte */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Options de la carte</CardTitle>
                    <CardDescription>
                      Personnalisez les éléments de la carte d&apos;identification
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="includePhoto">Photo d&apos;identité</Label>
                        <p className="text-sm text-gray-500">
                          Inclure la photo sur la carte
                        </p>
                      </div>
                      <Switch
                        id="includePhoto"
                        checked={nouvelleCarte.includePhoto}
                        onCheckedChange={(checked) => 
                          setNouvelleCarte({ ...nouvelleCarte, includePhoto: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="includeQRCode">QR Code</Label>
                        <p className="text-sm text-gray-500">
                          Générer un QR code avec les informations
                        </p>
                      </div>
                      <Switch
                        id="includeQRCode"
                        checked={nouvelleCarte.includeQRCode}
                        onCheckedChange={(checked) => 
                          setNouvelleCarte({ ...nouvelleCarte, includeQRCode: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Particularités du centre */}
                <div className="space-y-4">
                  <Label>Particularités du centre</Label>
                  
                  <div className="space-y-2">
                    <Label htmlFor="restrictions" className="text-sm">
                      Restrictions d&apos;accès
                    </Label>
                    <Textarea
                      id="restrictions"
                      placeholder="Ex: Accès labo informatique, Bibliothèque, Salle de repos..."
                      value={nouvelleCarte.restrictions}
                      onChange={(e) => setNouvelleCarte({ ...nouvelleCarte, restrictions: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="particularites" className="text-sm">
                      Informations spécifiques
                    </Label>
                    <Textarea
                      id="particularites"
                      placeholder="Ex: Formation en présentiel, Accès parking, Restaurant..."
                      value={nouvelleCarte.particularites}
                      onChange={(e) => setNouvelleCarte({ ...nouvelleCarte, particularites: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>

                {/* Aperçu de la carte */}
                {nouvelleCarte.eleveId && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                      <CardTitle className="text-blue-900">Aperçu de la carte</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Recto */}
                        <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-3">Recto</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium">Numéro:</span>
                              <span className="font-mono">{genererNumeroCarte()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Nom:</span>
                              <span>{eleves.find(e => e.id === nouvelleCarte.eleveId)?.prenom} {eleves.find(e => e.id === nouvelleCarte.eleveId)?.nom}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Filière:</span>
                              <span>{eleves.find(e => e.id === nouvelleCarte.eleveId)?.filiere}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Expire le:</span>
                              <span>{nouvelleCarte.dateExpiration ? new Date(nouvelleCarte.dateExpiration).toLocaleDateString('fr-FR') : '-'}</span>
                            </div>
                            {nouvelleCarte.includeQRCode && (
                              <div className="text-center mt-2 p-2 bg-gray-100 rounded">
                                [QR CODE]
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Verso */}
                        <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-3">Verso</h4>
                          <div className="space-y-2 text-sm">
                            {nouvelleCarte.restrictions && (
                              <div>
                                <div className="font-medium text-red-600">Restrictions:</div>
                                <div className="text-xs">{nouvelleCarte.restrictions}</div>
                              </div>
                            )}
                            {nouvelleCarte.particularites && (
                              <div>
                                <div className="font-medium text-green-600">Particularités:</div>
                                <div className="text-xs">{nouvelleCarte.particularites}</div>
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-4">
                              Carte propriété du centre de formation<br />
                              À restituer en fin de formation
                            </div>
                          </div>
                        </div>
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
                  onClick={handleGenererCarte}
                  disabled={!nouvelleCarte.eleveId || !nouvelleCarte.dateExpiration}
                  className="bg-principal hover:bg-principal/90"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Générer la carte
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cartes</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cartes.length}</div>
            <p className="text-xs text-gray-600">Cartes générées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actives</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cartesActives}</div>
            <p className="text-xs text-gray-600">En circulation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirées</CardTitle>
            <CreditCard className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cartesExpirees}</div>
            <p className="text-xs text-gray-600">À renouveler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cartes.filter(c => c.statut === "en_attente").length}
            </div>
            <p className="text-xs text-gray-600">En traitement</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>
            Filtrez les cartes par filière, vague ou statut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Rechercher une carte..."
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
                <SelectItem value="Développement Web Fullstack">Développement Web</SelectItem>
                <SelectItem value="Design Graphique & UI/UX">Design Graphique</SelectItem>
                <SelectItem value="Marketing Digital">Marketing Digital</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedVague} onValueChange={setSelectedVague}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes les vagues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les vagues</SelectItem>
                <SelectItem value="Vague 1 - 2024">Vague 1 - 2024</SelectItem>
                <SelectItem value="Vague 2 - 2024">Vague 2 - 2024</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatut} onValueChange={setSelectedStatut}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Tous les statuts</SelectItem>
                <SelectItem value="active">Actives</SelectItem>
                <SelectItem value="inactive">Inactives</SelectItem>
                <SelectItem value="expiree">Expirées</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des cartes */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Cartes</CardTitle>
          <CardDescription>
            {filteredCartes.length} carte(s) d&apos;apprenant(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Apprenant</TableHead>
                  <TableHead>Numéro de carte</TableHead>
                  <TableHead>Filière</TableHead>
                  <TableHead>Vague</TableHead>
                  <TableHead>Date d&apos;expiration</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCartes.map((carte) => (
                  <TableRow key={carte.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`/avatars/${carte.id}.jpg`} />
                          <AvatarFallback>
                            {getInitials(carte.eleve)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{carte.eleve}</div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Mail className="w-3 h-3" />
                            {carte.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {carte.numeroCarte}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {carte.filiere}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{carte.vague}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(carte.dateExpiration).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      {getStatutBadge(carte.statut)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Printer className="w-4 h-4 mr-1" />
                          Imprimer
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm">
                            <DropdownMenuItem>Renouveler</DropdownMenuItem>
                            <DropdownMenuItem>Désactiver</DropdownMenuItem>
                            <DropdownMenuItem>Modifier</DropdownMenuItem>
                            <DropdownMenuItem>Voir détails</DropdownMenuItem>
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