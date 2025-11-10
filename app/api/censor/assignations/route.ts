import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Interfaces
interface ScheduleSlot {
  id: string;
  day: string; 
  startTime: string;
  endTime: string;
  classroom: string;
  salleId?: string;
}

interface Assignment {
  id: string;
  vagueId: string;
  filiereId: string;
  moduleId: string;
  teacherId: string;
  schedule: {
    slots: ScheduleSlot[];
    period: {
      startDate: string;
      endDate: string;
    };
  };
}

// Vérification auth censeur
async function checkCenseurAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Non authentifié");
  }

  const client = await clerkClient();
  const currentUser = await client.users.getUser(userId);
  const userRole = currentUser.publicMetadata?.role as string || "";
  
  const isCenseur = userRole && (
    userRole.toLowerCase().includes("censeur") || 
    userRole === "Censeur"
  );

  if (!isCenseur) {
    throw new Error("Accès réservé au censeur");
  }

  return { userId, client };
}

// Fonction pour créer ou récupérer une salle
async function findOrCreateSalle(nomSalle: string) {
  if (!nomSalle || nomSalle.trim() === '') {
    return null;
  }

  // Vérifier si la salle existe déjà
  let salle = await prisma.salle.findFirst({
    where: { 
      nom: { 
        equals: nomSalle.trim(),
        mode: 'insensitive'
      } 
    }
  });

  // Si elle n'existe pas, la créer
  if (!salle) {
    console.log(`➕ Création de la salle: "${nomSalle}"`);
    salle = await prisma.salle.create({
      data: {
        nom: nomSalle.trim(),
        capacite: 30, // Capacité par défaut
        isActive: true
      }
    });
    console.log(`✅ Salle créée: ${salle.id} - ${salle.nom}`);
  } else {
    console.log(`✅ Salle existante réutilisée: ${salle.nom}`);
  }

  return salle;
}

// Fonction utilitaire pour convertir en données Prisma compatibles
function convertToPrismaData(assignment: Assignment) {
  const cleanSlots = assignment.schedule.slots.map(slot => ({
    id: slot.id || `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    day: slot.day?.trim() || '',
    startTime: slot.startTime?.trim() || '',
    endTime: slot.endTime?.trim() || '',
    classroom: slot.classroom?.trim() || '',
    salleId: slot.salleId || null
  }));

  const cleanPeriod = {
    startDate: assignment.schedule.period?.startDate || new Date().toISOString(),
    endDate: assignment.schedule.period?.endDate || new Date().toISOString()
  };

  return {
    id: assignment.id,
    vagueId: assignment.vagueId.trim(),
    filiereId: parseInt(assignment.filiereId),
    moduleId: parseInt(assignment.moduleId),
    teacherId: assignment.teacherId.trim(),
    scheduleSlots: cleanSlots,
    schedulePeriod: cleanPeriod
  };
}

// Fonction utilitaire pour convertir depuis la base de données
function convertFromPrismaData(dbData: any): Assignment {
  return {
    id: dbData.id,
    vagueId: dbData.vagueId,
    filiereId: dbData.filiereId.toString(),
    moduleId: dbData.moduleId.toString(),
    teacherId: dbData.teacherId,
    schedule: {
      slots: Array.isArray(dbData.scheduleSlots) ? dbData.scheduleSlots.map((slot: any) => ({
        id: slot.id,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        classroom: slot.classroom,
        salleId: slot.salleId
      })) : [],
      period: dbData.schedulePeriod && typeof dbData.schedulePeriod === 'object' 
        ? dbData.schedulePeriod 
        : { startDate: '', endDate: '' }
    }
  };
}

// Synchroniser un teacher depuis Clerk
// Synchroniser un teacher depuis Clerk - VERSION CORRIGÉE
async function syncTeacherFromClerk(clerkUserId: string) {
  try {
    console.log(`🔄 Synchronisation du teacher pour Clerk ID: ${clerkUserId}`);
    
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkUserId);
    
    if (!clerkUser) {
      throw new Error(`Utilisateur Clerk "${clerkUserId}" non trouvé`);
    }

    const role = clerkUser.publicMetadata?.role as string;
    const isTeacher = role && (
      role.toLowerCase().includes("enseignant") || 
      role === "Enseignant" ||
      role.toLowerCase().includes("teacher")
    );

    if (!isTeacher) {
      throw new Error(`L'utilisateur "${clerkUserId}" n'est pas un enseignant`);
    }

    const userEmail = clerkUser.emailAddresses[0]?.emailAddress || '';

    // CORRECTION : Vérifier d'abord si l'utilisateur existe par clerkUserId OU par email
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { clerkUserId: clerkUserId },
          { email: userEmail }
        ]
      }
    });

    if (!dbUser) {
      console.log(`➕ Création de l'user pour ${clerkUser.firstName} ${clerkUser.lastName}`);
      dbUser = await prisma.user.create({
        data: {
          clerkUserId: clerkUserId,
          email: userEmail,
          role: 'ENSEIGNANT',
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          phone: clerkUser.phoneNumbers[0]?.phoneNumber || '',
          isActive: true
        }
      });
      console.log(`✅ Utilisateur créé: ${dbUser.id}`);
    } else {
      // CORRECTION : Mettre à jour l'utilisateur existant si nécessaire
      if (dbUser.clerkUserId !== clerkUserId || dbUser.email !== userEmail) {
        console.log(`🔄 Mise à jour de l'utilisateur existant: ${dbUser.id}`);
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            clerkUserId: clerkUserId,
            email: userEmail,
            firstName: clerkUser.firstName || '',
            lastName: clerkUser.lastName || '',
            phone: clerkUser.phoneNumbers[0]?.phoneNumber || '',
            role: 'ENSEIGNANT', // S'assurer que le rôle est bien ENSEIGNANT
            isActive: true
          }
        });
      }
      console.log(`✅ Utilisateur existant réutilisé: ${dbUser.id}`);
    }

    let teacher = await prisma.teacher.findUnique({
      where: { userId: dbUser.id }
    });

    if (!teacher) {
      console.log(`👨‍🏫 Création du teacher pour ${clerkUser.firstName} ${clerkUser.lastName}`);
      teacher = await prisma.teacher.create({
        data: {
          userId: dbUser.id,
          matiere: (clerkUser.publicMetadata?.specialite as string) || "À définir"
        }
      });
      console.log(`✅ Teacher créé: ${teacher.id}`);
    } else {
      console.log(`✅ Teacher existant: ${teacher.id}`);
    }

    console.log(`✅ Teacher synchronisé: ${teacher.id} pour ${clerkUser.firstName} ${clerkUser.lastName}`);
    return teacher;

  } catch (error) {
    console.error(`❌ Erreur synchronisation teacher ${clerkUserId}:`, error);
    throw error;
  }
}

async function checkSalleDisponibility(slots: ScheduleSlot[], excludeAssignmentId?: string) {
  const conflicts = [];
  
  for (const slot of slots) {
    if (!slot.salleId) continue;
    
    // CORRECTION : Utiliser une requête différente pour vérifier les conflits
    const existingAssignments = await prisma.planningAssignation.findMany({
      where: {
        id: excludeAssignmentId ? { not: excludeAssignmentId } : undefined,
        // Vérifier manuellement dans chaque slot
        OR: [
          {
            scheduleSlots: {
              path: ['$[0]'], // Premier élément
              string_contains: `"salleId":"${slot.salleId}"`
            }
          },
          {
            scheduleSlots: {
              path: ['$[1]'], // Deuxième élément
              string_contains: `"salleId":"${slot.salleId}"`
            }
          },
          {
            scheduleSlots: {
              path: ['$[2]'], // Troisième élément
              string_contains: `"salleId":"${slot.salleId}"`
            }
          },
          {
            scheduleSlots: {
              path: ['$[3]'], // Quatrième élément
              string_contains: `"salleId":"${slot.salleId}"`
            }
          },
          {
            scheduleSlots: {
              path: ['$[4]'], // Cinquième élément
              string_contains: `"salleId":"${slot.salleId}"`
            }
          }
        ]
      },
      include: {
        vague: { select: { nom: true } },
        filiere: { select: { nom: true } },
        module: { select: { nom: true } }
      }
    });

    // Filtrer manuellement pour vérifier le créneau exact
    const exactConflicts = existingAssignments.filter(assignment => {
      const slots = assignment.scheduleSlots as any[];
      return slots.some(s => 
        s.salleId === slot.salleId &&
        s.day === slot.day &&
        s.startTime === slot.startTime &&
        s.endTime === slot.endTime
      );
    });

    if (exactConflicts.length > 0) {
      const salle = await prisma.salle.findUnique({
        where: { id: slot.salleId }
      });
      
      conflicts.push({
        salle: salle?.nom || slot.salleId,
        jour: slot.day,
        horaire: `${slot.startTime} - ${slot.endTime}`,
        conflits: exactConflicts.map(a => ({
          vague: a.vague.nom,
          filiere: a.filiere.nom,
          module: a.module.nom
        }))
      });
    }
  }
  
  return conflicts;
}

// GET - Récupérer toutes les assignations
export async function GET(req: NextRequest) {
  try {
    await checkCenseurAuth();

    const { searchParams } = new URL(req.url);
    const vagueId = searchParams.get('vagueId');
    const filiereId = searchParams.get('filiereId');

    const where: any = {};
    if (vagueId) where.vagueId = vagueId;
    if (filiereId) {
      const filiereIdNum = parseInt(filiereId);
      if (!isNaN(filiereIdNum)) {
        where.filiereId = filiereIdNum;
      }
    }

    const assignmentsDB = await prisma.planningAssignation.findMany({
      where,
      include: {
        vague: { select: { nom: true } },
        filiere: { select: { nom: true } },
        module: { select: { nom: true } },
        teacher: { 
          include: { 
            user: { select: { firstName: true, lastName: true } } 
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Récupérer les informations des salles pour chaque assignation
    const assignmentsWithSalles = await Promise.all(
      assignmentsDB.map(async (assignment) => {
        const assignmentData = convertFromPrismaData(assignment);
        
        // Pour chaque slot, récupérer les infos de la salle
        const slotsWithSalleInfo = await Promise.all(
          assignmentData.schedule.slots.map(async (slot) => {
            if (slot.salleId) {
              const salle = await prisma.salle.findUnique({
                where: { id: slot.salleId },
                select: { nom: true, capacite: true }
              });
              return {
                ...slot,
                salleInfo: salle ? {
                  nom: salle.nom,
                  capacite: salle.capacite
                } : null
              };
            }
            return slot;
          })
        );
        
        return {
          ...assignmentData,
          schedule: {
            ...assignmentData.schedule,
            slots: slotsWithSalleInfo
          }
        };
      })
    );

    console.log(`📊 ${assignmentsWithSalles.length} assignations récupérées`);
    return NextResponse.json(assignmentsWithSalles);

  } catch (error: any) {
    console.error("❌ Erreur récupération assignations:", error);
    
    if (error.message === "Non authentifié") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message === "Accès réservé au censeur") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: "Erreur lors de la récupération" },
      { status: 500 }
    );
  }
}

// POST - Créer une assignation
export async function POST(req: NextRequest) {
  try {
    await checkCenseurAuth();

    const assignment: Assignment = await req.json();
    
    console.log('📝 Données reçues:', JSON.stringify(assignment, null, 2));

    // Validation
    if (!assignment.vagueId) {
      return NextResponse.json({ 
        error: "vagueId est requis" 
      }, { status: 400 });
    }
    if (!assignment.filiereId) {
      return NextResponse.json({ 
        error: "filiereId est requis" 
      }, { status: 400 });
    }
    if (!assignment.moduleId) {
      return NextResponse.json({ 
        error: "moduleId est requis" 
      }, { status: 400 });
    }
    if (!assignment.teacherId) {
      return NextResponse.json({ 
        error: "teacherId est requis" 
      }, { status: 400 });
    }

    if (!assignment.schedule?.slots || assignment.schedule.slots.length === 0) {
      return NextResponse.json({ error: "Aucun créneau horaire fourni" }, { status: 400 });
    }

    // ID unique si non fourni
    if (!assignment.id) {
      assignment.id = `assign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Conversion des IDs
    const filiereId = parseInt(assignment.filiereId);
    const moduleId = parseInt(assignment.moduleId);

    if (isNaN(filiereId)) {
      return NextResponse.json({ 
        error: `filiereId invalide: "${assignment.filiereId}" n'est pas un nombre` 
      }, { status: 400 });
    }
    if (isNaN(moduleId)) {
      return NextResponse.json({ 
        error: `moduleId invalide: "${assignment.moduleId}" n'est pas un nombre` 
      }, { status: 400 });
    }

    let finalTeacherId = assignment.teacherId;

    // NOUVEAU : Gérer les salles (création automatique) AVANT la vérification
    console.log('🏫 Gestion automatique des salles...');
    for (const slot of assignment.schedule.slots) {
      if (slot.classroom && slot.classroom.trim() !== '') {
        const salle = await findOrCreateSalle(slot.classroom);
        if (salle) {
          slot.salleId = salle.id; // Associer l'ID de la salle créée
          console.log(`✅ Salle "${slot.classroom}" associée à l'ID: ${salle.id}`);
        }
      }
    }

    // Vérification des références
    try {
      // Vérifier la vague
      const vagueExists = await prisma.vague.findUnique({ 
        where: { id: assignment.vagueId } 
      });
      
      if (!vagueExists) {
        const allVagues = await prisma.vague.findMany({
          select: { id: true, nom: true }
        });
        return NextResponse.json({ 
          error: `La vague avec l'ID "${assignment.vagueId}" n'existe pas. Vagues disponibles: ${allVagues.map(v => `${v.nom} (${v.id})`).join(', ')}` 
        }, { status: 404 });
      }

      // Vérifier la filière
      const filiereExists = await prisma.filiere.findUnique({ 
        where: { id: filiereId } 
      });
      
      if (!filiereExists) {
        const allFilieres = await prisma.filiere.findMany({
          select: { id: true, nom: true }
        });
        return NextResponse.json({ 
          error: `La filière avec l'ID "${filiereId}" n'existe pas. Filieres disponibles: ${allFilieres.map(f => `${f.nom} (${f.id})`).join(', ')}` 
        }, { status: 404 });
      }

      // Vérifier le module
      const moduleExists = await prisma.module.findUnique({ 
        where: { id: moduleId } 
      });
      
      if (!moduleExists) {
        const allModules = await prisma.module.findMany({
          select: { id: true, nom: true }
        });
        return NextResponse.json({ 
          error: `Le module avec l'ID "${moduleId}" n'existe pas. Modules disponibles: ${allModules.map(m => `${m.nom} (${m.id})`).join(', ')}` 
        }, { status: 404 });
      }

      // Gérer la synchronisation du teacher
      if (assignment.teacherId.startsWith('user_')) {
        console.log('🔄 TeacherId est un ID Clerk, synchronisation...');
        const teacher = await syncTeacherFromClerk(assignment.teacherId);
        finalTeacherId = teacher.id;
        console.log(`✅ Teacher synchronisé: ${assignment.teacherId} → ${finalTeacherId}`);
      }

      // Vérifier le teacher
      const teacherExists = await prisma.teacher.findUnique({ 
        where: { id: finalTeacherId } 
      });
      
      if (!teacherExists) {
        const allTeachers = await prisma.teacher.findMany({
          include: { 
            user: { 
              select: { 
                firstName: true, 
                lastName: true,
                clerkUserId: true
              } 
            } 
          }
        });
        
        const teachersInfo = allTeachers.map(t => 
          `${t.user.firstName} ${t.user.lastName} (Teacher ID: ${t.id}, Clerk ID: ${t.user.clerkUserId})`
        ).join(', ');
        
        return NextResponse.json({ 
          error: `Le formateur avec l'ID "${assignment.teacherId}" n'existe pas. Teachers disponibles: ${teachersInfo || 'Aucun'}` 
        }, { status: 404 });
      }

      // Vérifier la relation vague-filiere
      const vagueFiliereExists = await prisma.vagueFiliere.findUnique({
        where: {
          vagueId_filiereId: {
            vagueId: assignment.vagueId,
            filiereId: filiereId
          }
        }
      });
      
      if (!vagueFiliereExists) {
        return NextResponse.json({ 
          error: `La filière "${filiereExists.nom}" (ID: ${filiereId}) n'est pas associée à la vague "${vagueExists.nom}" (ID: ${assignment.vagueId})` 
        }, { status: 400 });
      }

      console.log('✅ Toutes les références sont valides');

    } catch (refError: any) {
      console.error("❌ Erreur détaillée vérification références:", refError);
      return NextResponse.json({ 
        error: `Erreur lors de la vérification des références: ${refError.message}` 
      }, { status: 400 });
    }

    // Vérifier si l'assignation existe déjà
    const existing = await prisma.planningAssignation.findUnique({
      where: { id: assignment.id }
    });

    // Vérifier les conflits d'horaires pour le teacher
    const teacherConflicts = await prisma.planningAssignation.findMany({
      where: {
        teacherId: finalTeacherId,
        id: { not: assignment.id }
      }
    });

    const hasTeacherConflict = teacherConflicts.some(conflict => {
      const conflictSlots = conflict.scheduleSlots as any;
      return Array.isArray(conflictSlots) && conflictSlots.some((conflictSlot: any) => 
        assignment.schedule.slots.some(newSlot => 
          newSlot.day === conflictSlot.day &&
          newSlot.startTime === conflictSlot.startTime &&
          newSlot.endTime === conflictSlot.endTime
        )
      );
    });

    if (hasTeacherConflict) {
      return NextResponse.json({ 
        error: "Conflit d'horaires: le formateur est déjà assigné à ce créneau" 
      }, { status: 409 });
    }

    // Vérifier les conflits de salles
    const salleConflicts = await checkSalleDisponibility(assignment.schedule.slots, assignment.id);
    if (salleConflicts.length > 0) {
      const conflictMessages = salleConflicts.map(conflict => 
        `Salle ${conflict.salle} le ${conflict.jour} de ${conflict.horaire} est déjà utilisée`
      );
      return NextResponse.json({ 
        error: `Conflits de salles: ${conflictMessages.join('; ')}` 
      }, { status: 409 });
    }

    // Préparer les données
    const assignmentData = {
      ...convertToPrismaData(assignment),
      teacherId: finalTeacherId
    };
    
    console.log('📦 Données préparées pour Prisma:', assignmentData);

    let result;
    if (existing) {
      // UPDATE
      result = await prisma.planningAssignation.update({
        where: { id: assignment.id },
        data: assignmentData
      });
      console.log('✅ Assignation mise à jour:', assignment.id);
    } else {
      // INSERT
      try {
        result = await prisma.planningAssignation.create({
          data: assignmentData
        });
        console.log('✅ Nouvelle assignation créée:', assignment.id);
      } catch (createError: any) {
        console.error("❌ Erreur détaillée création:", createError);
        
        if (createError.code === 'P2003') {
          const field = createError.meta?.field_name || 'champ inconnu';
          return NextResponse.json({ 
            error: `Violation de contrainte: la référence dans ${field} n'existe pas` 
          }, { status: 400 });
        }
        
        throw createError;
      }
    }

    return NextResponse.json({ 
      success: true, 
      assignment: convertFromPrismaData(result),
      message: existing ? "Assignation mise à jour" : "Assignation créée"
    });

  } catch (error: any) {
    console.error("❌ Erreur détaillée sauvegarde assignation:", error);
    
    if (error.message === "Non authentifié") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message === "Accès réservé au censeur") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: "Référence invalide: une des entités liées n'existe pas" 
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde: " + error.message },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une assignation
export async function PUT(req: NextRequest) {
  try {
    await checkCenseurAuth();

    const assignment: Assignment = await req.json();
    
    if (!assignment.id) {
      return NextResponse.json({ error: "ID manquant pour la mise à jour" }, { status: 400 });
    }

    // Conversion des IDs
    const filiereId = parseInt(assignment.filiereId);
    const moduleId = parseInt(assignment.moduleId);

    if (isNaN(filiereId) || isNaN(moduleId)) {
      return NextResponse.json({ error: "IDs de filière ou module invalides" }, { status: 400 });
    }

    // Vérifier que l'assignation existe
    const existing = await prisma.planningAssignation.findUnique({
      where: { id: assignment.id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Assignation non trouvée" }, { status: 404 });
    }

    let finalTeacherId = assignment.teacherId;

    // NOUVEAU : Gérer les salles (création automatique) pour PUT aussi
    console.log('🏫 Gestion automatique des salles (mise à jour)...');
    for (const slot of assignment.schedule.slots) {
      if (slot.classroom && slot.classroom.trim() !== '') {
        const salle = await findOrCreateSalle(slot.classroom);
        if (salle) {
          slot.salleId = salle.id;
          console.log(`✅ Salle "${slot.classroom}" associée à l'ID: ${salle.id}`);
        }
      }
    }

    // Vérification des références
    try {
      // Vérifier la vague
      const vagueExists = await prisma.vague.findUnique({ 
        where: { id: assignment.vagueId } 
      });
      if (!vagueExists) {
        return NextResponse.json({ 
          error: `La vague avec l'ID "${assignment.vagueId}" n'existe pas` 
        }, { status: 404 });
      }

      // Vérifier la filière
      const filiereExists = await prisma.filiere.findUnique({ 
        where: { id: filiereId } 
      });
      if (!filiereExists) {
        return NextResponse.json({ 
          error: `La filière avec l'ID "${filiereId}" n'existe pas` 
        }, { status: 404 });
      }

      // Vérifier le module
      const moduleExists = await prisma.module.findUnique({ 
        where: { id: moduleId } 
      });
      if (!moduleExists) {
        return NextResponse.json({ 
          error: `Le module avec l'ID "${moduleId}" n'existe pas` 
        }, { status: 404 });
      }

      // Gérer la synchronisation du teacher
      if (assignment.teacherId.startsWith('user_')) {
        console.log('🔄 TeacherId est un ID Clerk, synchronisation...');
        const teacher = await syncTeacherFromClerk(assignment.teacherId);
        finalTeacherId = teacher.id;
        console.log(`✅ Teacher synchronisé: ${assignment.teacherId} → ${finalTeacherId}`);
      }

      // Vérifier si le teacher existe
      const teacherExists = await prisma.teacher.findUnique({ 
        where: { id: finalTeacherId } 
      });
      if (!teacherExists) {
        return NextResponse.json({ 
          error: `Le formateur avec l'ID "${assignment.teacherId}" n'existe pas` 
        }, { status: 404 });
      }

      // Vérifier si la combinaison vague-filiere existe
      const vagueFiliereExists = await prisma.vagueFiliere.findUnique({
        where: {
          vagueId_filiereId: {
            vagueId: assignment.vagueId,
            filiereId: filiereId
          }
        }
      });
      if (!vagueFiliereExists) {
        return NextResponse.json({ 
          error: `La filière ${filiereId} n'est pas associée à la vague ${assignment.vagueId}` 
        }, { status: 400 });
      }

    } catch (refError: any) {
      console.error("❌ Erreur vérification références:", refError);
      return NextResponse.json({ 
        error: "Erreur lors de la vérification des références" 
      }, { status: 400 });
    }

    // Vérifier les conflits d'horaires pour le teacher (exclure l'assignation actuelle)
    const teacherConflicts = await prisma.planningAssignation.findMany({
      where: {
        teacherId: finalTeacherId,
        id: { not: assignment.id }
      }
    });

    const hasTeacherConflict = teacherConflicts.some(conflict => {
      const conflictSlots = conflict.scheduleSlots as any;
      return Array.isArray(conflictSlots) && conflictSlots.some((conflictSlot: any) => 
        assignment.schedule.slots.some(newSlot => 
          newSlot.day === conflictSlot.day &&
          newSlot.startTime === conflictSlot.startTime &&
          newSlot.endTime === conflictSlot.endTime
        )
      );
    });

    if (hasTeacherConflict) {
      return NextResponse.json({ 
        error: "Conflit d'horaires: le formateur est déjà assigné à ce créneau" 
      }, { status: 409 });
    }

    // Vérifier les conflits de salles
    const salleConflicts = await checkSalleDisponibility(assignment.schedule.slots, assignment.id);
    if (salleConflicts.length > 0) {
      const conflictMessages = salleConflicts.map(conflict => 
        `Salle ${conflict.salle} le ${conflict.jour} de ${conflict.horaire} est déjà utilisée`
      );
      return NextResponse.json({ 
        error: `Conflits de salles: ${conflictMessages.join('; ')}` 
      }, { status: 409 });
    }

    // Utiliser la fonction de conversion
    const assignmentData = {
      ...convertToPrismaData(assignment),
      teacherId: finalTeacherId
    };

    // Mise à jour avec les IDs convertis
    const result = await prisma.planningAssignation.update({
      where: { id: assignment.id },
      data: assignmentData
    });

    console.log('✅ Assignation mise à jour:', assignment.id);
    return NextResponse.json({ 
      success: true, 
      assignment: convertFromPrismaData(result),
      message: "Assignation mise à jour avec succès"
    });

  } catch (error: any) {
    console.error("❌ Erreur mise à jour assignation:", error);
    
    if (error.message === "Non authentifié") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message === "Accès réservé au censeur") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    // Gestion spécifique des erreurs Prisma
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: "Référence invalide: une des entités liées n'existe pas" 
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une assignation
export async function DELETE(req: NextRequest) {
  try {
    await checkCenseurAuth();

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get('id');

    if (!assignmentId) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    // Vérifier que l'assignation existe
    const existing = await prisma.planningAssignation.findUnique({
      where: { id: assignmentId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Assignation non trouvée" }, { status: 404 });
    }

    // Suppression
    await prisma.planningAssignation.delete({
      where: { id: assignmentId }
    });

    console.log(`🗑️ Assignation ${assignmentId} supprimée`);
    return NextResponse.json({ 
      success: true, 
      message: "Assignation supprimée avec succès" 
    });

  } catch (error: any) {
    console.error("❌ Erreur suppression assignation:", error);
    
    if (error.message === "Non authentifié") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message === "Accès réservé au censeur") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}