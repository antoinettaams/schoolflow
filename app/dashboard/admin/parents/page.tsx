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
  FaCalendarAlt
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types pour les parents
interface Enfant {
  id: string;
  firstName: string;
  lastName: string;
  filiere: string;
  studentNumber: string;
}

interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "actif" | "inactif" | "suspendu";
  vagues: string[];
  enfants: Enfant[];
  createdAt: string;
}

const AdminParentsPage = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [parents, setParents] = useState<Parent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedVague, setSelectedVague] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Parent>("lastName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Modal "Voir" état
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal suppression état
  const [parentToDelete, setParentToDelete] = useState<Parent | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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

  const handleDeleteParent = () => {
    if (parentToDelete) {
      setParents(prev => prev.filter(p => p.id !== parentToDelete.id));
      closeDeleteModal();
    }
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
    const mockParents: Parent[] = [
      { 
        id: "1", 
        firstName: "Jean", 
        lastName: "Dupont", 
        email: "jean.dupont@mail.com", 
        phone: "+229 90 12 34 56", 
        status: "actif", 
        vagues: ["Vague 2024 A"], 
        enfants: [
          { id: "e1", firstName: "Marie", lastName: "Dubois", filiere: "Informatique", studentNumber: "ETU-2024-001" },
          { id: "e2", firstName: "Pierre", lastName: "Dubois", filiere: "Mathématiques", studentNumber: "ETU-2024-002" }
        ],
        createdAt: "2024-01-15" 
      },
      { 
        id: "2", 
        firstName: "Marie", 
        lastName: "Lemoine", 
        email: "marie.lemoine@mail.com", 
        phone: "+229 91 23 45 67", 
        status: "inactif", 
        vagues: ["Vague 2024 B"], 
        enfants: [
          { id: "e3", firstName: "Sophie", lastName: "Lemoine", filiere: "Physique", studentNumber: "ETU-2024-003" }
        ],
        createdAt: "2024-02-10" 
      },
      { 
        id: "3", 
        firstName: "Paul", 
        lastName: "Martin", 
        email: "paul.martin@mail.com", 
        phone: "+229 92 34 56 78", 
        status: "suspendu", 
        vagues: ["Vague 2024 A"], 
        enfants: [
          { id: "e4", firstName: "Luc", lastName: "Martin", filiere: "Chimie", studentNumber: "ETU-2024-004" },
          { id: "e5", firstName: "Emma", lastName: "Martin", filiere: "Biologie", studentNumber: "ETU-2024-005" }
        ],
        createdAt: "2024-03-05" 
      },
      { 
        id: "4", 
        firstName: "Sophie", 
        lastName: "Bernard", 
        email: "sophie.bernard@mail.com", 
        phone: "+229 93 45 67 89", 
        status: "actif", 
        vagues: ["Vague 2024 C"], 
        enfants: [
          { id: "e6", firstName: "Thomas", lastName: "Bernard", filiere: "Informatique", studentNumber: "ETU-2024-006" }
        ],
        createdAt: "2024-04-20" 
      }
    ];
    setParents(mockParents);
  }, []);

  // Tri et filtrage
  const filteredParents = parents
    .filter(parent => {
      const matchesSearch =
        parent.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.phone.includes(searchTerm);

      const matchesStatus = selectedStatus === "all" || parent.status === selectedStatus;
      const matchesVague = selectedVague === "all" || parent.vagues.includes(selectedVague);

      return matchesSearch && matchesStatus && matchesVague;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === undefined || bValue === undefined) return 0;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return 0;
    });

  const handleSort = (field: keyof Parent) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getUniqueVagues = () => {
    const vagues = new Set<string>();
    parents.forEach(parent => parent.vagues.forEach(v => vagues.add(v)));
    return Array.from(vagues);
  };

  const getStats = () => {
    const total = parents.length;
    const active = parents.filter(p => p.status === "actif").length;
    const inactive = parents.filter(p => p.status === "inactif").length;
    const suspended = parents.filter(p => p.status === "suspendu").length;
    return { total, active, inactive, suspended };
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
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Parents</h1>
            <p className="text-gray-600 mt-2">
              Vue d&apos;ensemble complète de tous les parents.
            </p>
          </div>
          <Link href="/auth/signup">
            <Button className="bg-principal hover:bg-principal/90">
              <FaPlus className="mr-2 h-4 w-4" />
              Ajouter un Parent
            </Button>
          </Link>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Parents</CardTitle>
              <FaUsers className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">{stats.active} actifs</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Statuts</CardTitle>
              <FaLayerGroup className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.inactive + stats.suspended}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.inactive} inactifs, {stats.suspended} suspendus
              </p>
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
                  placeholder="Rechercher un parent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedVague} onValueChange={setSelectedVague}>
                <SelectTrigger>
                  <SelectValue placeholder="Vague" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les vagues</SelectItem>
                  {getUniqueVagues().map(vague => (
                    <SelectItem key={vague} value={vague}>{vague}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="actif">Actifs</SelectItem>
                  <SelectItem value="inactif">Inactifs</SelectItem>
                  <SelectItem value="suspendu">Suspendus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tableau */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Parents</CardTitle>
            <CardDescription>
              {filteredParents.length} parent(s) trouvé(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                        <div className="text-sm">{parent.email}</div>
                        <div className="text-xs text-muted-foreground">{parent.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {parent.vagues.map(v => (
                          <Badge key={v} variant="outline">{v}</Badge>
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
                          variant="destructive" 
                          size="sm" 
                          onClick={() => openDeleteModal(parent)}
                        >
                          <FaTrash className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredParents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FaUsers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun parent trouvé avec les critères sélectionnés.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de détail du parent */}
        {isModalOpen && selectedParent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* En-tête du modal */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaUsers className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedParent.firstName} {selectedParent.lastName}
                      </h2>
                      <p className="text-gray-600">Parent d&apos;élève(s)</p>
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
                        <FaUsers className="h-4 w-4" />
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
                          <p className="text-sm text-gray-600">{selectedParent.phone}</p>
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
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={closeDeleteModal}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={handleDeleteParent}>
                  Supprimer
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