import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// Fonction pour obtenir ou créer l'utilisateur dans la base de données
async function getOrCreateUser(clerkUserId: string, userData: any) {
  try {
    // Vérifier si l'utilisateur existe déjà
    let user = await prisma.user.findUnique({
      where: { clerkUserId }
    });

    // Si l'utilisateur n'existe pas, le créer
    if (!user) {
      // CORRECTION : Convertir le rôle Clerk vers le format Prisma
      const clerkRole = userData.publicMetadata?.role;
      let prismaRole: string;
      
      // Mapping des rôles Clerk vers les rôles Prisma
      switch (clerkRole) {
        case 'Secretaire':
          prismaRole = 'SECRETAIRE';
          break;
        case 'Censeur':
          prismaRole = 'CENSEUR';
          break;
        case 'Admin':
          prismaRole = 'ADMIN';
          break;
        case 'Comptable':
          prismaRole = 'COMPTABLE';
          break;
        case 'Enseignant':
          prismaRole = 'ENSEIGNANT';
          break;
        case 'Etudiant':
          prismaRole = 'ETUDIANT';
          break;
        case 'Parent':
          prismaRole = 'PARENT';
          break;
        default:
          prismaRole = 'SECRETAIRE'; // Valeur par défaut
      }

      console.log('🎭 Conversion rôle:', { clerkRole, prismaRole });

      user = await prisma.user.create({
        data: {
          clerkUserId,
          email: userData.emailAddresses[0]?.emailAddress || 'unknown@example.com',
          role: prismaRole as any, // Conversion vers l'enum Prisma
          firstName: userData.firstName || 'Utilisateur',
          lastName: userData.lastName || 'Inconnu',
          isActive: true
        }
      });
      console.log('✅ Utilisateur créé dans la base de données:', user.id, 'Rôle:', prismaRole);
    } else {
      console.log('✅ Utilisateur trouvé dans la base:', user.id, 'Rôle:', user.role);
    }

    return user;
  } catch (error) {
    console.error('❌ Erreur création/utilisateur:', error);
    
    // Fallback: essayer de récupérer n'importe quel utilisateur existant
    const fallbackUser = await prisma.user.findFirst({
      where: {
        role: {
          in: ['SECRETAIRE', 'ADMIN', 'COMPTABLE']
        }
      }
    });

    if (fallbackUser) {
      console.log('⚠️ Utilisation utilisateur fallback:', fallbackUser.id);
      return fallbackUser;
    }

    throw error;
  }
}

// Fonction pour calculer les statistiques
async function calculateStatistiques(where: any = {}) {
  try {
    const [
      totalInscriptions,
      enAttente,
      approuvees,
      payeComplet,
      toutesInscriptions
    ] = await Promise.all([
      prisma.inscription.count({ where }),
      prisma.inscription.count({ where: { ...where, statut: 'EN_ATTENTE' } }),
      prisma.inscription.count({ where: { ...where, statut: 'APPROUVE' } }),
      prisma.inscription.count({ where: { ...where, statut: 'PAYE_COMPLET' } }),
      prisma.inscription.findMany({ 
        where,
        select: { fraisInscription: true, fraisPayes: true, statut: true }
      })
    ]);

    const totalFraisCollectes = toutesInscriptions.reduce(
      (sum, inscription) => sum + inscription.fraisPayes, 0
    );

    const totalFraisEnAttente = toutesInscriptions.reduce(
      (sum, inscription) => {
        if (inscription.statut !== 'PAYE_COMPLET') {
          return sum + (inscription.fraisInscription - inscription.fraisPayes);
        }
        return sum;
      }, 0
    );

    return {
      totalInscriptions,
      enAttente,
      approuvees,
      payeComplet,
      totalFraisCollectes,
      totalFraisEnAttente
    };
  } catch (error) {
    console.error('Erreur calcul statistiques:', error);
    return {
      totalInscriptions: 0,
      enAttente: 0,
      approuvees: 0,
      payeComplet: 0,
      totalFraisCollectes: 0,
      totalFraisEnAttente: 0
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Début API inscriptions');
    
    const user = await currentUser();
    console.log('👤 User:', user?.id);
    
    if (!user) {
      console.log('❌ Utilisateur non authentifié');
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userRole = user.publicMetadata?.role;
    console.log('🎭 Rôle utilisateur:', userRole);
    
    // CORRECTION : Accepter les deux orthographes (Secretaire et SECRETAIRE)
    const allowedRoles = ['SECRETAIRE', 'Secretaire', 'ADMIN', 'COMPTABLE'];
    
    if (!userRole || !allowedRoles.includes(userRole as string)) {
      console.log('🚫 Accès refusé - Rôle:', userRole);
      return NextResponse.json({ 
        error: 'Accès non autorisé',
        details: `Rôle requis: SECRETAIRE. Votre rôle: ${userRole || 'Non défini'}`,
        allowedRoles: allowedRoles,
        yourRole: userRole
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const filiereId = searchParams.get('filiereId');
    const vagueId = searchParams.get('vagueId');
    const statut = searchParams.get('statut');

    console.log('📋 Filtres:', { search, filiereId, vagueId, statut });

    // Construire les filtres
    const where: any = {};

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (filiereId && filiereId !== 'toutes') {
      where.filiereId = parseInt(filiereId);
    }

    if (vagueId && vagueId !== 'toutes') {
      where.vagueId = vagueId;
    }

    if (statut && statut !== 'toutes') {
      where.statut = statut.toUpperCase();
    }

    console.log('🔍 Where clause:', JSON.stringify(where));

    // Récupérer les données
    const [inscriptions, filieres, vagues, fraisInscriptionConfig] = await Promise.all([
      // Inscriptions
      prisma.inscription.findMany({
        where,
        include: {
          filiere: { select: { id: true, nom: true } },
          vague: { select: { id: true, nom: true } },
          paiements: { orderBy: { datePaiement: 'desc' }, take: 5 }
        },
        orderBy: { createdAt: 'desc' }
      }).catch(error => {
        console.error('❌ Erreur inscriptions:', error);
        return [];
      }),

      // Filieres
      prisma.filiere.findMany({
        select: { id: true, nom: true },
        orderBy: { nom: 'asc' }
      }).catch(error => {
        console.error('❌ Erreur filières:', error);
        return [];
      }),

      // Vagues
      prisma.vague.findMany({
        where: { isActive: true },
        select: { id: true, nom: true },
        orderBy: { nom: 'asc' }
      }).catch(error => {
        console.error('❌ Erreur vagues:', error);
        return [];
      }),

      // Frais configuration
      prisma.fraisConfiguration.findUnique({
        where: { type: 'INSCRIPTION_UNIVERSEL' }
      }).catch(error => {
        console.error('❌ Erreur frais config:', error);
        return null;
      })
    ]);

    console.log(`📊 ${inscriptions.length} inscription(s) trouvée(s)`);
    console.log(`🎓 ${filieres.length} filière(s) trouvée(s)`);
    console.log(`🌊 ${vagues.length} vague(s) trouvée(s)`);

    // Calculer les statistiques
    const statistiques = await calculateStatistiques(where);

    // Formater la réponse
    const responseData = {
      inscriptions: inscriptions.map(inscription => ({
        id: inscription.id,
        nom: inscription.nom,
        prenom: inscription.prenom,
        email: inscription.email,
        telephone: inscription.telephone,
        dateNaissance: inscription.dateNaissance?.toISOString().split('T')[0],
        dateInscription: inscription.dateInscription.toISOString(),
        statut: inscription.statut.toLowerCase(),
        fraisInscription: inscription.fraisInscription,
        fraisPayes: inscription.fraisPayes,
        filiere: inscription.filiere?.nom || 'Non assigné',
        vague: inscription.vague?.nom || 'Non assigné',
        filiereId: inscription.filiereId,
        vagueId: inscription.vagueId
      })),
      filieres: filieres.map(filiere => ({
        value: filiere.id.toString(),
        label: filiere.nom
      })),
      vagues: vagues.map(vague => ({
        value: vague.id,
        label: vague.nom
      })),
      fraisInscription: fraisInscriptionConfig?.montant || 15000,
      statistiques
    };

    console.log('✅ Données préparées avec succès');
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('💥 Erreur API inscriptions:', error);
    
    // Données de secours
    const fallbackData = {
      inscriptions: [],
      filieres: [],
      vagues: [],
      fraisInscription: 15000,
      statistiques: {
        totalInscriptions: 0,
        enAttente: 0,
        approuvees: 0,
        payeComplet: 0,
        totalFraisCollectes: 0,
        totalFraisEnAttente: 0
      }
    };

    return NextResponse.json(fallbackData);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userRole = user.publicMetadata?.role;
    // CORRECTION : Accepter les deux orthographes
    const allowedRoles = ['SECRETAIRE', 'Secretaire', 'ADMIN', 'COMPTABLE'];
    
    if (!userRole || !allowedRoles.includes(userRole as string)) {
      return NextResponse.json({ 
        error: 'Accès non autorisé',
        details: `Rôle: ${userRole}`
      }, { status: 403 });
    }

    // CORRECTION : Obtenir ou créer l'utilisateur dans la base de données
    const dbUser = await getOrCreateUser(user.id, user);
    console.log('👤 Utilisateur DB:', dbUser.id);

    const body = await request.json();
    const { action, data } = body;

    console.log('📨 Action POST:', action);

    switch (action) {
      case 'CREATE_INSCRIPTION':
        return await createInscription(data, dbUser.id);
      
      case 'UPDATE_STATUT':
        return await updateStatutInscription(data);
      
      case 'CREATE_PAIEMENT':
        return await createPaiement(data, dbUser.id);
      
      case 'UPDATE_FRAIS':
        return await updateFraisInscription(data, dbUser.id);
      
      case 'DELETE_INSCRIPTION':
        return await deleteInscription(data);
      
      default:
        return NextResponse.json({ 
          error: 'Action non reconnue' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('💥 Erreur API inscriptions POST:', error);
    return NextResponse.json({ 
      error: 'Erreur lors du traitement de la requête' 
    }, { status: 500 });
  }
}

async function createInscription(data: any, createdById: string) {
  try {
    const { nom, prenom, email, telephone, dateNaissance, filiereId, vagueId } = data;

    if (!nom || !prenom || !email || !telephone || !filiereId || !vagueId) {
      return NextResponse.json({ 
        error: 'Tous les champs obligatoires doivent être remplis' 
      }, { status: 400 });
    }

    // Vérifier si l'email existe déjà
    const existingInscription = await prisma.inscription.findUnique({
      where: { email }
    });

    if (existingInscription) {
      return NextResponse.json({ 
        error: 'Une inscription avec cet email existe déjà' 
      }, { status: 409 });
    }

    // Récupérer les frais d'inscription
    const fraisConfig = await prisma.fraisConfiguration.findUnique({
      where: { type: 'INSCRIPTION_UNIVERSEL' }
    });

    const fraisInscription = fraisConfig?.montant || 15000;

    // Créer l'inscription
    const nouvelleInscription = await prisma.inscription.create({
      data: {
        nom,
        prenom,
        email,
        telephone,
        dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
        filiereId: parseInt(filiereId),
        vagueId,
        fraisInscription,
        fraisPayes: 0,
        statut: 'EN_ATTENTE',
        createdById
      },
      include: {
        filiere: { select: { nom: true } },
        vague: { select: { nom: true } }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Inscription créée avec succès',
      data: nouvelleInscription
    });

  } catch (error: any) {
    console.error('Erreur création inscription:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Une inscription avec cet email existe déjà' 
      }, { status: 409 });
    }

    return NextResponse.json({ 
      error: 'Erreur lors de la création de l\'inscription' 
    }, { status: 500 });
  }
}

async function updateStatutInscription(data: any) {
  try {
    const { id, statut } = data;

    if (!id || !statut) {
      return NextResponse.json({ 
        error: 'ID et statut sont requis' 
      }, { status: 400 });
    }

    // Vérifier que l'inscription existe
    const inscription = await prisma.inscription.findUnique({
      where: { id }
    });

    if (!inscription) {
      return NextResponse.json({ 
        error: 'Inscription non trouvée' 
      }, { status: 404 });
    }

    // Mettre à jour le statut
    const inscriptionMaj = await prisma.inscription.update({
      where: { id },
      data: { 
        statut: statut.toUpperCase(),
        ...(statut.toLowerCase() === 'rejete' && { fraisPayes: 0 })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: inscriptionMaj
    });

  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour du statut' 
    }, { status: 500 });
  }
}

async function createPaiement(data: any, createdById: string) {
  try {
    const {
      inscriptionId,
      montant,
      modePaiement,
      reference
    } = data;

    if (!inscriptionId || !montant || !modePaiement) {
      return NextResponse.json({ 
        error: 'Inscription ID, montant et mode de paiement sont requis' 
      }, { status: 400 });
    }

    // Vérifier que l'inscription existe
    const inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId }
    });

    if (!inscription) {
      return NextResponse.json({ 
        error: 'Inscription non trouvée' 
      }, { status: 404 });
    }

    // Créer le paiement
    const paiement = await prisma.paiement.create({
      data: {
        inscriptionId,
        montant,
        modePaiement,
        reference: reference || null,
        createdById
      }
    });

    // Mettre à jour les frais payés de l'inscription
    const nouveauFraisPayes = inscription.fraisPayes + montant;
    
    // Déterminer le nouveau statut
    let nouveauStatut = inscription.statut;
    if (nouveauFraisPayes >= inscription.fraisInscription) {
      nouveauStatut = 'PAYE_COMPLET';
    } else if (nouveauFraisPayes > 0) {
      nouveauStatut = 'PAYE_PARTIEL';
    }

    const inscriptionMaj = await prisma.inscription.update({
      where: { id: inscriptionId },
      data: {
        fraisPayes: nouveauFraisPayes,
        statut: nouveauStatut,
        datePaiement: nouveauStatut === 'PAYE_COMPLET' ? new Date() : inscription.datePaiement
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Paiement enregistré avec succès',
      data: {
        paiement,
        inscription: inscriptionMaj
      }
    });

  } catch (error) {
    console.error('Erreur création paiement:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'enregistrement du paiement' 
    }, { status: 500 });
  }
}

async function updateFraisInscription(data: any, createdById: string) {
  try {
    const { montant } = data;

    if (!montant || montant <= 0) {
      return NextResponse.json({ 
        error: 'Le montant doit être supérieur à 0' 
      }, { status: 400 });
    }

    // CORRECTION : Utiliser l'ID de l'utilisateur réel
    const fraisConfig = await prisma.fraisConfiguration.upsert({
      where: {
        type: 'INSCRIPTION_UNIVERSEL'
      },
      update: {
        montant,
        description: 'Frais d\'inscription universel pour toutes les filières',
        updatedAt: new Date()
      },
      create: {
        type: 'INSCRIPTION_UNIVERSEL',
        montant,
        description: 'Frais d\'inscription universel pour toutes les filières',
        createdById: createdById // Utiliser l'ID réel de l'utilisateur
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Frais d\'inscription mis à jour avec succès',
      fraisInscription: fraisConfig.montant
    });

  } catch (error) {
    console.error('Erreur mise à jour frais:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la mise à jour des frais' 
    }, { status: 500 });
  }
}

async function deleteInscription(data: any) {
  try {
    const { id } = data;

    if (!id) {
      return NextResponse.json({ 
        error: 'ID de l\'inscription requis' 
      }, { status: 400 });
    }

    // Vérifier que l'inscription existe
    const inscription = await prisma.inscription.findUnique({
      where: { id },
      include: {
        paiements: true
      }
    });

    if (!inscription) {
      return NextResponse.json({ 
        error: 'Inscription non trouvée' 
      }, { status: 404 });
    }

    // Supprimer l'inscription (les paiements seront supprimés automatiquement via cascade)
    await prisma.inscription.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Inscription supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression inscription:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la suppression de l\'inscription' 
    }, { status: 500 });
  }
}