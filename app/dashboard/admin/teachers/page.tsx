// app/dashboard/admin/teachers/page.tsx
"use client";
 
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaChalkboardTeacher,
  FaEye,
  FaSort,
  FaUsers,
  FaLayerGroup,
  FaClock,
  FaCheckCircle,
  FaTrash,
  FaPlus,
  FaSync,
} from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

// Types basés sur votre schéma Prisma
interface Teacher {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    createdAt: string;
    isActive: boolean;
  };
  matiere: string;
  enseignements: Array<{
    id: string;
    module: {
      nom: string;
      filiere: {
        nom: string;
      };
    };
    vague?: {
      nom: string;
    };
  }>;
  planningAssignations: Array<{
    id: string;
    vague: {
      nom: string;
    };
    filiere: {
      nom: string;
    };
    module: {
      nom: string;
    };
  }>;
}

interface ApiResponse {
  teachers: Teacher[];
  stats: {
    totalTeachers: number;
    activeTeachers: number;
    pendingTeachers: number;
    totalVagues: number;
  };
}

const TeachersManagement = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof any>("lastName");
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

  // Charger les données depuis l'API
  const loadTeachers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("🔄 Chargement des professeurs depuis l'API...");
      
      const response = await fetch('/api/admin/teachers');
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const data: ApiResponse = await response.json();
      
      console.log("✅ Données reçues:", data);
      setTeachers(data.teachers);
      
    } catch (error) {
      console.error('❌ Erreur chargement professeurs:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.publicMetadata?.role === "Administrateur") {
      loadTeachers();
    }
  }, [isLoaded, isSignedIn, user]);

  // CORRECTION : Fonction pour obtenir les vagues uniques d'un professeur
  const getTeacherVagues = (teacher: Teacher): string[] => {
    const vaguesFromAssignations = teacher.planningAssignations.map(pa => pa.vague?.nom).filter(Boolean) as string[];
    const vaguesFromEnseignements = teacher.enseignements
      .filter(e => e.vague?.nom) // CORRECTION : Vérifier si vague existe et a un nom
      .map(e => e.vague!.nom); // CORRECTION : Utiliser l'opérateur ! car on a filtré
    
    return [...new Set([...vaguesFromAssignations, ...vaguesFromEnseignements])];
  };

  // CORRECTION : Fonction pour obtenir les matières uniques d'un professeur
  const getTeacherSubjects = (teacher: Teacher): string[] => {
    const subjectsFromAssignations = teacher.planningAssignations.map(pa => pa.module.nom);
    const subjectsFromEnseignements = teacher.enseignements.map(e => e.module.nom);
    
    return [...new Set([...subjectsFromAssignations, ...subjectsFromEnseignements])];
  };

  // CORRECTION : Fonction pour obtenir les filières uniques d'un professeur
  const getTeacherFilieres = (teacher: Teacher): string[] => {
    const filieresFromAssignations = teacher.planningAssignations.map(pa => pa.filiere.nom);
    const filieresFromEnseignements = teacher.enseignements.map(e => e.module.filiere.nom);
    
    return [...new Set([...filieresFromAssignations, ...filieresFromEnseignements])];
  };

  // Fonction pour déterminer le statut
  const getTeacherStatus = (teacher: Teacher): "active" | "pending" => {
    return teacher.planningAssignations.length > 0 || teacher.enseignements.length > 0 ? "active" : "pending";
  };

  // Filtrage et tri
  const filteredTeachers = teachers
    .filter((teacher) => {
      const fullName = `${teacher.user.firstName} ${teacher.user.lastName}`.toLowerCase();
      const email = teacher.user.email.toLowerCase();
      
      return fullName.includes(searchTerm.toLowerCase()) || 
             email.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const aValue = a.user[sortField as keyof typeof a.user];
      const bValue = b.user[sortField as keyof typeof b.user];

      if (aValue === undefined || bValue === undefined) return 0;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return 0;
    });

  const handleSort = (field: keyof any) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Statistiques calculées
  const stats = {
    totalTeachers: teachers.length,
    activeTeachers: teachers.filter(t => getTeacherStatus(t) === "active").length,
    pendingTeachers: teachers.filter(t => getTeacherStatus(t) === "pending").length,
    totalVagues: new Set(teachers.flatMap(t => getTeacherVagues(t))).size,
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    try {
      const response = await fetch(`/api/admin/teachers?id=${teacherId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTeachers(prev => prev.filter(t => t.id !== teacherId));
        setTeacherToDelete(null);
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('Erreur lors de la suppression du professeur');
    }
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          Chargement des professeurs...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Erreur</CardTitle>
            <CardDescription className="text-gray-600">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={loadTeachers} className="bg-blue-600 text-white hover:bg-blue-700">
              <FaSync className="mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
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
              Vous n&apos;avez pas les permissions d&apos;administrateur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="bg-blue-600 text-white hover:bg-blue-700">
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
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Professeurs</h1>
            <p className="text-gray-600 mt-2">
              {stats.totalTeachers} professeur(s) - Gestion des comptes enseignants
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={loadTeachers} variant="outline">
              <FaSync className="mr-2" />
              Actualiser
            </Button>
            <Link href="/auth/signup">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <FaPlus className="mr-2 h-4 w-4" />
                Ajouter un Élève
              </Button>
            </Link>
          </div>
        </div>

        {/* BARRE DE RECHERCHE */}
        <div className="max-w-md">
          <Input
            placeholder="Rechercher un professeur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {/* STATISTIQUES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Professeurs</CardTitle>
              <FaUsers className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTeachers}</div>
              <p className="text-xs text-muted-foreground">Comptes créés</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actifs</CardTitle>
              <FaCheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeTeachers}</div>
              <p className="text-xs text-muted-foreground">Avec assignations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              <FaClock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.pendingTeachers}</div>
              <p className="text-xs text-muted-foreground">Sans assignation</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vagues Utilisées</CardTitle>
              <FaLayerGroup className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVagues}</div>
              <p className="text-xs text-muted-foreground">Vagues assignées</p>
            </CardContent>
          </Card>
        </div>

        {/* TABLEAU */}
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
                  <TableHead className="cursor-pointer" onClick={() => handleSort("lastName")}>
                    <div className="flex items-center gap-2">
                      Nom
                      <FaSort className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Vagues Assignées</TableHead>
                  <TableHead>Matières</TableHead>
                  <TableHead>Filières</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => {
                  const vagues = getTeacherVagues(teacher);
                  const subjects = getTeacherSubjects(teacher);
                  const filieres = getTeacherFilieres(teacher);
                  const status = getTeacherStatus(teacher);
                  
                  return (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">
                        {teacher.user.firstName} {teacher.user.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{teacher.user.email}</div>
                          <div className="text-xs text-muted-foreground">
                            {teacher.user.phone || "Non renseigné"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {vagues.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {vagues.map((vague, index) => (
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
                        {subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {subjects.map((subject, index) => (
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
                        {filieres.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {filieres.map((filiere, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-blue-50">
                                {filiere}
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
                          variant={status === "active" ? "default" : "secondary"}
                          className={
                            status === "active" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-amber-100 text-amber-800"
                          }
                        >
                          {status === "active" ? "Actif" : "En attente"}
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
                            className="bg-red-500 text-white"
                            variant="destructive"
                            size="sm"
                            onClick={() => setTeacherToDelete(teacher)}
                          >
                            <FaTrash className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
                  {selectedTeacher.user.firstName} {selectedTeacher.user.lastName}
                </CardTitle>
                <CardDescription>Détails du professeur</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p><strong>Email:</strong> {selectedTeacher.user.email}</p>
                <p><strong>Téléphone:</strong> {selectedTeacher.user.phone || "Non renseigné"}</p>
                <p><strong>Vagues:</strong> {getTeacherVagues(selectedTeacher).join(", ") || "Aucune"}</p>
                <p><strong>Matières:</strong> {getTeacherSubjects(selectedTeacher).join(", ") || "Aucune"}</p>
                <p><strong>Filières:</strong> {getTeacherFilieres(selectedTeacher).join(", ") || "Aucune"}</p>
                <p><strong>Date d&apos;inscription:</strong> {new Date(selectedTeacher.user.createdAt).toLocaleDateString('fr-FR')}</p>
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
                  Voulez-vous vraiment supprimer {teacherToDelete.user.firstName} {teacherToDelete.user.lastName} ?
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => setTeacherToDelete(null)}>
                  Annuler
                </Button>
                <Button
                  className="text-white bg-red-500"
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