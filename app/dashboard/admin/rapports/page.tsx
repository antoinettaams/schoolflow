// app/(dashboard)/rapports/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, DollarSign, CreditCard, Wallet, TrendingUpIcon, FileText, BarChart3, Users, BookOpen,TrendingUp, TrendingDown, Minus, Calendar, School, UserCheck } from 'lucide-react';

type TimeRange = 'week' | 'month' | 'quarter' | 'year'; 

export default function RapportsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedWave, setSelectedWave] = useState('WAVE-2024-01');
  const [selectedFiliere, setSelectedFiliere] = useState('all');

  // Données mockées pour centre de formation
  const kpiData = [
    { 
      title: "Taux de Réussite", 
      value: "82%", 
      change: "+3%", 
      trend: "up" as const, 
      description: "Moyenne des certifications",
      icon: <TrendingUp className="h-4 w-4" />
    },
    { 
      title: "Apprenants Actifs", 
      value: "156", 
      change: "+12", 
      trend: "up" as const, 
      description: "En formation actuelle",
      icon: <Users className="h-4 w-4" />
    },
    { 
      title: "Taux de Complétion", 
      value: "78%", 
      change: "-2%", 
      trend: "down" as const, 
      description: "Modules terminés",
      icon: <BookOpen className="h-4 w-4" />
    },
    { 
      title: "Assiduité Générale", 
      value: "91%", 
      change: "+1%", 
      trend: "up" as const, 
      description: "Taux de présence moyen",
      icon: <UserCheck className="h-4 w-4" />
    }
  ];

  const financialKpiData = [
    { 
      title: "Chiffre d&apos;Affaires", 
      value: "285K €", 
      change: "+15%", 
      trend: "up" as const, 
      description: "CA mensuel",
      icon: <DollarSign className="h-4 w-4" />
    },
    { 
      title: "Recettes Totales", 
      value: "1.2M €", 
      change: "+22%", 
      trend: "up" as const, 
      description: "Année en cours",
      icon: <CreditCard className="h-4 w-4" />
    },
    { 
      title: "Dépenses", 
      value: "890K €", 
      change: "+8%", 
      trend: "up" as const, 
      description: "Année en cours",
      icon: <TrendingUpIcon className="h-4 w-4" />
    },
    { 
      title: "Bénéfice Net", 
      value: "310K €", 
      change: "+35%", 
      trend: "up" as const, 
      description: "Marge nette",
      icon: <Wallet className="h-4 w-4" />
    }
  ];

  const wavePerformanceData = [
    { period: 'Semaine 1', 'WAVE-2024-01': 12.5, 'WAVE-2024-02': 11.8, 'WAVE-2023-04': 13.2 },
    { period: 'Semaine 2', 'WAVE-2024-01': 13.2, 'WAVE-2024-02': 12.4, 'WAVE-2023-04': 13.8 },
    { period: 'Semaine 3', 'WAVE-2024-01': 14.1, 'WAVE-2024-02': 13.2, 'WAVE-2023-04': 14.3 },
    { period: 'Semaine 4', 'WAVE-2024-01': 14.8, 'WAVE-2024-02': 13.9, 'WAVE-2023-04': 14.7 },
    { period: 'Semaine 5', 'WAVE-2024-01': 15.2, 'WAVE-2024-02': 14.3, 'WAVE-2023-04': 15.0 },
    { period: 'Semaine 6', 'WAVE-2024-01': 15.5, 'WAVE-2024-02': 14.8, 'WAVE-2023-04': 15.2 },
  ];

  const moduleSuccessData = [
    { module: 'Développement Web', completion: 85, average: 14.2, progression: '+5%', formateur: 'M. Diallo' },
    { module: 'Base de Données', completion: 78, average: 13.5, progression: '+2%', formateur: 'Mme. Traoré' },
    { module: 'Réseaux & Sécurité', completion: 72, average: 12.8, progression: '-3%', formateur: 'M. Ndiaye' },
    { module: 'UI/UX Design', completion: 88, average: 14.8, progression: '+7%', formateur: 'Mme. Sy' },
    { module: 'DevOps', completion: 68, average: 12.2, progression: '-5%', formateur: 'M. Ba' },
    { module: 'Cloud Computing', completion: 75, average: 13.1, progression: '+1%', formateur: 'M. Kane' },
  ];

  // CORRECTION: Données pour le PieChart
  const certificationData = [
    { status: 'Certifiés', value: 65, color: '#00C49F' },
    { status: 'En cours', value: 25, color: '#0088FE' },
    { status: 'En échec', value: 8, color: '#FF8042' },
    { status: 'Abandon', value: 2, color: '#FF0000' },
  ];

  const classReportData = [
    { 
      filiere: 'Développement Web', 
      vague: 'WAVE-2024-01', 
      formateur: 'M. Diallo',
      progression: 75,
      moyenne: 14.2,
      assiduite: 92,
      modulesTermines: 8,
      modulesTotal: 12,
      satisfaction: 4.2,
      statut: 'Bonne progression'
    },
    { 
      filiere: 'Réseaux & Sécurité', 
      vague: 'WAVE-2024-02', 
      formateur: 'M. Ndiaye',
      progression: 58,
      moyenne: 12.1,
      assiduite: 85,
      modulesTermines: 5,
      modulesTotal: 10,
      satisfaction: 3.8,
      statut: 'Problème détecté'
    },
    { 
      filiere: 'Data Science', 
      vague: 'WAVE-2024-01', 
      formateur: 'Mme. Traoré',
      progression: 82,
      moyenne: 15.1,
      assiduite: 94,
      modulesTermines: 9,
      modulesTotal: 11,
      satisfaction: 4.5,
      statut: 'Excellente progression'
    },
    { 
      filiere: 'Cloud Computing', 
      vague: 'WAVE-2024-02', 
      formateur: 'M. Kane',
      progression: 65,
      moyenne: 13.4,
      assiduite: 88,
      modulesTermines: 6,
      modulesTotal: 10,
      satisfaction: 4.0,
      statut: 'Progression normale'
    },
    { 
      filiere: 'Cyber Sécurité', 
      vague: 'WAVE-2023-04', 
      formateur: 'M. Ba',
      progression: 45,
      moyenne: 11.2,
      assiduite: 79,
      modulesTermines: 4,
      modulesTotal: 9,
      satisfaction: 3.2,
      statut: 'Attention requise'
    },
    { 
      filiere: 'Mobile Development', 
      vague: 'WAVE-2024-01', 
      formateur: 'Mme. Sy',
      progression: 88,
      moyenne: 15.8,
      assiduite: 96,
      modulesTermines: 10,
      modulesTotal: 12,
      satisfaction: 4.7,
      statut: 'Excellente progression'
    },
  ];

  // Fonctions utilitaires
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Excellente progression': return 'default';
      case 'Bonne progression': return 'default';
      case 'Progression normale': return 'secondary';
      case 'Attention requise': return 'default';
      case 'Problème détecté': return 'destructive';
      default: return 'outline';
    }
  };

  const getSatisfactionColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 4.0) return 'text-blue-600';
    if (score >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Exporting as ${format}`);
  };

  // CORRECTION: Fonction de rendu simplifiée pour les labels du PieChart
  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="h-screen flex flex-col lg:pl-5 pt-20 lg:pt-6">
      {/* Header fixe */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                Tableau de Bord Censeur
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Rapports détaillés par filière et performance des formateurs
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                <SelectTrigger className="w-full sm:w-[160px] bg-white">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Cette Semaine</SelectItem>
                  <SelectItem value="month">Ce Mois</SelectItem>
                  <SelectItem value="quarter">Ce Trimestre</SelectItem>
                  <SelectItem value="year">Cette Année</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleExport('excel')} className="flex-1 bg-white">
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                
                <Button onClick={() => handleExport('pdf')} className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
          {/* Cartes KPI Académiques */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Indicateurs Académiques</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiData.map((kpi, index) => (
                <Card key={index} className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">{kpi.title}</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                      {kpi.icon}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {getTrendIcon(kpi.trend)}
                      <p className={`text-xs ${getTrendColor(kpi.trend)}`}>
                        {kpi.change} vs précédent
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{kpi.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cartes KPI Financières */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Indicateurs Financiers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {financialKpiData.map((kpi, index) => (
                <Card key={index} className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">{kpi.title}</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
                      {kpi.icon}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {getTrendIcon(kpi.trend)}
                      <p className={`text-xs ${getTrendColor(kpi.trend)}`}>
                        {kpi.change} vs précédent
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{kpi.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Graphiques Principaux */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance des Vagues */}
            <Card className="lg:col-span-2 bg-white border-gray-200">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Performance des Vagues par Filière
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Évolution des moyennes par semaine
                    </CardDescription>
                  </div>
                  <Select value={selectedWave} onValueChange={setSelectedWave}>
                    <SelectTrigger className="w-full sm:w-[200px] bg-white">
                      <SelectValue placeholder="Sélectionner une vague" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WAVE-2024-01">WAVE 2024-01</SelectItem>
                      <SelectItem value="WAVE-2024-02">WAVE 2024-02</SelectItem>
                      <SelectItem value="WAVE-2023-04">WAVE 2023-04</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={wavePerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="period" stroke="#666" />
                      <YAxis domain={[10, 16]} stroke="#666" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e5e5',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="WAVE-2024-01" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        name="WAVE 2024-01"
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="WAVE-2024-02" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        name="WAVE 2024-02"
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="WAVE-2023-04" 
                        stroke="#f59e0b" 
                        strokeWidth={3}
                        name="WAVE 2023-04"
                        dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Performance par Module */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Performance par Module</CardTitle>
                <CardDescription className="text-gray-600">
                  Taux de complétion et progression par matière
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moduleSuccessData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" domain={[0, 100]} stroke="#666" />
                      <YAxis 
                        type="category" 
                        dataKey="module" 
                        width={100} 
                        stroke="#666"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e5e5',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar 
                        dataKey="completion" 
                        name="Taux de complétion %" 
                        fill="#3b82f6" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Statut de Certification - CORRIGÉ */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Statut de Certification</CardTitle>
                <CardDescription className="text-gray-600">
                  Répartition des apprenants par statut
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={certificationData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {certificationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [`${value} apprenants`, name]}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e5e5',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rapport de Classe par Filière */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <School className="h-5 w-5 text-blue-600" />
                    Rapport de Classe par Filière
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Analyse détaillée de l&apos;avancement et performance des filières
                  </CardDescription>
                </div>
                <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                  <SelectTrigger className="w-full sm:w-[200px] bg-white">
                    <SelectValue placeholder="Toutes filières" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes filières</SelectItem>
                    <SelectItem value="dev">Développement Web</SelectItem>
                    <SelectItem value="reseau">Réseaux & Sécurité</SelectItem>
                    <SelectItem value="data">Data Science</SelectItem>
                    <SelectItem value="cloud">Cloud Computing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="text-gray-700 font-semibold">Filière</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Vague</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Formateur</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Progression</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Moyenne</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Assiduité</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Modules</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Satisfaction</TableHead>
                      <TableHead className="text-gray-700 font-semibold">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classReportData.map((classe, index) => (
                      <TableRow key={index} className="border-gray-100 hover:bg-gray-50/50">
                        <TableCell className="font-medium text-gray-900">{classe.filiere}</TableCell>
                        <TableCell className="text-gray-700">{classe.vague}</TableCell>
                        <TableCell className="text-gray-700">{classe.formateur}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${classe.progression}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 w-8">{classe.progression}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700">{classe.moyenne}/20</TableCell>
                        <TableCell>
                          <Badge variant={classe.assiduite >= 90 ? 'default' : 'secondary'}>
                            {classe.assiduite}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {classe.modulesTermines}/{classe.modulesTotal}
                        </TableCell>
                        <TableCell>
                          <div className={`font-semibold ${getSatisfactionColor(classe.satisfaction)}`}>
                            {classe.satisfaction}/5
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(classe.statut)}>
                            {classe.statut}
                          </Badge>
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
    </div>
  );
}