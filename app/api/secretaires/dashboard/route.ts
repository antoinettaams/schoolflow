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

    // Récupérer les données réelles en parallèle avec gestion d'erreurs
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
      safePrismaCall(() => prisma.inscription.count({
        where: {
          statut: "EN_ATTENTE"
        }
      }), 0),

      // Cartes à imprimer (étudiants sans carte imprimée - approximation)
      safePrismaCall(() => prisma.student.count({
        where: {
          user: { isActive: true }
        }
      }), 0),

      // Événements à venir
      safePrismaCall(() => prisma.event.count({
        where: {
          date: {
            gte: new Date().toISOString().split('T')[0]
          }
        }
      }), 0),

      // Statistiques mensuelles
      safePrismaCall(getMonthlyStats, {
        inscriptions: 0,
        revenue: 0,
        paiements: 0,
        approvalRate: 0,
        completionRate: 0
      }),

      // Activités récentes
      safePrismaCall(getRecentActivities, []),

      // Total des étudiants
      safePrismaCall(() => prisma.student.count(), 0),

      // Total des inscriptions
      safePrismaCall(() => prisma.inscription.count(), 0),

      // Paiements récents pour les messages
      safePrismaCall(() => prisma.paiement.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 1)) // Dernières 24h
          }
        }
      }), 0)
    ]);

    const dashboardData = {
      // Cartes principales
      pendingInscriptions,
      cardsToPrint,
      upcomingEvents,
      unreadMessages: recentPayments,
      
      // Statistiques
      monthlyStats,
      
      // Activités
      recentActivities: recentActivities.length > 0 ? recentActivities : [],
      
      // Données supplémentaires pour les graphiques
      totalStudents,
      totalInscriptions,
      
      // Résumé financier
      financialSummary: await safePrismaCall(getFinancialSummary, {
        totalRevenue: 0,
        pendingRevenue: 0,
        monthlyRevenue: 0,
        totalTransactions: 0
      }),
      
      // Métadonnées pour le frontend
      metadata: {
        hasData: totalInscriptions > 0 || totalStudents > 0,
        lastUpdated: new Date().toISOString(),
        dataStatus: "success" as const
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Erreur API dashboard secrétaire:", error);
    
    // Retourner des données vides en cas d'erreur
    const errorData = {
      pendingInscriptions: 0,
      cardsToPrint: 0,
      upcomingEvents: 0,
      unreadMessages: 0,
      monthlyStats: {
        inscriptions: 0,
        revenue: 0,
        paiements: 0,
        approvalRate: 0,
        completionRate: 0
      },
      recentActivities: [],
      totalStudents: 0,
      totalInscriptions: 0,
      financialSummary: {
        totalRevenue: 0,
        pendingRevenue: 0,
        monthlyRevenue: 0,
        totalTransactions: 0
      },
      metadata: {
        hasData: false,
        lastUpdated: new Date().toISOString(),
        dataStatus: "error" as const,
        error: error instanceof Error ? error.message : "Erreur inconnue"
      }
    };

    return NextResponse.json(errorData, { status: 500 });
  }
}

// Fonction utilitaire pour gérer les erreurs Prisma
async function safePrismaCall<T>(prismaCall: () => Promise<T>, defaultValue: T): Promise<T> {
  try {
    return await prismaCall();
  } catch (error) {
    console.error("Erreur Prisma:", error);
    return defaultValue;
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
      safePrismaCall(() => prisma.inscription.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }), 0),

      // Inscriptions approuvées ce mois
      safePrismaCall(() => prisma.inscription.count({
        where: {
          statut: "APPROUVE",
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }), 0),

      // Revenus ce mois (somme des paiements)
      safePrismaCall(() => prisma.paiement.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: {
          montant: true
        }
      }), { _sum: { montant: 0 } }),

      // Nombre de paiements ce mois
      safePrismaCall(() => prisma.paiement.count({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }), 0)
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
      revenue: totalRevenue._sum?.montant || 0,
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
      safePrismaCall(() => prisma.inscription.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          filiere: {
            select: { nom: true }
          }
        }
      }), []),

      // Derniers paiements
      safePrismaCall(() => prisma.paiement.findMany({
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
      }), [])
    ]);

    // Si aucune donnée, retourner tableau vide
    if (recentInscriptions.length === 0 && recentPayments.length === 0) {
      return [];
    }

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
    return [];
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
      safePrismaCall(() => prisma.paiement.aggregate({
        _sum: {
          montant: true
        }
      }), { _sum: { montant: 0 } }),

      // Revenu en attente (inscriptions non payées)
      safePrismaCall(() => prisma.inscription.aggregate({
        where: {
          statut: {
            in: ["EN_ATTENTE", "APPROUVE"]
          }
        },
        _sum: {
          fraisInscription: true
        }
      }), { _sum: { fraisInscription: 0 } }),

      // Revenu ce mois
      safePrismaCall(() => prisma.paiement.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        },
        _sum: {
          montant: true
        }
      }), { _sum: { montant: 0 } }),

      // Nombre total de paiements
      safePrismaCall(() => prisma.paiement.count(), 0)
    ]);

    return {
      totalRevenue: totalRevenue._sum?.montant || 0,
      pendingRevenue: pendingRevenue._sum?.fraisInscription || 0,
      monthlyRevenue: monthlyRevenue._sum?.montant || 0,
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