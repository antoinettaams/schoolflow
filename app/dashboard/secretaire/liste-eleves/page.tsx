"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Mail, Phone, MoreHorizontal, Euro } from "lucide-react";

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  filiere: string;
  vague: string;
  dateInscription: string;
  statutPaiement: "paye" | "en_retard" | "en_attente";
  montant: number;
}

export default function ListeElevesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState<string>("toutes");
  const [selectedVague, setSelectedVague] = useState<string>("toutes");
  const [selectedStatutPaiement, setSelectedStatutPaiement] = useState<string>("toutes");

  const [eleves] = useState<Eleve[]>([
    {
      id: "1",
      nom: "Martin",
      prenom: "Luc",
      email: "luc.martin@email.com",
      telephone: "01 23 45 67 89",
      filiere: "Développement Web Fullstack",
      vague: "Vague 1 - 2024",
      dateInscription: "2024-01-15",
      statutPaiement: "paye",
      montant: 15000
    },
    {
      id: "2",
      nom: "Dubois",
      prenom: "Sophie",
      email: "sophie.dubois@email.com",
      telephone: "01 34 56 78 90",
      filiere: "Design Graphique & UI/UX",
      vague: "Vague 1 - 2024",
      dateInscription: "2024-01-10",
      statutPaiement: "en_retard",
      montant: 15000
    },
    {
      id: "3",
      nom: "Bernard",
      prenom: "Pierre",
      email: "pierre.bernard@email.com",
      telephone: "01 45 67 89 01",
      filiere: "Marketing Digital",
      vague: "Vague 2 - 2024",
      dateInscription: "2024-02-01",
      statutPaiement: "en_attente",
      montant: 15000
    },
  ]);

  const getInitials = (prenom: string, nom: string) => {
    return `${prenom[0]}${nom[0]}`.toUpperCase();
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

  const handleAjouterEleve = () => {
    router.push("/dashboard/secretaire/inscriptions");
  };

  // Filtrage des élèves
  const filteredEleves = eleves.filter(eleve => {
    const matchesSearch = 
      eleve.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eleve.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eleve.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFiliere = selectedFiliere === "toutes" || eleve.filiere === selectedFiliere;
    const matchesVague = selectedVague === "toutes" || eleve.vague === selectedVague;
    const matchesStatutPaiement = selectedStatutPaiement === "toutes" || eleve.statutPaiement === selectedStatutPaiement;

    return matchesSearch && matchesFiliere && matchesVague && matchesStatutPaiement;
  });

  // Statistiques
  const totalPaye = eleves.filter(e => e.statutPaiement === "paye").length;
  const totalEnRetard = eleves.filter(e => e.statutPaiement === "en_retard").length;
  const totalEnAttente = eleves.filter(e => e.statutPaiement === "en_attente").length;

  return (
    <div className="p-6 space-y-6 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Liste des Apprenants</h1>
          <p className="text-gray-600 mt-2">
            Consultez les apprenants et leur statut de paiement
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Apprenants</CardTitle>
            <Euro className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eleves.length}</div>
            <p className="text-xs text-gray-600">Apprenants inscrits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paiements Payés</CardTitle>
            <Euro className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPaye}</div>
            <p className="text-xs text-gray-600">Paiements complétés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Retard</CardTitle>
            <Euro className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnRetard}</div>
            <p className="text-xs text-gray-600">Paiements en retard</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Euro className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnAttente}</div>
            <p className="text-xs text-gray-600">En attente de paiement</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>
            Filtrez les apprenants par filière, vague ou statut de paiement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
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

            <Select value={selectedStatutPaiement} onValueChange={setSelectedStatutPaiement}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Tous les statuts</SelectItem>
                <SelectItem value="paye">Payé</SelectItem>
                <SelectItem value="en_retard">En retard</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des élèves */}
      <Card>
        <CardHeader>
          <CardTitle>Apprenants inscrits</CardTitle>
          <CardDescription>
            {filteredEleves.length} apprenant(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Apprenant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Filière</TableHead>
                  <TableHead>Vague</TableHead>
                  <TableHead>Date d'inscription</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut Paiement</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEleves.map((eleve) => (
                  <TableRow key={eleve.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`/avatars/${eleve.id}.jpg`} />
                          <AvatarFallback>
                            {getInitials(eleve.prenom, eleve.nom)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {eleve.prenom} {eleve.nom}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {eleve.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3 h-3" />
                          {eleve.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Phone className="w-3 h-3" />
                          {eleve.telephone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {eleve.filiere}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{eleve.vague}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(eleve.dateInscription).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {eleve.montant.toLocaleString('fr-FR')} FCFA
                    </TableCell>
                    <TableCell>
                      {getStatutPaiementBadge(eleve.statutPaiement)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
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