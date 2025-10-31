// app/(dashboard)/censeur/rapports-personnels/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, FileText, BookOpen, School, UserCog, Filter, MessageSquare, Trash2, Plus, Clock, Edit, Search } from 'lucide-react';

export default function RapportsPersonnelsPage() {
  const [selectedFiliere, setSelectedFiliere] = useState('developpement-web');
  const [selectedVague, setSelectedVague] = useState('all');
  const [selectedFormateur, setSelectedFormateur] = useState('all');
  const [commentaire, setCommentaire] = useState('');
  const [editingRapport, setEditingRapport] = useState<number | null>(null);
  const [isNewRapportOpen, setIsNewRapportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
          date: new Date().toISOString().split('T')[0], // Aujourd'hui
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
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Hier
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
          date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // Avant-hier
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
          date: new Date(Date.now() - 259200000).toISOString().split('T')[0], // Il y a 3 jours
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
    },
    'design-graphique': {
      nom: 'Design Graphique',
      formateurs: ['Mme. Koné', 'M. Coulibaly'],
      rapports: [
        {
          id: 5,
          module: 'UI/UX Design',
          formateur: 'Mme. Koné',
          vague: 'WAVE-2024-01',
          date: new Date(Date.now() - 345600000).toISOString().split('T')[0], // Il y a 4 jours
          chapitre: 'Design System',
          objectif: 'Créer un système de design cohérent',
          dureePlanifiee: '2h30',
          dureeReelle: '2h45',
          progression: 'Terminé',
          difficulte: 'Intégration des composants',
          correctionTemps: '+15min',
          evaluation: 4.6,
          commentaireProf: 'Créativité remarquable des étudiants',
          commentaireCenseur: 'Approche moderne et professionnelle'
        }
      ]
    },
    'marketing-digital': {
      nom: 'Marketing Digital',
      formateurs: ['M. Keita'],
      rapports: [
        {
          id: 6,
          module: 'SEO Avancé',
          formateur: 'M. Keita',
          vague: 'WAVE-2024-02',
          date: new Date(Date.now() - 432000000).toISOString().split('T')[0], // Il y a 5 jours
          chapitre: 'Optimisation On-Page',
          objectif: 'Maîtriser les techniques de référencement',
          dureePlanifiee: '2h',
          dureeReelle: '2h',
          progression: 'Terminé',
          difficulte: 'Aucune',
          correctionTemps: '0',
          evaluation: 4.3,
          commentaireProf: 'Bonne participation, cas pratiques pertinents',
          commentaireCenseur: 'Contenu actualisé et pertinent'
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
    ],
    'design-graphique': [
      { module: 'UI/UX Design', progression: 88, evaluation: 4.6, respectDelais: 90 },
      { module: 'Graphisme', progression: 85, evaluation: 4.4, respectDelais: 88 },
      { module: 'Motion Design', progression: 80, evaluation: 4.2, respectDelais: 85 }
    ],
    'marketing-digital': [
      { module: 'SEO', progression: 82, evaluation: 4.3, respectDelais: 85 },
      { module: 'Social Media', progression: 78, evaluation: 4.1, respectDelais: 80 },
      { module: 'Content Marketing', progression: 85, evaluation: 4.5, respectDelais: 88 }
    ]
  };

  // Nouveau rapport state
  const [newRapport, setNewRapport] = useState({
    filiere: '',
    module: '',
    formateur: '',
    vague: '',
    date: new Date().toISOString().split('T')[0],
    chapitre: '',
    objectif: '',
    dureePlanifiee: '',
    dureeReelle: '',
    progression: 'Terminé',
    difficulte: '',
    evaluation: 4.0,
    commentaireProf: '',
    commentaireCenseur: ''
  });

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

  const handleCreateRapport = () => {
    console.log('Creating new report:', newRapport);
    // Implémentation de la création
    setIsNewRapportOpen(false);
    // Reset form
    setNewRapport({
      filiere: '',
      module: '',
      formateur: '',
      vague: '',
      date: new Date().toISOString().split('T')[0],
      chapitre: '',
      objectif: '',
      dureePlanifiee: '',
      dureeReelle: '',
      progression: 'Terminé',
      difficulte: '',
      evaluation: 4.0,
      commentaireProf: '',
      commentaireCenseur: ''
    });
  };

  const getCorrectionTempsColor = (correction: string) => {
    if (correction.startsWith('+')) return 'text-red-600';
    if (correction.startsWith('-')) return 'text-green-600';
    return 'text-gray-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const selectedFiliereData = filieresData[selectedFiliere as keyof typeof filieresData];
  const selectedStatsData = statsFiliereData[selectedFiliere as keyof typeof statsFiliereData];

  // Tous les formateurs disponibles
  const allFormateurs = Array.from(
    new Set(
      Object.values(filieresData).flatMap(filiere => filiere.formateurs)
    )
  );

  // Filtrer les rapports par recherche et filtres
  const filteredRapports = selectedFiliereData.rapports.filter(rapport => {
    const matchesSearch = 
      rapport.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rapport.formateur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rapport.chapitre.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVague = selectedVague === 'all' || rapport.vague === selectedVague;
    const matchesFormateur = selectedFormateur === 'all' || rapport.formateur === selectedFormateur;
    
    return matchesSearch && matchesVague && matchesFormateur;
  });

  return (
    <div className="h-screen flex flex-col lg:pl-5 pt-20 lg:pt-6">
      {/* Header fixe */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                Rapports
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Suivi détaillé des cours et évaluation des formateurs
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-wrap gap-2">
                <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                  <SelectTrigger className="w-full sm:w-[200px] bg-white">
                    <School className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filière" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="developpement-web">Développement Web</SelectItem>
                    <SelectItem value="data-science">Data Science</SelectItem>
                    <SelectItem value="reseau-securite">Réseaux & Sécurité</SelectItem>
                    <SelectItem value="design-graphique">Design Graphique</SelectItem>
                    <SelectItem value="marketing-digital">Marketing Digital</SelectItem>
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

                <Select value={selectedFormateur} onValueChange={setSelectedFormateur}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-white">
                    <UserCog className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Formateur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous formateurs</SelectItem>
                    {allFormateurs.map((formateur) => (
                      <SelectItem key={formateur} value={formateur}>
                        {formateur}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Dialog open={isNewRapportOpen} onOpenChange={setIsNewRapportOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau Rapport
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                  <DialogHeader>
                    <DialogTitle>Créer un Nouveau Rapport</DialogTitle>
                    <DialogDescription>
                      Remplissez les informations du nouveau rapport de cours
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="filiere">Filière *</Label>
                      <Select 
                        value={newRapport.filiere} 
                        onValueChange={(value) => setNewRapport(prev => ({ ...prev, filiere: value }))}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Sélectionner une filière" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="developpement-web">Développement Web</SelectItem>
                          <SelectItem value="data-science">Data Science</SelectItem>
                          <SelectItem value="reseau-securite">Réseaux & Sécurité</SelectItem>
                          <SelectItem value="design-graphique">Design Graphique</SelectItem>
                          <SelectItem value="marketing-digital">Marketing Digital</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="module">Module *</Label>
                      <Input
                        id="module"
                        placeholder="Nom du module"
                        value={newRapport.module}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, module: e.target.value }))}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="formateur">Formateur *</Label>
                      <Select 
                        value={newRapport.formateur} 
                        onValueChange={(value) => setNewRapport(prev => ({ ...prev, formateur: value }))}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Sélectionner un formateur" />
                        </SelectTrigger>
                        <SelectContent>
                          {allFormateurs.map((formateur) => (
                            <SelectItem key={formateur} value={formateur}>
                              {formateur}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vague">Vague *</Label>
                      <Select 
                        value={newRapport.vague} 
                        onValueChange={(value) => setNewRapport(prev => ({ ...prev, vague: value }))}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Sélectionner une vague" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WAVE-2024-01">WAVE 2024-01</SelectItem>
                          <SelectItem value="WAVE-2024-02">WAVE 2024-02</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Date du cours *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newRapport.date}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, date: e.target.value }))}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="chapitre">Chapitre traité *</Label>
                      <Input
                        id="chapitre"
                        placeholder="Chapitre du cours"
                        value={newRapport.chapitre}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, chapitre: e.target.value }))}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="objectif">Objectif pédagogique *</Label>
                      <Textarea
                        id="objectif"
                        placeholder="Objectif principal du cours"
                        value={newRapport.objectif}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, objectif: e.target.value }))}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dureePlanifiee">Durée planifiée *</Label>
                      <Input
                        id="dureePlanifiee"
                        placeholder="Ex: 2h"
                        value={newRapport.dureePlanifiee}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, dureePlanifiee: e.target.value }))}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dureeReelle">Durée réelle *</Label>
                      <Input
                        id="dureeReelle"
                        placeholder="Ex: 2h15"
                        value={newRapport.dureeReelle}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, dureeReelle: e.target.value }))}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="progression">Progression</Label>
                      <Select 
                        value={newRapport.progression} 
                        onValueChange={(value) => setNewRapport(prev => ({ ...prev, progression: value }))}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Terminé">Terminé</SelectItem>
                          <SelectItem value="Partiel">Partiel</SelectItem>
                          <SelectItem value="Non terminé">Non terminé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="evaluation">Évaluation (1-5)</Label>
                      <Input
                        id="evaluation"
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={newRapport.evaluation}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, evaluation: parseFloat(e.target.value) }))}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="difficulte">Difficultés rencontrées</Label>
                      <Textarea
                        id="difficulte"
                        placeholder="Problèmes techniques ou pédagogiques rencontrés"
                        value={newRapport.difficulte}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, difficulte: e.target.value }))}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="commentaireProf">Commentaire du formateur</Label>
                      <Textarea
                        id="commentaireProf"
                        placeholder="Observations du formateur sur la séance"
                        value={newRapport.commentaireProf}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, commentaireProf: e.target.value }))}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="commentaireCenseur">Commentaire du censeur</Label>
                      <Textarea
                        id="commentaireCenseur"
                        placeholder="Vos observations et recommandations"
                        value={newRapport.commentaireCenseur}
                        onChange={(e) => setNewRapport(prev => ({ ...prev, commentaireCenseur: e.target.value }))}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewRapportOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateRapport}>
                      Créer le rapport
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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

          {/* Barre de recherche et statistiques des filtres */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-white border-gray-200 lg:col-span-2">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Rechercher un rapport par module, formateur ou chapitre..."
                    className="pl-10 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{filteredRapports.length}</div>
                  <div className="text-sm text-gray-600">Rapport(s) trouvé(s)</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedVague !== 'all' && `Vague: ${selectedVague}`}
                    {selectedFormateur !== 'all' && ` • Formateur: ${selectedFormateur}`}
                  </div>
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
                <Badge variant="secondary" className="ml-2">
                  {filteredRapports.length} rapport(s)
                </Badge>
              </CardTitle>
              <CardDescription>
                Détail des séances avec suivi temps réel des formateurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {filteredRapports.map((rapport) => (
                  <div key={rapport.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:border-gray-300 transition-colors">
                    {/* En-tête du rapport */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{rapport.module}</h3>
                        <p className="text-sm text-gray-600">
                          {rapport.formateur} • {selectedFiliereData.nom} • {rapport.vague} • {formatDate(rapport.date)}
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
                              className="mt-1 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Commentaire Censeur</label>
                            <Textarea 
                              defaultValue={rapport.commentaireCenseur}
                              className="mt-1 bg-white"
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
                  className="min-h-[100px] bg-white"
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