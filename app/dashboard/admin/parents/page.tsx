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
  FaEdit,
  FaTrash,
  FaUsers,
  FaLayerGroup,
  FaPlus
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types pour les parents
interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "actif" | "inactif" | "suspendu";
  vagues: string[];
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

  // Vérification du rôle admin
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const userRole = user?.publicMetadata?.role;
      if (userRole !== "Administrateur") {
        router.push("/unauthorized");
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Données simulées
  useEffect(() => {
    const mockParents: Parent[] = [
      { id: "1", firstName: "Jean", lastName: "Dupont", email: "jean.dupont@mail.com", phone: "+229 90 12 34 56", status: "actif", vagues: ["Vague 2024 A"], createdAt: "2024-01-15" },
      { id: "2", firstName: "Marie", lastName: "Lemoine", email: "marie.lemoine@mail.com", phone: "+229 91 23 45 67", status: "inactif", vagues: ["Vague 2024 B"], createdAt: "2024-02-10" },
      { id: "3", firstName: "Paul", lastName: "Martin", email: "paul.martin@mail.com", phone: "+229 92 34 56 78", status: "suspendu", vagues: ["Vague 2024 A"], createdAt: "2024-03-05" },
      { id: "4", firstName: "Sophie", lastName: "Bernard", email: "sophie.bernard@mail.com", phone: "+229 93 45 67 89", status: "actif", vagues: ["Vague 2024 C"], createdAt: "2024-04-20" }
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

  const userRole = user?.publicMetadata?.role;
  if (userRole !== "Administrateur") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès Refusé</h1>
          <p className="text-gray-600 mb-4">Vous n&apos;avez pas les permissions d&apos;administrateur.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retour à l&apos;accueil
          </button>
        </div>
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
                        <Button variant="outline" size="sm">
                          <FaEye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <FaEdit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
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
      </div>
    </div>
  );
};

export default AdminParentsPage;
