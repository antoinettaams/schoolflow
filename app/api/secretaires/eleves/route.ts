// app/api/eleves-payes/route.ts
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Construire les filtres
    const where: any = {
      statut: 'PAYE_COMPLET' // Seulement les inscriptions complètement payées
    };

    // Filtre par recherche
    if (searchTerm) {
      where.OR = [
        { nom: { contains: searchTerm, mode: 'insensitive' } },
        { prenom: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // Filtre par filière
    if (filiere !== 'toutes') {
      where.filiere = {
        nom: filiere
      };
    }

    // Filtre par vague
    if (vague !== 'toutes') {
      where.vague = {
        nom: vague
      };
    }

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

    // Récupérer les statistiques
    const stats = await getStats();

    return NextResponse.json({
      inscriptions: inscriptions.map(inscription => ({
        id: inscription.id,
        nom: inscription.nom,
        prenom: inscription.prenom,
        email: inscription.email,
        telephone: inscription.telephone,
        dateNaissance: inscription.dateNaissance,
        dateInscription: inscription.dateInscription,
        filiere: inscription.filiere?.nom || 'Non assignée',
        vague: inscription.vague?.nom || 'Non assignée',
        montant: inscription.fraisInscription,
        montantPaye: inscription.fraisPayes,
        resteAPayer: inscription.fraisInscription - inscription.fraisPayes,
        statutPaiement: 'paye',
        paiements: inscription.paiements,
        createdBy: inscription.createdBy ? 
          `${inscription.createdBy.firstName} ${inscription.createdBy.lastName}` : 
          'Système'
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des apprenants:', error);
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

    // Vérifier que l'inscription existe et est payée
    const inscription = await prisma.inscription.findUnique({
      where: { id },
      include: {
        paiements: true
      }
    });

    if (!inscription) {
      return NextResponse.json({ error: 'Inscription non trouvée' }, { status: 404 });
    }

    if (inscription.statut !== 'PAYE_COMPLET') {
      return NextResponse.json(
        { error: 'Seules les inscriptions complètement payées peuvent être supprimées' },
        { status: 400 }
      );
    }

    // Supprimer d'abord les paiements associés (à cause de la contrainte de clé étrangère)
    await prisma.paiement.deleteMany({
      where: { inscriptionId: id }
    });

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
  const totalInscriptions = await prisma.inscription.count();
  const totalPayes = await prisma.inscription.count({
    where: { statut: 'PAYE_COMPLET' }
  });
  const totalEnAttente = await prisma.inscription.count({
    where: { statut: 'EN_ATTENTE' }
  });
  const totalPartiels = await prisma.inscription.count({
    where: { statut: 'PAYE_PARTIEL' }
  });

  // Chiffre d'affaires total des inscriptions payées
  const chiffreAffaires = await prisma.inscription.aggregate({
    where: { statut: 'PAYE_COMPLET' },
    _sum: { fraisInscription: true }
  });

  return {
    totalInscriptions,
    totalPayes,
    totalEnAttente,
    totalPartiels,
    chiffreAffaires: chiffreAffaires._sum.fraisInscription || 0,
    tauxValidation: totalInscriptions > 0 ? Math.round((totalPayes / totalInscriptions) * 100) : 0
  };
}