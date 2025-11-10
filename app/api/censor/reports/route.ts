// app/api/censor/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fonctions utilitaires
function calculateTimeCorrection(planifiee: string, reelle: string): string {
  try {
    const planifieeMinutes = timeToMinutes(planifiee);
    const reelleMinutes = timeToMinutes(reelle);
    const difference = reelleMinutes - planifieeMinutes;

    if (difference === 0) return "0";
    if (difference > 0) return `+${minutesToTime(difference)}`;
    return `-${minutesToTime(Math.abs(difference))}`;
  } catch {
    return "0";
  }
}

function timeToMinutes(time: string): number {
  try {
    // Gérer les formats "2h", "2h30", "2h15", etc.
    const hoursMatch = time.match(/(\d+)h/);
    const minutesMatch = time.match(/(\d+)$/);
    
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    
    return hours * 60 + minutes;
  } catch {
    return 0;
  }
}

function minutesToTime(minutes: number): string {
  try {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins.toString().padStart(2, '0')}` : `${hours}h`;
  } catch {
    return "0h";
  }
}

function calculateRespectDelais(planifiee: string, reelle: string): number {
  try {
    const planifieeMinutes = timeToMinutes(planifiee);
    const reelleMinutes = timeToMinutes(reelle);
    const tolerance = 15; // 15 minutes de tolérance
    
    const difference = Math.abs(reelleMinutes - planifieeMinutes);
    return difference <= tolerance ? 100 : Math.max(0, 100 - (difference - tolerance));
  } catch {
    return 0;
  }
}

// Fonction pour trouver l'utilisateur avec fallback
async function findCensorUser(clerkUserId: string) {
  console.log('🔍 Recherche utilisateur CENSEUR/ADMIN pour:', clerkUserId);

  // 1. Recherche directe par clerkUserId avec rôles Prisma
  let user = await prisma.user.findFirst({
    where: { 
      clerkUserId: clerkUserId,
      role: {
        in: ["CENSEUR", "ADMIN"]
      }
    }
  });

  if (user) {
    console.log('✅ Utilisateur trouvé avec clerkUserId:', user.id, 'Rôle:', user.role);
    return user;
  }

  console.log('⚠️ Utilisateur non trouvé avec clerkUserId, recherche via Clerk...');
  
  try {
    // 2. Récupérer l'utilisateur depuis Clerk avec ses rôles
    const clerkUser = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`
      }
    }).then(res => res.json());

    console.log('👤 Données Clerk:', {
      id: clerkUser.id,
      email: clerkUser.email_addresses?.[0]?.email_address,
      roles: clerkUser.private_metadata?.role
    });

    if (clerkUser) {
      const email = clerkUser.email_addresses?.[0]?.email_address;
      const clerkRole = clerkUser.private_metadata?.role;
      
      console.log('📧 Email trouvé dans Clerk:', email);
      console.log('🎭 Rôle dans Clerk:', clerkRole);

      // Vérifier si l'utilisateur a le rôle Censeur ou Admin dans Clerk
      if (clerkRole === "Censeur" || clerkRole === "Admin") {
        console.log('✅ Rôle autorisé détecté dans Clerk');
        
        // Convertir le rôle Clerk vers le rôle Prisma
        const prismaRole = clerkRole === "Censeur" ? "CENSEUR" : "ADMIN";
        
        // Rechercher l'utilisateur par email
        user = await prisma.user.findFirst({
          where: { 
            email: email
          }
        });

        if (user) {
          console.log('✅ Utilisateur trouvé par email, mise à jour du rôle et clerkUserId...');
          // Mettre à jour le clerkUserId et le rôle pour les prochaines fois
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              clerkUserId: clerkUserId,
              role: prismaRole
            }
          });
          return user;
        } else {
          console.log('❌ Utilisateur non trouvé dans la base avec cet email');
        }
      } else {
        console.log('❌ Rôle non autorisé dans Clerk:', clerkRole);
      }
    }
  } catch (clerkError) {
    console.error('❌ Erreur lors de la récupération depuis Clerk:', clerkError);
  }

  // 3. Fallback: chercher n'importe quel utilisateur CENSEUR/ADMIN (pour le développement)
  console.log('🔧 Fallback: recherche de tout utilisateur CENSEUR/ADMIN...');
  user = await prisma.user.findFirst({
    where: { 
      role: {
        in: ["CENSEUR", "ADMIN"]
      }
    }
  });

  if (user) {
    console.log('⚠️ Utilisation du fallback - utilisateur trouvé:', user.id);
    // Mettre à jour le clerkUserId pour les prochaines fois
    await prisma.user.update({
      where: { id: user.id },
      data: { clerkUserId: clerkUserId }
    });
    return user;
  }

  console.log('❌ Aucun utilisateur CENSEUR/ADMIN trouvé');
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    console.log('🔍 Clerk User ID:', clerkUserId);

    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Rechercher l'utilisateur avec fallback
    const user = await findCensorUser(clerkUserId);

    if (!user) {
      return NextResponse.json({ 
        error: "Accès non autorisé. Rôle Censeur ou Admin requis." 
      }, { status: 403 });
    }

    console.log('✅ Accès autorisé pour:', user.id, 'Rôle:', user.role);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const filiereId = searchParams.get('filiereId');
    const vagueId = searchParams.get('vagueId');
    const teacherId = searchParams.get('teacherId');
    const moduleId = searchParams.get('moduleId');

    // Récupérer toutes les filières avec leurs modules et professeurs
    if (action === 'filieres') {
      try {
        // Récupérer toutes les filières
        const filieres = await prisma.filiere.findMany({
          include: {
            modules: {
              include: {
                enseignements: {
                  include: {
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
                  }
                }
              }
            },
            vaguesPivot: {
              include: {
                vague: true
              }
            },
            planningAssignations: {
              include: {
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
              }
            }
          },
          orderBy: {
            nom: 'asc'
          }
        });

        console.log('📊 Filieres trouvées:', filieres.length);

        // Récupérer tous les professeurs (pour avoir une liste complète)
        const allTeachers = await prisma.teacher.findMany({
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            enseignements: {
              include: {
                module: {
                  include: {
                    filiere: true
                  }
                }
              }
            }
          },
          orderBy: {
            user: {
              firstName: 'asc'
            }
          }
        });

        const formattedFilieres = filieres.map(filiere => {
          // Professeurs spécifiques à cette filière
          const teachersFromEnseignements = filiere.modules.flatMap(module =>
            module.enseignements.map(ens => ({
              id: ens.teacher.id,
              nom: `${ens.teacher.user.firstName} ${ens.teacher.user.lastName}`,
              modules: [module.nom]
            }))
          );

          const teachersFromPlanning = filiere.planningAssignations.map(pa => ({
            id: pa.teacher.id,
            nom: `${pa.teacher.user.firstName} ${pa.teacher.user.lastName}`,
            modules: ['Planning']
          }));

          // Combiner et dédupliquer
          const allFiliereTeachers = [...teachersFromEnseignements, ...teachersFromPlanning];
          const uniqueTeachers = Array.from(
            new Map(allFiliereTeachers.map(teacher => [teacher.id, teacher])).values()
          );

          return {
            id: filiere.id,
            nom: filiere.nom,
            modules: filiere.modules.map(module => ({
              id: module.id,
              nom: module.nom,
              coefficient: module.coefficient,
              typeModule: module.typeModule,
              formateurs: module.enseignements.map(ens => ({
                id: ens.teacher.id,
                nom: `${ens.teacher.user.firstName} ${ens.teacher.user.lastName}`
              }))
            })),
            vagues: filiere.vaguesPivot.map(vp => ({
              id: vp.vague.id,
              nom: vp.vague.nom
            })),
            tousLesFormateurs: uniqueTeachers
          };
        });

        // Liste de tous les professeurs pour les filtres globaux
        const allTeachersFormatted = allTeachers.map(teacher => ({
          id: teacher.id,
          nom: `${teacher.user.firstName} ${teacher.user.lastName}`,
          modules: teacher.enseignements.map(ens => ens.module.nom)
        }));

        return NextResponse.json({
          success: true,
          filieres: formattedFilieres,
          allTeachers: allTeachersFormatted
        });

      } catch (dbError) {
        console.error('❌ Erreur base de données filieres:', dbError);
        return NextResponse.json({
          error: "Erreur lors de l'accès aux filières",
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }, { status: 500 });
      }
    }

    // Récupérer les professeurs avec filtres optionnels
    if (action === 'teachers') {
      try {
        let whereClause: any = {};

        if (filiereId && filiereId !== 'all') {
          whereClause.OR = [
            {
              enseignements: {
                some: {
                  module: {
                    filiereId: parseInt(filiereId)
                  }
                }
              }
            },
            {
              planningAssignations: {
                some: {
                  filiereId: parseInt(filiereId)
                }
              }
            }
          ];
        }

        if (moduleId && moduleId !== 'all') {
          whereClause.enseignements = {
            some: {
              moduleId: parseInt(moduleId)
            }
          };
        }

        const teachers = await prisma.teacher.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            enseignements: {
              include: {
                module: true
              }
            }
          },
          distinct: ['id'],
          orderBy: {
            user: {
              firstName: 'asc'
            }
          }
        });

        const formattedTeachers = teachers.map(teacher => ({
          id: teacher.id,
          nom: `${teacher.user.firstName} ${teacher.user.lastName}`,
          modules: teacher.enseignements.map(ens => ens.module.nom)
        }));

        return NextResponse.json({
          success: true,
          teachers: formattedTeachers
        });

      } catch (dbError) {
        console.error('❌ Erreur base de données teachers:', dbError);
        return NextResponse.json({
          error: "Erreur lors de l'accès aux professeurs",
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }, { status: 500 });
      }
    }

    // Récupérer les rapports avec filtres
    if (action === 'reports') {
      try {
        const whereClause: any = {};

        if (filiereId && filiereId !== 'all') {
          whereClause.module = {
            filiereId: parseInt(filiereId)
          };
        }

        if (vagueId && vagueId !== 'all') {
          whereClause.vagueId = vagueId;
        }

        if (teacherId && teacherId !== 'all') {
          whereClause.teacherId = teacherId;
        }

        if (moduleId && moduleId !== 'all') {
          whereClause.moduleId = parseInt(moduleId);
        }

        console.log('🔍 Recherche rapports avec filtre:', whereClause);

        const reports = await prisma.report.findMany({
          where: whereClause,
          include: {
            module: {
              include: {
                filiere: true
              }
            },
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            vague: true
          },
          orderBy: {
            date: 'desc'
          }
        });

        console.log('📋 Rapports trouvés:', reports.length);

        const formattedReports = reports.map(report => ({
          id: report.id,
          module: report.module.nom,
          formateur: `${report.teacher.user.firstName} ${report.teacher.user.lastName}`,
          vague: report.vague.nom,
          date: report.date.toISOString(),
          chapitre: report.chapitre,
          objectif: report.objectif,
          dureePlanifiee: report.dureePlanifiee,
          dureeReelle: report.dureeReelle,
          progression: report.progression as "Terminé" | "Partiel" | "Non terminé",
          difficulte: report.difficulte || "",
          correctionTemps: calculateTimeCorrection(report.dureePlanifiee, report.dureeReelle),
          evaluation: report.evaluation,
          commentaireProf: report.commentaireProf || "",
          commentaireCenseur: report.commentaireCenseur || "",
          filiere: report.module.filiere.nom,
          moduleId: report.moduleId,
          teacherId: report.teacherId,
          vagueId: report.vagueId
        }));

        return NextResponse.json({
          success: true,
          reports: formattedReports
        });

      } catch (dbError) {
        console.error('❌ Erreur base de données reports:', dbError);
        return NextResponse.json({
          error: "Erreur lors de l'accès aux rapports",
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }, { status: 500 });
      }
    }

    // Récupérer les statistiques
    if (action === 'stats') {
      try {
        const reports = await prisma.report.findMany({
          include: {
            module: {
              include: {
                filiere: true
              }
            }
          }
        });

        // Calculer les statistiques par filière
        const statsByFiliere: Record<string, any> = {};

        reports.forEach(report => {
          const filiereNom = report.module.filiere.nom;
          if (!statsByFiliere[filiereNom]) {
            statsByFiliere[filiereNom] = {
              progressionTotale: 0,
              evaluationTotale: 0,
              respectDelais: 0,
              count: 0
            };
          }

          const stats = statsByFiliere[filiereNom];
          stats.progressionTotale += report.progression === "Terminé" ? 100 : 
                                   report.progression === "Partiel" ? 50 : 0;
          stats.evaluationTotale += report.evaluation;
          stats.respectDelais += calculateRespectDelais(report.dureePlanifiee, report.dureeReelle);
          stats.count++;
        });

        const statsData = Object.entries(statsByFiliere).map(([filiere, data]) => ({
          filiere,
          progressionMoyenne: data.count > 0 ? Math.round(data.progressionTotale / data.count) : 0,
          evaluationMoyenne: data.count > 0 ? parseFloat((data.evaluationTotale / data.count).toFixed(1)) : 0,
          respectDelaisMoyen: data.count > 0 ? Math.round(data.respectDelais / data.count) : 0,
          totalRapports: data.count
        }));

        // Statistiques globales
        const globalStats = {
          totalRapports: reports.length,
          moyenneEvaluation: reports.length > 0 ? 
            parseFloat((reports.reduce((acc, r) => acc + r.evaluation, 0) / reports.length).toFixed(1)) : 0,
          progressionTerminee: reports.filter(r => r.progression === "Terminé").length,
          respectDelais: reports.filter(r => {
            const correction = calculateTimeCorrection(r.dureePlanifiee, r.dureeReelle);
            return correction === "0" || correction.startsWith("-");
          }).length
        };

        return NextResponse.json({
          success: true,
          stats: statsData,
          globalStats: globalStats
        });

      } catch (dbError) {
        console.error('❌ Erreur base de données stats:', dbError);
        return NextResponse.json({
          error: "Erreur lors du calcul des statistiques",
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }, { status: 500 });
      }
    }

    // Récupérer les options pour les formulaires
    if (action === 'form-options') {
      try {
        const [filieres, vagues, teachers] = await Promise.all([
          prisma.filiere.findMany({
            select: {
              id: true,
              nom: true
            },
            orderBy: {
              nom: 'asc'
            }
          }),
          prisma.vague.findMany({
            select: {
              id: true,
              nom: true
            },
            orderBy: {
              nom: 'asc'
            }
          }),
          prisma.teacher.findMany({
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: {
              user: {
                firstName: 'asc'
              }
            }
          })
        ]);

        const formattedTeachers = teachers.map(teacher => ({
          id: teacher.id,
          nom: `${teacher.user.firstName} ${teacher.user.lastName}`
        }));

        return NextResponse.json({
          success: true,
          filieres,
          vagues,
          teachers: formattedTeachers
        });

      } catch (dbError) {
        console.error('❌ Erreur base de données form-options:', dbError);
        return NextResponse.json({
          error: "Erreur lors du chargement des options",
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      error: "Action non valide",
      availableActions: ['filieres', 'teachers', 'reports', 'stats', 'form-options']
    }, { status: 400 });

  } catch (error) {
    console.error("❌ Erreur API reports:", error);
    return NextResponse.json({ 
      error: "Erreur serveur interne",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    console.log('🔍 Clerk User ID POST:', clerkUserId);

    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Rechercher l'utilisateur avec fallback
    const user = await findCensorUser(clerkUserId);

    if (!user) {
      return NextResponse.json({ 
        error: "Accès non autorisé. Rôle Censeur ou Admin requis." 
      }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'create-report') {
      const reportData = body.reportData;

      // Validation des données
      if (!reportData.moduleId || !reportData.teacherId || !reportData.vagueId) {
        return NextResponse.json({ 
          error: "Données manquantes: module, formateur et vague sont requis" 
        }, { status: 400 });
      }

      if (!reportData.chapitre || !reportData.objectif) {
        return NextResponse.json({ 
          error: "Le chapitre et l'objectif sont requis" 
        }, { status: 400 });
      }

      if (!reportData.dureePlanifiee || !reportData.dureeReelle) {
        return NextResponse.json({ 
          error: "Les durées planifiée et réelle sont requises" 
        }, { status: 400 });
      }

      try {
        const newReport = await prisma.report.create({
          data: {
            moduleId: parseInt(reportData.moduleId),
            teacherId: reportData.teacherId,
            vagueId: reportData.vagueId,
            date: new Date(reportData.date),
            chapitre: reportData.chapitre,
            objectif: reportData.objectif,
            dureePlanifiee: reportData.dureePlanifiee,
            dureeReelle: reportData.dureeReelle,
            progression: reportData.progression,
            difficulte: reportData.difficulte || "",
            evaluation: reportData.evaluation,
            commentaireProf: reportData.commentaireProf || "",
            commentaireCenseur: reportData.commentaireCenseur || "",
            createdBy: user.id
          },
          include: {
            module: {
              include: {
                filiere: true
              }
            },
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            vague: true
          }
        });

        const formattedReport = {
          id: newReport.id,
          module: newReport.module.nom,
          formateur: `${newReport.teacher.user.firstName} ${newReport.teacher.user.lastName}`,
          vague: newReport.vague.nom,
          date: newReport.date.toISOString(),
          chapitre: newReport.chapitre,
          objectif: newReport.objectif,
          dureePlanifiee: newReport.dureePlanifiee,
          dureeReelle: newReport.dureeReelle,
          progression: newReport.progression as "Terminé" | "Partiel" | "Non terminé",
          difficulte: newReport.difficulte || "",
          correctionTemps: calculateTimeCorrection(newReport.dureePlanifiee, newReport.dureeReelle),
          evaluation: newReport.evaluation,
          commentaireProf: newReport.commentaireProf || "",
          commentaireCenseur: newReport.commentaireCenseur || "",
          filiere: newReport.module.filiere.nom,
          moduleId: newReport.moduleId,
          teacherId: newReport.teacherId,
          vagueId: newReport.vagueId
        };

        return NextResponse.json({
          success: true,
          report: formattedReport,
          message: "Rapport créé avec succès"
        });

      } catch (dbError) {
        console.error('❌ Erreur création rapport:', dbError);
        return NextResponse.json({
          error: "Erreur lors de la création du rapport",
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }, { status: 500 });
      }
    }

    if (action === 'update-report') {
      const { reportId, updates } = body;

      if (!reportId) {
        return NextResponse.json({ 
          error: "ID du rapport manquant" 
        }, { status: 400 });
      }

      try {
        const updatedReport = await prisma.report.update({
          where: { id: reportId },
          data: {
            ...updates,
            updatedAt: new Date()
          },
          include: {
            module: {
              include: {
                filiere: true
              }
            },
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            vague: true
          }
        });

        const formattedReport = {
          id: updatedReport.id,
          module: updatedReport.module.nom,
          formateur: `${updatedReport.teacher.user.firstName} ${updatedReport.teacher.user.lastName}`,
          vague: updatedReport.vague.nom,
          date: updatedReport.date.toISOString(),
          chapitre: updatedReport.chapitre,
          objectif: updatedReport.objectif,
          dureePlanifiee: updatedReport.dureePlanifiee,
          dureeReelle: updatedReport.dureeReelle,
          progression: updatedReport.progression as "Terminé" | "Partiel" | "Non terminé",
          difficulte: updatedReport.difficulte || "",
          correctionTemps: calculateTimeCorrection(updatedReport.dureePlanifiee, updatedReport.dureeReelle),
          evaluation: updatedReport.evaluation,
          commentaireProf: updatedReport.commentaireProf || "",
          commentaireCenseur: updatedReport.commentaireCenseur || "",
          filiere: updatedReport.module.filiere.nom
        };

        return NextResponse.json({
          success: true,
          report: formattedReport,
          message: "Rapport mis à jour avec succès"
        });

      } catch (dbError) {
        console.error('❌ Erreur mise à jour rapport:', dbError);
        return NextResponse.json({
          error: "Erreur lors de la mise à jour du rapport",
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }, { status: 500 });
      }
    }

    if (action === 'delete-report') {
      const { reportId } = body;

      if (!reportId) {
        return NextResponse.json({ 
          error: "ID du rapport manquant" 
        }, { status: 400 });
      }

      try {
        await prisma.report.delete({
          where: { id: reportId }
        });

        return NextResponse.json({
          success: true,
          message: "Rapport supprimé avec succès"
        });

      } catch (dbError) {
        console.error('❌ Erreur suppression rapport:', dbError);
        return NextResponse.json({
          error: "Erreur lors de la suppression du rapport",
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Action non valide" }, { status: 400 });

  } catch (error) {
    console.error("❌ Erreur API POST reports:", error);
    return NextResponse.json({ 
      error: "Erreur lors du traitement",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}