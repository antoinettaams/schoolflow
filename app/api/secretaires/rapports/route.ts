// app/api/secretaires/rapports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

// GET - Récupérer tous les rapports avec filtres
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true, role: true }
    });

    if (!user || !['ADMIN', 'CENSEUR', 'SECRETAIRE'].includes(user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const vagueId = searchParams.get('vagueId');
    const search = searchParams.get('search');

    let where: any = {};

    if (type && type !== 'tous') {
      where.type = type.toUpperCase();
    }

    if (vagueId && vagueId !== 'toutes') {
      where.vagueId = vagueId;
    }

    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        { resume: { contains: search, mode: 'insensitive' } }
      ];
    }

    const bilans = await prisma.bilan.findMany({
      where,
      include: {
        vague: {
          select: {
            id: true,
            nom: true,
            description: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        dateGeneration: 'desc'
      }
    });

    // Transformer les données pour le frontend
    const rapports = bilans.map(bilan => ({
      id: bilan.id,
      titre: bilan.titre,
      type: bilan.type.toLowerCase() as "vague" | "mensuel" | "annuel" | "special",
      vague: bilan.vague?.nom || 'Non spécifié',
      vagueId: bilan.vague?.id || null,
      periode: bilan.periode,
      dateGeneration: bilan.dateGeneration.toISOString().split('T')[0],
      generePar: `${bilan.user.firstName} ${bilan.user.lastName}`,
      statut: bilan.statut.toLowerCase() as "en_cours" | "genere" | "erreur",
      taille: bilan.taille || '2.1 MB',
      resume: bilan.resume || '',
      statistiques: bilan.statistiques ? JSON.parse(bilan.statistiques as string) : {
        inscriptions: 0,
        paiements: 0,
        cartesGenerees: 0,
        dossiersComplets: 0
      }
    }));

    // Récupérer les statistiques globales
    const totalRapports = await prisma.bilan.count();
    const rapportsVague = await prisma.bilan.count({ where: { type: 'VAGUE' } });
    const rapportsMensuels = await prisma.bilan.count({ where: { type: 'MENSUEL' } });

    // Récupérer les vagues actives
    const vagues = await prisma.vague.findMany({
      where: { isActive: true },
      select: {
        id: true,
        nom: true
      },
      orderBy: { dateDebut: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        rapports,
        statistiques: {
          totalRapports,
          rapportsVague,
          rapportsMensuels,
          espaceUtilise: '45.2 MB'
        },
        vagues
      }
    });

  } catch (error) {
    console.error('Erreur API rapports:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des rapports' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau rapport
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true, role: true }
    });

    if (!user || !['ADMIN', 'CENSEUR', 'SECRETAIRE'].includes(user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { titre, type, vague, periode, resume, inclusions } = body;

    // Validation des données
    if (!titre || !type || !periode) {
      return NextResponse.json(
        { error: 'Titre, type et période sont obligatoires' },
        { status: 400 }
      );
    }

    // Calculer les statistiques basées sur les inclusions
    const statistiques = await calculerStatistiques(inclusions, vague, periode);

    // Créer le rapport
    const nouveauBilan = await prisma.bilan.create({
      data: {
        titre,
        type: type.toUpperCase() as any,
        vagueId: vague && vague !== 'toutes' ? vague : null,
        periode,
        resume: resume || '',
        dateGeneration: new Date(),
        generePar: user.id,
        statut: 'GENERE',
        taille: '2.1 MB',
        inclusions: JSON.stringify(inclusions),
        statistiques: JSON.stringify(statistiques)
      },
      include: {
        vague: {
          select: {
            id: true,
            nom: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    const rapport = {
      id: nouveauBilan.id,
      titre: nouveauBilan.titre,
      type: nouveauBilan.type.toLowerCase() as "vague" | "mensuel" | "annuel" | "special",
      vague: nouveauBilan.vague?.nom || 'Non spécifié',
      vagueId: nouveauBilan.vague?.id || null,
      periode: nouveauBilan.periode,
      dateGeneration: nouveauBilan.dateGeneration.toISOString().split('T')[0],
      generePar: `${nouveauBilan.user.firstName} ${nouveauBilan.user.lastName}`,
      statut: nouveauBilan.statut.toLowerCase() as "en_cours" | "genere" | "erreur",
      taille: nouveauBilan.taille || '2.1 MB',
      resume: nouveauBilan.resume || '',
      statistiques
    };

    return NextResponse.json({
      success: true,
      message: 'Rapport créé avec succès',
      data: { rapport }
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur création rapport:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du rapport' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un rapport
export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true, role: true }
    });

    if (!user || !['ADMIN', 'CENSEUR', 'SECRETAIRE'].includes(user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { id, titre, type, vague, periode, resume, inclusions } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID du rapport manquant' },
        { status: 400 }
      );
    }

    // Vérifier que le rapport existe
    const rapportExistant = await prisma.bilan.findUnique({
      where: { id }
    });

    if (!rapportExistant) {
      return NextResponse.json(
        { error: 'Rapport non trouvé' },
        { status: 404 }
      );
    }

    // Recalculer les statistiques si les inclusions ont changé
    const statistiques = await calculerStatistiques(inclusions, vague, periode);

    // Mettre à jour le rapport
    const bilanMisAJour = await prisma.bilan.update({
      where: { id },
      data: {
        titre,
        type: type.toUpperCase() as any,
        vagueId: vague && vague !== 'toutes' ? vague : null,
        periode,
        resume: resume || '',
        inclusions: JSON.stringify(inclusions),
        statistiques: JSON.stringify(statistiques),
        dateGeneration: new Date() // Mettre à jour la date de génération
      },
      include: {
        vague: {
          select: {
            id: true,
            nom: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    const rapport = {
      id: bilanMisAJour.id,
      titre: bilanMisAJour.titre,
      type: bilanMisAJour.type.toLowerCase() as "vague" | "mensuel" | "annuel" | "special",
      vague: bilanMisAJour.vague?.nom || 'Non spécifié',
      vagueId: bilanMisAJour.vague?.id || null,
      periode: bilanMisAJour.periode,
      dateGeneration: bilanMisAJour.dateGeneration.toISOString().split('T')[0],
      generePar: `${bilanMisAJour.user.firstName} ${bilanMisAJour.user.lastName}`,
      statut: bilanMisAJour.statut.toLowerCase() as "en_cours" | "genere" | "erreur",
      taille: bilanMisAJour.taille || '2.1 MB',
      resume: bilanMisAJour.resume || '',
      statistiques
    };

    return NextResponse.json({
      success: true,
      message: 'Rapport mis à jour avec succès',
      data: { rapport }
    });

  } catch (error) {
    console.error('Erreur mise à jour rapport:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du rapport' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un rapport
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkUserId } = getAuth(request);
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true, role: true }
    });

    if (!user || !['ADMIN', 'CENSEUR', 'SECRETAIRE'].includes(user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID du rapport manquant' },
        { status: 400 }
      );
    }

    // Vérifier que le rapport existe
    const rapportExistant = await prisma.bilan.findUnique({
      where: { id }
    });

    if (!rapportExistant) {
      return NextResponse.json(
        { error: 'Rapport non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le rapport
    await prisma.bilan.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Rapport supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression rapport:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du rapport' },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour calculer les statistiques
async function calculerStatistiques(inclusions: any, vague: string, periode: string) {
  const statistiques: any = {
    inscriptions: 0,
    paiements: 0,
    cartesGenerees: 0,
    dossiersComplets: 0
  };

  try {
    if (inclusions.inscriptions) {
      const whereInscriptions: any = {};
      if (vague && vague !== 'toutes') {
        whereInscriptions.vagueId = vague;
      }
      
      statistiques.inscriptions = await prisma.inscription.count({
        where: whereInscriptions
      });
    }

    if (inclusions.paiements) {
      const wherePaiements: any = {};
      if (vague && vague !== 'toutes') {
        wherePaiements.inscription = {
          vagueId: vague
        };
      }
      
      statistiques.paiements = await prisma.paiement.count({
        where: wherePaiements
      });
    }

    if (inclusions.cartes) {
      const whereCartes: any = {};
      if (vague && vague !== 'toutes') {
        whereCartes.vagueId = vague;
      }
      
      statistiques.cartesGenerees = await prisma.carteEtudiante.count({
        where: whereCartes
      });
    }

    if (inclusions.dossiers) {
      const whereDossiers: any = { statut: 'COMPLET' };
      if (vague && vague !== 'toutes') {
        whereDossiers.inscription = {
          vagueId: vague
        };
      }
      
      statistiques.dossiersComplets = await prisma.dossier.count({
        where: whereDossiers
      });
    }
  } catch (error) {
    console.error('Erreur calcul statistiques:', error);
    // En cas d'erreur, on garde les valeurs par défaut
  }

  return statistiques;
}