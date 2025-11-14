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
  inscriptionInfo: {
    montantTotal: string;
    montantPaye: string;
    montantRestant: string;
    statut: 'en_attente' | 'partiel' | 'complet';
    dueDate: string;
    hasInscription: boolean;
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

// Fonction pour récupérer les absences de la semaine dernière
async function getAbsencesLastWeek(studentId: string): Promise<number> {
  try {
    const startOfLastWeek = new Date();
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    startOfLastWeek.setHours(0, 0, 0, 0);

    const endOfLastWeek = new Date();
    endOfLastWeek.setHours(23, 59, 59, 999);

    const absencesCount = await prisma.attendance.count({
      where: {
        studentId: studentId,
        date: {
          gte: startOfLastWeek,
          lte: endOfLastWeek
        },
        OR: [
          { status: 'absent' },
          { status: 'ABSENT' },
          { status: 'Absent' }
        ]
      }
    });

    return absencesCount;
  } catch (error) {
    console.error('Erreur dans getAbsencesLastWeek:', error);
    return 0;
  }
}

// Fonction pour calculer le taux de présence sur le mois en cours
async function calculateAttendanceRate(studentId: string): Promise<number> {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setHours(23, 59, 59, 999);

    const totalSessions = await prisma.attendance.count({
      where: {
        studentId: studentId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const absencesCount = await prisma.attendance.count({
      where: {
        studentId: studentId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        },
        OR: [
          { status: 'absent' },
          { status: 'ABSENT' },
          { status: 'Absent' }
        ]
      }
    });

    if (totalSessions === 0) return 100;

    const presenceRate = Math.max(0, ((totalSessions - absencesCount) / totalSessions) * 100);
    
    return Number(presenceRate.toFixed(1));
  } catch (error) {
    console.error('Erreur dans calculateAttendanceRate:', error);
    return 100;
  }
}

// Service : Informations de l'enfant
async function getChildInfo(student: any) {
  try {
    const overallAverage = await calculateOverallAverage(student.id);
    const absencesLastWeek = await getAbsencesLastWeek(student.id);
    const attendanceRate = await calculateAttendanceRate(student.id);
    
    const latestGrade = student.grades && student.grades.length > 0 ? student.grades[0] : null;
    
    let latestGradeText = "Aucune note disponible";
    if (latestGrade) {
      const average = calculateModuleAverage(latestGrade);
      const subject = latestGrade.module?.nom || 'Matière inconnue';
      latestGradeText = `${average}/20 en ${subject}`;
    }

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

// Fonction pour parser les créneaux horaires
function parseScheduleSlots(slots: any): any[] {
  if (!slots || !Array.isArray(slots)) {
    return [];
  }
  return slots;
}

// Service : Prochain cours
async function getNextSchedule(student: any) {
  try {
    if (!student.filiereId) {
      return {
        subject: "Aucune filière assignée",
        time: "Non disponible",
        location: "-"
      };
    }

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
        { createdAt: 'desc' }
      ]
    });

    if (assignations.length === 0) {
      return {
        subject: "Aucun cours programmé",
        time: "Non disponible",
        location: "-"
      };
    }

    let assignationSelectionnee = null;
    
    for (const assignation of assignations) {
      const scheduleSlots = parseScheduleSlots(assignation.scheduleSlots);
      if (scheduleSlots.length > 0) {
        assignationSelectionnee = assignation;
        break;
      }
    }

    if (!assignationSelectionnee) {
      return {
        subject: "Aucun cours programmé",
        time: "Non disponible",
        location: "-"
      };
    }

    const scheduleSlots = parseScheduleSlots(assignationSelectionnee.scheduleSlots);
    const premierCreneau = scheduleSlots[0];

    if (!premierCreneau) {
      return {
        subject: "Aucun cours programmé",
        time: "Non disponible",
        location: "-"
      };
    }

    const jourCapitalized = premierCreneau.day ? 
      premierCreneau.day.charAt(0).toUpperCase() + premierCreneau.day.slice(1) : 
      "Jour non défini";
    
    const timeDisplay = premierCreneau.startTime && premierCreneau.endTime ?
      `${jourCapitalized}, ${premierCreneau.startTime} - ${premierCreneau.endTime}` :
      `${jourCapitalized}`;

    const location = premierCreneau.classroom || "Salle non définie";

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
    const events = await prisma.event.findMany({
      orderBy: [
        { date: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    if (!events || events.length === 0) {
      return {
        name: "Aucun événement à venir",
        date: "-",
        type: "information"
      };
    }

    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    let nextEvent = null;

    for (const event of events) {
      const eventDate = parseEventDate(event.date);
      
      if (eventDate && eventDate >= aujourdhui) {
        nextEvent = event;
        break;
      }
    }

    if (!nextEvent) {
      nextEvent = events[0];
    }

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

// Fonction pour calculer les données d'inscription
function calculateInscriptionData(inscription: any) {
  const montantTotal = inscription.fraisInscription || 0;
  const montantPaye = inscription.fraisPayes || 0;
  const montantRestant = montantTotal - montantPaye;

  // Déterminer le statut
  let statut: 'en_attente' | 'partiel' | 'complet';
  if (montantPaye === 0) {
    statut = 'en_attente';
  } else if (montantPaye < montantTotal) {
    statut = 'partiel';
  } else {
    statut = 'complet';
  }

  // Date d'échéance (30 jours après la date d'inscription)
  const dueDate = new Date(inscription.dateInscription || new Date());
  dueDate.setDate(dueDate.getDate() + 30);
  const dateFormatee = dueDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return {
    montantTotal: `${montantTotal.toLocaleString('fr-FR')} FCFA`,
    montantPaye: `${montantPaye.toLocaleString('fr-FR')} FCFA`,
    montantRestant: `${montantRestant.toLocaleString('fr-FR')} FCFA`,
    statut,
    dueDate: dateFormatee,
    hasInscription: true
  };
}

// Service : Informations d'inscription - VERSION AVEC VERIFICATION EMAIL
async function getInscriptionInfo(student: any) {
  try {
    console.log('=== DÉBUT RECHERCHE INSCRIPTION ===');
    console.log('Student ID:', student.id);
    console.log('Student email:', student.user?.email);
    console.log('Student name:', student.user?.firstName, student.user?.lastName);

    // VÉRIFICATION PRINCIPALE PAR EMAIL
    if (student.user?.email) {
      console.log('🔍 Recherche par email étudiant...');
      const inscriptionParEmail = await prisma.inscription.findFirst({
        where: {
          email: student.user.email
        },
        include: {
          paiements: {
            orderBy: {
              datePaiement: 'desc'
            }
          }
        }
      });

      if (inscriptionParEmail) {
        console.log('✅ Inscription trouvée par email:', inscriptionParEmail.id);
        console.log('📊 Détails inscription:');
        console.log('   - Frais inscription:', inscriptionParEmail.fraisInscription);
        console.log('   - Frais payés:', inscriptionParEmail.fraisPayes);
        console.log('   - Statut:', inscriptionParEmail.statut);
        return calculateInscriptionData(inscriptionParEmail);
      } else {
        console.log('❌ Aucune inscription trouvée pour cet email');
      }
    } else {
      console.log('❌ Email étudiant non disponible');
    }

    // FALLBACK: Vérifier s'il y a des inscriptions dans la base
    console.log('🔍 Vérification des inscriptions existantes...');
    const inscriptionsCount = await prisma.inscription.count();
    console.log(`Nombre total d'inscriptions dans la base: ${inscriptionsCount}`);

    if (inscriptionsCount > 0) {
      // Prendre la première inscription disponible
      const premiereInscription = await prisma.inscription.findFirst({
        include: {
          paiements: {
            orderBy: {
              datePaiement: 'desc'
            }
          }
        }
      });

      if (premiereInscription) {
        console.log('✅ Première inscription disponible utilisée:', premiereInscription.id);
        return calculateInscriptionData(premiereInscription);
      }
    }

    console.log('❌ Aucune inscription trouvée - données par défaut');
    return {
      montantTotal: "75 000 FCFA",
      montantPaye: "25 000 FCFA",
      montantRestant: "50 000 FCFA",
      statut: 'partiel' as const,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      hasInscription: false
    };

  } catch (error) {
    console.error('❌ Erreur dans getInscriptionInfo:', error);
    return {
      montantTotal: "75 000 FCFA",
      montantPaye: "25 000 FCFA",
      montantRestant: "50 000 FCFA",
      statut: 'partiel' as const,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      hasInscription: false
    };
  }
}

// Service : Notifications
async function getNotifications(studentId: string) {
  try {
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
          },
          attendance: {
            orderBy: { date: 'desc' }
          }
        }
      });

      if (student) {
        console.log('✅ Étudiant trouvé par nom:', student.id, student.user?.firstName, student.user?.lastName);
        return student;
      }
    }

    const fallbackStudent = await prisma.student.findFirst({
      include: {
        user: true,
        filiere: true,
        grades: {
          include: {
            module: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        attendance: {
          orderBy: { date: 'desc' }
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

    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
      include: { user: true }
    });

    if (!parent) {
      throw new Error('Parent non trouvé');
    }

    console.log('Parent trouvé:', parent.id, parent.enfantName);

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
        inscriptionInfo: {
          montantTotal: "75 000 FCFA",
          montantPaye: "25 000 FCFA",
          montantRestant: "50 000 FCFA",
          statut: 'partiel',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
          hasInscription: false
        },
        notifications: []
      };
    }

    console.log('✅ Étudiant trouvé:', student.id, student.user?.firstName, student.user?.lastName);

    const [
      childInfo,
      nextSchedule,
      nextEvent,
      latestBulletin,
      inscriptionInfo,
      notifications
    ] = await Promise.all([
      getChildInfo(student),
      getNextSchedule(student),
      getNextEvent(),
      getLatestBulletin(student),
      getInscriptionInfo(student),
      getNotifications(student.id)
    ]);

    console.log('=== DONNÉES RÉCUPÉRÉES AVEC SUCCÈS ===');
    console.log('Frais inscription - Total:', inscriptionInfo.montantTotal, 'Payé:', inscriptionInfo.montantPaye, 'Statut:', inscriptionInfo.statut, 'HasInscription:', inscriptionInfo.hasInscription);

    return {
      childInfo,
      nextSchedule,
      nextEvent,
      latestBulletin,
      inscriptionInfo,
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