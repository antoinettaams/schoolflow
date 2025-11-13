// app/api/comptable/statistiques/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

// GET /api/comptable/statistiques - Récupérer les statistiques financières
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est un comptable ou secrétaire
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (!user || (user.role !== 'COMPTABLE' && user.role !== 'SECRETAIRE')) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const vagueId = searchParams.get('vague');
    const filiereId = searchParams.get('filiere');
    const dateStart = searchParams.get('dateStart');
    const dateEnd = searchParams.get('dateEnd');

    // Construire les filtres pour les paiements
    const paiementWhere: any = {
      statut: 'PAYE_COMPLET' // Seulement les paiements complètement payés
    };

    // Construire les filtres pour la balance
    const balanceWhere: any = {};

    if (vagueId && vagueId !== 'all') {
      paiementWhere.inscription = { vagueId };
      balanceWhere.vague = vagueId;
    }

    if (filiereId && filiereId !== 'all') {
      paiementWhere.inscription = { 
        ...paiementWhere.inscription,
        filiereId: parseInt(filiereId)
      };
      balanceWhere.filiere = filiereId;
    }

    if (dateStart && dateEnd) {
      paiementWhere.datePaiement = {
        gte: new Date(dateStart),
        lte: new Date(dateEnd)
      };
      balanceWhere.date = {
        gte: new Date(dateStart),
        lte: new Date(dateEnd)
      };
    }

    // Récupérer les données en parallèle
    const [
      paiements,
      operationsBalance,
      vagues,
      filieres,
      inscriptions
    ] = await Promise.all([
      // Paiements approuvés
      prisma.paiement.findMany({
        where: paiementWhere,
        include: {
          inscription: {
            include: {
              vague: true,
              filiere: true,
              createdBy: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          createdBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { datePaiement: 'desc' }
      }),

      // Opérations de balance
      prisma.operation.findMany({
        where: balanceWhere,
        orderBy: { date: 'desc' }
      }),

      // Vagues actives
      prisma.vague.findMany({
        where: { isActive: true },
        select: { id: true, nom: true, dateDebut: true, dateFin: true },
        orderBy: { dateDebut: 'desc' }
      }),

      // Filières
      prisma.filiere.findMany({
        select: { id: true, nom: true },
        orderBy: { nom: 'asc' }
      }),

      // Inscriptions pour calculer les effectifs
      prisma.inscription.findMany({
        where: {
          statut: { in: ['APPROUVE', 'PAYE_COMPLET', 'PAYE_PARTIEL'] }
        },
        select: {
          id: true,
          vagueId: true,
          filiereId: true
        }
      })
    ]);

    // Transformer les données pour le frontend
    const paiementsFormatted = paiements.map(p => ({
      id: p.id,
      studentId: p.inscription.id,
      studentName: `${p.inscription.prenom} ${p.inscription.nom}`,
      parentName: p.inscription.createdBy ? 
        `${p.inscription.createdBy.firstName} ${p.inscription.createdBy.lastName}` : 'N/A',
      filiere: p.inscription.filiere?.nom || 'N/A',
      vague: p.inscription.vague?.nom || 'N/A',
      montant: p.montant,
      type: p.montant >= 100000 ? 'scolarite' as const : 'inscription' as const, // Estimation basée sur le montant
      methode: p.modePaiement as 'online' | 'especes' | 'cheque' | 'virement' | 'mobile_money',
      statut: 'approuve' as const,
      datePaiement: p.datePaiement.toISOString(),
      dateValidation: p.datePaiement.toISOString()
    }));

    const balanceFormatted = operationsBalance.map(op => ({
      id: op.id,
      date: op.date.toISOString(),
      vague: op.vague,
      filiere: op.filiere,
      libelle: op.libelle,
      debit: op.debit,
      credit: op.credit,
      reference: op.reference
    }));

    // Calculer les statistiques
    const paiementsApprouves = paiementsFormatted;

    const totalRecettes = paiementsApprouves.reduce((sum, p) => sum + p.montant, 0);
    const totalRecettesScolarite = paiementsApprouves
      .filter(p => p.type === 'scolarite')
      .reduce((sum, p) => sum + p.montant, 0);
    const totalRecettesInscriptions = paiementsApprouves
      .filter(p => p.type === 'inscription')
      .reduce((sum, p) => sum + p.montant, 0);

    const totalCharges = balanceFormatted.reduce((sum, op) => sum + op.debit, 0);
    const beneficeNet = totalRecettes - totalCharges;
    const margeBeneficiaire = totalRecettes > 0 ? (beneficeNet / totalRecettes) * 100 : 0;

    // Données pour graphiques
    const vaguesNoms = Array.from(new Set(paiementsFormatted.map(p => p.vague)));
    const filieresNoms = Array.from(new Set(paiementsFormatted.map(p => p.filiere)));

    const dataByVague = vaguesNoms.map(vague => {
      const paiementsVague = paiementsApprouves.filter(p => p.vague === vague);
      return {
        vague,
        scolarite: paiementsVague.filter(p => p.type === 'scolarite').reduce((sum, p) => sum + p.montant, 0),
        inscriptions: paiementsVague.filter(p => p.type === 'inscription').reduce((sum, p) => sum + p.montant, 0),
      };
    });

    const dataByMethodePaiement = [
      { methode: 'En ligne', montant: paiementsApprouves.filter(p => p.methode === 'online').reduce((sum, p) => sum + p.montant, 0) },
      { methode: 'Espèces', montant: paiementsApprouves.filter(p => p.methode === 'especes').reduce((sum, p) => sum + p.montant, 0) },
      { methode: 'Virement', montant: paiementsApprouves.filter(p => p.methode === 'virement').reduce((sum, p) => sum + p.montant, 0) },
      { methode: 'Mobile Money', montant: paiementsApprouves.filter(p => p.methode === 'mobile_money').reduce((sum, p) => sum + p.montant, 0) },
    ];

    // Performance par vague
    const performanceVagues = vaguesNoms.map(vague => {
      const paiementsVague = paiementsApprouves.filter(p => p.vague === vague);
      const recettesVague = paiementsVague.reduce((sum, p) => sum + p.montant, 0);
      const chargesVague = balanceFormatted.filter(op => op.vague === vague).reduce((sum, op) => sum + op.debit, 0);
      const effectifVague = new Set(inscriptions.filter(i => i.vagueId === vagues.find(v => v.nom === vague)?.id).map(i => i.id)).size;
      
      return {
        vague,
        filiere: paiementsFormatted.find(p => p.vague === vague)?.filiere || 'Multiple',
        effectif: effectifVague,
        recettes: recettesVague,
        charges: chargesVague,
        rentabilite: recettesVague > 0 ? ((recettesVague - chargesVague) / recettesVague) * 100 : 0
      };
    });

    // Données d'évolution mensuelle (simulées pour l'exemple)
    const monthlyData = generateMonthlyData(paiementsFormatted, balanceFormatted);

    return NextResponse.json({
      indicateurs: {
        totalRecettes,
        totalRecettesScolarite,
        totalRecettesInscriptions,
        totalCharges,
        beneficeNet,
        margeBeneficiaire,
        totalPaiements: paiementsApprouves.length
      },
      graphiques: {
        dataByVague,
        dataByMethodePaiement,
        monthlyData,
        performanceVagues
      },
      filtres: {
        vagues: vagues.map(v => ({ id: v.id, nom: v.nom })),
        filieres: filieres.map(f => ({ id: f.id, nom: f.nom }))
      },
      donneesBrutes: {
        paiements: paiementsFormatted,
        balance: balanceFormatted
      }
    });

  } catch (error) {
    console.error('Erreur API statistiques:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour générer les données mensuelles
function generateMonthlyData(paiements: any[], balance: any[]) {
  const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  
  return mois.map((mois, index) => {
    const paiementsMois = paiements.filter(p => {
      const date = new Date(p.datePaiement);
      return date.getMonth() === index;
    });
    
    const balanceMois = balance.filter(b => {
      const date = new Date(b.date);
      return date.getMonth() === index;
    });

    return {
      mois,
      recettes: paiementsMois.reduce((sum, p) => sum + p.montant, 0),
      charges: balanceMois.reduce((sum, b) => sum + b.debit, 0)
    };
  });
}