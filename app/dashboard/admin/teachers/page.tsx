// app/dashboard/admin/teachers/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  FaChalkboardTeacher,
  FaEye,
  FaSort,
  FaUsers,
  FaLayerGroup,
  FaClock,
  FaCheckCircle,
  FaTrash,
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Types
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
  const [searchTerm] = useState("");
  const [selectedVague] = useState<string>("all");
  const [selectedStatus] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Teacher>("lastName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  // Vérification rôle admin
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
    const mockTeachers: Teacher[] = [
      {
        id: "1",
        firstName: "Jean",
        lastName: "Dupont",
        email: "jean.dupont@schoolflow.com",
        phone: "+225 07 12 34 56 78",
        vagues: ["Vague 2024 A", "Vague 2024 B"],
        subjects: ["Électricité"],
        classes: ["Électricité Bâtiment"],
        status: "active",
        createdAt: "2024-01-15",
      },
      {
        id: "2",
        firstName: "Marie",
        lastName: "Martin",
        email: "marie.martin@schoolflow.com",
        phone: "+225 05 98 76 54 32",
        vagues: ["Vague 2024 A"],
        subjects: ["Informatique"],
        classes: ["Sécurité Information"],
        status: "active",
        createdAt: "2024-02-20",
      },
      {
        id: "3",
        firstName: "Pierre",
        lastName: "Durand",
        email: "pierre.durand@schoolflow.com",
        phone: "+225 01 23 45 67 89",
        vagues: [],
        subjects: [],
        classes: [],
        status: "pending",
        createdAt: "2024-03-10",
      },
    ];

    const mockVagues: Vague[] = [
      { id: "1", name: "Vague 2024 A", year: "2024" },
      { id: "2", name: "Vague 2024 B", year: "2024" },
      { id: "3", name: "Vague 2024 C", year: "2024" },
    ];

    setTeachers(mockTeachers);
    setVagues(mockVagues);
  }, []);

  // Filtrage et tri
  const filteredTeachers = teachers
    .filter((teacher) => {
      const matchesSearch =
        teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesVague =
        selectedVague === "all" || teacher.vagues.some((vague) => vague.includes(selectedVague));

      const matchesStatus = selectedStatus === "all" || teacher.status === selectedStatus;

      return matchesSearch && matchesVague && matchesStatus;
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

  const handleSort = (field: keyof Teacher) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusStats = () => {
    return {
      active: teachers.filter((t) => t.status === "active").length,
      pending: teachers.filter((t) => t.status === "pending").length,
      inactive: teachers.filter((t) => t.status === "inactive").length,
    };
  };

  const stats = getStatusStats();

  const handleDeleteTeacher = (id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    setTeacherToDelete(null);
  };

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
        <Card className="p-8 max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Accès Refusé</CardTitle>
            <CardDescription className="text-gray-600">
              Vous n'avez pas les permissions d'administrateur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="bg-blue-600 text-white hover:bg-blue-700">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <div className="p-6 space-y-6 h-full overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Professeurs</h1>
            <p className="text-gray-600 mt-2">
              Créez les comptes professeurs - Le censeur assignera les vagues et matières.
            </p>
          </div>
        </div>

        {/* STATISTIQUES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
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

        {/* TABLEAU */}
        <Card className="mt-6">
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
                  <TableHead className="cursor-pointer" onClick={() => handleSort("lastName")}>
                    <div className="flex items-center gap-2">
                      Nom
                      <FaSort className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Vagues Assignées</TableHead>
                  <TableHead>Matières</TableHead>
                  <TableHead>Classes</TableHead>
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
                          teacher.status === "active"
                            ? "default"
                            : teacher.status === "pending"
                            ? "secondary"
                            : "outline"
                        }
                        className={
                          teacher.status === "active"
                            ? "bg-green-100 text-green-800"
                            : teacher.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {teacher.status === "active"
                          ? "Actif"
                          : teacher.status === "pending"
                          ? "En attente"
                          : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTeacher(teacher)}
                        >
                          <FaEye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setTeacherToDelete(teacher)}
                        >
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

        {/* MODAL VUE PROFESSEUR */}
        {selectedTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <Card className="bg-white w-full max-w-md p-6 relative">
              <CardHeader>
                <CardTitle>
                  {selectedTeacher.firstName} {selectedTeacher.lastName}
                </CardTitle>
                <CardDescription>Détails du professeur</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p><strong>Email:</strong> {selectedTeacher.email}</p>
                <p><strong>Téléphone:</strong> {selectedTeacher.phone}</p>
                <p><strong>Vague:</strong> {selectedTeacher.vagues.join(", ") || "À assigner"}</p>
                <p><strong>Filière:</strong> {selectedTeacher.classes.join(", ") || "À assigner"}</p>
                <p><strong>Matières:</strong> {selectedTeacher.subjects.join(", ") || "À assigner"}</p>
              </CardContent>
              <Button
                className="absolute top-2 right-2"
                onClick={() => setSelectedTeacher(null)}
              >
                Fermer
              </Button>
            </Card>
          </div>
        )}

        {/* MODAL SUPPRESSION */}
        {teacherToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <Card className="bg-white w-full max-w-md p-6 relative">
              <CardHeader>
                <CardTitle>Confirmer la suppression</CardTitle>
                <CardDescription>
                  Voulez-vous vraiment supprimer {teacherToDelete.firstName} {teacherToDelete.lastName} ?
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setTeacherToDelete(null)}>
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteTeacher(teacherToDelete.id)}
                >
                  Supprimer
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeachersManagement;
