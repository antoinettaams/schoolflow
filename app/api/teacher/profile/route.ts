import { NextResponse } from "next/server";
import { PrismaClient, TypeModule } from '@prisma/client';
import { auth, clerkClient } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

// Types pour les données
interface ScheduleSlot {
  day?: string;
  startTime?: string;
  endTime?: string;
  salleId?: string;
  classroom?: string;
  salleInfo?: any;
}

interface PlanningAssignationWithSlots {
  id: string;
  filiere: {
    id: number;
    nom: string;
    description: string | null;
  };
  vague: {
    id: string;
    nom: string;
    dateDebut: Date;
    dateFin: Date;
  };
  module: {
    id: number;
    nom: string;
    typeModule: TypeModule;
    coefficient: number;
  };
  scheduleSlots: ScheduleSlot[];
}

interface Cours {
  id: string;
  matiere: string;
  typeMatiere: TypeModule;
  classe: string;
  jour: string;
  horaire: string;
  type: string;
  salle: string;
  capaciteSalle: number;
  filiere: string;
  coefficient: number;
  source: string;
  _debug?: {
    slotData?: {
      startTime?: string;
      endTime?: string;
      day?: string;
      salleId?: string;
      classroom?: string;
      salleInfo?: any;
    };
  };
}

export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log("🔍 Recherche du professeur avec clerkUserId:", clerkUserId);

    // Récupérer les données depuis CLERK
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkUserId);

    // CORRECTION : Récupérer le téléphone depuis les métadonnées Clerk (comme les autres APIs)
    const phoneFromClerk = clerkUser.publicMetadata?.phone as string || 
                          clerkUser.phoneNumbers[0]?.phoneNumber || 
                          null;

    console.log("📞 Téléphone récupéré depuis Clerk:", {
      fromMetadata: clerkUser.publicMetadata?.phone,
      fromPhoneNumbers: clerkUser.phoneNumbers[0]?.phoneNumber,
      finalPhone: phoneFromClerk
    });

    // Récupérer l'utilisateur depuis ta base avec relations nécessaires
    const dbUser = await prisma.user.findFirst({
      where: { clerkUserId: clerkUserId },
      include: {
        teacher: {
          include: { 
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                createdAt: true,
                updatedAt: true
              }
            },
            enseignements: {
              include: {
                module: {
                  include: {
                    filiere: {
                      select: {
                        id: true,
                        nom: true
                      }
                    }
                  }
                },
                salle: {
                  select: {
                    id: true,
                    nom: true,
                    capacite: true
                  }
                }
              },
              orderBy: [
                { jour: 'asc' },
                { heureDebut: 'asc' }
              ]
            },
            planningAssignations: {
              include: {
                filiere: {
                  select: {
                    id: true,
                    nom: true,
                    description: true
                  }
                },
                vague: {
                  select: {
                    id: true,
                    nom: true,
                    dateDebut: true,
                    dateFin: true
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
              }
            }
          }
        }
      }
    });

    if (!dbUser || !dbUser.teacher) {
      console.log("❌ Aucun professeur trouvé pour clerkUserId:", clerkUserId);
      return NextResponse.json({ error: "Professeur non trouvé" }, { status: 404 });
    }

    const teacher = dbUser.teacher;

    console.log("📊 Données teacher:", {
      matiereDB: teacher.matiere,
      enseignements: teacher.enseignements.length,
      assignations: teacher.planningAssignations.length,
      phoneFromDB: teacher.user?.phone,
      phoneFromClerk: phoneFromClerk
    });

    // CORRECTION : Synchroniser le téléphone Clerk vers la base si différent
    const phoneInDB = teacher.user?.phone || null;

    if (phoneFromClerk && phoneFromClerk !== phoneInDB) {
      console.log("🔄 Mise à jour du téléphone dans la base:", {
        ancien: phoneInDB,
        nouveau: phoneFromClerk
      });
      
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { phone: phoneFromClerk }
      });
      
      // Mise à jour locale pour utilisation immédiate
      teacher.user.phone = phoneFromClerk;
      console.log("✅ Téléphone mis à jour dans la base de données");
    } else if (!phoneFromClerk && phoneInDB) {
      console.log("ℹ️  Téléphone déjà en base:", phoneInDB);
    } else if (!phoneFromClerk && !phoneInDB) {
      console.log("⚠️  Aucun téléphone trouvé ni dans Clerk ni en base");
    }

    // CORRECTION : Récupérer les salles pour les planning assignations
    const planningAssignationsWithSalles: PlanningAssignationWithSlots[] = await Promise.all(
      teacher.planningAssignations.map(async (assignation) => {
        const scheduleSlots = assignation.scheduleSlots as ScheduleSlot[];
        
        if (!scheduleSlots || scheduleSlots.length === 0) {
          return {
            ...assignation,
            scheduleSlots: []
          };
        }

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

    // CORRECTION : MATIÈRE PRINCIPALE (priorité à base, sinon calcul)
    let matierePrincipale = teacher.matiere;

    if (!matierePrincipale || matierePrincipale === "À définir" || matierePrincipale.trim() === "") {
      const matiereCounts: { [key: string]: number } = {};

      teacher.enseignements.forEach(enseignement => {
        if (enseignement.module?.nom) {
          matiereCounts[enseignement.module.nom] = (matiereCounts[enseignement.module.nom] || 0) + 1;
        }
      });

      teacher.planningAssignations.forEach(pa => {
        if (pa.module?.nom) {
          matiereCounts[pa.module.nom] = (matiereCounts[pa.module.nom] || 0) + 1;
        }
      });

      if (Object.keys(matiereCounts).length > 0) {
        matierePrincipale = Object.keys(matiereCounts).reduce((a, b) =>
          matiereCounts[a] > matiereCounts[b] ? a : b
        );
        console.log("✅ Matière calculée:", matierePrincipale);
      } else {
        matierePrincipale = "Enseignant";
        console.log("⚠️ Aucune matière trouvée, fallback enseignant");
      }
    }

    // Spécialité (filière la plus fréquente)
    const filiereCounts: { [key: string]: number } = {};
    teacher.planningAssignations.forEach(pa => {
      if (pa.filiere?.nom) {
        filiereCounts[pa.filiere.nom] = (filiereCounts[pa.filiere.nom] || 0) + 1;
      }
    });

    let specialite = "À définir";
    if (Object.keys(filiereCounts).length > 0) {
      specialite = Object.keys(filiereCounts).reduce((a, b) =>
        filiereCounts[a] > filiereCounts[b] ? a : b
      );
    }

    const filieres = [...new Set(
      teacher.planningAssignations
        .filter(pa => pa.filiere?.nom)
        .map(pa => pa.filiere.nom)
    )];

    const matieresEnseignements = [...new Set(
      teacher.enseignements
        .filter(e => e.module?.nom)
        .map(e => e.module.nom)
    )];

    const matieresAssignations = [...new Set(
      teacher.planningAssignations
        .filter(pa => pa.module?.nom)
        .map(pa => pa.module.nom)
    )];

    const matieres = [...new Set([...matieresEnseignements, ...matieresAssignations])];

    // CORRECTION : COURS PROGRAMMÉS - UTILISER LES VRAIES DONNÉES DES SCHEDULE SLOTS
    const coursFromEnseignements: Cours[] = teacher.enseignements
      .filter(enseignement =>
        enseignement.module &&
        enseignement.jour &&
        enseignement.heureDebut &&
        enseignement.heureFin
      )
      .map(enseignement => {
        const assignationCorrespondante = teacher.planningAssignations.find(
          pa => pa.moduleId === enseignement.moduleId
        );

        return {
          id: `enseignement_${enseignement.id}`,
          matiere: enseignement.module.nom,
          typeMatiere: enseignement.module.typeModule,
          classe: assignationCorrespondante?.filiere?.nom || 'Non assigné',
          jour: formatDay(enseignement.jour),
          horaire: `${enseignement.heureDebut} - ${enseignement.heureFin}`,
          type: mapTypeModule(enseignement.module.typeModule),
          salle: enseignement.salle?.nom || 'Non assignée',
          capaciteSalle: enseignement.salle?.capacite || 0,
          filiere: assignationCorrespondante?.filiere?.nom || 'Non assignée',
          coefficient: enseignement.module.coefficient,
          source: 'enseignement'
        };
      });

    // CORRECTION : UTILISER LES VRAIS HORAIRES ET SALLES DES SCHEDULE SLOTS
    const coursFromAssignations: Cours[] = planningAssignationsWithSalles
      .filter(pa => 
        pa.module && 
        !teacher.enseignements.some(e => e.moduleId === pa.module.id)
      )
      .flatMap((pa): Cours[] => {
        const scheduleSlots = pa.scheduleSlots;
        
        if (!scheduleSlots || scheduleSlots.length === 0) {
          // Fallback si pas de scheduleSlots
          return [{
            id: `assignation_${pa.id}_default`,
            matiere: pa.module.nom,
            typeMatiere: pa.module.typeModule,
            classe: pa.filiere?.nom || 'Non assigné',
            jour: 'Lundi',
            horaire: '08:00 - 10:00',
            type: mapTypeModule(pa.module.typeModule),
            salle: 'À définir',
            capaciteSalle: 0,
            filiere: pa.filiere?.nom || 'Non assignée',
            coefficient: pa.module.coefficient,
            source: 'assignation'
          }];
        }

        // Créer un cours pour chaque scheduleSlot
        return scheduleSlots.map((slot, slotIndex): Cours => {
          const horaire = slot.startTime && slot.endTime 
            ? `${slot.startTime} - ${slot.endTime}`
            : 'Horaire non défini';
          
          const jour = slot.day ? formatDay(slot.day) : 'Jour non défini';
          
          // Récupérer la salle depuis salleInfo ou classroom
          const salle = slot.salleInfo?.nom || slot.classroom || 'À définir';
          const capaciteSalle = slot.salleInfo?.capacite || 0;

          return {
            id: `assignation_${pa.id}_slot_${slotIndex}`,
            matiere: pa.module.nom,
            typeMatiere: pa.module.typeModule,
            classe: pa.filiere?.nom || 'Non assigné',
            jour: jour,
            horaire: horaire,
            type: mapTypeModule(pa.module.typeModule),
            salle: salle,
            capaciteSalle: capaciteSalle,
            filiere: pa.filiere?.nom || 'Non assignée',
            coefficient: pa.module.coefficient,
            source: 'assignation',
            // Debug info
            _debug: {
              slotData: {
                startTime: slot.startTime,
                endTime: slot.endTime,
                day: slot.day,
                salleId: slot.salleId,
                classroom: slot.classroom,
                salleInfo: slot.salleInfo
              }
            }
          };
        });
      });

    const cours: Cours[] = [...coursFromEnseignements, ...coursFromAssignations];

    // Trier les cours par jour et horaire
    const joursOrdre = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    cours.sort((a, b) => {
      const jourA = joursOrdre.indexOf(a.jour);
      const jourB = joursOrdre.indexOf(b.jour);
      if (jourA !== jourB) return jourA - jourB;
      return a.horaire.localeCompare(b.horaire);
    });

    const stats = {
      totalCours: cours.length,
      totalFilieres: filieres.length,
      totalMatieres: matieres.length,
      totalClasses: [...new Set(cours.map(c => `${c.filiere} - ${c.classe}`))].length,
      totalAssignations: teacher.planningAssignations.length,
      totalEnseignements: teacher.enseignements.length,
      // Stats détaillées sur les horaires
      coursAvecHoraireReel: cours.filter(c => c.horaire !== 'Horaire non défini').length,
      coursAvecSalleReelle: cours.filter(c => c.salle !== 'À définir' && c.salle !== 'Non assignée').length
    };

    const planningParJour = groupCoursByDay(cours);

    const activities = [
      {
        id: 1,
        type: "login",
        description: "Connexion réussie au système",
        timestamp: new Date().toISOString(),
      },
      {
        id: 2,
        type: "course_teaching",
        description: stats.totalCours > 0 ? `Enseignement de ${matierePrincipale}` : "Préparation des cours",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        type: "schedule_view",
        description: "Consultation de l'emploi du temps",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      }
    ];

    // CORRECTION : Utiliser le téléphone synchronisé
    const finalPhone = teacher.user?.phone || phoneFromClerk || "Non renseigné";

    const responseData = {
      teacherInfo: {
        name: `${clerkUser.firstName} ${clerkUser.lastName}`,
        email: clerkUser.emailAddresses[0]?.emailAddress || dbUser.email,
        phone: finalPhone, // CORRECTION : Utiliser le téléphone synchronisé
        specialite: specialite,
        createdAt: dbUser.createdAt,
        userId: dbUser.id
      },
      professionalInfo: {
        matiere: matierePrincipale,
        filieres: filieres,
        classes: teacher.planningAssignations
          .filter(pa => pa.filiere && pa.vague)
          .map(pa => ({
            filiere: pa.filiere.nom,
            vague: pa.vague.nom,
            periode: `${new Date(pa.vague.dateDebut).toLocaleDateString('fr-FR')} - ${new Date(pa.vague.dateFin).toLocaleDateString('fr-FR')}`
          })),
        matieresEnseignees: matieres,
        anneesExperience: "8 ans",
        statut: "Actif"
      },
      cours: cours,
      planningParJour,
      stats,
      activities,
      _debug: {
        matiereFromDB: teacher.matiere,
        matiereCalculated: matierePrincipale,
        specialiteCalculated: specialite,
        enseignementsCount: teacher.enseignements.length,
        assignationsCount: teacher.planningAssignations.length,
        coursTotal: cours.length,
        phoneSync: {
          fromClerk: phoneFromClerk,
          fromDB: phoneInDB,
          final: finalPhone
        },
        scheduleSlotsStructure: planningAssignationsWithSalles.map(pa => ({
          module: pa.module.nom,
          slotsCount: pa.scheduleSlots.length,
          slots: pa.scheduleSlots.map(s => ({
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
            salle: s.salleInfo?.nom || s.classroom
          }))
        }))
      }
    };

    console.log("✅ Données profil finales:", {
      teacher: responseData.teacherInfo.name,
      téléphone: responseData.teacherInfo.phone,
      matière: responseData.professionalInfo.matiere,
      spécialité: responseData.teacherInfo.specialite,
      coursProgrammés: responseData.cours.length,
      coursAvecHoraireReel: stats.coursAvecHoraireReel,
      coursAvecSalleReelle: stats.coursAvecSalleReelle
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("❌ Erreur récupération profil professeur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du profil" },
      { status: 500 }
    );
  }
}

// Fonctions utilitaires (inchangées)

function formatDay(day: string): string {
  const daysMap: { [key: string]: string } = {
    'MONDAY': 'Lundi',
    'TUESDAY': 'Mardi',
    'WEDNESDAY': 'Mercredi',
    'THURSDAY': 'Jeudi',
    'FRIDAY': 'Vendredi',
    'SATURDAY': 'Samedi',
    'SUNDAY': 'Dimanche',
    'LUNDI': 'Lundi',
    'MARDI': 'Mardi',
    'MERCREDI': 'Mercredi',
    'JEUDI': 'Jeudi',
    'VENDREDI': 'Vendredi',
    'SAMEDI': 'Samedi',
    'DIMANCHE': 'Dimanche'
  };
  return daysMap[day?.toUpperCase()] || day || 'À définir';
}

function mapTypeModule(type: TypeModule): string {
  switch (type?.toLowerCase()) {
    case "theorique":
    case "th":
      return "Cours";
    case "pratique":
    case "pr":
      return "TP";
    case "projet":
      return "Projet";
    case "mixte":
      return "Cours";
    case "td":
      return "TD";
    default:
      return "Cours";
  }
}

function groupCoursByDay(cours: Cours[]) {
  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  return jours.map(jour => ({
    jour,
    cours: cours
      .filter(c => c.jour === jour)
      .sort((a, b) => a.horaire.localeCompare(b.horaire))
  })).filter(jour => jour.cours.length > 0);
}