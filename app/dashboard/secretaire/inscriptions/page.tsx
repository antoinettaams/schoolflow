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
import { Search, Filter, MoreHorizontal, UserPlus, Download, Euro, BookOpen } from "lucide-react";

interface Inscription {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateInscription: string;
  status: "en_attente" | "approuve" | "rejete";
  fraisInscription: number;
  filiere: string;
  vague: string;
}

// Données pour les filières et vagues
const FILIERES = [
  "Développement Web Fullstack",
  "Design Graphique & UI/UX", 
  "Marketing Digital",
  "Bureautique Avancée",
  "Comptabilité & Gestion"
];

const VAGUES = [
  "Vague 1 - 2024",
  "Vague 2 - 2024", 
  "Vague 3 - 2024"
];

const FRAIS_INSCRIPTION = 15000; // 15,000 FCFA

export default function InscriptionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState<string>("toutes");
  const [selectedVague, setSelectedVague] = useState<string>("toutes");
  const [selectedStatus, setSelectedStatus] = useState<string>("toutes");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [nouvelleInscription, setNouvelleInscription] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    dateNaissance: "",
    filiere: "",
    vague: ""
  });

  const [inscriptions, setInscriptions] = useState<Inscription[]>([
    {
      id: "1",
      nom: "Dupont",
      prenom: "Marie",
      email: "marie.dupont@email.com",
      telephone: "01 23 45 67 89",
      dateInscription: "2024-01-15",
      status: "en_attente",
      fraisInscription: FRAIS_INSCRIPTION,
      filiere: "Développement Web Fullstack",
      vague: "Vague 1 - 2024"
    },
    {
      id: "2", 
      nom: "Martin",
      prenom: "Luc",
      email: "luc.martin@email.com",
      telephone: "01 34 56 78 90",
      dateInscription: "2024-01-10",
      status: "approuve",
      fraisInscription: FRAIS_INSCRIPTION,
      filiere: "Design Graphique & UI/UX",
      vague: "Vague 1 - 2024"
    },
  ]);

  const getStatusBadge = (status: string) => {
    const variants = {
      en_attente: "warning",
      approuve: "success", 
      rejete: "destructive"
    };
    
    const labels = {
      en_attente: "En attente",
      approuve: "Approuvé",
      rejete: "Rejeté"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const handleNouvelleInscription = () => {
    const nouvelleInscriptionData: Inscription = {
      id: (inscriptions.length + 1).toString(),
      nom: nouvelleInscription.nom,
      prenom: nouvelleInscription.prenom,
      email: nouvelleInscription.email,
      telephone: nouvelleInscription.telephone,
      dateInscription: new Date().toISOString().split('T')[0],
      status: "en_attente",
      fraisInscription: FRAIS_INSCRIPTION,
      filiere: nouvelleInscription.filiere,
      vague: nouvelleInscription.vague
    };

    setInscriptions([...inscriptions, nouvelleInscriptionData]);
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
  };

  // Filtrage des inscriptions
  const filteredInscriptions = inscriptions.filter(inscription => {
    const matchesSearch = 
      inscription.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscription.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inscription.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFiliere = selectedFiliere === "toutes" || inscription.filiere === selectedFiliere;
    const matchesVague = selectedVague === "toutes" || inscription.vague === selectedVague;
    const matchesStatus = selectedStatus === "toutes" || inscription.status === selectedStatus;

    return matchesSearch && matchesFiliere && matchesVague && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 max-h-screen overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      {/* Header avec frais */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Inscriptions</h1>
          <p className="text-gray-600 mt-2">
            Gérez les demandes d'inscription des apprenants
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Euro className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-800">
                  Frais d'inscription: {FRAIS_INSCRIPTION.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </CardContent>
          </Card>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-principal hover:bg-principal/90">
                <UserPlus className="w-4 h-4 mr-2" />
                Nouvelle Inscription
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader>
                <DialogTitle>Nouvelle Inscription</DialogTitle>
                <DialogDescription>
                  Remplissez les informations du nouvel apprenant
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
                {/* Information sur les frais */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-blue-900">Frais d'Inscription</h4>
                        <p className="text-blue-700 text-sm">
                          Montant fixe pour toutes les inscriptions
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-900">
                          {FRAIS_INSCRIPTION.toLocaleString('fr-FR')} FCFA
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
                      placeholder="+33 1 23 45 67 89"
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
                        {FILIERES.map((filiere) => (
                          <SelectItem key={filiere} value={filiere}>
                            {filiere}
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
                        {VAGUES.map((vague) => (
                          <SelectItem key={vague} value={vague}>
                            {vague}
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
                      <span className="text-gray-600">Frais d'inscription:</span>
                      <span className="font-semibold">{FRAIS_INSCRIPTION.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600">Statut:</span>
                      <Badge variant="warning">En attente de paiement</Badge>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-lg font-semibold">Total à payer:</span>
                      <span className="text-lg font-bold text-principal">
                        {FRAIS_INSCRIPTION.toLocaleString('fr-FR')} FCFA
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
                  disabled={!nouvelleInscription.nom || !nouvelleInscription.prenom || !nouvelleInscription.email || !nouvelleInscription.telephone || !nouvelleInscription.filiere || !nouvelleInscription.vague}
                  className="bg-principal hover:bg-principal/90"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Créer l'inscription
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
            <CardTitle className="text-sm font-medium">Total Inscriptions</CardTitle>
            <UserPlus className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inscriptions.length}</div>
            <p className="text-xs text-gray-600">Apprenants inscrits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <UserPlus className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inscriptions.filter(i => i.status === "en_attente").length}
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
              {inscriptions
                .filter(i => i.status === "approuve")
                .reduce((sum, i) => sum + i.fraisInscription, 0)
                .toLocaleString('fr-FR')} FCFA
            </div>
            <p className="text-xs text-gray-600">Total perçu</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente de Paiement</CardTitle>
            <Euro className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inscriptions
                .filter(i => i.status === "en_attente")
                .reduce((sum, i) => sum + i.fraisInscription, 0)
                .toLocaleString('fr-FR')} FCFA
            </div>
            <p className="text-xs text-gray-600">À percevoir</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
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
                {FILIERES.map((filiere) => (
                  <SelectItem key={filiere} value={filiere}>
                    {filiere}
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
                {VAGUES.map((vague) => (
                  <SelectItem key={vague} value={vague}>
                    {vague}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Tous les statuts</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="approuve">Approuvé</SelectItem>
                <SelectItem value="rejete">Rejeté</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des inscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Inscriptions</CardTitle>
          <CardDescription>
            {filteredInscriptions.length} inscription(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom & Prénom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Filière</TableHead>
                  <TableHead>Vague</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Frais</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInscriptions.map((inscription) => (
                  <TableRow key={inscription.id}>
                    <TableCell className="font-medium">
                      {inscription.prenom} {inscription.nom}
                    </TableCell>
                    <TableCell>{inscription.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {inscription.filiere}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{inscription.vague}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(inscription.dateInscription).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {inscription.fraisInscription.toLocaleString('fr-FR')} FCFA
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(inscription.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Voir détails</DropdownMenuItem>
                          <DropdownMenuItem>Modifier</DropdownMenuItem>
                          <DropdownMenuItem>Approuver</DropdownMenuItem>
                          <DropdownMenuItem>Marquer comme payé</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Rejeter
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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