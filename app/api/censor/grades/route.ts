// app/api/censor/grades/route.ts
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

// Fonction pour calculer la moyenne d'un grade
function calculateGradeAverage(grade: any): number | null {
  const notes = [
    grade.interrogation1,
    grade.interrogation2, 
    grade.interrogation3,
    grade.devoir,
    grade.composition
  ].filter(note => note !== null) as number[];

  if (notes.length === 0) {
    return null;
  }

  // Si composition existe, elle a plus de poids
  if (grade.composition !== null) {
    return grade.composition;
  }

  // Calcul de moyenne simple
  const sum = notes.reduce((acc, note) => acc + note, 0);
  return Math.round((sum / notes.length) * 10) / 10;
}

// Fonction pour synchroniser l'utilisateur Clerk avec la base de données
async function syncUserWithDatabase(clerkUserId: string) {
  try {
    console.log("🔄 Synchronisation de l'utilisateur:", clerkUserId);
    
    // Récupérer les infos de l'utilisateur depuis Clerk
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      throw new Error("Utilisateur Clerk non trouvé");
    }

    // Vérifier si l'utilisateur existe déjà dans la base
    const existingUser = await prisma.user.findFirst({
      where: { clerkUserId },
      select: { id: true, role: true, email: true }
    });

    if (existingUser) {
      console.log("✅ Utilisateur déjà synchronisé:", existingUser);
      return existingUser;
    }

    // Créer un nouvel utilisateur dans la base
    const email = sessionClaims?.email as string || `${clerkUserId}@schoolflow.com`;
    const firstName = sessionClaims?.firstName as string || "Utilisateur";
    const lastName = sessionClaims?.lastName as string || "Clerk";
    const metadata = sessionClaims?.metadata as any;

    // Déterminer le rôle depuis les métadonnées Clerk
    let role: string = "CENSEUR";

    if (metadata?.role) {
      role = metadata.role;
    }

    console.log("🎯 Tentative de création d'utilisateur avec rôle:", role);

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

    console.log("✅ Nouvel utilisateur créé:", newUser);
    return newUser;

  } catch (error) {
    console.error("❌ Erreur synchronisation utilisateur:", error);
    
    // En cas d'erreur, essayez avec un rôle CENSEUR par défaut
    try {
      console.log("🔄 Tentative avec rôle CENSEUR par défaut...");
      
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

      console.log("✅ Utilisateur créé avec rôle CENSEUR par défaut:", fallbackUser);
      return fallbackUser;

    } catch (fallbackError) {
      console.error("❌ Erreur même avec rôle CENSEUR:", fallbackError);
      throw error;
    }
  }
}

// Middleware d'authentification et autorisation
async function authenticateUser() {
  try {
    const { userId } = await auth();
    console.log("🔐 UserId from Clerk:", userId);

    if (!userId) {
      return { error: "Non authentifié", status: 401 };
    }

    // Synchroniser l'utilisateur avec la base de données
    const user = await syncUserWithDatabase(userId);
    
    if (!user) {
      return { error: "Erreur de synchronisation utilisateur", status: 500 };
    }

    console.log("🎭 Rôle de l'utilisateur:", user.role);
    
    // Vérifier les autorisations
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
    // Authentification
    const authResult = await authenticateUser();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    console.log("🔍 Récupération des grades pour le censeur...");

    // Récupération des paramètres de filtre
    const { searchParams } = new URL(request.url);
    const filiereId = searchParams.get("filiere");
    const vagueId = searchParams.get("vague");
    const moduleId = searchParams.get("module");
    const studentId = searchParams.get("student");

    // Construction du filtre
    const whereClause: any = {};
    if (filiereId) whereClause.filiereId = parseInt(filiereId);
    if (vagueId) whereClause.vagueId = vagueId;
    if (moduleId) whereClause.moduleId = parseInt(moduleId);
    if (studentId) whereClause.studentId = studentId;

    // Récupération des grades avec toutes les relations
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

    // Formatage des données avec calcul des moyennes
    const formattedGrades: GradeData[] = grades.map(grade => {
      const moyenne = calculateGradeAverage(grade);

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
      };
    });

    // Calcul des statistiques
    const allAverages = formattedGrades
      .map(g => g.moyenne)
      .filter(avg => avg !== null) as number[];

    const averageGeneral = allAverages.length > 0 
      ? Math.round((allAverages.reduce((a, b) => a + b, 0) / allAverages.length) * 10) / 10
      : 0;

    // Statistiques par filière
    const gradesByFiliere = formattedGrades.reduce((acc, grade) => {
      const filiereName = grade.filiere.nom;
      if (!acc[filiereName]) {
        acc[filiereName] = 0;
      }
      acc[filiereName]++;
      return acc;
    }, {} as Record<string, number>);

    // Statistiques par vague
    const gradesByVague = formattedGrades.reduce((acc, grade) => {
      const vagueName = grade.vague.nom;
      if (!acc[vagueName]) {
        acc[vagueName] = 0;
      }
      acc[vagueName]++;
      return acc;
    }, {} as Record<string, number>);

    // Récupération des filtres disponibles
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
      formulaUsed
    } = body;

    // Validation des données requises
    if (!studentId || !moduleId || !filiereId || !vagueId || !teacherId) {
      return NextResponse.json(
        { error: "Données manquantes pour la sauvegarde" },
        { status: 400 }
      );
    }

    // Vérifier si le grade existe déjà
    const existingGrade = await prisma.grade.findUnique({
      where: {
        studentId_moduleId_filiereId_vagueId: {
          studentId,
          moduleId: parseInt(moduleId),
          filiereId: parseInt(filiereId),
          vagueId
        }
      }
    });

    let grade;
    if (existingGrade) {
      // Mise à jour du grade existant
      grade = await prisma.grade.update({
        where: { id: existingGrade.id },
        data: {
          interrogation1: interrogation1 !== undefined ? parseFloat(interrogation1) : null,
          interrogation2: interrogation2 !== undefined ? parseFloat(interrogation2) : null,
          interrogation3: interrogation3 !== undefined ? parseFloat(interrogation3) : null,
          devoir: devoir !== undefined ? parseFloat(devoir) : null,
          composition: composition !== undefined ? parseFloat(composition) : null,
          rang: rang !== undefined ? parseInt(rang) : null,
          formulaUsed: formulaUsed || null,
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
          }
        }
      });
      console.log("✅ Grade mis à jour:", grade.id);
    } else {
      // Création d'un nouveau grade
      grade = await prisma.grade.create({
        data: {
          studentId,
          moduleId: parseInt(moduleId),
          filiereId: parseInt(filiereId),
          vagueId,
          teacherId,
          interrogation1: interrogation1 !== undefined ? parseFloat(interrogation1) : null,
          interrogation2: interrogation2 !== undefined ? parseFloat(interrogation2) : null,
          interrogation3: interrogation3 !== undefined ? parseFloat(interrogation3) : null,
          devoir: devoir !== undefined ? parseFloat(devoir) : null,
          composition: composition !== undefined ? parseFloat(composition) : null,
          rang: rang !== undefined ? parseInt(rang) : null,
          formulaUsed: formulaUsed || null,
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
          }
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

    // Vérifier que le grade existe
    const existingGrade = await prisma.grade.findUnique({
      where: { id }
    });

    if (!existingGrade) {
      return NextResponse.json({ error: "Grade non trouvé" }, { status: 404 });
    }

    // Supprimer le grade
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
      formulaUsed
    } = body;

    if (!id) {
      return NextResponse.json({ error: "ID du grade manquant" }, { status: 400 });
    }

    // Vérifier que le grade existe
    const existingGrade = await prisma.grade.findUnique({
      where: { id }
    });

    if (!existingGrade) {
      return NextResponse.json({ error: "Grade non trouvé" }, { status: 404 });
    }

    // Mise à jour du grade
    const updatedGrade = await prisma.grade.update({
      where: { id },
      data: {
        interrogation1: interrogation1 !== undefined ? parseFloat(interrogation1) : null,
        interrogation2: interrogation2 !== undefined ? parseFloat(interrogation2) : null,
        interrogation3: interrogation3 !== undefined ? parseFloat(interrogation3) : null,
        devoir: devoir !== undefined ? parseFloat(devoir) : null,
        composition: composition !== undefined ? parseFloat(composition) : null,
        rang: rang !== undefined ? parseInt(rang) : null,
        formulaUsed: formulaUsed || null,
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
        }
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