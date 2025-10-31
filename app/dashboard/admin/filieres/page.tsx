// app/dashboard/admin/filieres/page.tsx
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
  FaClock
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types
interface Module {
  id: string;
  name: string;
  coefficient: number;
  vague: string;
}

interface Filiere {
  id: string;
  name: string;
  description: string;
  duration: number;
  totalModules: number;
  status: "active" | "inactive";
  modules: Module[];
  createdAt: string;
}

const AdminFilieresPage = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedVague, setSelectedVague] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Filiere>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Modal "Voir" état
  const [selectedFiliere, setSelectedFiliere] = useState<Filiere | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (filiere: Filiere) => {
    setSelectedFiliere(filiere);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedFiliere(null);
    setIsModalOpen(false);
  };

  // Vérification du rôle admin
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const userRole = user?.publicMetadata?.role as string;
      if (userRole !== "Administrateur") {
        router.push("/unauthorized");
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Données simulées
  useEffect(() => {
    const mockFilieres: Filiere[] = [
      {
        id: "1",
        name: "Informatique",
        description: "Formation en développement logiciel et technologies de l'information",
        duration: 3,
        totalModules: 4,
        status: "active",
        createdAt: "2024-01-15",
        modules: [
          { id: "m1", name: "Programmation Java", coefficient: 4, vague: "Vague 2024 A" },
          { id: "m2", name: "Base de données", coefficient: 3, vague: "Vague 2024 A" },
          { id: "m3", name: "Réseaux informatiques", coefficient: 3, vague: "Vague 2024 B" },
          { id: "m4", name: "Développement Web", coefficient: 4, vague: "Vague 2024 B" }
        ]
      },
      {
        id: "2",
        name: "Mathématiques",
        description: "Formation approfondie en mathématiques fondamentales et appliquées",
        duration: 3,
        totalModules: 3,
        status: "active",
        createdAt: "2024-02-10",
        modules: [
          { id: "m5", name: "Algèbre avancée", coefficient: 4, vague: "Vague 2024 A" },
          { id: "m6", name: "Analyse complexe", coefficient: 4, vague: "Vague 2024 A" },
          { id: "m7", name: "Probabilités et statistiques", coefficient: 3, vague: "Vague 2024 C" }
        ]
      },
      {
        id: "3",
        name: "Physique-Chimie",
        description: "Formation en physique fondamentale et chimie appliquée",
        duration: 3,
        totalModules: 2,
        status: "inactive",
        createdAt: "2024-03-05",
        modules: [
          { id: "m8", name: "Mécanique quantique", coefficient: 5, vague: "Vague 2024 A" },
          { id: "m9", name: "Chimie organique", coefficient: 4, vague: "Vague 2024 B" }
        ]
      }
    ];

    setFilieres(mockFilieres);
  }, []);

  // Filtrage et tri
  const filteredFilieres = filieres
    .filter(filiere => {
      const matchesSearch =
        filiere.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        filiere.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === "all" || filiere.status === selectedStatus;

      const matchesVague = selectedVague === "all" || 
        filiere.modules.some(module => module.vague === selectedVague);

      return matchesSearch && matchesStatus && matchesVague;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === undefined || bValue === undefined) return 0;

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
    const vagues = new Set<string>();
    filieres.forEach(filiere => {
      filiere.modules.forEach(module => vagues.add(module.vague));
    });
    return Array.from(vagues);
  };

  const getStats = () => {
    const total = filieres.length;
    const active = filieres.filter(f => f.status === "active").length;
    const inactive = filieres.filter(f => f.status === "inactive").length;
    const totalModules = filieres.reduce((acc, filiere) => acc + filiere.totalModules, 0);
    
    return { total, active, inactive, totalModules };
  };

  const stats = getStats();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Chargement de vos informations...</div>
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
      <div className="p-6 space-y-6 h-full overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Durée Moyenne</CardTitle>
              <FaClock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3 ans</div>
              <p className="text-xs text-muted-foreground">Cycle de formation</p>
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
                        <span className="text-sm text-gray-500">ans</span>
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
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaGraduationCap className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedFiliere.name}</h2>
                    </div>
                  </div>
                  <Button variant="outline" onClick={closeModal}>
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
                        <p className="text-2xl font-bold text-blue-600 mt-2">{selectedFiliere.duration} ans</p>
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
                  </CardContent>
                </Card>

                {/* Modules */}
                <Card>
                  <CardHeader>
                    <CardTitle>Modules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedFiliere.modules.map((module) => (
                        <div key={module.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">{module.name}</span>
                            <div className="text-sm text-gray-500 mt-1">{module.vague}</div>
                          </div>
                          <Badge variant="outline" className="font-mono">
                            coefficient {module.coefficient}
                          </Badge>
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