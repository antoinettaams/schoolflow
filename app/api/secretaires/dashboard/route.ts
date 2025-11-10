import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est bien une secrétaire
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (!user || user.role !== "SECRETAIRE") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Récupérer les données réelles en parallèle
    const [
      pendingInscriptions,
      cardsToPrint,
      upcomingEvents,
      monthlyStats,
      recentActivities,
      totalStudents,
      totalInscriptions,
      recentPayments
    ] = await Promise.all([
      // Inscriptions en attente (statut EN_ATTENTE)
      prisma.inscription.count({
        where: {
          statut: "EN_ATTENTE"
        }
      }),

      // Cartes à imprimer (étudiants sans carte imprimée - approximation)
      prisma.student.count({
        where: {
          user: { isActive: true }
        }
      }),

      // Événements à venir
      prisma.event.count({
        where: {
          date: {
            gte: new Date().toISOString().split('T')[0]
          }
        }
      }),

      // Statistiques mensuelles
      getMonthlyStats(),

      // Activités récentes
      getRecentActivities(),

      // Total des étudiants
      prisma.student.count(),

      // Total des inscriptions
      prisma.inscription.count(),

      // Paiements récents pour les messages
      prisma.paiement.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 1)) // Dernières 24h
          }
        }
      })
    ]);

    const dashboardData = {
      // Cartes principales
      pendingInscriptions,
      cardsToPrint,
      upcomingEvents,
      unreadMessages: recentPayments, // Messages non lus = nouveaux paiements
      
      // Statistiques
      monthlyStats,
      
      // Activités
      recentActivities,
      
      // Données supplémentaires pour les graphiques
      totalStudents,
      totalInscriptions,
      
      // Résumé financier
      financialSummary: await getFinancialSummary()
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Erreur API dashboard secrétaire:", error);
    return NextResponse.json(
      { 
        error: "Erreur interne du serveur",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

async function getMonthlyStats() {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const [
      inscriptionsCount,
      approvedInscriptions,
      totalRevenue,
      paiementsCount
    ] = await Promise.all([
      // Inscriptions ce mois
      prisma.inscription.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),

      // Inscriptions approuvées ce mois
      prisma.inscription.count({
        where: {
          statut: "APPROUVE",
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),

      // Revenus ce mois (somme des paiements)
      prisma.paiement.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: {
          montant: true
        }
      }),

      // Nombre de paiements ce mois
      prisma.paiement.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      })
    ]);

    // Calcul du taux d'approbation
    const approvalRate = inscriptionsCount > 0 
      ? Math.round((approvedInscriptions / inscriptionsCount) * 100)
      : 0;

    // Objectif réaliste basé sur la capacité
    const targetInscriptions = 100; // Objectif mensuel
    const completionRate = Math.min(100, Math.round((inscriptionsCount / targetInscriptions) * 100));

    return {
      inscriptions: inscriptionsCount,
      revenue: totalRevenue._sum.montant || 0,
      paiements: paiementsCount,
      approvalRate,
      completionRate
    };
  } catch (error) {
    console.error("Erreur dans getMonthlyStats:", error);
    return {
      inscriptions: 0,
      revenue: 0,
      paiements: 0,
      approvalRate: 0,
      completionRate: 0
    };
  }
}

async function getRecentActivities() {
  try {
    // Récupérer les activités récentes : inscriptions + paiements
    const [recentInscriptions, recentPayments] = await Promise.all([
      // Dernières inscriptions
      prisma.inscription.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          filiere: {
            select: { nom: true }
          }
        }
      }),

      // Derniers paiements
      prisma.paiement.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          inscription: {
            select: {
              nom: true,
              prenom: true
            }
          }
        }
      })
    ]);

    // Combiner et trier par date
    const allActivities = [
      ...recentInscriptions.map(inscription => ({
        id: `inscription-${inscription.id}`,
        action: "Nouvelle inscription",
        description: `${inscription.prenom} ${inscription.nom} - ${inscription.filiere?.nom || 'Non assigné'}`,
        student: `${inscription.prenom} ${inscription.nom}`,
        time: inscription.createdAt,
        type: "inscription" as const,
        status: inscription.statut.toLowerCase() as "en_attente" | "approuve" | "rejete" | "paye_complet"
      })),
      ...recentPayments.map(paiement => ({
        id: `paiement-${paiement.id}`,
        action: "Paiement reçu",
        description: `${paiement.inscription.prenom} ${paiement.inscription.nom} - ${paiement.montant.toLocaleString('fr-FR')} FCFA`,
        student: `${paiement.inscription.prenom} ${paiement.inscription.nom}`,
        time: paiement.createdAt,
        type: "paiement" as const,
        status: "completed" as const
      }))
    ];

    // Trier par date décroissante et prendre les 6 plus récents
    const sortedActivities = allActivities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 6)
      .map(activity => ({
        ...activity,
        time: new Date(activity.time).toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));

    return sortedActivities;

  } catch (error) {
    console.error("Erreur dans getRecentActivities:", error);
    // Retourner des activités par défaut en cas d'erreur
    return [
      {
        id: "default-1",
        action: "Système initialisé",
        description: "Dashboard chargé avec succès",
        student: "Système",
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        type: "system" as const,
        status: "completed" as const
      }
    ];
  }
}

async function getFinancialSummary() {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalRevenue,
      pendingRevenue,
      monthlyRevenue,
      paiementsCount
    ] = await Promise.all([
      // Revenu total (tous les paiements)
      prisma.paiement.aggregate({
        _sum: {
          montant: true
        }
      }),

      // Revenu en attente (inscriptions non payées)
      prisma.inscription.aggregate({
        where: {
          statut: {
            in: ["EN_ATTENTE", "APPROUVE"]
          }
        },
        _sum: {
          fraisInscription: true
        }
      }),

      // Revenu ce mois
      prisma.paiement.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        },
        _sum: {
          montant: true
        }
      }),

      // Nombre total de paiements
      prisma.paiement.count()
    ]);

    return {
      totalRevenue: totalRevenue._sum.montant || 0,
      pendingRevenue: pendingRevenue._sum.fraisInscription || 0,
      monthlyRevenue: monthlyRevenue._sum.montant || 0,
      totalTransactions: paiementsCount
    };
  } catch (error) {
    console.error("Erreur dans getFinancialSummary:", error);
    return {
      totalRevenue: 0,
      pendingRevenue: 0,
      monthlyRevenue: 0,
      totalTransactions: 0
    };
  }
}