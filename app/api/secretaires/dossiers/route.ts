// app/api/secretaires/dossiers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Début de la requête GET /api/secretaires/dossiers');
    
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 } 
      );
    }

    // Vérifier le rôle
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
      select: { role: true }
    });

    if (!dbUser || !['ADMIN', 'SECRETAIRE', 'CENSEUR'].includes(dbUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const filiere = searchParams.get('filiere') || 'toutes';
    const vague = searchParams.get('vague') || 'toutes';
    const statut = searchParams.get('statut') || 'toutes';

    console.log('📋 Filtres dossiers:', { searchTerm, filiere, vague, statut });

    // CORRECTION: Construction robuste du WHERE
    const where: any = {};

    // Filtre par recherche
    if (searchTerm) {
      where.OR = [
        { inscription: { nom: { contains: searchTerm, mode: 'insensitive' } } },
        { inscription: { prenom: { contains: searchTerm, mode: 'insensitive' } } },
        { inscription: { email: { contains: searchTerm, mode: 'insensitive' } } }
      ];
    }

    // CORRECTION: Gestion correcte des filtres imbriqués
    const inscriptionWhere: any = {};
    
    if (filiere !== 'toutes') {
      inscriptionWhere.filiereId = filiere;
    }
    
    if (vague !== 'toutes') {
      inscriptionWhere.vagueId = vague;
    }

    // Si on a des filtres sur l'inscription, on les ajoute
    if (Object.keys(inscriptionWhere).length > 0) {
      where.inscription = inscriptionWhere;
    }

    // Filtre par statut
    if (statut !== 'toutes') {
      where.statut = statut.toUpperCase();
    }

    console.log('🔍 Where clause FINAL:', JSON.stringify(where, null, 2));

    // CORRECTION: Test de débogage
    console.log('🧪 TEST: Compter tous les dossiers sans filtre...');
    const totalCount = await prisma.dossier.count();
    console.log(`🧪 Total dossiers en base: ${totalCount}`);

    // Récupérer les dossiers
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

    console.log(`📊 ${dossiers.length} dossier(s) trouvé(s) avec les filtres`);

    // Log détaillé pour debug
    dossiers.forEach((dossier, index) => {
      console.log(`📄 Dossier ${index + 1}:`, {
        id: dossier.id,
        inscriptionId: dossier.inscriptionId,
        eleve: `${dossier.inscription.prenom} ${dossier.inscription.nom}`,
        statut: dossier.statut,
        filiere: dossier.inscription.filiere?.nom,
        vague: dossier.inscription.vague?.nom
      });
    });

    // FORMATAGE DES DONNÉES POUR LE FRONTEND
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
        createdBy: dossier.user ? `${dossier.user.firstName} ${dossier.user.lastName}` : 'Système'
      };
    });

    // Récupérer les statistiques
    const statsDossiers = await getStatsDossiers();

    // RÉPONSE UNIFIÉE POUR LE FRONTEND
    const response = {
      success: true,
      data: {
        dossiers: dossiersFormates,
        stats: statsDossiers,
        metadata: {
          total: dossiers.length,
          totalInBase: totalCount, // Pour debug
          filtres: { searchTerm, filiere, vague, statut }
        }
      }
    };

    console.log('✅ Dossiers préparés avec succès');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Erreur GET /api/secretaires/dossiers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des dossiers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Début de la requête POST /api/secretaires/dossiers');
    
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Vérifier le rôle
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
      select: { role: true, id: true }
    });

    console.log('👤 User DB trouvé:', dbUser);

    if (!dbUser || !['ADMIN', 'SECRETAIRE', 'CENSEUR'].includes(dbUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Gérer les FormData pour l'upload de fichiers
    const contentType = request.headers.get('content-type') || '';
    
    let inscriptionId: string;
    let fichiers: { [key: string]: File } = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      inscriptionId = formData.get('inscriptionId') as string;
      
      const photoIdentite = formData.get('photoIdentite') as File;
      const acteNaissance = formData.get('acteNaissance') as File;
      const relevesNotes = formData.get('relevesNotes') as File;

      if (photoIdentite && photoIdentite.size > 0) fichiers.photoIdentite = photoIdentite;
      if (acteNaissance && acteNaissance.size > 0) fichiers.acteNaissance = acteNaissance;
      if (relevesNotes && relevesNotes.size > 0) fichiers.relevesNotes = relevesNotes;

    } else {
      const body = await request.json();
      inscriptionId = body.inscriptionId;
    }

    console.log('🎯 Inscription ID reçu:', inscriptionId);

    if (!inscriptionId) {
      return NextResponse.json(
        { success: false, error: 'ID d\'inscription requis' },
        { status: 400 }
      );
    }

    // CORRECTION: Vérification robuste de l'existence
    console.log('🔍 Vérification existence dossier pour:', inscriptionId);
    
    const dossierExistant = await prisma.dossier.findUnique({
      where: { inscriptionId: inscriptionId }
    });

    console.log('📁 Résultat vérification dossier:', {
      existe: !!dossierExistant,
      dossierId: dossierExistant?.id,
      inscriptionId: inscriptionId
    });

    if (dossierExistant) {
      console.log('❌ CONFLIT: Dossier existe déjà - ID:', dossierExistant.id);
      
      // CORRECTION: Vérifier pourquoi il n'apparaît pas dans GET
      const dossierAvecRelations = await prisma.dossier.findUnique({
        where: { id: dossierExistant.id },
        include: {
          inscription: {
            include: {
              filiere: true,
              vague: true
            }
          }
        }
      });
      
      console.log('🔍 Dossier complet pour debug:', dossierAvecRelations);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Un dossier existe déjà pour cette inscription',
          existingDossierId: dossierExistant.id,
          debug: {
            dossierStatut: dossierExistant.statut,
            eleve: dossierAvecRelations ? `${dossierAvecRelations.inscription.prenom} ${dossierAvecRelations.inscription.nom}` : 'Inconnu'
          }
        },
        { status: 400 }
      );
    }

    // Vérifier que l'inscription existe
    const inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: {
        filiere: true,
        vague: true
      }
    });

    console.log('📝 Inscription trouvée:', inscription);

    if (!inscription) {
      return NextResponse.json(
        { success: false, error: 'Inscription non trouvée' },
        { status: 404 }
      );
    }

    // Préparer les données pour la création du dossier
    const dossierData: any = {
      inscriptionId: inscriptionId,
      statut: 'EN_ATTENTE',
      createdBy: dbUser.id,
      dateCreation: new Date(),
      dateMaj: new Date()
    };

    // Traiter l'upload des fichiers si présents
    if (Object.keys(fichiers).length > 0) {
      console.log('📎 Fichiers à uploader:', Object.keys(fichiers));
      
      for (const [docType, file] of Object.entries(fichiers)) {
        const fileName = `doc_${inscriptionId}_${docType}_${Date.now()}_${file.name}`;
        dossierData[docType] = fileName;
        console.log(`✅ Fichier ${docType} traité:`, fileName);
      }

      if (fichiers.photoIdentite && fichiers.acteNaissance && fichiers.relevesNotes) {
        dossierData.statut = 'COMPLET';
      }
    }

    // Créer le dossier
    console.log('✅ Création du dossier...');
    const nouveauDossier = await prisma.dossier.create({
      data: dossierData,
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

    console.log('✅ Dossier créé avec succès:', nouveauDossier.id);

    const responseData = {
      id: nouveauDossier.id,
      statut: nouveauDossier.statut,
      eleve: `${nouveauDossier.inscription.prenom} ${nouveauDossier.inscription.nom}`,
      email: nouveauDossier.inscription.email,
      filiere: nouveauDossier.inscription.filiere?.nom,
      vague: nouveauDossier.inscription.vague?.nom,
      dateCreation: nouveauDossier.dateCreation,
      createdBy: nouveauDossier.user ? `${nouveauDossier.user.firstName} ${nouveauDossier.user.lastName}` : 'Système'
    };

    return NextResponse.json({
      success: true,
      message: 'Dossier créé avec succès',
      data: responseData
    });

  } catch (error) {
    console.error('❌ Erreur POST /api/secretaires/dossiers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la création du dossier',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('✏️ Début de la requête PUT /api/secretaires/dossiers');
    
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
      select: { role: true, id: true }
    });

    if (!dbUser || !['ADMIN', 'SECRETAIRE', 'CENSEUR'].includes(dbUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    if (action === 'modifier-statut') {
      const { id, statut } = body;

      if (!id || !statut) {
        return NextResponse.json(
          { success: false, error: 'ID et statut requis' },
          { status: 400 }
        );
      }

      const dossierExistant = await prisma.dossier.findUnique({
        where: { id }
      });

      if (!dossierExistant) {
        return NextResponse.json(
          { success: false, error: 'Dossier non trouvé' },
          { status: 404 }
        );
      }

      const dossierModifie = await prisma.dossier.update({
        where: { id },
        data: {
          statut: statut.toUpperCase(),
          dateMaj: new Date()
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

      console.log('✅ Statut du dossier mis à jour:', id, '->', statut);

      return NextResponse.json({
        success: true,
        message: 'Statut du dossier mis à jour avec succès',
        data: {
          id: dossierModifie.id,
          statut: dossierModifie.statut.toLowerCase(),
          eleve: `${dossierModifie.inscription.prenom} ${dossierModifie.inscription.nom}`
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Action non supportée' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Erreur PUT /api/secretaires/dossiers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la modification du dossier',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Début de la requête DELETE /api/secretaires/dossiers');
    
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId: user.id },
      select: { role: true, id: true }
    });

    if (!dbUser || !['ADMIN', 'SECRETAIRE', 'CENSEUR'].includes(dbUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID du dossier requis' },
        { status: 400 }
      );
    }

    const dossierExistant = await prisma.dossier.findUnique({
      where: { id },
      include: {
        inscription: {
          select: {
            prenom: true,
            nom: true
          }
        }
      }
    });

    if (!dossierExistant) {
      return NextResponse.json(
        { success: false, error: 'Dossier non trouvé' },
        { status: 404 }
      );
    }

    await prisma.dossier.delete({
      where: { id }
    });

    console.log('✅ Dossier supprimé:', id);

    return NextResponse.json({
      success: true,
      message: `Dossier de ${dossierExistant.inscription.prenom} ${dossierExistant.inscription.nom} supprimé avec succès`
    });

  } catch (error) {
    console.error('❌ Erreur DELETE /api/secretaires/dossiers:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la suppression du dossier',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Fonction utilitaire pour les statistiques
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

    return {
      totalDossiers,
      dossiersComplets,
      dossiersIncomplets,
      dossiersEnAttente,
      dossiersValides,
      dossiersRejetes
    };
  } catch (error) {
    console.error('Erreur getStatsDossiers:', error);
    return {
      totalDossiers: 0,
      dossiersComplets: 0,
      dossiersIncomplets: 0,
      dossiersEnAttente: 0,
      dossiersValides: 0,
      dossiersRejetes: 0
    };
  }
}