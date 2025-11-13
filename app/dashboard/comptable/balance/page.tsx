// app/dashboard/comptable/balance/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Search, Plus, Trash2, FileText, Sheet, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Import des bibliothèques d'export
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';

interface BalanceOperation {
  id: string;
  date: string;
  vague: string;
  filiere: string;
  libelle: string;
  debit: number;
  credit: number;
  reference: string;
}

interface Vague {
  id: string;
  nom: string;
}

interface Filiere {
  id: number;
  nom: string;
}

export default function BalancePage() {
  const [balanceOps, setBalanceOps] = useState<BalanceOperation[]>([]);
  const [filteredOps, setFilteredOps] = useState<BalanceOperation[]>([]);
  const [vagues, setVagues] = useState<Vague[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [selectedVague, setSelectedVague] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateStart, setDateStart] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [newOperation, setNewOperation] = useState({
    date: new Date().toISOString().split('T')[0],
    vague: "",
    filiere: "",
    libelle: "",
    debit: 0,
    credit: 0,
    reference: "",
  });

  // Charger les vagues et filières
  const fetchVaguesAndFilieres = async () => {
    try {
      const [vaguesRes, filieresRes] = await Promise.all([
        fetch('/api/comptable/balance?action=vagues'),
        fetch('/api/comptable/balance?action=filieres')
      ]);

      if (vaguesRes.ok) {
        const vaguesData = await vaguesRes.json();
        setVagues(vaguesData);
      }

      if (filieresRes.ok) {
        const filieresData = await filieresRes.json();
        setFilieres(filieresData);
      }
    } catch (error) {
      console.error('Erreur chargement vagues/filieres:', error);
      toast.error("Erreur lors du chargement des vagues et filières");
    }
  };

  // Charger les opérations
  const fetchBalanceOperations = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedVague !== "all") params.append("vague", selectedVague);
      if (searchTerm) params.append("search", searchTerm);
      params.append("dateStart", dateStart);
      params.append("dateEnd", dateEnd);

      const response = await fetch(`/api/comptable/balance?${params}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const data = await response.json();
      setBalanceOps(data);
      
      if (data.length === 0) {
        toast.info("Aucune opération trouvée avec les filtres actuels");
      } else {
        toast.success(`${data.length} opération(s) trouvée(s)`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Impossible de charger les données");
      setBalanceOps([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVaguesAndFilieres();
  }, []);

  useEffect(() => {
    fetchBalanceOperations();
  }, [selectedVague, searchTerm, dateStart, dateEnd]);

  // Filtrer les données côté client pour les recherches instantanées
  useEffect(() => {
    const filtered = balanceOps.filter((op) => {
      const opDate = new Date(op.date);
      const startDate = new Date(dateStart);
      const endDate = new Date(dateEnd);

      return (
        (selectedVague === "all" || op.vague === selectedVague) &&
        opDate >= startDate &&
        opDate <= endDate &&
        (op.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          op.reference.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });

    setFilteredOps(filtered);
  }, [balanceOps, selectedVague, searchTerm, dateStart, dateEnd]);

  const totalDebit = filteredOps.reduce((sum, op) => sum + op.debit, 0);
  const totalCredit = filteredOps.reduce((sum, op) => sum + op.credit, 0);
  const balance = totalDebit - totalCredit;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
    }).format(value);

  // SYSTÈME D'EXPORT COMPLET

  const exportToPDF = () => {
    if (!filteredOps || filteredOps.length === 0) {
      toast.error("Aucune donnée à exporter en PDF");
      return;
    }

    const toastId = toast.loading("Génération du PDF en cours...");
    setIsExporting(true);

    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        // En-tête du document
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text("Balance Comptable - SchoolFlow", 14, 15);
        
        // Informations générales
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(`Période: du ${new Date(dateStart).toLocaleDateString('fr-FR')} au ${new Date(dateEnd).toLocaleDateString('fr-FR')}`, 14, 25);
        doc.text(`Total des opérations: ${filteredOps.length}`, 14, 32);
        doc.text(`Total Débit: ${formatCurrency(totalDebit)}`, 14, 39);
        doc.text(`Total Crédit: ${formatCurrency(totalCredit)}`, 14, 46);
        doc.text(`Solde: ${formatCurrency(balance)}`, 14, 53);
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 60);

        // Préparation des données du tableau
        const tableData = filteredOps.map(op => [
          new Date(op.date).toLocaleDateString('fr-FR'),
          vagues.find(v => v.id === op.vague)?.nom || op.vague,
          filieres.find(f => f.id === parseInt(op.filiere))?.nom || op.filiere,
          op.libelle,
          formatCurrency(op.debit),
          formatCurrency(op.credit),
          op.reference
        ]);

        // Tableau principal
        autoTable(doc, {
          head: [['Date', 'Vague', 'Filière', 'Libellé', 'Débit', 'Crédit', 'Référence']],
          body: tableData,
          startY: 70,
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
          margin: { top: 70 },
          theme: 'grid'
        });

        // Résumé des totaux
        const summaryY = (doc as any).lastAutoTable.finalY + 15;
        if (summaryY < 250) {
          doc.setFontSize(12);
          doc.setTextColor(40, 40, 40);
          doc.text("Résumé des Totaux", 14, summaryY);
          
          const summaryData = [
            ['Total Débit', formatCurrency(totalDebit)],
            ['Total Crédit', formatCurrency(totalCredit)],
            ['Solde', formatCurrency(balance)]
          ];

          autoTable(doc, {
            body: summaryData,
            startY: summaryY + 5,
            styles: { fontSize: 10 },
            columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 60 },
              1: { cellWidth: 60, halign: 'right' }
            },
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
            `Page ${i} / ${pageCount} - Balance Comptable SchoolFlow`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }

        // Sauvegarde du fichier
        const fileName = `balance-comptable-${new Date().toISOString().split('T')[0]}.pdf`;
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
      } finally {
        setIsExporting(false);
      }
    }, 2000);
  };

  const exportToExcel = () => {
    if (!filteredOps || filteredOps.length === 0) {
      toast.error("Aucune donnée à exporter en Excel");
      return;
    }

    const toastId = toast.loading("Export Excel en cours...");
    setIsExporting(true);

    setTimeout(() => {
      try {
        // Préparation des données
        const data = filteredOps.map(op => ({
          'Date': new Date(op.date).toLocaleDateString('fr-FR'),
          'Vague': vagues.find(v => v.id === op.vague)?.nom || op.vague,
          'Filière': filieres.find(f => f.id === parseInt(op.filiere))?.nom || op.filiere,
          'Libellé': op.libelle,
          'Débit': op.debit,
          'Crédit': op.credit,
          'Référence': op.reference
        }));

        // Création du workbook
        const wb = utils.book_new();
        
        // Feuille principale
        const ws = utils.json_to_sheet(data);
        
        // En-têtes et métadonnées
        const metadata = [
          ["Balance Comptable - SchoolFlow"],
          [`Période: du ${new Date(dateStart).toLocaleDateString('fr-FR')} au ${new Date(dateEnd).toLocaleDateString('fr-FR')}`],
          [`Total des opérations: ${filteredOps.length}`],
          [`Total Débit: ${formatCurrency(totalDebit)}`],
          [`Total Crédit: ${formatCurrency(totalCredit)}`],
          [`Solde: ${formatCurrency(balance)}`],
          [`Généré le: ${new Date().toLocaleDateString('fr-FR')}`],
          [] // ligne vide
        ];
        
        utils.sheet_add_aoa(ws, metadata, { origin: 'A1' });
        
        // Ajuster la largeur des colonnes
        const colWidths = [
          { wch: 12 }, // Date
          { wch: 15 }, // Vague
          { wch: 20 }, // Filière
          { wch: 40 }, // Libellé
          { wch: 15 }, // Débit
          { wch: 15 }, // Crédit
          { wch: 15 }  // Référence
        ];
        ws['!cols'] = colWidths;

        utils.book_append_sheet(wb, ws, 'Balance');

        // Feuille de résumé
        const summaryData = [
          { 'Type': 'Total Débit', 'Montant': totalDebit },
          { 'Type': 'Total Crédit', 'Montant': totalCredit },
          { 'Type': 'Solde', 'Montant': balance }
        ];
        
        const wsSummary = utils.json_to_sheet(summaryData);
        utils.book_append_sheet(wb, wsSummary, 'Résumé');

        // Sauvegarde
        const fileName = `balance-comptable-${new Date().toISOString().split('T')[0]}.xlsx`;
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
      } finally {
        setIsExporting(false);
      }
    }, 1500);
  };

  const exportToCSV = () => {
    if (!filteredOps || filteredOps.length === 0) {
      toast.error("Aucune donnée à exporter en CSV");
      return;
    }

    const toastId = toast.loading("Export CSV en cours...");
    setIsExporting(true);

    setTimeout(() => {
      try {
        const headers = ['Date', 'Vague', 'Filière', 'Libellé', 'Débit', 'Crédit', 'Référence'];
        
        const csvContent = [
          "Balance Comptable - SchoolFlow",
          `Période: du ${new Date(dateStart).toLocaleDateString('fr-FR')} au ${new Date(dateEnd).toLocaleDateString('fr-FR')}`,
          `Total des opérations: ${filteredOps.length}`,
          `Total Débit: ${formatCurrency(totalDebit)}`,
          `Total Crédit: ${formatCurrency(totalCredit)}`,
          `Solde: ${formatCurrency(balance)}`,
          `Généré le: ${new Date().toLocaleDateString('fr-FR')}`,
          '',
          headers.join(','),
          ...filteredOps.map(op => {
            return [
              `"${new Date(op.date).toLocaleDateString('fr-FR')}"`,
              `"${vagues.find(v => v.id === op.vague)?.nom || op.vague}"`,
              `"${filieres.find(f => f.id === parseInt(op.filiere))?.nom || op.filiere}"`,
              `"${op.libelle}"`,
              op.debit,
              op.credit,
              `"${op.reference}"`
            ].join(',');
          })
        ].join('\n');

        // Création et téléchargement du fichier
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `balance-comptable-${new Date().toISOString().split('T')[0]}.csv`);
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
      } finally {
        setIsExporting(false);
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

  const handleAddOperation = async () => {
    try {
      if (!newOperation.vague || !newOperation.filiere || !newOperation.libelle) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }

      const response = await fetch('/api/comptable/balance?action=create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOperation),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la création');
      }

      const operation = await response.json();
      
      setBalanceOps(prev => [operation, ...prev]);
      setIsAddDialogOpen(false);
      setNewOperation({
        date: new Date().toISOString().split('T')[0],
        vague: "",
        filiere: "",
        libelle: "",
        debit: 0,
        credit: 0,
        reference: "",
      });

      toast.success("L'opération comptable a été créée avec succès");
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || "Impossible d'ajouter l'opération");
    }
  };

  const handleDeleteOperation = async (id: string) => {
    try {
      const response = await fetch('/api/comptable/balance?action=delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }

      setBalanceOps(prev => prev.filter(op => op.id !== id));
      toast.success("Opération supprimée avec succès");
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || "Impossible de supprimer l'opération");
    }
  };

  // Skeleton pour le chargement
  const SkeletonRow = () => (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell><Skeleton className="h-4 w-60" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
    </TableRow>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 lg:pl-5 pt-20 lg:pt-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center gap-4 flex-col lg:flex-row">
            <div>
              <CardTitle>Balance Comptable par Vague</CardTitle>
              <CardDescription>
                Suivi des opérations comptables pour chaque vague de formation
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center justify-center" disabled={isExporting}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                    {isExporting && <span className="ml-2 animate-spin">⟳</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white w-48">
                  <DropdownMenuItem 
                    onClick={exportToPDF}
                    className="flex items-center cursor-pointer"
                    disabled={isExporting}
                  >
                    <FileText className="w-4 h-4 mr-2 text-red-500" />
                    <span>Export PDF</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={exportToExcel}
                    className="flex items-center cursor-pointer"
                    disabled={isExporting}
                  >
                    <Sheet className="w-4 h-4 mr-2 text-green-600" />
                    <span>Export Excel</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={exportToCSV}
                    className="flex items-center cursor-pointer"
                    disabled={isExporting}
                  >
                    <FileDown className="w-4 h-4 mr-2 text-blue-500" />
                    <span>Export CSV</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handlePrint}
                    className="flex items-center cursor-pointer"
                  >
                    <FileText className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Imprimer</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter Opération
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-screen overflow-y-auto bg-white max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nouvelle Opération Comptable</DialogTitle>
                    <DialogDescription>
                      Ajouter une nouvelle écriture à la balance générale
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {/* Formulaire inchangé */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="date-operation" className="text-sm font-medium text-gray-700">
                          Date de l'opération 
                        </Label>
                        <Input
                          id="date-operation"
                          type="date"
                          value={newOperation.date}
                          onChange={(e) => setNewOperation({...newOperation, date: e.target.value})}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reference" className="text-sm font-medium text-gray-700">
                          Référence 
                        </Label>
                        <Input
                          id="reference"
                          placeholder="REF-001"
                          value={newOperation.reference}
                          onChange={(e) => setNewOperation({...newOperation, reference: e.target.value})}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="vague" className="text-sm font-medium text-gray-700">
                          Vague *
                        </Label>
                        <Select
                          value={newOperation.vague}
                          onValueChange={(value) => setNewOperation({...newOperation, vague: value})}
                        >
                          <SelectTrigger id="vague">
                            <SelectValue placeholder="Sélectionner une vague" />
                          </SelectTrigger>
                          <SelectContent>
                            {vagues.map((vague) => (
                              <SelectItem key={vague.id} value={vague.id}>
                                {vague.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
          
                      <div className="space-y-2">
                        <Label htmlFor="filiere" className="text-sm font-medium text-gray-700">
                          Filière *
                        </Label>
                        <Select
                          value={newOperation.filiere}
                          onValueChange={(value) => setNewOperation({...newOperation, filiere: value})}
                        >
                          <SelectTrigger id="filiere">
                            <SelectValue placeholder="Sélectionner une filière" />
                          </SelectTrigger>
                          <SelectContent>
                            {filieres.map((filiere) => (
                              <SelectItem key={filiere.id} value={filiere.id.toString()}>
                                {filiere.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="libelle" className="text-sm font-medium text-gray-700">
                        Libellé de l'opération *
                      </Label>
                      <Input
                        id="libelle"
                        placeholder="Ex: Paiement scolarité - Marie Dupont"
                        value={newOperation.libelle}
                        onChange={(e) => setNewOperation({...newOperation, libelle: e.target.value})}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">
                        Montants *
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="debit" className="text-sm font-medium text-green-600">
                              Débit
                            </Label>
                            <span className="text-xs text-gray-500">(XOF)</span>
                          </div>
                          <Input
                            id="debit"
                            type="number"
                            placeholder="0"
                            value={newOperation.debit || ''}
                            onChange={(e) => setNewOperation({...newOperation, debit: Number(e.target.value)})}
                            className="w-full border-green-200 focus:border-green-500"
                          />
                        </div>
          
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="credit" className="text-sm font-medium text-blue-600">
                              Crédit
                            </Label>
                            <span className="text-xs text-gray-500">(XOF)</span>
                          </div>
                          <Input
                            id="credit"
                            type="number"
                            placeholder="0"
                            value={newOperation.credit || ''}
                            onChange={(e) => setNewOperation({...newOperation, credit: Number(e.target.value)})}
                            className="w-full border-blue-200 focus:border-blue-500"
                          />
                        </div>
                      </div>
        
                      {(newOperation.debit || newOperation.credit) && (
                        <div className={`text-xs p-2 rounded ${
                          newOperation.debit === newOperation.credit 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}>
                          {newOperation.debit === newOperation.credit 
                            ? '✓ Équilibre respecté (Débit = Crédit)' 
                            : '⚠️ Attention: Débit ≠ Crédit'
                          }
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={handleAddOperation} 
                      className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
                      disabled={!newOperation.vague || !newOperation.filiere || !newOperation.libelle}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter l'opération comptable
                    </Button>

                    <div className="text-xs text-gray-500 text-center">
                      * Champs obligatoires
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6 items-start lg:items-center">
            <Select value={selectedVague} onValueChange={setSelectedVague}>
              <SelectTrigger className="w-full lg:w-[250px]">
                <SelectValue placeholder="Toutes les vagues" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Toutes les vagues</SelectItem>
                {vagues.map((vague) => (
                  <SelectItem key={vague.id} value={vague.id}>
                    {vague.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <Input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className="w-full sm:w-auto"
              />
              <Input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
                className="w-full sm:w-auto"
              />
            </div>

            <div className="flex-grow relative w-full lg:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher libellé ou référence"
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
            <Table className="min-w-full rounded border border-gray-200">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vague</TableHead>
                  <TableHead>Filière</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Débit</TableHead>
                  <TableHead>Crédit</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <SkeletonRow key={index} />
                  ))
                ) : filteredOps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                      Aucune opération trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOps.map((op) => (
                    <TableRow key={op.id} className="hover:bg-gray-50">
                      <TableCell>{new Date(op.date).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>{vagues.find(v => v.id === op.vague)?.nom || op.vague}</TableCell>
                      <TableCell>{filieres.find(f => f.id === parseInt(op.filiere))?.nom || op.filiere}</TableCell>
                      <TableCell>{op.libelle}</TableCell>
                      <TableCell className="text-green-600 font-medium">{formatCurrency(op.debit)}</TableCell>
                      <TableCell className="text-red-600 font-medium">{formatCurrency(op.credit)}</TableCell>
                      <TableCell className="font-mono text-sm">{op.reference}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOperation(op.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totaux */}
          {!isLoading && filteredOps.length > 0 && (
            <div className="mt-6 flex flex-col lg:flex-row justify-end gap-4 lg:gap-10 font-semibold text-lg">
              <div>
                Total Débit: <span className="text-green-600">{formatCurrency(totalDebit)}</span>
              </div>
              <div>
                Total Crédit: <span className="text-red-600">{formatCurrency(totalCredit)}</span>
              </div>
              <div>
                Solde:{" "}
                <span className={balance >= 0 ? "text-green-700" : "text-red-700"}>
                  {formatCurrency(Math.abs(balance))} {balance >= 0 ? "(Débiteur)" : "(Créditeur)"}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}