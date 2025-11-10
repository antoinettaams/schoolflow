"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Filter, Download, Edit, Trash2, FileText, RefreshCw, AlertCircle, Info } from 'lucide-react';

// Composants Skeleton
const SkeletonCard = () => (
  <Card className="w-full">
    <CardHeader className="pb-3">
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
    </CardHeader>
    <CardContent>
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </CardContent>
  </Card>
);

const SkeletonTableRow = () => (
  <TableRow>
    <TableCell><div className="h-4 bg-gray-200 rounded w-3/4"></div></TableCell>
    <TableCell><div className="h-4 bg-gray-200 rounded w-2/3"></div></TableCell>
    <TableCell><div className="h-4 bg-gray-200 rounded w-1/2"></div></TableCell>
    <TableCell><div className="h-4 bg-gray-200 rounded w-1/2"></div></TableCell>
    <TableCell><div className="h-4 bg-gray-200 rounded w-full"></div></TableCell>
    <TableCell><div className="h-4 bg-gray-200 rounded w-1/2"></div></TableCell>
    <TableCell><div className="h-6 bg-gray-200 rounded w-16"></div></TableCell>
    <TableCell><div className="h-8 bg-gray-200 rounded w-16"></div></TableCell>
  </TableRow>
);

const SkeletonFilterBar = () => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-10 bg-gray-200 rounded w-[180px]"></div>
          <div className="h-10 bg-gray-200 rounded w-[180px]"></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Types
interface ServicesInclus {
  connexionIllimitee: boolean;
  ordinateurPortable: boolean;
  materielPedagogique: boolean;
  accesPlateforme: boolean;
  supportTechnique: boolean;
}

interface FraisFormation {
  id: string;
  vagueId: string;
  vagueName: string;
  filiereId: string;
  filiereName: string;
  fraisInscription: number;
  fraisScolarite: number;
  servicesInclus: ServicesInclus;
  total: number;
  statut: 'ACTIF' | 'ARCHIVE';
  dateCreation: string;
  dateModification: string;
}

interface Vague {
  id: string;
  nom: string;
}

interface Filiere {
  id: string;
  nom: string;
}

interface ApiResponse {
  success: boolean;
  data: FraisFormation[];
  metadata?: {
    fraisInscriptionUniversel: number;
    vagues: Vague[];
    filieres: Filiere[];
    total: number;
    mode?: string;
  };
  message?: string;
  error?: string;
}

export default function FraisFormationPage() {
  const [frais, setFrais] = useState<FraisFormation[]>([]);
  const [filteredFrais, setFilteredFrais] = useState<FraisFormation[]>([]);
  const [vagues, setVagues] = useState<Vague[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [selectedVague, setSelectedVague] = useState<string>('all');
  const [selectedFiliere, setSelectedFiliere] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fraisToDelete, setFraisToDelete] = useState<FraisFormation | null>(null);
  const [editingFrais, setEditingFrais] = useState<FraisFormation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<string>('base-de-donnees');
  const [fraisInscriptionUniversel, setFraisInscriptionUniversel] = useState(10000);

  // État pour le nouveau formulaire
  const [newFrais, setNewFrais] = useState({
    vagueId: '',
    filiereId: '',
    fraisScolarite: '',
    servicesInclus: {
      connexionIllimitee: true,
      ordinateurPortable: true,
      materielPedagogique: true,
      accesPlateforme: true,
      supportTechnique: true,
    }
  });

  // Charger les données
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setApiMessage(null);

      console.log('🔄 Chargement des données...');

      const response = await fetch('/api/comptable/frais-formation');
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      console.log('📊 Réponse API:', data);

      if (data.success) {
        setFrais(data.data || []);
        setVagues(data.metadata?.vagues || []);
        setFilieres(data.metadata?.filieres || []);
        setFraisInscriptionUniversel(data.metadata?.fraisInscriptionUniversel || 10000);
        setMode(data.metadata?.mode || 'base-de-donnees');
        
        if (data.message) {
          setApiMessage(data.message);
        }

        console.log('✅ Données chargées avec succès');
      } else {
        throw new Error(data.error || 'Erreur inconnue du serveur');
      }
    } catch (err) {
      console.error('❌ Erreur chargement:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion au serveur';
      setError(errorMessage);
      
      // Données de secours
      setFrais([]);
      setVagues([]);
      setFilieres([]);
      setApiMessage('Mode dégradé - Données limitées disponibles');
    } finally {
      setLoading(false);
    }
  };

  // Charger le frais d'inscription universel
  const fetchFraisInscription = async () => {
    try {
      const response = await fetch('/api/comptable/frais-formation', { method: 'PATCH' });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFraisInscriptionUniversel(data.data.montant);
        }
      }
    } catch (err) {
      console.error('Erreur frais inscription:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchFraisInscription();
  }, []);

  // Filtrage
  useEffect(() => {
    let result = frais;

    if (selectedVague !== 'all') {
      result = result.filter(f => f.vagueId === selectedVague);
    }

    if (selectedFiliere !== 'all') {
      result = result.filter(f => f.filiereId === selectedFiliere);
    }

    if (searchTerm) {
      result = result.filter(f => 
        f.filiereName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.vagueName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFrais(result);
  }, [frais, selectedVague, selectedFiliere, searchTerm]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  const stats = {
    totalFrais: filteredFrais.reduce((sum, f) => sum + f.total, 0),
    totalFiliere: filteredFrais.length,
    moyenneScolarite: filteredFrais.length > 0 ? 
      filteredFrais.reduce((sum, f) => sum + f.fraisScolarite, 0) / filteredFrais.length : 0
  };

  const getServicesText = (services: ServicesInclus) => {
    const activeServices = [];
    if (services.connexionIllimitee) activeServices.push('Connexion illimitée');
    if (services.ordinateurPortable) activeServices.push('Ordinateur portable');
    if (services.materielPedagogique) activeServices.push('Matériel pédagogique');
    if (services.accesPlateforme) activeServices.push('Accès plateforme');
    if (services.supportTechnique) activeServices.push('Support technique');
    return activeServices.join(', ');
  };

  const handleCreateFrais = async () => {
    try {
      if (!newFrais.vagueId || !newFrais.filiereId || !newFrais.fraisScolarite) {
        setError('Veuillez remplir tous les champs obligatoires');
        return;
      }

      // Convertir le montant pour gérer les séparateurs
      const fraisScolariteConverti = newFrais.fraisScolarite
        .replace(/\s/g, '')  // Supprimer les espaces
        .replace(/,/g, '.'); // Remplacer virgules par points

      const dataToSend = {
        ...newFrais,
        fraisScolarite: fraisScolariteConverti
      };

      console.log('📤 Données envoyées:', dataToSend);

      const response = await fetch('/api/comptable/frais-formation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (data.success) {
        setFrais(prev => [...prev, data.data]);
        setIsCreateModalOpen(false);
        setApiMessage('Configuration créée avec succès !');
        
        // Reset form
        setNewFrais({
          vagueId: '',
          filiereId: '',
          fraisScolarite: '',
          servicesInclus: {
            connexionIllimitee: true,
            ordinateurPortable: true,
            materielPedagogique: true,
            accesPlateforme: true,
            supportTechnique: true,
          }
        });
      } else {
        setError(data.error || 'Erreur lors de la création');
      }
    } catch (err) {
      console.error('Erreur création:', err);
      setError('Erreur lors de la création');
    }
  };

  const handleEditFrais = (fraisItem: FraisFormation) => {
    setEditingFrais(fraisItem);
    setIsEditModalOpen(true);
  };

  const handleUpdateFrais = async () => {
    try {
      if (!editingFrais) return;

      // Convertir le montant pour l'API
      const fraisScolariteConverti = editingFrais.fraisScolarite.toString()
        .replace(/\s/g, '')
        .replace(/,/g, '.');

      const response = await fetch('/api/comptable/frais-formation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingFrais.id,
          fraisScolarite: fraisScolariteConverti,
          servicesInclus: editingFrais.servicesInclus,
          statut: editingFrais.statut
        })
      });

      const data = await response.json();

      if (data.success) {
        setFrais(prev => 
          prev.map(item => 
            item.id === editingFrais.id ? data.data : item
          )
        );
        setIsEditModalOpen(false);
        setEditingFrais(null);
        setApiMessage('Configuration mise à jour avec succès');
      } else {
        setError(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      console.error('Erreur mise à jour:', err);
      setError('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteClick = (fraisItem: FraisFormation) => {
    setFraisToDelete(fraisItem);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!fraisToDelete) return;

      const response = await fetch(`/api/comptable/frais-formation?id=${fraisToDelete.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setFrais(prev => prev.filter(item => item.id !== fraisToDelete.id));
        setIsDeleteModalOpen(false);
        setFraisToDelete(null);
        setApiMessage('Configuration supprimée avec succès');
      } else {
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur suppression:', err);
      setError('Erreur lors de la suppression');
    }
  };

  const handleServiceChange = (service: keyof ServicesInclus, isEditMode = false) => {
    if (isEditMode && editingFrais) {
      setEditingFrais(prev => prev ? {
        ...prev,
        servicesInclus: {
          ...prev.servicesInclus,
          [service]: !prev.servicesInclus[service]
        }
      } : null);
    } else {
      setNewFrais(prev => ({
        ...prev,
        servicesInclus: {
          ...prev.servicesInclus,
          [service]: !prev.servicesInclus[service]
        }
      }));
    }
  };

  const handleRefresh = () => {
    fetchData();
    fetchFraisInscription();
  };

  const getModeBadge = () => {
    switch (mode) {
      case 'base-de-donnees':
        return <Badge variant="default" className="bg-green-100 text-green-800">Base de données</Badge>;
      case 'simulation':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Mode simulation</Badge>;
      case 'fallback':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Mode secours</Badge>;
      case 'urgence':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Mode urgence</Badge>;
      default:
        return null;
    }
  };

  // Fonction pour styliser les cases à cocher
  const CheckboxItem = ({ 
    label, 
    checked, 
    onChange 
  }: { 
    label: string; 
    checked: boolean; 
    onChange: () => void;
  }) => (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={onChange}
        className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-colors ${
          checked 
            ? 'bg-blue-600 border-blue-600 text-white' 
            : 'bg-white border-gray-300 hover:border-gray-400'
        }`}
      >
        {checked && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <label 
        className="text-sm font-medium leading-none cursor-pointer select-none"
        onClick={onChange}
      >
        {label}
      </label>
    </div>
  );

  // Loading Skeleton
  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
        {/* Header Skeleton */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 rounded w-64"></div>
              <div className="h-4 bg-gray-200 rounded w-96"></div>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <div className="h-9 bg-gray-200 rounded w-24"></div>
              <div className="h-9 bg-gray-200 rounded w-24"></div>
              <div className="h-9 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>

            {/* Filter Bar Skeleton */}
            <SkeletonFilterBar />

            {/* Table Skeleton */}
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-64"></div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Filière</TableHead>
                        <TableHead>Vague</TableHead>
                        <TableHead>Inscription</TableHead>
                        <TableHead>Scolarité</TableHead>
                        <TableHead>Services</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...Array(5)].map((_, index) => (
                        <SkeletonTableRow key={index} />
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

  return (
    <div className="flex flex-col h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Frais de Formation</h1>
            </div>
            <p className="text-gray-600 text-sm sm:text-base">
              Gestion des frais par filière - Inscription: {formatMoney(fraisInscriptionUniversel)}
            </p>
            {apiMessage && (
              <div className="flex items-center gap-2 mt-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-blue-600">{apiMessage}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-0">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="flex items-center justify-center">
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center justify-center">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nouveaux Frais</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white max-h-[90vh] overflow-y-auto max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer une Configuration de Frais</DialogTitle>
                  <DialogDescription>
                    Configurez les frais de scolarité pour une filière et vague spécifique
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vague">Vague *</Label>
                      <Select 
                        value={newFrais.vagueId} 
                        onValueChange={(value) => setNewFrais(prev => ({ ...prev, vagueId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une vague" />
                        </SelectTrigger>
                        <SelectContent>
                          {vagues.map(vague => (
                            <SelectItem key={vague.id} value={vague.id}>
                              {vague.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="filiere">Filière *</Label>
                      <Select 
                        value={newFrais.filiereId} 
                        onValueChange={(value) => setNewFrais(prev => ({ ...prev, filiereId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une filière" />
                        </SelectTrigger>
                        <SelectContent>
                          {filieres.map(filiere => (
                            <SelectItem key={filiere.id} value={filiere.id.toString()}>
                              {filiere.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fraisInscription">Frais d&lsquo;Inscription</Label>
                    <Input 
                      id="fraisInscription" 
                      value={formatMoney(fraisInscriptionUniversel)} 
                      disabled 
                    />
                    <p className="text-xs text-gray-500">Prix fixe pour toutes les filières</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fraisScolarite">Frais de Scolarité *</Label>
                    <Input 
                      id="fraisScolarite" 
                      type="text"
                      placeholder="Ex: 250000 ou 250.000" 
                      value={newFrais.fraisScolarite}
                      onChange={(e) => {
                        // Permettre seulement les chiffres, points et virgules
                        const value = e.target.value.replace(/[^\d,.]/g, '');
                        setNewFrais(prev => ({ ...prev, fraisScolarite: value }))
                      }}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Services Inclus</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <CheckboxItem
                        label="Connexion illimitée"
                        checked={newFrais.servicesInclus.connexionIllimitee}
                        onChange={() => handleServiceChange('connexionIllimitee')}
                      />
                      <CheckboxItem
                        label="Ordinateur portable"
                        checked={newFrais.servicesInclus.ordinateurPortable}
                        onChange={() => handleServiceChange('ordinateurPortable')}
                      />
                      <CheckboxItem
                        label="Matériel pédagogique"
                        checked={newFrais.servicesInclus.materielPedagogique}
                        onChange={() => handleServiceChange('materielPedagogique')}
                      />
                      <CheckboxItem
                        label="Accès plateforme"
                        checked={newFrais.servicesInclus.accesPlateforme}
                        onChange={() => handleServiceChange('accesPlateforme')}
                      />
                      <CheckboxItem
                        label="Support technique"
                        checked={newFrais.servicesInclus.supportTechnique}
                        onChange={() => handleServiceChange('supportTechnique')}
                      />
                    </div>
                  </div>

                  {/* Aperçu du total */}
                  {newFrais.fraisScolarite && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <p className="font-semibold text-blue-900">Total estimé</p>
                            <p className="text-sm text-blue-700">
                              Inscription: {formatMoney(fraisInscriptionUniversel)} + Scolarité: {formatMoney(
                                parseInt(newFrais.fraisScolarite.replace(/\s|,|\./g, '')) || 0
                              )}
                            </p>
                          </div>
                          <div className="text-lg sm:text-xl font-bold text-blue-900">
                            {formatMoney(
                              fraisInscriptionUniversel + 
                              (parseInt(newFrais.fraisScolarite.replace(/\s|,|\./g, '')) || 0)
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="w-full sm:w-auto">
                    Annuler
                  </Button>
                  <Button onClick={handleCreateFrais} className="w-full sm:w-auto">
                    Créer la configuration
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-800">Erreur</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-700"
              >
                ×
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total des Frais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-green-600">{formatMoney(stats.totalFrais)}</div>
                <p className="text-xs text-gray-600 mt-1">{filteredFrais.length} configuration(s)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Filières Configurées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalFiliere}</div>
                <p className="text-xs text-gray-600 mt-1">sur {filieres.length} filières</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Moyenne Scolarité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-purple-600">{formatMoney(stats.moyenneScolarite)}</div>
                <p className="text-xs text-gray-600 mt-1">scolarité moyenne</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtres et recherche */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher par filière ou vague..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={selectedVague} onValueChange={setSelectedVague}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Toutes vagues" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes vagues</SelectItem>
                      {vagues.map(vague => (
                        <SelectItem key={vague.id} value={vague.id}>
                          {vague.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <FileText className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Toutes filières" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes filières</SelectItem>
                      {filieres.map(filiere => (
                        <SelectItem key={filiere.id} value={filiere.id.toString()}>
                          {filiere.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des frais */}
          <Card>
            <CardHeader>
              <CardTitle>Configurations des Frais</CardTitle>
              <CardDescription>
                {filteredFrais.length} configuration(s) de frais trouvée(s)
                {mode !== 'base-de-donnees' && ' (Mode dégradé)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Filière</TableHead>
                      <TableHead className="min-w-[120px]">Vague</TableHead>
                      <TableHead className="min-w-[100px]">Inscription</TableHead>
                      <TableHead className="min-w-[100px]">Scolarité</TableHead>
                      <TableHead className="min-w-[150px]">Services Inclus</TableHead>
                      <TableHead className="min-w-[100px]">Total</TableHead>
                      <TableHead className="min-w-[80px]">Statut</TableHead>
                      <TableHead className="min-w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFrais.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="text-gray-500">
                            {frais.length === 0 
                              ? 'Aucune configuration de frais trouvée. Créez la première configuration !'
                              : 'Aucune configuration ne correspond aux filtres appliqués.'
                            }
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredFrais.map((fraisItem) => (
                        <TableRow key={fraisItem.id}>
                          <TableCell className="font-medium">{fraisItem.filiereName}</TableCell>
                          <TableCell>{fraisItem.vagueName}</TableCell>
                          <TableCell>{formatMoney(fraisItem.fraisInscription)}</TableCell>
                          <TableCell>{formatMoney(fraisItem.fraisScolarite)}</TableCell>
                          <TableCell className="max-w-[200px]">
                            <div className="text-xs text-gray-600 line-clamp-2">
                              {getServicesText(fraisItem.servicesInclus)}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatMoney(fraisItem.total)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={fraisItem.statut === 'ACTIF' ? 'default' : 'secondary'}>
                              {fraisItem.statut === 'ACTIF' ? 'Actif' : 'Archivé'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 sm:gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEditFrais(fraisItem)}
                                className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteClick(fraisItem)}
                                className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de modification */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-white max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la Configuration de Frais</DialogTitle>
            <DialogDescription>
              Modifiez les frais de scolarité pour cette filière et vague
            </DialogDescription>
          </DialogHeader>
          
          {editingFrais && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-vague">Vague</Label>
                  <Input 
                    id="edit-vague" 
                    value={editingFrais.vagueName} 
                    disabled 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-filiere">Filière</Label>
                  <Input 
                    id="edit-filiere" 
                    value={editingFrais.filiereName} 
                    disabled 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-fraisInscription">Frais d&lsquo;Inscription</Label>
                <Input 
                  id="edit-fraisInscription" 
                  value={formatMoney(editingFrais.fraisInscription)} 
                  disabled 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-fraisScolarite">Frais de Scolarité *</Label>
                <Input 
                  id="edit-fraisScolarite" 
                  type="text"
                  value={editingFrais.fraisScolarite}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d,.]/g, '');
                    setEditingFrais(prev => prev ? {
                      ...prev,
                      fraisScolarite: value as any,
                      total: fraisInscriptionUniversel + (parseInt(value.replace(/\s|,|\./g, '')) || 0)
                    } : null)
                  }}
                />
              </div>

              <div className="space-y-3">
                <Label>Services Inclus</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <CheckboxItem
                    label="Connexion illimitée"
                    checked={editingFrais.servicesInclus.connexionIllimitee}
                    onChange={() => handleServiceChange('connexionIllimitee', true)}
                  />
                  <CheckboxItem
                    label="Ordinateur portable"
                    checked={editingFrais.servicesInclus.ordinateurPortable}
                    onChange={() => handleServiceChange('ordinateurPortable', true)}
                  />
                  <CheckboxItem
                    label="Matériel pédagogique"
                    checked={editingFrais.servicesInclus.materielPedagogique}
                    onChange={() => handleServiceChange('materielPedagogique', true)}
                  />
                  <CheckboxItem
                    label="Accès plateforme"
                    checked={editingFrais.servicesInclus.accesPlateforme}
                    onChange={() => handleServiceChange('accesPlateforme', true)}
                  />
                  <CheckboxItem
                    label="Support technique"
                    checked={editingFrais.servicesInclus.supportTechnique}
                    onChange={() => handleServiceChange('supportTechnique', true)}
                  />
                </div>
              </div>

              {/* Aperçu du total */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <p className="font-semibold text-blue-900">Total</p>
                      <p className="text-sm text-blue-700">
                        Inscription: {formatMoney(fraisInscriptionUniversel)} + Scolarité: {formatMoney(editingFrais.fraisScolarite)}
                      </p>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-blue-900">
                      {formatMoney(fraisInscriptionUniversel + editingFrais.fraisScolarite)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button onClick={handleUpdateFrais} className="w-full sm:w-auto">
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmation de suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la configuration des frais pour{" "}
              <strong>{fraisToDelete?.filiereName}</strong> -{" "}
              <strong>{fraisToDelete?.vagueName}</strong> ?
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-red-800">Attention</p>
                <p className="text-xs text-red-700 mt-1">
                  Cette action est irréversible. Toutes les données associées à ces frais seront définitivement supprimées.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteModalOpen(false);
                setFraisToDelete(null);
              }} 
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleDeleteConfirm}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}