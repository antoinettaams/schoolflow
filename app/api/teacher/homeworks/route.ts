// app/api/teachers/homeworks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Interface pour les exercices - CORRIGÉE
interface Homework {
  id: string;
  filiere: string;
  title: string;
  exerciseType: string;
  pages?: string;  // Rendue optionnelle
  content?: string; // Rendue optionnelle
  date: string;
  vague: string;
  module: string;
  deadline: string;
  status: "actif" | "archivé";
  fileUrl?: string;
  teacherId: string;
  filiereId?: number;
  vagueId?: string;
  moduleId?: number;
}

// GET - Récupérer tous les exercices du professeur
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer le professeur
    const teacher = await prisma.teacher.findFirst({
      where: {
        user: {
          clerkUserId: clerkUserId
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Professeur non trouvé" }, { status: 404 });
    }

    // Récupérer les exercices créés par ce professeur
    const homeworks = await prisma.homework.findMany({
      where: {
        teacherId: teacher.id
      },
      include: {
        filiere: {
          select: {
            nom: true
          }
        },
        vague: {
          select: {
            nom: true
          }
        },
        module: {
          select: {
            nom: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transformer les données pour le frontend - CORRIGÉ
    const formattedHomeworks: Homework[] = homeworks.map((hw) => ({
      id: hw.id,
      filiere: hw.filiere?.nom || "Non assigné",
      title: hw.title,
      exerciseType: hw.exerciseType,
      pages: hw.pages || undefined,  // Convertit null en undefined
      content: hw.content || undefined, // Convertit null en undefined
      date: hw.date.toISOString().split('T')[0],
      vague: hw.vague?.nom || "Non assigné",
      module: hw.module?.nom || "Non assigné",
      deadline: hw.deadline.toISOString().split('T')[0],
      status: hw.status as "actif" | "archivé",
      fileUrl: hw.fileUrl || undefined,
      teacherId: hw.teacherId,
      filiereId: hw.filiereId || undefined,
      vagueId: hw.vagueId || undefined,
      moduleId: hw.moduleId || undefined
    }));

    // Récupérer les filières, vagues et modules disponibles pour le formulaire
    const [filieres, vagues, teacherModules] = await Promise.all([
      // Filieres
      prisma.filiere.findMany({
        select: {
          id: true,
          nom: true
        }
      }),
      // Vagues
      prisma.vague.findMany({
        select: {
          id: true,
          nom: true
        }
      }),
      // Modules assignés à ce professeur
      prisma.planningAssignation.findMany({
        where: {
          teacherId: teacher.id
        },
        include: {
          module: {
            select: {
              id: true,
              nom: true
            }
          },
          filiere: {
            select: {
              id: true,
              nom: true
            }
          }
        },
        distinct: ['moduleId']
      })
    ]);

    // Modules uniques avec leurs filières
    const modules = teacherModules.map((tm) => ({
      id: tm.module.id,
      nom: tm.module.nom,
      filiere: tm.filiere.nom,
      filiereId: tm.filiere.id
    }));

    const responseData = {
      homeworks: formattedHomeworks,
      availableData: {
        filieres,
        vagues,
        modules
      },
      teacherInfo: {
        name: `${teacher.user.firstName} ${teacher.user.lastName}`,
        id: teacher.id
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("❌ Erreur récupération exercices:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des exercices" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel exercice
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const {
      filiereId,
      title,
      exerciseType,
      pages,
      content,
      date,
      vagueId,
      moduleId,
      deadline
    } = body;

    // Validation des champs requis
    if (!filiereId || !title || !vagueId || !moduleId || !deadline) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
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

    // Créer l'exercice
    const homework = await prisma.homework.create({
      data: {
        title,
        exerciseType: exerciseType || "Exercice",
        pages: pages || null,
        content: content || null,
        date: new Date(date),
        deadline: new Date(deadline),
        status: "actif",
        teacherId: teacher.id,
        filiereId: parseInt(filiereId),
        vagueId: vagueId,
        moduleId: parseInt(moduleId)
      },
      include: {
        filiere: {
          select: {
            nom: true
          }
        },
        vague: {
          select: {
            nom: true
          }
        },
        module: {
          select: {
            nom: true
          }
        }
      }
    });

    // Formater la réponse - CORRIGÉ
    const formattedHomework: Homework = {
      id: homework.id,
      filiere: homework.filiere?.nom || "Non assigné",
      title: homework.title,
      exerciseType: homework.exerciseType,
      pages: homework.pages || undefined,  // Convertit null en undefined
      content: homework.content || undefined, // Convertit null en undefined
      date: homework.date.toISOString().split('T')[0],
      vague: homework.vague?.nom || "Non assigné",
      module: homework.module?.nom || "Non assigné",
      deadline: homework.deadline.toISOString().split('T')[0],
      status: homework.status as "actif" | "archivé",
      teacherId: homework.teacherId,
      filiereId: homework.filiereId || undefined,
      vagueId: homework.vagueId || undefined,
      moduleId: homework.moduleId || undefined
    };

    return NextResponse.json({
      message: "Exercice créé avec succès",
      homework: formattedHomework
    });

  } catch (error) {
    console.error("❌ Erreur création exercice:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'exercice" },
      { status: 500 }
    );
  }
}

// PUT - Modifier un exercice
export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      filiereId,
      title,
      exerciseType,
      pages,
      content,
      date,
      vagueId,
      moduleId,
      deadline,
      status
    } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de l'exercice requis" }, { status: 400 });
    }

    // Vérifier que l'exercice appartient au professeur
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

    const homework = await prisma.homework.findFirst({
      where: {
        id: id,
        teacherId: teacher.id
      }
    });

    if (!homework) {
      return NextResponse.json({ error: "Exercice non trouvé" }, { status: 404 });
    }

    // Mettre à jour l'exercice
    const updatedHomework = await prisma.homework.update({
      where: { id: id },
      data: {
        ...(filiereId && { filiereId: parseInt(filiereId) }),
        ...(title && { title }),
        ...(exerciseType && { exerciseType }),
        ...(pages !== undefined && { pages: pages || null }),
        ...(content !== undefined && { content: content || null }),
        ...(date && { date: new Date(date) }),
        ...(vagueId && { vagueId }),
        ...(moduleId && { moduleId: parseInt(moduleId) }),
        ...(deadline && { deadline: new Date(deadline) }),
        ...(status && { status })
      },
      include: {
        filiere: {
          select: {
            nom: true
          }
        },
        vague: {
          select: {
            nom: true
          }
        },
        module: {
          select: {
            nom: true
          }
        }
      }
    });

    // Formater la réponse - CORRIGÉ
    const formattedHomework: Homework = {
      id: updatedHomework.id,
      filiere: updatedHomework.filiere?.nom || "Non assigné",
      title: updatedHomework.title,
      exerciseType: updatedHomework.exerciseType,
      pages: updatedHomework.pages || undefined,  // Convertit null en undefined
      content: updatedHomework.content || undefined, // Convertit null en undefined
      date: updatedHomework.date.toISOString().split('T')[0],
      vague: updatedHomework.vague?.nom || "Non assigné",
      module: updatedHomework.module?.nom || "Non assigné",
      deadline: updatedHomework.deadline.toISOString().split('T')[0],
      status: updatedHomework.status as "actif" | "archivé",
      teacherId: updatedHomework.teacherId,
      filiereId: updatedHomework.filiereId || undefined,
      vagueId: updatedHomework.vagueId || undefined,
      moduleId: updatedHomework.moduleId || undefined
    };

    return NextResponse.json({
      message: "Exercice modifié avec succès",
      homework: formattedHomework
    });

  } catch (error) {
    console.error("❌ Erreur modification exercice:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification de l'exercice" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un exercice
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID de l'exercice requis" }, { status: 400 });
    }

    // Vérifier que l'exercice appartient au professeur
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

    const homework = await prisma.homework.findFirst({
      where: {
        id: id,
        teacherId: teacher.id
      }
    });

    if (!homework) {
      return NextResponse.json({ error: "Exercice non trouvé" }, { status: 404 });
    }

    // Supprimer l'exercice
    await prisma.homework.delete({
      where: { id: id }
    });

    return NextResponse.json({
      message: "Exercice supprimé avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur suppression exercice:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'exercice" },
      { status: 500 }
    );
  }
}