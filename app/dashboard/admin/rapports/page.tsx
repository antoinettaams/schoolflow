// app/(dashboard)/rapports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, DollarSign, CreditCard, Wallet, TrendingUpIcon, FileText, BarChart3, Users, BookOpen,TrendingUp, TrendingDown, Minus, Calendar, School, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

type TimeRange = 'week' | 'month' | 'quarter' | 'year'; 

// Types pour les données
interface KpiData {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
  icon: string;
}

interface PerformanceData {
  period: string;
  [key: string]: number | string;
}

interface ModuleData {
  module: string;
  completion: number;
  average: number;
  progression: string;
  formateur: string;
}

// Type corrigé pour recharts Pie - doit avoir une propriété 'name' et être compatible avec ChartDataInput
interface CertificationData {
  name: string;
  value: number;
  color: string;
  // Ajouter une signature d'index pour la compatibilité avec ChartDataInput
  [key: string]: string | number;
}

interface ClassReport {
  filiere: string;
  vague: string;
  formateur: string;
  progression: number;
  moyenne: number;
  assiduite: number;
  modulesTermines: number;
  modulesTotal: number;
  satisfaction: number;
  statut: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    kpiAcademiques: KpiData[];
    kpiFinanciers: KpiData[];
    performanceVagues: PerformanceData[];
    performanceModules: ModuleData[];
    statutCertification: CertificationData[];
    rapportsClasses: ClassReport[];
    metadata: {
      vagues: any[];
      filieres: any[];
      timeRange: string;
      generatedAt: string;
    };
  };
}

// Type spécifique pour les données PieChart qui étend CertificationData
interface PieChartData extends CertificationData {
  name: string;
  value: number;
  color: string;
}

export default function RapportsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedWave, setSelectedWave] = useState('all');
  const [selectedFiliere, setSelectedFiliere] = useState('all');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<ApiResponse['data'] | null>(null);

  // Charger les données
  useEffect(() => {
    loadData();
  }, [timeRange, selectedWave, selectedFiliere]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeRange,
        ...(selectedWave !== 'all' && { vagueId: selectedWave }),
        ...(selectedFiliere !== 'all' && { filiereId: selectedFiliere })
      });

      const response = await fetch(`/api/rapports?${params}`);
      const result: ApiResponse = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error('Erreur lors du chargement des données');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Gestion de l'export
  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      setExporting(true);
      const response = await fetch('/api/rapports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'export',
          format,
          type: 'complet',
          timeRange
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Export ${format} généré avec succès`);
        // Télécharger le fichier
        const link = document.createElement('a');
        link.href = result.data.downloadUrl;
        link.download = result.data.fileName;
        link.click();
      } else {
        toast.error('Erreur lors de l\'export');
      }
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  };

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

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'TrendingUp': return <TrendingUp className="h-4 w-4" />;
      case 'Users': return <Users className="h-4 w-4" />;
      case 'BookOpen': return <BookOpen className="h-4 w-4" />;
      case 'UserCheck': return <UserCheck className="h-4 w-4" />;
      case 'DollarSign': return <DollarSign className="h-4 w-4" />;
      case 'CreditCard': return <CreditCard className="h-4 w-4" />;
      case 'TrendingUpIcon': return <TrendingUpIcon className="h-4 w-4" />;
      case 'Wallet': return <Wallet className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  // Fonction de rendu pour les labels du PieChart
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

  // Skeleton components
  const SkeletonCard = () => (
    <Card className="bg-white border-gray-200">
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-4 w-24" />
      </CardContent>
    </Card>
  );

  const SkeletonChart = () => (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-80 w-full" />
      </CardContent>
    </Card>
  );

  // Données par défaut pour éviter les erreurs
  const defaultCertificationData: PieChartData[] = [
    { name: 'Certifié', value: 45, color: '#10b981' },
    { name: 'En cours', value: 30, color: '#3b82f6' },
    { name: 'Non certifié', value: 25, color: '#ef4444' }
  ];

  const defaultPerformanceData: PerformanceData[] = [
    { period: 'Sem 1', 'Développement Web': 12.5, 'Design UX': 14.2, 'Marketing Digital': 13.8 },
    { period: 'Sem 2', 'Développement Web': 13.2, 'Design UX': 14.5, 'Marketing Digital': 14.1 },
    { period: 'Sem 3', 'Développement Web': 13.8, 'Design UX': 14.8, 'Marketing Digital': 14.3 },
    { period: 'Sem 4', 'Développement Web': 14.2, 'Design UX': 15.1, 'Marketing Digital': 14.6 }
  ];

  const defaultModuleData: ModuleData[] = [
    { module: 'React Avancé', completion: 85, average: 14.2, progression: '+5%', formateur: 'Pierre Martin' },
    { module: 'Node.js', completion: 78, average: 13.8, progression: '+3%', formateur: 'Sophie Bernard' },
    { module: 'Base de données', completion: 92, average: 15.1, progression: '+7%', formateur: 'Thomas Dubois' },
    { module: 'UI/UX Design', completion: 88, average: 14.5, progression: '+4%', formateur: 'Marie Laurent' }
  ];

  // Fonction pour obtenir les données de certification avec le bon type
  const getCertificationData = (): PieChartData[] => {
    if (!data?.statutCertification || data.statutCertification.length === 0) {
      return defaultCertificationData;
    }
    
    // S'assurer que les données ont le bon format pour recharts
    return data.statutCertification.map(item => ({
      name: item.name,
      value: item.value,
      color: item.color
    }));
  };

  if (loading && !data) {
    return (
      <div className="h-screen flex flex-col lg:pl-5 pt-20 lg:pt-6">
        <div className="flex-shrink-0 bg-white border-b border-gray-200">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            {/* Skeleton KPIs */}
            <div>
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            </div>

            <div>
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            </div>

            {/* Skeleton Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SkeletonChart />
              <SkeletonChart />
            </div>

            {/* Skeleton Table */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-96 mt-1" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
                <Button 
                  variant="outline" 
                  onClick={() => handleExport('excel')} 
                  disabled={exporting}
                  className="flex-1 bg-white"
                >
                  {exporting ? (
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {exporting ? 'Génération...' : 'Excel'}
                </Button>
                
                <Button 
                  onClick={() => handleExport('pdf')} 
                  disabled={exporting}
                  className="flex-1"
                >
                  {exporting ? (
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  {exporting ? 'Génération...' : 'PDF'}
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
              {data?.kpiAcademiques?.map((kpi, index) => (
                <Card key={index} className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">{kpi.title}</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                      {getIconComponent(kpi.icon)}
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
              {data?.kpiFinanciers?.map((kpi, index) => (
                <Card key={index} className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium text-gray-700">{kpi.title}</CardTitle>
                    <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
                      {getIconComponent(kpi.icon)}
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
                      <SelectItem value="all">Toutes les vagues</SelectItem>
                      {data?.metadata?.vagues?.map((vague) => (
                        <SelectItem key={vague.id} value={vague.id}>
                          {vague.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.performanceVagues || defaultPerformanceData}>
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
                      {data?.performanceVagues?.length && Object.keys(data.performanceVagues[0])
                        .filter(key => key !== 'period')
                        .map((key, index) => (
                          <Line 
                            key={key}
                            type="monotone" 
                            dataKey={key} 
                            stroke={['#3b82f6', '#10b981', '#f59e0b'][index % 3]} 
                            strokeWidth={3}
                            name={key}
                            dot={{ fill: ['#3b82f6', '#10b981', '#f59e0b'][index % 3], strokeWidth: 2, r: 4 }}
                          />
                        ))}
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
                    <BarChart data={data?.performanceModules || defaultModuleData} layout="vertical">
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

            {/* Statut de Certification */}
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
                        data={getCertificationData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                      >
                        {getCertificationData().map((entry, index) => (
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
                    {data?.metadata?.filieres?.map((filiere) => (
                      <SelectItem key={filiere.id} value={filiere.id.toString()}>
                        {filiere.nom}
                      </SelectItem>
                    ))}
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
                    {data?.rapportsClasses?.map((classe, index) => (
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
                        <TableCell className="text-gray-700">{classe.moyenne.toFixed(1)}/20</TableCell>
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
                            {classe.satisfaction.toFixed(1)}/5
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