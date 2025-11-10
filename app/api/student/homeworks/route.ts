import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Exportez une fonction nommée pour chaque méthode HTTP
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'étudiant
    const student = await prisma.student.findFirst({
      where: {
        user: {
          clerkUserId: clerkUserId
        }
      },
      include: {
        filiere: true,
        vague: true
      }
    });

    if (!student) {
      return NextResponse.json({ error: "Étudiant non trouvé" }, { status: 404 });
    }

    // Récupérer les exercices pour cet étudiant
    const homeworks = await prisma.homework.findMany({
      where: {
        status: "actif",
        OR: [
          // Exercices pour sa filière et sa vague
          {
            filiereId: student.filiereId,
            vagueId: student.vagueId
          },
          // Ou exercices sans filière/vague spécifique (pour tous)
          {
            filiereId: null,
            vagueId: null
          }
        ]
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
        },
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        deadline: 'asc'
      }
    });

    return NextResponse.json({ homeworks });

  } catch (error) {
    console.error("❌ Erreur récupération exercices étudiant:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des exercices" },
      { status: 500 }
    );
  }
}

// Vous pouvez aussi ajouter d'autres méthodes si nécessaire
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: "Méthode non autorisée" }, { status: 405 });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ error: "Méthode non autorisée" }, { status: 405 });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ error: "Méthode non autorisée" }, { status: 405 });
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({ error: "Méthode non autorisée" }, { status: 405 });
}