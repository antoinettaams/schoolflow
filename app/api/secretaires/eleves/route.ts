// app/api/secretaires/eleves/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur a le rôle approprié
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
      select: { role: true }
    });

    if (!dbUser || !['ADMIN', 'SECRETAIRE', 'COMPTABLE', 'CENSEUR'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const filiere = searchParams.get('filiere') || 'toutes';
    const vague = searchParams.get('vague') || 'toutes';
    const statut = searchParams.get('statut') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Construire les filtres
    const where: any = {};

    // Filtre par statut
    if (statut !== 'all') {
      where.statut = statut;
    } else {
      // Par défaut, montrer tous les statuts sauf REJETE
      where.statut = {
        not: 'REJETE'
      };
    }

    // Filtre par recherche
    if (searchTerm) {
      where.OR = [
        { nom: { contains: searchTerm, mode: 'insensitive' } },
        { prenom: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { telephone: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // Filtre par filière
    if (filiere !== 'toutes') {
      where.filiereId = filiere;
    }

    // Filtre par vague
    if (vague !== 'toutes') {
      where.vagueId = vague;
    }

    console.log('Query where:', JSON.stringify(where, null, 2));

    // Récupérer les inscriptions avec leurs relations
    const inscriptions = await prisma.inscription.findMany({
      where,
      include: {
        filiere: {
          select: {
            id: true,
            nom: true,
            dureeFormation: true
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
        paiements: {
          select: {
            montant: true,
            datePaiement: true,
            modePaiement: true
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        dateInscription: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Compter le total pour la pagination
    const total = await prisma.inscription.count({ where });

    // Récupérer les données pour les filtres
    const [filieres, vagues] = await Promise.all([
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
      })
    ]);

    // Récupérer les statistiques
    const stats = await getStats();

    // Transformer les données pour le frontend
    const inscriptionsFormatees = inscriptions.map(inscription => ({
      id: inscription.id,
      nom: inscription.nom,
      prenom: inscription.prenom,
      email: inscription.email,
      telephone: inscription.telephone,
      dateNaissance: inscription.dateNaissance,
      dateInscription: inscription.dateInscription,
      filiere: inscription.filiere?.nom || 'Non assignée',
      vague: inscription.vague?.nom || 'Non assignée',
      statut: inscription.statut,
      fraisInscription: inscription.fraisInscription,
      fraisPayes: inscription.fraisPayes,
      resteAPayer: Math.max(0, inscription.fraisInscription - inscription.fraisPayes),
      createdBy: inscription.createdBy ? 
        `${inscription.createdBy.firstName} ${inscription.createdBy.lastName}` : 
        'Système',
      paiements: inscription.paiements
    }));

    return NextResponse.json({
      inscriptions: inscriptionsFormatees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filtres: {
        filieres,
        vagues
      },
      stats
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des inscriptions:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier les permissions
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
      select: { role: true }
    });

    if (!dbUser || !['ADMIN', 'SECRETAIRE'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Vérifier que l'inscription existe
    const inscription = await prisma.inscription.findUnique({
      where: { id },
      include: {
        paiements: true,
        dossier: true
      }
    });

    if (!inscription) {
      return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 });
    }

    // Supprimer d'abord les paiements associés
    if (inscription.paiements.length > 0) {
      await prisma.paiement.deleteMany({
        where: { inscriptionId: id }
      });
    }

    // Supprimer le dossier associé s'il existe
    if (inscription.dossier) {
      await prisma.dossier.delete({
        where: { inscriptionId: id }
      });
    }

    // Puis supprimer l'inscription
    await prisma.inscription.delete({
      where: { id }
    });

    return NextResponse.json({ 
      message: 'Apprenant supprimé avec succès',
      deletedInscription: {
        id: inscription.id,
        nom: inscription.nom,
        prenom: inscription.prenom
      }
    });

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}

// Fonction pour récupérer les statistiques
async function getStats() {
  const totalInscriptions = await prisma.inscription.count({
    where: {
      statut: {
        not: 'REJETE'
      }
    }
  });

  const totalPayes = await prisma.inscription.count({
    where: { 
      statut: 'PAYE_COMPLET'
    }
  });

  const totalPartiels = await prisma.inscription.count({
    where: { 
      statut: 'PAYE_PARTIEL'
    }
  });

  const totalEnAttente = await prisma.inscription.count({
    where: { 
      statut: 'EN_ATTENTE'
    }
  });

  const totalApprouves = await prisma.inscription.count({
    where: { 
      statut: 'APPROUVE'
    }
  });

  const totalRejetes = await prisma.inscription.count({
    where: { 
      statut: 'REJETE'
    }
  });

  // Chiffre d'affaires total (somme des frais payés)
  const chiffreAffairesResult = await prisma.inscription.aggregate({
    where: {
      statut: {
        in: ['PAYE_COMPLET', 'PAYE_PARTIEL']
      }
    },
    _sum: { 
      fraisPayes: true 
    }
  });

  // Montant total payé (tous statuts confondus)
  const montantTotalPayeResult = await prisma.inscription.aggregate({
    _sum: { 
      fraisPayes: true 
    }
  });

  const chiffreAffaires = chiffreAffairesResult._sum.fraisPayes || 0;
  const montantTotalPaye = montantTotalPayeResult._sum.fraisPayes || 0;

  // Calcul des taux
  const tauxPaiementComplet = totalInscriptions > 0 ? Math.round((totalPayes / totalInscriptions) * 100) : 0;
  const tauxPaiementPartiel = totalInscriptions > 0 ? Math.round((totalPartiels / totalInscriptions) * 100) : 0;

  return {
    totalInscriptions,
    totalPayes,
    totalEnAttente,
    totalPartiels,
    totalApprouves,
    totalRejetes,
    chiffreAffaires,
    montantTotalPaye,
    tauxPaiementComplet,
    tauxPaiementPartiel
  };
}