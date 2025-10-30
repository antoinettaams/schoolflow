// app/dashboard/comptable/frais-formation/page.tsx
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
import { Plus, Search, Filter, Download, Edit, Trash2, FileText, Send} from 'lucide-react';

// Types
interface FraisFormation {
  id: string;
  vagueId: string;
  vagueName: string;
  filiereId: string;
  filiereName: string;
  fraisInscription: number;
  fraisScolarite: number;
  servicesInclus: {
    connexionIllimitee: boolean;
    ordinateurPortable: boolean;
    materielPedagogique: boolean;
    accesPlateforme: boolean;
    supportTechnique: boolean;
  };
  total: number;
  statut: 'actif' | 'archivé';
  dateCreation: string;
  dateModification: string;
}

export default function FraisFormationPage() {
  const [frais, setFrais] = useState<FraisFormation[]>([]);
  const [filteredFrais, setFilteredFrais] = useState<FraisFormation[]>([]);
  const [selectedVague, setSelectedVague] = useState<string>('all');
  const [selectedFiliere, setSelectedFiliere] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedFraisForSend, setSelectedFraisForSend] = useState<FraisFormation | null>(null);

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

  // Données simulées
  const vagues = [
    { id: '1', name: 'Vague Janvier 2024' },
    { id: '2', name: 'Vague Juillet 2024' },
  ];

  const filieres = [
    { id: '1', name: 'Développement Web' },
    { id: '2', name: 'Data Science' },
    { id: '3', name: 'Réseaux & Sécurité' },
    { id: '4', name: 'Design Graphique' },
  ];

  // Prix fixe d'inscription pour toutes les filières
  const FRAIS_INSCRIPTION_FIXE = 50000;

  useEffect(() => {
    // Données simulées avec frais d'inscription fixes
    const mockData: FraisFormation[] = [
      {
        id: '1',
        vagueId: '1',
        vagueName: 'Vague Janvier 2024',
        filiereId: '1',
        filiereName: 'Développement Web',
        fraisInscription: FRAIS_INSCRIPTION_FIXE,
        fraisScolarite: 300000,
        servicesInclus: {
          connexionIllimitee: true,
          ordinateurPortable: true,
          materielPedagogique: true,
          accesPlateforme: true,
          supportTechnique: true,
        },
        total: FRAIS_INSCRIPTION_FIXE + 300000,
        statut: 'actif',
        dateCreation: '2024-01-15',
        dateModification: '2024-01-15'
      },
      {
        id: '2',
        vagueId: '1',
        vagueName: 'Vague Janvier 2024',
        filiereId: '2',
        filiereName: 'Data Science',
        fraisInscription: FRAIS_INSCRIPTION_FIXE,
        fraisScolarite: 350000,
        servicesInclus: {
          connexionIllimitee: true,
          ordinateurPortable: true,
          materielPedagogique: true,
          accesPlateforme: true,
          supportTechnique: true,
        },
        total: FRAIS_INSCRIPTION_FIXE + 350000,
        statut: 'actif',
        dateCreation: '2024-01-15',
        dateModification: '2024-01-15'
      },
    ];
    setFrais(mockData);
    setFilteredFrais(mockData);
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

  const handleSendToParents = (fraisItem: FraisFormation) => {
    setSelectedFraisForSend(fraisItem);
    setIsSendModalOpen(true);
  };

  const confirmSendToParents = () => {
    // Logique d'envoi aux parents
    console.log('Envoi des frais aux parents:', selectedFraisForSend);
    setIsSendModalOpen(false);
    setSelectedFraisForSend(null);
  };

  const getServicesText = (services: FraisFormation['servicesInclus']) => {
    const activeServices = [];
    if (services.connexionIllimitee) activeServices.push('Connexion illimitée');
    if (services.ordinateurPortable) activeServices.push('Ordinateur portable');
    if (services.materielPedagogique) activeServices.push('Matériel pédagogique');
    if (services.accesPlateforme) activeServices.push('Accès plateforme');
    if (services.supportTechnique) activeServices.push('Support technique');
    return activeServices.join(', ');
  };

  const handleCreateFrais = () => {
    if (!newFrais.vagueId || !newFrais.filiereId || !newFrais.fraisScolarite) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const vague = vagues.find(v => v.id === newFrais.vagueId);
    const filiere = filieres.find(f => f.id === newFrais.filiereId);

    const nouveauFrais: FraisFormation = {
      id: Date.now().toString(),
      vagueId: newFrais.vagueId,
      vagueName: vague?.name || '',
      filiereId: newFrais.filiereId,
      filiereName: filiere?.name || '',
      fraisInscription: FRAIS_INSCRIPTION_FIXE,
      fraisScolarite: parseInt(newFrais.fraisScolarite),
      servicesInclus: newFrais.servicesInclus,
      total: FRAIS_INSCRIPTION_FIXE + parseInt(newFrais.fraisScolarite),
      statut: 'actif',
      dateCreation: new Date().toISOString().split('T')[0],
      dateModification: new Date().toISOString().split('T')[0]
    };

    setFrais(prev => [...prev, nouveauFrais]);
    setIsCreateModalOpen(false);
    
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
  };

  const handleServiceChange = (service: keyof typeof newFrais.servicesInclus) => {
    setNewFrais(prev => ({
      ...prev,
      servicesInclus: {
        ...prev.servicesInclus,
        [service]: !prev.servicesInclus[service]
      }
    }));
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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Frais de Formation</h1>
            <p className="text-gray-600 mt-1">Gestion des frais par filière - Inscription: {formatMoney(FRAIS_INSCRIPTION_FIXE)}</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveaux Frais
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white h-screen overflow-y-auto max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer une Configuration de Frais</DialogTitle>
                  <DialogDescription>
                    Configurez les frais de scolarité pour une filière et vague spécifique
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
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
                              {vague.name}
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
                            <SelectItem key={filiere.id} value={filiere.id}>
                              {filiere.name}
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
                      value={formatMoney(FRAIS_INSCRIPTION_FIXE)} 
                      disabled 
                    />
                    <p className="text-xs text-gray-500">Prix fixe pour toutes les filières</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fraisScolarite">Frais de Scolarité *</Label>
                    <Input 
                      id="fraisScolarite" 
                      type="number" 
                      placeholder="Entrez le montant de la scolarité" 
                      value={newFrais.fraisScolarite}
                      onChange={(e) => setNewFrais(prev => ({ ...prev, fraisScolarite: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Services Inclus</Label>
                    <div className="grid grid-cols-2 gap-4">
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
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-blue-900">Total estimé</p>
                            <p className="text-sm text-blue-700">
                              Inscription: {formatMoney(FRAIS_INSCRIPTION_FIXE)} + Scolarité: {formatMoney(parseInt(newFrais.fraisScolarite) || 0)}
                            </p>
                          </div>
                          <div className="text-xl font-bold text-blue-900">
                            {formatMoney(FRAIS_INSCRIPTION_FIXE + (parseInt(newFrais.fraisScolarite) || 0))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreateFrais}>
                    Créer la configuration
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total des Frais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatMoney(stats.totalFrais)}</div>
                <p className="text-xs text-gray-600 mt-1">{filteredFrais.length} configuration(s)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Filières Configurées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.totalFiliere}</div>
                <p className="text-xs text-gray-600 mt-1">sur {filieres.length} filières</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Moyenne Scolarité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{formatMoney(stats.moyenneScolarite)}</div>
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
                
                <div className="flex gap-3">
                  <Select value={selectedVague} onValueChange={setSelectedVague}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Toutes vagues" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes vagues</SelectItem>
                      {vagues.map(vague => (
                        <SelectItem key={vague.id} value={vague.id}>
                          {vague.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                    <SelectTrigger className="w-[180px]">
                      <FileText className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Toutes filières" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes filières</SelectItem>
                      {filieres.map(filiere => (
                        <SelectItem key={filiere.id} value={filiere.id}>
                          {filiere.name}
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
              </CardDescription>
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
                      <TableHead>Services Inclus</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFrais.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="text-gray-500">
                            Aucune configuration de frais trouvée
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
                            <Badge variant={fraisItem.statut === 'actif' ? 'default' : 'secondary'}>
                              {fraisItem.statut === 'actif' ? 'Actif' : 'Archivé'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSendToParents(fraisItem)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
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

      {/* Modal d'envoi aux parents */}
      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer les Frais aux Parents</DialogTitle>
            <DialogDescription>
              Envoyer la configuration des frais aux parents concernés
            </DialogDescription>
          </DialogHeader>
          
          {selectedFraisForSend && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Détails des frais</h4>
                <p><strong>Filière:</strong> {selectedFraisForSend.filiereName}</p>
                <p><strong>Vague:</strong> {selectedFraisForSend.vagueName}</p>
                <p><strong>Total:</strong> {formatMoney(selectedFraisForSend.total)}</p>
              </div>

              <div className="space-y-2">
                <Label>Parents concernés</Label>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                  <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">M. Diallo</p>
                      <p className="text-sm text-gray-600">Élève: Jean Diallo</p>
                    </div>
                    <Badge variant="outline">1 enfant</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">Mme. Koné</p>
                      <p className="text-sm text-gray-600">Élève: Aïcha Koné</p>
                    </div>
                    <Badge variant="outline">1 enfant</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={confirmSendToParents}>
              <Send className="h-4 w-4 mr-2" />
              Envoyer aux Parents
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}