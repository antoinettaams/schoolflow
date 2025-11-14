// app/dashboard/admin/parents/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FaSearch,
  FaSort,
  FaEye,
  FaTrash,
  FaUsers,
  FaLayerGroup,
  FaPlus,
  FaPhone,
  FaEnvelope, 
  FaUserGraduate,
  FaSchool,
  FaCalendarAlt,
  FaSync,
  FaExclamationTriangle,
  FaFilter,
  FaGraduationCap
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types basés sur votre schéma Prisma
interface Enfant {
  id: string;
  firstName: string;
  lastName: string;
  filiere: string;
  studentNumber: string;
}

interface Parent {
  id: string;
  clerkUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "actif" | "inactif" | "suspendu";
  vagues: string[];
  enfants: Enfant[];
  createdAt: string;
}

interface ApiResponse {
  parents: Parent[];
  total: number;
  stats: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
  };
  filters: {
    vagues: Array<{ id: string; name: string }>;
    filieres?: Array<{ id: string; name: string }>;
  };
}

interface Filters {
  search: string;
  status: string;
  vague: string;
  filiere: string;
}

// Composant Skeleton pour le chargement
const SkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <div className="p-6 space-y-6">
        
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Statistiques Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filtres Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tableau Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-56 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* En-tête du tableau */}
              <div className="grid grid-cols-7 gap-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-6 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
              
              {/* Lignes du tableau */}
              {[...Array(5)].map((_, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-7 gap-4">
                  {[...Array(7)].map((_, colIndex) => (
                    <div 
                      key={colIndex} 
                      className={`h-12 bg-gray-200 rounded animate-pulse ${
                        colIndex === 6 ? 'w-20' : ''
                      }`}
                    ></div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Composant Skeleton pour les lignes du tableau
const TableRowSkeleton = () => {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-2">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </TableCell>
      <TableCell>
        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div>
      </TableCell>
      <TableCell>
        <div className="flex gap-2 justify-center">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </TableCell>
    </TableRow>
  );
};

const AdminParentsPage = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: "all",
    vague: "all",
    filiere: "all"
  });
  const [stats, setStats] = useState<any>({});
  const [availableFilters, setAvailableFilters] = useState<any>({
    vagues: [],
    filieres: []
  });
  const [sortField, setSortField] = useState<keyof Parent>("lastName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Modal "Voir" état
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal suppression état
  const [parentToDelete, setParentToDelete] = useState<Parent | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Charger les données depuis l'API
  const fetchParents = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.vague !== "all") params.append("vague", filters.vague);
      if (filters.filiere !== "all") params.append("filiere", filters.filiere);

      console.log("🔍 Fetching parents with params:", Object.fromEntries(params));

      const response = await fetch(`/api/admin/parents?${params}`);

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des parents");
      }

      const data: ApiResponse = await response.json();
      
      console.log("📊 Données reçues:", {
        totalParents: data.parents.length,
        firstParent: data.parents[0] ? {
          name: `${data.parents[0].firstName} ${data.parents[0].lastName}`,
          phone: data.parents[0].phone,
          enfants: data.parents[0].enfants.length
        } : 'Aucun parent',
        stats: data.stats,
        filters: data.filters
      });

      setParents(data.parents);
      setStats(data.stats);
      setAvailableFilters(data.filters);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un parent
  const deleteParent = async (parentId: string, clerkUserId?: string) => {
    try {
      setDeleting(parentId);
      
      const response = await fetch("/api/admin/parents", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parentId, clerkUserId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      // Mettre à jour la liste localement
      setParents(prev => prev.filter(parent => parent.id !== parentId));
      closeDeleteModal();
      
      // Recharger les données pour mettre à jour les stats
      await fetchParents();
      
    } catch (err) {
      console.error("Erreur suppression:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setDeleting(null);
    }
  };

  // Vérification du rôle admin
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const userRole = user?.publicMetadata?.role as string;
      if (userRole !== "Administrateur") {
        router.push("/unauthorized");
      } else {
        fetchParents();
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Recharger quand les filtres changent
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchParents();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Gestion des filtres
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      vague: "all",
      filiere: "all"
    });
  };

  // Fonctions modals
  const openModal = (parent: Parent) => {
    setSelectedParent(parent);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedParent(null);
    setIsModalOpen(false);
  };

  const openDeleteModal = (parent: Parent) => {
    setParentToDelete(parent);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setParentToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleSort = (field: keyof Parent) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Extraire les filières uniques des enfants
  const getUniqueFilieres = (): string[] => {
    const allFilieres = parents.flatMap(parent => 
      parent.enfants.map(enfant => enfant.filiere)
    );
    return Array.from(new Set(allFilieres)).filter(filiere => filiere && filiere !== "Non assigné");
  };

  // Filtrage et tri côté client pour réactivité
  const filteredParents = parents
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === undefined || bValue === undefined) return 0;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });

  // Afficher le skeleton pendant le chargement initial
  if (!isLoaded || loading) {
    return <SkeletonLoader />;
  }

  if (!isSignedIn) {
    router.push("/sign-in");
    return null;
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

  const filieresUniques = getUniqueFilieres();

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <div className="p-6 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Parents</h1>
            <p className="text-gray-600 mt-2">
              {loading ? "Chargement..." : `${stats.total || 0} parent(s) trouvé(s)`}
            </p>
          </div>
          <div className="flex sm:flex flex-col gap-2">
            <Button 
              variant="outline" 
              onClick={fetchParents}
              disabled={loading}
            >
              <FaSync className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
            <Link href="/auth/signup">
              <Button className="bg-principal text-white hover:bg-principal/90">
                <FaPlus className="mr-2 h-4 w-4" />
                Ajouter un Parent
              </Button>
            </Link>
          </div>
        </div>

        {/* Affichage erreur */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <FaExclamationTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Parents</CardTitle>
              <FaUsers className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                Tous les parents inscrits
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parents Actifs</CardTitle>
              <FaUsers className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active || 0}</div>
              <p className="text-xs text-muted-foreground">
                Comptes actifs
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parents Inactifs</CardTitle>
              <FaUsers className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.inactive || 0}</div>
              <p className="text-xs text-muted-foreground">
                Comptes inactifs
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parents Suspendus</CardTitle>
              <FaUsers className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.suspended || 0}</div>
              <p className="text-xs text-muted-foreground">
                Comptes suspendus
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaFilter className="h-5 w-5" />
              Filtres Avancés
            </CardTitle>
            <CardDescription className="mt-4">
              Filtrez les parents par recherche, statut, vague ou filière
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Recherche */}
              <div className="mt-8 relative lg:col-span-2">
                <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un parent..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtre Vague */}
              <div>
                <label className="text-sm font-medium mb-2 block">Vague</label>
                <Select value={filters.vague} onValueChange={(value) => handleFilterChange("vague", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les vagues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les vagues</SelectItem>
                    {availableFilters.vagues?.map((vague: any) => (
                      <SelectItem key={vague.id} value={vague.id}>
                        {vague.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Filière */}
              <div>
                <label className="text-sm font-medium mb-2 block">Filière</label>
                <Select value={filters.filiere} onValueChange={(value) => handleFilterChange("filiere", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les filières" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les filières</SelectItem>
                    {filieresUniques.map((filiere) => (
                      <SelectItem key={filiere} value={filiere}>
                        {filiere}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Statut */}
              <div>
                <label className="text-sm font-medium mb-2 block">Statut</label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="actif">Actifs</SelectItem>
                    <SelectItem value="inactif">Inactifs</SelectItem>
                    <SelectItem value="suspendu">Suspendus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Boutons d'action filtres */}
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                {filteredParents.length} parent(s) correspondant aux critères
              </div>
              <Button 
                variant="outline" 
                onClick={clearFilters}
                disabled={filters.search === "" && filters.status === "all" && filters.vague === "all" && filters.filiere === "all"}
              >
                Effacer les filtres
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Indicateurs de filtres actifs */}
        {(filters.search !== "" || filters.status !== "all" || filters.vague !== "all" || filters.filiere !== "all") && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-blue-800">Filtres actifs:</span>
                
                {filters.search && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Recherche: "{filters.search}"
                  </Badge>
                )}
                
                {filters.status !== "all" && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Statut: {filters.status}
                  </Badge>
                )}
                
                {filters.vague !== "all" && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Vague: {filters.vague}
                  </Badge>
                )}
                
                {filters.filiere !== "all" && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Filière: {filters.filiere}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tableau */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Parents</CardTitle>
            <CardDescription>
              {filteredParents.length} parent(s) trouvé(s) - Vue administrative complète
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <TableRowSkeleton key={index} />
                ))}
              </div>
            ) : filteredParents.length === 0 ? (
              <div className="text-center py-8">
                <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun parent trouvé</h3>
                <p className="mt-2 text-gray-600">
                  {filters.search !== "" || filters.status !== "all" || filters.vague !== "all" || filters.filiere !== "all"
                    ? "Aucun parent ne correspond à vos critères de recherche." 
                    : "Aucun parent n'est inscrit pour le moment."}
                </p>
                {(filters.search !== "" || filters.status !== "all" || filters.vague !== "all" || filters.filiere !== "all") && (
                  <Button onClick={clearFilters} variant="outline" className="mt-4">
                    Effacer les filtres
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort("lastName")}
                    >
                      <div className="flex items-center gap-2">
                        Parent
                        <FaSort className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Enfants</TableHead>
                    <TableHead>Filières</TableHead>
                    <TableHead>Vagues</TableHead>
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
                  {filteredParents.map((parent) => (
                    <TableRow key={parent.id}>
                      <TableCell className="font-medium">
                        {parent.firstName} {parent.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <FaEnvelope className="h-3 w-3 text-gray-400" />
                            {parent.email}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <FaPhone className="h-3 w-3 text-gray-400" />
                            {parent.phone || "Non renseigné"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {parent.enfants.length} enfant(s)
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {parent.enfants.map(e => e.firstName).join(', ')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {[...new Set(parent.enfants.map(e => e.filiere))].map((filiere, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-purple-50">
                              <FaGraduationCap className="h-2 w-2 mr-1" />
                              {filiere}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {parent.vagues.map((vague, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <FaLayerGroup className="h-2 w-2 mr-1" />
                              {vague}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={
                            parent.status === "actif" ? "default" : 
                            parent.status === "inactif" ? "secondary" : "destructive"
                          }
                          className={
                            parent.status === "actif" ? "bg-green-100 text-green-800" :
                            parent.status === "inactif" ? "bg-gray-100 text-gray-800" :
                            "bg-red-100 text-red-800"
                          }
                        >
                          {parent.status === "actif" ? "Actif" : 
                           parent.status === "inactif" ? "Inactif" : "Suspendu"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openModal(parent)}
                          >
                            <FaEye className="h-3 w-3" />
                          </Button>
                          <Button 
                            className="bg-red-500 text-white"
                            variant="destructive" 
                            size="sm" 
                            onClick={() => openDeleteModal(parent)}
                            disabled={deleting === parent.id}
                          >
                            <FaTrash className={`h-3 w-3 ${deleting === parent.id ? "animate-spin" : ""}`} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modal de détail du parent */}
        {isModalOpen && selectedParent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* En-tête du modal */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedParent.firstName} {selectedParent.lastName}
                      </h2>
                      <p className="text-gray-600">Parent d'élève(s)</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={closeModal}>
                    Fermer
                  </Button>
                </div>

                {/* Grille d'informations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  
                  {/* Informations du parent */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        Informations du Parent
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <FaEnvelope className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-gray-600">{selectedParent.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaPhone className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Téléphone</p>
                          <p className="text-sm text-gray-600">{selectedParent.phone || "Non renseigné"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Statut</p>
                        <Badge 
                          className={
                            selectedParent.status === "actif" ? "bg-green-100 text-green-800" :
                            selectedParent.status === "inactif" ? "bg-gray-100 text-gray-800" :
                            "bg-red-100 text-red-800"
                          }
                        >
                          {selectedParent.status === "actif" ? "Actif" : 
                           selectedParent.status === "inactif" ? "Inactif" : "Suspendu"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Vagues</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedParent.vagues.map((vague, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {vague}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Informations des enfants */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FaUserGraduate className="h-4 w-4" />
                        Enfant(s) Inscrit(s)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedParent.enfants.map((enfant) => (
                          <div key={enfant.id} className="p-3 border rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                              <FaUserGraduate className="h-4 w-4 text-blue-500" />
                              <div>
                                <p className="font-medium">
                                  {enfant.firstName} {enfant.lastName}
                                </p>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {enfant.studentNumber}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaSchool className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-600">{enfant.filiere}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Informations de date */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <FaCalendarAlt className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      Compte créé le {new Date(selectedParent.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Modal suppression */}
        {isDeleteModalOpen && parentToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-red-600 mb-4">Confirmer la suppression</h2>
              <p className="mb-6">
                Êtes-vous sûr de vouloir supprimer {parentToDelete.firstName} {parentToDelete.lastName} ? 
                Cette action est irréversible.
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={closeDeleteModal}>
                  Annuler
                </Button>
                <Button 
                  className="bg-red-500 text-white" 
                  variant="destructive" 
                  onClick={() => deleteParent(parentToDelete.id, parentToDelete.clerkUserId)}
                  disabled={deleting === parentToDelete.id}
                >
                  {deleting === parentToDelete.id ? "Suppression..." : "Supprimer"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminParentsPage;