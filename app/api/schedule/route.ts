// app/api/schedule/route.ts - VERSION CORRIGÉE
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
  dureeFormation?: string;
  periodeVague?: string;
  planningId?: string;
}

interface UserInfo {
  role: string;
  nom?: string;
  filiere?: string;
  vague?: string;
  enfant?: string;
  filiereEnfant?: string;
  vagueEnfant?: string;
  relation?: string;
  matiere?: string;
}

// GET - Récupérer l'emploi du temps selon le rôle
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log(`🔍 Récupération emploi du temps pour l'utilisateur: ${userId}`);

    // Récupérer l'utilisateur avec ses relations selon son rôle
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        // Inclure les relations selon le rôle
        ...(await getIncludeForRole(userId))
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    console.log(`👤 Rôle détecté: ${user.role}`);

    let cours: Cours[] = [];
    let userInfo: UserInfo = { role: user.role };

    // Logique selon le rôle
    switch (user.role) {
      case "ETUDIANT":
        if (user.student && user.student.filiereId) {
          cours = await getCoursFiliere(user.student.filiereId);
          userInfo = {
            role: "Étudiant",
            filiere: user.student.filiere?.nom || "Non assigné",
            vague: user.student.vague?.nom || "Non assigné",
            nom: `${user.firstName} ${user.lastName}`
          };
        } else {
          return NextResponse.json({
            error: "Profil étudiant incomplet",
            message: "Votre profil étudiant n'est pas complètement configuré"
          }, { status: 400 });
        }
        break;

      case "PARENT":
        // CORRECTION: Recherche de l'enfant par le nom stocké dans le parent
        const parent = await prisma.parent.findUnique({
          where: { userId: user.id }
        });

        if (parent && parent.enfantName) {
          console.log(`👨‍👦 Parent trouvé, recherche de l'enfant: "${parent.enfantName}"`);
          
          // Rechercher l'étudiant par nom
          const enfant = await findStudentByName(parent.enfantName);
          
          if (enfant && enfant.filiereId) {
            cours = await getCoursFiliere(enfant.filiereId);
            userInfo = {
              role: "Parent",
              enfant: `${enfant.user.firstName} ${enfant.user.lastName}`,
              filiereEnfant: enfant.filiere?.nom || "Non assigné",
              vagueEnfant: enfant.vague?.nom || "Non assigné",
              relation: parent.relation,
              nom: `${user.firstName} ${user.lastName}`
            };
            console.log(`✅ Emploi du temps récupéré pour l'enfant: ${enfant.user.firstName} ${enfant.user.lastName}`);
          } else {
            return NextResponse.json({
              error: "Enfant non trouvé",
              message: `Aucun étudiant trouvé correspondant à "${parent.enfantName}". Vérifiez le nom ou contactez l'administration.`,
              debug: {
                parentEnfantName: parent.enfantName,
                studentsCount: await prisma.student.count()
              }
            }, { status: 404 });
          }
        } else {
          return NextResponse.json({
            error: "Profil parent incomplet",
            message: "Votre profil parent n'est pas complètement configuré (nom d'enfant manquant)"
          }, { status: 400 });
        }
        break;

      case "ENSEIGNANT":
        if (user.teacher) {
          cours = await getCoursEnseignant(user.teacher.id);
          userInfo = {
            role: "Enseignant",
            matiere: user.teacher.matiere,
            nom: `${user.firstName} ${user.lastName}`
          };
        } else {
          return NextResponse.json({
            error: "Profil enseignant incomplet",
            message: "Votre profil enseignant n'est pas complètement configuré"
          }, { status: 400 });
        }
        break;

      default:
        return NextResponse.json({
          error: "Rôle non supporté",
          message: "L'emploi du temps n'est disponible que pour les étudiants, parents et enseignants"
        }, { status: 403 });
    }

    console.log(`📊 ${cours.length} cours récupérés pour ${user.role}`);

    return NextResponse.json({
      cours,
      userInfo,
      totalCours: cours.length
    });

  } catch (error) {
    console.error("❌ Erreur récupération emploi du temps:", error);
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

// Fonction pour déterminer les relations à inclure selon le rôle
async function getIncludeForRole(userId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { role: true }
  });

  if (!user) return {};

  switch (user.role) {
    case "ETUDIANT":
      return {
        student: {
          include: {
            filiere: true,
            vague: true
          }
        }
      };
    case "PARENT":
      return {
        parent: true
      };
    case "ENSEIGNANT":
      return {
        teacher: true
      };
    default:
      return {};
  }
}

// CORRECTION: Fonction pour trouver un étudiant par nom
async function findStudentByName(enfantName: string) {
  // Essayer plusieurs méthodes de recherche
  const searchTerms = enfantName.trim().toLowerCase();
  const terms = searchTerms.split(' ').filter(term => term.length > 0);

  console.log(`🔍 Recherche de l'étudiant avec les termes:`, terms);

  // Recherche 1: Correspondance exacte du nom complet
  let student = await prisma.student.findFirst({
    where: {
      user: {
        OR: [
          {
            AND: [
              { firstName: { equals: terms[0], mode: "insensitive" } },
              { lastName: { equals: terms[1] || terms[0], mode: "insensitive" } }
            ]
          },
          {
            AND: [
              { firstName: { equals: terms[1] || terms[0], mode: "insensitive" } },
              { lastName: { equals: terms[0], mode: "insensitive" } }
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

  // Recherche 2: Recherche partielle
  student = await prisma.student.findFirst({
    where: {
      user: {
        OR: [
          { firstName: { contains: searchTerms, mode: "insensitive" } },
          { lastName: { contains: searchTerms, mode: "insensitive" } },
          ...terms.map(term => ({
            firstName: { contains: term, mode: "insensitive" }
          })),
          ...terms.map(term => ({
            lastName: { contains: term, mode: "insensitive" }
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
    return student;
  }

  console.log(`❌ Aucun étudiant trouvé pour: "${enfantName}"`);
  return null;
}

// Fonction pour récupérer les cours d'une filière
async function getCoursFiliere(filiereId: number): Promise<Cours[]> {
  console.log(`📚 Récupération des cours pour la filière: ${filiereId}`);
  
  const planning = await prisma.planningAssignation.findMany({
    where: { 
      filiereId: filiereId 
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
          nom: true,
          dateDebut: true,
          dateFin: true
        }
      },
      filiere: {
        select: {
          nom: true,
          dureeFormation: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  console.log(`📅 ${planning.length} planning(s) trouvé(s) pour la filière ${filiereId}`);

  const result: Cours[] = [];

  for (const p of planning) {
    try {
      const slots = p.scheduleSlots as any;
      
      if (Array.isArray(slots)) {
        for (const slot of slots) {
          if (slot && typeof slot === 'object') {
            result.push({
              id: `${p.id}-${slot.id || Math.random().toString(36).substr(2, 9)}`,
              module: p.module.nom,
              enseignant: `${p.teacher.user.firstName} ${p.teacher.user.lastName}`,
              emailEnseignant: p.teacher.user.email,
              filiere: p.filiere.nom,
              vague: p.vague.nom,
              coefficient: p.module.coefficient,
              type: p.module.typeModule,
              description: p.module.description || undefined,
              jour: slot.day || "Non défini",
              heureDebut: slot.startTime || "00:00",
              heureFin: slot.endTime || "00:00",
              salle: slot.classroom || "Non assigné",
              dureeFormation: p.filiere.dureeFormation,
              periodeVague: p.vague.dateDebut && p.vague.dateFin 
                ? `${p.vague.dateDebut.toLocaleDateString()} - ${p.vague.dateFin.toLocaleDateString()}`
                : "Non définie",
              planningId: p.id
            });
          }
        }
      } else if (slots && typeof slots === 'object') {
        result.push({
          id: p.id,
          module: p.module.nom,
          enseignant: `${p.teacher.user.firstName} ${p.teacher.user.lastName}`,
          emailEnseignant: p.teacher.user.email,
          filiere: p.filiere.nom,
          vague: p.vague.nom,
          coefficient: p.module.coefficient,
          type: p.module.typeModule,
          description: p.module.description || undefined,
          jour: slots.day || "Non défini",
          heureDebut: slots.startTime || "00:00",
          heureFin: slots.endTime || "00:00",
          salle: slots.classroom || "Non assigné",
          dureeFormation: p.filiere.dureeFormation,
          periodeVague: p.vague.dateDebut && p.vague.dateFin 
            ? `${p.vague.dateDebut.toLocaleDateString()} - ${p.vague.dateFin.toLocaleDateString()}`
            : "Non définie",
          planningId: p.id
        });
      } else {
        result.push({
          id: p.id,
          module: p.module.nom,
          enseignant: `${p.teacher.user.firstName} ${p.teacher.user.lastName}`,
          emailEnseignant: p.teacher.user.email,
          filiere: p.filiere.nom,
          vague: p.vague.nom,
          coefficient: p.module.coefficient,
          type: p.module.typeModule,
          description: p.module.description || undefined,
          jour: "Non défini",
          heureDebut: "00:00",
          heureFin: "00:00",
          salle: "Non assigné",
          dureeFormation: p.filiere.dureeFormation,
          periodeVague: p.vague.dateDebut && p.vague.dateFin 
            ? `${p.vague.dateDebut.toLocaleDateString()} - ${p.vague.dateFin.toLocaleDateString()}`
            : "Non définie",
          planningId: p.id
        });
      }
    } catch (error) {
      console.error(`❌ Erreur transformation planning ${p.id}:`, error);
      result.push({
        id: p.id,
        module: p.module.nom,
        enseignant: `${p.teacher.user.firstName} ${p.teacher.user.lastName}`,
        filiere: p.filiere.nom,
        vague: p.vague.nom,
        coefficient: p.module.coefficient,
        type: p.module.typeModule,
        jour: "Erreur",
        heureDebut: "00:00",
        heureFin: "00:00",
        salle: "Non assigné"
      });
    }
  }

  console.log(`✅ ${result.length} cours transformés pour la filière ${filiereId}`);
  return result;
}

// Fonction pour récupérer les cours d'un enseignant
async function getCoursEnseignant(teacherId: string): Promise<Cours[]> {
  const planning = await prisma.planningAssignation.findMany({
    where: { 
      teacherId: teacherId 
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
      vague: {
        select: {
          nom: true,
          dateDebut: true,
          dateFin: true
        }
      },
      filiere: {
        select: {
          nom: true,
          dureeFormation: true
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
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  const result: Cours[] = [];

  for (const p of planning) {
    try {
      const slots = p.scheduleSlots as any;
      
      if (Array.isArray(slots)) {
        for (const slot of slots) {
          if (slot && typeof slot === 'object') {
            result.push({
              id: `${p.id}-${slot.id || Math.random().toString(36).substr(2, 9)}`,
              module: p.module.nom,
              enseignant: `${p.teacher.user.firstName} ${p.teacher.user.lastName}`,
              emailEnseignant: p.teacher.user.email,
              filiere: p.filiere.nom,
              vague: p.vague.nom,
              coefficient: p.module.coefficient,
              type: p.module.typeModule,
              description: p.module.description || undefined,
              jour: slot.day || "Non défini",
              heureDebut: slot.startTime || "00:00",
              heureFin: slot.endTime || "00:00",
              salle: slot.classroom || "Non assigné",
              dureeFormation: p.filiere.dureeFormation,
              periodeVague: p.vague.dateDebut && p.vague.dateFin 
                ? `${p.vague.dateDebut.toLocaleDateString()} - ${p.vague.dateFin.toLocaleDateString()}`
                : "Non définie",
              planningId: p.id
            });
          }
        }
      } else if (slots && typeof slots === 'object') {
        result.push({
          id: p.id,
          module: p.module.nom,
          enseignant: `${p.teacher.user.firstName} ${p.teacher.user.lastName}`,
          emailEnseignant: p.teacher.user.email,
          filiere: p.filiere.nom,
          vague: p.vague.nom,
          coefficient: p.module.coefficient,
          type: p.module.typeModule,
          description: p.module.description || undefined,
          jour: slots.day || "Non défini",
          heureDebut: slots.startTime || "00:00",
          heureFin: slots.endTime || "00:00",
          salle: slots.classroom || "Non assigné",
          dureeFormation: p.filiere.dureeFormation,
          periodeVague: p.vague.dateDebut && p.vague.dateFin 
            ? `${p.vague.dateDebut.toLocaleDateString()} - ${p.vague.dateFin.toLocaleDateString()}`
            : "Non définie",
          planningId: p.id
        });
      } else {
        result.push({
          id: p.id,
          module: p.module.nom,
          enseignant: `${p.teacher.user.firstName} ${p.teacher.user.lastName}`,
          emailEnseignant: p.teacher.user.email,
          filiere: p.filiere.nom,
          vague: p.vague.nom,
          coefficient: p.module.coefficient,
          type: p.module.typeModule,
          description: p.module.description || undefined,
          jour: "Non défini",
          heureDebut: "00:00",
          heureFin: "00:00",
          salle: "Non assigné",
          dureeFormation: p.filiere.dureeFormation,
          periodeVague: p.vague.dateDebut && p.vague.dateFin 
            ? `${p.vague.dateDebut.toLocaleDateString()} - ${p.vague.dateFin.toLocaleDateString()}`
            : "Non définie",
          planningId: p.id
        });
      }
    } catch (error) {
      console.error(`❌ Erreur transformation planning enseignant ${p.id}:`, error);
      result.push({
        id: p.id,
        module: p.module.nom,
        enseignant: `${p.teacher.user.firstName} ${p.teacher.user.lastName}`,
        filiere: p.filiere.nom,
        vague: p.vague.nom,
        coefficient: p.module.coefficient,
        type: p.module.typeModule,
        jour: "Erreur",
        heureDebut: "00:00",
        heureFin: "00:00",
        salle: "Non assigné"
      });
    }
  }

  return result;
}