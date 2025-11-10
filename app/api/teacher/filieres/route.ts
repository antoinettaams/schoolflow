// app/api/teacher/filieres/route.ts - VERSION COMPLÈTE CORRIGÉE
import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log("🔍 Recherche du teacher pour clerkUserId:", clerkUserId);

    // ÉTAPE 1: Récupérer l'utilisateur et son teacher
    const dbUser = await prisma.user.findFirst({
      where: { 
        clerkUserId: clerkUserId
      },
      include: {
        teacher: true
      }
    });

    if (!dbUser || !dbUser.teacher) {
      console.log("❌ Teacher non trouvé pour cet utilisateur");
      return NextResponse.json({ error: "Professeur non trouvé" }, { status: 404 });
    }

    const teacherId = dbUser.teacher.id;
    console.log(`👨‍🏫 Teacher trouvé: ${teacherId}`);

    // ÉTAPE 2: Récupérer les planningAssignations via une requête séparée
    const planningAssignations = await prisma.planningAssignation.findMany({
      where: {
        teacherId: teacherId
      },
      include: {
        vague: {
          select: {
            id: true,
            nom: true,
            dateDebut: true,
            dateFin: true
          }
        },
        filiere: {
          select: {
            id: true,
            nom: true,
            dureeFormation: true,
            students: {
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
          }
        },
        module: {
          select: {
            id: true,
            nom: true,
            typeModule: true,
            coefficient: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 ${planningAssignations.length} assignations trouvées pour le teacher ${teacherId}`);

    if (planningAssignations.length === 0) {
      console.log("ℹ️ Aucune assignation trouvée pour ce professeur");
      return NextResponse.json({
        teacher: {
          id: teacherId,
          name: `${dbUser.firstName} ${dbUser.lastName}`,
          specialite: dbUser.teacher.matiere || "Enseignant",
          email: dbUser.email
        },
        filieres: [],
        stats: {
          totalFilieres: 0,
          totalStudents: 0,
          totalVagues: 0,
          totalModules: 0,
          totalAssignations: 0
        }
      });
    }

    // ÉTAPE 3: Grouper par filière et vague
    const filieresMap = new Map();

    planningAssignations.forEach(pa => {
      // Vérifier que toutes les relations nécessaires existent
      if (!pa.filiere || !pa.vague || !pa.module) {
        console.warn("⚠️ Assignation incomplète ignorée:", pa.id);
        return;
      }

      const key = `${pa.filiere.id}-${pa.vague.id}`;
      
      if (!filieresMap.has(key)) {
        // CORRECTION : Utiliser directement la durée de formation de la filière
        const dureeFormation = formatDuree(pa.filiere.dureeFormation) || "Durée non définie";
        
        filieresMap.set(key, {
          id: pa.filiere.id,
          filiereId: pa.filiere.id,
          name: pa.filiere.nom,
          vagueId: pa.vague.id,
          vagueName: pa.vague.nom,
          studentsCount: pa.filiere.students?.length || 0,
          students: pa.filiere.students?.map(student => ({
            id: student.id,
            name: `${student.user.firstName} ${student.user.lastName}`,
            email: student.user.email,
            studentNumber: student.studentNumber
          })) || [],
          duree: dureeFormation,
          dateDebut: pa.vague.dateDebut,
          dateFin: pa.vague.dateFin,
          professeur: `${dbUser.firstName} ${dbUser.lastName}`,
          modules: []
        });
      }
      
      // Ajouter le module à la filière (éviter les doublons)
      const existingModule = filieresMap.get(key).modules.find(
        (m: any) => m.id === pa.module.id
      );
      
      if (!existingModule) {
        // Récupérer tous les créneaux pour ce module dans cette filière/vague
        const creneauxDuModule = planningAssignations
          .filter(pa2 => 
            pa2.module.id === pa.module.id && 
            pa2.filiere.id === pa.filiere.id && 
            pa2.vague.id === pa.vague.id
          )
          .flatMap(pa2 => {
            const slots = Array.isArray(pa2.scheduleSlots) ? pa2.scheduleSlots : [];
            return slots.map((slot: any) => ({
              id: `${pa2.id}-${slot.id}`,
              jour: slot.day,
              heureDebut: slot.startTime,
              heureFin: slot.endTime,
              salle: slot.classroom,
              salleId: slot.salleId
            }));
          });

        filieresMap.get(key).modules.push({
          id: pa.module.id,
          nom: pa.module.nom,
          type: mapTypeModule(pa.module.typeModule),
          coefficient: pa.module.coefficient,
          creneaux: creneauxDuModule
        });
      }
    });

    const filieres = Array.from(filieresMap.values());

    // Statistiques
    const stats = {
      totalFilieres: filieres.length,
      totalStudents: filieres.reduce((acc, f) => acc + f.studentsCount, 0),
      totalVagues: new Set(filieres.map(f => f.vagueId)).size,
      totalModules: filieres.reduce((acc, f) => acc + f.modules.length, 0),
      totalAssignations: planningAssignations.length
    };

    // Informations détaillées pour le debug
    console.log("✅ Données filières préparées:", {
      teacher: `${dbUser.firstName} ${dbUser.lastName}`,
      teacherId: teacherId,
      filieresCount: filieres.length,
      studentsTotal: stats.totalStudents,
      vaguesCount: stats.totalVagues,
      modulesTotal: stats.totalModules,
      assignationsTotal: stats.totalAssignations
    });

    // Log des filières trouvées avec leurs durées
    filieres.forEach((filiere, index) => {
      console.log(`📚 Filière ${index + 1}:`, {
        nom: filiere.name,
        vague: filiere.vagueName,
        durée: filiere.duree,
        étudiants: filiere.studentsCount,
        modules: filiere.modules.length
      });
    });

    return NextResponse.json({
      teacher: {
        id: teacherId,
        name: `${dbUser.firstName} ${dbUser.lastName}`,
        specialite: dbUser.teacher.matiere || "Enseignant",
        email: dbUser.email
      },
      filieres,
      stats
    });

  } catch (error) {
    console.error("❌ Erreur récupération filières professeur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des filières" },
      { status: 500 }
    );
  }
}

// Fonction pour formater la durée
function formatDuree(duree: string): string {
  if (!duree || duree === "Durée non définie") return "Durée non définie";
  
  // Si c'est un nombre, ajouter " mois"
  if (/^\d+$/.test(duree.trim())) {
    const mois = parseInt(duree.trim());
    return `${mois} mois`;
  }
  
  // Sinon retourner la valeur telle quelle
  return duree;
}

function mapTypeModule(type: string): string {
  switch (type) {
    case "theorique":
      return "Cours";
    case "pratique":
      return "TP";
    case "projet":
      return "Projet";
    case "mixte":
      return "Cours";
    default:
      return "Cours";
  }
}