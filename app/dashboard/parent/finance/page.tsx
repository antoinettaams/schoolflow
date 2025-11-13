// app/parent/finance/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  FaFileInvoice, 
  FaSort, 
  FaSortUp, 
  FaSortDown, 
  FaDownload, 
  FaCreditCard, 
  FaHistory,
  FaChartBar, 
  FaReceipt,
  FaCheckCircle,
  FaClock,
  FaUserGraduate,
  FaSchool,
  FaUtensils,
  FaRunning,
  FaExclamationTriangle
} from "react-icons/fa";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// Interfaces TypeScript basées sur l'API
interface Fee { 
  id: number;
  description: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  paymentDate: string;
  type: "Inscription" | "Scolarité" | "Cantine" | "Activités";
  reference: string;
}

interface Student {
  id: string;
  name: string;
  class: string;
  program: string;
  registrationStatus: "registered" | "pending";
  registrationFee: number;
  tuitionFee: number;
  paidAmount: number;
  remainingAmount: number;
  totalSchoolFees: number;
}

interface FinanceData {
  student: Student;
  fees: Fee[];
  summary: {
    totalAll: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
  };
}

interface ApiResponse {
  success: boolean;
  data: FinanceData;
  metadata?: {
    userRole: string;
    studentName: string;
    generatedAt: string;
  };
}

// Type pour les champs de tri valides
type SortableField = "reference" | "description" | "amount" | "dueDate";

// --- Composant Skeleton pour le chargement ---
const FinanceSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Skeleton pour l'en-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div className="space-y-3">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 w-32 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Skeleton pour les cartes récapitulatives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[1, 2].map((card) => (
          <Card key={card}>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((line) => (
                  <div key={line} className="flex justify-between items-center">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skeleton pour les cartes de résumé global */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((card) => (
          <Card key={card}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skeleton pour les filtres */}
      <div className="mb-6">
        <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Skeleton pour le tableau */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {/* En-tête du tableau skeleton */}
            <div className="w-full border-b border-gray-200">
              <div className="grid grid-cols-7 gap-4 py-3 px-4">
                {[1, 2, 3, 4, 5, 6, 7].map((header) => (
                  <div key={header} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            
            {/* Lignes du tableau skeleton */}
            <div className="space-y-4 mt-4">
              {[1, 2, 3].map((row) => (
                <div key={row} className="grid grid-cols-7 gap-4 py-4 px-4 border-b border-gray-100">
                  {[1, 2, 3, 4, 5, 6, 7].map((cell) => (
                    <div key={cell} className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      {cell === 7 && <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function ParentFinancePage() {
  const { user } = useUser();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortField, setSortField] = useState<SortableField>("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [financeData, setFinanceData] = useState<FinanceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Charger les données depuis l'API
  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/finances');
        const result: ApiResponse = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Erreur lors du chargement des données');
        }

        if (result.success && result.data) {
          setFinanceData(result.data);
          toast.success('Données financières chargées avec succès');
        } else {
          throw new Error('Données non disponibles');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        toast.error(`Erreur: ${errorMessage}`);
        console.error('Erreur chargement données:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFinanceData();
  }, []);

  const statusFilters = [
    { id: "all", name: "Tous les frais" },
    { id: "paid", name: "Payés" },
    { id: "pending", name: "En attente" },
    { id: "overdue", name: "En retard" }
  ];

  const downloadReceipt = (fee: Fee) => {
    if (!financeData) return;

    const receiptContent = `
      RECU DE PAIEMENT - SCHOOLFLOW
      ==============================
      
      Référence: ${fee.reference}
      Description: ${fee.description}
      Type: ${fee.type}
      Montant: ${formatFCFA(fee.amount)}
      Date d'échéance: ${fee.dueDate}
      Date de paiement: ${fee.paymentDate}
      Statut: Payé
      
      Élève: ${financeData.student.name} - ${financeData.student.class}
      Parent: ${user?.fullName || "Parent"}
      Filière: ${financeData.student.program}
      Date d'émission: ${new Date().toLocaleDateString('fr-FR')}
      
      Merci pour votre confiance.
      École Secondaire Excellence
      
      Ce reçu est valable comme justificatif de paiement.
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reçu-${fee.reference}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Reçu téléchargé avec succès');
  };

  const handleSort = (field: SortableField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortableField) => {
    if (sortField !== field) return <FaSort className="text-muted-foreground" size={14} />;
    return sortDirection === "asc" ? <FaSortUp className="text-primary" /> : <FaSortDown className="text-primary" />;
  };

  const filteredFees = financeData?.fees.filter(fee =>
    selectedStatus === "all" || fee.status === selectedStatus
  ) || [];

  // Fonction de tri
  const sortedFees = [...filteredFees].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case "amount":
        aValue = a.amount;
        bValue = b.amount;
        break;
      case "reference":
        aValue = a.reference;
        bValue = b.reference;
        break;
      case "description":
        aValue = a.description;
        bValue = b.description;
        break;
      case "dueDate":
        aValue = new Date(a.dueDate.split('/').reverse().join('-')).getTime();
        bValue = new Date(b.dueDate.split('/').reverse().join('-')).getTime();
        break;
      default:
        aValue = a.reference;
        bValue = b.reference;
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getStatusVariant = (status: Fee["status"]) => {
    switch (status) {
      case "paid": return "default";
      case "pending": return "secondary";
      case "overdue": return "destructive";
      default: return "outline";
    }
  };

  const getTypeIcon = (type: Fee["type"]) => {
    switch (type) {
      case "Inscription": return <FaUserGraduate className="mr-1" size={12} />;
      case "Scolarité": return <FaSchool className="mr-1" size={12} />;
      case "Cantine": return <FaUtensils className="mr-1" size={12} />;
      case "Activités": return <FaRunning className="mr-1" size={12} />;
      default: return <FaFileInvoice className="mr-1" size={12} />;
    }
  };

  const getTypeVariant = (type: Fee["type"]) => {
    switch (type) {
      case "Inscription": return "default";
      case "Scolarité": return "secondary";
      case "Cantine": return "outline";
      case "Activités": return "default";
      default: return "outline";
    }
  };

  const formatFCFA = (amount: number) => new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

  // Calculs des totaux basés sur les données de l'API
  const totalPaid = financeData?.summary.totalPaid || 0;
  const totalPending = financeData?.summary.totalPending || 0;
  const totalOverdue = financeData?.summary.totalOverdue || 0;
  const totalAll = financeData?.summary.totalAll || 0;

  // Calculs par type
  const inscriptionFees = financeData?.fees.filter(f => f.type === "Inscription") || [];
  const tuitionFees = financeData?.fees.filter(f => f.type === "Scolarité") || [];

  const paidInscription = inscriptionFees.filter(f => f.status === "paid").reduce((sum, fee) => sum + fee.amount, 0);
  const paidTuition = tuitionFees.filter(f => f.status === "paid").reduce((sum, fee) => sum + fee.amount, 0);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-background lg:pl-5 pt-20 lg:pt-6">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full">
            <FinanceSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-background lg:pl-5 pt-20 lg:pt-6">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full">
            <div className="text-center py-12">
              <FaExclamationTriangle className="text-5xl text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Erreur de chargement</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!financeData) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-background lg:pl-5 pt-20 lg:pt-6">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full">
            <div className="text-center py-12">
              <FaFileInvoice className="text-5xl text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Aucune donnée disponible</h3>
              <p className="text-muted-foreground">Les données financières ne sont pas disponibles pour le moment.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background lg:pl-5 pt-20 lg:pt-6">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full">
          {/* En-tête */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Vue des frais de formation</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{financeData.student.name}</span>
                  <Badge variant={financeData.student.registrationStatus === "registered" ? "default" : "secondary"}>
                    {financeData.student.registrationStatus === "registered" ? (
                      <><FaCheckCircle className="mr-1" size={12} /> Inscrit</>
                    ) : (
                      <><FaClock className="mr-1" size={12} /> En attente</>
                    )}
                  </Badge>
                </div>
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-sm">
                  Filière: {financeData.student.program}
                </Badge>
              </div>
            </div>
          </div>

          {/* Section récapitulative des frais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FaUserGraduate className="text-primary" />
                  Frais d&apos;Inscription
                </CardTitle>
                <CardDescription>
                  Frais d&apos;admission et d&apos;inscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Montant total:</span>
                    <span className="font-semibold">{formatFCFA(financeData.student.registrationFee)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Payé:</span>
                    <span className="font-semibold text-green-600">{formatFCFA(paidInscription)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Statut:</span>
                    <Badge variant={paidInscription >= financeData.student.registrationFee ? "default" : "secondary"}>
                      {paidInscription >= financeData.student.registrationFee ? "Complètement payé" : "Partiellement payé"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FaSchool className="text-primary" />
                  Frais de Scolarité
                </CardTitle>
                <CardDescription>
                  Frais de scolarité annuels ({tuitionFees.length} trimestres)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Montant total:</span>
                    <span className="font-semibold">{formatFCFA(financeData.student.tuitionFee)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Payé:</span>
                    <span className="font-semibold text-green-600">{formatFCFA(paidTuition)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Reste à payer:</span>
                    <span className="font-semibold text-orange-600">
                      {formatFCFA(financeData.student.tuitionFee - paidTuition)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cartes de résumé global */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total général</p>
                    <p className="text-xl font-bold text-foreground">{formatFCFA(totalAll)}</p>
                  </div>
                  <FaChartBar className="text-2xl text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total payé</p>
                    <p className="text-xl font-bold text-green-600">{formatFCFA(totalPaid)}</p>
                  </div>
                  <FaReceipt className="text-2xl text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">En attente</p>
                    <p className="text-xl font-bold text-blue-600">{formatFCFA(totalPending)}</p>
                  </div>
                  <FaHistory className="text-2xl text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">En retard</p>
                    <p className="text-xl font-bold text-red-600">{formatFCFA(totalOverdue)}</p>
                  </div>
                  <FaFileInvoice className="text-2xl text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtres - Version mobile avec Select */}
          <div className="block lg:hidden mb-6">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                {statusFilters.map(filter => (
                  <SelectItem key={filter.id} value={filter.id}>
                    {filter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtres - Version desktop avec Tabs */}
          <div className="hidden lg:block mb-6">
            <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                {statusFilters.map(filter => (
                  <TabsTrigger key={filter.id} value={filter.id}>
                    {filter.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Tableau des frais */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <FaFileInvoice className="text-primary" />
                  Détail de Tous les Frais
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {sortedFees.length} frais trouvé(s)
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => handleSort("reference")}
                      >
                        <div className="flex items-center gap-1">
                          Référence {getSortIcon("reference")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => handleSort("description")}
                      >
                        <div className="flex items-center gap-1">
                          Description {getSortIcon("description")}
                        </div>
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => handleSort("amount")}
                      >
                        <div className="flex items-center gap-1">
                          Montant {getSortIcon("amount")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => handleSort("dueDate")}
                      >
                        <div className="flex items-center gap-1">
                          Échéance {getSortIcon("dueDate")}
                        </div>
                      </TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedFees.map(fee => (
                      <TableRow key={fee.id}>
                        <TableCell className="font-mono text-sm">
                          {fee.reference}
                        </TableCell>
                        <TableCell className="font-medium">
                          {fee.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTypeVariant(fee.type)}>
                            {getTypeIcon(fee.type)}
                            {fee.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatFCFA(fee.amount)}
                        </TableCell>
                        <TableCell>
                          {fee.dueDate}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(fee.status)}>
                            {fee.status === "paid" ? "Payé" : fee.status === "pending" ? "En attente" : "En retard"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {fee.status === "paid" && (
                              <Button
                                onClick={() => downloadReceipt(fee)}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <FaDownload size={12} />
                                <span className="hidden sm:inline">Reçu</span>
                              </Button>
                            )}
                            {(fee.status === "pending" || fee.status === "overdue") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                                onClick={() => toast.info('Veuillez vous rendre à la comptabilité pour effectuer le paiement')}
                              >
                                <FaCreditCard size={12} />
                                <span className="hidden sm:inline">Payer</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {sortedFees.length === 0 && (
                  <div className="text-center py-12">
                    <FaFileInvoice className="text-5xl text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Aucun frais trouvé</h3>
                    <p className="text-muted-foreground">Aucun frais scolaire ne correspond aux critères sélectionnés.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}