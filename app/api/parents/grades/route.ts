// app/api/parent/grades/route.ts - VERSION CORRIGÉE
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

// Fonction pour calculer la moyenne générale
function calculateGeneralAverage(grades: GradeDetail[]): number {
  if (grades.length === 0) return 0;

  const moduleAverages: { [key: string]: { sum: number; count: number; coefficient: number } } = {};

  // Calculer la moyenne par module
  grades.forEach(grade => {
    if (grade.grade > 0) { // Ne considérer que les notes existantes
      if (!moduleAverages[grade.module]) {
        moduleAverages[grade.module] = { sum: 0, count: 0, coefficient: grade.coefficient };
      }
      moduleAverages[grade.module].sum += grade.grade * grade.coefficient;
      moduleAverages[grade.module].count += grade.coefficient;
    }
  });

  // Calculer la moyenne générale pondérée
  let totalWeightedSum = 0;
  let totalCoefficients = 0;

  Object.values(moduleAverages).forEach(module => {
    if (module.count > 0) {
      totalWeightedSum += (module.sum / module.count) * module.coefficient;
      totalCoefficients += module.coefficient;
    }
  });

  return totalCoefficients > 0 ? totalWeightedSum / totalCoefficients : 0;
}

// Fonction pour générer le résumé des notes
function generateGradesSummary(
  detailedGrades: GradeDetail[], 
  generalAverage: number,
  studentName: string,
  allModules: string[]
): GradeSummaryItem[] {
  // Trouver la matière la plus faible
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

  Object.entries(moduleAverages).forEach(([module, data]) => {
    const average = data.sum / data.count;
    if (average < weakestAverage) {
      weakestAverage = average;
      weakestSubject = module;
    }
  });

  // Si aucune matière faible trouvée, prendre la première matière
  if (weakestSubject === "Aucune" && allModules.length > 0) {
    weakestSubject = allModules[0];
  }

  // Compter les modules avec au moins une note
  const modulesWithGrades = new Set(detailedGrades.filter(g => g.grade > 0).map(g => g.module)).size;

  return [
    {
      title: "Moyenne Générale",
      value: `${generalAverage.toFixed(1)} / 20`,
      icon: "FaAward",
      color: "text-green-600",
      description: `Moyenne calculée sur ${modulesWithGrades} module(s)`,
    },
    {
      title: "Modules Évalués",
      value: `${modulesWithGrades} / ${allModules.length}`,
      icon: "FaChartLine",
      color: "text-blue-600",
      description: `Modules avec notes sur ${allModules.length} au total`,
    },
    {
      title: "Matière la plus faible",
      value: weakestSubject,
      icon: "FaArrowDown",
      color: "text-red-600",
      description: weakestSubject !== "Aucune" ? `Moyenne: ${weakestAverage.toFixed(2)}/20` : "Aucune note disponible",
    },
    {
      title: "Prochains Évaluations",
      value: `${Math.min(3, allModules.length - modulesWithGrades)}`,
      icon: "FaClipboardList",
      color: "text-blue-600",
      description: "Modules restant à évaluer",
    },
  ];
}

// Fonction pour créer des notes vides pour tous les modules
function createEmptyGradesForModules(modules: any[]): GradeDetail[] {
  const emptyGrades: GradeDetail[] = [];
  
  modules.forEach(module => {
    const semestre = module.semestre?.nom || "S1";
    
    // Créer des entrées vides pour tous les types d'examens possibles
    const examTypes = [
      { type: "Interrogation" as const, keys: ["I1", "I2", "I3"] },
      { type: "Devoir" as const, keys: ["D1"] },
      { type: "Composition" as const, keys: ["C1"] }
    ];

    examTypes.forEach(examType => {
      examType.keys.forEach(key => {
        emptyGrades.push({
          module: module.nom,
          examType: examType.type,
          grade: 0, // 0 signifie "pas de note"
          coefficient: module.coefficient,
          key,
          semestre
        });
      });
    });
  });

  return emptyGrades;
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

    console.log(`📊 Récupération des notes pour le parent: ${userId}`);

    // Récupérer le profil parent
    const parentData = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        parent: true
      }
    });

    if (!parentData) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (!parentData.parent) {
      return NextResponse.json({ 
        error: "Profil parent non trouvé",
        message: "Votre compte n'est pas configuré comme parent"
      }, { status: 400 });
    }

    console.log(`🔍 Recherche de l'enfant: "${parentData.parent.enfantName}"`);

    // Trouver l'étudiant par nom
    const enfant = await findStudentByName(parentData.parent.enfantName);
    
    if (!enfant) {
      return NextResponse.json({
        error: "Enfant non trouvé",
        message: `Aucun étudiant trouvé correspondant à "${parentData.parent.enfantName}"`
      }, { status: 404 });
    }

    console.log(`✅ Enfant trouvé: ${enfant.user.firstName} ${enfant.user.lastName}`);

    // Récupérer tous les modules de la filière de l'étudiant avec leurs semestres
    const allModules = await prisma.module.findMany({
      where: {
        filiereId: enfant.filiereId || undefined
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

    // Récupérer les notes existantes de l'étudiant avec les modules et semestres
    const existingGrades = await prisma.grade.findMany({
      where: {
        studentId: enfant.id
      },
      include: {
        module: {
          include: {
            semestre: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📝 ${existingGrades.length} notes trouvées pour l'enfant`);
    console.log(`📚 ${allModules.length} modules trouvés dans la filière`);

    // Obtenir les semestres uniques à partir des modules
    const allSemestres = getUniqueSemestresFromModules(allModules);
    console.log(`🎓 Semestres trouvés:`, allSemestres);

    // Transformer les notes existantes en format frontend
    const existingDetailedGrades: GradeDetail[] = [];

    existingGrades.forEach(grade => {
      const module = grade.module;
      const semestre = module.semestre?.nom || "S1";

      // Générer les entrées pour chaque type de note existante
      if (grade.interrogation1 !== null && grade.interrogation1 !== undefined) {
        existingDetailedGrades.push(mapGradeToFrontend(grade, module, "Interrogation", "I1", semestre));
      }
      if (grade.interrogation2 !== null && grade.interrogation2 !== undefined) {
        existingDetailedGrades.push(mapGradeToFrontend(grade, module, "Interrogation", "I2", semestre));
      }
      if (grade.interrogation3 !== null && grade.interrogation3 !== undefined) {
        existingDetailedGrades.push(mapGradeToFrontend(grade, module, "Interrogation", "I3", semestre));
      }
      if (grade.devoir !== null && grade.devoir !== undefined) {
        existingDetailedGrades.push(mapGradeToFrontend(grade, module, "Devoir", "D1", semestre));
      }
      if (grade.composition !== null && grade.composition !== undefined) {
        existingDetailedGrades.push(mapGradeToFrontend(grade, module, "Composition", "C1", semestre));
      }
    });

    // Créer des notes vides pour tous les modules (même sans notes)
    const emptyGrades = createEmptyGradesForModules(allModules);

    // Fusionner les notes existantes avec les notes vides
    // Les notes existantes écrasent les notes vides correspondantes
    const allDetailedGrades = [...emptyGrades];
    
    existingDetailedGrades.forEach(existingGrade => {
      const index = allDetailedGrades.findIndex(emptyGrade => 
        emptyGrade.module === existingGrade.module && 
        emptyGrade.examType === existingGrade.examType && 
        emptyGrade.key === existingGrade.key
      );
      
      if (index !== -1) {
        allDetailedGrades[index] = existingGrade;
      }
    });

    // Calculer la moyenne générale (seulement sur les notes existantes)
    const gradesForAverage = allDetailedGrades.filter(grade => grade.grade > 0);
    const generalAverage = calculateGeneralAverage(gradesForAverage);

    // Données de l'étudiant
    const studentData: StudentData = {
      studentName: `${enfant.user.firstName} ${enfant.user.lastName}`,
      studentClass: enfant.filiere?.nom || "Non assigné",
      studentStatus: "inscrit",
      filiere: enfant.filiere?.nom || "Non assigné",
      vague: enfant.vague?.nom || "Non assigné"
    };

    // Générer le résumé des notes
    const moduleNames = allModules.map(m => m.nom);
    const gradesSummary = generateGradesSummary(
      gradesForAverage, 
      generalAverage, 
      studentData.studentName,
      moduleNames
    );

    const response: ApiResponse = {
      studentData,
      gradesSummary,
      detailedGrades: allDetailedGrades,
      generalAverage,
      allSemestres: allSemestres,
      allModules: moduleNames,
      success: true
    };

    console.log(`✅ Données préparées: ${allDetailedGrades.length} notes (dont ${gradesForAverage.length} avec notes)`);
    console.log(`📊 Semestres disponibles:`, allSemestres);

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

// Fonction pour trouver un étudiant par nom
async function findStudentByName(enfantName: string) {
  const searchTerms = enfantName.trim().toLowerCase();
  const terms = searchTerms.split(' ').filter(term => term.length > 0);

  if (terms.length === 0) return null;

  try {
    // Recherche par nom complet
    let student = await prisma.student.findFirst({
      where: {
        user: {
          OR: [
            {
              AND: [
                { firstName: { equals: terms[0], mode: "insensitive" as any } },
                { lastName: { equals: terms[1] || terms[0], mode: "insensitive" as any } }
              ]
            },
            {
              AND: [
                { firstName: { equals: terms[1] || terms[0], mode: "insensitive" as any } },
                { lastName: { equals: terms[0], mode: "insensitive" as any } }
              ]
            }
          ]
        }
      },
      include: {
        filiere: true,
        vague: true,
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (student) {
      console.log(`✅ Étudiant trouvé par correspondance exacte: ${student.user.firstName} ${student.user.lastName}`);
      return student;
    }

    // Recherche partielle
    student = await prisma.student.findFirst({
      where: {
        user: {
          OR: [
            { firstName: { contains: searchTerms, mode: "insensitive" as any } },
            { lastName: { contains: searchTerms, mode: "insensitive" as any } },
            ...terms.map(term => ({
              firstName: { contains: term, mode: "insensitive" as any }
            })),
            ...terms.map(term => ({
              lastName: { contains: term, mode: "insensitive" as any }
            }))
          ]
        }
      },
      include: {
        filiere: true,
        vague: true,
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (student) {
      console.log(`✅ Étudiant trouvé par recherche partielle: ${student.user.firstName} ${student.user.lastName}`);
    } else {
      console.log(`❌ Aucun étudiant trouvé pour: "${enfantName}"`);
    }

    return student;
  } catch (error) {
    console.error(`❌ Erreur lors de la recherche de l'étudiant:`, error);
    return null;
  }
}