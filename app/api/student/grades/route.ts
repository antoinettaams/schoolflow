// app/api/student/grades/route.ts - VERSION CORRIGÉE
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Types correspondant au frontend
interface GradeDetail {
  module: string;
  examType: "Interrogation" | "Devoir" | "Composition";
  grade: number;
  coefficient: number;
  key: string;
  semestre: string;
}

interface GradeSummaryItem {
  title: string;
  value: string;
  icon: string;
  color: string;
  description: string;
}

interface StudentData {
  studentName: string;
  studentClass: string;
  studentStatus: "inscrit" | "non-inscrit";
  filiere: string;
  vague: string;
}

interface ApiResponse {
  studentData: StudentData;
  gradesSummary: GradeSummaryItem[];
  detailedGrades: GradeDetail[];
  generalAverage: number;
  allSemestres: string[];
  allModules: string[];
  success: boolean;
}

// Fonction pour mapper les notes de la base vers le format frontend
function mapGradeToFrontend(
  grade: any, 
  module: any, 
  examType: "Interrogation" | "Devoir" | "Composition",
  key: string,
  semestre: string
): GradeDetail {
  let gradeValue = 0;
  
  // Déterminer la valeur de la note selon le type d'examen
  switch (examType) {
    case "Interrogation":
      if (key === "I1") gradeValue = grade.interrogation1 || 0;
      else if (key === "I2") gradeValue = grade.interrogation2 || 0;
      else if (key === "I3") gradeValue = grade.interrogation3 || 0;
      break;
    case "Devoir":
      gradeValue = grade.devoir || 0;
      break;
    case "Composition":
      gradeValue = grade.composition || 0;
      break;
  }

  return {
    module: module.nom,
    examType,
    grade: gradeValue,
    coefficient: module.coefficient,
    key,
    semestre: semestre
  };
}

// Fonction pour calculer la moyenne générale CORRIGÉE
function calculateGeneralAverage(grades: GradeDetail[]): number {
  if (grades.length === 0) return 0;

  const moduleAverages: { [key: string]: { sum: number; count: number; coefficient: number } } = {};

  // Calculer la moyenne par module (uniquement les notes > 0)
  grades.forEach(grade => {
    if (grade.grade > 0) {
      if (!moduleAverages[grade.module]) {
        moduleAverages[grade.module] = { sum: 0, count: 0, coefficient: grade.coefficient };
      }
      moduleAverages[grade.module].sum += grade.grade;
      moduleAverages[grade.module].count += 1;
    }
  });

  // Calculer la moyenne générale pondérée
  let totalWeightedSum = 0;
  let totalCoefficients = 0;

  Object.entries(moduleAverages).forEach(([moduleName, module]) => {
    if (module.count > 0) {
      const moduleAverage = module.sum / module.count;
      totalWeightedSum += moduleAverage * module.coefficient;
      totalCoefficients += module.coefficient;
      console.log(`📊 Module ${moduleName}: moyenne=${moduleAverage.toFixed(2)}, coeff=${module.coefficient}`);
    }
  });

  const generalAverage = totalCoefficients > 0 ? totalWeightedSum / totalCoefficients : 0;
  console.log(`🎯 Moyenne générale calculée: ${generalAverage.toFixed(2)}`);
  
  return generalAverage;
}

// Fonction pour générer le résumé des notes CORRIGÉE
function generateGradesSummary(
  detailedGrades: GradeDetail[], 
  generalAverage: number,
  studentName: string,
  allModules: string[]
): GradeSummaryItem[] {
  // Compter les notes existantes (grade > 0)
  const existingGradesCount = detailedGrades.filter(grade => grade.grade > 0).length;
  const modulesWithGrades = new Set(detailedGrades.filter(g => g.grade > 0).map(g => g.module)).size;

  // Trouver la matière la plus faible (uniquement les notes > 0)
  const moduleAverages: { [key: string]: { sum: number; count: number } } = {};
  
  detailedGrades.forEach(grade => {
    if (grade.grade > 0) {
      if (!moduleAverages[grade.module]) {
        moduleAverages[grade.module] = { sum: 0, count: 0 };
      }
      moduleAverages[grade.module].sum += grade.grade;
      moduleAverages[grade.module].count += 1;
    }
  });

  let weakestSubject = "Aucune";
  let weakestAverage = 20;
  let strongestSubject = "Aucune";
  let strongestAverage = 0;

  Object.entries(moduleAverages).forEach(([module, data]) => {
    const average = data.sum / data.count;
    if (average < weakestAverage) {
      weakestAverage = average;
      weakestSubject = module;
    }
    if (average > strongestAverage) {
      strongestAverage = average;
      strongestSubject = module;
    }
  });

  // Calculer les modules restants à évaluer
  const remainingModules = Math.max(0, allModules.length - modulesWithGrades);

  return [
    {
      title: "Moyenne Générale",
      value: `${generalAverage.toFixed(1)} / 20`,
      icon: "FaAward",
      color: "text-green-600",
      description: `Basée sur ${modulesWithGrades} module(s) évalué(s)`,
    },
    {
      title: "Notes Saisies",
      value: `${existingGradesCount} notes`,
      icon: "FaChartLine",
      color: "text-blue-600",
      description: `Réparties sur ${modulesWithGrades} module(s)`,
    },
    {
      title: "Matière la plus faible",
      value: weakestSubject,
      icon: "FaArrowDown",
      color: "text-red-600",
      description: weakestSubject !== "Aucune" ? `Moyenne: ${weakestAverage.toFixed(1)}/20` : "Aucune note disponible",
    },
    {
      title: "Évaluations restantes",
      value: `${remainingModules}`,
      icon: "FaClipboardList",
      color: "text-orange-600",
      description: remainingModules > 0 ? `${remainingModules} module(s) sans note` : "Tous modules évalués",
    },
  ];
}

// Fonction pour créer des notes structurées par module CORRIGÉE
function createStructuredGrades(modules: any[], existingGrades: any[]): GradeDetail[] {
  const allDetailedGrades: GradeDetail[] = [];

  modules.forEach(module => {
    const semestre = module.semestre?.nom || "S1";
    
    // Chercher si ce module a des notes existantes
    const moduleGrades = existingGrades.find(g => g.moduleId === module.id);
    
    if (moduleGrades) {
      // Ajouter les notes existantes
      if (moduleGrades.interrogation1 !== null) {
        allDetailedGrades.push(mapGradeToFrontend(moduleGrades, module, "Interrogation", "I1", semestre));
      }
      if (moduleGrades.interrogation2 !== null) {
        allDetailedGrades.push(mapGradeToFrontend(moduleGrades, module, "Interrogation", "I2", semestre));
      }
      if (moduleGrades.interrogation3 !== null) {
        allDetailedGrades.push(mapGradeToFrontend(moduleGrades, module, "Interrogation", "I3", semestre));
      }
      if (moduleGrades.devoir !== null) {
        allDetailedGrades.push(mapGradeToFrontend(moduleGrades, module, "Devoir", "D1", semestre));
      }
      if (moduleGrades.composition !== null) {
        allDetailedGrades.push(mapGradeToFrontend(moduleGrades, module, "Composition", "C1", semestre));
      }
    }
    
    // Ajouter les emplacements vides pour les notes manquantes
    const examTypes = [
      { type: "Interrogation" as const, keys: ["I1", "I2", "I3"] },
      { type: "Devoir" as const, keys: ["D1"] },
      { type: "Composition" as const, keys: ["C1"] }
    ];

    examTypes.forEach(examType => {
      examType.keys.forEach(key => {
        // Vérifier si cette note n'existe pas déjà
        const exists = allDetailedGrades.some(grade => 
          grade.module === module.nom && 
          grade.examType === examType.type && 
          grade.key === key
        );
        
        if (!exists) {
          allDetailedGrades.push({
            module: module.nom,
            examType: examType.type,
            grade: 0, // 0 signifie "pas de note"
            coefficient: module.coefficient,
            key,
            semestre
          });
        }
      });
    });
  });

  return allDetailedGrades;
}

// Fonction pour obtenir les semestres uniques à partir des modules
function getUniqueSemestresFromModules(modules: any[]): string[] {
  const semestres = new Set<string>();
  
  modules.forEach(module => {
    if (module.semestre?.nom) {
      semestres.add(module.semestre.nom);
    }
  });

  // Si aucun semestre trouvé, ajouter S1 par défaut
  if (semestres.size === 0) {
    semestres.add("S1");
  }

  return Array.from(semestres).sort();
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log(`📊 Récupération des notes pour l'utilisateur Clerk: ${userId}`);

    // Récupérer le profil étudiant
    const studentData = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        student: {
          include: {
            filiere: true,
            vague: true,
            grades: {
              include: {
                module: {
                  include: {
                    semestre: true
                  }
                }
              },
              orderBy: {
                updatedAt: 'desc'
              }
            }
          }
        }
      }
    });

    if (!studentData) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (!studentData.student) {
      return NextResponse.json({ 
        error: "Profil étudiant non trouvé",
        message: "Votre compte n'est pas configuré comme étudiant"
      }, { status: 400 });
    }

    const student = studentData.student;
    console.log(`✅ Étudiant trouvé: ${studentData.firstName} ${studentData.lastName}`);
    console.log(`📝 ${student.grades.length} notes trouvées dans l'étudiant`);

    // Récupérer tous les modules de la filière de l'étudiant avec leurs semestres
    const allModules = await prisma.module.findMany({
      where: {
        filiereId: student.filiereId || undefined
      },
      include: {
        semestre: true
      },
      orderBy: [
        {
          semestre: {
            nom: 'asc'
          }
        },
        {
          nom: 'asc'
        }
      ]
    });

    console.log(`📚 ${allModules.length} modules trouvés dans la filière`);

    // Obtenir les semestres uniques
    const allSemestres = getUniqueSemestresFromModules(allModules);
    console.log(`🎓 Semestres trouvés:`, allSemestres);

    // Créer les notes structurées
    const detailedGrades = createStructuredGrades(allModules, student.grades);
    
    // Filtrer les notes existantes (grade > 0) pour le calcul de moyenne
    const existingGradesForAverage = detailedGrades.filter(grade => grade.grade > 0);
    
    // Calculer la moyenne générale
    const generalAverage = calculateGeneralAverage(existingGradesForAverage);

    // Données de l'étudiant
    const studentInfo: StudentData = {
      studentName: `${studentData.firstName} ${studentData.lastName}`,
      studentClass: student.filiere?.nom || "Non assigné",
      studentStatus: "inscrit",
      filiere: student.filiere?.nom || "Non assigné",
      vague: student.vague?.nom || "Non assigné"
    };

    // Générer le résumé des notes
    const moduleNames = allModules.map(m => m.nom);
    const gradesSummary = generateGradesSummary(
      detailedGrades, 
      generalAverage, 
      studentInfo.studentName,
      moduleNames
    );

    const response: ApiResponse = {
      studentData: studentInfo,
      gradesSummary,
      detailedGrades,
      generalAverage,
      allSemestres: allSemestres,
      allModules: moduleNames,
      success: true
    };

    console.log(`✅ Données préparées: ${detailedGrades.length} entrées de notes`);
    console.log(`📊 Notes existantes: ${existingGradesForAverage.length}`);
    console.log(`🎯 Moyenne générale: ${generalAverage.toFixed(2)}`);

    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Erreur récupération des notes:", error);
    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la récupération des notes",
        details: error instanceof Error ? error.message : "Erreur inconnue",
        success: false
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}