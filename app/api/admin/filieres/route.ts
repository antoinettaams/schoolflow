import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// Fonction pour formater la durée sans conversion
function formaterDuree(dureeFormation: string | null): string {
  if (!dureeFormation) return "3 ans"; // Valeur par défaut
  
  console.log(`🔍 Durée originale: "${dureeFormation}"`);
  
  // Nettoyer la chaîne et la retourner telle quelle
  const dureeNettoyee = dureeFormation.trim();
  
  // Si la chaîne est vide, retourner la valeur par défaut
  if (!dureeNettoyee) return "3 ans";
  
  console.log(`✅ Durée affichée: "${dureeNettoyee}"`);
  return dureeNettoyee;
}

// Fonction pour calculer la durée moyenne en string cohérente
function calculerDureeMoyenne(filieres: any[]): string {
  if (filieres.length === 0) return "3 ans";

  // Extraire les nombres des durées pour calculer la moyenne
  const nombres = filieres.map(filiere => {
    const duree = formaterDuree(filiere.dureeFormation);
    const match = duree.match(/(\d+)/);
    return match ? parseInt(match[1]) : 3;
  });

  const moyenne = Math.round(nombres.reduce((a, b) => a + b, 0) / nombres.length);
  
  // Déterminer l'unité la plus courante
  const unites: { [key: string]: number } = {};
  filieres.forEach(filiere => {
    const duree = formaterDuree(filiere.dureeFormation);
    const unite = duree.includes('mois') ? 'mois' : 'ans';
    unites[unite] = (unites[unite] || 0) + 1;
  });

  const uniteLaPlusCourante = unites.mois > unites.ans ? 'mois' : 'ans';
  
  // Si l'unité est "mois" et la moyenne > 12, convertir en années
  if (uniteLaPlusCourante === 'mois' && moyenne >= 12) {
    const annees = Math.round(moyenne / 12);
    return `${annees} an${annees > 1 ? 's' : ''}`;
  }

  return uniteLaPlusCourante === 'mois' ? `${moyenne} mois` : `${moyenne} an${moyenne > 1 ? 's' : ''}`;
}

// GET - Route principale avec paramètres pour différentes actions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const searchTerm = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const vagueId = searchParams.get('vagueId');

    // ACTION: Récupérer les statistiques des filières
    if (action === 'stats') {
      return await getFilieresStats();
    }

    // ACTION: Récupérer les étudiants depuis Clerk et Prisma
    if (action === 'etudiants') {
      return await getEtudiantsComplets();
    }

    // ACTION: Récupérer les statistiques globales du dashboard
    if (action === 'dashboard-stats') {
      return await getDashboardStats();
    }

    // ACTION PAR DÉFAUT: Récupérer toutes les filières
    return await getFilieres(searchTerm, status, vagueId);

  } catch (error) {
    console.error('Erreur API filières:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Fonction pour récupérer les filières avec filtres
async function getFilieres(searchTerm: string, status: string | null, vagueId: string | null) {
  try {
    // Récupérer les filières avec leurs relations
    const filieres = await prisma.filiere.findMany({
      include: {
        modules: {
          include: {
            semestre: true,
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
                },
                salle: true
              }
            }
          }
        },
        semestres: true,
        students: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            vague: {
              select: {
                isActive: true,
                nom: true,
                id: true
              }
            }
          }
        },
        vaguesPivot: {
          include: {
            vague: {
              select: {
                id: true,
                nom: true,
                isActive: true
              }
            }
          }
        },
        planningAssignations: {
          include: {
            vague: {
              select: {
                id: true,
                nom: true,
                isActive: true
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
            module: {
              select: {
                id: true,
                nom: true
              }
            }
          }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    });

    // Transformer les données pour le frontend
    const filieresFormatted = filieres.map(filiere => {
      // CORRECTION: Utiliser la fonction de formatage sans conversion
      const durationDisplay = formaterDuree(filiere.dureeFormation);

      // Compter les étudiants actifs (ceux qui ont une vague active)
      const studentsActifs = filiere.students.filter(student => 
        student.vague?.isActive === true
      );

      // Compter les enseignants uniques depuis planningAssignations
      const enseignantsUniques = new Set(
        filiere.planningAssignations.map((pa: any) => pa.teacherId)
      );

      // Récupérer les vagues associées depuis vaguesPivot ET planningAssignations
      const vaguesFromPivot = filiere.vaguesPivot.map(vp => ({
        id: vp.vague.id,
        nom: vp.vague.nom,
        isActive: vp.vague.isActive
      }));

      const vaguesFromPlanning = filiere.planningAssignations.map((pa: any) => ({
        id: pa.vague.id,
        nom: pa.vague.nom,
        isActive: pa.vague.isActive
      }));

      // Fusionner les vagues et supprimer les doublons
      const toutesVagues = [...vaguesFromPivot, ...vaguesFromPlanning];
      const vaguesUniques = toutesVagues.filter((vague, index, self) => 
        index === self.findIndex(v => v.id === vague.id)
      );

      const vaguesAssociees = vaguesUniques.map(v => v.nom);

      // Formater les modules
      const modulesFormatted = filiere.modules.map(module => ({
        id: module.id.toString(),
        name: module.nom,
        coefficient: module.coefficient,
        typeModule: module.typeModule,
        description: module.description,
        semestre: module.semestre?.nom,
        enseignants: module.enseignements.map(ens => ({
          id: ens.teacher.id,
          name: `${ens.teacher.user.firstName} ${ens.teacher.user.lastName}`
        })),
        // Récupérer les vagues depuis les assignations
        vagues: Array.from(new Set(
          filiere.planningAssignations
            .filter((pa: any) => pa.moduleId === module.id)
            .map((pa: any) => pa.vague.nom)
        ))
      }));

      // Déterminer le statut basé sur l'activité
      const hasActiveStudents = studentsActifs.length > 0;
      const hasCurrentPlanning = filiere.planningAssignations.some((pa: any) => 
        pa.vague.isActive === true
      );
      const hasActiveVagues = vaguesUniques.some(v => v.isActive === true);
      
      const statusFiliere: "active" | "inactive" = 
        (hasActiveStudents || hasCurrentPlanning || hasActiveVagues) ? "active" : "inactive";

      return {
        id: filiere.id.toString(),
        name: filiere.nom,
        description: filiere.description || "",
        duration: durationDisplay, // CORRIGÉ: Utiliser la durée formatée (string)
        totalModules: filiere.modules.length,
        status: statusFiliere,
        modules: modulesFormatted,
        createdAt: filiere.createdAt.toISOString().split('T')[0],
        statistiques: {
          totalEtudiants: studentsActifs.length,
          totalFormateurs: enseignantsUniques.size,
          totalSemestres: filiere.semestres.length,
          vaguesAssociees: vaguesAssociees
        }
      };
    });

    // Appliquer les filtres
    let filteredFilieres = filieresFormatted;

    // Filtre par recherche
    if (searchTerm) {
      filteredFilieres = filteredFilieres.filter(filiere =>
        filiere.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        filiere.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (status && status !== 'all') {
      filteredFilieres = filteredFilieres.filter(filiere => 
        filiere.status === status
      );
    }

    // Filtre par vague - Rechercher dans vaguesAssociees ET dans les modules
    if (vagueId && vagueId !== 'all') {
      filteredFilieres = filteredFilieres.filter(filiere => {
        // Vérifier dans les vagues associées directement
        const hasVagueDirect = filiere.statistiques.vaguesAssociees.some(vague => 
          vague.toLowerCase().includes(vagueId.toLowerCase())
        );

        // Vérifier dans les modules
        const hasVagueInModules = filiere.modules.some(module =>
          module.vagues.some(vague => vague.toLowerCase().includes(vagueId.toLowerCase()))
        );

        return hasVagueDirect || hasVagueInModules;
      });
    }

    // CORRECTION: Récupérer TOUTES les vagues disponibles depuis la base de données
    const toutesVagues = await prisma.vague.findMany({
      select: {
        nom: true
      },
      orderBy: {
        nom: 'asc'
      }
    });

    // Extraire les noms de vagues et supprimer les doublons
    const vaguesDisponibles = Array.from(new Set(
      toutesVagues.map(v => v.nom).concat(
        filieresFormatted.flatMap(filiere => 
          filiere.statistiques.vaguesAssociees.concat(
            filiere.modules.flatMap(module => module.vagues)
          )
        )
      )
    )).filter(vague => vague && vague.trim() !== '').sort();

    console.log(`📊 Vagues disponibles:`, vaguesDisponibles);

    return NextResponse.json({
      filieres: filteredFilieres,
      metadata: {
        total: filteredFilieres.length,
        filtres: {
          searchTerm,
          status,
          vagueId
        },
        vaguesDisponibles: vaguesDisponibles
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des filières:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des filières' },
      { status: 500 }
    );
  }
}

// Fonction pour récupérer les statistiques des filières
async function getFilieresStats() {
  try {
    const filieres = await prisma.filiere.findMany({
      include: {
        modules: true,
        students: {
          include: {
            vague: true
          }
        },
        planningAssignations: {
          include: {
            teacher: true,
            vague: true
          }
        },
        vaguesPivot: {
          include: {
            vague: true
          }
        }
      }
    });

    // CORRECTION: Utiliser la nouvelle fonction pour calculer la durée moyenne en string
    const dureeMoyenne = calculerDureeMoyenne(filieres);

    // Statistiques générales
    const totalFilieres = filieres.length;
    
    const filieresActives = filieres.filter(filiere => {
      const hasActiveStudents = filiere.students.some(student => 
        student.vague?.isActive === true
      );
      const hasCurrentPlanning = filiere.planningAssignations.some((pa: any) => 
        pa.vague.isActive === true
      );
      const hasActiveVagues = filiere.vaguesPivot.some(vp => 
        vp.vague.isActive === true
      );
      return hasActiveStudents || hasCurrentPlanning || hasActiveVagues;
    }).length;

    const filieresInactives = totalFilieres - filieresActives;

    // Total modules
    const totalModules = filieres.reduce((acc, filiere) => 
      acc + filiere.modules.length, 0
    );

    // Total étudiants actifs
    const totalEtudiantsActifs = filieres.reduce((acc, filiere) => 
      acc + filiere.students.filter(student => 
        student.vague?.isActive === true
      ).length, 0
    );

    // Total formateurs uniques
    const totalFormateurs = new Set(
      filieres.flatMap(filiere =>
        filiere.planningAssignations.map((pa: any) => pa.teacherId)
      )
    ).size;

    // CORRECTION: Récupérer toutes les vagues pour les statistiques
    const toutesVagues = await prisma.vague.findMany({
      select: {
        nom: true,
        isActive: true
      }
    });

    // Statistiques par vagues
    const statsParVague: { [key: string]: number } = {};
    toutesVagues.forEach(vague => {
      statsParVague[vague.nom] = filieres.filter(filiere => 
        filiere.vaguesPivot.some(vp => vp.vague.nom === vague.nom) ||
        filiere.planningAssignations.some((pa: any) => pa.vague.nom === vague.nom) ||
        filiere.students.some(s => s.vague?.nom === vague.nom)
      ).length;
    });

    // Statistiques par type de module
    const statsParTypeModule: { [key: string]: number } = {};
    filieres.forEach(filiere => {
      filiere.modules.forEach(module => {
        const type = module.typeModule;
        statsParTypeModule[type] = (statsParTypeModule[type] || 0) + 1;
      });
    });

    return NextResponse.json({
      general: {
        totalFilieres,
        filieresActives,
        filieresInactives,
        totalModules,
        totalEtudiantsActifs,
        totalFormateurs,
        dureeMoyenne // CORRIGÉ: Maintenant une string cohérente
      },
      parVague: statsParVague,
      parTypeModule: statsParTypeModule
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}

// Fonction pour récupérer les étudiants depuis Clerk et Prisma
async function getEtudiantsComplets() {
  try {
    const client = await clerkClient();
    
    // Récupérer tous les utilisateurs Clerk avec le rôle ETUDIANT
    const clerkUsers = await client.users.getUserList({
      limit: 500
    });

    // Filtrer les étudiants
    const etudiantsClerk = clerkUsers.data.filter(user => {
      const role = user.publicMetadata?.role as string;
      return role && (
        role.toLowerCase().includes("etudiant") || 
        role === "ETUDIANT" ||
        role.toLowerCase().includes("student")
      );
    });

    // Récupérer les étudiants depuis la base de données avec leurs relations
    const etudiantsDB = await prisma.student.findMany({
      include: {
        user: true,
        filiere: {
          select: {
            nom: true,
            dureeFormation: true
          }
        },
        vague: {
          select: {
            nom: true,
            isActive: true,
            id: true
          }
        }
      }
    });

    // Combiner les données Clerk et Prisma
    const etudiantsComplets = etudiantsDB.map(etudiantDB => {
      const userClerk = etudiantsClerk.find(
        user => user.id === etudiantDB.user.clerkUserId
      );

      // CORRECTION: Utiliser la fonction de formatage sans conversion
      const dureeFiliere = formaterDuree(etudiantDB.filiere?.dureeFormation || null);

      return {
        id: etudiantDB.id,
        studentNumber: etudiantDB.studentNumber,
        userId: etudiantDB.userId,
        clerkUserId: etudiantDB.user.clerkUserId,
        nomComplet: `${etudiantDB.user.firstName} ${etudiantDB.user.lastName}`,
        email: etudiantDB.user.email,
        filiere: etudiantDB.filiere?.nom || "Non assigné",
        vague: etudiantDB.vague?.nom || "Non assigné",
        vagueId: etudiantDB.vague?.id || null,
        isActive: etudiantDB.vague?.isActive || false,
        dureeFiliere: dureeFiliere, // Maintenant c'est une string
        dateCreation: etudiantDB.createdAt,
        // Données Clerk
        photoProfile: userClerk?.imageUrl,
        dernierLogin: userClerk?.lastSignInAt,
        statutClerk: userClerk?.banned ? "Banni" : "Actif"
      };
    });

    return NextResponse.json({
      total: etudiantsComplets.length,
      etudiants: etudiantsComplets
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des étudiants:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des étudiants' },
      { status: 500 }
    );
  }
}

// Fonction pour récupérer les statistiques globales du dashboard
async function getDashboardStats() {
  try {
    const client = await clerkClient();

    // Récupérer toutes les données en parallèle
    const [
      filieres,
      vagues,
      etudiantsDB,
      enseignantsDB,
      modules,
      assignations
    ] = await Promise.all([
      prisma.filiere.findMany({
        include: {
          students: {
            include: {
              vague: true
            }
          },
          vaguesPivot: {
            include: {
              vague: true
            }
          },
          planningAssignations: {
            include: {
              vague: true
            }
          }
        }
      }),
      prisma.vague.findMany(), // CORRIGÉ: Récupérer toutes les vagues
      prisma.student.findMany({
        include: {
          vague: true
        }
      }),
      prisma.teacher.findMany({
        include: {
          user: true
        }
      }),
      prisma.module.findMany(),
      prisma.planningAssignation.findMany({
        include: {
          vague: true
        }
      })
    ]);

    // Récupérer les utilisateurs Clerk pour les stats
    const clerkUsers = await client.users.getUserList({ limit: 1000 });
    
    // Compter les rôles Clerk
    const rolesClerk = {
      etudiants: clerkUsers.data.filter(user => 
        (user.publicMetadata?.role as string)?.toLowerCase().includes("etudiant")
      ).length,
      enseignants: clerkUsers.data.filter(user => 
        (user.publicMetadata?.role as string)?.toLowerCase().includes("enseignant")
      ).length,
      administrateurs: clerkUsers.data.filter(user => 
        (user.publicMetadata?.role as string)?.toLowerCase().includes("admin")
      ).length,
      censeurs: clerkUsers.data.filter(user => 
        (user.publicMetadata?.role as string)?.toLowerCase().includes("censeur")
      ).length
    };

    // CORRECTION: Utiliser la nouvelle fonction pour calculer la durée moyenne
    const dureeMoyenne = calculerDureeMoyenne(filieres);

    // Statistiques par vagues - CORRIGÉ: Utiliser toutes les vagues
    const statsParVague: { [key: string]: any } = {};
    vagues.forEach(vague => {
      statsParVague[vague.nom] = {
        filieres: filieres.filter(f => 
          f.vaguesPivot.some(vp => vp.vagueId === vague.id) ||
          f.students.some(s => s.vagueId === vague.id) ||
          f.planningAssignations.some((pa: any) => pa.vagueId === vague.id)
        ).length,
        etudiants: etudiantsDB.filter(e => e.vagueId === vague.id).length,
        assignations: assignations.filter(a => a.vagueId === vague.id).length
      };
    });

    // Statistiques globales
    const stats = {
      general: {
        totalFilieres: filieres.length,
        totalVagues: vagues.length, // CORRIGÉ: Nombre total de vagues
        totalEtudiants: etudiantsDB.length,
        totalEnseignants: enseignantsDB.length,
        totalModules: modules.length,
        totalAssignations: assignations.length,
        dureeMoyenneFormation: dureeMoyenne // CORRIGÉ: Maintenant une string cohérente
      },
      activite: {
        vaguesActives: vagues.filter(v => v.isActive).length,
        etudiantsActifs: etudiantsDB.filter(e => e.vague?.isActive).length,
        filieresActives: filieres.filter(f => 
          f.students.some(s => s.vague?.isActive) ||
          f.vaguesPivot.some(vp => vp.vague.isActive) ||
          f.planningAssignations.some((pa: any) => pa.vague.isActive)
        ).length
      },
      roles: rolesClerk,
      parVague: statsParVague,
      recent: {
        dernieresVagues: vagues
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map(v => ({
            nom: v.nom,
            date: v.createdAt,
            statut: v.isActive ? "Active" : "Inactive"
          })),
        nouvellesFilieres: filieres
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map(f => ({
            nom: f.nom,
            date: f.createdAt,
            etudiants: f.students.length,
            vagues: f.vaguesPivot.map(vp => vp.vague.nom),
            duree: formaterDuree(f.dureeFormation) // Ajout de la durée
          }))
      }
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques dashboard:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}