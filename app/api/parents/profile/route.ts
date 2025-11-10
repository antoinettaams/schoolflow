// app/api/parent/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Types correspondant au frontend
interface ChildData {
  name: string;
  class: string;
  studentId: string;
  filiere: string;
  vague: string;
}

interface UserActivity {
  id: number;
  type: string;
  description: string;
  timestamp: Date;
  icon: string;
}

interface ParentProfileResponse {
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    imageUrl: string | null;
    createdAt: Date;
    phone: string | null;
  };
  childrenData: ChildData[];
  userActivity: UserActivity[];
  success: boolean;
}

// Fonction pour générer l'activité utilisateur
function generateUserActivity(childrenData: ChildData[]): UserActivity[] {
  const now = new Date();
  return [
    {
      id: 1,
      type: "login",
      description: "Connexion réussie",
      timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 heures ago
      icon: "CheckCircle",
    },
    {
      id: 2,
      type: "grade_view",
      description: `Consultation des notes de ${childrenData[0]?.name || "votre enfant"}`,
      timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 jour ago
      icon: "BookOpen",
    },
    {
      id: 3,
      type: "attendance",
      description: "Consultation de l'assiduité",
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 jours ago
      icon: "CheckCircle",
    },
    {
      id: 4,
      type: "schedule",
      description: "Consultation de l'emploi du temps",
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 jours ago
      icon: "Calendar",
    },
  ];
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
            lastName: true,
            email: true
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
            lastName: true,
            email: true
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

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log(`👤 Récupération du profil pour le parent: ${userId}`);

    // Récupérer le profil utilisateur avec les données du parent
    const userData = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        parent: true
      }
    });

    if (!userData) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (!userData.parent) {
      return NextResponse.json({ 
        error: "Profil parent non trouvé",
        message: "Votre compte n'est pas configuré comme parent"
      }, { status: 400 });
    }

    console.log(`🔍 Recherche des enfants pour le parent: "${userData.parent.enfantName}"`);

    // Trouver les enfants associés au parent
    const childrenData: ChildData[] = [];

    // Si le parent a un nom d'enfant spécifié, chercher l'étudiant correspondant
    if (userData.parent.enfantName) {
      const enfant = await findStudentByName(userData.parent.enfantName);
      
      if (enfant) {
        childrenData.push({
          name: `${enfant.user.firstName} ${enfant.user.lastName}`,
          class: enfant.filiere?.nom || "Non assigné",
          studentId: enfant.studentNumber || "Non assigné",
          filiere: enfant.filiere?.nom || "Non assigné",
          vague: enfant.vague?.nom || "Non assigné"
        });
      } else {
        // Si aucun étudiant trouvé, utiliser les données du parent comme fallback
        childrenData.push({
          name: userData.parent.enfantName,
          class: userData.parent.filiere || "Non assigné",
          studentId: "Non assigné",
          filiere: userData.parent.filiere || "Non assigné",
          vague: "Non assigné"
        });
      }
    }

    // Si pas d'enfant spécifié mais le parent a une filière, créer des données basiques
    if (childrenData.length === 0 && userData.parent.filiere) {
      childrenData.push({
        name: "Enfant non spécifié",
        class: userData.parent.filiere,
        studentId: "Non assigné",
        filiere: userData.parent.filiere,
        vague: "Non assigné"
      });
    }

    // Générer l'activité utilisateur
    const userActivity = generateUserActivity(childrenData);

    // Préparer les données de réponse
    const response: ParentProfileResponse = {
      userData: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        imageUrl: null, // Clerk gère les images, on laisse null
        createdAt: userData.createdAt,
        phone: userData.phone
      },
      childrenData,
      userActivity,
      success: true
    };

    console.log(`✅ Profil parent récupéré: ${childrenData.length} enfant(s) trouvé(s)`);

    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Erreur récupération du profil parent:", error);
    
    // En cas d'erreur, retourner des données de base
    const fallbackResponse: ParentProfileResponse = {
      userData: {
        firstName: "Utilisateur",
        lastName: "Parent",
        email: "email@exemple.com",
        imageUrl: null,
        createdAt: new Date(),
        phone: null
      },
      childrenData: [{
        name: "Données temporairement indisponibles",
        class: "Chargement...",
        studentId: "N/A",
        filiere: "Chargement...",
        vague: "Chargement..."
      }],
      userActivity: generateUserActivity([]),
      success: false
    };

    return NextResponse.json(fallbackResponse, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}