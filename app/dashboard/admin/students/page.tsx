// app/dashboard/admin/students/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FaUserGraduate, 
  FaSearch, 
  FaFilter,
  FaEye,
  FaEdit,
  FaTrash,
  FaSort,
  FaUsers,
  FaChartLine,
  FaBook,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaPlus,
  FaSchool,
  FaLayerGroup
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types pour les données
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  studentNumber: string;
  filiere: string;
  niveau: string;
  classe: string;
  vagues: string[];
  averageGrade: number;
  attendanceRate: number;
  status: "actif" | "inactif" | "suspendu";
  createdAt: string;
  lastActivity: string;
}

const AdminStudentsPage = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState<string>("all");
  const [selectedVague, setSelectedVague] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Student>("lastName");
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

  // Simulation des données des élèves
  useEffect(() => {
    const mockStudents: Student[] = [
      {
        id: "1",
        firstName: "Marie",
        lastName: "Dubois",
        email: "marie.dubois@student.com",
        phone: "+225 07 12 34 56 78",
        studentNumber: "ETU-2024-001",
        filiere: "Informatique",
        niveau: "Licence",
        classe: "Terminale S1",
        vagues: ["Vague 2024 A"],
        averageGrade: 15.2,
        attendanceRate: 95,
        status: "actif",
        createdAt: "2024-09-01",
        lastActivity: "2024-10-20"
      },
      {
        id: "2",
        firstName: "Pierre",
        lastName: "Martin",
        email: "pierre.martin@student.com",
        phone: "+225 05 98 76 54 32",
        studentNumber: "ETU-2024-002",
        filiere: "Mathématiques",
        niveau: "Licence",
        classe: "Terminale S1",
        vagues: ["Vague 2024 A"],
        averageGrade: 12.8,
        attendanceRate: 88,
        status: "actif",
        createdAt: "2024-09-01",
        lastActivity: "2024-10-19"
      },
      {
        id: "3",
        firstName: "Sophie",
        lastName: "Bernard",
        email: "sophie.bernard@student.com",
        phone: "+225 01 23 45 67 89",
        studentNumber: "ETU-2024-003",
        filiere: "Informatique",
        niveau: "Master",
        classe: "Première S2",
        vagues: ["Vague 2024 B"],
        averageGrade: 16.5,
        attendanceRate: 92,
        status: "actif",
        createdAt: "2024-09-15",
        lastActivity: "2024-10-21"
      },
      {
        id: "4",
        firstName: "Lucas",
        lastName: "Petit",
        email: "lucas.petit@student.com",
        phone: "+225 04 56 78 90 12",
        studentNumber: "ETU-2024-004",
        filiere: "Mathématiques",
        niveau: "Licence",
        classe: "Terminale S1",
        vagues: ["Vague 2024 A"],
        averageGrade: 9.8,
        attendanceRate: 75,
        status: "inactif",
        createdAt: "2024-09-01",
        lastActivity: "2024-10-15"
      },
      {
        id: "5",
        firstName: "Emma",
        lastName: "Robert",
        email: "emma.robert@student.com",
        phone: "+225 06 78 90 12 34",
        studentNumber: "ETU-2024-005",
        filiere: "Informatique",
        niveau: "Licence",
        classe: "Terminale S1",
        vagues: ["Vague 2024 A"],
        averageGrade: 14.3,
        attendanceRate: 98,
        status: "suspendu",
        createdAt: "2024-09-01",
        lastActivity: "2024-10-18"
      }
    ];

    setStudents(mockStudents);
  }, []);

  // Filtrage et tri des données
  const filteredStudents = students
    .filter(student => {
      const matchesSearch = 
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFiliere = selectedFiliere === "all" || student.filiere === selectedFiliere;
      const matchesVague = selectedVague === "all" || student.vagues.includes(selectedVague);
      const matchesStatus = selectedStatus === "all" || student.status === selectedStatus;
      
      return matchesSearch && matchesFiliere && matchesVague && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

  const handleSort = (field: keyof Student) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getUniqueValues = (field: keyof Student) => {
    const values = new Set(students.map(student => student[field]));
    return Array.from(values);
  };

  const getUniqueVagues = () => {
    const vagues = new Set<string>();
    students.forEach(student => {
      student.vagues.forEach(vague => vagues.add(vague));
    });
    return Array.from(vagues);
  };

  const getStats = () => {
    const total = students.length;
    const active = students.filter(s => s.status === "actif").length;
    const inactive = students.filter(s => s.status === "inactif").length;
    const suspended = students.filter(s => s.status === "suspendu").length;
    const averageGrade = students.reduce((acc, student) => acc + student.averageGrade, 0) / total;
    
    return { total, active, inactive, suspended, averageGrade: averageGrade || 0 };
  };

  const stats = getStats();

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
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Élèves</h1>
            <p className="text-gray-600 mt-2">
              Vue d'ensemble complète de tous les élèves de l'établissement.
            </p>
          </div>
          <Link href="/auth/signup">
            <Button className="bg-principal hover:bg-principal/90">
              <FaPlus className="mr-2 h-4 w-4" />
              Ajouter un Élève
            </Button>
          </Link>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Élèves</CardTitle>
              <FaUsers className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active} actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moyenne Générale</CardTitle>
              <FaChartLine className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.averageGrade.toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">/20 points</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Statuts</CardTitle>
              <FaSchool className="h-4 w-4 text-purple-500" />
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vagues Actives</CardTitle>
              <FaLayerGroup className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {getUniqueVagues().length}
              </div>
              <p className="text-xs text-muted-foreground">Vagues avec élèves</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtres et Recherche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative md:col-span-2">
                <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un élève..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                <SelectTrigger>
                  <SelectValue placeholder="Filière" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les filières</SelectItem>
                  {getUniqueValues("filiere").map(filiere => (
                    <SelectItem key={filiere} value={filiere}>
                      {filiere}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedVague} onValueChange={setSelectedVague}>
                <SelectTrigger>
                  <SelectValue placeholder="Vague" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les vagues</SelectItem>
                  {getUniqueVagues().map(vague => (
                    <SelectItem key={vague} value={vague}>
                      {vague}
                    </SelectItem>
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

        {/* Tableau des élèves */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Élèves</CardTitle>
            <CardDescription>
              {filteredStudents.length} élève(s) trouvé(s) - Vue administrative complète
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
                      Élève
                      <FaSort className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Informations Académiques</TableHead>
                  <TableHead 
                    className="cursor-pointer text-center"
                    onClick={() => handleSort("averageGrade")}
                  >
                    <div className="flex items-center gap-2 justify-center">
                      Performance
                      <FaSort className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Vagues</TableHead>
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
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{student.firstName} {student.lastName}</div>
                        <Badge variant="outline" className="font-mono text-xs mt-1">
                          {student.studentNumber}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{student.email}</div>
                        <div className="text-xs text-muted-foreground">{student.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{student.filiere}</div>
                        <div className="text-xs text-muted-foreground">
                          {student.niveau} • {student.classe}
                        </div>
                        <div className="text-xs text-gray-500">
                          Inscrit le {new Date(student.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-2">
                        <Badge 
                          variant="outline" 
                          className={
                            student.averageGrade >= 15 ? "bg-green-50 text-green-700 border-green-200" :
                            student.averageGrade >= 10 ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {student.averageGrade.toFixed(1)}/20
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {student.attendanceRate}% présence
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.vagues.map((vague, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {vague}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          student.status === "actif" ? "default" : 
                          student.status === "inactif" ? "secondary" : "destructive"
                        }
                        className={
                          student.status === "actif" ? "bg-green-100 text-green-800" :
                          student.status === "inactif" ? "bg-gray-100 text-gray-800" :
                          "bg-red-100 text-red-800"
                        }
                      >
                        {student.status === "actif" ? "Actif" : 
                         student.status === "inactif" ? "Inactif" : "Suspendu"}
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

            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FaUserGraduate className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun élève trouvé avec les critères sélectionnés.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStudentsPage;