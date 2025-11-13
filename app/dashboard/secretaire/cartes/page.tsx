"use client";

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Download, Printer, MoreHorizontal, CreditCard, Mail, RefreshCw, Upload, User, Calendar, BookOpen, FileText, FileSpreadsheet, FileCode } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

// Import des bibliothèques d'export
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';

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
  numeroEtudiant: string;
  dateNaissance: string;
}

interface Eleve {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  filiere: string;
  vague: string;
  dateNaissance: string;
  numeroEtudiant: string;
  statutPaiement: "paye" | "en_retard" | "en_attente";
}

interface Statistiques {
  total: number;
  actives: number;
  expirees: number;
  enAttente: number;
}

interface EtablissementInfo {
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  logo: string;
  directeur: string;
}

export default function CartesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState<string>("toutes");
  const [selectedVague, setSelectedVague] = useState<string>("toutes");
  const [selectedStatut, setSelectedStatut] = useState<string>("toutes");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingEleves, setLoadingEleves] = useState(false);
  
  const [cartes, setCartes] = useState<CarteEtudiante[]>([]);
  const [elevesEligibles, setElevesEligibles] = useState<Eleve[]>([]);
  const [statistiques, setStatistiques] = useState<Statistiques>({
    total: 0,
    actives: 0,
    expirees: 0,
    enAttente: 0
  });

  const [etablissementInfo] = useState<EtablissementInfo>({
    nom: "Centre de Formation Excellence",
    adresse: "123 Rue de l'Éducation, 75000 Paris",
    telephone: "+33 1 23 45 67 89",
    email: "contact@formation-excellence.fr",
    logo: "/logo-centre.png",
    directeur: "Dr. Jean Martin"
  });

  const [nouvelleCarte, setNouvelleCarte] = useState({
    eleveId: "",
    dateExpiration: "",
    includeQRCode: true,
    includePhoto: true,
    dureeValidite: "12",
  });

  // Charger les données
  const chargerDonnees = async () => {
    setLoading(true);
    setLoadingStats(true);
    
    try {
      const [cartesRes, statsRes] = await Promise.all([
        fetch('/api/secretaires/cartes'),
        fetch('/api/secretaires/cartes?action=statistiques')
      ]);

      if (cartesRes.ok) {
        const cartesData = await cartesRes.json();
        setCartes(cartesData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStatistiques(statsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setLoadingStats(false);
    }
  };

  // Charger les étudiants éligibles
  const chargerElevesEligibles = async () => {
    setLoadingEleves(true);
    try {
      const res = await fetch('/api/secretaires/cartes?action=eleves-eligibles');
      if (res.ok) {
        const data = await res.json();
        setElevesEligibles(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des étudiants éligibles:', error);
      toast.error('Erreur lors du chargement des étudiants éligibles');
    } finally {
      setLoadingEleves(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  useEffect(() => {
    if (isDialogOpen) {
      chargerElevesEligibles();
    }
  }, [isDialogOpen]);

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

  const calculerDateExpiration = (dureeMois: string) => {
    const date = new Date();
    date.setMonth(date.getMonth() + parseInt(dureeMois));
    return date.toISOString().split('T')[0];
  };

  const handleGenererCarte = async () => {
    try {
      const res = await fetch('/api/secretaires/cartes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: nouvelleCarte.eleveId,
          dateExpiration: nouvelleCarte.dateExpiration,
          includeQRCode: nouvelleCarte.includeQRCode,
          includePhoto: nouvelleCarte.includePhoto,
        }),
      });

      if (res.ok) {
        const nouvelleCarteData = await res.json();
        setCartes(prev => [nouvelleCarteData, ...prev]);
        setIsDialogOpen(false);
        
        // Reset du formulaire
        setNouvelleCarte({
          eleveId: "",
          dateExpiration: "",
          includeQRCode: true,
          includePhoto: true,
          dureeValidite: "12",
        });

        chargerDonnees();
        toast.success("Carte générée avec succès!");
      } else {
        const error = await res.json();
        toast.error(error.error || 'Erreur lors de la création de la carte');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création de la carte');
    }
  };

  const handleRenouvelerCarte = async (carteId: string) => {
    try {
      const res = await fetch('/api/secretaires/cartes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'renouveler',
          carteId,
          dateExpiration: calculerDateExpiration("12")
        }),
      });

      if (res.ok) {
        const nouvelleCarteData = await res.json();
        setCartes(prev => [nouvelleCarteData, ...prev]);
        chargerDonnees();
        toast.success('Carte renouvelée avec succès');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Erreur lors du renouvellement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du renouvellement');
    }
  };

  const handleSupprimerCarte = async (carteId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette carte ?')) return;

    try {
      const res = await fetch(`/api/secretaires/cartes?id=${carteId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCartes(prev => prev.filter(c => c.id !== carteId));
        chargerDonnees();
        toast.success('Carte supprimée avec succès');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // FONCTIONS D'EXPORT
  const exportToPDF = () => {
    if (!cartes || cartes.length === 0) {
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
        doc.text("Liste des Cartes Étudiantes", 14, 15);
        
        // Informations de l'établissement
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(`Établissement: ${etablissementInfo.nom}`, 14, 25);
        doc.text(`Total des cartes: ${statistiques.total}`, 14, 32);
        doc.text(`Actives: ${statistiques.actives} | Expirées: ${statistiques.expirees}`, 14, 39);
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 46);

        // Préparation des données du tableau
        const tableData = cartes.map(carte => [
          carte.numeroCarte,
          carte.eleve,
          carte.numeroEtudiant || 'N/A',
          carte.filiere,
          carte.vague,
          new Date(carte.dateExpiration).toLocaleDateString('fr-FR'),
          carte.statut.toUpperCase(),
          new Date(carte.dateCreation).toLocaleDateString('fr-FR')
        ]);

        // Tableau principal
        autoTable(doc, {
          head: [['Numéro', 'Étudiant', 'Matricule', 'Filière', 'Vague', 'Expiration', 'Statut', 'Création']],
          body: tableData,
          startY: 55,
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
          margin: { top: 55 },
          theme: 'grid'
        });

        // Résumé par statut
        const summaryY = (doc as any).lastAutoTable.finalY + 15;
        if (summaryY < 250) {
          doc.setFontSize(12);
          doc.setTextColor(40, 40, 40);
          doc.text("Résumé par Statut", 14, summaryY);
          
          const summaryData = [
            ['Actives', statistiques.actives.toString()],
            ['Inactives', (statistiques.total - statistiques.actives - statistiques.expirees - statistiques.enAttente).toString()],
            ['Expirées', statistiques.expirees.toString()],
            ['En attente', statistiques.enAttente.toString()]
          ];

          autoTable(doc, {
            body: summaryData,
            startY: summaryY + 5,
            styles: { fontSize: 9 },
            columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 60 },
              1: { cellWidth: 40, halign: 'center' }
            },
            head: [['Statut', 'Nombre']],
            headStyles: { 
              fillColor: [16, 185, 129],
              textColor: 255
            },
            margin: { top: 10 }
          });
        }

        // Pied de page
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${i} / ${pageCount} - ${etablissementInfo.nom}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }

        // Sauvegarde du fichier
        const fileName = `cartes-etudiantes-${new Date().toISOString().split('T')[0]}.pdf`;
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
    if (!cartes || cartes.length === 0) {
      toast.error("Aucune donnée à exporter en Excel");
      return;
    }

    const toastId = toast.loading("Export Excel en cours...");

    setTimeout(() => {
      try {
        // Préparation des données
        const data = cartes.map(carte => ({
          'Numéro Carte': carte.numeroCarte,
          'Étudiant': carte.eleve,
          'Matricule': carte.numeroEtudiant || 'N/A',
          'Email': carte.email,
          'Filière': carte.filiere,
          'Vague': carte.vague,
          'Date Expiration': new Date(carte.dateExpiration).toLocaleDateString('fr-FR'),
          'Statut': carte.statut.toUpperCase(),
          'Date Création': new Date(carte.dateCreation).toLocaleDateString('fr-FR')
        }));

        // Création du workbook
        const wb = utils.book_new();
        
        // Feuille principale
        const ws = utils.json_to_sheet(data);
        
        // En-têtes et métadonnées
        const metadata = [
          ["Liste des Cartes Étudiantes"],
          [`Établissement: ${etablissementInfo.nom}`],
          [`Total des cartes: ${statistiques.total}`],
          [`Actives: ${statistiques.actives} | Expirées: ${statistiques.expirees} | En attente: ${statistiques.enAttente}`],
          [`Généré le: ${new Date().toLocaleDateString('fr-FR')}`],
          [] // ligne vide
        ];
        
        utils.sheet_add_aoa(ws, metadata, { origin: 'A1' });
        
        // Ajuster la largeur des colonnes
        const colWidths = [
          { wch: 15 }, // Numéro Carte
          { wch: 25 }, // Étudiant
          { wch: 12 }, // Matricule
          { wch: 25 }, // Email
          { wch: 20 }, // Filière
          { wch: 15 }, // Vague
          { wch: 12 }, // Date Expiration
          { wch: 10 }, // Statut
          { wch: 12 }  // Date Création
        ];
        ws['!cols'] = colWidths;

        utils.book_append_sheet(wb, ws, 'Cartes Étudiantes');

        // Feuille de résumé par statut
        const summaryData = [
          { 'Statut': 'Actives', 'Nombre': statistiques.actives },
          { 'Statut': 'Inactives', 'Nombre': statistiques.total - statistiques.actives - statistiques.expirees - statistiques.enAttente },
          { 'Statut': 'Expirées', 'Nombre': statistiques.expirees },
          { 'Statut': 'En attente', 'Nombre': statistiques.enAttente }
        ];
        
        const wsSummary = utils.json_to_sheet(summaryData);
        utils.book_append_sheet(wb, wsSummary, 'Résumé');

        // Sauvegarde
        const fileName = `cartes-etudiantes-${new Date().toISOString().split('T')[0]}.xlsx`;
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
    if (!cartes || cartes.length === 0) {
      toast.error("Aucune donnée à exporter en CSV");
      return;
    }

    const toastId = toast.loading("Export CSV en cours...");

    setTimeout(() => {
      try {
        const headers = ['Numéro Carte', 'Étudiant', 'Matricule', 'Email', 'Filière', 'Vague', 'Date Expiration', 'Statut', 'Date Création'];
        
        const csvContent = [
          "Liste des Cartes Étudiantes",
          `Établissement: ${etablissementInfo.nom}`,
          `Total des cartes: ${statistiques.total}`,
          `Généré le: ${new Date().toLocaleDateString('fr-FR')}`,
          '',
          headers.join(','),
          ...cartes.map(carte => [
            `"${carte.numeroCarte}"`,
            `"${carte.eleve}"`,
            `"${carte.numeroEtudiant || 'N/A'}"`,
            `"${carte.email}"`,
            `"${carte.filiere}"`,
            `"${carte.vague}"`,
            `"${new Date(carte.dateExpiration).toLocaleDateString('fr-FR')}"`,
            `"${carte.statut.toUpperCase()}"`,
            `"${new Date(carte.dateCreation).toLocaleDateString('fr-FR')}"`
          ].join(','))
        ].join('\n');

        // Création et téléchargement du fichier
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `cartes-etudiantes-${new Date().toISOString().split('T')[0]}.csv`);
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

  const handlePrint = () => {
    toast.loading("Préparation de l'impression...");
    
    setTimeout(() => {
      window.print();
      toast.success("Document prêt pour l'impression!", {
        icon: "🖨️"
      });
    }, 1000);
  };

  const SkeletonCard = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-12 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );

  const SkeletonTableRow = () => (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8" />
        </div>
      </TableCell>
    </TableRow>
  );

  const eleveSelectionne = elevesEligibles.find(e => e.id === nouvelleCarte.eleveId);

  return (
    <>
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
      
      <div className="p-6 space-y-6 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cartes d'Étudiant</h1>
            <p className="text-gray-600 mt-2">
              Gérez les cartes d'identification des étudiants
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={chargerDonnees} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white w-48">
                <DropdownMenuItem 
                  onClick={exportToPDF}
                  className="flex items-center cursor-pointer"
                >
                  <FileText className="w-4 h-4 mr-2 text-red-500" />
                  <span>Export PDF</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={exportToExcel} 
                  className="flex items-center cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-green-500" />
                  <span>Export Excel</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={exportToCSV}
                  className="flex items-center cursor-pointer"
                >
                  <FileCode className="w-4 h-4 mr-2 text-blue-500" />
                  <span>Export CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handlePrint}
                  className="flex items-center cursor-pointer"
                >
                  <Printer className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Imprimer</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Nouvelle Carte
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle carte étudiante</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations essentielles pour générer une carte d'identification
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* 1. Sélection de l'étudiant */}
                  <div className="space-y-2">
                    <Label htmlFor="eleve" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Étudiant *
                    </Label>
                    {loadingEleves ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={nouvelleCarte.eleveId}
                        onValueChange={(value) => setNouvelleCarte({ ...nouvelleCarte, eleveId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un étudiant" />
                        </SelectTrigger>
                        <SelectContent>
                          {elevesEligibles.map((eleve) => (
                            <SelectItem key={eleve.id} value={eleve.id}>
                              <div className="flex flex-col">
                                <span>{eleve.prenom} {eleve.nom}</span>
                                <span className="text-xs text-gray-500">
                                  {eleve.numeroEtudiant} - {eleve.filiere}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* 2. Photo d'identité */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Photo d'identité
                    </Label>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Inclure la photo</div>
                        <div className="text-sm text-gray-500">
                          La photo sera récupérée depuis le dossier de l'étudiant
                        </div>
                      </div>
                      <Switch
                        checked={nouvelleCarte.includePhoto}
                        onCheckedChange={(checked) => 
                          setNouvelleCarte({ ...nouvelleCarte, includePhoto: checked })
                        }
                      />
                    </div>
                  </div>

                  {/* 3. Durée de validité */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Durée de validité
                    </Label>
                    <Select
                      value={nouvelleCarte.dureeValidite}
                      onValueChange={(value) => {
                        const dateExp = calculerDateExpiration(value);
                        setNouvelleCarte({ 
                          ...nouvelleCarte, 
                          dureeValidite: value,
                          dateExpiration: dateExp
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Durée de validité" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="6">6 mois</SelectItem>
                        <SelectItem value="12">12 mois</SelectItem>
                        <SelectItem value="18">18 mois</SelectItem>
                        <SelectItem value="24">24 mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 4. QR Code */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Options de sécurité
                    </Label>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">QR Code</div>
                        <div className="text-sm text-gray-500">
                          Générer un QR code avec les informations essentielles
                        </div>
                      </div>
                      <Switch
                        checked={nouvelleCarte.includeQRCode}
                        onCheckedChange={(checked) => 
                          setNouvelleCarte({ ...nouvelleCarte, includeQRCode: checked })
                        }
                      />
                    </div>
                  </div>

                  {/* Aperçu de la carte */}
                  {eleveSelectionne && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-blue-900 flex items-center gap-2">
                          <BookOpen className="w-5 h-5" />
                          Aperçu de la carte
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-white p-6 rounded-lg border-2 border-blue-200">
                          <div className="grid grid-cols-3 gap-4">
                            {/* Colonne gauche - Logo et informations établissement */}
                            <div className="col-span-1 space-y-2">
                              <div className="h-12 bg-gray-200 rounded flex items-center justify-center mb-4">
                                <span className="text-xs font-bold">{etablissementInfo.nom.split(' ')[0]}</span>
                              </div>
                              <div className="text-xs text-gray-600">
                                <div className="font-semibold">{etablissementInfo.nom}</div>
                                <div>{etablissementInfo.adresse}</div>
                              </div>
                            </div>
                            
                            {/* Colonne centrale - Informations étudiant */}
                            <div className="col-span-2 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-bold text-lg">
                                    {eleveSelectionne.prenom} {eleveSelectionne.nom}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {eleveSelectionne.numeroEtudiant}
                                  </div>
                                </div>
                                {nouvelleCarte.includePhoto && (
                                  <div className="w-16 h-20 bg-gray-200 border rounded flex items-center justify-center">
                                    <span className="text-xs">PHOTO</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <div className="font-medium">Filière</div>
                                  <div>{eleveSelectionne.filiere}</div>
                                </div>
                                <div>
                                  <div className="font-medium">Vague</div>
                                  <div>{eleveSelectionne.vague}</div>
                                </div>
                                <div>
                                  <div className="font-medium">Naissance</div>
                                  <div>{new Date(eleveSelectionne.dateNaissance).toLocaleDateString('fr-FR')}</div>
                                </div>
                                <div>
                                  <div className="font-medium">Expire le</div>
                                  <div>{new Date(nouvelleCarte.dateExpiration).toLocaleDateString('fr-FR')}</div>
                                </div>
                              </div>
                              
                              {nouvelleCarte.includeQRCode && (
                                <div className="flex justify-center mt-2">
                                  <div className="w-20 h-20 bg-gray-100 border rounded flex items-center justify-center">
                                    <span className="text-xs text-center">QR CODE</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Signature */}
                          <div className="mt-4 pt-4 border-t text-center text-xs text-gray-500">
                            <div>Signature du Directeur: {etablissementInfo.directeur}</div>
                            <div>Carte propriété du centre - À restituer en fin de formation</div>
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
                    disabled={!nouvelleCarte.eleveId || !nouvelleCarte.dateExpiration || loadingEleves}
                    className="bg-blue-600 hover:bg-blue-700"
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
          {loadingStats ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cartes</CardTitle>
                  <CreditCard className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistiques.total}</div>
                  <p className="text-xs text-gray-600">Cartes générées</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Actives</CardTitle>
                  <CreditCard className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistiques.actives}</div>
                  <p className="text-xs text-gray-600">En circulation</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expirées</CardTitle>
                  <CreditCard className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistiques.expirees}</div>
                  <p className="text-xs text-gray-600">À renouveler</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                  <CreditCard className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistiques.enAttente}</div>
                  <p className="text-xs text-gray-600">En traitement</p>
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
                  <SelectItem value="1">Développement Web</SelectItem>
                  <SelectItem value="2">Design Graphique</SelectItem>
                  <SelectItem value="3">Marketing Digital</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedVague} onValueChange={setSelectedVague}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Toutes les vagues" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes les vagues</SelectItem>
                  <SelectItem value="1">Vague 1 - 2024</SelectItem>
                  <SelectItem value="2">Vague 2 - 2024</SelectItem>
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
            </div>
          </CardContent>
        </Card>

        {/* Tableau des cartes */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Cartes</CardTitle>
            <CardDescription>
              {loading ? 'Chargement...' : `${cartes.length} carte(s) d'étudiant(s) trouvée(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Étudiant</TableHead>
                    <TableHead>Numéro de carte</TableHead>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Filière</TableHead>
                    <TableHead>Vague</TableHead>
                    <TableHead>Date d'expiration</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <SkeletonTableRow key={index} />
                    ))
                  ) : cartes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Aucune carte trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    cartes.map((carte) => (
                      <TableRow key={carte.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={carte.photo || ''} />
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
                        <TableCell className="font-mono text-sm">
                          {carte.numeroEtudiant}
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
                                <DropdownMenuItem onClick={() => handleRenouvelerCarte(carte.id)}>
                                  Renouveler
                                </DropdownMenuItem>
                                <DropdownMenuItem>Désactiver</DropdownMenuItem>
                                <DropdownMenuItem>Modifier</DropdownMenuItem>
                                <DropdownMenuItem>Voir détails</DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleSupprimerCarte(carte.id)}
                                >
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}