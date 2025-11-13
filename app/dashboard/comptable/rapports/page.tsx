// app/dashboard/comptable/rapports-mensuels/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Download,
  Calendar,
  TrendingUp,
  GraduationCap,
  DollarSign,
  PieChart as PieChartIcon,
  Building,
  Target,
  FileText,
  Eye,
  Printer,
  RefreshCw,
  Users,
  CreditCard,
  FileDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

interface MonthlyReport {
  id: string;
  mois: string;
  annee: number;
  recettesScolarite: number;
  recettesInscriptions: number;
  autresRecettes: number;
  chargesPersonnel: number;
  chargesFonctionnement: number;
  chargesMateriel: number;
  investissements: number;
  effectifTotal: number;
  nouvellesInscriptions: number;
  tauxRemplissage: number;
}

interface PerformanceFiliere {
  filiere: string;
  vague: string;
  effectif: number;
  recettes: number;
  charges: number;
  rentabilite: number;
}

// Service API
class RapportsService {
  private static readonly API_URL = '/api/comptable/rapports-mensuels';

  static async getRapports(annee?: string, mois?: string) {
    const params = new URLSearchParams();
    if (annee) params.append('annee', annee);
    if (mois) params.append('mois', mois);

    const response = await fetch(`${this.API_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des rapports');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Erreur inconnue');
    }

    return result;
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function RapportsMensuelsPage() {
  const [selectedMois, setSelectedMois] = useState<string>("tous");
  const [selectedAnnee, setSelectedAnnee] = useState<string>(new Date().getFullYear().toString());
  const [rapports, setRapports] = useState<MonthlyReport[]>([]);
  const [performanceFilieres, setPerformanceFilieres] = useState<PerformanceFiliere[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRapport, setCurrentRapport] = useState<MonthlyReport | null>(null);

  // Charger les données
  const loadData = async (annee?: string, mois?: string) => {
    try {
      setLoading(true);
      const result = await RapportsService.getRapports(annee, mois && mois !== "tous" ? mois : undefined);
      
      if (mois && mois !== "tous") {
        // Rapport mensuel spécifique
        setCurrentRapport(result.data.rapportMensuel);
        setPerformanceFilieres(result.data.performanceFilieres);
      } else {
        // Tous les rapports
        setRapports(result.data.rapportsMensuels);
        setPerformanceFilieres(result.data.performanceFilieres);
        setCurrentRapport(result.data.rapportsMensuels[0] || null);
      }

      toast.success(`Rapports chargés avec succès`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du chargement';
      toast.error(errorMessage);
      console.error('Erreur chargement rapports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    loadData(selectedAnnee);
  }, [selectedAnnee]);

  // Mettre à jour le rapport courant quand selectedMois change
  useEffect(() => {
    if (selectedMois && selectedMois !== "tous") {
      loadData(selectedAnnee, selectedMois);
    } else if (rapports.length > 0) {
      setCurrentRapport(rapports[0]);
    }
  }, [selectedMois, rapports, selectedAnnee]);

  // Calcul des indicateurs pour le rapport courant
  const totalRecettes = currentRapport ? 
    currentRapport.recettesScolarite + currentRapport.recettesInscriptions + currentRapport.autresRecettes : 0;
  
  const totalCharges = currentRapport ?
    currentRapport.chargesPersonnel + currentRapport.chargesFonctionnement + currentRapport.chargesMateriel + currentRapport.investissements : 0;
  
  const beneficeNet = totalRecettes - totalCharges;
  const margeBeneficiaire = totalRecettes > 0 ? (beneficeNet / totalRecettes) * 100 : 0;

  // Données pour graphiques
  const dataRecettes = [
    { name: 'Scolarité', value: currentRapport?.recettesScolarite || 0 },
    { name: 'Inscriptions', value: currentRapport?.recettesInscriptions || 0 },
    { name: 'Autres', value: currentRapport?.autresRecettes || 0 },
  ];

  const dataCharges = [
    { name: 'Personnel', value: currentRapport?.chargesPersonnel || 0 },
    { name: 'Fonctionnement', value: currentRapport?.chargesFonctionnement || 0 },
    { name: 'Matériel', value: currentRapport?.chargesMateriel || 0 },
    { name: 'Investissements', value: currentRapport?.investissements || 0 },
  ];

  const dataEvolution = rapports.map(report => ({
    mois: report.mois.substring(0, 3),
    recettes: report.recettesScolarite + report.recettesInscriptions + report.autresRecettes,
    charges: report.chargesPersonnel + report.chargesFonctionnement + report.chargesMateriel + report.investissements,
    benefice: (report.recettesScolarite + report.recettesInscriptions + report.autresRecettes) - 
              (report.chargesPersonnel + report.chargesFonctionnement + report.chargesMateriel + report.investissements)
  }));

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(value);

  const formatPercent = (value: number) =>
    `${value.toFixed(1)}%`;

  const generatePDF = () => {
    if (!currentRapport) {
      toast.error("Aucun rapport sélectionné");
      return;
    }
    toast.success(`Génération du rapport ${currentRapport.mois} ${currentRapport.annee}...`);
    // Implémentez ici la logique de génération PDF
  };

  const printReport = () => {
    window.print();
  };

  const viewReportDetails = (report: MonthlyReport) => {
    toast.success(`Détails du rapport ${report.mois} ${report.annee}`);
  };

  // Options pour les sélecteurs - CORRIGÉ : toutes les options ont une valeur non vide
  const moisOptions = [
    { value: "tous", label: "Tous les mois" },
    { value: "janvier", label: "Janvier" },
    { value: "février", label: "Février" },
    { value: "mars", label: "Mars" },
    { value: "avril", label: "Avril" },
    { value: "mai", label: "Mai" },
    { value: "juin", label: "Juin" },
  ];

  const anneesOptions = [
    { value: "2024", label: "2024" },
    { value: "2023", label: "2023" },
  ];

  // Skeleton components
  const SkeletonCard = () => (
    <Card className="bg-white">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-32 mt-2" />
      </CardContent>
    </Card>
  );

  const SkeletonTableRow = () => (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
    </TableRow>
  );

  const SkeletonChart = () => (
    <div className="w-full h-[300px] flex items-center justify-center border rounded-lg">
      <Skeleton className="h-64 w-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rapports Mensuels</h1>
            <p className="text-gray-600 mt-2">
              Analyse financière et performance mensuelle du centre
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 sm:mt-0">
            <div className="flex gap-2">
              <Select value={selectedAnnee} onValueChange={setSelectedAnnee}>
                <SelectTrigger className="w-[120px] bg-white">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  {anneesOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedMois} onValueChange={setSelectedMois}>
                <SelectTrigger className="w-[160px] bg-white">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Mois" />
                </SelectTrigger>
                <SelectContent>
                  {moisOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={printReport} disabled={loading}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
              <Button onClick={generatePDF} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                Exporter PDF
              </Button>
              <Button variant="outline" onClick={() => loadData(selectedAnnee, selectedMois)} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : 'animate-spin'}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            {/* Bannière de chargement */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Skeleton className="h-8 w-64 bg-blue-400" />
                    <Skeleton className="h-4 w-48 bg-blue-400 mt-2" />
                  </div>
                  <div className="flex gap-4 mt-4 sm:mt-0">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="text-center">
                        <Skeleton className="h-8 w-12 bg-blue-400 mx-auto" />
                        <Skeleton className="h-3 w-16 bg-blue-400 mt-1" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Indicateurs Clés */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white">
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <SkeletonChart />
                </CardContent>
              </Card>
              <Card className="bg-white">
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <SkeletonChart />
                </CardContent>
              </Card>
              <Card className="lg:col-span-2 bg-white">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-40" />
                </CardHeader>
                <CardContent>
                  <SkeletonChart />
                </CardContent>
              </Card>
            </div>

            {/* Tableaux */}
            <Card className="bg-white">
              <CardHeader>
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {[...Array(8)].map((_, i) => (
                        <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(5)].map((_, i) => (
                      <SkeletonTableRow key={i} />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contenu principal */}
        {!loading && currentRapport && (
          <>
            {/* Bannière du mois en cours */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Rapport {currentRapport.mois} {currentRapport.annee}
                    </h2>
                    <p className="text-blue-100 mt-1">
                      Synthèse financière et indicateurs de performance
                    </p>
                  </div>
                  <div className="flex gap-4 mt-4 sm:mt-0">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{currentRapport.effectifTotal}</div>
                      <div className="text-sm text-blue-200">Élèves total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{currentRapport.nouvellesInscriptions}</div>
                      <div className="text-sm text-blue-200">Nouvelles inscriptions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{currentRapport.tauxRemplissage}%</div>
                      <div className="text-sm text-blue-200">Taux remplissage</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Indicateurs Clés */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chiffre d&apos;Affaires</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRecettes)}</div>
                  <p className="text-xs text-gray-500 mt-1">Recettes totales du mois</p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Charges Totales</CardTitle>
                  <Building className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(totalCharges)}</div>
                  <p className="text-xs text-gray-500 mt-1">Dépenses du mois</p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bénéfice Net</CardTitle>
                  <Target className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${beneficeNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(beneficeNet)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Résultat mensuel</p>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Marge Bénéficiaire</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${margeBeneficiaire >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                    {formatPercent(margeBeneficiaire)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Taux de rentabilité</p>
                </CardContent>
              </Card>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Répartition des Recettes */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Répartition des Recettes
                  </CardTitle>
                  <CardDescription>Sources de revenus du mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dataRecettes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dataRecettes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Structure des Charges */}
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Structure des Charges
                  </CardTitle>
                  <CardDescription>Répartition des coûts du mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dataCharges}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Évolution sur 4 mois */}
              <Card className="lg:col-span-2 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Évolution sur {rapports.length} Mois
                  </CardTitle>
                  <CardDescription>Trend des recettes, charges et bénéfices</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dataEvolution}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="mois" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="recettes" 
                        stroke="#0088FE" 
                        name="Recettes" 
                        strokeWidth={3}
                        dot={{ fill: '#0088FE', strokeWidth: 2, r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="charges" 
                        stroke="#FF8042" 
                        name="Charges" 
                        strokeWidth={3}
                        dot={{ fill: '#FF8042', strokeWidth: 2, r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="benefice" 
                        stroke="#00C49F" 
                        name="Bénéfice" 
                        strokeWidth={3}
                        dot={{ fill: '#00C49F', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Tableau des rapports mensuels */}
            {rapports.length > 0 && (
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Historique des Rapports Mensuels
                  </CardTitle>
                  <CardDescription>Comparatif des performances sur les derniers mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mois</TableHead>
                          <TableHead className="text-right">Recettes Total</TableHead>
                          <TableHead className="text-right">Charges Total</TableHead>
                          <TableHead className="text-right">Bénéfice Net</TableHead>
                          <TableHead className="text-right">Marge</TableHead>
                          <TableHead className="text-right">Effectif</TableHead>
                          <TableHead className="text-right">Nouv. Insc.</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rapports.map((report) => {
                          const reportRecettes = report.recettesScolarite + report.recettesInscriptions + report.autresRecettes;
                          const reportCharges = report.chargesPersonnel + report.chargesFonctionnement + report.chargesMateriel + report.investissements;
                          const reportBenefice = reportRecettes - reportCharges;
                          const reportMarge = reportRecettes > 0 ? (reportBenefice / reportRecettes) * 100 : 0;

                          return (
                            <TableRow key={report.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">
                                {report.mois} {report.annee}
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-semibold">
                                {formatCurrency(reportRecettes)}
                              </TableCell>
                              <TableCell className="text-right text-red-600 font-semibold">
                                {formatCurrency(reportCharges)}
                              </TableCell>
                              <TableCell className={`text-right font-bold ${
                                reportBenefice >= 0 ? 'text-blue-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(reportBenefice)}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  reportMarge >= 20 ? 'bg-green-100 text-green-800' : 
                                  reportMarge >= 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {reportMarge.toFixed(1)}%
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-gray-900">
                                {report.effectifTotal}
                              </TableCell>
                              <TableCell className="text-right text-gray-900">
                                {report.nouvellesInscriptions}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => viewReportDetails(report)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance par filière */}
            {performanceFilieres.length > 0 && (
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Performance par Filière
                  </CardTitle>
                  <CardDescription>Rentabilité des différentes formations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Filière</TableHead>
                          <TableHead>Vague</TableHead>
                          <TableHead className="text-right">Effectif</TableHead>
                          <TableHead className="text-right">Recettes</TableHead>
                          <TableHead className="text-right">Charges</TableHead>
                          <TableHead className="text-right">Bénéfice</TableHead>
                          <TableHead className="text-right">Rentabilité</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {performanceFilieres.map((filiere, index) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{filiere.filiere}</TableCell>
                            <TableCell>{filiere.vague}</TableCell>
                            <TableCell className="text-right">{filiere.effectif}</TableCell>
                            <TableCell className="text-right text-green-600 font-medium">
                              {formatCurrency(filiere.recettes)}
                            </TableCell>
                            <TableCell className="text-right text-red-600 font-medium">
                              {formatCurrency(filiere.charges)}
                            </TableCell>
                            <TableCell className="text-right text-blue-600 font-bold">
                              {formatCurrency(filiere.recettes - filiere.charges)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                filiere.rentabilite >= 35 ? 'bg-green-100 text-green-800' : 
                                filiere.rentabilite >= 25 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {filiere.rentabilite.toFixed(1)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Message si pas de données */}
        {!loading && !currentRapport && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileDown className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun rapport disponible
              </h3>
              <p className="text-gray-600 mb-6">
                Aucune donnée n&apos;a été trouvée pour la période sélectionnée.
              </p>
              <Button onClick={() => loadData(selectedAnnee)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}