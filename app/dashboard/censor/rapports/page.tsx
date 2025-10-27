// app/(dashboard)/censeur/rapports-personnels/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, FileText, BarChart3, Users, BookOpen, UserCheck, TrendingUp, TrendingDown, Minus, Eye, Calendar, School, UserCog, Filter, MessageSquare, AlertTriangle, CheckCircle, Trash2, Plus, Clock, Edit } from 'lucide-react';

export default function RapportsPersonnelsPage() {
  const [selectedFiliere, setSelectedFiliere] = useState('developpement-web');
  const [selectedVague, setSelectedVague] = useState('all');
  const [commentaire, setCommentaire] = useState('');
  const [editingRapport, setEditingRapport] = useState<number | null>(null);

  // Données organisées par filière
  const filieresData = {
    'developpement-web': {
      nom: 'Développement Web',
      formateurs: ['M. Diallo', 'M. Sanogo'],
      rapports: [
        {
          id: 1,
          module: 'React.js Avancé',
          formateur: 'M. Diallo',
          vague: 'WAVE-2024-01',
          date: '2024-01-15',
          chapitre: 'Hooks Avancés',
          objectif: 'Maîtriser useReducer et useContext',
          dureePlanifiee: '2h',
          dureeReelle: '2h15',
          progression: 'Terminé',
          difficulte: 'Compréhension des hooks complexes',
          correctionTemps: '+15min',
          evaluation: 4.5,
          commentaireProf: 'Bon engagement des étudiants, besoin de plus d\'exercices pratiques',
          commentaireCenseur: 'Pédagogie interactive, excellent support'
        },
        {
          id: 2,
          module: 'Node.js & Express',
          formateur: 'M. Sanogo',
          vague: 'WAVE-2024-01',
          date: '2024-01-16',
          chapitre: 'Création API REST',
          objectif: 'Implémenter un CRUD complet',
          dureePlanifiee: '3h',
          dureeReelle: '2h45',
          progression: 'Terminé',
          difficulte: 'Gestion des erreurs middleware',
          correctionTemps: '-15min',
          evaluation: 4.2,
          commentaireProf: 'Problèmes de configuration environnement',
          commentaireCenseur: 'Bonne maîtrise technique'
        }
      ]
    },
    'data-science': {
      nom: 'Data Science',
      formateurs: ['Mme. Traoré'],
      rapports: [
        {
          id: 3,
          module: 'Machine Learning',
          formateur: 'Mme. Traoré',
          vague: 'WAVE-2024-01',
          date: '2024-01-17',
          chapitre: 'Algorithmes de Classification',
          objectif: 'Implémenter Random Forest',
          dureePlanifiee: '3h',
          dureeReelle: '3h',
          progression: 'Terminé',
          difficulte: 'Aucune',
          correctionTemps: '0',
          evaluation: 4.8,
          commentaireProf: 'Excellent travail des étudiants sur les projets',
          commentaireCenseur: 'Cours exemplaire, support de qualité'
        }
      ]
    },
    'reseau-securite': {
      nom: 'Réseaux & Sécurité',
      formateurs: ['M. Ndiaye'],
      rapports: [
        {
          id: 4,
          module: 'Sécurité Réseaux',
          formateur: 'M. Ndiaye',
          vague: 'WAVE-2024-02',
          date: '2024-01-18',
          chapitre: 'Tests de Penetration',
          objectif: 'Utilisation de Nmap et Wireshark',
          dureePlanifiee: '3h',
          dureeReelle: '2h30',
          progression: 'Partiel',
          difficulte: 'Manque de matériel de test',
          correctionTemps: '-30min',
          evaluation: 3.5,
          commentaireProf: 'Problèmes techniques avec le lab virtuel',
          commentaireCenseur: 'Expertise technique mais pédagogie à améliorer'
        }
      ]
    }
  };

  // Données pour les graphiques par filière
  const statsFiliereData = {
    'developpement-web': [
      { module: 'React.js', progression: 85, evaluation: 4.5, respectDelais: 90 },
      { module: 'Node.js', progression: 78, evaluation: 4.2, respectDelais: 85 },
      { module: 'Vue.js', progression: 92, evaluation: 4.7, respectDelais: 95 },
      { module: 'Angular', progression: 75, evaluation: 4.0, respectDelais: 80 }
    ],
    'data-science': [
      { module: 'Machine Learning', progression: 95, evaluation: 4.8, respectDelais: 98 },
      { module: 'Deep Learning', progression: 88, evaluation: 4.6, respectDelais: 92 },
      { module: 'Data Visualization', progression: 82, evaluation: 4.3, respectDelais: 85 }
    ],
    'reseau-securite': [
      { module: 'Sécurité', progression: 70, evaluation: 3.5, respectDelais: 75 },
      { module: 'Réseaux', progression: 80, evaluation: 4.0, respectDelais: 82 },
      { module: 'Cyber Defense', progression: 65, evaluation: 3.2, respectDelais: 70 }
    ]
  };

  // Fonctions utilitaires
  const getEvaluationColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 4.0) return 'text-blue-600';
    if (score >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressionColor = (progression: string) => {
    switch (progression) {
      case 'Terminé': return 'green';
      case 'Partiel': return 'orange';
      case 'Non terminé': return 'red';
      default: return 'gray';
    }
  };

  const getCorrectionTempsColor = (correction: string) => {
    if (correction.startsWith('+')) return 'text-red-600';
    if (correction.startsWith('-')) return 'text-green-600';
    return 'text-gray-600';
  };

  const handleDeleteRapport = (rapportId: number) => {
    console.log(`Deleting report ${rapportId}`);
    // Implémentation de la suppression
  };

  const handleEditRapport = (rapportId: number) => {
    setEditingRapport(rapportId);
  };

  const handleSaveRapport = () => {
    setEditingRapport(null);
    // Sauvegarde des modifications
  };

  const selectedFiliereData = filieresData[selectedFiliere as keyof typeof filieresData];
  const selectedStatsData = statsFiliereData[selectedFiliere as keyof typeof statsFiliereData];

  return (
    <div className="h-screen flex flex-col">
      {/* Header fixe */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                Rapports Personnels par Filière
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Suivi détaillé des cours et évaluation des formateurs
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2">
                <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                  <SelectTrigger className="w-full sm:w-[200px] bg-white">
                    <School className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filière" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="developpement-web">Développement Web</SelectItem>
                    <SelectItem value="data-science">Data Science</SelectItem>
                    <SelectItem value="reseau-securite">Réseaux & Sécurité</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedVague} onValueChange={setSelectedVague}>
                  <SelectTrigger className="w-full sm:w-[140px] bg-white">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Vague" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes vagues</SelectItem>
                    <SelectItem value="WAVE-2024-01">WAVE 2024-01</SelectItem>
                    <SelectItem value="WAVE-2024-02">WAVE 2024-02</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Rapport
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
          {/* En-tête de la filière */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-2xl text-gray-900">
                    {selectedFiliereData.nom}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Formateurs: {selectedFiliereData.formateurs.join(', ')}
                  </CardDescription>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter Filière
                  </Button>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Synthèse PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Graphiques de la filière */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Progression par Module</CardTitle>
                <CardDescription>Avancement et évaluation des modules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedStatsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="module" stroke="#666" />
                      <YAxis domain={[0, 100]} stroke="#666" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="progression" name="Progression %" fill="#3b82f6" />
                      <Bar dataKey="respectDelais" name="Respect délais %" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Évaluation des Modules</CardTitle>
                <CardDescription>Notes moyennes par module</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedStatsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" domain={[0, 5]} stroke="#666" />
                      <YAxis 
                        type="category" 
                        dataKey="module" 
                        width={100} 
                        stroke="#666"
                        fontSize={12}
                      />
                      <Tooltip />
                      <Bar 
                        dataKey="evaluation" 
                        name="Évaluation /5" 
                        fill="#f59e0b" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rapports détaillés par cours */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Rapports de Cours - {selectedFiliereData.nom}
              </CardTitle>
              <CardDescription>
                Détail des séances avec suivi temps réel des formateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {selectedFiliereData.rapports.map((rapport) => (
                  <div key={rapport.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    {/* En-tête du rapport */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{rapport.module}</h3>
                        <p className="text-sm text-gray-600">
                          {rapport.formateur} • {rapport.vague} • {rapport.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          rapport.evaluation >= 4.5 ? 'default' :
                          rapport.evaluation >= 4.0 ? 'default' :
                          rapport.evaluation >= 3.5 ? 'secondary' : 'destructive'
                        }>
                          {rapport.evaluation}/5
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRapport(rapport.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRapport(rapport.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Informations du cours */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <span className="font-medium">Chapitre:</span>
                        <p className="text-gray-600">{rapport.chapitre}</p>
                      </div>
                      <div>
                        <span className="font-medium">Objectif:</span>
                        <p className="text-gray-600">{rapport.objectif}</p>
                      </div>
                      <div>
                        <span className="font-medium">Durée:</span>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            {rapport.dureeReelle} ({rapport.dureePlanifiee} prévu)
                          </span>
                          <Badge 
                            variant="outline" 
                            className={getCorrectionTempsColor(rapport.correctionTemps)}
                          >
                            {rapport.correctionTemps}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Progression:</span>
                        <Badge 
                          variant="outline"
                          className={
                            rapport.progression === 'Terminé' ? 'text-green-600 border-green-600' :
                            rapport.progression === 'Partiel' ? 'text-orange-600 border-orange-600' :
                            'text-red-600 border-red-600'
                          }
                        >
                          {rapport.progression}
                        </Badge>
                      </div>
                    </div>

                    {/* Commentaires */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Commentaire Formateur</h4>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-blue-800">{rapport.commentaireProf}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Commentaire Censeur</h4>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-sm text-green-800">{rapport.commentaireCenseur}</p>
                        </div>
                      </div>
                    </div>

                    {/* Difficultés rencontrées */}
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Difficultés Rencontrées</h4>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <p className="text-sm text-orange-800">{rapport.difficulte}</p>
                      </div>
                    </div>

                    {/* Ajout de commentaire */}
                    {editingRapport === rapport.id && (
                      <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                        <h4 className="font-medium text-gray-900 mb-2">Modifier le rapport</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Évaluation</label>
                            <Input 
                              type="number" 
                              step="0.1" 
                              min="1" 
                              max="5" 
                              defaultValue={rapport.evaluation}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Commentaire Censeur</label>
                            <Textarea 
                              defaultValue={rapport.commentaireCenseur}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleSaveRapport}>
                              Sauvegarder
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditingRapport(null)}
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section pour ajouter un nouveau commentaire général */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle>Commentaire Général sur la Filière</CardTitle>
              <CardDescription>
                Observations globales et recommandations pour {selectedFiliereData.nom}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Ajouter vos observations générales sur la filière, les points forts, axes d'amélioration..."
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button disabled={!commentaire.trim()}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Enregistrer le Commentaire
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}