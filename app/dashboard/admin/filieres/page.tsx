"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  FaSearch,
  FaSort,
  FaEye,
  FaGraduationCap,
  FaBook,
  FaLayerGroup,
  FaUsers,
  FaChalkboardTeacher
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Types CORRIGÉS
interface Module {
  id: string;
  name: string;
  coefficient: number;
  typeModule: string;
  description?: string;
  semestre?: string;
  enseignants: Array<{ id: string; name: string }>;
  vagues: string[];
}

interface Filiere {
  id: string;
  name: string;
  description: string;
  duration: string;
  totalModules: number;
  status: "active" | "inactive";
  modules: Module[];
  createdAt: string;
  statistiques: {
    totalEtudiants: number;
    totalFormateurs: number;
    totalSemestres: number;
    vaguesAssociees: string[];
  };
}

interface ApiResponse {
  filieres: Filiere[];
  metadata?: {
    total: number;
    filtres: {
      searchTerm: string;
      status: string;
      vagueId: string;
    };
    vaguesDisponibles: string[];
  };
}

interface StatsResponse {
  general: {
    totalFilieres: number;
    filieresActives: number;
    filieresInactives: number;
    totalModules: number;
    totalEtudiantsActifs: number;
    totalFormateurs: number;
    dureeLaPlusCourante: string;
  };
}

// Composant Skeleton pour les statistiques
const StatsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-12 mb-1" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Composant Skeleton pour les statistiques supplémentaires
const AdditionalStatsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(2)].map((_, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-12 mb-1" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Composant Skeleton pour les filtres
const FiltersSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-10 md:col-span-2" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </CardContent>
    </Card>
  );
};

// Composant Skeleton pour les lignes du tableau
const TableRowSkeleton = () => {
  return (
    <TableRow>
      <TableCell>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-40" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex justify-center">
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex justify-center">
          <Skeleton className="h-4 w-16" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex justify-center">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-8 rounded" />
      </TableCell>
    </TableRow>
  );
};

const AdminFilieresPage = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedVague, setSelectedVague] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Filiere>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [vaguesDisponibles, setVaguesDisponibles] = useState<string[]>([]);
  
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalModules: 0,
    totalEtudiants: 0,
    totalFormateurs: 0,
    dureeLaPlusCourante: "3 ans",
  });

  // Modal "Voir" état
  const [selectedFiliere, setSelectedFiliere] = useState<Filiere | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Charger les filières depuis l'API
  const chargerFilieres = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedVague !== 'all') params.append('vagueId', selectedVague);

      const response = await fetch(`/api/admin/filieres?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des filières');
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.filieres && Array.isArray(data.filieres)) {
        setFilieres(data.filieres);
        
        if (data.metadata && Array.isArray(data.metadata.vaguesDisponibles)) {
          const vaguesValides = data.metadata.vaguesDisponibles.filter((vague): vague is string => 
            typeof vague === 'string' && vague.trim() !== ''
          );
          setVaguesDisponibles(vaguesValides);
        }
      } else {
        const filieresArray = Array.isArray(data) ? data : [];
        setFilieres(filieresArray);
        
        const toutesVagues = Array.from(new Set(
          filieresArray.flatMap((filiere: Filiere) => 
            (filiere.statistiques?.vaguesAssociees || []).concat(
              filiere.modules.flatMap(module => module.vagues || [])
            )
          )
        )).filter((vague): vague is string => 
          typeof vague === 'string' && vague.trim() !== ''
        ).sort();
        
        setVaguesDisponibles(toutesVagues);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setFilieres([]);
      setVaguesDisponibles([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques
  const chargerStatistiques = async () => {
    try {
      const response = await fetch('/api/admin/filieres?action=stats');
      
      if (response.ok) {
        const statsData: StatsResponse = await response.json();
        
        if (statsData.general) {
          setStats({
            total: statsData.general.totalFilieres || 0,
            active: statsData.general.filieresActives || 0,
            inactive: statsData.general.filieresInactives || 0,
            totalModules: statsData.general.totalModules || 0,
            totalEtudiants: statsData.general.totalEtudiantsActifs || 0,
            totalFormateurs: statsData.general.totalFormateurs || 0,
            dureeLaPlusCourante: statsData.general.dureeLaPlusCourante || "3 ans"
          });
        }
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
      setStats({
        total: 0,
        active: 0,
        inactive: 0,
        totalModules: 0,
        totalEtudiants: 0,
        totalFormateurs: 0,
        dureeLaPlusCourante: "3 ans"
      });
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const userRole = user?.publicMetadata?.role as string;
      if (userRole !== "Administrateur") {
        router.push("/unauthorized");
        return;
      }
      
      chargerFilieres();
      chargerStatistiques();
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Recharger quand les filtres changent
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      chargerFilieres();
    }
  }, [searchTerm, selectedStatus, selectedVague]);

  const openModal = (filiere: Filiere) => {
    setSelectedFiliere(filiere);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedFiliere(null);
    setIsModalOpen(false);
  };

  // Filtrage et tri CORRIGÉ
  const filteredFilieres = filieres
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === undefined || bValue === undefined) return 0;

      // CORRECTION: Gestion spéciale pour le champ duration (string)
      if (sortField === "duration") {
        const extractNumber = (str: string): number => {
          const match = str.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        };
        
        const aNum = extractNumber(a.duration);
        const bNum = extractNumber(b.duration);
        
        return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

  const handleSort = (field: keyof Filiere) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getUniqueVagues = () => {
    return ["Toutes les vagues", ...vaguesDisponibles];
  };

  // État de chargement avec skeleton
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
        <div className="p-6 space-y-6 h-full overflow-y-auto">
          {/* Header Skeleton */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>

          {/* Statistiques Skeleton */}
          <StatsSkeleton />

          {/* Statistiques supplémentaires Skeleton */}
          <AdditionalStatsSkeleton />

          {/* Filtres Skeleton */}
          <FiltersSkeleton />

          {/* Tableau Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {[...Array(6)].map((_, index) => (
                      <TableHead key={index}>
                        <Skeleton className="h-4 w-20" />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, index) => (
                    <TableRowSkeleton key={index} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const userRole = user?.publicMetadata?.role as string;
  if (userRole !== "Administrateur") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Accès Refusé</CardTitle>
            <CardDescription className="text-gray-600">
              Vous n&apos;avez pas les permissions d&apos;administrateur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/")}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Retour à l&apos;accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <div className="p-6 space-y-6 h-full overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Filières</h1>
            <p className="text-gray-600 mt-2">
              Consultation des filières et de leurs modules d&apos;enseignement.
            </p>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Filières</CardTitle>
              <FaGraduationCap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Filières créées</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Filières Actives</CardTitle>
              <FaLayerGroup className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">En cours d&apos;enseignement</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Modules Total</CardTitle>
              <FaBook className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalModules}</div>
              <p className="text-xs text-muted-foreground">Modules enseignés</p>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques supplémentaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Étudiants Actifs</CardTitle>
              <FaUsers className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEtudiants}</div>
              <p className="text-xs text-muted-foreground">Étudiants en formation</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Formateurs</CardTitle>
              <FaChalkboardTeacher className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFormateurs}</div>
              <p className="text-xs text-muted-foreground">Enseignants actifs</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtres et Recherche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher une filière..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="inactive">Inactives</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedVague} onValueChange={setSelectedVague}>
                <SelectTrigger>
                  <SelectValue placeholder="Vague" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les vagues</SelectItem>
                  {getUniqueVagues().map((vague, index) => (
                    <SelectItem key={index} value={vague}>
                      {vague}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des filières */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Filières</CardTitle>
            <CardDescription>
              {filteredFilieres.length} filière(s) trouvée(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-2">
                      Filière
                      <FaSort className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead 
                    className="cursor-pointer text-center"
                    onClick={() => handleSort("totalModules")}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      Modules
                      <FaSort className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer text-center"
                    onClick={() => handleSort("duration")}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      Durée
                      <FaSort className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer text-center"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      Statut
                      <FaSort className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFilieres.map((filiere) => (
                  <TableRow key={filiere.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{filiere.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Créé le {new Date(filiere.createdAt).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm line-clamp-2">{filiere.description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">
                        {filiere.totalModules}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-medium">{filiere.duration}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        className={
                          filiere.status === "active" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {filiere.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openModal(filiere)}
                        >
                          <FaEye className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredFilieres.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FaGraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune filière trouvée avec les critères sélectionnés.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de détail de la filière */}
        {isModalOpen && selectedFiliere && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* En-tête du modal */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedFiliere.name}</h2>
                    </div>
                  </div>
                  <Button className="w-24" variant="outline" onClick={closeModal}>
                    Fermer
                  </Button>
                </div>

                {/* Informations générales */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Informations Générales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Durée de formation</p>
                        <p className="text-2xl font-bold text-blue-600 mt-2">{selectedFiliere.duration}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Nombre de modules</p>
                        <p className="text-2xl font-bold text-green-600 mt-2">{selectedFiliere.totalModules}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Statut</p>
                        <div className="mt-2">
                          <Badge 
                            className={
                              selectedFiliere.status === "active" 
                                ? "bg-green-100 text-green-800 text-lg py-2 px-4" 
                                : "bg-gray-100 text-gray-800 text-lg py-2 px-4"
                            }
                          >
                            {selectedFiliere.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Étudiants actifs</p>
                        <p className="text-lg font-semibold mt-1">{selectedFiliere.statistiques.totalEtudiants}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Formateurs</p>
                        <p className="text-lg font-semibold mt-1">{selectedFiliere.statistiques.totalFormateurs}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Semestres</p>
                        <p className="text-lg font-semibold mt-1">{selectedFiliere.statistiques.totalSemestres}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Modules */}
                <Card>
                  <CardHeader>
                    <CardTitle>Modules ({selectedFiliere.modules.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedFiliere.modules.map((module) => (
                        <div key={module.id} className="p-4 border rounded-lg bg-gray-50">
                          <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-lg">{module.name}</h4>
                                {module.description && (
                                  <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                                )}
                              </div>
                              <Badge variant="outline" className="font-mono">
                                coefficient {module.coefficient}
                              </Badge>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 text-sm">
                              <Badge variant="secondary">{module.typeModule}</Badge>
                              {module.semestre && (
                                <Badge variant="outline">Semestre {module.semestre}</Badge>
                              )}
                              {module.vagues.map((vague, index) => (
                                <Badge key={index} variant="outline" className="bg-blue-50">
                                  {vague}
                                </Badge>
                              ))}
                            </div>

                            {module.enseignants.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Enseignants:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {module.enseignants.map((enseignant) => (
                                    <Badge key={enseignant.id} variant="secondary" className="text-xs">
                                      {enseignant.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFilieresPage;