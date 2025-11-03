"use client";
import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaEdit, FaTrash, FaBook, FaWeight, FaList, FaTimes, FaFilter,
  FaSave, FaCheck, FaChevronDown 
} from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Interface des modules
interface ModuleType {
  id: string;
  name: string;
  coefficient: number;
  type: 'theorique' | 'pratique' | 'mixte' | 'projet';
  description?: string;
}

// Interface principale pour chaque filière
interface Filiere {
  id: string;
  name: string;
  duration: string;
  description: string;
  vagues: string[];
  modules: ModuleType[];
}

// Interface pour les vagues
interface Vague {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  description?: string;
  filieres: Array<{ id: string; name: string }>;
  totalEtudiants: number;
  totalFormateurs: number;
  semestres: string[];
}

// Interface pour le nouveau module
interface NewModule {
  name: string;
  coefficient: number;
  type: 'theorique' | 'pratique' | 'mixte' | 'projet';
  description: string;
}

// Interface pour la nouvelle filière
interface NewFiliere {
  name: string;
  duration: string;
  description: string;
  vagues: string[];
}

export default function FilieresModulesPage() {
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [vagues, setVagues] = useState<Vague[]>([]);
  const [selectedVague, setSelectedVague] = useState<string>("all");
  const [selectedFiliere, setSelectedFiliere] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingFiliere, setEditingFiliere] = useState<Filiere | null>(null);
  const [newFiliere, setNewFiliere] = useState<NewFiliere>({
    name: '',
    duration: '',
    description: '',
    vagues: []
  });
  const [currentModules, setCurrentModules] = useState<ModuleType[]>([]);
  const [newModule, setNewModule] = useState<NewModule>({
    name: '',
    coefficient: 1,
    type: 'theorique',
    description: ''
  });
  const [isLoadingVagues, setIsLoadingVagues] = useState(true);
  const [showVagueSelection, setShowVagueSelection] = useState(false);

  // Charger les vagues
  useEffect(() => {
    const fetchVagues = async () => {
      try {
        console.log("🔄 Chargement des vagues depuis l'API...");
        const response = await fetch('/api/censor/vagues');
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const vaguesData: Vague[] = await response.json();
        console.log('Vagues chargées depuis API:', vaguesData);
        
        setVagues(vaguesData);
      } catch (error) {
        console.error('Erreur lors du chargement des vagues:', error);
        setVagues([]);
      } finally {
        setIsLoadingVagues(false);
      }
    };

    fetchVagues();
  }, []);

  // Obtenir les modules uniques pour le filtre
  const getUniqueModules = (): string[] => {
    const allModules = filieres.flatMap(f => f.modules);
    const uniqueModules = Array.from(new Set(allModules.map(m => m.name)));
    return uniqueModules;
  };

  // Obtenir le nom des vagues à partir de leurs IDs
  const getVagueNames = (vagueIds: string[]): string => {
    if (vagueIds.length === 0) return "Aucune vague";
    
    const names = vagueIds.map(id => {
      const vague = vagues.find(v => v.id === id);
      return vague ? vague.name : "Vague inconnue";
    });
    
    return names.join(", ");
  };

  // Filtrage des filières
  const filteredFilieres = filieres.filter(filiere => {
    const matchesVague = selectedVague === "all" || filiere.vagues.includes(selectedVague);
    const matchesFiliere = selectedFiliere === "all" || filiere.name === selectedFiliere;
    const matchesModule = selectedModule === "all" || 
      filiere.modules.some(m => m.name === selectedModule);
    
    return matchesVague && matchesFiliere && matchesModule;
  });

  // Gérer la sélection/désélection des vagues
  const handleVagueToggle = (vagueId: string) => {
    setNewFiliere(prev => {
      const isSelected = prev.vagues.includes(vagueId);
      if (isSelected) {
        return {
          ...prev,
          vagues: prev.vagues.filter(id => id !== vagueId)
        };
      } else {
        return {
          ...prev,
          vagues: [...prev.vagues, vagueId]
        };
      }
    });
  };

  const ajouterFiliere = (): void => {
    if (!newFiliere.name.trim() || !newFiliere.duration.trim()) {
      alert("Veuillez remplir tous les champs obligatoires de la filière");
      return;
    }

    if (currentModules.length === 0) {
      alert("Veuillez ajouter au moins un module à la filière");
      return;
    }

    if (newFiliere.vagues.length === 0) {
      alert("Veuillez sélectionner au moins une vague");
      return;
    }

    const filiere: Filiere = {
      id: editingFiliere ? editingFiliere.id : Date.now().toString(),
      name: newFiliere.name.trim(),
      duration: newFiliere.duration.trim(),
      description: newFiliere.description.trim(),
      vagues: newFiliere.vagues,
      modules: [...currentModules]
    };

    if (editingFiliere) {
      setFilieres(prev => prev.map(f => f.id === editingFiliere.id ? filiere : f));
    } else {
      setFilieres(prev => [...prev, filiere]);
    }
    
    // Réinitialiser le formulaire
    setShowAddForm(false);
    setEditingFiliere(null);
    setNewFiliere({ name: '', duration: '', description: '', vagues: [] });
    setCurrentModules([]);
    setShowVagueSelection(false);
  };

  const modifierFiliere = (filiere: Filiere): void => {
    setEditingFiliere(filiere);
    setNewFiliere({
      name: filiere.name,
      duration: filiere.duration,
      description: filiere.description,
      vagues: filiere.vagues
    });
    setCurrentModules([...filiere.modules]);
    setShowAddForm(true);
  };

  const ajouterModule = (): void => {
    if (!newModule.name.trim()) {
      alert("Veuillez remplir le nom du module");
      return;
    }

    const moduleData: ModuleType = {
      id: Date.now().toString(),
      name: newModule.name.trim(),
      coefficient: newModule.coefficient,
      type: newModule.type,
      description: newModule.description.trim()
    };

    setCurrentModules(prev => [...prev, moduleData]);
    setNewModule({
      name: '',
      coefficient: 1,
      type: 'theorique',
      description: ''
    });
  };

  const supprimerModule = (moduleId: string): void => {
    setCurrentModules(prev => prev.filter(m => m.id !== moduleId));
  };

  const supprimerFiliere = (filiereId: string): void => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette filière ? Cette action est irréversible.")) {
      setFilieres(prev => prev.filter(f => f.id !== filiereId));
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'theorique': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pratique': return 'bg-green-100 text-green-800 border-green-200';
      case 'mixte': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'projet': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeText = (type: string): string => {
    switch (type) {
      case 'theorique': return 'Théorique';
      case 'pratique': return 'Pratique';
      case 'mixte': return 'Mixte';
      case 'projet': return 'Projet';
      default: return type;
    }
  };

  const annulerEdition = (): void => {
    setShowAddForm(false);
    setEditingFiliere(null);
    setNewFiliere({ name: '', duration: '', description: '', vagues: [] });
    setCurrentModules([]);
    setShowVagueSelection(false);
  };

  // Afficher un indicateur de chargement
  if (isLoadingVagues) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center lg:pl-5 pt-20 lg:pt-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des vagues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
        
        {/* En-tête avec statistiques */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 lg:mb-6">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                  Filières & Modules
                </h1>
                <p className="text-gray-600 mt-1 lg:mt-2 text-sm lg:text-base">
                  {filteredFilieres.length} filière(s) filtrée(s) • {vagues.length} vague(s) disponible(s)
                </p>
              </div>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full lg:w-auto"
                disabled={vagues.length === 0}
              >
                <FaPlus className="mr-2 h-4 w-4" />
                Nouvelle filière
                {vagues.length === 0 && (
                  <span className="ml-2 text-xs">(Aucune vague disponible)</span>
                )}
              </Button>
            </div>

            {/* Filtres */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4 mb-4">
              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaFilter className="inline mr-2 h-3 w-3" />
                  Vague {vagues.length > 0 && `(${vagues.length})`}
                </label>
                <Select value={selectedVague} onValueChange={setSelectedVague}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Toutes les vagues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les vagues</SelectItem>
                    {vagues.map((vague) => (
                      <SelectItem key={vague.id} value={vague.id}>
                        {vague.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filière
                </label>
                <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Toutes les filières" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les filières</SelectItem>
                    {Array.from(new Set(filieres.map(f => f.name))).map((filiereName) => (
                      <SelectItem key={filiereName} value={filiereName}>
                        {filiereName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Module
                </label>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tous les modules" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les modules</SelectItem>
                    {getUniqueModules().map((moduleName) => (
                      <SelectItem key={moduleName} value={moduleName}>
                        {moduleName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Boutons de réinitialisation */}
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedVague("all");
                  setSelectedFiliere("all");
                  setSelectedModule("all");
                }}
                className="w-full sm:w-auto"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Avertissement */}
        {vagues.length === 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FaFilter className="text-yellow-600 text-xl" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Aucune vague disponible</h3>
                  <p className="text-yellow-700 text-sm">
                    Vous devez d'abord créer des vagues dans la section "Gestion des Vagues" 
                    avant de pouvoir créer des filières.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulaire d'ajout/modification avec modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <Card className="bg-white w-full max-w-2xl lg:max-w-4xl max-h-[95vh] overflow-hidden">
              <CardHeader className="bg-white border-b p-4 sm:p-6">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg sm:text-xl">
                    {editingFiliere ? 'Modifier la filière' : 'Nouvelle filière avec modules'}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={annulerEdition}
                    className="flex-shrink-0"
                  >
                    <FaTimes className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <div className="overflow-y-auto max-h-[calc(95vh-140px)] p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
                {/* Informations de la filière */}
                <Card>
                  <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <FaBook className="h-4 w-4" />
                      Informations de la filière
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Nom de la filière *
                        </label>
                        <Input
                          placeholder="Ex: Développement Web Fullstack"
                          value={newFiliere.name}
                          onChange={(e) => setNewFiliere(prev => ({ ...prev, name: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Durée de formation *
                        </label>
                        <Input
                          placeholder="Ex: 6 mois"
                          value={newFiliere.duration}
                          onChange={(e) => setNewFiliere(prev => ({ ...prev, duration: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                      
                      {/* Sélection des vagues avec Checkboxes uniquement */}
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Vagues associées *
                        </label>
                        <div className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              {newFiliere.vagues.length} vague(s) sélectionnée(s)
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowVagueSelection(!showVagueSelection)}
                              className="text-xs"
                            >
                              {showVagueSelection ? 'Masquer' : 'Afficher'} les vagues
                            </Button>
                          </div>
                          
                          {showVagueSelection && (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {vagues.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-2">
                                  Aucune vague disponible
                                </p>
                              ) : (
                                vagues.map((vague) => (
                                  <div key={vague.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`vague-${vague.id}`}
                                      checked={newFiliere.vagues.includes(vague.id)}
                                      onCheckedChange={() => handleVagueToggle(vague.id)}
                                    />
                                    <Label
                                      htmlFor={`vague-${vague.id}`}
                                      className="text-sm font-normal cursor-pointer flex-1"
                                    >
                                      {vague.name}
                                    </Label>
                                    <Badge variant="outline" className="text-xs">
                                      {vague.status}
                                    </Badge>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                          
                          {newFiliere.vagues.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600">
                                Vagues sélectionnées: {getVagueNames(newFiliere.vagues)}
                              </p>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {newFiliere.vagues.length === 0 
                            ? "Sélectionnez au moins une vague"
                            : `✓ ${newFiliere.vagues.length} vague(s) sélectionnée(s)`
                          }
                        </p>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <Input
                          placeholder="Description de la filière..."
                          value={newFiliere.description}
                          onChange={(e) => setNewFiliere(prev => ({ ...prev, description: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Modules de la filière */}
                <Card>
                  <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <FaList className="h-4 w-4" />
                      Modules de la filière
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                    {/* Formulaire d'ajout de module */}
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-3 sm:p-4">
                        <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Ajouter un module</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3">
                          <div className="space-y-1 sm:space-y-2">
                            <label className="text-xs font-medium text-gray-700">
                              Nom du module *
                            </label>
                            <Input
                              placeholder="Ex: HTML/CSS"
                              value={newModule.name}
                              onChange={(e) => setNewModule(prev => ({ ...prev, name: e.target.value }))}
                              className="text-xs sm:text-sm h-8 sm:h-10"
                            />
                          </div>
                          <div className="space-y-1 sm:space-y-2">
                            <label className="text-xs font-medium text-gray-700">
                              Coefficient
                            </label>
                            <Input
                              type="number"
                              min="0.5"
                              step="0.5"
                              placeholder="1.0"
                              value={newModule.coefficient}
                              onChange={(e) => setNewModule(prev => ({ ...prev, coefficient: parseFloat(e.target.value) || 1 }))}
                              className="text-xs sm:text-sm h-8 sm:h-10"
                            />
                          </div>
                          <div className="space-y-1 sm:space-y-2">
                            <label className="text-xs font-medium text-gray-700">
                              Type de module
                            </label>
                            <Select
                              value={newModule.type}
                              onValueChange={(value: 'theorique' | 'pratique' | 'mixte' | 'projet') => 
                                setNewModule(prev => ({ ...prev, type: value }))
                              }
                            >
                              <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="theorique">Théorique</SelectItem>
                                <SelectItem value="pratique">Pratique</SelectItem>
                                <SelectItem value="mixte">Mixte</SelectItem>
                                <SelectItem value="projet">Projet</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1 sm:space-y-2">
                            <label className="text-xs font-medium text-gray-700">
                              Description
                            </label>
                            <Input
                              placeholder="Description optionnelle..."
                              value={newModule.description}
                              onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
                              className="text-xs sm:text-sm h-8 sm:h-10"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={ajouterModule}
                          className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                          size="sm"
                        >
                          <FaPlus className="mr-2 h-3 w-3" />
                          Ajouter le module
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Liste des modules ajoutés */}
                    {currentModules.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                          Modules {editingFiliere ? 'de la filière' : 'ajoutés'} ({currentModules.length})
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {currentModules.map((moduleItem) => (
                            <Card key={moduleItem.id} className="border">
                              <CardContent className="p-2 sm:p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                                      <span className="font-medium text-gray-900 text-sm truncate">{moduleItem.name}</span>
                                      <Badge variant="outline" className={getTypeColor(moduleItem.type) + " text-xs flex-shrink-0"}>
                                        {getTypeText(moduleItem.type)}
                                      </Badge>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <FaWeight className="h-3 w-3" />
                                        Coefficient: {moduleItem.coefficient}
                                      </span>
                                      {moduleItem.description && (
                                        <span className="text-gray-500 truncate">{moduleItem.description}</span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => supprimerModule(moduleItem.id)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 flex-shrink-0 ml-2"
                                  >
                                    <FaTrash className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Card className="border-dashed">
                        <CardContent className="p-6 sm:p-8 text-center">
                          <FaList className="text-2xl sm:text-3xl text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">Aucun module {editingFiliere ? 'dans cette filière' : 'ajouté'}</p>
                          <p className="text-xs text-gray-400">Ajoutez les modules de cette filière</p>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>

                {/* Note informative */}
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-3 sm:p-4">
                    <h4 className="font-medium text-yellow-800 mb-2 text-sm">Information importante</h4>
                    <p className="text-xs sm:text-sm text-yellow-700">
                      Les horaires spécifiques (9h00-12h30), jours de cours et salles seront définis 
                      ultérieurement dans la section <strong>&quot;Planning & Assignations&quot;</strong> lorsque 
                      vous assignerez les formateurs à ces modules.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Boutons d'action */}
              <CardContent className="bg-white border-t p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-xs sm:text-sm text-gray-600">
                    {currentModules.length} module(s) • {newFiliere.vagues.length} vague(s) sélectionnée(s)
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      variant="outline"
                      onClick={annulerEdition}
                      className="flex-1 sm:flex-none"
                    >
                      Annuler
                    </Button>
                    <Button 
                      onClick={ajouterFiliere}
                      disabled={currentModules.length === 0 || newFiliere.vagues.length === 0}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 flex-1 sm:flex-none"
                    >
                      <FaSave className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      {editingFiliere ? 'Modifier' : 'Créer'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Liste des filières */}
        {filteredFilieres.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 sm:p-8 lg:p-12 text-center">
              <FaBook className="text-3xl sm:text-4xl lg:text-5xl text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                {selectedVague === "all" && selectedFiliere === "all" && selectedModule === "all" 
                  ? "Aucune filière créée" 
                  : "Aucune filière correspondante"
                }
              </h3>
              <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">
                {selectedVague === "all" && selectedFiliere === "all" && selectedModule === "all"
                  ? "Créez votre première filière avec ses modules" 
                  : "Aucune filière ne correspond aux critères de filtrage"
                }
              </p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                Créer une filière
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 lg:space-y-6">
            {filteredFilieres.map((filiere) => (
              <Card key={filiere.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-3 sm:p-4 lg:p-6 border-b">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{filiere.name}</h3>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 sm:mt-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                            {filiere.duration}
                          </Badge>
                          <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                            {filiere.modules.length} module(s)
                          </Badge>
                          {filiere.vagues.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {getVagueNames(filiere.vagues)}
                            </Badge>
                          )}
                        </div>
                        {filiere.description && (
                          <p className="text-gray-600 mt-2 sm:mt-3 text-sm">{filiere.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 sm:gap-2 w-full lg:w-auto">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => modifierFiliere(filiere)}
                          className="flex-1 lg:flex-none text-xs"
                        >
                          <FaEdit className="mr-1 sm:mr-2 h-3 w-3" />
                          <span className="hidden sm:inline">Modifier</span>
                          <span className="sm:hidden">Edit</span>
                        </Button>
                        <Button 
                          variant="destructive"
                          size="sm"
                          onClick={() => supprimerFiliere(filiere.id)}
                          className="flex-1 lg:flex-none text-xs"
                        >
                          <FaTrash className="mr-1 sm:mr-2 h-3 w-3" />
                          <span className="hidden sm:inline">Supprimer</span>
                          <span className="sm:hidden">Del</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Modules de la filière */}
                  <div className="p-3 sm:p-4 lg:p-6">
                    <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">
                      Modules de formation ({filiere.modules.length})
                    </h4>
                    <div className="overflow-x-auto">
                      <div className="min-w-[600px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[150px] sm:min-w-[200px] text-xs sm:text-sm">Module</TableHead>
                              <TableHead className="min-w-[100px] sm:min-w-[120px] text-xs sm:text-sm">Type</TableHead>
                              <TableHead className="min-w-[80px] sm:min-w-[100px] text-xs sm:text-sm">Coefficient</TableHead>
                              <TableHead className="text-xs sm:text-sm">Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filiere.modules.map((moduleItem) => (
                              <TableRow key={moduleItem.id}>
                                <TableCell className="font-medium text-xs sm:text-sm">{moduleItem.name}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={getTypeColor(moduleItem.type) + " text-xs"}>
                                    {getTypeText(moduleItem.type)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="bg-gray-100 text-gray-800 text-xs">
                                    {moduleItem.coefficient}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-gray-600 text-xs sm:text-sm">
                                  {moduleItem.description || "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}