// app/api/parent/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// Types
interface DashboardData {
  childInfo: {
    name: string;
    className: string;
    latestGrade: string; 
    absencesLastWeek: number;
    attendanceRate: number;
    overallAverage: number;
  };
  nextSchedule: {
    subject: string;
    time: string;
    location: string;
  };
  nextEvent: {
    name: string;
    date: string;
    type: string;
  };
  latestBulletin: {
    trimester: string;
    average: string;
    mention: string;
    link: string;
  };
  financialInfo: {
    amountDue: string;
    dueDate: string;
    status: 'en_retard' | 'a_jour' | 'en_attente';
  };
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    timestamp: string;
    type: 'grade' | 'attendance' | 'homework' | 'payment';
    isRead: boolean;
  }>;
}

// Fonction pour créer automatiquement le parent s'il n'existe pas
async function getOrCreateParent(clerkUserId: string, email: string, firstName?: string | null, lastName?: string | null) {
  try {
    console.log('Recherche du parent avec clerkUserId:', clerkUserId);
    
    let parent = await prisma.parent.findFirst({
      where: {
        user: {
          clerkUserId: clerkUserId
        }
      },
      include: { 
        user: true 
      }
    });

    if (parent) {
      console.log('Parent trouvé:', parent.id);
      return parent;
    }

    console.log('Création du parent pour clerkUserId:', clerkUserId);
    
    let user = await prisma.user.findUnique({
      where: { clerkUserId }
    });

    if (!user) {
      console.log('Création du user avec clerkUserId:', clerkUserId);
      user = await prisma.user.create({
        data: {
          clerkUserId,
          email,
          firstName: firstName || 'Parent',
          lastName: lastName || 'Utilisateur',
          role: 'PARENT',
        },
      });
    } else {
      console.log('User trouvé:', user.id);
    }

    parent = await prisma.parent.findFirst({
      where: { userId: user.id },
      include: { user: true }
    });

    if (parent) {
      console.log('Parent trouvé après création user:', parent.id);
      return parent;
    }

    console.log('Création du parent pour userId:', user.id);
    
    parent = await prisma.parent.create({
      data: {
        userId: user.id,
        enfantName: `${firstName || 'Élève'} ${lastName || ''}`.trim(),
        filiere: 'Non assigné',
        relation: 'Parent',
      },
      include: { user: true }
    });

    console.log('Parent créé avec succès:', parent.id);
    return parent;

  } catch (error: any) {
    console.error('Erreur détaillée dans getOrCreateParent:', error);
    
    if (error.code === 'P2002') {
      console.log('Conflit d\'unicité, recherche du parent existant...');
      
      const existingParent = await prisma.parent.findFirst({
        where: {
          user: {
            clerkUserId: clerkUserId
          }
        },
        include: { user: true }
      });
      
      if (existingParent) {
        console.log('Parent existant trouvé après conflit:', existingParent.id);
        return existingParent;
      }
    }
    
    throw error;
  }
}

// Fonction utilitaire pour calculer la moyenne d'un module
function calculateModuleAverage(grade: any): number {
  if (!grade) return 0;
  
  const { interrogation1, interrogation2, interrogation3, devoir, composition } = grade;
  
  const notes = [interrogation1, interrogation2, interrogation3, devoir, composition]
    .filter(note => note !== null && note !== undefined && typeof note === 'number');
  
  if (notes.length === 0) return 0;
  
  const sum = notes.reduce((acc: number, note: number) => acc + note, 0);
  return Number((sum / notes.length).toFixed(2));
}

// Fonction utilitaire pour calculer la moyenne générale
async function calculateOverallAverage(studentId: string): Promise<number> {
  try {
    const grades = await prisma.grade.findMany({
      where: { studentId },
      include: { module: true }
    });

    if (grades.length === 0) return 0;

    const moduleAverages = grades.map(grade => ({
      average: calculateModuleAverage(grade),
      coefficient: grade.module?.coefficient || 1
    })).filter(item => item.average > 0);

    if (moduleAverages.length === 0) return 0;

    const totalWeighted = moduleAverages.reduce((sum, { average, coefficient }) => 
      sum + (average * coefficient), 0
    );
    const totalCoefficients = moduleAverages.reduce((sum, { coefficient }) => 
      sum + coefficient, 0
    );

    return totalCoefficients > 0 ? Number((totalWeighted / totalCoefficients).toFixed(2)) : 0;
  } catch (error) {
    console.error('Erreur calcul moyenne:', error);
    return 0;
  }
}

// Fonction utilitaire pour obtenir la mention
function getMention(average: number): string {
  if (average >= 16) return "Très bien";
  if (average >= 14) return "Bien";
  if (average >= 12) return "Assez bien";
  if (average >= 10) return "Passable";
  return "Insuffisant";
}

// Service : Informations de l'enfant
async function getChildInfo(student: any) {
  try {
    const overallAverage = await calculateOverallAverage(student.id);
    
    // Récupérer la dernière note réelle
    const latestGrade = student.grades && student.grades.length > 0 ? student.grades[0] : null;
    
    let latestGradeText = "Aucune note disponible";
    if (latestGrade) {
      const average = calculateModuleAverage(latestGrade);
      const subject = latestGrade.module?.nom || 'Matière inconnue';
      latestGradeText = `${average}/20 en ${subject}`;
    }

    // Récupérer les absences réelles (simulation pour l'instant)
    const absencesLastWeek = await getAbsencesLastWeek(student.id);
    const attendanceRate = await calculateAttendanceRate(student.id);

    return {
      name: `${student.user?.firstName || 'Élève'} ${student.user?.lastName || ''}`.trim(),
      className: student.filiere?.nom || 'Non assigné',
      latestGrade: latestGradeText,
      absencesLastWeek,
      attendanceRate,
      overallAverage
    };
  } catch (error) {
    console.error('Erreur dans getChildInfo:', error);
    return {
      name: 'Information non disponible',
      className: 'Non assigné',
      latestGrade: 'Aucune note disponible',
      absencesLastWeek: 0,
      attendanceRate: 100,
      overallAverage: 0
    };
  }
}

// Fonction pour récupérer les absences de la semaine
async function getAbsencesLastWeek(studentId: string): Promise<number> {
  try {
    return 0;
  } catch (error) {
    return 0;
  }
}

// Fonction pour calculer le taux de présence
async function calculateAttendanceRate(studentId: string): Promise<number> {
  try {
    return 100;
  } catch (error) {
    return 100;
  }
}

// Fonction pour parser les créneaux horaires
function parseScheduleSlots(slots: any): any[] {
  if (!slots || !Array.isArray(slots)) {
    return [];
  }
  return slots;
}

// Service : Prochain cours - VERSION CORRIGÉE pour table planningAssignation
async function getNextSchedule(student: any) {
  try {
    console.log('=== DÉBUT RECHERCHE PROCHAIN COURS ===');
    console.log('Student ID:', student.id);
    console.log('Filiere ID:', student.filiereId);
    console.log('Nom étudiant:', student.user?.firstName, student.user?.lastName);

    if (!student.filiereId) {
      console.log('=== AUCUNE FILIÈRE ASSOCIÉE À L\'ÉTUDIANT ===');
      return {
        subject: "Aucune filière assignée",
        time: "Non disponible",
        location: "-"
      };
    }

    // RÉCUPÉRER LES ASSIGNATIONS POUR LA FILIÈRE DE L'ÉTUDIANT
    const assignations = await prisma.planningAssignation.findMany({
      where: {
        filiereId: student.filiereId
      },
      include: {
        module: true,
        vague: true,
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
      orderBy: [
        { createdAt: 'desc' } // Prendre les plus récentes d'abord
      ]
    });

    console.log('=== ASSIGNATIONS TROUVÉES POUR LA FILIÈRE ===');
    console.log('Nombre d\'assignations:', assignations.length);
    
    assignations.forEach((assignation, index) => {
      console.log(`${index + 1}. Module: ${assignation.module?.nom}`);
      console.log(`   Teacher: ${assignation.teacher?.user?.firstName} ${assignation.teacher?.user?.lastName}`);
      console.log(`   Vague: ${assignation.vague?.nom}`);
      
      // Afficher les créneaux horaires
      const scheduleSlots = parseScheduleSlots(assignation.scheduleSlots);
      console.log(`   Créneaux: ${scheduleSlots.length}`);
      scheduleSlots.forEach((slot: any, slotIndex: number) => {
        console.log(`     ${slotIndex + 1}. ${slot.day} ${slot.startTime}-${slot.endTime} (Salle: ${slot.classroom})`);
      });
    });

    if (assignations.length === 0) {
      console.log('=== AUCUNE ASSIGNATION TROUVÉE POUR CETTE FILIÈRE ===');
      return {
        subject: "Aucun cours programmé",
        time: "Non disponible",
        location: "-"
      };
    }

    // Prendre la première assignation avec des créneaux horaires
    let assignationSelectionnee = null;
    
    for (const assignation of assignations) {
      const scheduleSlots = parseScheduleSlots(assignation.scheduleSlots);
      if (scheduleSlots.length > 0) {
        assignationSelectionnee = assignation;
        break;
      }
    }

    if (!assignationSelectionnee) {
      console.log('=== AUCUNE ASSIGNATION AVEC CRÉNEAUX HORAIRES ===');
      return {
        subject: "Aucun cours programmé",
        time: "Non disponible",
        location: "-"
      };
    }

    console.log('=== ASSIGNATION SÉLECTIONNÉE ===');
    console.log('Module:', assignationSelectionnee.module?.nom);
    console.log('Teacher:', assignationSelectionnee.teacher?.user?.firstName, assignationSelectionnee.teacher?.user?.lastName);
    
    // Prendre le premier créneau horaire
    const scheduleSlots = parseScheduleSlots(assignationSelectionnee.scheduleSlots);
    const premierCreneau = scheduleSlots[0];
    console.log('Créneau sélectionné:', premierCreneau);

    if (!premierCreneau) {
      console.log('=== AUCUN CRÉNEAU DISPONIBLE ===');
      return {
        subject: "Aucun cours programmé",
        time: "Non disponible",
        location: "-"
      };
    }

    // Formater l'affichage
    const jourCapitalized = premierCreneau.day ? 
      premierCreneau.day.charAt(0).toUpperCase() + premierCreneau.day.slice(1) : 
      "Jour non défini";
    
    const timeDisplay = premierCreneau.startTime && premierCreneau.endTime ?
      `${jourCapitalized}, ${premierCreneau.startTime} - ${premierCreneau.endTime}` :
      `${jourCapitalized}`;

    const location = premierCreneau.classroom || "Salle non définie";

    console.log('=== FIN RECHERCHE PROCHAIN COURS ===');
    console.log('Résultat:', {
      subject: assignationSelectionnee.module?.nom,
      time: timeDisplay,
      location: location
    });

    return {
      subject: assignationSelectionnee.module?.nom || "Matière non définie",
      time: timeDisplay,
      location: location
    };

  } catch (error) {
    console.error('Erreur dans getNextSchedule:', error);
    return {
      subject: "Erreur de chargement",
      time: "Non disponible",
      location: "-"
    };
  }
}

// Fonction pour parser les dates string en format cohérent
function parseEventDate(dateString: string): Date | null {
  try {
    let parsedDate: Date | null = null;

    parsedDate = new Date(dateString);
    
    if (isNaN(parsedDate.getTime())) {
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        parsedDate = new Date(dateString + 'T00:00:00');
      }
      else if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateString.split('/');
        parsedDate = new Date(`${year}-${month}-${day}T00:00:00`);
      }
      else if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [day, month, year] = dateString.split('-');
        parsedDate = new Date(`${year}-${month}-${day}T00:00:00`);
      }
    }

    return parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null;
  } catch (error) {
    console.error('Erreur parsing date:', dateString, error);
    return null;
  }
}

// Service : Prochain événement
async function getNextEvent() {
  try {
    console.log('Recherche du prochain événement...');
    
    // Récupérer tous les événements
    const events = await prisma.event.findMany({
      orderBy: [
        { date: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    if (!events || events.length === 0) {
      console.log('Aucun événement trouvé dans la base');
      return {
        name: "Aucun événement à venir",
        date: "-",
        type: "information"
      };
    }

    // Date d'aujourd'hui pour comparaison
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    let nextEvent = null;

    // Trouver le premier événement avec date >= aujourd'hui
    for (const event of events) {
      const eventDate = parseEventDate(event.date);
      
      if (eventDate && eventDate >= aujourdhui) {
        nextEvent = event;
        break;
      }
    }

    // Si aucun événement futur, prendre le dernier événement créé
    if (!nextEvent) {
      nextEvent = events[0];
      console.log('Aucun événement futur, prise du dernier événement créé');
    }

    console.log('Événement sélectionné:', nextEvent);

    // Formater la date en français
    let dateFormatee = "-";
    const eventDate = parseEventDate(nextEvent.date);
    
    if (eventDate) {
      dateFormatee = eventDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } else {
      dateFormatee = nextEvent.date;
      console.warn('Format de date non reconnu, utilisation de la date brute:', nextEvent.date);
    }

    return {
      name: nextEvent.title || "Événement sans titre",
      date: dateFormatee,
      type: nextEvent.badge?.toLowerCase() || nextEvent.type?.toLowerCase() || "information"
    };
  } catch (error) {
    console.error('Erreur dans getNextEvent:', error);
    return {
      name: "Aucun événement à venir",
      date: "-",
      type: "information"
    };
  }
}

// Service : Dernier bulletin
async function getLatestBulletin(student: any) {
  try {
    const overallAverage = await calculateOverallAverage(student.id);
    const mention = getMention(overallAverage);

    return {
      trimester: "1er Trimestre",
      average: `${overallAverage.toFixed(1).replace('.', ',')} / 20`,
      mention,
      link: `/parent/bulletins/${student.id}`
    };
  } catch (error) {
    console.error('Erreur dans getLatestBulletin:', error);
    return {
      trimester: "Aucun bulletin disponible",
      average: "0,0 / 20",
      mention: "Non disponible",
      link: "#"
    };
  }
}

// Service : Informations financières
async function getFinancialInfo(parentId: string) {
  try {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);
    
    const dateFormatee = dueDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return {
      amountDue: "50000 FCFA",
      dueDate: dateFormatee,
      status: 'en_attente' as const
    };
  } catch (error) {
    console.error('Erreur dans getFinancialInfo:', error);
    return {
      amountDue: "0 FCFA",
      dueDate: new Date().toLocaleDateString('fr-FR'),
      status: 'a_jour' as const
    };
  }
}

// Service : Notifications
async function getNotifications(studentId: string) {
  try {
    // Récupérer les notes récentes (7 derniers jours)
    const recentGrades = await prisma.grade.findMany({
      where: {
        studentId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        module: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Transformer en notifications
    const gradeNotifications = recentGrades.map(grade => ({
      id: grade.id,
      title: `Nouvelle note en ${grade.module?.nom || 'Matière'}`,
      message: `Note: ${calculateModuleAverage(grade)}/20`,
      timestamp: new Date(grade.createdAt).toLocaleDateString('fr-FR'),
      type: 'grade' as const,
      isRead: false
    }));

    return gradeNotifications;
  } catch (error) {
    console.error('Erreur dans getNotifications:', error);
    return [];
  }
}

// Fonction pour trouver l'étudiant associé au parent
async function findStudentForParent(parent: any) {
  try {
    console.log('=== RECHERCHE ÉTUDIANT POUR PARENT ===');
    console.log('Parent ID:', parent.id);
    console.log('Nom enfant dans parent:', parent.enfantName);

    // Essayer de trouver l'étudiant par le nom stocké dans le parent
    if (parent.enfantName) {
      const names = parent.enfantName.split(' ');
      const firstName = names[0];
      const lastName = names.length > 1 ? names.slice(1).join(' ') : names[0];

      console.log('Recherche étudiant avec:', { firstName, lastName });

      const student = await prisma.student.findFirst({
        where: {
          OR: [
            { user: { firstName: { contains: firstName, mode: 'insensitive' } } },
            { user: { lastName: { contains: lastName, mode: 'insensitive' } } }
          ]
        },
        include: {
          user: true,
          filiere: true,
          grades: {
            include: {
              module: true,
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (student) {
        console.log('✅ Étudiant trouvé par nom:', student.id, student.user?.firstName, student.user?.lastName);
        return student;
      }
    }

    // Fallback: prendre le premier étudiant disponible
    console.log('Recherche du premier étudiant disponible...');
    const fallbackStudent = await prisma.student.findFirst({
      include: {
        user: true,
        filiere: true,
        grades: {
          include: {
            module: true,
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (fallbackStudent) {
      console.log('✅ Étudiant fallback trouvé:', fallbackStudent.id);
    } else {
      console.log('❌ Aucun étudiant trouvé');
    }

    return fallbackStudent;
  } catch (error) {
    console.error('Erreur recherche étudiant:', error);
    return null;
  }
}

// Fonction principale pour récupérer toutes les données
async function getParentDashboardData(parentId: string): Promise<DashboardData> {
  try {
    console.log('=== DÉBUT RÉCUPÉRATION DASHBOARD ===');
    console.log('Parent ID:', parentId);

    // Récupérer le parent
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      include: { user: true }
    });

    if (!parent) {
      throw new Error('Parent non trouvé');
    }

    console.log('Parent trouvé:', parent.id, parent.enfantName);

    // Trouver l'étudiant associé
    const student = await findStudentForParent(parent);

    if (!student) {
      console.log('❌ Aucun étudiant trouvé pour ce parent');
      return {
        childInfo: {
          name: "Aucun enfant assigné",
          className: "Non assigné",
          latestGrade: "Aucune note disponible",
          absencesLastWeek: 0,
          attendanceRate: 0,
          overallAverage: 0
        },
        nextSchedule: {
          subject: "Aucun cours programmé",
          time: "Non disponible",
          location: "-"
        },
        nextEvent: {
          name: "Aucun événement à venir",
          date: "-",
          type: "information"
        },
        latestBulletin: {
          trimester: "Aucun bulletin disponible",
          average: "0,0 / 20",
          mention: "Non disponible",
          link: "#"
        },
        financialInfo: {
          amountDue: "0 FCFA",
          dueDate: new Date().toLocaleDateString('fr-FR'),
          status: 'a_jour'
        },
        notifications: []
      };
    }

    console.log('✅ Étudiant trouvé:', student.id, student.user?.firstName, student.user?.lastName);
    console.log('Filière étudiante:', student.filiere?.nom);

    // Récupérer toutes les données en parallèle
    const [
      childInfo,
      nextSchedule,
      nextEvent,
      latestBulletin,
      financialInfo,
      notifications
    ] = await Promise.all([
      getChildInfo(student),
      getNextSchedule(student),
      getNextEvent(),
      getLatestBulletin(student),
      getFinancialInfo(parentId),
      getNotifications(student.id)
    ]);

    console.log('=== DONNÉES RÉCUPÉRÉES AVEC SUCCÈS ===');
    console.log('Prochain cours:', nextSchedule);

    return {
      childInfo,
      nextSchedule,
      nextEvent,
      latestBulletin,
      financialInfo,
      notifications
    };
  } catch (error) {
    console.error('❌ Erreur dans getParentDashboardData:', error);
    throw error;
  }
}

// Route principale API
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userEmail = user.emailAddresses[0]?.emailAddress;
    if (!userEmail) {
      return NextResponse.json({ error: 'Email non disponible' }, { status: 400 });
    }

    console.log('=== DÉBUT REQUÊTE DASHBOARD PARENT ===');
    console.log('User ID:', user.id, 'Email:', userEmail);

    // Obtenir ou créer le parent
    const parent = await getOrCreateParent(
      user.id,
      userEmail,
      user.firstName,
      user.lastName
    );

    if (!parent) {
      return NextResponse.json({ error: 'Impossible de créer le parent' }, { status: 500 });
    }

    console.log('Parent connecté:', parent.id);

    // Récupérer toutes les données du dashboard
    const dashboardData = await getParentDashboardData(parent.id);

    console.log('=== REQUÊTE TERMINÉE AVEC SUCCÈS ===');
    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('❌ Erreur dashboard parent:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}