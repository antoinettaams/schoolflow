import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('📊 API Dashboard Comptable appelée');

    // Date du début du mois en cours
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Date de fin du mois en cours
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    console.log('📅 Période:', startOfMonth, 'à', endOfMonth);

    // Récupérer les données en parallèle
    const [
      pendingPayments,
      unpaidInvoices,
      pendingReceipts,
      monthlyRevenue,
      inscriptionStats,
      totalPaiements
    ] = await Promise.all([
      // Paiements en attente
      prisma.inscription.count({
        where: {
          OR: [
            { statut: 'EN_ATTENTE' },
            { statut: 'PAYE_PARTIEL' }
          ]
        }
      }),

      // Factures impayées
      prisma.inscription.count({
        where: {
          fraisPayes: {
            lt: prisma.inscription.fields.fraisInscription
          }
        }
      }),

      // Reçus en attente
      prisma.paiement.count({
        where: {
          datePaiement: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Chiffre d'affaires du mois
      prisma.paiement.aggregate({
        where: {
          datePaiement: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: {
          montant: true
        }
      }),

      // Statistiques des inscriptions
      prisma.inscription.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: {
          fraisInscription: true
        },
        _count: {
          id: true
        }
      }),

      // Total des paiements (pour debug)
      prisma.paiement.count()
    ]);

    console.log('📦 Données récupérées:', {
      pendingPayments,
      unpaidInvoices,
      pendingReceipts,
      monthlyRevenue: monthlyRevenue._sum.montant,
      totalPaiements
    });

    // Calculs
    const budgetTarget = 100000;
    const revenue = monthlyRevenue._sum.montant || 0;
    const budgetUtilization = Math.min(100, Math.round((revenue / budgetTarget) * 100));

    const hasData = pendingPayments > 0 || 
                   unpaidInvoices > 0 || 
                   pendingReceipts > 0 || 
                   revenue > 0 || 
                   inscriptionStats._count.id > 0;

    const dashboardData = {
      pendingPayments,
      unpaidInvoices,
      pendingReceipts,
      monthlyRevenue: revenue,
      expensesThisMonth: 0,
      budgetUtilization,
      hasData,
      stats: {
        totalInscriptions: inscriptionStats._count.id,
        revenueTarget: inscriptionStats._sum.fraisInscription || 0,
        totalPaiements // Pour debug
      }
    };

    console.log('✅ Données finales:', dashboardData);

    return NextResponse.json(dashboardData);
    
  } catch (error) {
    console.error('❌ Erreur API dashboard comptable:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des données',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}