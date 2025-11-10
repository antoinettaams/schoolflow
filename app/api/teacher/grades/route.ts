import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Interface pour les notes
interface GradeData {
  studentId: string;
  interrogation1?: number;
  interrogation2?: number;
  interrogation3?: number;
  devoir?: number;
  composition?: number;
  rang?: number;
}

// GET - Récupérer toutes les données (modules, étudiants, notes)
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const moduleId = searchParams.get('moduleId');
    const filiereId = searchParams.get('filiereId');
    const vagueId = searchParams.get('vagueId');

    console.log('🔍 API Grades appelée avec action:', action);
    console.log('📋 Paramètres:', { moduleId, filiereId, vagueId });

    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer le professeur
    const teacher = await prisma.teacher.findFirst({
      where: {
        user: {
          clerkUserId: clerkUserId
        }
      }
    });

    console.log('👨‍🏫 Professeur trouvé:', teacher?.id);

    if (!teacher) {
      return NextResponse.json({ error: "Professeur non trouvé" }, { status: 404 });
    }

    // Action 1: Récupérer les modules assignés
    if (action === 'modules') {
      try {
        console.log('🔍 Recherche des modules pour le professeur:', teacher.id);
        
        const modulesAssignments = await prisma.planningAssignation.findMany({
          where: {
            teacherId: teacher.id
          },
          include: {
            module: {
              include: {
                filiere: true
              }
            },
            filiere: true,
            vague: true
          }
        });

        console.log('📦 Assignations trouvées:', modulesAssignments.length);
        console.log('📋 Détails assignations:', JSON.stringify(modulesAssignments, null, 2));

        if (modulesAssignments.length === 0) {
          console.log('❌ Aucune assignation trouvée pour ce professeur');
          return NextResponse.json({ 
            modules: [],
            warning: "Aucun module assigné à ce professeur"
          });
        }

        // Filtrer les modules uniques
        const uniqueModules = modulesAssignments.reduce((acc, assignment) => {
          const exists = acc.find((item: any) => item.module.id === assignment.module.id);
          if (!exists && assignment.module && assignment.filiere && assignment.vague) {
            acc.push(assignment);
          }
          return acc;
        }, [] as any[]);

       // Dans votre API route (/api/teacher/grades), modifiez la partie qui formate les modules :

const formattedModules = uniqueModules.map(assignment => ({
  id: assignment.module.id,
  name: assignment.module.nom,
  coefficient: assignment.module.coefficient,
  filiere: assignment.filiere.nom,
  filiereId: assignment.filiere.id,
  vague: assignment.vague.nom,
  vagueId: assignment.vague.id,
  semestre: assignment.module.semestre || `Semestre ${assignment.module.semestre || "1"}` // Correction ici
}));

        console.log('🎯 Modules uniques formatés:', formattedModules);

        return NextResponse.json({ 
          modules: formattedModules,
          totalAssignations: modulesAssignments.length,
          uniqueModules: formattedModules.length
        });

      } catch (error) {
        console.error('❌ Erreur récupération modules:', error);
        return NextResponse.json({ 
          error: "Erreur lors de la récupération des modules",
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // Action 2: Récupérer les étudiants par filière/vague
    if (action === 'students' && filiereId && vagueId) {
      try {
        console.log('👥 Recherche étudiants pour filière:', filiereId, 'vague:', vagueId);
        
        const students = await prisma.student.findMany({
          where: {
            filiereId: parseInt(filiereId),
            vagueId: vagueId
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            filiere: true
          }
        });

        console.log('📊 Étudiants trouvés:', students.length);

        const formattedStudents = students.map(student => ({
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          email: student.user.email,
          filiere: student.filiere?.nom || "Non assigné",
          filiereId: student.filiere?.id || 0,
          studentNumber: student.studentNumber
        }));

        return NextResponse.json({ 
          students: formattedStudents,
          count: formattedStudents.length
        });

      } catch (error) {
        console.error('❌ Erreur récupération étudiants:', error);
        return NextResponse.json({ 
          error: "Erreur lors de la récupération des étudiants"
        }, { status: 500 });
      }
    }

    // Action 3: Récupérer les notes pour un module spécifique
    if (action === 'grades' && moduleId && filiereId && vagueId) {
      try {
        console.log('📝 Recherche notes pour module:', moduleId, 'filière:', filiereId, 'vague:', vagueId);
        
        // Vérifier que le professeur est assigné à ce module
        const assignment = await prisma.planningAssignation.findFirst({
          where: {
            teacherId: teacher.id,
            moduleId: parseInt(moduleId),
            filiereId: parseInt(filiereId),
            vagueId: vagueId
          },
          include: {
            module: true
          }
        });

        if (!assignment) {
          console.log('❌ Module non assigné à ce professeur');
          return NextResponse.json({ error: "Module non assigné à ce professeur" }, { status: 403 });
        }

        // Récupérer les étudiants de la filière/vague
        const students = await prisma.student.findMany({
          where: {
            filiereId: parseInt(filiereId),
            vagueId: vagueId
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });

        console.log('👥 Étudiants pour notes:', students.length);

        // Récupérer les notes existantes
        const existingGrades = await prisma.grade.findMany({
          where: {
            moduleId: parseInt(moduleId),
            filiereId: parseInt(filiereId),
            vagueId: vagueId
          }
        });

        console.log('📊 Notes existantes:', existingGrades.length);

        // Combiner étudiants et notes
        const studentGrades = students.map(student => {
          const grade = existingGrades.find(g => g.studentId === student.id);
          return {
            id: student.id,
            name: `${student.user.firstName} ${student.user.lastName}`,
            email: student.user.email,
            studentNumber: student.studentNumber,
            grades: {
              interrogation1: grade?.interrogation1 || undefined,
              interrogation2: grade?.interrogation2 || undefined,
              interrogation3: grade?.interrogation3 || undefined,
              devoir: grade?.devoir || undefined,
              composition: grade?.composition || undefined,
              rang: grade?.rang || undefined
            }
          };
        });

        return NextResponse.json({ 
          grades: studentGrades,
          module: {
            id: parseInt(moduleId),
            name: assignment.module?.nom || "Module",
            coefficient: assignment.module?.coefficient || 1
          },
          studentCount: students.length,
          gradeCount: existingGrades.length
        });

      } catch (error) {
        console.error('❌ Erreur récupération notes:', error);
        return NextResponse.json({ 
          error: "Erreur lors de la récupération des notes"
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      error: "Action non spécifiée ou paramètres manquants",
      availableActions: ["modules", "students", "grades"]
    }, { status: 400 });

  } catch (error) {
    console.error("❌ Erreur API notes:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des données" },
      { status: 500 }
    );
  }
}

// POST - Créer ou mettre à jour les notes
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { moduleId, filiereId, vagueId, grades } = body;

    console.log('💾 Sauvegarde notes:', { moduleId, filiereId, vagueId, gradesCount: grades?.length });

    if (!moduleId || !filiereId || !vagueId || !grades) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // Récupérer le professeur
    const teacher = await prisma.teacher.findFirst({
      where: {
        user: {
          clerkUserId: clerkUserId
        }
      }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Professeur non trouvé" }, { status: 404 });
    }

    // Vérifier que le professeur est assigné à ce module
    const assignment = await prisma.planningAssignation.findFirst({
      where: {
        teacherId: teacher.id,
        moduleId: parseInt(moduleId),
        filiereId: parseInt(filiereId),
        vagueId: vagueId
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: "Module non assigné à ce professeur" }, { status: 403 });
    }

    // Traiter chaque note
    const results = await Promise.all(
      grades.map(async (gradeData: GradeData) => {
        const { studentId, ...grades } = gradeData;

        // Vérifier si la note existe déjà
        const existingGrade = await prisma.grade.findFirst({
          where: {
            studentId: studentId,
            moduleId: parseInt(moduleId),
            filiereId: parseInt(filiereId),
            vagueId: vagueId
          }
        });

        if (existingGrade) {
          // Mettre à jour la note existante
          return await prisma.grade.update({
            where: { id: existingGrade.id },
            data: {
              ...grades,
              updatedAt: new Date()
            }
          });
        } else {
          // Créer une nouvelle note
          return await prisma.grade.create({
            data: {
              studentId: studentId,
              moduleId: parseInt(moduleId),
              filiereId: parseInt(filiereId),
              vagueId: vagueId,
              teacherId: teacher.id,
              ...grades
            }
          });
        }
      })
    );

    console.log('✅ Notes sauvegardées:', results.length);

    return NextResponse.json({ 
      message: "Notes sauvegardées avec succès",
      savedCount: results.length
    });

  } catch (error) {
    console.error("❌ Erreur sauvegarde notes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde des notes" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour les notes (alternative au POST)
export async function PUT(request: NextRequest) {
  return POST(request);
}

// DELETE - Supprimer les notes d'un module
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    const filiereId = searchParams.get('filiereId');
    const vagueId = searchParams.get('vagueId');

    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!moduleId || !filiereId || !vagueId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Récupérer le professeur
    const teacher = await prisma.teacher.findFirst({
      where: {
        user: {
          clerkUserId: clerkUserId
        }
      }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Professeur non trouvé" }, { status: 404 });
    }

    // Supprimer les notes
    const result = await prisma.grade.deleteMany({
      where: {
        moduleId: parseInt(moduleId),
        filiereId: parseInt(filiereId),
        vagueId: vagueId,
        teacherId: teacher.id
      }
    });

    console.log('🗑️ Notes supprimées:', result.count);

    return NextResponse.json({ 
      message: "Notes supprimées avec succès",
      deletedCount: result.count
    });

  } catch (error) {
    console.error("❌ Erreur suppression notes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression des notes" },
      { status: 500 }
    );
  }
}