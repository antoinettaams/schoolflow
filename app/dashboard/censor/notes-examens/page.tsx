"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Edit, 
  Trash2, 
  Save, 
  X,
  Eye,
  Filter,
  Download,
  FileText,
  Sheet,
  Plus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Grade {
  id: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentNumber: string;
  };
  module: {
    id: number;
    nom: string;
    coefficient: number;
    typeModule: string;
  };
  filiere: {
    id: number;
    nom: string;
  };
  vague: {
    id: string;
    nom: string;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
  };
  notes: {
    interrogation1: number | null;
    interrogation2: number | null;
    interrogation3: number | null;
    devoir: number | null;
    composition: number | null;
  };
  moyenne: number | null;
  rang: number | null;
  formulaUsed: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StudentData {
  id: string;
  nom: string;
  filiere: string;
  filiereId: number;
  vague: string;
  vagueId: string;
  semestre: string;
  modules: {
    module: string;
    moduleId: number;
    moyenneGenerale: number;
    coefficient: number;
    semestre: string;
  }[];
  moyenneGenerale?: number;
  rang?: number;
  appreciation?: string;
  originalGrades: Grade[];
}

interface ApiResponse {
  grades: Grade[];
  stats: {
    totalGrades: number;
    totalStudents: number;
    totalModules: number;
    averageGeneral: number;
    gradesByFiliere: { filiere: string; count: number }[];
    gradesByVague: { vague: string; count: number }[];
  };
  filters: {
    filieres: { id: string; name: string }[];
    vagues: { id: string; name: string }[];
    modules: { id: string; name: string }[];
    students: { id: string; name: string }[];
  };
}

interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  includeDetails: boolean;
  filiere: string;
  vague: string;
}

export default function GestionNotesCenseur() {
  const { user, isLoaded } = useUser();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiliere, setSelectedFiliere] = useState<string>("all");
  const [selectedVague, setSelectedVague] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // États pour les modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  
  // États pour l'export
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'excel',
    includeDetails: true,
    filiere: 'all',
    vague: 'all'
  });
  
  // États pour les filtres disponibles
  const [availableFilters, setAvailableFilters] = useState({
    filieres: [] as { id: string; name: string }[],
    vagues: [] as { id: string; name: string }[],
    modules: [] as { id: string; name: string }[],
    students: [] as { id: string; name: string }[],
  });

  // Chargement des données
  const loadStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("🔄 Chargement des données depuis l'API...");
      
      const params = new URLSearchParams();
      if (selectedFiliere && selectedFiliere !== "all") params.append("filiere", selectedFiliere);
      if (selectedVague && selectedVague !== "all") params.append("vague", selectedVague);
      if (selectedModule && selectedModule !== "all") params.append("module", selectedModule);

      const response = await fetch(`/api/censor/grades?${params}`);
       
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erreur API:", errorText);
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }
      
      const data: ApiResponse = await response.json();
      console.log("✅ Données reçues:", data);

      // Sauvegarder les filtres disponibles
      if (data.filters) {
        setAvailableFilters({
          filieres: data.filters.filieres || [],
          vagues: data.filters.vagues || [],
          modules: data.filters.modules || [],
          students: data.filters.students || [],
        });
      }

      if (data.grades && Array.isArray(data.grades)) {
        // Transformation des données
        const studentsMap = new Map();
        
        data.grades.forEach((grade: Grade) => {
          const studentId = grade.student.id;
          const studentKey = `${studentId}-${grade.filiere.id}-${grade.vague.id}`;
          
          if (!studentsMap.has(studentKey)) {
            studentsMap.set(studentKey, {
              id: studentId,
              nom: `${grade.student.firstName} ${grade.student.lastName} (${grade.student.studentNumber})`,
              filiere: grade.filiere.nom,
              filiereId: grade.filiere.id,
              vague: grade.vague.nom,
              vagueId: grade.vague.id,
              semestre: "Semestre 1",
              modules: [],
              moyenneGenerale: 0,
              rang: grade.rang || undefined,
              appreciation: "",
              originalGrades: []
            });
          }
          
          const student = studentsMap.get(studentKey);
          student.modules.push({
            module: grade.module.nom,
            moduleId: grade.module.id,
            moyenneGenerale: grade.moyenne || 0,
            coefficient: grade.module.coefficient,
            semestre: "Semestre 1"
          });
          student.originalGrades.push(grade);
        });
        
        // Calculer la moyenne générale pour chaque étudiant
        const transformedStudents = Array.from(studentsMap.values()).map(student => {
          const totalPoints = student.modules.reduce((sum: number, module: any) => 
            sum + (module.moyenneGenerale * module.coefficient), 0
          );
          const totalCoefficients = student.modules.reduce((sum: number, module: any) => 
            sum + module.coefficient, 0
          );
          
          return {
            ...student,
            moyenneGenerale: totalCoefficients > 0 ? totalPoints / totalCoefficients : 0
          };
        });
        
        console.log(`🎓 ${transformedStudents.length} étudiants chargés`);
        setStudents(transformedStudents);
      } else {
        console.warn("⚠️ Aucune donnée de grade reçue");
        setStudents([]);
      }
      
    } catch (error) {
      console.error("❌ Erreur chargement:", error);
      setError(error instanceof Error ? error.message : "Erreur lors du chargement");
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      loadStudents();
    }
  }, [isLoaded, selectedFiliere, selectedVague, selectedModule]);

  // Mise à jour des champs
  const handleFieldChange = (
    id: string,
    field: keyof Pick<StudentData, "moyenneGenerale" | "rang" | "appreciation">,
    value: string
  ) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id
          ? {
              ...student,
              [field]:
                field === "moyenneGenerale"
                  ? parseFloat(value) || undefined
                  : field === "rang"
                  ? parseInt(value) || undefined
                  : value,
            }
          : student
      )
    );
  };

  // Actions
  const handleViewDetails = (student: StudentData) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleDeleteGrade = (student: StudentData, grade: Grade) => {
    setSelectedStudent(student);
    setSelectedGrade(grade);
    setShowDeleteModal(true);
  };

  // Sauvegarde des modifications
  const saveChanges = async () => {
    try {
      setIsSaving(true);
      console.log("💾 Début de la sauvegarde...");

      const updates = [];
      
      // Préparer les données de mise à jour
      for (const student of students) {
        for (const grade of student.originalGrades) {
          const updateData = {
            studentId: grade.student.id,
            moduleId: grade.module.id.toString(),
            filiereId: grade.filiere.id.toString(),
            vagueId: grade.vague.id,
            teacherId: grade.teacher.id,
            interrogation1: grade.notes.interrogation1,
            interrogation2: grade.notes.interrogation2,
            interrogation3: grade.notes.interrogation3,
            devoir: grade.notes.devoir,
            composition: grade.notes.composition,
            rang: student.rang !== undefined ? student.rang : grade.rang,
            formulaUsed: grade.formulaUsed
          };

          updates.push(updateData);
        }
      }

      console.log(`📤 Envoi de ${updates.length} mises à jour...`);

      // Envoyer toutes les mises à jour
      const results = await Promise.all(
        updates.map(updateData =>
          fetch("/api/censor/grades", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateData),
          }).then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
        )
      );

      console.log("✅ Toutes les mises à jour sauvegardées:", results);
      toast.success("Modifications sauvegardées avec succès!");

      // Recharger les données
      await loadStudents();

    } catch (error) {
      console.error("❌ Erreur sauvegarde:", error);
      toast.error(`Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Export des données
  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const toastId = toast.loading("Préparation de l'export...");

      const params = new URLSearchParams();
      params.append("format", exportOptions.format);
      params.append("includeDetails", exportOptions.includeDetails.toString());
      if (exportOptions.filiere !== "all") params.append("filiere", exportOptions.filiere);
      if (exportOptions.vague !== "all") params.append("vague", exportOptions.vague);

      const response = await fetch(`/api/censor/export?${params}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      
      // Nom du fichier selon le format
      const formatExtension = exportOptions.format === 'excel' ? 'xlsx' : exportOptions.format;
      const timestamp = new Date().toISOString().split('T')[0];
      a.download = `notes-${timestamp}.${formatExtension}`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.dismiss(toastId);
      toast.success(`Export ${exportOptions.format.toUpperCase()} réussi!`);
      setShowExportModal(false);
      
    } catch (error) {
      console.error("❌ Erreur export:", error);
      toast.error(`Erreur lors de l'export: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Suppression d'un grade
  const deleteGrade = async () => {
    try {
      if (!selectedGrade) return;
      
      const toastId = toast.loading("Suppression en cours...");
      
      const response = await fetch(`/api/censor/grades?id=${selectedGrade.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Grade supprimé:", result);
      
      toast.dismiss(toastId);
      toast.success("Note supprimée avec succès!");
      
      setShowDeleteModal(false);
      await loadStudents();
      
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
      toast.error(`Erreur lors de la suppression: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  };

  // Skeleton pour le tableau
  const TableSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );

  // Skeleton pour les cartes de filtre
  const FilterSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );

  // Écran de chargement principal
  if (!isLoaded || isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-6 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Skeleton pour les filtres */}
            <FilterSkeleton />

            {/* Skeleton pour le tableau */}
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Étudiant", "Filière", "Vague", "Modules", "Moyenne Générale", "Rang", "Appréciation", "Actions"].map((header) => (
                      <TableHead key={header}>
                        <Skeleton className="h-4 w-20" />
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 8 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6 space-y-6 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="text-red-600 text-xl mb-4">Erreur</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <Button onClick={loadStudents} className="bg-blue-600 text-white">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg lg:text-xl font-semibold">
            Gestion des Notes — Censeur
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowExportModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <Button 
              onClick={saveChanges}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filtres Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div className="w-full">
              <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                <SelectTrigger className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrer par filière" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">Toutes les filières</SelectItem>
                  {availableFilters.filieres.map((filiere) => (
                    <SelectItem key={filiere.id} value={filiere.id}>
                      {filiere.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full">
              <Select value={selectedVague} onValueChange={setSelectedVague}>
                <SelectTrigger className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrer par vague" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">Toutes les vagues</SelectItem>
                  {availableFilters.vagues.map((vague) => (
                    <SelectItem key={vague.id} value={vague.id}>
                      {vague.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full">
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrer par module" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all">Tous les modules</SelectItem>
                  {availableFilters.modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full flex items-center">
              <Button 
                onClick={loadStudents}
                variant="outline"
                className="w-full"
              >
                Actualiser
              </Button>
            </div>
          </div>

          {/* Tableau des notes avec actions */}
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Étudiant</TableHead>
                  <TableHead>Filière</TableHead>
                  <TableHead>Vague</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Moyenne Générale</TableHead>
                  <TableHead>Rang</TableHead>
                  <TableHead>Appréciation</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {students.length > 0 ? (
                  students.map((student) => (
                    <TableRow key={`${student.id}-${student.filiere}-${student.vague}`}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{student.nom.split('(')[0].trim()}</div>
                          <div className="text-xs text-gray-500">
                            {student.nom.match(/\(([^)]+)\)/)?.[1]}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.filiere}</TableCell>
                      <TableCell>{student.vague}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {student.modules.slice(0, 2).map((m) => (
                            <div key={m.moduleId} className="text-sm truncate">
                              {m.module}: <span className="font-semibold">{m.moyenneGenerale.toFixed(1)}</span>
                            </div>
                          ))}
                          {student.modules.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{student.modules.length - 2} autres
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="20"
                          value={student.moyenneGenerale?.toFixed(1) || ""}
                          onChange={(e) => handleFieldChange(student.id, "moyenneGenerale", e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={student.rang ?? ""}
                          onChange={(e) => handleFieldChange(student.id, "rang", e.target.value)}
                          className="w-16"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          placeholder="Appréciation"
                          value={student.appreciation ?? ""}
                          onChange={(e) => handleFieldChange(student.id, "appreciation", e.target.value)}
                          className="min-w-[120px]"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(student)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => student.originalGrades[0] && handleDeleteGrade(student, student.originalGrades[0])}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Aucun étudiant trouvé avec les critères sélectionnés.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal d'export */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Exporter les notes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Format d'export */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Format d'export</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={exportOptions.format === 'excel' ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-16"
                  onClick={() => setExportOptions({...exportOptions, format: 'excel'})}
                >
                  <Sheet className="w-5 h-5 mb-1" />
                  <span className="text-xs">Excel</span>
                </Button>
                <Button
                  type="button"
                  variant={exportOptions.format === 'pdf' ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-16"
                  onClick={() => setExportOptions({...exportOptions, format: 'pdf'})}
                >
                  <FileText className="w-5 h-5 mb-1" />
                  <span className="text-xs">PDF</span>
                </Button>
                <Button
                  type="button"
                  variant={exportOptions.format === 'csv' ? "default" : "outline"}
                  className="flex flex-col items-center justify-center h-16"
                  onClick={() => setExportOptions({...exportOptions, format: 'csv'})}
                >
                  <FileText className="w-5 h-5 mb-1" />
                  <span className="text-xs">CSV</span>
                </Button>
              </div>
            </div>

            {/* Filtres d'export */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Filière</label>
                <Select 
                  value={exportOptions.filiere} 
                  onValueChange={(value) => setExportOptions({...exportOptions, filiere: value})}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Sélectionner une filière" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les filières</SelectItem>
                    {availableFilters.filieres.map((filiere) => (
                      <SelectItem key={filiere.id} value={filiere.id}>
                        {filiere.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Vague</label>
                <Select 
                  value={exportOptions.vague} 
                  onValueChange={(value) => setExportOptions({...exportOptions, vague: value})}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Sélectionner une vague" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les vagues</SelectItem>
                    {availableFilters.vagues.map((vague) => (
                      <SelectItem key={vague.id} value={vague.id}>
                        {vague.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Options supplémentaires */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeDetails"
                checked={exportOptions.includeDetails}
                onChange={(e) => setExportOptions({...exportOptions, includeDetails: e.target.checked})}
                className="rounded border-gray-300"
              />
              <label htmlFor="includeDetails" className="text-sm">
                Inclure les détails des notes
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportModal(false)}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Export..." : "Exporter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de suppression */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={deleteGrade} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de détails */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Détails de l'étudiant</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Informations</h3>
                  <p><strong>Nom:</strong> {selectedStudent.nom}</p>
                  <p><strong>Filière:</strong> {selectedStudent.filiere}</p>
                  <p><strong>Vague:</strong> {selectedStudent.vague}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Statistiques</h3>
                  <p><strong>Moyenne générale:</strong> {selectedStudent.moyenneGenerale?.toFixed(2)}</p>
                  <p><strong>Rang:</strong> {selectedStudent.rang || "Non défini"}</p>
                  <p><strong>Nombre de modules:</strong> {selectedStudent.modules.length}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Notes détaillées</h3>
                <div className="space-y-2">
                  {selectedStudent.modules.map((module) => (
                    <div key={module.moduleId} className="flex justify-between items-center border-b pb-2">
                      <span>{module.module}</span>
                      <span className="font-semibold">{module.moyenneGenerale.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}