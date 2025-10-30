"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Users, UserCheck, Euro, FileText, TrendingUp, TrendingDown } from "lucide-react";

const dataInscriptions = [
  { mois: 'Jan', inscriptions: 45 },
  { mois: 'Fév', inscriptions: 52 },
  { mois: 'Mar', inscriptions: 48 },
  { mois: 'Avr', inscriptions: 65 },
  { mois: 'Mai', inscriptions: 58 },
  { mois: 'Jun', inscriptions: 72 },
];

const dataClasses = [
  { name: 'Terminale', value: 120 },
  { name: 'Première', value: 95 },
  { name: 'Seconde', value: 110 },
  { name: 'Troisième', value: 85 },
];

const dataPaiements = [
  { mois: 'Jan', paiements: 18500 },
  { mois: 'Fév', paiements: 19200 },
  { mois: 'Mar', paiements: 21000 },
  { mois: 'Avr', paiements: 19800 },
  { mois: 'Mai', paiements: 22500 },
  { mois: 'Jun', paiements: 24000 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function StatistiquesPage() {
  return (
    <div className="p-6 space-y-6 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
          <p className="text-gray-600 mt-2">
            Analysez les données et performances de l&lsquo;établissement
          </p>
        </div>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Élèves</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12% cette année
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouvelles Inscriptions</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8% vs année dernière
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paiements Mensuels</CardTitle>
            <Euro className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24,000€</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +15% ce mois
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Traités</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">892</div>
            <div className="flex items-center text-xs text-red-600">
              <TrendingDown className="w-3 h-3 mr-1" />
              -3% ce mois
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inscriptions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="inscriptions">Inscriptions</TabsTrigger>
          <TabsTrigger value="eleves">Élèves</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="inscriptions" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Inscriptions Mensuelles</CardTitle>
                <CardDescription>
                  Évolution des inscriptions sur les 6 derniers mois
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dataInscriptions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="inscriptions" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statut des Inscriptions</CardTitle>
                <CardDescription>
                  Répartition des inscriptions par statut
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>En attente</span>
                    <Badge variant="warning">12</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Approuvées</span>
                    <Badge variant="success">132</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Rejetées</span>
                    <Badge variant="destructive">8</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Incomplets</span>
                    <Badge variant="secondary">4</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="eleves" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Classe</CardTitle>
                <CardDescription>
                  Distribution des élèves par niveau
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
  data={dataClasses}
  cx="50%"
  cy="50%"
  labelLine={false}
  label={(props: { name?: string; percent?: number }) => {
    const name = props.name ?? "";
    const percent = props.percent ?? 0;
    return `${name} ${(percent * 100).toFixed(0)}%`;
  }}
  outerRadius={80}
  fill="#8884d8"
  dataKey="value"
>
  {dataClasses.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
  ))}
</Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Démographie</CardTitle>
                <CardDescription>
                  Informations sur la population étudiante
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">52%</div>
                      <div className="text-sm text-blue-800">Filles</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">48%</div>
                      <div className="text-sm text-green-800">Garçons</div>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium mb-2">Âge moyen</div>
                    <div className="text-2xl font-bold text-gray-900">16.2 ans</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium mb-2">Nouveaux élèves</div>
                    <div className="text-2xl font-bold text-gray-900">156</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finances" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des Paiements</CardTitle>
                <CardDescription>
                  Revenus mensuels des inscriptions et frais de scolarité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dataPaiements}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}€`, 'Paiements']} />
                    <Line type="monotone" dataKey="paiements" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Paiements En Attente</CardTitle>
                  <Euro className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8,450€</div>
                  <p className="text-xs text-gray-600">23 paiements</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Paiements En Retard</CardTitle>
                  <Euro className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4,200€</div>
                  <p className="text-xs text-gray-600">12 paiements</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taux de Recouvrement</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">94.5%</div>
                  <p className="text-xs text-gray-600">+2.3% vs mois dernier</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Types de Documents</CardTitle>
                <CardDescription>
                  Répartition des documents par type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: "Administratif", count: 245, color: "bg-blue-500" },
                    { type: "Pédagogique", count: 189, color: "bg-green-500" },
                    { type: "Financier", count: 156, color: "bg-yellow-500" },
                    { type: "Divers", count: 87, color: "bg-purple-500" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                        <span className="text-sm font-medium">{item.type}</span>
                      </div>
                      <span className="text-sm text-gray-600">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activité des Documents</CardTitle>
                <CardDescription>
                  Statistiques de traitement des documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium mb-1">Documents traités ce mois</div>
                    <div className="text-2xl font-bold text-gray-900">156</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium mb-1">Temps moyen de traitement</div>
                    <div className="text-2xl font-bold text-gray-900">2.3 jours</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium mb-1">Documents en attente</div>
                    <div className="text-2xl font-bold text-gray-900">23</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Composant Badge pour les statistiques
function Badge({ variant, children, className }: { variant: string; children: React.ReactNode; className?: string }) {
  const variantStyles = {
    warning: "bg-yellow-100 text-yellow-800",
    success: "bg-green-100 text-green-800",
    destructive: "bg-red-100 text-red-800",
    secondary: "bg-gray-100 text-gray-800",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${variantStyles[variant as keyof typeof variantStyles]} ${className}`}>
      {children}
    </span>
  );
}