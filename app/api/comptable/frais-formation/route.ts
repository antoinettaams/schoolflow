// app/api/comptable/frais-formation/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Types
interface ServicesInclus {
  connexionIllimitee: boolean;
  ordinateurPortable: boolean;
  materielPedagogique: boolean;
  accesPlateforme: boolean;
  supportTechnique: boolean;
}

interface FraisFormationData {
  id: string;
  vagueId: string;
  vagueName: string;
  filiereId: string;
  filiereName: string;
  fraisInscription: number;
  fraisScolarite: number;
  servicesInclus: ServicesInclus;
  total: number;
  statut: 'ACTIF' | 'ARCHIVE';
  dateCreation: string;
  dateModification: string;
}

// Fonction pour convertir les nombres avec séparateurs en nombre simple
function parseMontant(montant: any): number {
  if (typeof montant === 'number') return montant;
  if (typeof montant === 'string') {
    // Supprimer les espaces et convertir les virgules en points
    const cleaned = montant
      .replace(/\s/g, '') // Supprimer les espaces
      .replace(/,/g, '.'); // Remplacer les virgules par des points
    
    // Convertir en nombre
    const nombre = parseFloat(cleaned);
    return isNaN(nombre) ? 0 : Math.round(nombre); // Arrondir pour éviter les décimales
  }
  return 0;
}

// Vérification robuste du modèle fraisFormation
const isFraisFormationAvailable = () => {
  try {
    return prisma && 
           typeof prisma.fraisFormation !== 'undefined' && 
           typeof prisma.fraisFormation.findMany === 'function';
  } catch (error) {
    return false;
  }
};

// GET - Récupérer tous les frais de formation
export async function GET(request: Request) {
  try {
    console.log('🔍 Début GET /api/comptable/frais-formation');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const vagueId = searchParams.get('vagueId');
    const filiereId = searchParams.get('filiereId');

    console.log('📋 Paramètres:', { id, vagueId, filiereId });

    // Récupérer le frais d'inscription universel
    let FRAIS_INSCRIPTION_UNIVERSEL = 10000;
    try {
      const fraisInscriptionConfig = await prisma.fraisConfiguration.findUnique({
        where: { type: 'INSCRIPTION_UNIVERSEL' }
      });
      FRAIS_INSCRIPTION_UNIVERSEL = fraisInscriptionConfig?.montant || 10000;
      console.log('💰 Frais inscription universel:', FRAIS_INSCRIPTION_UNIVERSEL);
    } catch (error) {
      console.warn('⚠️ Utilisation valeur par défaut pour frais inscription');
    }

    // Vérifier si le modèle fraisFormation est disponible
    const fraisFormationAvailable = isFraisFormationAvailable();
    
    if (!fraisFormationAvailable) {
      console.error('🚨 MODÈLE FRAISFORMATION NON DISPONIBLE DANS PRISMA CLIENT');
      console.log('💡 Solution: Exécutez "npx prisma generate" puis redémarrez le serveur');
      
      return NextResponse.json({
        success: true,
        data: [],
        metadata: {
          fraisInscriptionUniversel: FRAIS_INSCRIPTION_UNIVERSEL,
          vagues: [],
          filieres: [],
          total: 0,
          mode: 'maintenance',
          message: 'Le service est en cours de maintenance. Veuillez réessayer dans quelques instants.'
        },
        message: 'Service temporairement indisponible'
      });
    }

    // Si un ID est fourni, récupérer une configuration spécifique
    if (id) {
      try {
        console.log('🎯 Recherche configuration spécifique:', id);
        const fraisFormation = await prisma.fraisFormation.findUnique({
          where: { id },
          include: {
            vague: { select: { nom: true } },
            filiere: { select: { nom: true, description: true } }
          }
        });

        if (!fraisFormation) {
          return NextResponse.json({
            success: false,
            error: 'Configuration non trouvée',
            message: 'Aucune configuration de frais ne correspond à cet identifiant.'
          }, { status: 404 });
        }

        const responseData: FraisFormationData = {
          id: fraisFormation.id,
          vagueId: fraisFormation.vagueId,
          vagueName: fraisFormation.vague.nom,
          filiereId: fraisFormation.filiereId.toString(),
          filiereName: fraisFormation.filiere.nom,
          fraisInscription: FRAIS_INSCRIPTION_UNIVERSEL,
          fraisScolarite: fraisFormation.fraisScolarite,
          servicesInclus: fraisFormation.servicesInclus as ServicesInclus,
          total: FRAIS_INSCRIPTION_UNIVERSEL + fraisFormation.fraisScolarite,
          statut: fraisFormation.statut,
          dateCreation: fraisFormation.createdAt.toISOString().split('T')[0],
          dateModification: fraisFormation.updatedAt.toISOString().split('T')[0]
        };

        return NextResponse.json({
          success: true,
          data: responseData,
          message: 'Configuration récupérée avec succès'
        });
      } catch (error) {
        console.error('❌ Erreur recherche configuration:', error);
        return NextResponse.json({
          success: false,
          error: 'Erreur de recherche',
          message: 'Impossible de récupérer cette configuration.'
        }, { status: 500 });
      }
    }

    // Récupérer toutes les configurations
    try {
      const where: any = {};
      if (vagueId && vagueId !== 'all') where.vagueId = vagueId;
      if (filiereId && filiereId !== 'all') where.filiereId = parseInt(filiereId);

      console.log('🔍 Filtres appliqués:', where);

      const fraisFormations = await prisma.fraisFormation.findMany({
        where,
        include: {
          vague: { select: { nom: true } },
          filiere: { select: { nom: true, description: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`📊 ${fraisFormations.length} configuration(s) trouvée(s)`);

      // Formater les données
      const formattedFrais: FraisFormationData[] = fraisFormations.map((frais) => ({
        id: frais.id,
        vagueId: frais.vagueId,
        vagueName: frais.vague.nom,
        filiereId: frais.filiereId.toString(),
        filiereName: frais.filiere.nom,
        fraisInscription: FRAIS_INSCRIPTION_UNIVERSEL,
        fraisScolarite: frais.fraisScolarite,
        servicesInclus: frais.servicesInclus as ServicesInclus,
        total: FRAIS_INSCRIPTION_UNIVERSEL + frais.fraisScolarite,
        statut: frais.statut,
        dateCreation: frais.createdAt.toISOString().split('T')[0],
        dateModification: frais.updatedAt.toISOString().split('T')[0]
      }));

      // Récupérer les listes pour les filtres
      const [vagues, filieres] = await Promise.all([
        prisma.vague.findMany({
          where: { isActive: true },
          select: { id: true, nom: true }
        }),
        prisma.filiere.findMany({
          select: { id: true, nom: true }
        })
      ]);

      return NextResponse.json({
        success: true,
        data: formattedFrais,
        metadata: {
          fraisInscriptionUniversel: FRAIS_INSCRIPTION_UNIVERSEL,
          vagues,
          filieres,
          total: formattedFrais.length,
          mode: 'base-de-donnees'
        },
        message: `${formattedFrais.length} configuration(s) récupérée(s) avec succès`
      });

    } catch (error) {
      console.error('❌ Erreur récupération liste:', error);
      return NextResponse.json({
        success: false,
        error: 'Erreur de chargement',
        message: 'Impossible de charger les configurations.',
        data: [],
        metadata: {
          fraisInscriptionUniversel: FRAIS_INSCRIPTION_UNIVERSEL,
          vagues: [],
          filieres: [],
          total: 0
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error('💥 Erreur critique API frais formation:', error);
    return NextResponse.json({
      success: false,
      error: 'Service indisponible',
      message: 'Le service est temporairement indisponible.',
      data: [],
      metadata: {
        fraisInscriptionUniversel: 10000,
        vagues: [],
        filieres: [],
        total: 0
      }
    }, { status: 500 });
  }
}

// POST - Créer une nouvelle configuration
export async function POST(request: Request) {
  try {
    if (!isFraisFormationAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Service indisponible',
        message: 'Le service de création est temporairement indisponible. Veuillez réessayer ultérieurement.'
      }, { status: 503 });
    }

    const body = await request.json();
    const { vagueId, filiereId, fraisScolarite, servicesInclus } = body;

    console.log('📥 Données reçues:', { vagueId, filiereId, fraisScolarite, type: typeof fraisScolarite });

    // Validation
    if (!vagueId || !filiereId || !fraisScolarite) {
      return NextResponse.json({
        success: false,
        error: 'Données incomplètes',
        message: 'Veuillez remplir tous les champs obligatoires.'
      }, { status: 400 });
    }

    // Convertir le montant avec gestion des séparateurs
    const fraisScolariteConverti = parseMontant(fraisScolarite);
    console.log('💰 Frais scolarité converti:', fraisScolariteConverti);

    if (fraisScolariteConverti <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Montant invalide',
        message: 'Le montant des frais de scolarité doit être supérieur à 0.'
      }, { status: 400 });
    }

    // Vérifier si une configuration existe déjà
    const existingConfig = await prisma.fraisFormation.findFirst({
      where: {
        vagueId,
        filiereId: parseInt(filiereId),
        statut: 'ACTIF'
      }
    });

    if (existingConfig) {
      return NextResponse.json({
        success: false,
        error: 'Configuration existante',
        message: 'Une configuration active existe déjà pour cette combinaison vague/filière.'
      }, { status: 409 });
    }

    // Créer la configuration
    const nouvelleConfiguration = await prisma.fraisFormation.create({
      data: {
        vagueId,
        filiereId: parseInt(filiereId),
        fraisScolarite: fraisScolariteConverti,
        servicesInclus: servicesInclus || {
          connexionIllimitee: true,
          ordinateurPortable: true,
          materielPedagogique: true,
          accesPlateforme: true,
          supportTechnique: true,
        },
        statut: 'ACTIF'
      },
      include: {
        vague: { select: { nom: true } },
        filiere: { select: { nom: true } }
      }
    });

    // Récupérer le frais d'inscription universel pour le calcul du total
    let FRAIS_INSCRIPTION_UNIVERSEL = 10000;
    try {
      const fraisInscriptionConfig = await prisma.fraisConfiguration.findUnique({
        where: { type: 'INSCRIPTION_UNIVERSEL' }
      });
      FRAIS_INSCRIPTION_UNIVERSEL = fraisInscriptionConfig?.montant || 10000;
    } catch (error) {
      console.warn('Utilisation valeur par défaut pour frais inscription');
    }

    const responseData: FraisFormationData = {
      id: nouvelleConfiguration.id,
      vagueId: nouvelleConfiguration.vagueId,
      vagueName: nouvelleConfiguration.vague.nom,
      filiereId: nouvelleConfiguration.filiereId.toString(),
      filiereName: nouvelleConfiguration.filiere.nom,
      fraisInscription: FRAIS_INSCRIPTION_UNIVERSEL,
      fraisScolarite: nouvelleConfiguration.fraisScolarite,
      servicesInclus: nouvelleConfiguration.servicesInclus as ServicesInclus,
      total: FRAIS_INSCRIPTION_UNIVERSEL + nouvelleConfiguration.fraisScolarite,
      statut: nouvelleConfiguration.statut,
      dateCreation: nouvelleConfiguration.createdAt.toISOString().split('T')[0],
      dateModification: nouvelleConfiguration.updatedAt.toISOString().split('T')[0]
    };

    return NextResponse.json({
      success: true,
      message: 'Configuration créée avec succès',
      data: responseData
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Erreur création:', error);

    if (error.code === 'P2002') {
      return NextResponse.json({
        success: false,
        error: 'Configuration existante',
        message: 'Une configuration existe déjà pour cette combinaison vague/filière.'
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      error: 'Erreur de création',
      message: 'Impossible de créer la configuration.'
    }, { status: 500 });
  }
}

// PUT - Mettre à jour une configuration
export async function PUT(request: Request) {
  try {
    if (!isFraisFormationAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Service indisponible',
        message: 'Le service de mise à jour est temporairement indisponible.'
      }, { status: 503 });
    }

    const body = await request.json();
    const { id, fraisScolarite, servicesInclus, statut } = body;

    console.log('📥 Données de mise à jour reçues:', { id, fraisScolarite, type: typeof fraisScolarite });

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID manquant',
        message: 'L\'identifiant de la configuration est requis.'
      }, { status: 400 });
    }

    // Vérifier que la configuration existe
    const existingConfig = await prisma.fraisFormation.findUnique({
      where: { id },
      include: {
        vague: { select: { nom: true } },
        filiere: { select: { nom: true } }
      }
    });

    if (!existingConfig) {
      return NextResponse.json({
        success: false,
        error: 'Configuration non trouvée',
        message: 'Aucune configuration ne correspond à cet identifiant.'
      }, { status: 404 });
    }

    // Convertir le montant si fourni
    let fraisScolariteConverti = existingConfig.fraisScolarite;
    if (fraisScolarite !== undefined) {
      fraisScolariteConverti = parseMontant(fraisScolarite);
      console.log('💰 Frais scolarité converti pour mise à jour:', fraisScolariteConverti);

      if (fraisScolariteConverti <= 0) {
        return NextResponse.json({
          success: false,
          error: 'Montant invalide',
          message: 'Le montant des frais de scolarité doit être supérieur à 0.'
        }, { status: 400 });
      }
    }

    // Mettre à jour la configuration
    const updatedConfig = await prisma.fraisFormation.update({
      where: { id },
      data: {
        fraisScolarite: fraisScolariteConverti,
        servicesInclus: servicesInclus || existingConfig.servicesInclus,
        statut: statut || existingConfig.statut
      },
      include: {
        vague: { select: { nom: true } },
        filiere: { select: { nom: true } }
      }
    });

    // Récupérer le frais d'inscription universel
    let FRAIS_INSCRIPTION_UNIVERSEL = 10000;
    try {
      const fraisInscriptionConfig = await prisma.fraisConfiguration.findUnique({
        where: { type: 'INSCRIPTION_UNIVERSEL' }
      });
      FRAIS_INSCRIPTION_UNIVERSEL = fraisInscriptionConfig?.montant || 10000;
    } catch (error) {
      console.warn('Utilisation valeur par défaut pour frais inscription');
    }

    const responseData: FraisFormationData = {
      id: updatedConfig.id,
      vagueId: updatedConfig.vagueId,
      vagueName: updatedConfig.vague.nom,
      filiereId: updatedConfig.filiereId.toString(),
      filiereName: updatedConfig.filiere.nom,
      fraisInscription: FRAIS_INSCRIPTION_UNIVERSEL,
      fraisScolarite: updatedConfig.fraisScolarite,
      servicesInclus: updatedConfig.servicesInclus as ServicesInclus,
      total: FRAIS_INSCRIPTION_UNIVERSEL + updatedConfig.fraisScolarite,
      statut: updatedConfig.statut,
      dateCreation: updatedConfig.createdAt.toISOString().split('T')[0],
      dateModification: updatedConfig.updatedAt.toISOString().split('T')[0]
    };

    return NextResponse.json({
      success: true,
      message: 'Configuration mise à jour avec succès',
      data: responseData
    });

  } catch (error: any) {
    console.error('❌ Erreur mise à jour:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur de mise à jour',
      message: 'Impossible de mettre à jour la configuration.'
    }, { status: 500 });
  }
}

// DELETE - Supprimer une configuration
export async function DELETE(request: Request) {
  try {
    if (!isFraisFormationAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Service indisponible',
        message: 'Le service de suppression est temporairement indisponible.'
      }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID manquant',
        message: 'L\'identifiant de la configuration est requis.'
      }, { status: 400 });
    }

    // Vérifier que la configuration existe
    const existingConfig = await prisma.fraisFormation.findUnique({
      where: { id }
    });

    if (!existingConfig) {
      return NextResponse.json({
        success: false,
        error: 'Configuration non trouvée',
        message: 'Aucune configuration ne correspond à cet identifiant.'
      }, { status: 404 });
    }

    // Supprimer la configuration
    await prisma.fraisFormation.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Configuration supprimée avec succès',
      data: { id }
    });

  } catch (error: any) {
    console.error('❌ Erreur suppression:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur de suppression',
      message: 'Impossible de supprimer la configuration.'
    }, { status: 500 });
  }
}

// PATCH - Récupérer le frais d'inscription universel
export async function PATCH() {
  try {
    const fraisInscription = await prisma.fraisConfiguration.findUnique({
      where: { type: 'INSCRIPTION_UNIVERSEL' }
    });

    return NextResponse.json({
      success: true,
      data: {
        montant: fraisInscription?.montant || 10000,
        description: fraisInscription?.description || 'Frais d\'inscription universel',
        derniereModification: fraisInscription?.updatedAt || new Date().toISOString()
      },
      message: 'Frais d\'inscription récupéré'
    });

  } catch (error) {
    console.error('❌ Erreur frais inscription:', error);
    return NextResponse.json({
      success: true,
      data: {
        montant: 10000,
        description: 'Frais d\'inscription universel (valeur par défaut)',
        derniereModification: new Date().toISOString()
      },
      message: 'Valeur par défaut utilisée'
    });
  }
}