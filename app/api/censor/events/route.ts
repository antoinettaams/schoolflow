import { NextResponse } from "next/server";
import { PrismaClient, UserRole } from '@prisma/client'
import { auth, clerkClient } from "@clerk/nextjs/server";

const prisma = new PrismaClient()

// Fonction pour convertir le rôle string en enum UserRole
function convertToUserRole(roleString: string): UserRole {
  const roleMap: Record<string, UserRole> = {
    'admin': UserRole.ADMIN,
    'censeur': UserRole.CENSEUR,
    'secretaire': UserRole.SECRETAIRE,
    'comptable': UserRole.COMPTABLE,
    'enseignant': UserRole.ENSEIGNANT,
    'professeur': UserRole.ENSEIGNANT,
    'étudiant': UserRole.ETUDIANT,
    'etudiant': UserRole.ETUDIANT,
    'student': UserRole.ETUDIANT,
    'parent': UserRole.PARENT,
    'user': UserRole.ETUDIANT
  };

  const lowerRole = roleString.toLowerCase().trim();
  return roleMap[lowerRole] || UserRole.ETUDIANT;
}

// Synchroniser l'utilisateur Clerk avec la base de données
async function syncUserWithDatabase(userId: string) {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    const userRoleString = user.publicMetadata?.role as string || 'user';
    const userRole = convertToUserRole(userRoleString);

    const dbUser = await prisma.user.upsert({
      where: { id: userId },
      update: {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        role: userRole,
        clerkUserId: userId,
        phone: user.primaryPhoneNumber?.phoneNumber || null,
      },
      create: {
        id: userId,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        role: userRole,
        clerkUserId: userId,
        phone: user.primaryPhoneNumber?.phoneNumber || null,
      }
    });

    return dbUser;
  } catch (error) {
    console.error("Erreur synchronisation utilisateur:", error);
    throw new Error("Erreur de synchronisation utilisateur");
  }
}

// Vérifier si l'utilisateur est admin ou censeur
async function checkAdminOrCenseur(userId: string) {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userRole = user.publicMetadata?.role as string || "";
    
    const isAuthorized = userRole && (
      userRole.toLowerCase().includes("admin") ||
      userRole.toLowerCase().includes("censeur") ||
      userRole === "Admin" ||
      userRole === "Censeur"
    );

    return isAuthorized;
  } catch (error) {
    console.error("Erreur vérification rôle:", error);
    return false;
  }
}

// GET - Récupérer TOUS les événements
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const isAuthorized = await checkAdminOrCenseur(userId);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const where: any = {}
    
    if (type && type !== 'all') {
      where.type = type
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { 
        createdAt: 'desc' 
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("❌ Erreur récupération événements:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des événements" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel événement
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const isAuthorized = await checkAdminOrCenseur(userId);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Synchroniser l'utilisateur
    await syncUserWithDatabase(userId);

    const body = await request.json();
    console.log("📦 Données reçues:", body);
    
    const { 
      title, type, location, date, time, description, badge 
    } = body;

    // Validation des données
    if (!title || !type || !location || !date || !time) {
      return NextResponse.json(
        { 
          error: "Tous les champs obligatoires doivent être remplis",
          missingFields: {
            title: !title,
            type: !type,
            location: !location,
            date: !date,
            time: !time
          }
        },
        { status: 400 }
      );
    }

    // Générer les métadonnées obligatoires (day et month)
    const dayAbbrev = getDayAbbreviation(date);
    const month = getMonthFromDate(date);

    console.log("📅 Génération des métadonnées:", {
      inputDate: date,
      dayAbbrev,
      month
    });

    // Préparer les données pour la création
    const eventData = {
      title: title.toString().trim(),
      type: type.toString().trim(),
      location: location.toString().trim(),
      date: date.toString().trim(),
      day: dayAbbrev,
      month: month,
      time: time.toString().trim(),
      description: description ? description.toString().trim() : '',
      badge: badge ? badge.toString().trim() : 'Important',
      icon: getIconByType(type),
      color: getColorByType(type),
      createdById: userId,
    };

    console.log("📝 Données complètes de l'événement:", eventData);

    // Création de l'événement
    try {
      const newEvent = await prisma.event.create({
        data: eventData,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      console.log("✅ Événement créé avec succès:", newEvent.id);
      return NextResponse.json(newEvent, { status: 201 });

    } catch (prismaError: any) {
      console.error("❌ Erreur Prisma détaillée:", {
        code: prismaError.code,
        message: prismaError.message,
        meta: prismaError.meta
      });

      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { error: "Un événement avec ces données existe déjà" },
          { status: 400 }
        );
      }
      
      if (prismaError.code === 'P2025') {
        return NextResponse.json(
          { error: "Utilisateur non trouvé" },
          { status: 404 }
        );
      }

      if (prismaError.code === 'P2003') {
        return NextResponse.json(
          { error: "Référence utilisateur invalide" },
          { status: 400 }
        );
      }

      throw prismaError;
    }

  } catch (error: any) {
    console.error("❌ Erreur création événement:", error);
    
    return NextResponse.json(
      { 
        error: "Erreur lors de la création de l'événement",
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack
        } : undefined
      },
      { status: 500 }
    );
  }
}

// PUT - Modifier un événement
export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const isAuthorized = await checkAdminOrCenseur(userId);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    await syncUserWithDatabase(userId);

    const body = await request.json();
    const { 
      id, title, type, location, date, time, description, badge 
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID de l'événement requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'événement existe
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Générer les métadonnées mises à jour
    const dayAbbrev = getDayAbbreviation(date);
    const month = getMonthFromDate(date);

    // Mise à jour de l'événement
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title: title.toString().trim(),
        type: type.toString().trim(),
        location: location.toString().trim(),
        date: date.toString().trim(),
        day: dayAbbrev,
        month: month,
        time: time.toString().trim(),
        description: description?.toString().trim() || '',
        badge: badge?.toString().trim() || 'Important',
        icon: getIconByType(type),
        color: getColorByType(type)
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(updatedEvent);
  } catch (error: any) {
    console.error("❌ Erreur modification événement:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: "Erreur lors de la modification de l'événement",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un événement
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const isAuthorized = await checkAdminOrCenseur(userId);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    await syncUserWithDatabase(userId);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "ID de l'événement requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'événement existe avant suppression
    const existingEvent = await prisma.event.findUnique({
      where: { id }
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    await prisma.event.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true,
      message: "Événement supprimé avec succès" 
    });
  } catch (error: any) {
    console.error("❌ Erreur suppression événement:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: "Erreur lors de la suppression de l'événement",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// FONCTIONS UTILITAIRES (UNE SEULE VERSION DE CHAQUE FONCTION)

function getDayAbbreviation(dateString: string): string {
  try {
    let date: Date;
    
    // Gérer différents formats de date
    if (dateString.includes('T')) {
      date = new Date(dateString);
    } else if (dateString.includes('-')) {
      date = new Date(dateString + 'T00:00:00');
    } else if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts[0].length === 4) {
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    } else {
      date = new Date(dateString);
    }

    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.warn("⚠️ Date invalide, utilisation de la date actuelle");
      date = new Date();
    }

    const days = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    return days[date.getDay()];
  } catch (error) {
    console.error("❌ Erreur conversion date:", error);
    return 'LUN';
  }
}

function getMonthFromDate(dateString: string): string {
  try {
    let date: Date;
    
    if (dateString.includes('T')) {
      date = new Date(dateString);
    } else if (dateString.includes('-')) {
      date = new Date(dateString + 'T00:00:00');
    } else if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts[0].length === 4) {
        date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    } else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      date = new Date();
    }

    const months = [
      'JAN', 'FEV', 'MAR', 'AVR', 'MAI', 'JUN',
      'JUL', 'AOU', 'SEP', 'OCT', 'NOV', 'DEC'
    ];
    return months[date.getMonth()];
  } catch (error) {
    console.error("❌ Erreur extraction mois:", error);
    return 'JAN';
  }
}

function getIconByType(type: string): string {
  const icons: Record<string, string> = {
    'Réunion': 'Users',
    'Voyage': 'Sun',
    'Congé': 'AlertCircle',
    'Compétition': 'Users',
    'Fête': 'Sun',
    'Sport': 'Users',
    'Culturel': 'Sun',
    'Pédagogique': 'ClipboardList'
  };
  return icons[type] || 'CalendarDays';
}

function getColorByType(type: string): string {
  const colors: Record<string, string> = {
    'Réunion': 'bg-blue-500',
    'Voyage': 'bg-indigo-500',
    'Congé': 'bg-green-500',
    'Compétition': 'bg-purple-500',
    'Fête': 'bg-yellow-500',
    'Sport': 'bg-red-500',
    'Culturel': 'bg-pink-500',
    'Pédagogique': 'bg-teal-500'
  };
  return colors[type] || 'bg-gray-500';
}