// app/dashboard/comptable/statistiques/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  TrendingUp,
  Users,
  GraduationCap,
  DollarSign,
  PieChart as PieChartIcon,
  Calendar,
  Target,
  CreditCard,
} from "lucide-react";

// Interfaces basées sur les données de paiement et balance
interface PaymentStats {
  id: string;
  studentId: string;
  studentName: string;
  parentName: string;
  filiere: string;
  vague: string;
  montant: number;
  type: 'inscription' | 'scolarite';
  methode: 'online' | 'especes' | 'cheque' | 'virement' | 'mobile_money';
  statut: 'en_attente' | 'approuve' | 'rejete' | 'saisi_manuel';
  datePaiement: string;
  dateValidation?: string;
}

interface BalanceStats {
  id: string;
  date: string;
  vague: string;
  filiere: string;
  libelle: string;
  debit: number;
  credit: number;
  reference: string;
}

// Données simulées basées sur la structure de paiement et balance
const mockPaymentsStats: PaymentStats[] = [
  {
    id: "1",
    studentId: "s1",
    studentName: "Marie Dupont",
    parentName: "M. Dupont",
    filiere: "Développement Web",
    vague: "Vague Janvier 2024",
    montant: 150000,
    type: "scolarite",
    methode: "online",
    statut: "approuve",
    datePaiement: "2024-01-20",
    dateValidation: "2024-01-20"
  },
  {
    id: "2",
    studentId: "s2",
    studentName: "Pierre Martin",
    parentName: "Mme. Martin",
    filiere: "Data Science",
    vague: "Vague Janvier 2024",
    montant: 200000,
    type: "scolarite",
    methode: "online",
    statut: "approuve",
    datePaiement: "2024-01-19",
    dateValidation: "2024-01-19"
  },
  {
    id: "3",
    studentId: "s3",
    studentName: "Sophie Bernard",
    parentName: "M. Bernard",
    filiere: "Design Graphique",
    vague: "Vague Janvier 2024",
    montant: 50000,
    type: "inscription",
    methode: "especes",
    statut: "approuve",
    datePaiement: "2024-01-18",
    dateValidation: "2024-01-18"
  }
];

const mockBalanceStats: BalanceStats[] = [
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

export default function StatistiquesFinancieresPage() {
  const [selectedVague, setSelectedVague] = useState("all");
  const [selectedFiliere, setSelectedFiliere] = useState("all");
  const [payments, setPayments] = useState<PaymentStats[]>([]);
  const [balance, setBalance] = useState<BalanceStats[]>([]);

  // Initialisation des données
  useEffect(() => {
    setPayments(mockPaymentsStats);
    setBalance(mockBalanceStats);
  }, []);

  // Calcul des indicateurs basés sur les paiements et la balance
  const paiementsApprouves = payments.filter(p => p.statut === 'approuve');
  
  const totalRecettes = paiementsApprouves.reduce((sum, p) => sum + p.montant, 0);
  const totalRecettesScolarite = paiementsApprouves
    .filter(p => p.type === 'scolarite')
    .reduce((sum, p) => sum + p.montant, 0);
  const totalRecettesInscriptions = paiementsApprouves
    .filter(p => p.type === 'inscription')
    .reduce((sum, p) => sum + p.montant, 0);

  // Calcul des charges depuis la balance (comptes de charge)
  const totalCharges = balance.reduce((sum, op) => sum + op.debit, 0);
  const beneficeNet = totalRecettes - totalCharges;
  const margeBeneficiaire = totalRecettes > 0 ? (beneficeNet / totalRecettes) * 100 : 0;

  // Données pour graphiques - basées sur les paiements
  const vagues = Array.from(new Set(payments.map(p => p.vague)));
  const filieres = Array.from(new Set(payments.map(p => p.filiere)));

  const dataByVague = vagues.map(vague => {
    const paiementsVague = paiementsApprouves.filter(p => p.vague === vague);
    return {
      vague,
      scolarite: paiementsVague.filter(p => p.type === 'scolarite').reduce((sum, p) => sum + p.montant, 0),
      inscriptions: paiementsVague.filter(p => p.type === 'inscription').reduce((sum, p) => sum + p.montant, 0),
    };
  });

  const dataByMethodePaiement = [
    { methode: 'En ligne', montant: paiementsApprouves.filter(p => p.methode === 'online').reduce((sum, p) => sum + p.montant, 0) },
    { methode: 'Espèces', montant: paiementsApprouves.filter(p => p.methode === 'especes').reduce((sum, p) => sum + p.montant, 0) },
    { methode: 'Virement', montant: paiementsApprouves.filter(p => p.methode === 'virement').reduce((sum, p) => sum + p.montant, 0) },
    { methode: 'Mobile Money', montant: paiementsApprouves.filter(p => p.methode === 'mobile_money').reduce((sum, p) => sum + p.montant, 0) },
  ];

  // Données d'évolution mensuelle basées sur les dates de paiement
  const monthlyData = [
    { mois: "Jan", recettes: 550000, charges: 150000 },
    { mois: "Fév", recettes: 50000, charges: 0 },
    { mois: "Mar", recettes: 400000, charges: 200000 },
    { mois: "Avr", recettes: 350000, charges: 100000 },
  ];

  // Performance par vague
  const performanceVagues = vagues.map(vague => {
    const paiementsVague = paiementsApprouves.filter(p => p.vague === vague);
    const recettesVague = paiementsVague.reduce((sum, p) => sum + p.montant, 0);
    const chargesVague = balance.filter(op => op.vague === vague).reduce((sum, op) => sum + op.debit, 0);
    
    return {
      vague,
      filiere: payments.find(p => p.vague === vague)?.filiere || 'Multiple',
      effectif: new Set(paiementsVague.map(p => p.studentId)).size,
      recettes: recettesVague,
      charges: chargesVague,
      rentabilite: recettesVague > 0 ? ((recettesVague - chargesVague) / recettesVague) * 100 : 0
    };
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(value);

  const formatPercent = (value: number) =>
    `${value.toFixed(1)}%`;

  return (
    <div className="min-h-screen bg-gray-50 p-6 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Financier</h1>
            <p className="text-gray-600 mt-2">
              Statistiques basées sur les paiements et la balance comptable
            </p>
          </div>
        </div>

        {/* Indicateurs Clés */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chiffre d&apos;Affaires</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRecettes)}</div>
              <p className="text-xs text-gray-500 mt-1">
                {paiementsApprouves.length} paiements approuvés
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scolarité</CardTitle>
              <GraduationCap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalRecettesScolarite)}</div>
              <p className="text-xs text-gray-500 mt-1">
                {paiementsApprouves.filter(p => p.type === 'scolarite').length} paiements
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inscriptions</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(totalRecettesInscriptions)}</div>
              <p className="text-xs text-gray-500 mt-1">
                {paiementsApprouves.filter(p => p.type === 'inscription').length} paiements
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bénéfice Net</CardTitle>
              <Target className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${beneficeNet >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                {formatCurrency(beneficeNet)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Marge: {formatPercent(margeBeneficiaire)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tableau de Performance Détail */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Performance par Vague et Filière
            </CardTitle>
            <CardDescription>Analyse détaillée basée sur les paiements et charges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="sm:flex flex-col gap-4  mb-6 lg:flex flex-row">
              <Select value={selectedVague} onValueChange={setSelectedVague}>
                <SelectTrigger className="mb-4 bg-white w-[200px]">
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

              <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                <SelectTrigger className="bg-white w-[200px]">
                  <SelectValue placeholder="Toutes les filières" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">Toutes les filières</SelectItem>
                  {filieres.map((filiere) => (
                    <SelectItem key={filiere} value={filiere}>
                      {filiere}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Vague</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Filière</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Effectif</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Recettes</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Charges</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Bénéfice</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Rentabilité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {performanceVagues.map((vague, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{vague.vague}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{vague.filiere}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">{vague.effectif}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                        {formatCurrency(vague.recettes)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                        {formatCurrency(vague.charges)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-blue-600 font-medium">
                        {formatCurrency(vague.recettes - vague.charges)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          vague.rentabilite >= 30 ? 'bg-green-100 text-green-800' : 
                          vague.rentabilite >= 20 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {vague.rentabilite.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Résumé global */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRecettes)}</div>
                <div className="text-sm text-gray-600">Recettes Totales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{formatCurrency(totalCharges)}</div>
                <div className="text-sm text-gray-600">Charges Totales</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${beneficeNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(beneficeNet)}
                </div>
                <div className="text-sm text-gray-600">Bénéfice Net</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Graphiques Principaux */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Répartition par Type de Paiement */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Répartition des Recettes
              </CardTitle>
              <CardDescription>Par type de formation</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                 <Pie
  data={[
    { name: 'Scolarité', value: totalRecettesScolarite },
    { name: 'Inscriptions', value: totalRecettesInscriptions }
  ]}
  cx="50%"
  cy="50%"
  labelLine={false}
  label={(props: { name?: string; percent?: number }) => {
    const name = props.name ?? "";
    const percent = props.percent ?? 0;
    return `${name}: ${(percent * 100).toFixed(1)}%`;
  }}
  outerRadius={100}
  fill="#8884d8"
  dataKey="value"
>
  <Cell fill="#0088FE" />
  <Cell fill="#00C49F" />
</Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Méthodes de Paiement */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Méthodes de Paiement
              </CardTitle>
              <CardDescription>Répartition par mode de paiement</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dataByMethodePaiement}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="methode" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="montant" fill="#8884d8" radius={[4, 4, 0, 0]} name="Montant" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance par Vague */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance par Vague
              </CardTitle>
              <CardDescription>Recettes scolaires par vague de formation</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dataByVague}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="vague" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="scolarite" fill="#0088FE" name="Scolarité" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="inscriptions" fill="#00C49F" name="Inscriptions" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Évolution Mensuelle */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Évolution Mensuelle
              </CardTitle>
              <CardDescription>Trend des recettes et charges</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
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
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
