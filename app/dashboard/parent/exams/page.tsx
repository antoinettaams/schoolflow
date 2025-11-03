"use client";

import React, { useState, useMemo, useEffect } from "react";

import {
  FaAward,
  FaChartLine,
  FaArrowDown,
  FaClipboardList,
  FaFilter,
} from "react-icons/fa";

import { Card, CardContent,CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

/* ---------- Types ---------- */

type ExamType = "Interrogation" | "Devoir" | "Composition";

interface GradeDetail {
  module: string;
  examType: ExamType;
  grade: number;
  coefficient: number;
  key: string;
  semestre: string;
}

interface Exam {
  subject: string;
  date: string;
  examType: ExamType;
  grade: number;
  coefficient: number;
  teacher: string;
}

interface GradeSummaryItem {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

interface GradeDetailWithTitle extends GradeDetail {
  title: string;
}

interface ModuleMapEntry {
  grades: GradeDetailWithTitle[];
  totalWeightedGrade: number;
  totalCoefficient: number;
  moduleCoefficient: number;
}

interface FinalRow {
  module: string;
  moduleAvg: number;
  coefficient: number;
  notes: Record<string, { grade: number; coefficient: number }>;
}

interface StudentData {
  studentName: string;
  studentClass: string;
  studentStatus: "inscrit" | "non-inscrit";
  filiere: string;
  vague: string;
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

const gradesSummary: GradeSummaryItem[] = [
  {
    title: "Moyenne Générale",
    value: "15.3 / 20",
    icon: FaAward,
    color: "text-green-600",
    description: "Moyenne de votre enfant sur l'ensemble des matières",
  },
  {
    title: "Progression (Semestre)",
    value: "+1.2 pts",
    icon: FaChartLine,
    color: "text-blue-600",
    description: "Amélioration par rapport au semestre précédent",
  },
  {
    title: "Matière la plus faible",
    value: "Next JS",
    icon: FaArrowDown,
    color: "text-red-600",
    description: "Moyenne: 12.88/20. À travailler.",
  },
  {
    title: "Prochains Évaluations",
    value: "3",
    icon: FaClipboardList,
    color: "text-blue-600",
    description: "Examens prévus la semaine prochaine",
  },
];

const detailedGrades: GradeDetail[] = [
  { module: "Next JS", examType: "Interrogation", grade: 12.0, coefficient: 4, key: "I1", semestre: "S1" },
  { module: "Next JS", examType: "Interrogation", grade: 14.5, coefficient: 4, key: "I2", semestre: "S1" },
  { module: "Next JS", examType: "Devoir", grade: 16.0, coefficient: 4, key: "D1", semestre: "S1" },
  { module: "Next JS", examType: "Composition", grade: 9.0, coefficient: 4, key: "C1", semestre: "S1" },

  { module: "Base de Données", examType: "Interrogation", grade: 17.0, coefficient: 3, key: "I1", semestre: "S1" },
  { module: "Base de Données", examType: "Devoir", grade: 15.0, coefficient: 3, key: "D1", semestre: "S1" },
  { module: "Base de Données", examType: "Composition", grade: 18.0, coefficient: 3, key: "C1", semestre: "S1" },

  { module: "Gestion de Projet", examType: "Interrogation", grade: 10.0, coefficient: 2, key: "I1", semestre: "S2" },
  { module: "Gestion de Projet", examType: "Interrogation", grade: 11.0, coefficient: 2, key: "I2", semestre: "S2" },
  { module: "Gestion de Projet", examType: "Interrogation", grade: 12.5, coefficient: 2, key: "I3", semestre: "S2" },
  { module: "Gestion de Projet", examType: "Devoir", grade: 14.0, coefficient: 2, key: "D1", semestre: "S2" },

  { module: "Anglais Technique", examType: "Devoir", grade: 19.0, coefficient: 2, key: "D1", semestre: "S2" },
  { module: "Anglais Technique", examType: "Composition", grade: 15.5, coefficient: 2, key: "C1", semestre: "S2" },
  { module: "Anglais Technique", examType: "Interrogation", grade: 14.0, coefficient: 2, key: "I1", semestre: "S2" },
  { module: "Gestion de Projet", examType: "Composition", grade: 15.0, coefficient: 2, key: "C1", semestre: "S2" },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const recentExams: Exam[] = [
  { subject: "Next JS", date: "15/12/2024", examType: "Devoir", grade: 16.0, coefficient: 4, teacher: "M. Martin" },
  { subject: "Base de Données", date: "12/12/2024", examType: "Interrogation", grade: 14.5, coefficient: 3, teacher: "Mme. Dubois" },
  { subject: "Gestion de Projet", date: "10/12/2024", examType: "Composition", grade: 13.0, coefficient: 2, teacher: "Mme. Bernard" },
  { subject: "Anglais Technique", date: "08/12/2024", examType: "Devoir", grade: 15.5, coefficient: 2, teacher: "M. Leroy" },
  { subject: "Next JS", date: "05/12/2024", examType: "Interrogation", grade: 11.5, coefficient: 4, teacher: "Mme. Johnson" },
  { subject: "Base de Données", date: "02/12/2024", examType: "Devoir", grade: 17.0, coefficient: 3, teacher: "M. Petit" },
];

/* ---------- Hook utilitaire ---------- */

const useGradeData = (grades: GradeDetail[]) =>
  useMemo(() => {
    const moduleMap: Record<string, ModuleMapEntry> = {};
    let totalWeightedGradeSum = 0;
    let totalCoefficientSum = 0;
    const allExamTitles = new Set<string>();

    grades.forEach((g) => {
      if (!moduleMap[g.module]) {
        moduleMap[g.module] = {
          grades: [],
          totalWeightedGrade: 0,
          totalCoefficient: 0,
          moduleCoefficient: g.coefficient,
        };
      }

      const moduleData = moduleMap[g.module];

      const title = g.key;
      allExamTitles.add(title);

      const withTitle: GradeDetailWithTitle = { ...g, title };
      moduleData.grades.push(withTitle);

      moduleData.totalWeightedGrade += g.grade * g.coefficient;
      moduleData.totalCoefficient += g.coefficient;
    });

    const modulesList = Object.keys(moduleMap).sort();

    const finalData: FinalRow[] = modulesList.map((moduleName) => {
      const data = moduleMap[moduleName];

      const moduleAvg = data.totalCoefficient > 0 ? data.totalWeightedGrade / data.totalCoefficient : 0;

      totalWeightedGradeSum += data.totalWeightedGrade;
      totalCoefficientSum += data.totalCoefficient;

      const row: FinalRow = {
        module: moduleName,
        moduleAvg,
        coefficient: data.moduleCoefficient,
        notes: {},
      };

      data.grades.forEach((g) => {
        row.notes[g.title] = { grade: g.grade, coefficient: g.coefficient };
      });

      return row;
    });

    const generalAverage = totalCoefficientSum > 0 ? totalWeightedGradeSum / totalCoefficientSum : 0;

    const sortedExamTitles = Array.from(allExamTitles).sort((a, b) => {
      const getType = (s: string) => s.match(/^([A-Z])/i)?.[1] ?? "";
      const getIndex = (s: string) => parseInt(s.match(/(\d+)/)?.[1] || "99", 10);

      const typeA = getType(a).toUpperCase();
      const typeB = getType(b).toUpperCase();

      if (typeA !== typeB) {
        const order = ["I", "D", "C", "P"];
        return order.indexOf(typeA) - order.indexOf(typeB);
      }
      return getIndex(a) - getIndex(b);
    });

    return { finalData, generalAverage, sortedExamTitles };
  }, [grades]);

/* ---------- Composant principal ---------- */

const ParentExams: React.FC = () => {
  const [selectedSemestre, setSelectedSemestre] = useState<string>("S1");
  const [showFullCoeff] = useState<boolean>(false);
  const [studentData, setStudentData] = useState<StudentData | null>(null);

  // Charger les données de l'enfant
  useEffect(() => {
    const loadStudentData = () => {
      try {
        const savedData = localStorage.getItem('parent_student_data');
        if (savedData) {
          const data = JSON.parse(savedData);
          setStudentData({
            studentName: data.studentName,
            studentClass: data.studentClass,
            studentStatus: data.studentStatus,
            filiere: data.filiere,
            vague: data.vague
          });
        } else {
          // Données par défaut
          setStudentData({
            studentName: "Jean Dupont",
            studentClass: "Terminale S",
            studentStatus: "inscrit",
            filiere: "Développement Web & Mobile",
            vague: "Vague Janvier 2024"
          });
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données élève:", error);
      }
    };

    loadStudentData();
  }, []);

  const uniqueSemestres = useMemo(() => Array.from(new Set(detailedGrades.map((g) => g.semestre))), []);

  const filteredDetailedGrades = useMemo(
    () => detailedGrades.filter((grade) => selectedSemestre === "all" || grade.semestre === selectedSemestre),
    [selectedSemestre]
  );

  const { finalData, generalAverage, sortedExamTitles } = useGradeData(filteredDetailedGrades);

  const getGradeColor = (grade: number) => {
    if (grade >= 16) return "bg-green-100 text-green-800 border-green-200";
    if (grade >= 14) return "bg-blue-100 text-blue-800 border-blue-200";
    if (grade >= 12) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const formatExamTitle = (titleKey: string) => {
    if (titleKey.startsWith("I")) return `Interro ${titleKey.substring(1)}`;
    if (titleKey.startsWith("D")) return `Devoir ${titleKey.substring(1)}`;
    if (titleKey.startsWith("C")) return `Comp. ${titleKey.substring(1)}`;
    return titleKey;
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-10">
      <div className="p-4 sm:p-6 space-y-6">
        {/* Grand titre */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
            Examens & Notes
          </CardTitle>
          <CardDescription className="text-lg sm:text-xl">
            Élève : 
            <span className="font-semibold text-gray-700">
              {studentData?.studentName || "Jean Dupont"}
            </span>
          </CardDescription>
        </div>
        
        {/* Résumé des notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gradesSummary.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-500 truncate">{item.title}</h3>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div className={`text-2xl font-bold ${item.color} truncate`}>{item.value}</div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tableau détaillé des notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <span className="flex items-center gap-2 min-w-0">
                <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="truncate">Relevé de Notes Détaillé</span>
              </span>

              <div className="min-w-[120px] sm:min-w-[200px]">
                <Select onValueChange={(val) => setSelectedSemestre(val)} defaultValue={selectedSemestre}>
                  <SelectTrigger className="bg-white">
                    <div className="flex items-center">
                      <FaFilter className="w-3 h-3 text-gray-400 mr-2" />
                      <SelectValue placeholder="Choisir un semestre" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">Tous les semestres</SelectItem>
                    {uniqueSemestres.map((sem) => (
                      <SelectItem key={sem} value={sem}>
                        Semestre {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex justify-center items-center border-b border-gray-100">
              <div className="font-bold text-gray-800 bg-blue-50/50 p-2 rounded-lg shadow-inner flex items-center gap-2 md:flex flex-col text-sm">
                <span className="whitespace-nowrap">
                  Moyenne Générale du {selectedSemestre !== "all" ? `Semestre ${selectedSemestre}` : "Global"} :
                </span>
                <Badge className={`ml-2 text-xl py-1 px-3 ${getGradeColor(generalAverage)}`}>
                  {generalAverage.toFixed(2)}
                </Badge>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <div className="min-w-[720px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-900 w-1/4">Module</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-center">Coefficient</TableHead>

                      {sortedExamTitles.map((titleKey) => (
                        <TableHead
                          key={titleKey}
                          className="text-center font-semibold text-gray-900 uppercase text-xs sm:text-sm border-l border-gray-200 min-w-[70px]"
                        >
                          {formatExamTitle(titleKey)}
                        </TableHead>
                      ))}

                      <TableHead className="text-center font-semibold text-gray-900 bg-blue-50/50 border-l border-gray-200 min-w-[120px]">
                        Moy. Module
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {finalData.map((moduleData) => (
                      <TableRow key={moduleData.module} className="hover:bg-gray-50">
                        <TableCell className="font-medium sticky left-0 text-sm sm:text-base truncate">
                          {moduleData.module}
                        </TableCell>

                        <TableCell className="text-center font-medium text-gray-700 bg-gray-50/50 text-sm">
                          {moduleData.coefficient}
                        </TableCell>

                        {sortedExamTitles.map((titleKey) => {
                          const note = moduleData.notes[titleKey];
                          const grade = note?.grade;
                          const coeff = note?.coefficient;

                          return (
                            <TableCell key={titleKey} className="text-center border-l border-gray-100 p-2">
                              {grade !== undefined ? (
                                <Badge className={`px-2 py-1 text-xs sm:text-sm ${getGradeColor(grade)}`}>
                                  {grade.toFixed(1)}
                                  {showFullCoeff && <span className="ml-1 text-xs">({coeff})</span>}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-xs sm:text-sm">-</span>
                              )}
                            </TableCell>
                          );
                        })}

                        <TableCell className="text-center bg-blue-50/20 border-l border-gray-200">
                          <Badge className={`font-bold text-sm sm:text-base ${getGradeColor(moduleData.moduleAvg)}`}>
                            {moduleData.moduleAvg.toFixed(2)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentExams;