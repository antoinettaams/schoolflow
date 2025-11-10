"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Mail, Phone, Euro, Trash2, FileDown, RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// Import des bibliothèques d'export
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  filiere: string;
  vague: string;
  dateInscription: string;
  statutPaiement: "paye";
  montant: number;
  montantPaye: number;
  resteAPayer: number;
  dateNaissance?: string;
  createdBy: string;
  paiements: Array<{
    montant: number;
    datePaiement: string;
    modePaiement: string;
  }>;
}

interface ApiResponse {
  inscriptions: Eleve[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalInscriptions: number;
    totalPayes: number;
    totalEnAttente: number;
    totalPartiels: number;
    chiffreAffaires: number;
    tauxValidation: number;
  };
}

// Composant Skeleton pour le tableau
const TableSkeleton = () => {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-2">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-8 w-8 ml-auto" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

// Composant Skeleton pour les cartes de statistiques
const StatsSkeleton = () => {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export default function ListeElevesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState<string>("toutes");
  const [selectedVague, setSelectedVague] = useState<string>("toutes");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [stats, setStats] = useState({
    totalInscriptions: 0,
    totalPayes: 0,
    totalEnAttente: 0,
    totalPartiels: 0,
    chiffreAffaires: 0,
    tauxValidation: 0
  });

  // Charger les données depuis l'API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedFiliere !== 'toutes') params.append('filiere', selectedFiliere);
      if (selectedVague !== 'toutes') params.append('vague', selectedVague);

      const response = await fetch(`/api/secretaires/eleves?${params}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const data: ApiResponse = await response.json();
      setEleves(data.inscriptions);
      setStats(data.stats);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, selectedFiliere, selectedVague]);

  const getInitials = (prenom: string, nom: string) => {
    return `${prenom[0]}${nom[0]}`.toUpperCase();
  };

  const getStatutPaiementBadge = () => {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        Payé
      </Badge>
    );
  };

  const handleSupprimerEleve = async (eleveId: string, eleveNom: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'apprenant ${eleveNom} ?`)) {
      return;
    }

    setIsDeleting(eleveId);
    try {
      const response = await fetch(`/api/secretaires/eleves?id=${eleveId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }

      toast.success(`Apprenant ${eleveNom} supprimé avec succès`);
      // Recharger les données
      await fetchData();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(null);
    }
  };

  // FONCTIONS D'EXPORT
  const exportToPDF = () => {
    if (eleves.length === 0) {
      toast.error("Aucune donnée à exporter en PDF");
      return;
    }

    const toastId = toast.loading("Génération du PDF en cours...");

    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        // En-tête du document
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text("Liste des Apprenants - Paiements Validés", 14, 15);
        
        // Informations générales
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(`Total des apprenants: ${eleves.length}`, 14, 25);
        doc.text(`Chiffre d'affaires: ${stats.chiffreAffaires.toLocaleString('fr-FR')} FCFA`, 14, 32);
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 39);

        // Préparation des données du tableau
        const tableData = eleves.map(eleve => [
          eleve.id,
          `${eleve.prenom} ${eleve.nom}`,
          eleve.email,
          eleve.telephone,
          eleve.filiere,
          eleve.vague,
          new Date(eleve.dateInscription).toLocaleDateString('fr-FR'),
          `${eleve.montant.toLocaleString('fr-FR')} FCFA`,
          "Payé"
        ]);

        // Tableau principal
        autoTable(doc, {
          head: [['ID', 'Nom', 'Email', 'Téléphone', 'Filière', 'Vague', 'Date Inscription', 'Montant', 'Statut']],
          body: tableData,
          startY: 50,
          styles: { 
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: { 
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          margin: { top: 50 },
          theme: 'grid'
        });

        // Pied de page
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${i} / ${pageCount} - Liste des apprenants`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }

        // Sauvegarde du fichier
        const fileName = `apprenants-payes-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        toast.success("PDF généré avec succès!", {
          icon: "📄",
          id: toastId
        });
        
      } catch (error) {
        console.error("Erreur lors de l'export PDF:", error);
        toast.error("Erreur lors de la génération du PDF", {
          icon: "❌",
          id: toastId
        });
      }
    }, 2000);
  };

  const exportToExcel = () => {
    if (eleves.length === 0) {
      toast.error("Aucune donnée à exporter en Excel");
      return;
    }

    const toastId = toast.loading("Export Excel en cours...");

    setTimeout(() => {
      try {
        // Préparation des données
        const data = eleves.map(eleve => ({
          'ID': eleve.id,
          'Nom': `${eleve.prenom} ${eleve.nom}`,
          'Email': eleve.email,
          'Téléphone': eleve.telephone,
          'Filière': eleve.filiere,
          'Vague': eleve.vague,
          'Date Inscription': new Date(eleve.dateInscription).toLocaleDateString('fr-FR'),
          'Montant Inscription': `${eleve.montant.toLocaleString('fr-FR')} FCFA`,
          'Montant Payé': `${eleve.montantPaye.toLocaleString('fr-FR')} FCFA`,
          'Reste à Payer': `${eleve.resteAPayer.toLocaleString('fr-FR')} FCFA`,
          'Statut Paiement': 'Payé'
        }));

        // Création du workbook
        const wb = utils.book_new();
        
        // Feuille principale
        const ws = utils.json_to_sheet(data);
        
        // En-têtes et métadonnées
        const metadata = [
          ["Liste des Apprenants - Paiements Validés"],
          [`Total des apprenants: ${eleves.length}`],
          [`Chiffre d'affaires total: ${stats.chiffreAffaires.toLocaleString('fr-FR')} FCFA`],
          [`Généré le: ${new Date().toLocaleDateString('fr-FR')}`],
          [] // ligne vide
        ];
        
        utils.sheet_add_aoa(ws, metadata, { origin: 'A1' });
        
        // Ajuster la largeur des colonnes
        const colWidths = [
          { wch: 8 },  // ID
          { wch: 20 }, // Nom
          { wch: 25 }, // Email
          { wch: 15 }, // Téléphone
          { wch: 25 }, // Filière
          { wch: 15 }, // Vague
          { wch: 15 }, // Date Inscription
          { wch: 15 }, // Montant Inscription
          { wch: 15 }, // Montant Payé
          { wch: 15 }, // Reste à Payer
          { wch: 12 }  // Statut
        ];
        ws['!cols'] = colWidths;

        utils.book_append_sheet(wb, ws, 'Apprenants Payés');

        // Sauvegarde
        const fileName = `apprenants-payes-${new Date().toISOString().split('T')[0]}.xlsx`;
        writeFile(wb, fileName);
        
        toast.success("Fichier Excel exporté!", {
          icon: "📊",
          id: toastId
        });
        
      } catch (error) {
        console.error("Erreur lors de l'export Excel:", error);
        toast.error("Erreur lors de l'export Excel", {
          icon: "❌",
          id: toastId
        });
      }
    }, 1500);
  };

  const exportToCSV = () => {
    if (eleves.length === 0) {
      toast.error("Aucune donnée à exporter en CSV");
      return;
    }

    const toastId = toast.loading("Export CSV en cours...");

    setTimeout(() => {
      try {
        const headers = ['ID', 'Nom', 'Email', 'Téléphone', 'Filière', 'Vague', 'Date Inscription', 'Montant', 'Statut Paiement'];
        
        const csvContent = [
          "Liste des Apprenants - Paiements Validés",
          `Total des apprenants: ${eleves.length}`,
          `Généré le: ${new Date().toLocaleDateString('fr-FR')}`,
          '',
          headers.join(','),
          ...eleves.map(eleve => [
            eleve.id,
            `"${eleve.prenom} ${eleve.nom}"`,
            `"${eleve.email}"`,
            `"${eleve.telephone}"`,
            `"${eleve.filiere}"`,
            `"${eleve.vague}"`,
            `"${new Date(eleve.dateInscription).toLocaleDateString('fr-FR')}"`,
            `"${eleve.montant.toLocaleString('fr-FR')} FCFA"`,
            '"Payé"'
          ].join(','))
        ].join('\n');

        // Création et téléchargement du fichier
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `apprenants-payes-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Fichier CSV généré!", {
          icon: "📋",
          id: toastId
        });
        
      } catch (error) {
        console.error("Erreur lors de l'export CSV:", error);
        toast.error("Erreur lors de l'export CSV", {
          icon: "❌",
          id: toastId
        });
      }
    }, 1000);
  };

  // Extraire les filières et vagues uniques pour les filtres
  const filieres = [...new Set(eleves.map(e => e.filiere).filter(Boolean))];
  const vagues = [...new Set(eleves.map(e => e.vague).filter(Boolean))];

  return (
    <div className="p-6 space-y-6 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 4000,
          },
        }}
      />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Liste des Apprenants</h1>
          <p className="text-gray-600 mt-2">
            Consultez les apprenants ayant payé leur inscription
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FileDown className="w-4 h-4" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white w-48">
              <DropdownMenuItem 
                onClick={exportToPDF}
                className="flex items-center cursor-pointer"
              >
                <FileDown className="w-4 h-4 mr-2 text-red-500" />
                <span>Export PDF</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={exportToExcel}
                className="flex items-center cursor-pointer"
              >
                <FileDown className="w-4 h-4 mr-2 text-green-500" />
                <span>Export Excel</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={exportToCSV}
                className="flex items-center cursor-pointer"
              >
                <FileDown className="w-4 h-4 mr-2 text-blue-500" />
                <span>Export CSV</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Inscriptions</CardTitle>
                <Euro className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalInscriptions}</div>
                <p className="text-xs text-gray-600">Toutes inscriptions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paiements Validés</CardTitle>
                <Euro className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPayes}</div>
                <p className="text-xs text-gray-600">Inscriptions payées</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de Validation</CardTitle>
                <Euro className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.tauxValidation}%</div>
                <p className="text-xs text-gray-600">Des inscriptions sont validées</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
                <Euro className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.chiffreAffaires.toLocaleString('fr-FR')}</div>
                <p className="text-xs text-gray-600">FCFA</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>
            Filtrez les apprenants par filière ou vague
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
                {filieres.map(filiere => (
                  <SelectItem key={filiere} value={filiere}>{filiere}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedVague} onValueChange={setSelectedVague}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes les vagues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Toutes les vagues</SelectItem>
                {vagues.map(vague => (
                  <SelectItem key={vague} value={vague}>{vague}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des élèves */}
      <Card>
        <CardHeader>
          <CardTitle>Apprenants ayant payé l'inscription</CardTitle>
          <CardDescription>
            {isLoading ? "Chargement..." : `${eleves.length} apprenant(s) trouvé(s)`}
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
                  <TableHead>Date d&apos;inscription</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut Paiement</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : eleves.length > 0 ? (
                  eleves.map((eleve) => (
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
                        {getStatutPaiementBadge()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleSupprimerEleve(eleve.id, `${eleve.prenom} ${eleve.nom}`)}
                          disabled={isDeleting === eleve.id}
                        >
                          <Trash2 className={`w-4 h-4 text-red-600 ${isDeleting === eleve.id ? 'opacity-50' : ''}`} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Aucun apprenant trouvé avec les critères sélectionnés
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}