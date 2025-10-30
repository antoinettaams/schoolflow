// app/(dashboard)/censeur/statistiques/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Download, TrendingUp, Users, UserCheck, Calendar, School, Award, Target, BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon, Eye, UserCog } from 'lucide-react';

export default function StatistiquesCenseurPage() {
  const [periode, setPeriode] = useState('mois');
  const [filiereFilter, setFiliereFilter] = useState('all');

  // Données principales
  const statistiquesGenerales = {
    totalFormateurs: 24,
    totalEtudiants: 320,
    totalCours: 156,
    tauxCompletion: 87,
    satisfactionMoyenne: 4.3,
    heuresEnseignement: 280
  };

  // Données pour les graphiques
  const progressionParFiliere = [
    { name: 'Dev Web', progression: 92, objectif: 90 },
    { name: 'Data Science', progression: 85, objectif: 88 },
    { name: 'Réseaux', progression: 78, objectif: 85 },
    { name: 'Design', progression: 88, objectif: 87 },
    { name: 'Marketing', progression: 82, objectif: 84 }
  ];

  const performanceFormateurs = [
    { name: 'M. Diallo', cours: 24, evaluation: 4.8, presence: 98 },
    { name: 'Mme. Traoré', cours: 22, evaluation: 4.6, presence: 95 },
    { name: 'M. Sanogo', cours: 20, evaluation: 4.4, presence: 92 },
    { name: 'M. Ndiaye', cours: 18, evaluation: 4.2, presence: 88 },
    { name: 'Mme. Keita', cours: 16, evaluation: 4.1, presence: 85 }
  ];

  const evolutionPerformances = [
    { mois: 'Jan', progression: 75, satisfaction: 4.1, presence: 88 },
    { mois: 'Fév', progression: 78, satisfaction: 4.2, presence: 90 },
    { mois: 'Mar', progression: 82, satisfaction: 4.3, presence: 92 },
    { mois: 'Avr', progression: 85, satisfaction: 4.4, presence: 93 },
    { mois: 'Mai', progression: 87, satisfaction: 4.5, presence: 94 },
    { mois: 'Jun', progression: 89, satisfaction: 4.6, presence: 95 }
  ];

  const repartitionCours = [
    { name: 'Dev Web', value: 35 },
    { name: 'Data Science', value: 25 },
    { name: 'Réseaux', value: 20 },
    { name: 'Design', value: 12 },
    { name: 'Marketing', value: 8 }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Alertes et points d&apos;attention
  const alertes = [
    { type: 'warning', message: '2 formateurs avec taux de présence < 85%', count: 2 },
    { type: 'info', message: '3 modules nécessitent une révision pédagogique', count: 3 },
    { type: 'success', message: '5 formateurs excellents à récompenser', count: 5 }
  ];

  // Objectifs mensuels
  const objectifsMensuels = [
    { nom: 'Taux de complétion', actuel: 87, objectif: 90, progression: 96.7 },
    { nom: 'Satisfaction moyenne', actuel: 4.3, objectif: 4.5, progression: 95.6 },
    { nom: 'Taux de présence', actuel: 92, objectif: 95, progression: 96.8 },
    { nom: 'Cours réalisés', actuel: 156, objectif: 160, progression: 97.5 }
  ];

  return (
    <div className="min-h-screen overflow-y-auto bg-gray-50/30">
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              Tableau de Bord - Statistiques
            </h1>
            <p className="text-gray-600 mt-2">
              Vue d&apos;ensemble des performances académiques et indicateurs clés
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={periode} onValueChange={setPeriode}>
              <SelectTrigger className="w-full sm:w-[140px] bg-white">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semaine">Cette semaine</SelectItem>
                <SelectItem value="mois">Ce mois</SelectItem>
                <SelectItem value="trimestre">Ce trimestre</SelectItem>
                <SelectItem value="annee">Cette année</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filiereFilter} onValueChange={setFiliereFilter}>
              <SelectTrigger className="w-full sm:w-[160px] bg-white">
                <School className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filière" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes filières</SelectItem>
                <SelectItem value="dev-web">Développement Web</SelectItem>
                <SelectItem value="data-science">Data Science</SelectItem>
                <SelectItem value="reseau">Réseaux & Sécurité</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Cartes de statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Formateurs Actifs</CardTitle>
              <UserCog className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistiquesGenerales.totalFormateurs}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% vs mois dernier
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Étudiants Inscrits</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistiquesGenerales.totalEtudiants}</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8% vs mois dernier
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de Complétion</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistiquesGenerales.tauxCompletion}%</div>
              <Progress value={statistiquesGenerales.tauxCompletion} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction Moyenne</CardTitle>
              <Award className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistiquesGenerales.satisfactionMoyenne}/5</div>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +0.2 vs mois dernier
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertes et points d&apos;attention */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alertes.map((alerte, index) => (
            <Card key={index} className={`
              bg-white border-l-4
              ${alerte.type === 'warning' ? 'border-l-orange-500' : ''}
              ${alerte.type === 'info' ? 'border-l-blue-500' : ''}
              ${alerte.type === 'success' ? 'border-l-green-500' : ''}
            `}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{alerte.message}</p>
                    <Badge variant="secondary" className="mt-1">
                      {alerte.count} élément(s)
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs pour différentes vues */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Vue d&apos;ensemble
            </TabsTrigger>
            <TabsTrigger value="formateurs" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Formateurs
            </TabsTrigger>
            <TabsTrigger value="filieres" className="flex items-center gap-2">
              <School className="h-4 w-4" />
              Filières
            </TabsTrigger>
            <TabsTrigger value="evolution" className="flex items-center gap-2">
              <LineChartIcon className="h-4 w-4" />
              Évolution
            </TabsTrigger>
          </TabsList>

          {/* Vue d&apos;ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Progression par filière */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Progression par Filière
                  </CardTitle>
                  <CardDescription>
                    Comparaison progression réelle vs objectifs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={progressionParFiliere}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#666" />
                        <YAxis domain={[0, 100]} stroke="#666" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="progression" name="Progression %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="objectif" name="Objectif %" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Répartition des cours */}
              <Card className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Répartition des Cours
                  </CardTitle>
                  <CardDescription>
                    Distribution des cours par filière
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={repartitionCours}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ label, parsed }) => `${label} (${parsed}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {repartitionCours.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Objectifs mensuels */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Objectifs Mensuels</CardTitle>
                <CardDescription>
                  Suivi des indicateurs clés vs objectifs fixés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {objectifsMensuels.map((objectif, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{objectif.nom}</span>
                        <span>
                          {objectif.actuel}{typeof objectif.actuel === 'number' && objectif.actuel <= 5 ? '/5' : objectif.nom.includes('Taux') || objectif.nom.includes('présence') ? '%' : ''} 
                          {' '}sur {objectif.objectif}{typeof objectif.objectif === 'number' && objectif.objectif <= 5 ? '/5' : objectif.nom.includes('Taux') || objectif.nom.includes('présence') ? '%' : ''}
                        </span>
                      </div>
                      <Progress value={objectif.progression} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Progression: {objectif.progression}%</span>
                        <span className={objectif.progression >= 95 ? 'text-green-600' : 'text-orange-600'}>
                          {objectif.progression >= 95 ? 'Objectif atteint' : 'En cours'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance des formateurs */}
          <TabsContent value="formateurs" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Performance des Formateurs</CardTitle>
                <CardDescription>
                  Classement par évaluation et taux de présence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceFormateurs} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" domain={[0, 5]} stroke="#666" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={100} 
                        stroke="#666"
                        fontSize={12}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="evaluation" 
                        name="Évaluation /5" 
                        fill="#f59e0b" 
                        radius={[0, 4, 4, 0]}
                      />
                      <Bar 
                        dataKey="presence" 
                        name="Présence %" 
                        fill="#10b981" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Tableau détaillé des formateurs */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Détail par Formateur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceFormateurs.map((formateur, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserCheck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{formateur.name}</p>
                          <p className="text-sm text-gray-500">{formateur.cours} cours donnés</p>
                        </div>
                      </div>
                      <div className="flex gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-600">{formateur.evaluation}</p>
                          <p className="text-xs text-gray-500">/5</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{formateur.presence}%</p>
                          <p className="text-xs text-gray-500">Présence</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Évolution temporelle */}
          <TabsContent value="evolution" className="space-y-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Évolution des Performances</CardTitle>
                <CardDescription>
                  Tendances sur les 6 derniers mois
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionPerformances}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="mois" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="progression" 
                        name="Progression %" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="satisfaction" 
                        name="Satisfaction /5" 
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="presence" 
                        name="Présence %" 
                        stroke="#f59e0b" 
                        fill="#f59e0b" 
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Détail par filière */}
          <TabsContent value="filieres" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {progressionParFiliere.map((filiere, index) => (
                <Card key={index} className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg">{filiere.name}</CardTitle>
                    <CardDescription>
                      Performance globale de la filière
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progression</span>
                        <span className="font-medium">{filiere.progression}%</span>
                      </div>
                      <Progress value={filiere.progression} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Objectif</span>
                        <span className="font-medium">{filiere.objectif}%</span>
                      </div>
                      <Progress value={filiere.objectif} className="h-2 bg-gray-200" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Écart</span>
                      <span className={filiere.progression >= filiere.objectif ? 'text-green-600' : 'text-red-600'}>
                        {filiere.progression >= filiere.objectif ? '+' : ''}{filiere.progression - filiere.objectif}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}