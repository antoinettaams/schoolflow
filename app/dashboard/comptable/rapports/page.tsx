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
} from "lucide-react";

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

const mockMonthlyReports: MonthlyReport[] = [
  {
    id: "1",
    mois: "Janvier",
    annee: 2024,
    recettesScolarite: 4500000,
    recettesInscriptions: 750000,
    autresRecettes: 300000,
    chargesPersonnel: 2800000,
    chargesFonctionnement: 800000,
    chargesMateriel: 450000,
    investissements: 1000000,
    effectifTotal: 120,
    nouvellesInscriptions: 25,
    tauxRemplissage: 85
  },
  {
    id: "2",
    mois: "Février",
    annee: 2024,
    recettesScolarite: 5200000,
    recettesInscriptions: 900000,
    autresRecettes: 350000,
    chargesPersonnel: 3100000,
    chargesFonctionnement: 850000,
    chargesMateriel: 500000,
    investissements: 1200000,
    effectifTotal: 135,
    nouvellesInscriptions: 18,
    tauxRemplissage: 92
  },
  {
    id: "3",
    mois: "Mars",
    annee: 2024,
    recettesScolarite: 4800000,
    recettesInscriptions: 800000,
    autresRecettes: 400000,
    chargesPersonnel: 2900000,
    chargesFonctionnement: 900000,
    chargesMateriel: 480000,
    investissements: 800000,
    effectifTotal: 125,
    nouvellesInscriptions: 15,
    tauxRemplissage: 88
  },
  {
    id: "4",
    mois: "Avril",
    annee: 2024,
    recettesScolarite: 5500000,
    recettesInscriptions: 950000,
    autresRecettes: 450000,
    chargesPersonnel: 3200000,
    chargesFonctionnement: 950000,
    chargesMateriel: 520000,
    investissements: 1500000,
    effectifTotal: 140,
    nouvellesInscriptions: 22,
    tauxRemplissage: 95
  }
];

const mockPerformanceFilieres: PerformanceFiliere[] = [
  {
    filiere: "Développement Web",
    vague: "Vague Janvier 2024",
    effectif: 45,
    recettes: 3800000,
    charges: 2200000,
    rentabilite: 42.1
  },
  {
    filiere: "Data Science",
    vague: "Vague Janvier 2024",
    effectif: 32,
    recettes: 2800000,
    charges: 1800000,
    rentabilite: 35.7
  },
  {
    filiere: "Design Graphique",
    vague: "Vague Février 2024",
    effectif: 28,
    recettes: 2200000,
    charges: 1500000,
    rentabilite: 31.8
  },
  {
    filiere: "Marketing Digital",
    vague: "Vague Mars 2024",
    effectif: 35,
    recettes: 2600000,
    charges: 1600000,
    rentabilite: 38.5
  }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function RapportsMensuelsPage() {
  const [selectedMois, setSelectedMois] = useState("2024-04");
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [performanceFilieres, setPerformanceFilieres] = useState<PerformanceFiliere[]>([]);

  useEffect(() => {
    setReports(mockMonthlyReports);
    setPerformanceFilieres(mockPerformanceFilieres);
  }, []);

  // Calcul des indicateurs pour le mois sélectionné
  const currentReport = reports.find(r => `${r.annee}-${r.mois.toLowerCase()}` === selectedMois) || reports[0];

  const totalRecettes = currentReport ? 
    currentReport.recettesScolarite + currentReport.recettesInscriptions + currentReport.autresRecettes : 0;
  
  const totalCharges = currentReport ?
    currentReport.chargesPersonnel + currentReport.chargesFonctionnement + currentReport.chargesMateriel + currentReport.investissements : 0;
  
  const beneficeNet = totalRecettes - totalCharges;
  const margeBeneficiaire = totalRecettes > 0 ? (beneficeNet / totalRecettes) * 100 : 0;

  // Données pour graphiques
  const dataRecettes = [
    { name: 'Scolarité', value: currentReport?.recettesScolarite || 0 },
    { name: 'Inscriptions', value: currentReport?.recettesInscriptions || 0 },
    { name: 'Autres', value: currentReport?.autresRecettes || 0 },
  ];

  const dataCharges = [
    { name: 'Personnel', value: currentReport?.chargesPersonnel || 0 },
    { name: 'Fonctionnement', value: currentReport?.chargesFonctionnement || 0 },
    { name: 'Matériel', value: currentReport?.chargesMateriel || 0 },
    { name: 'Investissements', value: currentReport?.investissements || 0 },
  ];

  const dataEvolution = reports.map(report => ({
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
    alert(`Génération du rapport mensuel ${currentReport?.mois} ${currentReport?.annee}...`);
  };

  const printReport = () => {
    window.print();
  };

  const viewReportDetails = (report: MonthlyReport) => {
    alert(`Détails du rapport ${report.mois} ${report.annee}\nRecettes: ${formatCurrency(report.recettesScolarite + report.recettesInscriptions + report.autresRecettes)}\nCharges: ${formatCurrency(report.chargesPersonnel + report.chargesFonctionnement + report.chargesMateriel + report.investissements)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rapports Mensuels</h1>
            <p className="text-gray-600 mt-2">
              Analyse financière et performance mensuelle du centre
            </p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Select value={selectedMois} onValueChange={setSelectedMois}>
              <SelectTrigger className="w-[200px] bg-white">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sélectionner un mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-04">Avril 2024</SelectItem>
                <SelectItem value="2024-03">Mars 2024</SelectItem>
                <SelectItem value="2024-02">Février 2024</SelectItem>
                <SelectItem value="2024-01">Janvier 2024</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={printReport}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
            <Button onClick={generatePDF} className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
          </div>
        </div>

        {/* Bannière du mois en cours */}
        {currentReport && (
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    Rapport {currentReport.mois} {currentReport.annee}
                  </h2>
                  <p className="text-blue-100 mt-1">
                    Synthèse financière et indicateurs de performance
                  </p>
                </div>
                <div className="flex gap-4 mt-4 sm:mt-0">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{currentReport.effectifTotal}</div>
                    <div className="text-sm text-blue-200">Élèves total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{currentReport.nouvellesInscriptions}</div>
                    <div className="text-sm text-blue-200">Nouvelles inscriptions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{currentReport.tauxRemplissage}%</div>
                    <div className="text-sm text-blue-200">Taux remplissage</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                    label={({ label, percentage }) => `${label}: ${percentage}%`}
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
                Évolution sur 4 Mois
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
                  {reports.map((report) => {
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

        {/* Performance par filière */}
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
      </div>
    </div>
  );
}