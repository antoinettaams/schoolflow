// app/api/secretaires/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

// Types pour la réponse unifiée
type ApiResponse = {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
};

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Début de la requête GET /api/secretaires');
    
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur a le rôle approprié
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
      select: { role: true }
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (!['ADMIN', 'SECRETAIRE', 'CENSEUR'].includes(dbUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const searchTerm = searchParams.get('search') || '';
    const filiere = searchParams.get('filiere') || 'toutes';
    const vague = searchParams.get('vague') || 'toutes';
    const statut = searchParams.get('statut') || 'toutes';

    console.log('📋 Endpoint demandé:', endpoint);

    switch (endpoint) {
      case 'dossiers':
        return await getDossiers(searchTerm, filiere, vague, statut);
      
      case 'inscriptions':
        return await getInscriptionsEligibles();
      
      case 'statistiques':
        return await getStatistiques();
      
      default:
        return NextResponse.json(
          { success: false, error: 'Endpoint non valide. Utilisez: dossiers, inscriptions ou statistiques' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Erreur API secrétaires:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Vérifier les permissions
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
      select: { id: true, role: true }
    });

    if (!dbUser || !['ADMIN', 'SECRETAIRE'].includes(dbUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    console.log('📋 Action demandée:', action);

    switch (action) {
      case 'creer-dossier':
        return await creerDossier(request, dbUser.id);
      
      case 'supprimer-dossier':
        return await supprimerDossier(request);
      
      case 'modifier-statut-dossier':
        return await modifierStatutDossier(request);
      
      default:
        return NextResponse.json(
          { success: false, error: 'Action non valide. Utilisez: creer-dossier, supprimer-dossier ou modifier-statut-dossier' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Erreur POST API secrétaires:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// ============================================================================
// FONCTIONS GET
// ============================================================================

// 1. Récupérer les dossiers
async function getDossiers(searchTerm: string, filiere: string, vague: string, statut: string) {
  try {
    const where: any = {};

    // Filtre par recherche
    if (searchTerm) {
      where.OR = [
        { inscription: { nom: { contains: searchTerm, mode: 'insensitive' } } },
        { inscription: { prenom: { contains: searchTerm, mode: 'insensitive' } } },
        { inscription: { email: { contains: searchTerm, mode: 'insensitive' } } }
      ];
    }

    // Filtre par filière
    if (filiere !== 'toutes') {
      where.inscription = {
        ...where.inscription,
        filiere: {
          nom: filiere
        }
      };
    }

    // Filtre par vague
    if (vague !== 'toutes') {
      where.inscription = {
        ...where.inscription,
        vague: {
          nom: vague
        }
      };
    }

    // Filtre par statut
    if (statut !== 'toutes') {
      where.statut = statut.toUpperCase();
    }

    const dossiers = await prisma.dossier.findMany({
      where,
      include: {
        inscription: {
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
                datePaiement: true
              }
            }
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        dateCreation: 'desc'
      }
    });

    const dossiersFormates = dossiers.map(dossier => {
      const documentsManquants = [];
      if (!dossier.photoIdentite) documentsManquants.push("Photo d'identité");
      if (!dossier.acteNaissance) documentsManquants.push("Acte de naissance");
      if (!dossier.relevesNotes) documentsManquants.push("Relevés de notes");

      return {
        id: dossier.id,
        eleve: `${dossier.inscription.prenom} ${dossier.inscription.nom}`,
        email: dossier.inscription.email,
        telephone: dossier.inscription.telephone,
        filiere: dossier.inscription.filiere?.nom || 'Non assignée',
        vague: dossier.inscription.vague?.nom || 'Non assignée',
        dateInscription: dossier.inscription.dateInscription,
        dateCreation: dossier.dateCreation,
        statut: dossier.statut.toLowerCase(),
        documents: {
          photoIdentite: dossier.photoIdentite,
          acteNaissance: dossier.acteNaissance,
          relevesNotes: dossier.relevesNotes
        },
        documentsManquants,
        createdBy: `${dossier.user.firstName} ${dossier.user.lastName}`
      };
    });

    // Statistiques pour les dossiers
    const statsDossiers = await getStatsDossiers();

    return NextResponse.json({
      success: true,
      data: {
        dossiers: dossiersFormates,
        stats: statsDossiers
      }
    });

  } catch (error) {
    console.error('Erreur getDossiers:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des dossiers' },
      { status: 500 }
    );
  }
}

// 2. Récupérer les inscriptions éligibles pour nouveaux dossiers
async function getInscriptionsEligibles() {
  try {
    const inscriptions = await prisma.inscription.findMany({
      where: {
        statut: 'PAYE_COMPLET',
        dossier: {
          none: {} // Aucun dossier associé
        }
      },
      include: {
        filiere: {
          select: {
            nom: true
          }
        },
        vague: {
          select: {
            nom: true
          }
        },
        paiements: {
          select: {
            montant: true,
            datePaiement: true
          }
        }
      },
      orderBy: {
        dateInscription: 'desc'
      }
    });

    const inscriptionsFormatees = inscriptions.map(inscription => ({
      id: inscription.id,
      nom: inscription.nom,
      prenom: inscription.prenom,
      email: inscription.email,
      telephone: inscription.telephone,
      filiere: inscription.filiere?.nom || 'Non assignée',
      vague: inscription.vague?.nom || 'Non assignée',
      dateInscription: inscription.dateInscription,
      fraisInscription: inscription.fraisInscription,
      fraisPayes: inscription.fraisPayes,
      statutPaiement: 'paye' as const
    }));

    return NextResponse.json({
      success: true,
      data: {
        inscriptions: inscriptionsFormatees
      }
    });

  } catch (error) {
    console.error('Erreur getInscriptionsEligibles:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des inscriptions' },
      { status: 500 }
    );
  }
}

// 3. Récupérer les statistiques
async function getStatistiques() {
  try {
    const statsDossiers = await getStatsDossiers();

    return NextResponse.json({
      success: true,
      data: {
        dossiers: statsDossiers
      }
    });

  } catch (error) {
    console.error('Erreur getStatistiques:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}

// ============================================================================
// FONCTIONS POST
// ============================================================================

// 1. Créer un dossier - CORRIGÉ
async function creerDossier(request: NextRequest, userId: string) {
  try {
    const formData = await request.formData();
    const inscriptionId = formData.get('inscriptionId') as string;
    
    console.log('📋 Création dossier pour inscription:', inscriptionId);

    // CORRECTION : Vérifier d'abord si un dossier existe déjà
    const dossierExistant = await prisma.dossier.findUnique({
      where: { inscriptionId }
    });

    if (dossierExistant) {
      console.log('❌ Dossier existe déjà pour cette inscription:', dossierExistant.id);
      return NextResponse.json(
        { success: false, error: 'Un dossier existe déjà pour cette inscription' },
        { status: 400 }
      );
    }

    // Ensuite vérifier que l'inscription existe et est payée
    const inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId }
    });

    if (!inscription) {
      return NextResponse.json(
        { success: false, error: 'Inscription non trouvée' },
        { status: 404 }
      );
    }

    if (inscription.statut !== 'PAYE_COMPLET') {
      return NextResponse.json(
        { success: false, error: 'Seules les inscriptions complètement payées peuvent avoir un dossier' },
        { status: 400 }
      );
    }

    // Simuler l'upload des fichiers
    const photoIdentite = formData.get('photoIdentite') as File;
    const acteNaissance = formData.get('acteNaissance') as File;
    const relevesNotes = formData.get('relevesNotes') as File;

    // Vérifier que tous les fichiers sont présents
    if (!photoIdentite || !acteNaissance || !relevesNotes) {
      return NextResponse.json(
        { success: false, error: 'Tous les documents sont requis' },
        { status: 400 }
      );
    }

    // Déterminer le statut du dossier
    const statut = 'COMPLET'; // Tous les documents sont présents

    // Créer le dossier
    const dossier = await prisma.dossier.create({
      data: {
        inscriptionId,
        statut,
        photoIdentite: `uploaded_${Date.now()}_photo.jpg`,
        acteNaissance: `uploaded_${Date.now()}_acte.pdf`,
        relevesNotes: `uploaded_${Date.now()}_releves.pdf`,
        createdBy: userId
      },
      include: {
        inscription: {
          include: {
            filiere: true,
            vague: true
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

    console.log('✅ Dossier créé avec succès:', dossier.id);

    return NextResponse.json({
      success: true,
      message: 'Dossier créé avec succès',
      data: {
        dossier: {
          id: dossier.id,
          eleve: `${dossier.inscription.prenom} ${dossier.inscription.nom}`,
          email: dossier.inscription.email,
          filiere: dossier.inscription.filiere?.nom,
          vague: dossier.inscription.vague?.nom,
          dateInscription: dossier.inscription.dateInscription,
          statut: dossier.statut.toLowerCase(),
          createdBy: `${dossier.user.firstName} ${dossier.user.lastName}`
        }
      }
    });

  } catch (error) {
    console.error('Erreur creerDossier:', error);
    
    // Gestion spécifique des erreurs de contrainte unique
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { success: false, error: 'Un dossier existe déjà pour cette inscription' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du dossier' },
      { status: 500 }
    );
  }
}

// 2. Supprimer un dossier
async function supprimerDossier(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    console.log('🗑️ Suppression dossier:', id);

    // Vérifier que le dossier existe
    const dossier = await prisma.dossier.findUnique({
      where: { id },
      include: {
        inscription: true
      }
    });

    if (!dossier) {
      return NextResponse.json(
        { success: false, error: 'Dossier non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le dossier
    await prisma.dossier.delete({
      where: { id }
    });

    console.log('✅ Dossier supprimé avec succès:', id);

    return NextResponse.json({
      success: true,
      message: 'Dossier supprimé avec succès',
      data: {
        deletedDossier: {
          id: dossier.id,
          eleve: `${dossier.inscription.prenom} ${dossier.inscription.nom}`
        }
      }
    });

  } catch (error) {
    console.error('Erreur supprimerDossier:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression du dossier' },
      { status: 500 }
    );
  }
}

// 3. Modifier le statut d'un dossier
async function modifierStatutDossier(request: NextRequest) {
  try {
    const { id, statut } = await request.json();

    if (!id || !statut) {
      return NextResponse.json(
        { success: false, error: 'ID et statut requis' },
        { status: 400 }
      );
    }

    console.log('✏️ Modification statut dossier:', { id, statut });

    // Vérifier que le dossier existe
    const dossier = await prisma.dossier.findUnique({
      where: { id }
    });

    if (!dossier) {
      return NextResponse.json(
        { success: false, error: 'Dossier non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le statut
    const dossierMaj = await prisma.dossier.update({
      where: { id },
      data: { 
        statut: statut.toUpperCase()
      },
      include: {
        inscription: {
          include: {
            filiere: true,
            vague: true
          }
        }
      }
    });

    console.log('✅ Statut dossier mis à jour:', id);

    return NextResponse.json({
      success: true,
      message: 'Statut du dossier mis à jour avec succès',
      data: {
        dossier: {
          id: dossierMaj.id,
          eleve: `${dossierMaj.inscription.prenom} ${dossierMaj.inscription.nom}`,
          statut: dossierMaj.statut.toLowerCase()
        }
      }
    });

  } catch (error) {
    console.error('Erreur modifierStatutDossier:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la modification du statut' },
      { status: 500 }
    );
  }
}

// ============================================================================
// FONCTIONS UTILITAIRES POUR LES STATISTIQUES
// ============================================================================

async function getStatsDossiers() {
  try {
    const totalDossiers = await prisma.dossier.count();
    const dossiersComplets = await prisma.dossier.count({
      where: { statut: 'COMPLET' }
    });
    const dossiersIncomplets = await prisma.dossier.count({
      where: { statut: 'INCOMPLET' }
    });
    const dossiersEnAttente = await prisma.dossier.count({
      where: { statut: 'EN_ATTENTE' }
    });
    const dossiersValides = await prisma.dossier.count({
      where: { statut: 'VALIDE' }
    });
    const dossiersRejetes = await prisma.dossier.count({
      where: { statut: 'REJETE' }
    });

    // CORRECTION : Utiliser la relation correcte pour les inscriptions sans dossier
    const elevesEligibles = await prisma.inscription.count({
      where: {
        statut: 'PAYE_COMPLET',
        dossier: {
          none: {} // Aucun dossier associé
        }
      }
    });

    return {
      totalDossiers,
      dossiersComplets,
      dossiersIncomplets,
      dossiersEnAttente,
      dossiersValides,
      dossiersRejetes,
      elevesEligibles
    };
  } catch (error) {
    console.error('Erreur getStatsDossiers:', error);
    return {
      totalDossiers: 0,
      dossiersComplets: 0,
      dossiersIncomplets: 0,
      dossiersEnAttente: 0,
      dossiersValides: 0,
      dossiersRejetes: 0,
      elevesEligibles: 0
    };
  }
}