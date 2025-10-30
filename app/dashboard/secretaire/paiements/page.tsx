"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, MoreHorizontal, CheckCircle, XCircle, Clock, Plus } from "lucide-react";

interface Paiement {
  id: string;
  eleve: string;
  eleveId: string;
  montant: number;
  type: "inscription" | "scolarite" | "divers";
  dateEcheance: string;
  datePaiement: string | null;
  status: "paye" | "en_retard" | "en_attente";
  methode: string | null;
  description: string;
}

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  filiere: string;
  vague: string;
  statutPaiement: "paye" | "en_retard" | "en_attente";
}

export default function PaiementsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("tous");
  const [selectedStatus, setSelectedStatus] = useState<string>("tous");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [nouveauPaiement, setNouveauPaiement] = useState({
    eleveId: "",
    type: "inscription" as "inscription" | "scolarite" | "divers",
    montant: 15000,
    dateEcheance: "",
    description: "",
    methode: "especes" as "especes" | "virement" | "mobile_money" | "carte"
  });

  // Liste des élèves
  const [eleves] = useState<Eleve[]>([
    {
      id: "1",
      nom: "Dupont",
      prenom: "Marie",
      email: "marie.dupont@email.com",
      filiere: "Développement Web Fullstack",
      vague: "Vague 1 - 2024",
      statutPaiement: "paye"
    },
    {
      id: "2",
      nom: "Martin",
      prenom: "Luc",
      email: "luc.martin@email.com",
      filiere: "Design Graphique & UI/UX",
      vague: "Vague 1 - 2024",
      statutPaiement: "en_retard"
    },
    {
      id: "3",
      nom: "Bernard",
      prenom: "Sophie",
      email: "sophie.bernard@email.com",
      filiere: "Marketing Digital",
      vague: "Vague 2 - 2024",
      statutPaiement: "en_attente"
    },
  ]);

  const [paiements, setPaiements] = useState<Paiement[]>([
    {
      id: "PAY-001",
      eleve: "Marie Dupont",
      eleveId: "1",
      montant: 15000,
      type: "inscription",
      dateEcheance: "2024-01-30",
      datePaiement: "2024-01-15",
      status: "paye",
      methode: "especes",
      description: "Frais d'inscription"
    },
    {
      id: "PAY-002",
      eleve: "Luc Martin",
      eleveId: "2",
      montant: 15000,
      type: "inscription",
      dateEcheance: "2024-01-25",
      datePaiement: null,
      status: "en_retard",
      methode: null,
      description: "Frais d'inscription"
    },
    {
      id: "PAY-003",
      eleve: "Sophie Bernard",
      eleveId: "3",
      montant: 15000,
      type: "inscription",
      dateEcheance: "2024-02-15",
      datePaiement: null,
      status: "en_attente",
      methode: null,
      description: "Frais d'inscription"
    },
  ]);

  const getStatusBadge = (status: string) => {
    const config = {
      paye: { label: "Payé", variant: "success" as const, icon: CheckCircle },
      en_retard: { label: "En retard", variant: "destructive" as const, icon: XCircle },
      en_attente: { label: "En attente", variant: "warning" as const, icon: Clock }
    };
    
    const { label, variant, icon: Icon } = config[status as keyof typeof config];
    
    return (
      <Badge variant={variant as "default" | "secondary" | "destructive" | "outline"} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const getTypeColor = (type: string) => {
    const colors = {
      inscription: "text-blue-600 bg-blue-50",
      scolarite: "text-green-600 bg-green-50",
      divers: "text-gray-600 bg-gray-50"
    };
    return colors[type as keyof typeof colors];
  };

  const getMethodeLabel = (methode: string | null) => {
    const methodes = {
      especes: "Espèces",
      virement: "Virement",
      mobile_money: "Mobile Money",
      carte: "Carte Bancaire"
    };
    return methode ? methodes[methode as keyof typeof methodes] : "Non payé";
  };

  // Filtrage des paiements
  const filteredPaiements = paiements.filter(paiement => {
    const matchesSearch = 
      paiement.eleve.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paiement.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === "tous" || paiement.type === selectedType;
    const matchesStatus = selectedStatus === "tous" || paiement.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalEnAttente = paiements
    .filter(p => p.status === "en_attente")
    .reduce((sum, p) => sum + p.montant, 0);

  const totalEnRetard = paiements
    .filter(p => p.status === "en_retard")
    .reduce((sum, p) => sum + p.montant, 0);

  const totalPaye = paiements
    .filter(p => p.status === "paye")
    .reduce((sum, p) => sum + p.montant, 0);

  const handleNouveauPaiement = () => {
    const eleve = eleves.find(e => e.id === nouveauPaiement.eleveId);
    if (!eleve) return;

    const nouveauPaiementData: Paiement = {
      id: `PAY-${Date.now()}`,
      eleve: `${eleve.prenom} ${eleve.nom}`,
      eleveId: eleve.id,
      montant: nouveauPaiement.montant,
      type: nouveauPaiement.type,
      dateEcheance: nouveauPaiement.dateEcheance,
      datePaiement: null,
      status: "en_attente",
      methode: null,
      description: nouveauPaiement.description || `Paiement ${nouveauPaiement.type}`
    };

    setPaiements([...paiements, nouveauPaiementData]);
    setIsDialogOpen(false);
    
    // Reset du formulaire
    setNouveauPaiement({
      eleveId: "",
      type: "inscription",
      montant: 15000,
      dateEcheance: "",
      description: "",
      methode: "especes"
    });
  };

  const marquerCommePaye = (paiementId: string, methode: string) => {
    setPaiements(paiements.map(p => 
      p.id === paiementId 
        ? { 
            ...p, 
            status: "paye", 
            datePaiement: new Date().toISOString().split('T')[0],
            methode 
          }
        : p
    ));
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paiements des Inscriptions</h1>
          <p className="text-gray-600 mt-2">
            Gérez les paiements des inscriptions des apprenants
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-principal hover:bg-principal/90">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Paiement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nouveau Paiement</DialogTitle>
              <DialogDescription>
                Créez un nouveau paiement pour un apprenant
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Sélection de l'apprenant */}
              <div className="space-y-2">
                <Label htmlFor="eleve">Apprenant *</Label>
                <Select
                  value={nouveauPaiement.eleveId}
                  onValueChange={(value) => setNouveauPaiement({ ...nouveauPaiement, eleveId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un apprenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {eleves.map((eleve) => (
                      <SelectItem key={eleve.id} value={eleve.id}>
                        {eleve.prenom} {eleve.nom} - {eleve.filiere}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type de paiement */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Type de paiement *</Label>
                  <Select
                    value={nouveauPaiement.type}
                    onValueChange={(value: "inscription" | "scolarite" | "divers") => 
                      setNouveauPaiement({ ...nouveauPaiement, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type de paiement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inscription">Inscription</SelectItem>
                      <SelectItem value="scolarite">Scolarité</SelectItem>
                      <SelectItem value="divers">Divers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="montant">Montant (FCFA) *</Label>
                  <Input
                    id="montant"
                    type="number"
                    value={nouveauPaiement.montant}
                    onChange={(e) => setNouveauPaiement({ ...nouveauPaiement, montant: Number(e.target.value) })}
                    placeholder="15000"
                  />
                </div>
              </div>

              {/* Date d'échéance */}
              <div className="space-y-2">
                <Label htmlFor="dateEcheance">Date d&apos;échéance *</Label>
                <Input
                  id="dateEcheance"
                  type="date"
                  value={nouveauPaiement.dateEcheance}
                  onChange={(e) => setNouveauPaiement({ ...nouveauPaiement, dateEcheance: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Description du paiement..."
                  value={nouveauPaiement.description}
                  onChange={(e) => setNouveauPaiement({ ...nouveauPaiement, description: e.target.value })}
                />
              </div>

              {/* Récapitulatif */}
              {nouveauPaiement.eleveId && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-900">Récapitulatif</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800">Apprenant:</span>
                      <span className="font-medium">
                        {eleves.find(e => e.id === nouveauPaiement.eleveId)?.prenom}{" "}
                        {eleves.find(e => e.id === nouveauPaiement.eleveId)?.nom}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800">Type:</span>
                      <Badge variant="outline" className={getTypeColor(nouveauPaiement.type)}>
                        {nouveauPaiement.type.charAt(0).toUpperCase() + nouveauPaiement.type.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800">Montant:</span>
                      <span className="text-lg font-bold text-blue-900">
                        {nouveauPaiement.montant.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-800">Statut:</span>
                      <Badge variant="destructive">En attente</Badge>
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
                onClick={handleNouveauPaiement}
                disabled={!nouveauPaiement.eleveId || !nouveauPaiement.montant || !nouveauPaiement.dateEcheance}
                className="bg-principal hover:bg-principal/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer le paiement
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payé</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPaye.toLocaleString('fr-FR')} FCFA
            </div>
            <p className="text-xs text-gray-600">
              {paiements.filter(p => p.status === "paye").length} paiement(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnAttente.toLocaleString('fr-FR')} FCFA</div>
            <p className="text-xs text-gray-600">
              {paiements.filter(p => p.status === "en_attente").length} paiement(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Retard</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnRetard.toLocaleString('fr-FR')} FCFA</div>
            <p className="text-xs text-gray-600">
              {paiements.filter(p => p.status === "en_retard").length} paiement(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>
            Filtrez les paiements par type ou statut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Rechercher un paiement..."
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
                <SelectItem value="inscription">Inscription</SelectItem>
                <SelectItem value="scolarite">Scolarité</SelectItem>
                <SelectItem value="divers">Divers</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="paye">Payés</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="en_retard">En retard</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Paiements</CardTitle>
          <CardDescription>
            {filteredPaiements.length} paiement(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Paiement</TableHead>
                  <TableHead>Élève</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date Échéance</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPaiements.map((paiement) => (
                  <TableRow key={paiement.id}>
                    <TableCell className="font-medium">{paiement.id}</TableCell>
                    <TableCell>{paiement.eleve}</TableCell>
                    <TableCell className="font-semibold">
                      {paiement.montant.toLocaleString('fr-FR')} FCFA
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getTypeColor(paiement.type)}>
                        {paiement.type.charAt(0).toUpperCase() + paiement.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(paiement.dateEcheance).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      {paiement.methode ? (
                        <Badge variant="secondary">
                          {getMethodeLabel(paiement.methode)}
                        </Badge>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(paiement.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm">
                          <DropdownMenuItem>Voir détails</DropdownMenuItem>
                          <DropdownMenuItem>Modifier</DropdownMenuItem>
                          {paiement.status !== "paye" && (
                            <>
                              <DropdownMenuItem onClick={() => marquerCommePaye(paiement.id, "especes")}>
                                Marquer comme payé (Espèces)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => marquerCommePaye(paiement.id, "virement")}>
                                Marquer comme payé (Virement)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => marquerCommePaye(paiement.id, "mobile_money")}>
                                Marquer comme payé (Mobile Money)
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem>Envoyer rappel</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Supprimer
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