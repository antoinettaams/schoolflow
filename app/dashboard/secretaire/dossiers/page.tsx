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
import { Search, Filter, Download, Eye, MoreHorizontal, FileText, User, Mail, Plus, Upload, X } from "lucide-react";

interface Dossier {
  id: string;
  eleve: string;
  email: string;
  filiere: string;
  vague: string;
  dateInscription: string;
  statut: "complet" | "incomplet" | "en_attente";
  documents: {
    photoIdentite: File | null;
    acteNaissance: File | null;
    relevesNotes: File | null;
  };
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

export default function DossiersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState<string>("toutes");
  const [selectedVague, setSelectedVague] = useState<string>("toutes");
  const [selectedStatut, setSelectedStatut] = useState<string>("toutes");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [nouveauDossier, setNouveauDossier] = useState({
    eleveId: "",
    documents: {
      photoIdentite: null as File | null,
      acteNaissance: null as File | null,
      relevesNotes: null as File | null,
    }
  });

  // Liste des élèves avec compte actif (paiement payé)
  const [eleves] = useState<Eleve[]>([
    {
      id: "1",
      nom: "Martin",
      prenom: "Luc",
      email: "luc.martin@email.com",
      filiere: "Développement Web Fullstack",
      vague: "Vague 1 - 2024",
      statutPaiement: "paye"
    },
    {
      id: "2", 
      nom: "Dubois",
      prenom: "Sophie",
      email: "sophie.dubois@email.com",
      filiere: "Design Graphique & UI/UX",
      vague: "Vague 1 - 2024",
      statutPaiement: "paye"
    },
    {
      id: "3",
      nom: "Bernard",
      prenom: "Pierre",
      email: "pierre.bernard@email.com",
      filiere: "Marketing Digital",
      vague: "Vague 2 - 2024",
      statutPaiement: "en_attente"
    },
  ]);

  const [dossiers, setDossiers] = useState<Dossier[]>([
    {
      id: "DOS-001",
      eleve: "Luc Martin",
      email: "luc.martin@email.com",
      filiere: "Développement Web Fullstack",
      vague: "Vague 1 - 2024",
      dateInscription: "2024-01-15",
      statut: "complet",
      documents: {
        photoIdentite: null,
        acteNaissance: null,
        relevesNotes: null
      }
    },
    {
      id: "DOS-002",
      eleve: "Sophie Dubois",
      email: "sophie.dubois@email.com",
      filiere: "Design Graphique & UI/UX",
      vague: "Vague 1 - 2024",
      dateInscription: "2024-01-10",
      statut: "incomplet",
      documents: {
        photoIdentite: null,
        acteNaissance: null,
        relevesNotes: null
      }
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
      complet: { label: "Complet", variant: "success" as const },
      incomplet: { label: "Incomplet", variant: "destructive" as const },
      en_attente: { label: "En attente", variant: "warning" as const }
    };
    
    const { label, variant } = config[statut as keyof typeof config];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getStatutPaiementBadge = (statut: string) => {
    const config = {
      paye: { label: "Payé", variant: "success" as const },
      en_retard: { label: "En retard", variant: "destructive" as const },
      en_attente: { label: "En attente", variant: "warning" as const }
    };
    
    const { label, variant } = config[statut as keyof typeof config];
    return <Badge variant={variant}>{label}</Badge>;
  };

  // Filtrage des dossiers
  const filteredDossiers = dossiers.filter(dossier => {
    const matchesSearch = 
      dossier.eleve.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dossier.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFiliere = selectedFiliere === "toutes" || dossier.filiere === selectedFiliere;
    const matchesVague = selectedVague === "toutes" || dossier.vague === selectedVague;
    const matchesStatut = selectedStatut === "toutes" || dossier.statut === selectedStatut;

    return matchesSearch && matchesFiliere && matchesVague && matchesStatut;
  });

  // Élèves éligibles pour nouveau dossier (paiement payé)
  const elevesEligibles = eleves.filter(eleve => eleve.statutPaiement === "paye");

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

  const handleNouveauDossier = () => {
    const eleve = eleves.find(e => e.id === nouveauDossier.eleveId);
    if (!eleve) return;

    const nouveauDossierData: Dossier = {
      id: `DOS-${Date.now()}`,
      eleve: `${eleve.prenom} ${eleve.nom}`,
      email: eleve.email,
      filiere: eleve.filiere,
      vague: eleve.vague,
      dateInscription: new Date().toISOString().split('T')[0],
      statut: "complet", // Tous les documents sont requis pour créer le dossier
      documents: nouveauDossier.documents
    };

    setDossiers([...dossiers, nouveauDossierData]);
    setIsDialogOpen(false);
    
    // Reset du formulaire
    setNouveauDossier({
      eleveId: "",
      documents: {
        photoIdentite: null,
        acteNaissance: null,
        relevesNotes: null
      }
    });
  };

  const dossiersIncomplets = dossiers.filter(d => d.statut === "incomplet").length;
  const dossiersComplets = dossiers.filter(d => d.statut === "complet").length;

  // Vérifier si tous les documents sont uploadés
  const tousDocumentsUploades = 
    nouveauDossier.documents.photoIdentite && 
    nouveauDossier.documents.acteNaissance && 
    nouveauDossier.documents.relevesNotes;

  // Obtenir les documents manquants pour l'affichage
  const getDocumentsManquants = (dossier: Dossier) => {
    const manquants = [];
    if (!dossier.documents.photoIdentite) manquants.push("Photo d'identité");
    if (!dossier.documents.acteNaissance) manquants.push("Acte de naissance");
    if (!dossier.documents.relevesNotes) manquants.push("Relevés de notes");
    return manquants;
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dossiers Élèves</h1>
          <p className="text-gray-600 mt-2">
            Gérez et suivez l'état des dossiers des élèves
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-principal hover:bg-principal/90">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un dossier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouveau Dossier</DialogTitle>
                <DialogDescription>
                  Sélectionnez un élève et téléversez les documents requis
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="eleve">Élève *</Label>
                  <Select
                    value={nouveauDossier.eleveId}
                    onValueChange={(value) => setNouveauDossier({ ...nouveauDossier, eleveId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un élève" />
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
                    Seuls les élèves avec paiement validé sont affichés
                  </p>
                </div>

                {/* Upload des documents */}
                <div className="space-y-4">
                  <Label>Documents requis *</Label>
                  
                  {/* Photo d'identité */}
                  <div className="space-y-2">
                    <Label htmlFor="photoIdentite" className="text-sm font-medium">
                      Photo d'identité
                    </Label>
                    {!nouveauDossier.documents.photoIdentite ? (
                      <div className="flex items-center gap-3">
                        <Input
                          id="photoIdentite"
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('photoIdentite', file);
                          }}
                          className="flex-1"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            {nouveauDossier.documents.photoIdentite.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('photoIdentite')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Acte de naissance */}
                  <div className="space-y-2">
                    <Label htmlFor="acteNaissance" className="text-sm font-medium">
                      Acte de naissance
                    </Label>
                    {!nouveauDossier.documents.acteNaissance ? (
                      <div className="flex items-center gap-3">
                        <Input
                          id="acteNaissance"
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('acteNaissance', file);
                          }}
                          className="flex-1"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            {nouveauDossier.documents.acteNaissance.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('acteNaissance')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Relevés de notes */}
                  <div className="space-y-2">
                    <Label htmlFor="relevesNotes" className="text-sm font-medium">
                      Relevés de notes
                    </Label>
                    {!nouveauDossier.documents.relevesNotes ? (
                      <div className="flex items-center gap-3">
                        <Input
                          id="relevesNotes"
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('relevesNotes', file);
                          }}
                          className="flex-1"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            {nouveauDossier.documents.relevesNotes.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile('relevesNotes')}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
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
                        <Badge variant={tousDocumentsUploades ? "success" : "warning"}>
                          {Object.values(nouveauDossier.documents).filter(Boolean).length}/3
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-800">Statut du dossier:</span>
                        <Badge variant={tousDocumentsUploades ? "success" : "destructive"}>
                          {tousDocumentsUploades ? "Complet" : "Incomplet"}
                        </Badge>
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
                  onClick={handleNouveauDossier}
                  disabled={!nouveauDossier.eleveId || !tousDocumentsUploades}
                  className="bg-principal hover:bg-principal/90"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Créer le dossier
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
            <CardTitle className="text-sm font-medium">Total Dossiers</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dossiers.length}</div>
            <p className="text-xs text-gray-600">Dossiers élèves</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complets</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dossiersComplets}</div>
            <p className="text-xs text-gray-600">Dossiers finalisés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incomplets</CardTitle>
            <FileText className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dossiersIncomplets}</div>
            <p className="text-xs text-gray-600">Documents manquants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Élèves Éligibles</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{elevesEligibles.length}</div>
            <p className="text-xs text-gray-600">Paiement validé</p>
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
          <div className="flex flex-wrap items-center gap-4 mb-6">
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
                <SelectItem value="complet">Complets</SelectItem>
                <SelectItem value="incomplet">Incomplets</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
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
            {filteredDossiers.length} dossier(s) élève(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Élève</TableHead>
                  <TableHead>Filière</TableHead>
                  <TableHead>Vague</TableHead>
                  <TableHead>Date d'inscription</TableHead>
                  <TableHead>Statut du dossier</TableHead>
                  <TableHead>Documents manquants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDossiers.map((dossier) => {
                  const documentsManquants = getDocumentsManquants(dossier);
                  return (
                    <TableRow key={dossier.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={`/avatars/${dossier.id}.jpg`} />
                            <AvatarFallback>
                              {getInitials(dossier.eleve)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{dossier.eleve}</div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Mail className="w-3 h-3" />
                              {dossier.email}
                            </div>
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
                        {new Date(dossier.dateInscription).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {getStatutBadge(dossier.statut)}
                      </TableCell>
                      <TableCell>
                        {documentsManquants.length > 0 ? (
                          <div className="space-y-1">
                            <div className="text-sm text-red-600 font-medium">
                              {documentsManquants.length} document(s) manquant(s)
                            </div>
                            <div className="text-xs text-red-500">
                              {documentsManquants.slice(0, 2).join(', ')}
                              {documentsManquants.length > 2 && '...'}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-green-600 font-medium">Dossier complet</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm">
                              <DropdownMenuItem>Voir détails du dossier</DropdownMenuItem>
                              <DropdownMenuItem>Modifier le statut</DropdownMenuItem>
                              <DropdownMenuItem>Télécharger le dossier</DropdownMenuItem>
                              <DropdownMenuItem>Envoyer un rappel</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Archiver
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}