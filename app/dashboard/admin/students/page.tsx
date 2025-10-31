// app/dashboard/admin/students/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaUserGraduate,
  FaSearch,
  FaEye,
  FaSort,
  FaUsers,
  FaChartLine,
  FaPlus,
  FaChartBar,
  FaTrash,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaSchool,
  FaBook,
  FaTrophy,
  FaCalendarAlt
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

// Types pour les données
interface Module {
  id: string;
  name: string;
  coefficient: number;
  grade: number;
  teacher: string;
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  studentNumber: string;
  filiere: string;
  vagues: string[];
  averageGrade: number;
  attendanceRate: number;
  status: "actif" | "inactif" | "suspendu";
  createdAt: string;
  lastActivity: string;
  modules: Module[];
  rank: number;
  totalStudents: number;
  anneeScolaire: string;
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

  // Modal "Voir" état
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal suppression état
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const openModal = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setIsModalOpen(false);
  };

  const openDeleteModal = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setStudentToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteStudent = () => {
    if (studentToDelete) {
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
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

  // Simulation des données des élèves avec modules détaillés
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
        vagues: ["Vague 2024 A"],
        averageGrade: 15.2,
        attendanceRate: 95,
        status: "actif",
        createdAt: "2024-09-01",
        lastActivity: "2024-10-20",
        modules: [
          { id: "m1", name: "Programmation Java", coefficient: 4, grade: 16.5, teacher: "Dr. Koné" },
          { id: "m2", name: "Base de données", coefficient: 3, grade: 14.0, teacher: "Prof. Traoré" },
          { id: "m3", name: "Réseaux", coefficient: 3, grade: 15.8, teacher: "Dr. Diarra" },
          { id: "m4", name: "Mathématiques", coefficient: 2, grade: 13.2, teacher: "Prof. Sylla" },
          { id: "m5", name: "Anglais technique", coefficient: 1, grade: 17.5, teacher: "Mme. Bamba" }
        ],
        rank: 2,
        totalStudents: 45,
        anneeScolaire: "2024-2025"
      },
      {
        id: "2",
        firstName: "Pierre",
        lastName: "Martin",
        email: "pierre.martin@student.com",
        phone: "+225 05 98 76 54 32",
        studentNumber: "ETU-2024-002",
        filiere: "Mathématiques",
        vagues: ["Vague 2024 A"],
        averageGrade: 12.8,
        attendanceRate: 88,
        status: "actif",
        createdAt: "2024-09-01",
        lastActivity: "2024-10-19",
        modules: [
          { id: "m1", name: "Algèbre avancée", coefficient: 4, grade: 13.5, teacher: "Dr. Konaté" },
          { id: "m2", name: "Analyse", coefficient: 4, grade: 11.0, teacher: "Prof. Keita" },
          { id: "m3", name: "Probabilités", coefficient: 3, grade: 14.2, teacher: "Dr. Coulibaly" },
          { id: "m4", name: "Statistiques", coefficient: 3, grade: 12.5, teacher: "Prof. Diallo" }
        ],
        rank: 15,
        totalStudents: 30,
        anneeScolaire: "2024-2025"
      },
      {
        id: "3",
        firstName: "Sophie",
        lastName: "Bernard",
        email: "sophie.bernard@student.com",
        phone: "+225 01 23 45 67 89",
        studentNumber: "ETU-2024-003",
        filiere: "Informatique",
        vagues: ["Vague 2024 B"],
        averageGrade: 16.5,
        attendanceRate: 92,
        status: "actif",
        createdAt: "2024-09-15",
        lastActivity: "2024-10-21",
        modules: [
          { id: "m1", name: "Intelligence Artificielle", coefficient: 5, grade: 17.2, teacher: "Dr. Traoré" },
          { id: "m2", name: "Machine Learning", coefficient: 4, grade: 16.8, teacher: "Prof. Koné" },
          { id: "m3", name: "Big Data", coefficient: 3, grade: 15.0, teacher: "Dr. Sy" },
          { id: "m4", name: "Cloud Computing", coefficient: 3, grade: 17.5, teacher: "Prof. Bamba" },
          { id: "m5", name: "Sécurité", coefficient: 2, grade: 16.0, teacher: "Dr. Diakité" }
        ],
        rank: 1,
        totalStudents: 25,
        anneeScolaire: "2024-2025"
      }
    ];

    setStudents(mockStudents);
  }, []);

  // Filtrage et tri
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

      if (aValue === undefined || bValue === undefined) return 0;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
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
    const values = students.map(student => student[field]);
    return Array.from(new Set(values.filter(value => value !== undefined && value !== null))) as string[];
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

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Chargement de vos informations...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Redirection vers la connexion...</div>
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
              Vous n'avez pas les permissions d'administrateur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/")}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <div className="p-6 space-y-6">
        {/* En-tête */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Élèves</h1>
            <p className="text-gray-600 mt-2">
              Vue d'ensemble complète de tous les élèves de l'établissement.
            </p>
          </div>
          <Link href="/auth/signup">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
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
              <FaUsers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Tous les élèves inscrits
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Élèves Actifs</CardTitle>
              <FaUserGraduate className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                En cours de formation
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moyenne Générale</CardTitle>
              <FaChartLine className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.averageGrade.toFixed(1)}/20
              </div>
              <p className="text-xs text-muted-foreground">
                Moyenne de tous les élèves
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de Présence</CardTitle>
              <FaChartBar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">92%</div>
              <p className="text-xs text-muted-foreground">
                Moyenne de présence
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
                  {getUniqueValues("filiere").map((filiere, index) => (
                    <SelectItem key={`filiere-${index}`} value={filiere}>
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
                  {getUniqueVagues().map((vague, index) => (
                    <SelectItem key={`vague-${index}`} value={vague}>
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
                  <TableHead className="cursor-pointer" onClick={() => handleSort("lastName")}>
                    <div className="flex items-center gap-2">
                      Élève
                      <FaSort className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Informations Académiques</TableHead>
                  <TableHead className="cursor-pointer text-center" onClick={() => handleSort("averageGrade")}>
                    <div className="flex items-center gap-2 justify-center">
                      Performance
                      <FaSort className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Vagues</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
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
                        <div className="text-xs text-gray-500">{student.anneeScolaire}</div>
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
                        <div className="text-xs text-muted-foreground">{student.attendanceRate}% présence</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.vagues.map((vague, index) => (
                          <Badge key={`vague-${student.id}-${index}`} variant="secondary" className="text-xs">
                            {vague}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
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
                        <Button variant="outline" size="sm" onClick={() => openModal(student)}>
                          <FaEye className="h-3 w-3" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => openDeleteModal(student)}>
                          <FaTrash className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal "Voir" */}
        {isModalOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* En-tête du modal */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaUserGraduate className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </h2>
                      <p className="text-gray-600">{selectedStudent.studentNumber}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={closeModal}>Fermer</Button>
                </div>

                {/* Première ligne - Informations principales */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  
                  {/* Informations personnelles */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FaIdCard className="h-4 w-4" />
                        Informations Personnelles
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <FaEnvelope className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-gray-600">{selectedStudent.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaPhone className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Téléphone</p>
                          <p className="text-sm text-gray-600">{selectedStudent.phone}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Statut</p>
                        <Badge 
                          className={
                            selectedStudent.status === "actif" ? "bg-green-100 text-green-800" :
                            selectedStudent.status === "inactif" ? "bg-gray-100 text-gray-800" :
                            "bg-red-100 text-red-800"
                          }
                        >
                          {selectedStudent.status === "actif" ? "Actif" : 
                           selectedStudent.status === "inactif" ? "Inactif" : "Suspendu"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Informations académiques */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FaSchool className="h-4 w-4" />
                        Informations Académiques
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium">Filière</p>
                        <p className="text-sm font-medium text-blue-600">{selectedStudent.filiere}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Année Scolaire</p>
                        <p className="text-sm font-medium text-green-600">{selectedStudent.anneeScolaire}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Vagues</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedStudent.vagues.map((vague, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {vague}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance générale */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FaChartBar className="h-4 w-4" />
                        Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600">
                          {selectedStudent.averageGrade.toFixed(1)}/20
                        </div>
                        <p className="text-sm text-gray-500">Moyenne Générale</p>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <FaTrophy className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">Rang</span>
                        </div>
                        <Badge variant="outline" className="text-sm">
                          {selectedStudent.rank}/{selectedStudent.totalStudents}
                        </Badge>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">Taux de présence</span>
                          <span>{selectedStudent.attendanceRate}%</span>
                        </div>
                        <Progress value={selectedStudent.attendanceRate} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Deuxième ligne - Détail des modules */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FaBook className="h-4 w-4" />
                      Détail des Modules et Notes
                    </CardTitle>
                    <CardDescription>
                      Performance détaillée par module avec coefficients
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/3">Module</TableHead>
                          <TableHead>Enseignant</TableHead>
                          <TableHead>Coefficient</TableHead>
                          <TableHead>Note</TableHead>
                          <TableHead>Appréciation</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedStudent.modules.map((module) => (
                          <TableRow key={module.id}>
                            <TableCell className="font-medium">{module.name}</TableCell>
                            <TableCell className="text-sm">{module.teacher}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {module.coefficient}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline"
                                className={
                                  module.grade >= 15 ? "bg-green-50 text-green-700 border-green-200" :
                                  module.grade >= 10 ? "bg-blue-50 text-blue-700 border-blue-200" :
                                  "bg-red-50 text-red-700 border-red-200"
                                }
                              >
                                {module.grade.toFixed(1)}/20
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className={
                                module.grade >= 15 ? "text-green-600 font-medium" :
                                module.grade >= 12 ? "text-blue-600" :
                                module.grade >= 10 ? "text-gray-600" :
                                "text-red-600"
                              }>
                                {module.grade >= 15 ? "Excellent" :
                                 module.grade >= 12 ? "Très bien" :
                                 module.grade >= 10 ? "Satisfaisant" :
                                 "Insuffisant"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Informations de dates en bas */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Inscrit le {new Date(selectedStudent.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaChartLine className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Dernière activité le {new Date(selectedStudent.lastActivity).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal suppression */}
        {isDeleteModalOpen && studentToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-red-600 mb-4">Confirmer la suppression</h2>
              <p className="mb-6">Êtes-vous sûr de vouloir supprimer {studentToDelete.firstName} {studentToDelete.lastName} ? Cette action est irréversible.</p>
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={closeDeleteModal}>Annuler</Button>
                <Button variant="destructive" onClick={handleDeleteStudent}>Supprimer</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStudentsPage;