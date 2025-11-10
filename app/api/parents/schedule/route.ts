// app/api/parent/schedule/route.ts - VERSION CORRIGÉE
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Cours {
  id: string;
  module: string;
  enseignant: string;
  emailEnseignant?: string;
  filiere: string;
  vague: string;
  coefficient: number;
  type: string;
  description?: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  salle?: string;
}

interface UserInfo {
  role: string;
  nom?: string;
  enfant?: string;
  filiereEnfant?: string;
  vagueEnfant?: string;
  relation?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log(`👨‍👦 Récupération emploi du temps parent pour l'utilisateur: ${userId}`);

    // Récupérer le profil parent
    const parentData = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        parent: true
      }
    });

    if (!parentData) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (!parentData.parent) {
      return NextResponse.json({ 
        error: "Profil parent non trouvé",
        message: "Votre compte n'est pas configuré comme parent"
      }, { status: 400 });
    }

    if (!parentData.parent.enfantName) {
      return NextResponse.json({
        error: "Enfant non spécifié",
        message: "Aucun enfant n'est associé à votre compte parent"
      }, { status: 400 });
    }

    console.log(`🔍 Recherche de l'enfant: "${parentData.parent.enfantName}"`);

    // Trouver l'étudiant par nom
    const enfant = await findStudentByName(parentData.parent.enfantName);
    
    if (!enfant) {
      return NextResponse.json({
        error: "Enfant non trouvé",
        message: `Aucun étudiant trouvé correspondant à "${parentData.parent.enfantName}"`
      }, { status: 404 });
    }

    if (!enfant.filiereId || !enfant.vagueId) {
      return NextResponse.json({
        error: "Profil enfant incomplet",
        message: "Le profil de votre enfant n'est pas complètement configuré (filière ou vague manquante)"
      }, { status: 400 });
    }

    console.log(`✅ Enfant trouvé: ${enfant.user.firstName} ${enfant.user.lastName}, Filière: ${enfant.filiereId}, Vague: ${enfant.vagueId}`);

    // Récupérer les cours depuis PlanningAssignation
    const cours = await getCoursEnfant(enfant.filiereId, enfant.vagueId);

    const userInfo: UserInfo = {
      role: "Parent",
      nom: `${parentData.firstName} ${parentData.lastName}`,
      enfant: `${enfant.user.firstName} ${enfant.user.lastName}`,
      filiereEnfant: enfant.filiere?.nom || "Non assigné",
      vagueEnfant: enfant.vague?.nom || "Non assigné",
      relation: parentData.parent.relation
    };

    console.log(`📊 ${cours.length} cours récupérés pour l'enfant`);

    return NextResponse.json({
      cours,
      userInfo,
      totalCours: cours.length,
      success: true
    });

  } catch (error) {
    console.error("❌ Erreur récupération emploi du temps parent:", error);
    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la récupération de l'emploi du temps",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour trouver un étudiant par nom (CORRIGÉE)
async function findStudentByName(enfantName: string) {
  const searchTerms = enfantName.trim().toLowerCase();
  const terms = searchTerms.split(' ').filter(term => term.length > 0);

  if (terms.length === 0) return null;

  try {
    // CORRECTION : Utiliser directement "insensitive" comme string
    const insensitiveMode: any = "insensitive";

    // Recherche par nom complet
    let student = await prisma.student.findFirst({
      where: {
        user: {
          OR: [
            {
              AND: [
                { firstName: { equals: terms[0], mode: insensitiveMode } },
                { lastName: { equals: terms[1] || terms[0], mode: insensitiveMode } }
              ]
            },
            {
              AND: [
                { firstName: { equals: terms[1] || terms[0], mode: insensitiveMode } },
                { lastName: { equals: terms[0], mode: insensitiveMode } }
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
            lastName: true
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
            { firstName: { contains: searchTerms, mode: insensitiveMode } },
            { lastName: { contains: searchTerms, mode: insensitiveMode } },
            ...terms.map(term => ({
              firstName: { contains: term, mode: insensitiveMode }
            })),
            ...terms.map(term => ({
              lastName: { contains: term, mode: insensitiveMode }
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
            lastName: true
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

// Fonction pour récupérer les cours d'un enfant depuis PlanningAssignation
async function getCoursEnfant(filiereId: number, vagueId: string): Promise<Cours[]> {
  console.log(`📚 Récupération des cours depuis PlanningAssignation - Filière: ${filiereId}, Vague: ${vagueId}`);
  
  try {
    const planningAssignations = await prisma.planningAssignation.findMany({
      where: { 
        filiereId: filiereId,
        vagueId: vagueId
      },
      include: {
        module: {
          select: {
            nom: true,
            coefficient: true,
            typeModule: true,
            description: true
          }
        },
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        vague: {
          select: {
            nom: true
          }
        },
        filiere: {
          select: {
            nom: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📅 ${planningAssignations.length} planning(s) trouvé(s) pour l'enfant`);

    const result: Cours[] = [];

    for (const planning of planningAssignations) {
      try {
        // CORRECTION : Vérification plus robuste des scheduleSlots
        if (!planning.scheduleSlots) {
          console.log(`⚠️ Planning ${planning.id} n'a pas de scheduleSlots`);
          continue;
        }

        const slots = planning.scheduleSlots as any;
        
        if (Array.isArray(slots)) {
          for (const slot of slots) {
            if (slot && typeof slot === 'object' && slot.day && slot.startTime && slot.endTime) {
              // CORRECTION : Gestion simplifiée de la salle
              let salleNom = slot.classroom || "Non assigné";
              
              // Si salleId existe, chercher le nom de la salle
              if (slot.salleId) {
                try {
                  const salle = await prisma.salle.findUnique({
                    where: { id: slot.salleId },
                    select: { nom: true }
                  });
                  if (salle) {
                    salleNom = salle.nom;
                  }
                } catch (error) {
                  console.log(`⚠️ Erreur récupération salle ${slot.salleId}:`, error);
                }
              }

              // Normaliser le nom du jour
              const jourNormalise = normaliserJour(slot.day);

              result.push({
                id: `${planning.id}-${slot.id || Math.random().toString(36).substr(2, 9)}`,
                module: planning.module.nom,
                enseignant: `${planning.teacher.user.firstName} ${planning.teacher.user.lastName}`,
                emailEnseignant: planning.teacher.user.email,
                filiere: planning.filiere.nom,
                vague: planning.vague.nom,
                coefficient: planning.module.coefficient,
                type: planning.module.typeModule,
                description: planning.module.description || undefined,
                jour: jourNormalise,
                heureDebut: slot.startTime,
                heureFin: slot.endTime,
                salle: salleNom
              });

              console.log(`✅ Cours ajouté: ${planning.module.nom} - ${jourNormalise} ${slot.startTime}-${slot.endTime}`);
            } else {
              console.log(`⚠️ Slot invalide dans planning ${planning.id}:`, slot);
            }
          }
        } else if (slots && typeof slots === 'object' && slots.day && slots.startTime && slots.endTime) {
          // Gérer le cas où scheduleSlots est un objet unique
          const slot = slots;
          let salleNom = slot.classroom || "Non assigné";
          
          if (slot.salleId) {
            try {
              const salle = await prisma.salle.findUnique({
                where: { id: slot.salleId },
                select: { nom: true }
              });
              if (salle) {
                salleNom = salle.nom;
              }
            } catch (error) {
              console.log(`⚠️ Erreur récupération salle ${slot.salleId}:`, error);
            }
          }

          const jourNormalise = normaliserJour(slot.day);

          result.push({
            id: planning.id,
            module: planning.module.nom,
            enseignant: `${planning.teacher.user.firstName} ${planning.teacher.user.lastName}`,
            emailEnseignant: planning.teacher.user.email,
            filiere: planning.filiere.nom,
            vague: planning.vague.nom,
            coefficient: planning.module.coefficient,
            type: planning.module.typeModule,
            description: planning.module.description || undefined,
            jour: jourNormalise,
            heureDebut: slot.startTime,
            heureFin: slot.endTime,
            salle: salleNom
          });

          console.log(`✅ Cours unique ajouté: ${planning.module.nom} - ${jourNormalise} ${slot.startTime}-${slot.endTime}`);
        } else {
          console.log(`⚠️ Planning ${planning.id} n'a pas de slots valides:`, slots);
        }
      } catch (error) {
        console.error(`❌ Erreur transformation planning ${planning.id}:`, error);
      }
    }

    console.log(`✅ ${result.length} cours transformés pour l'enfant`);
    return result;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des cours de l'enfant:`, error);
    return [];
  }
}

// Fonction pour normaliser les noms de jours
function normaliserJour(jour: string): string {
  const jours: Record<string, string> = {
    'lundi': 'Lundi',
    'mardi': 'Mardi',
    'mercredi': 'Mercredi',
    'jeudi': 'Jeudi',
    'vendredi': 'Vendredi',
    'samedi': 'Samedi',
    'dimanche': 'Dimanche',
    'monday': 'Lundi',
    'tuesday': 'Mardi',
    'wednesday': 'Mercredi',
    'thursday': 'Jeudi',
    'friday': 'Vendredi',
    'saturday': 'Samedi',
    'sunday': 'Dimanche'
  };

  const jourMinuscule = jour.toLowerCase().trim();
  return jours[jourMinuscule] || jour.charAt(0).toUpperCase() + jour.slice(1).toLowerCase();
}