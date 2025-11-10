import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fonction pour convertir les dates françaises en format Date
function parseFrenchDate(dateString: string): Date | null {
  try {
    if (!dateString) return null;
    
    console.log("🔍 Tentative de parsing date française:", dateString);
    
    // Nettoyer la string
    const cleanDate = dateString.trim();
    
    // Si c'est déjà une date ISO, la retourner directement
    if (!isNaN(new Date(cleanDate).getTime())) {
      return new Date(cleanDate);
    }
    
    // Mapping des mois français vers anglais
    const monthMap: { [key: string]: string } = {
      'janvier': 'January', 
      'février': 'February', 
      'mars': 'March', 
      'avril': 'April', 
      'mai': 'May', 
      'juin': 'June',
      'juillet': 'July', 
      'août': 'August', 
      'septembre': 'September',
      'octobre': 'October', 
      'novembre': 'November', 
      'décembre': 'December'
    };
    
    // Regex pour capturer "25 Décembre" ou "25 décembre"
    const match = cleanDate.match(/^(\d{1,2})\s+([a-zA-Zéèêëàâäôöûüç]+)$/i);
    
    if (match) {
      const day = parseInt(match[1]);
      const frenchMonth = match[2].toLowerCase();
      const englishMonth = monthMap[frenchMonth];
      
      if (englishMonth) {
        // Créer une date avec l'année courante
        const currentYear = new Date().getFullYear();
        const dateStr = `${englishMonth} ${day}, ${currentYear}`;
        const date = new Date(dateStr);
        
        if (!isNaN(date.getTime())) {
          console.log(`✅ Date convertie: "${cleanDate}" -> ${date.toISOString()}`);
          return date;
        }
      }
    }
    
    console.warn("❌ Impossible de parser la date française:", cleanDate);
    return null;
    
  } catch (error) {
    console.error("💥 Erreur parsing date française:", error);
    return null;
  }
}

// Formatage sécurisé des dates
function formatDateSafely(dateString: string | Date | null): string {
  try {
    if (!dateString) {
      return "Date non définie";
    }
    
    let date: Date;
    
    // Si c'est déjà un objet Date
    if (dateString instanceof Date) {
      date = dateString;
    } else {
      // Essayer de parser comme date française d'abord
      const frenchDate = parseFrenchDate(dateString);
      if (frenchDate) {
        date = frenchDate;
      } else {
        // Essayer le parsing standard
        date = new Date(dateString);
      }
    }
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      console.warn("❌ Date invalide après parsing:", dateString);
      return dateString as string;
    }
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short', 
      year: 'numeric'
    });
    
  } catch (error) {
    console.error("💥 Erreur formatage date:", error, "Date originale:", dateString);
    return dateString as string;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur et ses données étudiant
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        student: {
          include: {
            filiere: true,
            vague: true
          }
        }
      }
    });

    if (!user || !user.student) {
      return NextResponse.json({ error: "Profil étudiant non trouvé" }, { status: 404 });
    }

    // Récupérer les données pour le dashboard
    const [
      nextCourses,
      examsAndHomeworks,
      latestGrades,
      events,
      bulletin
    ] = await Promise.all([
      getNextCourses(user.student.filiereId!, user.student.vagueId!),
      getExamsAndHomeworks(),
      getLatestGrades(user.id),
      getAllUpcomingEvents(),
      getLatestBulletin(user.id)
    ]);

    const dashboardData = {
      studentInfo: {
        name: `${user.firstName} ${user.lastName}`,
        filiere: user.student.filiere?.nom || "Non assigné",
        statut: "inscrit",
        vague: user.student.vague?.nom || "Non assigné"
      },
      nextCourses,
      examsAndHomeworks,
      latestGrade: latestGrades.length > 0 ? latestGrades[0] : null,
      latestBulletin: bulletin,
      events
    };

    console.log("📊 Dashboard data réelles:", {
      examsHomeworks: examsAndHomeworks.length,
      events: events.length,
      nextCourses: nextCourses.length,
      grades: latestGrades.length,
      bulletin: bulletin ? "disponible" : "non disponible"
    });

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error("Erreur récupération dashboard:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des données" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Récupère les prochains cours réels
async function getNextCourses(filiereId: number, vagueId: string) {
  try {
    const today = new Date();
    
    const planning = await prisma.planningAssignation.findMany({
      where: { 
        filiereId: filiereId,
        vagueId: vagueId
      },
      include: {
        module: {
          select: { nom: true }
        },
        teacher: {
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      },
      take: 2
    });

    if (planning.length === 0) {
      return [{
        course: "Aucun cours programmé",
        time: "---",
        location: "---",
        enseignant: "---"
      }];
    }

    return planning.map(p => {
      const slots = p.scheduleSlots as any;
      const firstSlot = Array.isArray(slots) ? slots[0] : slots;
      
      return {
        course: p.module.nom,
        time: firstSlot ? `${firstSlot.startTime} - ${firstSlot.endTime}` : "Horaire non défini",
        location: firstSlot?.classroom || "Salle non définie",
        enseignant: `${p.teacher.user.firstName} ${p.teacher.user.lastName}`
      };
    });
  } catch (error) {
    console.error("Erreur récupération des cours:", error);
    return [{
      course: "Erreur chargement des cours",
      time: "---",
      location: "---",
      enseignant: "---"
    }];
  }
}

// Récupère les examens et devoirs réels
async function getExamsAndHomeworks() {
  try {
    const now = new Date();
    
    const examsAndHomeworks = await prisma.event.findMany({
      where: {
        OR: [
          { type: { contains: "devoir", mode: 'insensitive' } },
          { type: { contains: "examen", mode: 'insensitive' } },
          { type: { contains: "test", mode: 'insensitive' } },
          { type: { contains: "quiz", mode: 'insensitive' } }
        ],
        date: {
          gte: now.toISOString()
        }
      },
      orderBy: { 
        date: 'asc' 
      },
      take: 5
    });

    console.log("📚 Examens/Devoirs réels trouvés:", examsAndHomeworks.length);

    if (examsAndHomeworks.length === 0) {
      return [{
        subject: "Aucun examen ou devoir à venir",
        type: "information",
        date: "---",
        description: "Aucun examen ou devoir programmé pour le moment",
        location: "---"
      }];
    }

    return examsAndHomeworks.map(item => {
      const isExam = item.type.toLowerCase().includes('examen') || 
                     item.type.toLowerCase().includes('test') ||
                     item.type.toLowerCase().includes('quiz');
      
      return {
        subject: item.title,
        type: isExam ? "examen" : "devoir",
        date: formatDateSafely(item.date),
        description: item.description || (isExam ? `Examen ${item.title}` : `Devoir ${item.title}`),
        location: item.location || "Non spécifié"
      };
    });
  } catch (error) {
    console.error("Erreur récupération examens/devoirs:", error);
    return [{
      subject: "Erreur chargement",
      type: "erreur",
      date: "---",
      description: "Impossible de charger les examens et devoirs",
      location: "---"
    }];
  }
}

// Récupère les notes réelles - VERSION TEMPORAIRE
async function getLatestGrades(studentId: string) {
  try {
    // TEMPORAIRE: En attendant la création du modèle Grade
    // Pour l'instant, retourner un tableau vide
    console.log("📊 Recherche des notes pour l'étudiant:", studentId);
    
    // Si vous avez un modèle temporaire ou autre structure, adaptez ici
    // Pour l'instant, retourner "Aucune note"
    
    return [{
      subject: "Aucune note disponible",
      grade: "---",
      date: "---",
      comment: "Les notes ne sont pas encore disponibles"
    }];

  } catch (error) {
    console.error("Erreur récupération des notes:", error);
    return [{
      subject: "Erreur chargement des notes",
      grade: "---",
      date: "---",
      comment: "Impossible de charger les notes"
    }];
  }
}

// Récupère les événements réels
async function getAllUpcomingEvents() {
  try {
    const now = new Date();
    
    console.log("🔍 Recherche de TOUS les événements réels...");
    
    const allEvents = await prisma.event.findMany({
      where: {
        date: {
          gte: now.toISOString()
        }
      },
      orderBy: { date: 'asc' },
      take: 10
    });

    console.log("📅 Événements réels trouvés:", allEvents.length);
    
    if (allEvents.length === 0) {
      console.log("❌ Aucun événement réel trouvé");
      return [{
        title: "Aucun événement à venir",
        type: "information",
        date: "---",
        description: "Aucun événement programmé pour le moment",
        location: "---"
      }];
    }

    // Filtrer pour exclure les événements d'évaluation (déjà dans examsAndHomeworks)
    const generalEvents = allEvents.filter(event => {
      const eventType = event.type?.toLowerCase() || '';
      return !eventType.includes('devoir') && 
             !eventType.includes('examen') && 
             !eventType.includes('test') && 
             !eventType.includes('quiz');
    });

    console.log("📊 Événements généraux réels:", generalEvents.length);

    if (generalEvents.length === 0) {
      return [{
        title: "Aucun événement général à venir",
        type: "information",
        date: "---",
        description: "Seuls des examens/devoirs sont programmés",
        location: "---"
      }];
    }

    return generalEvents.map(event => ({
      title: event.title,
      date: formatDateSafely(event.date),
      type: event.type || "événement",
      location: event.location || "Non spécifié",
      description: event.description || `Événement ${event.title}`
    }));
  } catch (error) {
    console.error("Erreur récupération des événements:", error);
    return [{
      title: "Erreur chargement des événements",
      type: "erreur",
      date: "---",
      description: "Impossible de charger les événements",
      location: "---"
    }];
  }
}

// Récupère le bulletin réel - VERSION TEMPORAIRE
async function getLatestBulletin(studentId: string) {
  try {
    // TEMPORAIRE: En attendant la création du modèle Bulletin
    console.log("📋 Recherche du bulletin pour l'étudiant:", studentId);
    
    // Pour l'instant, retourner "Non disponible"
    return {
      name: "Bulletin non disponible",
      average: "---",
      status: "En cours de préparation"
    };

  } catch (error) {
    console.error("Erreur récupération du bulletin:", error);
    return {
      name: "Erreur chargement",
      average: "---",
      status: "Erreur"
    };
  }
}