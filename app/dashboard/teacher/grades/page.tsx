"use client";

import React, { useState, useMemo } from "react";

import {
  FaFilter,
  FaSave,
  FaEdit,
  FaLock,
} from "react-icons/fa";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

/* ---------- Types ---------- */

interface Student {
  id: string;
  name: string;
  email: string;
  filiere: string;
}

interface Grade {
  interrogation1?: number;
  interrogation2?: number;
  interrogation3?: number;
  devoir?: number;
  composition?: number;
  rang?: number;
}

interface StudentGrade extends Student {
  grades: Grade;
  moyenneInterro?: number;
  moyenneDevoir?: number;
  moyenneComposition?: number;
  moyenneModule?: number;
}

interface Module {
  id: string;
  name: string;
  coefficient: number;
  filiere: string;
}

/* ---------- SVG Icons ---------- */

const FileText = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

/* ---------- Données de simulation ---------- */

const filieres = [
  "Informatique",
  "Génie Civil", 
  "Gestion",
  "Marketing",
  "Mécanique"
];

const semestres = [
  "Semestre 1",
  "Semestre 2", 
  "Semestre 3",
  "Semestre 4"
];

const modulesAssignes: Module[] = [
  { id: "nextjs", name: "Next JS", coefficient: 4, filiere: "Informatique" },
  { id: "database", name: "Base de Données", coefficient: 3, filiere: "Informatique" },
  { id: "react", name: "React Avancé", coefficient: 3, filiere: "Informatique" },
  { id: "comptabilité", name: "Comptabilité", coefficient: 3, filiere: "Gestion" },
  { id: "management", name: "Management", coefficient: 2, filiere: "Gestion" },
  { id: "construction", name: "Techniques de Construction", coefficient: 4, filiere: "Génie Civil" },
];

const students: Student[] = [
  { id: "1", name: "Jean Dupont", email: "jean.dupont@student.com", filiere: "Informatique"},
  { id: "2", name: "Marie Martin", email: "marie.martin@student.com", filiere: "Informatique"},
  { id: "3", name: "Pierre Bernard", email: "pierre.bernard@student.com", filiere: "Génie Civil"},
  { id: "4", name: "Sophie Leroy", email: "sophie.leroy@student.com", filiere: "Gestion"},
  { id: "5", name: "Thomas Moreau", email: "thomas.moreau@student.com", filiere: "Marketing"},
  { id: "6", name: "Laura Petit", email: "laura.petit@student.com", filiere: "Mécanique"},
  { id: "7", name: "Nicolas Blanc", email: "nicolas.blanc@student.com", filiere: "Informatique"},
  { id: "8", name: "Camille Roux", email: "camille.roux@student.com", filiere: "Génie Civil"},
  { id: "9", name: "David Lambert", email: "david.lambert@student.com", filiere: "Gestion"},
  { id: "10", name: "Sarah Cohen", email: "sarah.cohen@student.com", filiere: "Gestion"},
];

const initialGrades: StudentGrade[] = students.map(student => ({
  ...student,
  grades: {
    rang: 0
  },
  moyenneInterro: 0,
  moyenneDevoir: 0,
  moyenneComposition: 0,
  moyenneModule: 0,
}));

/* ---------- Composant principal ---------- */

const TeacherGrades: React.FC = () => {
  const [selectedSemestre, setSelectedSemestre] = useState<string>("Semestre 1");
  const [selectedFiliere, setSelectedFiliere] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>(initialGrades);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Modules assignés filtrés selon la filière sélectionnée
  const filteredModules = useMemo(() => {
    if (!selectedFiliere) {
      return [];
    }
    return modulesAssignes.filter(module => module.filiere === selectedFiliere);
  }, [selectedFiliere]);

  // Réinitialiser le module quand la filière change
  React.useEffect(() => {
    setSelectedModule("");
  }, [selectedFiliere]);

  // Filtrage des étudiants basé sur les sélections
  const filteredStudents = useMemo(() => {
    return studentGrades.filter(student => {
      const filiereMatch = !selectedFiliere || student.filiere === selectedFiliere;
      return filiereMatch;
    });
  }, [studentGrades, selectedFiliere]);

  // Calcul des moyennes
  const processedGrades = useMemo(() => {
    return filteredStudents.map(student => {
      const { interrogation1 = 0, interrogation2 = 0, interrogation3 = 0, devoir = 0, composition = 0 } = student.grades;
      
      // Moyenne des interrogations
      const interroNotes = [interrogation1, interrogation2, interrogation3].filter(grade => grade !== undefined && grade !== 0);
      const moyenneInterro = interroNotes.length > 0 ? interroNotes.reduce((sum, grade) => sum + grade, 0) / interroNotes.length : 0;
      
      const moyenneDevoir = devoir || 0;
      const moyenneComposition = composition || 0;
      
      // Moyenne du module 
      const moyenneModule = (moyenneInterro * 0.3 + moyenneDevoir * 0.3 + moyenneComposition * 0.4);
      
      return {
        ...student,
        moyenneInterro,
        moyenneDevoir,
        moyenneComposition,
        moyenneModule,
      };
    });
  }, [filteredStudents]);

  const handleGradeChange = (studentId: string, field: keyof Grade, value: string) => {
    let numericValue: number | undefined;
    
    if (field === 'rang') {
      numericValue = value === "" ? undefined : Math.max(1, parseInt(value) || 1);
    } else {
      numericValue = value === "" ? undefined : Math.min(20, Math.max(0, parseFloat(value) || 0));
    }
    
    setStudentGrades(prev => prev.map(student => 
      student.id === studentId 
        ? { 
            ...student, 
            grades: { 
              ...student.grades, 
              [field]: numericValue 
            } 
          } 
        : student
    ));
    setHasChanges(true);
  };

  const handleSave = () => {
    console.log("Notes et rangs sauvegardés:", processedGrades);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setStudentGrades(initialGrades);
    setIsEditing(false);
    setHasChanges(false);
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 16) return "bg-green-100 text-green-800 border-green-200";
    if (grade >= 14) return "bg-blue-100 text-blue-800 border-blue-200";
    if (grade >= 12) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (rank <= 3) return "bg-green-100 text-green-800 border-green-200";
    if (rank <= 5) return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const selectedModuleData = modulesAssignes.find(m => m.id === selectedModule);

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-10">
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* En-tête */}
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
                  Gestion des Notes - {selectedModuleData?.name || "Sélectionnez un module"}
                </CardTitle>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  {selectedModuleData ? `Coefficient: ${selectedModuleData.coefficient} | ` : ""}
                  {selectedFiliere ? `Filière: ${selectedFiliere} | ` : ""}
                  Semestre: {selectedSemestre}
                </p>
              </div>
              <div className="flex flex-col xs:flex-row gap-2 w-full lg:w-48 flex-shrink-0">
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleCancel} className="flex-1 lg:flex-none">
                      Annuler
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSave}
                      disabled={!hasChanges}
                      className="flex-1 lg:flex-none"
                    >
                      <FaSave className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Enregistrer</span>
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    disabled={!selectedModule}
                    className="w-full"
                  >
                    <FaEdit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">Modifier les notes</span>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Filtres */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              {/* Filtre Semestre */}
              <div className="min-w-0">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Semestre
                </label>
                <Select onValueChange={setSelectedSemestre} defaultValue={selectedSemestre}>
                  <SelectTrigger className="bg-white w-full">
                    <div className="flex items-center">
                      <FaFilter className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0" />
                      <SelectValue placeholder="Semestre" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {semestres.map(semestre => (
                      <SelectItem key={semestre} value={semestre}>
                        {semestre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Filière */}
              <div className="min-w-0">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Filière *
                </label>
                <Select 
                  value={selectedFiliere} 
                  onValueChange={setSelectedFiliere}
                >
                  <SelectTrigger className="bg-white w-full">
                    <SelectValue placeholder="Choisir une filière" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {filieres.map(filiere => (
                      <SelectItem key={filiere} value={filiere}>
                        {filiere}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtre Module (BLOQUÉ jusqu'à sélection de filière) */}
              <div className="min-w-0">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Module
                  {!selectedFiliere && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <Select 
                  value={selectedModule} 
                  onValueChange={setSelectedModule}
                  disabled={!selectedFiliere}
                >
                  <SelectTrigger className={`bg-white w-full ${!selectedFiliere ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="flex items-center">
                      {!selectedFiliere && <FaLock className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0" />}
                      <SelectValue 
                        placeholder={
                          !selectedFiliere 
                            ? "Choisissez d'abord une filière" 
                            : filteredModules.length === 0
                            ? "Aucun module assigné"
                            : "Sélectionnez un module"
                        } 
                      />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {filteredModules.map(module => (
                      <SelectItem key={module.id} value={module.id}>
                        <span className="truncate">{module.name} (Coef: {module.coefficient})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedFiliere && (
                  <p className="text-xs text-red-500 mt-1">
                    Veuillez d&apos;abord sélectionner une filière
                  </p>
                )}
                {selectedFiliere && filteredModules.length === 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Aucun module assigné pour {selectedFiliere}
                  </p>
                )}
              </div>
            </div>

            {/* Résumé des filtres */}
            <div className="mt-3 sm:mt-4 flex flex-wrap gap-1 sm:gap-2">
              <Badge variant="secondary" className="text-xs">
                {selectedSemestre}
              </Badge>
              {selectedFiliere && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                  <span className="truncate">{selectedFiliere}</span>
                </Badge>
              )}
              {selectedModuleData && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  <span className="truncate">{selectedModuleData.name}</span>
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {processedGrades.length} étudiant(s)
              </Badge>
              {selectedFiliere && (
                <Badge variant="outline" className="text-xs">
                  {filteredModules.length} module(s)
                </Badge>
              )}
            </div>

            {/* Information sur les modules assignés */}
            {selectedFiliere && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Modules assignés pour {selectedFiliere}:</strong>{" "}
                  {filteredModules.length > 0 
                    ? filteredModules.map(m => m.name).join(", ")
                    : "Aucun module assigné"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tableau des notes */}
        {selectedModule ? (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base sm:text-lg lg:text-xl">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <span className="break-words">Saisie des Notes - {selectedModuleData?.name}</span>
                </div>
                <Badge variant="outline" className="text-xs sm:text-sm w-fit">
                  Filière: {selectedFiliere}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <div className="min-w-[800px] lg:min-w-[1000px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-gray-900 w-40 lg:w-48 sticky left-0 bg-gray-50 z-10 text-xs sm:text-sm">
                          Étudiant
                        </TableHead>
                        
                        {/* Interrogations */}
                        <TableHead colSpan={4} className="text-center font-semibold text-gray-900 bg-blue-50 text-xs sm:text-sm">
                          Interrogations
                        </TableHead>
                        
                        {/* Devoir */}
                        <TableHead colSpan={2} className="text-center font-semibold text-gray-900 bg-green-50 text-xs sm:text-sm">
                          Devoir
                        </TableHead>
                        
                        {/* Composition */}
                        <TableHead colSpan={2} className="text-center font-semibold text-gray-900 bg-purple-50 text-xs sm:text-sm">
                          Composition
                        </TableHead>
                        
                        <TableHead className="text-center font-semibold text-gray-900 bg-yellow-50 text-xs sm:text-sm">
                          Moy. Module
                        </TableHead>
                        
                        <TableHead className="text-center font-semibold text-gray-900 bg-gray-100 text-xs sm:text-sm">
                          Rang
                        </TableHead>
                      </TableRow>
                      
                      <TableRow className="bg-gray-50">
                        <TableHead className="sticky left-0 bg-gray-50 z-10 text-xs sm:text-sm">Nom</TableHead>
                        
                        {/* Colonnes Interrogations */}
                        <TableHead className="text-center min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm">Interro 1</TableHead>
                        <TableHead className="text-center min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm">Interro 2</TableHead>
                        <TableHead className="text-center min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm">Interro 3</TableHead>
                        <TableHead className="text-center min-w-[70px] sm:min-w-[80px] bg-blue-50 text-xs sm:text-sm">Moy. Interro</TableHead>
                        
                        {/* Colonnes Devoir */}
                        <TableHead className="text-center min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm">Devoir</TableHead>
                        <TableHead className="text-center min-w-[70px] sm:min-w-[80px] bg-green-50 text-xs sm:text-sm">Moy. Devoir</TableHead>
                        
                        {/* Colonnes Composition */}
                        <TableHead className="text-center min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm">Composition</TableHead>
                        <TableHead className="text-center min-w-[70px] sm:min-w-[80px] bg-purple-50 text-xs sm:text-sm">Moy. Comp.</TableHead>
                        
                        <TableHead className="text-center min-w-[80px] sm:min-w-[100px] bg-yellow-50 text-xs sm:text-sm">Moyenne</TableHead>
                        <TableHead className="text-center min-w-[60px] sm:min-w-[80px] bg-gray-100 text-xs sm:text-sm">Rang</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {processedGrades.map((student) => (
                        <TableRow key={student.id} className="hover:bg-gray-50">
                          {/* Nom de l'étudiant */}
                          <TableCell className="font-medium sticky left-0 bg-white p-2 sm:p-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-xs sm:text-sm break-words">{student.name}</div>
                              <div className="text-xs text-gray-500 truncate">{student.email}</div>
                            </div>
                          </TableCell>

                          {/* Interrogations */}
                          <TableCell className="text-center p-1">
                            {isEditing ? (
                              <Input
                                type="number"
                                min="0"
                                max="20"
                                step="0.5"
                                value={student.grades.interrogation1 || ""}
                                onChange={(e) => handleGradeChange(student.id, 'interrogation1', e.target.value)}
                                className="w-12 sm:w-16 text-center mx-auto text-xs"
                                placeholder="0"
                              />
                            ) : (
                              <Badge className={`px-1 sm:px-2 py-1 text-xs ${getGradeColor(student.grades.interrogation1 || 0)}`}>
                                {student.grades.interrogation1?.toFixed(1) || "-"}
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-center p-1">
                            {isEditing ? (
                              <Input
                                type="number"
                                min="0"
                                max="20"
                                step="0.5"
                                value={student.grades.interrogation2 || ""}
                                onChange={(e) => handleGradeChange(student.id, 'interrogation2', e.target.value)}
                                className="w-12 sm:w-16 text-center mx-auto text-xs"
                                placeholder="0"
                              />
                            ) : (
                              <Badge className={`px-1 sm:px-2 py-1 text-xs ${getGradeColor(student.grades.interrogation2 || 0)}`}>
                                {student.grades.interrogation2?.toFixed(1) || "-"}
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-center p-1">
                            {isEditing ? (
                              <Input
                                type="number"
                                min="0"
                                max="20"
                                step="0.5"
                                value={student.grades.interrogation3 || ""}
                                onChange={(e) => handleGradeChange(student.id, 'interrogation3', e.target.value)}
                                className="w-12 sm:w-16 text-center mx-auto text-xs"
                                placeholder="0"
                              />
                            ) : (
                              <Badge className={`px-1 sm:px-2 py-1 text-xs ${getGradeColor(student.grades.interrogation3 || 0)}`}>
                                {student.grades.interrogation3?.toFixed(1) || "-"}
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-center bg-blue-50/20 p-1">
                            <Badge className={`px-1 sm:px-2 py-1 font-medium text-xs ${getGradeColor(student.moyenneInterro || 0)}`}>
                              {student.moyenneInterro?.toFixed(2) || "0.00"}
                            </Badge>
                          </TableCell>

                          {/* Devoir */}
                          <TableCell className="text-center p-1">
                            {isEditing ? (
                              <Input
                                type="number"
                                min="0"
                                max="20"
                                step="0.5"
                                value={student.grades.devoir || ""}
                                onChange={(e) => handleGradeChange(student.id, 'devoir', e.target.value)}
                                className="w-12 sm:w-16 text-center mx-auto text-xs"
                                placeholder="0"
                              />
                            ) : (
                              <Badge className={`px-1 sm:px-2 py-1 text-xs ${getGradeColor(student.grades.devoir || 0)}`}>
                                {student.grades.devoir?.toFixed(1) || "-"}
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-center bg-green-50/20 p-1">
                            <Badge className={`px-1 sm:px-2 py-1 font-medium text-xs ${getGradeColor(student.moyenneDevoir || 0)}`}>
                              {student.moyenneDevoir?.toFixed(2) || "0.00"}
                            </Badge>
                          </TableCell>

                          {/* Composition */}
                          <TableCell className="text-center p-1">
                            {isEditing ? (
                              <Input
                                type="number"
                                min="0"
                                max="20"
                                step="0.5"
                                value={student.grades.composition || ""}
                                onChange={(e) => handleGradeChange(student.id, 'composition', e.target.value)}
                                className="w-12 sm:w-16 text-center mx-auto text-xs"
                                placeholder="0"
                              />
                            ) : (
                              <Badge className={`px-1 sm:px-2 py-1 text-xs ${getGradeColor(student.grades.composition || 0)}`}>
                                {student.grades.composition?.toFixed(1) || "-"}
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-center bg-purple-50/20 p-1">
                            <Badge className={`px-1 sm:px-2 py-1 font-medium text-xs ${getGradeColor(student.moyenneComposition || 0)}`}>
                              {student.moyenneComposition?.toFixed(2) || "0.00"}
                            </Badge>
                          </TableCell>

                          {/* Moyenne Module */}
                          <TableCell className="text-center bg-yellow-50/20 p-1">
                            <Badge className={`px-1 sm:px-2 py-1 font-bold text-xs ${getGradeColor(student.moyenneModule || 0)}`}>
                              {student.moyenneModule?.toFixed(2) || "0.00"}
                            </Badge>
                          </TableCell>

                          {/* Rang (saisi par le prof) */}
                          <TableCell className="text-center bg-gray-50 p-1">
                            {isEditing ? (
                              <Input
                                type="number"
                                min="1"
                                value={student.grades.rang || ""}
                                onChange={(e) => handleGradeChange(student.id, 'rang', e.target.value)}
                                className="w-12 sm:w-16 text-center mx-auto text-xs"
                                placeholder="1"
                              />
                            ) : (
                              <Badge className={`px-1 sm:px-2 py-1 font-bold text-xs ${getRankColor(student.grades.rang || 0)}`}>
                                {student.grades.rang || "-"}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Légende et informations */}
              <div className="mt-3 sm:mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs sm:text-sm text-gray-600 mb-2">
                  <strong>Légende :</strong> 
                  <span className="ml-2 sm:ml-4">Interrogations (30%)</span>
                  <span className="ml-2 sm:ml-4">Devoir (30%)</span>
                  <span className="ml-2 sm:ml-4">Composition (40%)</span>
                </div>
                <div className="text-xs text-gray-500">
                  <strong>Note :</strong> Les moyennes sont calculées automatiquement, mais les rangs doivent être saisis manuellement par le professeur.
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Message 
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">
                {!selectedFiliere ? "Sélectionnez une filière" : "Sélectionnez un module"}
              </h3>
              <p className="text-gray-500 text-sm sm:text-base">
                {!selectedFiliere 
                  ? "Veuillez d'abord choisir une filière pour voir vos modules assignés."
                  : "Veuillez sélectionner un module pour afficher le tableau des notes."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TeacherGrades;