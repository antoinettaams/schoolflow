import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Interface pour les données de grade formatées
interface GradeData {
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
  semestreId: number | null;
  semestreNom: string | null;
  moyenneModule: number | null;
  appreciation: string | null;
}

// Interface pour la réponse de l'API
interface ApiResponse {
  grades: GradeData[];
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

// ⭐ FONCTION CORRIGÉE : Calcul de la moyenne
function calculateGradeAverage(grade: any): number | null {
  try {
    const notes = [
      grade.interrogation1,
      grade.interrogation2, 
      grade.interrogation3,
      grade.devoir,
      grade.composition
    ].filter(note => note !== null && note !== undefined && !isNaN(note)) as number[];

    if (notes.length === 0) {
      return null;
    }

    let moyenne: number;

    // Si composition existe, elle a plus de poids (50%)
    if (grade.composition !== null && grade.composition !== undefined && !isNaN(grade.composition)) {
      const autresNotes = notes.filter(note => note !== grade.composition);
      
      if (autresNotes.length > 0) {
        const moyenneAutres = autresNotes.reduce((acc, note) => acc + note, 0) / autresNotes.length;
        moyenne = (grade.composition * 0.5) + (moyenneAutres * 0.5);
      } else {
        moyenne = grade.composition;
      }
    } else {
      // Moyenne simple de toutes les notes
      moyenne = notes.reduce((acc, note) => acc + note, 0) / notes.length;
    }

    // Arrondi à 2 décimales
    return Math.round(moyenne * 100) / 100;
  } catch (error) {
    console.error("❌ Erreur calcul moyenne:", error);
    return null;
  }
}

// Fonction pour synchroniser l'utilisateur Clerk avec la base de données
async function syncUserWithDatabase(clerkUserId: string) {
  try {
    console.log("🔄 Synchronisation de l'utilisateur:", clerkUserId);
    
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      throw new Error("Utilisateur Clerk non trouvé");
    }

    const existingUser = await prisma.user.findFirst({
      where: { clerkUserId },
      select: { id: true, role: true, email: true }
    });

    if (existingUser) {
      return existingUser;
    }

    const email = sessionClaims?.email as string || `${clerkUserId}@schoolflow.com`;
    const firstName = sessionClaims?.firstName as string || "Utilisateur";
    const lastName = sessionClaims?.lastName as string || "Clerk";
    const metadata = sessionClaims?.metadata as any;

    let role: string = "CENSEUR";
    if (metadata?.role) {
      role = metadata.role;
    }

    const newUser = await prisma.user.create({
      data: {
        clerkUserId,
        email,
        firstName,
        lastName,
        role: role as any,
        isActive: true,
      },
      select: { id: true, role: true, email: true }
    });

    return newUser;

  } catch (error) {
    console.error("❌ Erreur synchronisation utilisateur:", error);
    
    try {
      const { userId, sessionClaims } = await auth();
      const email = sessionClaims?.email as string || `${clerkUserId}@schoolflow.com`;
      const firstName = sessionClaims?.firstName as string || "Utilisateur";
      const lastName = sessionClaims?.lastName as string || "Clerk";

      const fallbackUser = await prisma.user.create({
        data: {
          clerkUserId,
          email,
          firstName,
          lastName,
          role: "CENSEUR",
          isActive: true,
        },
        select: { id: true, role: true, email: true }
      });

      return fallbackUser;
    } catch (fallbackError) {
      throw error;
    }
  }
}

// Middleware d'authentification et autorisation
async function authenticateUser() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { error: "Non authentifié", status: 401 };
    }

    const user = await syncUserWithDatabase(userId);
    
    if (!user) {
      return { error: "Erreur de synchronisation utilisateur", status: 500 };
    }
    
    if (user.role !== "CENSEUR" && user.role !== "ADMIN") {
      return { 
        error: `Accès non autorisé. Rôle: ${user.role}. Rôles requis: CENSEUR ou ADMIN`, 
        status: 403 
      };
    }

    return { user, error: null, status: null };

  } catch (error) {
    console.error("❌ Erreur authentification:", error);
    return { error: "Erreur d'authentification", status: 500 };
  }
}

// GET - Récupérer les grades
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    console.log("🔍 Récupération des grades pour le censeur...");

    const { searchParams } = new URL(request.url);
    const filiereId = searchParams.get("filiere");
    const vagueId = searchParams.get("vague");
    const moduleId = searchParams.get("module");
    const studentId = searchParams.get("student");

    const whereClause: any = {};
    if (filiereId && filiereId !== "all") whereClause.filiereId = parseInt(filiereId);
    if (vagueId && vagueId !== "all") whereClause.vagueId = vagueId;
    if (moduleId && moduleId !== "all") whereClause.moduleId = parseInt(moduleId);
    if (studentId && studentId !== "all") whereClause.studentId = studentId;

    // ⭐ CORRECTION : Inclure le semestre dans la requête
    const grades = await prisma.grade.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        module: {
          select: {
            id: true,
            nom: true,
            coefficient: true,
            typeModule: true,
          }
        },
        filiere: {
          select: {
            id: true,
            nom: true,
          }
        },
        vague: {
          select: {
            id: true,
            nom: true,
          }
        },
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        semestre: {
          select: {
            id: true,
            nom: true,
          }
        }
      },
      orderBy: [
        { vague: { nom: 'asc' } },
        { filiere: { nom: 'asc' } },
        { student: { user: { lastName: 'asc' } } },
        { module: { nom: 'asc' } }
      ]
    });

    console.log(`📊 ${grades.length} grades trouvés`);

    // ⭐ CORRECTION : Formatage amélioré avec utilisation de moyenneModule
    const formattedGrades: GradeData[] = grades.map(grade => {
      // Utiliser moyenneModule si elle existe, sinon calculer
      const moyenne = grade.moyenneModule !== null ? grade.moyenneModule : calculateGradeAverage(grade);

      return {
        id: grade.id,
        student: {
          id: grade.student.id,
          firstName: grade.student.user.firstName,
          lastName: grade.student.user.lastName,
          studentNumber: grade.student.studentNumber,
        },
        module: {
          id: grade.module.id,
          nom: grade.module.nom,
          coefficient: grade.module.coefficient,
          typeModule: grade.module.typeModule,
        },
        filiere: {
          id: grade.filiere.id,
          nom: grade.filiere.nom,
        },
        vague: {
          id: grade.vague.id,
          nom: grade.vague.nom,
        },
        teacher: {
          id: grade.teacher.id,
          firstName: grade.teacher.user.firstName,
          lastName: grade.teacher.user.lastName,
        },
        notes: {
          interrogation1: grade.interrogation1,
          interrogation2: grade.interrogation2,
          interrogation3: grade.interrogation3,
          devoir: grade.devoir,
          composition: grade.composition,
        },
        moyenne: moyenne,
        rang: grade.rang,
        formulaUsed: grade.formulaUsed,
        createdAt: grade.createdAt.toISOString(),
        updatedAt: grade.updatedAt.toISOString(),
        semestreId: grade.semestreId,
        semestreNom: grade.semestre?.nom || null,
        moyenneModule: grade.moyenneModule,
        appreciation: grade.appreciation
      };
    });

    // Calcul des statistiques
    const validGrades = formattedGrades.filter(g => g.moyenne !== null && g.moyenne !== undefined);
    const averageGeneral = validGrades.length > 0 
      ? Math.round((validGrades.reduce((sum, g) => sum + (g.moyenne || 0), 0) / validGrades.length) * 100) / 100
      : 0;

    const gradesByFiliere = formattedGrades.reduce((acc, grade) => {
      const filiereName = grade.filiere.nom;
      acc[filiereName] = (acc[filiereName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const gradesByVague = formattedGrades.reduce((acc, grade) => {
      const vagueName = grade.vague.nom;
      acc[vagueName] = (acc[vagueName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const [filieres, vagues, modules, students] = await Promise.all([
      prisma.filiere.findMany({
        select: { id: true, nom: true },
        orderBy: { nom: 'asc' }
      }),
      prisma.vague.findMany({
        where: { isActive: true },
        select: { id: true, nom: true },
        orderBy: { nom: 'asc' }
      }),
      prisma.module.findMany({
        select: { id: true, nom: true },
        orderBy: { nom: 'asc' }
      }),
      prisma.student.findMany({
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        },
        orderBy: {
          user: {
            lastName: 'asc'
          }
        }
      })
    ]);

    const stats = {
      totalGrades: formattedGrades.length,
      totalStudents: new Set(formattedGrades.map(g => g.student.id)).size,
      totalModules: new Set(formattedGrades.map(g => g.module.id)).size,
      averageGeneral: averageGeneral,
      gradesByFiliere: Object.entries(gradesByFiliere).map(([filiere, count]) => ({
        filiere,
        count
      })),
      gradesByVague: Object.entries(gradesByVague).map(([vague, count]) => ({
        vague,
        count
      })),
    };

    const filters = {
      filieres: filieres.map(f => ({ id: f.id.toString(), name: f.nom })),
      vagues: vagues.map(v => ({ id: v.id, name: v.nom })),
      modules: modules.map(m => ({ id: m.id.toString(), name: m.nom })),
      students: students.map(s => ({
        id: s.id,
        name: `${s.user.firstName} ${s.user.lastName} (${s.studentNumber})`
      }))
    };

    const response: ApiResponse = {
      grades: formattedGrades,
      stats,
      filters
    };

    console.log("✅ Données grades récupérées avec succès");
    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Erreur récupération des grades:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}

// POST - Créer ou mettre à jour un grade
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    console.log("📥 Données reçues pour sauvegarde:", body);

    const {
      studentId,
      moduleId,
      filiereId,
      vagueId,
      teacherId,
      interrogation1,
      interrogation2,
      interrogation3,
      devoir,
      composition,
      rang,
      formulaUsed,
      appreciation,
      moyenneModule
    } = body;

    if (!studentId || !moduleId || !filiereId || !vagueId || !teacherId) {
      return NextResponse.json(
        { error: "Données manquantes pour la sauvegarde" },
        { status: 400 }
      );
    }

    // Calculer la moyenne si elle n'est pas fournie
    const notesData = {
      interrogation1: interrogation1 !== undefined ? parseFloat(interrogation1) : null,
      interrogation2: interrogation2 !== undefined ? parseFloat(interrogation2) : null,
      interrogation3: interrogation3 !== undefined ? parseFloat(interrogation3) : null,
      devoir: devoir !== undefined ? parseFloat(devoir) : null,
      composition: composition !== undefined ? parseFloat(composition) : null,
    };

    const calculatedMoyenne = calculateGradeAverage(notesData);
    const finalMoyenne = moyenneModule !== undefined ? parseFloat(moyenneModule) : calculatedMoyenne;

    // Vérifier si le grade existe déjà
    const existingGrade = await prisma.grade.findFirst({
      where: {
        studentId,
        moduleId: parseInt(moduleId),
        filiereId: parseInt(filiereId),
        vagueId
      }
    });

    let grade;
    if (existingGrade) {
      grade = await prisma.grade.update({
        where: { id: existingGrade.id },
        data: {
          ...notesData,
          rang: rang !== undefined ? parseInt(rang) : null,
          formulaUsed: formulaUsed || null,
          appreciation: appreciation || null,
          moyenneModule: finalMoyenne,
        },
        include: {
          student: {
            include: { user: { select: { firstName: true, lastName: true } } }
          },
          module: true,
          filiere: true,
          vague: true,
          teacher: {
            include: { user: { select: { firstName: true, lastName: true } } }
          },
          semestre: true
        }
      });
      console.log("✅ Grade mis à jour:", grade.id);
    } else {
      grade = await prisma.grade.create({
        data: {
          studentId,
          moduleId: parseInt(moduleId),
          filiereId: parseInt(filiereId),
          vagueId,
          teacherId,
          ...notesData,
          rang: rang !== undefined ? parseInt(rang) : null,
          formulaUsed: formulaUsed || null,
          appreciation: appreciation || null,
          moyenneModule: finalMoyenne,
        },
        include: {
          student: {
            include: { user: { select: { firstName: true, lastName: true } } }
          },
          module: true,
          filiere: true,
          vague: true,
          teacher: {
            include: { user: { select: { firstName: true, lastName: true } } }
          },
          semestre: true
        }
      });
      console.log("✅ Nouveau grade créé:", grade.id);
    }

    return NextResponse.json({ 
      success: true, 
      grade,
      message: existingGrade ? "Grade mis à jour avec succès" : "Grade créé avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur création/mise à jour grade:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde du grade" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un grade spécifique
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateUser();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await request.json();
    console.log("📝 Données reçues pour mise à jour:", body);

    const {
      id,
      interrogation1,
      interrogation2,
      interrogation3,
      devoir,
      composition,
      rang,
      formulaUsed,
      appreciation,
      moyenneModule
    } = body;

    if (!id) {
      return NextResponse.json({ error: "ID du grade manquant" }, { status: 400 });
    }

    const existingGrade = await prisma.grade.findUnique({
      where: { id }
    });

    if (!existingGrade) {
      return NextResponse.json({ error: "Grade non trouvé" }, { status: 404 });
    }

    // Calculer la moyenne si elle n'est pas fournie
    const notesData = {
      interrogation1: interrogation1 !== undefined ? parseFloat(interrogation1) : existingGrade.interrogation1,
      interrogation2: interrogation2 !== undefined ? parseFloat(interrogation2) : existingGrade.interrogation2,
      interrogation3: interrogation3 !== undefined ? parseFloat(interrogation3) : existingGrade.interrogation3,
      devoir: devoir !== undefined ? parseFloat(devoir) : existingGrade.devoir,
      composition: composition !== undefined ? parseFloat(composition) : existingGrade.composition,
    };

    const calculatedMoyenne = calculateGradeAverage({
      ...existingGrade,
      ...notesData
    });
    const finalMoyenne = moyenneModule !== undefined ? parseFloat(moyenneModule) : calculatedMoyenne;

    const updatedGrade = await prisma.grade.update({
      where: { id },
      data: {
        ...notesData,
        rang: rang !== undefined ? parseInt(rang) : existingGrade.rang,
        formulaUsed: formulaUsed || existingGrade.formulaUsed,
        appreciation: appreciation || existingGrade.appreciation,
        moyenneModule: finalMoyenne,
      },
      include: {
        student: {
          include: { user: { select: { firstName: true, lastName: true } } }
        },
        module: true,
        filiere: true,
        vague: true,
        teacher: {
          include: { user: { select: { firstName: true, lastName: true } } }
        },
        semestre: true
      }
    });

    console.log("✅ Grade mis à jour:", updatedGrade.id);
    
    return NextResponse.json({ 
      success: true, 
      grade: updatedGrade,
      message: "Grade mis à jour avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur mise à jour grade:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du grade" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un grade
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateUser();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID du grade manquant" }, { status: 400 });
    }

    const existingGrade = await prisma.grade.findUnique({
      where: { id }
    });

    if (!existingGrade) {
      return NextResponse.json({ error: "Grade non trouvé" }, { status: 404 });
    }

    await prisma.grade.delete({
      where: { id }
    });

    console.log("✅ Grade supprimé:", id);
    
    return NextResponse.json({ 
      success: true,
      message: "Grade supprimé avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur suppression grade:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du grade" },
      { status: 500 }
    );
  }
}