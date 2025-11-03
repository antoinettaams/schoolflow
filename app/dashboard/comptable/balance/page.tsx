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
import { Label } from "@radix-ui/react-label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Search, Plus } from "lucide-react";

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

const mockBalanceOperations: BalanceOperation[] = [
  {
    id: "1",
    date: "2024-01-05",
    vague: "Vague Janvier 2024",
    filiere: "Développement Web",
    libelle: "Paiement scolarité Marie Dupont",
    debit: 300000,
    credit: 300000,
    reference: "SCOL-001",
  },
  {
    id: "2",
    date: "2024-01-10",
    vague: "Vague Janvier 2024",
    filiere: "Data Science",
    libelle: "Paiement scolarité Pierre Martin",
    debit: 250000,
    credit: 250000,
    reference: "SCOL-002",
  },
  {
    id: "3",
    date: "2024-02-15",
    vague: "Vague Février 2024",
    filiere: "Design Graphique",
    libelle: "Paiement inscription Sophie Bernard",
    debit: 50000,
    credit: 50000,
    reference: "INSC-001",
  },
];

export default function BalancePage() {
  const [balanceOps, setBalanceOps] = useState<BalanceOperation[]>([]);
  const [filteredOps, setFilteredOps] = useState<BalanceOperation[]>([]);
  const [selectedVague, setSelectedVague] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateStart, setDateStart] = useState("2024-01-01");
  const [dateEnd, setDateEnd] = useState("2024-12-31");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newOperation, setNewOperation] = useState<Partial<BalanceOperation>>({
    date: new Date().toISOString().split('T')[0],
    vague: "",
    filiere: "",
    libelle: "",
    debit: 0,
    credit: 0,
    reference: "",
  });

  const vagues = Array.from(new Set(mockBalanceOperations.map((op) => op.vague)));
  const filieres = Array.from(new Set(mockBalanceOperations.map((op) => op.filiere)));

  useEffect(() => {
    setBalanceOps(mockBalanceOperations);
  }, []);

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

  const exportPDF = () => {
    alert("Export PDF en cours...");
  };

  const handleAddOperation = () => {
    if (!newOperation.vague || !newOperation.filiere || !newOperation.libelle) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const operation: BalanceOperation = {
      id: Date.now().toString(),
      date: newOperation.date || new Date().toISOString().split('T')[0],
      vague: newOperation.vague,
      filiere: newOperation.filiere,
      libelle: newOperation.libelle,
      debit: newOperation.debit || 0,
      credit: newOperation.credit || 0,
      reference: newOperation.reference || `REF-${Date.now()}`,
    };

    setBalanceOps(prev => [...prev, operation]);
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
  };

  return (
    <div className="p-6 max-w-7xl mx-auto overflow-y-auto overflow-x-auto space-y-6 lg:pl-5 pt-20 lg:pt-6">
      {/* Tableau principal */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center gap-4 sm:flex flex-col lg:flex flex-row">
            <div>
              <CardTitle>Balance Comptable par Vague</CardTitle>
              <CardDescription>
                Suivi des opérations comptables pour chaque vague de formation
              </CardDescription>
            </div>
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
                {/* Première ligne : Date et Référence */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="date-operation" className="text-sm font-medium text-gray-700">
                      Date de l&apos;opération 
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

                {/* Deuxième ligne : Vague et Filière */}
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
                      <SelectValue placeholder="Vague" />
                    </SelectTrigger>
                      <SelectContent>
                        {vagues.map((vague) => (
                          <SelectItem key={vague} value={vague}>
                            {vague}
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
                        <SelectValue placeholder="Filière" />
                      </SelectTrigger>
                      <SelectContent>
                        {filieres.map((filiere) => (
                          <SelectItem key={filiere} value={filiere}>
                            {filiere}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Libellé sur toute la largeur */}
                <div className="space-y-2">
                  <Label htmlFor="libelle" className="text-sm font-medium text-gray-700">
                    Libellé de l&apos;opération *
                  </Label>
                  <Input
                    id="libelle"
                    placeholder="Ex: Paiement scolarité - Marie Dupont"
                    value={newOperation.libelle}
                    onChange={(e) => setNewOperation({...newOperation, libelle: e.target.value})}
                    className="w-full"
                  />
                </div>

                {/* Montants Débit et Crédit */}
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
      
                  {/* Indicateur d'équilibre */}
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

                {/* Bouton de soumission */}
                <Button 
                  onClick={handleAddOperation} 
                  className="w-64 bg-blue-600 hover:bg-blue-700 mt-2"
                  disabled={!newOperation.vague || !newOperation.filiere || !newOperation.libelle}
                >
                  <Plus className="h-4 w-4 mr-2" />
                    Ajouter l&apos;opération comptable
                </Button>

                {/* Indication des champs obligatoires */}
                <div className="text-xs text-gray-500 text-center">
                  * Champs obligatoires
                </div>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-col sm:items-center sm:gap-4 mb-6 md: flex flex-row lg: flex flex-row">
            <Select
  value={selectedVague}
  onValueChange={setSelectedVague}
>
  <SelectTrigger className="w-full sm:w-[250px]">
    <SelectValue placeholder="Toutes les vagues" />
  </SelectTrigger>
  <SelectContent className="bg-white">
    <SelectItem value="all">Toutes les vagues</SelectItem>
    {vagues.map((vague) => (
      <SelectItem key={vague} value={vague}>
        {vague}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

            <Input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="my-2 sm:my-0"
              placeholder="Date début"
            />
            <Input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="my-2 sm:my-0"
              placeholder="Date fin"
            />

            <div className="flex-grow relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher libellé ou référence"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Button onClick={exportPDF} variant="outline" className="mt-2 ml-auto sm:ml-4">
              <Download className="mr-2 h-4 w-4" />
              Exporter PDF
            </Button>
          </div>

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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                    Aucune opération trouvée
                  </TableCell>
                </TableRow>
              )}
              {filteredOps.map((op) => (
                <TableRow key={op.id} className="hover:bg-gray-50 cursor-pointer">
                  <TableCell>{new Date(op.date).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>{op.vague}</TableCell>
                  <TableCell>{op.filiere}</TableCell>
                  <TableCell>{op.libelle}</TableCell>
                  <TableCell className="text-green-600">{formatCurrency(op.debit)}</TableCell>
                  <TableCell className="text-red-600">{formatCurrency(op.credit)}</TableCell>
                  <TableCell>{op.reference}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 flex justify-end space-x-10 font-semibold text-lg">
            <div>
              Total Débit: <span className="text-green-600">{formatCurrency(totalDebit)}</span>
            </div>
            <div>
              Total Crédit: <span className="text-red-600">{formatCurrency(totalCredit)}</span>
            </div>
            <div>
              Solde:{" "}
              <span className={balance >= 0 ? "text-green-700" : "text-red-700"}>
                {formatCurrency(balance)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}