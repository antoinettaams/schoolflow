// app/api/teacher/schedule/route.ts - VERSION CORRIGÉE AVEC SALLES
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log("🔍 Recherche du teacher pour clerkUserId:", clerkUserId);

    // Récupérer l'utilisateur et le teacher
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId },
      include: {
        teacher: true
      }
    });

    if (!dbUser || !dbUser.teacher) {
      console.log("❌ Teacher non trouvé pour cet utilisateur");
      return NextResponse.json({ error: "Professeur non trouvé" }, { status: 404 });
    }

    const teacherId = dbUser.teacher.id;
    console.log("🎯 Teacher ID:", teacherId);

    // Récupérer les enseignements avec les salles
    const enseignements = await prisma.enseignement.findMany({
      where: {
        professeurId: teacherId
      },
      include: {
        module: {
          include: {
            filiere: true
          }
        },
        salle: true,
      },
      orderBy: [
        { jour: 'asc' },
        { heureDebut: 'asc' }
      ]
    });

    console.log("📊 Enseignements trouvés:", enseignements.length);

    // Récupérer les planning assignations avec TOUTES les relations
    const planningAssignations = await prisma.planningAssignation.findMany({
      where: {
        teacherId: teacherId
      },
      include: {
        vague: true,
        filiere: {
          include: {
            students: {
              select: {
                id: true
              }
            }
          }
        },
        module: true,
        teacher: {
          include: {
            user: true
          }
        }
      }
    });

    console.log("📊 Planning Assignations trouvées:", planningAssignations.length);

    // CORRECTION : Récupérer les informations des salles pour les planning assignations
    const planningAssignationsWithSalles = await Promise.all(
      planningAssignations.map(async (assignation) => {
        // Récupérer les salles depuis les scheduleSlots
        const scheduleSlots = assignation.scheduleSlots as any[];
        const slotsWithSalles = await Promise.all(
          scheduleSlots.map(async (slot) => {
            if (slot.salleId) {
              const salle = await prisma.salle.findUnique({
                where: { id: slot.salleId }
              });
              return {
                ...slot,
                salleInfo: salle
              };
            }
            return slot;
          })
        );

        return {
          ...assignation,
          scheduleSlots: slotsWithSalles
        };
      })
    );

    // Formater les données pour l'emploi du temps
    const schedule: any = {
      "Lundi": [],
      "Mardi": [],
      "Mercredi": [],
      "Jeudi": [],
      "Vendredi": [],
      "Samedi": []
    };

    // Fonction pour formater le jour
    const formatDay = (day: string): string => {
      const daysMap: { [key: string]: string } = {
        'MONDAY': 'Lundi',
        'TUESDAY': 'Mardi',
        'WEDNESDAY': 'Mercredi',
        'THURSDAY': 'Jeudi',
        'FRIDAY': 'Vendredi',
        'SATURDAY': 'Samedi',
        'LUNDI': 'Lundi',
        'MARDI': 'Mardi',
        'MERCREDI': 'Mercredi',
        'JEUDI': 'Jeudi',
        'VENDREDI': 'Vendredi',
        'SAMEDI': 'Samedi'
      };
      return daysMap[day.toUpperCase()] || 'Lundi';
    };

    // Fonction pour déterminer le type de cours
    const getCourseType = (typeModule: string): string => {
      const typesMap: { [key: string]: string } = {
        'theorique': 'Cours',
        'pratique': 'TP',
        'mixte': 'Cours',
        'projet': 'Projet'
      };
      return typesMap[typeModule] || 'Cours';
    };

    // CORRECTION : Traiter les enseignements (qui ont déjà les salles)
    enseignements.forEach(enseignement => {
      const jourFormate = formatDay(enseignement.jour);
      const horaire = `${enseignement.heureDebut}-${enseignement.heureFin}`;
      const typeCours = getCourseType(enseignement.module.typeModule);
      
      // Trouver la vague correspondante via planning assignations
      const assignationCorrespondante = planningAssignationsWithSalles.find(pa => 
        pa.moduleId === enseignement.moduleId
      );

      const cours = {
        time: horaire,
        subject: enseignement.module.nom,
        filiere: enseignement.module.filiere.nom,
        vague: assignationCorrespondante?.vague?.nom || "Vague non définie",
        type: typeCours,
        classroom: enseignement.salle?.nom || "Salle non assignée", // ✅ Salle vient de l'enseignement
        studentsCount: assignationCorrespondante?.filiere?.students?.length || 0,
        source: 'enseignement'
      };

      if (schedule[jourFormate]) {
        schedule[jourFormate].push(cours);
      }
    });

    // CORRECTION : Traiter les planning assignations (qui utilisent les scheduleSlots pour les salles)
    planningAssignationsWithSalles.forEach(assignation => {
      // Vérifier si ce module est déjà dans les enseignements
      const existeDeja = enseignements.some(ens => 
        ens.moduleId === assignation.moduleId
      );

      if (!existeDeja && assignation.module && assignation.filiere && assignation.vague) {
        // Récupérer le premier créneau pour avoir la salle
        const scheduleSlots = assignation.scheduleSlots as any[];
        const premierSlot = scheduleSlots[0];
        
        let salleNom = "Salle à définir";
        if (premierSlot?.salleInfo?.nom) {
          salleNom = premierSlot.salleInfo.nom;
        } else if (premierSlot?.classroom) {
          salleNom = premierSlot.classroom;
        }

        // Récupérer l'horaire du premier slot ou utiliser un horaire par défaut
        let horaire = "09:00-12:00";
        if (premierSlot?.startTime && premierSlot?.endTime) {
          horaire = `${premierSlot.startTime}-${premierSlot.endTime}`;
        }

        // Récupérer le jour du premier slot ou utiliser Lundi par défaut
        let jour = "Lundi";
        if (premierSlot?.day) {
          jour = formatDay(premierSlot.day);
        }

        const cours = {
          time: horaire,
          subject: assignation.module.nom,
          filiere: assignation.filiere.nom,
          vague: assignation.vague.nom,
          type: getCourseType(assignation.module.typeModule),
          classroom: salleNom, // ✅ Salle vient des scheduleSlots
          studentsCount: assignation.filiere.students?.length || 0,
          source: 'planning_assignation'
        };

        // Ajouter au jour correspondant
        if (schedule[jour]) {
          schedule[jour].push(cours);
        } else {
          // Fallback sur Lundi si le jour n'est pas reconnu
          schedule["Lundi"].push(cours);
        }
      }
    });

    // Trier les cours par horaire dans chaque jour
    Object.keys(schedule).forEach(jour => {
      schedule[jour].sort((a: any, b: any) => {
        const timeA = a.time.split('-')[0];
        const timeB = b.time.split('-')[0];
        return timeA.localeCompare(timeB);
      });
    });

    const totalCourses = Object.values(schedule).flat().length;

    const response = {
      schedule: schedule,
      totalCourses: totalCourses,
      lastUpdate: new Date().toISOString(),
      metadata: {
        enseignementsCount: enseignements.length,
        assignationsCount: planningAssignations.length,
        coursAvecSalle: Object.values(schedule).flat().filter((c: any) => 
          c.classroom && c.classroom !== "Salle non assignée" && c.classroom !== "Salle à définir"
        ).length
      }
    };

    console.log("✅ Données finales envoyées:", {
      totalEnseignements: enseignements.length,
      totalAssignations: planningAssignations.length,
      coursAvecSalle: response.metadata.coursAvecSalle,
      coursParJour: Object.keys(schedule).reduce((acc, jour) => {
        acc[jour] = schedule[jour].length;
        return acc;
      }, {} as any)
    });

    // Log détaillé des salles trouvées
    console.log("🏫 Détail des salles:");
    Object.keys(schedule).forEach(jour => {
      schedule[jour].forEach((cours: any, index: number) => {
        console.log(`  ${jour} [${index}]: ${cours.subject} - ${cours.classroom} (${cours.source})`);
      });
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Erreur récupération emploi du temps:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'emploi du temps" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}