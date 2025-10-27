// app/dashboard/admin/teachers/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FaChalkboardTeacher, 
  FaPlus, 
  FaSearch, 
  FaFilter,
  FaEdit,
  FaTrash,
  FaEye,
  FaSort,
  FaUsers,
  FaLayerGroup,
  FaBook,
  FaClock,
  FaCheckCircle
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types pour les données
interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vagues: string[];
  subjects: string[];
  classes: string[];
  status: "pending" | "active" | "inactive";
  createdAt: string;
}

interface Vague {
  id: string;
  name: string;
  year: string;
}

const TeachersManagement = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [vagues, setVagues] = useState<Vague[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVague, setSelectedVague] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Teacher>("lastName");
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

  // Simulation des données
  useEffect(() => {
    // Données simulées pour les professeurs
    const mockTeachers: Teacher[] = [
      {
        id: "1",
        firstName: "Jean",
        lastName: "Dupont",
        email: "jean.dupont@schoolflow.com",
        phone: "+225 07 12 34 56 78",
        vagues: ["Vague 2024 A", "Vague 2024 B"],
        subjects: ["Mathématiques", "Physique"],
        classes: ["Terminale S1", "Première S2"],
        status: "active",
        createdAt: "2024-01-15"
      },
      {
        id: "2",
        firstName: "Marie",
        lastName: "Martin",
        email: "marie.martin@schoolflow.com",
        phone: "+225 05 98 76 54 32",
        vagues: ["Vague 2024 A"],
        subjects: ["Français", "Philosophie"],
        classes: ["Terminale L1", "Première L2"],
        status: "active",
        createdAt: "2024-02-20"
      },
      {
        id: "3",
        firstName: "Pierre",
        lastName: "Durand",
        email: "pierre.durand@schoolflow.com",
        phone: "+225 01 23 45 67 89",
        vagues: [],  // ← En attente d'assignation
        subjects: [], // ← En attente d'assignation
        classes: [],  // ← En attente d'assignation
        status: "pending",
        createdAt: "2024-03-10"
      }
    ];

    const mockVagues: Vague[] = [
      { id: "1", name: "Vague 2024 A", year: "2024" },
      { id: "2", name: "Vague 2024 B", year: "2024" },
      { id: "3", name: "Vague 2024 C", year: "2024" }
    ];

    setTeachers(mockTeachers);
    setVagues(mockVagues);
  }, []);

  // Filtrage et tri des données
  const filteredTeachers = teachers
    .filter(teacher => {
      const matchesSearch = 
        teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesVague = selectedVague === "all" || 
        teacher.vagues.some(vague => vague.includes(selectedVague));
      
      const matchesStatus = selectedStatus === "all" || teacher.status === selectedStatus;
      
      return matchesSearch && matchesVague && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return 0;
    });

  const handleSort = (field: keyof Teacher) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusStats = () => {
    const active = teachers.filter(t => t.status === "active").length;
    const pending = teachers.filter(t => t.status === "pending").length;
    const inactive = teachers.filter(t => t.status === "inactive").length;
    
    return { active, pending, inactive };
  };

  const stats = getStatusStats();

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Chargement de vos informations...</div>
      </div>
    );
  }

  // Vérification finale du rôle
  const userRole = user?.publicMetadata?.role;
  if (userRole !== "Administrateur") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès Refusé</h1>
          <p className="text-gray-600 mb-4">Vous n'avez pas les permissions d'administrateur.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 space-y-6 h-full overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
        
        {/* En-tête */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Professeurs</h1>
            <p className="text-gray-600 mt-2">
              Créez les comptes professeurs - Le censeur assignera les vagues et matières.
            </p>
          </div>
          <Link href="/auth/signup">
            <Button className="bg-principal hover:bg-principal/90">
              <FaPlus className="mr-2 h-4 w-4" />
              Ajouter un Professeur
            </Button>
          </Link>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Professeurs</CardTitle>
              <FaUsers className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachers.length}</div>
              <p className="text-xs text-muted-foreground">Comptes créés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actifs</CardTitle>
              <FaCheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Assignés et actifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              <FaClock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">En attente d'assignation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vagues Actives</CardTitle>
              <FaLayerGroup className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vagues.length}</div>
              <p className="text-xs text-muted-foreground">Vagues disponibles</p>
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
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un professeur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedVague} onValueChange={setSelectedVague}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par vague" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les vagues</SelectItem>
                  {vagues.map(vague => (
                    <SelectItem key={vague.id} value={vague.name}>
                      {vague.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setSelectedVague("all");
                setSelectedStatus("all");
              }}>
                <FaFilter className="mr-2 h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des professeurs */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Professeurs</CardTitle>
            <CardDescription>
              {filteredTeachers.length} professeur(s) trouvé(s) - Les assignations sont gérées par le censeur
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
                      Nom
                      <FaSort className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Vagues Assignées</TableHead>
                  <TableHead>Matières</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-2">
                      Statut
                      <FaSort className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium">
                      {teacher.firstName} {teacher.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{teacher.email}</div>
                        <div className="text-xs text-muted-foreground">{teacher.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {teacher.vagues.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {teacher.vagues.map((vague, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {vague}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                          En attente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {teacher.subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects.map((subject, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                          À assigner
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {teacher.classes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {teacher.classes.map((classe, index) => (
                            <Badge key={index} variant="outline" className="text-xs bg-blue-50">
                              {classe}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                          À assigner
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          teacher.status === "active" ? "default" : 
                          teacher.status === "pending" ? "secondary" : "outline"
                        }
                        className={
                          teacher.status === "active" ? "bg-green-100 text-green-800" :
                          teacher.status === "pending" ? "bg-amber-100 text-amber-800" :
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        {teacher.status === "active" ? "Actif" : 
                         teacher.status === "pending" ? "En attente" : "Inactif"}
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

            {filteredTeachers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FaChalkboardTeacher className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun professeur trouvé avec les critères sélectionnés.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeachersManagement;