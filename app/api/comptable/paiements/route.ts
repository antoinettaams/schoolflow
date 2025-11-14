// app/api/comptable/paiements/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Types
interface PaymentData {
  id?: string;
  studentId: string;
  type: 'inscription' | 'scolarite' | 'cantine' | 'activites';
  montant: number;
  methode: 'especes' | 'cheque' | 'virement' | 'mobile_money';
  statut: 'en_attente' | 'approuve' | 'rejete' | 'saisi_manuel';
  datePaiement: string;
  reference: string;
  notes?: string;
  semester?: string;
  description: string;
  banque?: string;
  numeroCheque?: string;
  numeroCompte?: string;
  operateurMobile?: string;
  numeroTelephone?: string;
}

interface StudentPaymentSummary {
  id: string;
  name: string;
  filiere: string;
  vague: string;
  parentName: string;
  registrationFee: number;
  tuitionFee: number;
  paidAmount: number;
  remainingAmount: number;
  totalSchoolFees: number;
  paidSemesters: string[];
  pendingSemesters: string[];
  currentSemester: string;
}

// Fonction pour obtenir un utilisateur COMPTABLE valide
async function getComptableUserId(): Promise<string> {
  try {
    // Chercher d'abord un utilisateur COMPTABLE existant
    const comptableUser = await prisma.user.findFirst({
      where: {
        role: 'COMPTABLE',
        isActive: true
      },
      select: { id: true }
    });

    if (comptableUser) {
      console.log('✅ Utilisateur comptable trouvé:', comptableUser.id);
      return comptableUser.id;
    }

    // Si aucun comptable n'existe, chercher un ADMIN
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
        isActive: true
      },
      select: { id: true }
    });

    if (adminUser) {
      console.log('✅ Utilisateur admin trouvé:', adminUser.id);
      return adminUser.id;
    }

    // Si aucun utilisateur approprié n'existe, créer un utilisateur système
    console.log('⚠️ Aucun utilisateur trouvé, création utilisateur système...');
    const systemUser = await prisma.user.create({
      data: {
        clerkUserId: `system_comptable_${Date.now()}`,
        email: `system-comptable-${Date.now()}@schoolflow.com`,
        role: 'COMPTABLE',
        firstName: 'Système',
        lastName: 'Comptable',
        isActive: true
      }
    });

    console.log('✅ Utilisateur système créé:', systemUser.id);
    return systemUser.id;

  } catch (error) {
    console.error('❌ Erreur récupération utilisateur:', error);
    throw new Error('Impossible de trouver un utilisateur valide pour créer le paiement');
  }
}

// FONCTION CORRIGÉE : Mettre à jour le statut de l'inscription et les frais payés
async function updateInscriptionStatus(inscriptionId: string) {
  try {
    console.log(`🔄 Mise à jour statut inscription: ${inscriptionId}`);
    
    const inscription = await prisma.inscription.findUnique({
      where: { id: inscriptionId },
      include: {
        paiements: {
          where: {
            reference: {
              contains: 'APP' // Seulement les paiements approuvés
            }
          }
        },
        filiere: true,
        vague: true
      }
    });

    if (!inscription) {
      console.log('❌ Inscription non trouvée:', inscriptionId);
      return;
    }

    // Récupérer les frais réels
    const fraisConfig = await getFraisConfiguration(inscription.filiereId, inscription.vagueId);
    const fraisInscription = fraisConfig.fraisInscription;
    const fraisScolarite = fraisConfig.fraisScolarite;
    const totalFrais = fraisInscription + fraisScolarite;

    // Calculer le total payé (seulement les paiements approuvés)
    const totalPaye = inscription.paiements.reduce((sum, p) => sum + p.montant, 0);

    console.log(`💰 Calcul frais pour ${inscription.prenom} ${inscription.nom}:`);
    console.log(`   - Frais inscription: ${fraisInscription} FCFA`);
    console.log(`   - Frais scolarité: ${fraisScolarite} FCFA`);
    console.log(`   - Total frais: ${totalFrais} FCFA`);
    console.log(`   - Total payé (approuvé): ${totalPaye} FCFA`);

    // Déterminer le nouveau statut
    let nouveauStatut = inscription.statut;

    if (totalPaye >= totalFrais) {
      nouveauStatut = 'PAYE_COMPLET';
      console.log(`   → Statut: PAYE_COMPLET (total payé >= total frais)`);
    } else if (totalPaye > 0) {
      nouveauStatut = 'PAYE_PARTIEL';
      console.log(`   → Statut: PAYE_PARTIEL (payé > 0 mais pas complet)`);
    } else {
      nouveauStatut = 'APPROUVE';
      console.log(`   → Statut: APPROUVE (aucun paiement)`);
    }

    // Mettre à jour l'inscription avec les NOUVELLES valeurs
    const updatedInscription = await prisma.inscription.update({
      where: { id: inscriptionId },
      data: {
        statut: nouveauStatut,
        fraisPayes: totalPaye, // METTRE À JOUR les frais payés
        fraisInscription: fraisInscription // S'assurer que les frais sont à jour
      }
    });

    console.log(`✅ Inscription ${inscriptionId} mise à jour:`);
    console.log(`   - Nouveau statut: ${nouveauStatut}`);
    console.log(`   - Frais payés: ${totalPaye} FCFA`);
    console.log(`   - Frais inscription: ${fraisInscription} FCFA`);

    return updatedInscription;

  } catch (error) {
    console.error('❌ Erreur mise à jour statut inscription:', error);
    throw error;
  }
}

// GET - Récupérer tous les paiements avec filtres
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const statut = searchParams.get('statut');
    const type = searchParams.get('type');
    const studentId = searchParams.get('studentId');

    console.log('🔍 Récupération des paiements avec filtres:', { id, statut, type, studentId });

    // Si un ID spécifique est demandé
    if (id) {
      const payment = await prisma.paiement.findUnique({
        where: { id },
        include: {
          inscription: {
            include: {
              filiere: { select: { nom: true } },
              vague: { select: { nom: true } }
            }
          },
          createdBy: { select: { firstName: true, lastName: true } }
        }
      });

      if (!payment) {
        return NextResponse.json({
          success: false,
          error: 'Paiement non trouvé',
          message: 'Aucun paiement ne correspond à cet identifiant.'
        }, { status: 404 });
      }

      const formattedPayment = {
        id: payment.id,
        studentId: payment.inscriptionId,
        studentName: `${payment.inscription.prenom} ${payment.inscription.nom}`,
        parentName: payment.inscription.nom,
        filiere: payment.inscription.filiere?.nom || 'Non assigné',
        vague: payment.inscription.vague?.nom || 'Non assigné',
        montant: payment.montant,
        type: mapPaymentType(payment.modePaiement),
        methode: payment.modePaiement as any,
        statut: mapPaymentStatus(payment),
        datePaiement: payment.datePaiement.toISOString().split('T')[0],
        reference: payment.reference || `REF-${payment.id}`,
        notes: payment.reference,
        description: `Paiement ${mapPaymentType(payment.modePaiement)} - ${payment.inscription.nom}`,
        createdBy: payment.createdBy ? 
          `${payment.createdBy.firstName} ${payment.createdBy.lastName}` : 
          'Système'
      };

      return NextResponse.json({
        success: true,
        data: formattedPayment,
        message: 'Paiement récupéré avec succès'
      });
    }

    // Construire les filtres
    const where: any = {};
    
    if (statut && statut !== 'all') {
      if (statut === 'en_attente') {
        where.reference = { contains: 'MAN' };
      } else if (statut === 'approuve') {
        where.reference = { contains: 'APP' };
      } else if (statut === 'rejete') {
        where.reference = { contains: 'REJ' };
      } else if (statut === 'saisi_manuel') {
        where.reference = { contains: 'MAN' };
      }
    }

    if (type && type !== 'all') {
      where.modePaiement = type;
    }

    if (studentId) {
      where.inscriptionId = studentId;
    }

    // Récupérer les paiements
    const payments = await prisma.paiement.findMany({
      where,
      include: {
        inscription: {
          include: {
            filiere: { select: { nom: true } },
            vague: { select: { nom: true } }
          }
        },
        createdBy: { select: { firstName: true, lastName: true } }
      },
      orderBy: { datePaiement: 'desc' }
    });

    // Formater les paiements
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      studentId: payment.inscriptionId,
      studentName: `${payment.inscription.prenom} ${payment.inscription.nom}`,
      parentName: payment.inscription.nom,
      filiere: payment.inscription.filiere?.nom || 'Non assigné',
      vague: payment.inscription.vague?.nom || 'Non assigné',
      montant: payment.montant,
      type: mapPaymentType(payment.modePaiement),
      methode: payment.modePaiement as any,
      statut: mapPaymentStatus(payment),
      datePaiement: payment.datePaiement.toISOString().split('T')[0],
      reference: payment.reference || `REF-${payment.id}`,
      notes: payment.reference,
      description: `Paiement ${mapPaymentType(payment.modePaiement)} - ${payment.inscription.nom}`,
      createdBy: payment.createdBy ? 
        `${payment.createdBy.firstName} ${payment.createdBy.lastName}` : 
        'Système'
    }));

    // Statistiques
    const stats = {
      totalEnAttente: formattedPayments.filter(p => p.statut === 'en_attente').length,
      totalApprouves: formattedPayments.filter(p => p.statut === 'approuve').length,
      totalMontantEnAttente: formattedPayments.filter(p => p.statut === 'en_attente').reduce((sum, p) => sum + p.montant, 0),
      totalMontantApprouve: formattedPayments.filter(p => p.statut === 'approuve').reduce((sum, p) => sum + p.montant, 0)
    };

    return NextResponse.json({
      success: true,
      data: formattedPayments,
      metadata: {
        total: formattedPayments.length,
        stats
      },
      message: `${formattedPayments.length} paiement(s) récupéré(s) avec succès`
    });

  } catch (error) {
    console.error('❌ Erreur récupération paiements:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur de chargement',
      message: 'Impossible de charger les paiements.',
      data: []
    }, { status: 500 });
  }
}

// POST - Créer un nouveau paiement (saisie manuelle) - CORRIGÉ
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      studentId,
      type,
      montant,
      methode,
      date,
      reference,
      notes,
      semester,
      description,
      banque,
      numeroCheque,
      numeroCompte,
      operateurMobile,
      numeroTelephone
    } = body;

    console.log('📥 Création paiement manuel:', body);

    // Validation des champs obligatoires
    if (!studentId || !montant || !methode || !date) {
      return NextResponse.json({
        success: false,
        error: 'Données incomplètes',
        message: 'Veuillez remplir tous les champs obligatoires.'
      }, { status: 400 });
    }

    // Vérifier que l'inscription existe AVEC les bonnes relations
    const inscription = await prisma.inscription.findUnique({
      where: { id: studentId },
      include: {
        filiere: true,
        vague: true,
        paiements: {
          where: {
            reference: {
              contains: 'APP' // Seulement les paiements approuvés
            }
          }
        }
      }
    });

    if (!inscription) {
      console.error('❌ Élève non trouvé avec ID:', studentId);
      return NextResponse.json({
        success: false,
        error: 'Élève non trouvé',
        message: 'Aucune inscription ne correspond à cet identifiant.'
      }, { status: 404 });
    }

    console.log('✅ Élève trouvé:', `${inscription.prenom} ${inscription.nom}`);
    console.log(`💰 Situation actuelle: ${inscription.fraisPayes} FCFA payés sur ${inscription.fraisInscription} FCFA`);

    // VÉRIFICATION: Si l'étudiant a déjà payé l'inscription, empêcher un nouveau paiement
    if (type === 'inscription') {
      const fraisConfig = await getFraisConfiguration(inscription.filiereId, inscription.vagueId);
      const hasAlreadyPaidInscription = inscription.fraisPayes >= fraisConfig.fraisInscription;

      if (hasAlreadyPaidInscription) {
        return NextResponse.json({
          success: false,
          error: 'Paiement déjà effectué',
          message: 'Cet étudiant a déjà payé ses frais d\'inscription.'
        }, { status: 400 });
      }
    }

    // CORRECTION: Obtenir un ID utilisateur valide
    let createdById: string;
    try {
      createdById = await getComptableUserId();
      console.log('✅ ID utilisateur pour createdById:', createdById);
    } catch (userError) {
      console.error('❌ Erreur récupération utilisateur:', userError);
      return NextResponse.json({
        success: false,
        error: 'Erreur système',
        message: 'Impossible de trouver un utilisateur valide pour créer le paiement.'
      }, { status: 500 });
    }

    // Générer une référence si non fournie
    const paymentReference = reference || `MAN-${type.toUpperCase().substring(0, 3)}-${Date.now()}`;

    // Créer le paiement avec l'ID utilisateur valide
    const nouveauPaiement = await prisma.paiement.create({
      data: {
        inscriptionId: studentId,
        montant: parseInt(montant.toString()),
        datePaiement: new Date(date),
        modePaiement: methode,
        reference: paymentReference,
        createdById: createdById
      },
      include: {
        inscription: {
          include: {
            filiere: { select: { nom: true } },
            vague: { select: { nom: true } }
          }
        },
        createdBy: { select: { firstName: true, lastName: true } }
      }
    });

    // Formater la réponse
    const formattedPayment = {
      id: nouveauPaiement.id,
      studentId: studentId,
      studentName: `${inscription.prenom} ${inscription.nom}`,
      parentName: inscription.nom,
      filiere: inscription.filiere?.nom || 'Non assigné',
      vague: inscription.vague?.nom || 'Non assigné',
      montant: nouveauPaiement.montant,
      type: type as any,
      methode: methode as any,
      statut: 'saisi_manuel' as const,
      datePaiement: nouveauPaiement.datePaiement.toISOString().split('T')[0],
      reference: nouveauPaiement.reference,
      notes: notes,
      semester: semester,
      description: description || `Paiement ${type} - ${inscription.prenom} ${inscription.nom}`,
      createdBy: nouveauPaiement.createdBy ? 
        `${nouveauPaiement.createdBy.firstName} ${nouveauPaiement.createdBy.lastName}` : 
        'Système'
    };

    console.log('✅ Paiement créé, mise à jour du statut de l\'inscription...');

    // METTRE À JOUR le statut de l'inscription IMMÉDIATEMENT
    await updateInscriptionStatus(inscription.id);

    return NextResponse.json({
      success: true,
      data: formattedPayment,
      message: 'Paiement enregistré avec succès'
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Erreur création paiement:', error);

    if (error.code === 'P2003') {
      if (error.meta?.field_name?.includes('createdById')) {
        return NextResponse.json({
          success: false,
          error: 'Erreur utilisateur',
          message: 'Problème avec l\'utilisateur créateur du paiement.'
        }, { status: 500 });
      }
      return NextResponse.json({
        success: false,
        error: 'Élève non trouvé',
        message: 'L\'élève spécifié n\'existe pas.'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: false,
      error: 'Erreur de création',
      message: 'Impossible de créer le paiement.'
    }, { status: 500 });
  }
}

// PUT - Mettre à jour un paiement (approbation/rejet) - CORRIGÉ
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({
        success: false,
        error: 'Données incomplètes',
        message: 'ID et action sont requis.'
      }, { status: 400 });
    }

    // Vérifier que le paiement existe
    const paiement = await prisma.paiement.findUnique({
      where: { id },
      include: {
        inscription: {
          include: {
            filiere: { select: { nom: true } },
            vague: { select: { nom: true } }
          }
        }
      }
    });

    if (!paiement) {
      return NextResponse.json({
        success: false,
        error: 'Paiement non trouvé',
        message: 'Aucun paiement ne correspond à cet identifiant.'
      }, { status: 404 });
    }

    let newReference = '';

    if (action === 'approve') {
      newReference = `APP-${paiement.reference?.replace('MAN-', '') || paiement.id}`;
    } else if (action === 'reject') {
      newReference = `REJ-${paiement.reference?.replace('MAN-', '') || paiement.id}`;
    } else {
      return NextResponse.json({
        success: false,
        error: 'Action invalide',
        message: 'L\'action doit être "approve" ou "reject".'
      }, { status: 400 });
    }

    // Mettre à jour le paiement
    const updatedPayment = await prisma.paiement.update({
      where: { id },
      data: {
        reference: newReference
      },
      include: {
        inscription: {
          include: {
            filiere: { select: { nom: true } },
            vague: { select: { nom: true } }
          }
        },
        createdBy: { select: { firstName: true, lastName: true } }
      }
    });

    console.log(`✅ Paiement ${action === 'approve' ? 'approuvé' : 'rejeté'}, mise à jour statut inscription...`);

    // METTRE À JOUR le statut de l'inscription APRÈS approbation/rejet
    if (action === 'approve' || action === 'reject') {
      await updateInscriptionStatus(updatedPayment.inscriptionId);
    }

    // Formater la réponse
    const formattedPayment = {
      id: updatedPayment.id,
      studentId: updatedPayment.inscriptionId,
      studentName: `${updatedPayment.inscription.prenom} ${updatedPayment.inscription.nom}`,
      parentName: updatedPayment.inscription.nom,
      filiere: updatedPayment.inscription.filiere?.nom || 'Non assigné',
      vague: updatedPayment.inscription.vague?.nom || 'Non assigné',
      montant: updatedPayment.montant,
      type: mapPaymentType(updatedPayment.modePaiement),
      methode: updatedPayment.modePaiement as any,
      statut: action === 'approve' ? 'approuve' : 'rejete',
      datePaiement: updatedPayment.datePaiement.toISOString().split('T')[0],
      reference: updatedPayment.reference,
      description: `Paiement ${mapPaymentType(updatedPayment.modePaiement)} - ${updatedPayment.inscription.nom}`,
      createdBy: updatedPayment.createdBy ? 
        `${updatedPayment.createdBy.firstName} ${updatedPayment.createdBy.lastName}` : 
        'Système'
    };

    return NextResponse.json({
      success: true,
      data: formattedPayment,
      message: `Paiement ${action === 'approve' ? 'approuvé' : 'rejeté'} avec succès`
    });

  } catch (error: any) {
    console.error('❌ Erreur mise à jour paiement:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur de mise à jour',
      message: 'Impossible de mettre à jour le paiement.'
    }, { status: 500 });
  }
}

// PATCH - Récupérer les inscriptions (étudiants) - CORRIGÉ
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    console.log('🔍 Récupération des inscriptions:', { studentId });

    if (studentId) {
      // Une inscription spécifique
      const inscription = await prisma.inscription.findUnique({
        where: { id: studentId },
        include: {
          filiere: true,
          vague: true,
          paiements: {
            where: {
              reference: {
                contains: 'APP' // Seulement les paiements approuvés
              }
            }
          }
        }
      });

      if (!inscription) {
        return NextResponse.json({
          success: false,
          error: 'Inscription non trouvée',
          message: 'Aucune inscription ne correspond à cet identifiant.'
        }, { status: 404 });
      }

      const studentSummary = await getInscriptionPaymentSummary(inscription);

      return NextResponse.json({
        success: true,
        data: studentSummary,
        message: 'Inscription récupérée avec succès'
      });
    } else {
      // Toutes les inscriptions
      const inscriptions = await prisma.inscription.findMany({
        where: {
          statut: {
            in: ['APPROUVE', 'PAYE_PARTIEL', 'PAYE_COMPLET']
          }
        },
        include: {
          filiere: true,
          vague: true,
          paiements: {
            where: {
              reference: {
                contains: 'APP' // Seulement les paiements approuvés
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`📊 ${inscriptions.length} inscription(s) trouvée(s)`);

      if (inscriptions.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'Aucune inscription trouvée dans la base de données'
        });
      }

      const studentsSummary = await Promise.all(
        inscriptions.map(inscription => getInscriptionPaymentSummary(inscription))
      );

      console.log(`✅ ${studentsSummary.length} inscription(s) traitée(s)`);

      return NextResponse.json({
        success: true,
        data: studentsSummary,
        message: `${studentsSummary.length} inscription(s) récupérée(s) avec succès`
      });
    }

  } catch (error) {
    console.error('❌ Erreur récupération inscriptions:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur de chargement',
      message: 'Impossible de charger les inscriptions.',
      data: []
    }, { status: 500 });
  }
}

// Fonction pour le résumé d'inscription - CORRIGÉE
async function getInscriptionPaymentSummary(inscription: any): Promise<StudentPaymentSummary> {
  try {
    // Récupérer les frais RÉELS pour cette filière et vague
    const fraisConfig = await getFraisConfiguration(inscription.filiereId, inscription.vagueId);
    const fraisInscription = fraisConfig.fraisInscription;
    const fraisScolarite = fraisConfig.fraisScolarite;
    
    // Total des frais
    const totalFrais = fraisInscription + fraisScolarite;

    // Utiliser les frais payés DIRECTEMENT depuis l'inscription (qui sont maintenant mis à jour)
    const totalPaye = inscription.fraisPayes || 0;

    // Calcul des semestres payés
    const semestres = ['Semestre 1', 'Semestre 2', 'Semestre 3'];
    const montantParSemestre = Math.round(fraisScolarite / 3);
    
    let paidSemesters: string[] = [];
    let pendingSemesters: string[] = [...semestres];
    
    const montantInscriptionPaye = Math.min(totalPaye, fraisInscription);
    const montantScolaritePaye = Math.max(0, totalPaye - fraisInscription);
    
    if (montantScolaritePaye > 0) {
      const semestresPayes = Math.floor(montantScolaritePaye / montantParSemestre);
      paidSemesters = semestres.slice(0, semestresPayes);
      pendingSemesters = semestres.slice(semestresPayes);
    }

    const remainingAmount = Math.max(0, totalFrais - totalPaye);

    console.log(`💰 Inscription ${inscription.prenom} ${inscription.nom}:`);
    console.log(`   - Filière: ${inscription.filiere?.nom}`);
    console.log(`   - Vague: ${inscription.vague?.nom}`);
    console.log(`   - Frais inscription: ${fraisInscription} FCFA`);
    console.log(`   - Frais scolarité: ${fraisScolarite} FCFA`);
    console.log(`   - Total frais: ${totalFrais} FCFA`);
    console.log(`   - Total payé: ${totalPaye} FCFA`);
    console.log(`   - Reste à payer: ${remainingAmount} FCFA`);
    console.log(`   - Semestres payés: ${paidSemesters.join(', ')}`);
    console.log(`   - Semestres en attente: ${pendingSemesters.join(', ')}`);

    return {
      id: inscription.id,
      name: `${inscription.prenom} ${inscription.nom}`,
      filiere: inscription.filiere?.nom || 'Non assigné',
      vague: inscription.vague?.nom || 'Non assigné',
      parentName: inscription.nom,
      registrationFee: fraisInscription,
      tuitionFee: fraisScolarite,
      paidAmount: totalPaye, // Utilise les frais payés de l'inscription
      remainingAmount: remainingAmount,
      totalSchoolFees: totalFrais,
      paidSemesters,
      pendingSemesters,
      currentSemester: pendingSemesters[0] || 'Terminé'
    };
  } catch (error) {
    console.error('❌ Erreur calcul résumé inscription pour:', inscription.id, error);
    // En cas d'erreur, retourner un résumé basé uniquement sur les données disponibles
    return {
      id: inscription.id,
      name: `${inscription.prenom} ${inscription.nom}`,
      filiere: inscription.filiere?.nom || 'Non assigné',
      vague: inscription.vague?.nom || 'Non assigné',
      parentName: inscription.nom,
      registrationFee: 50000,
      tuitionFee: 885000,
      paidAmount: inscription.fraisPayes || 0, // Toujours utiliser fraisPayes
      remainingAmount: 935000 - (inscription.fraisPayes || 0),
      totalSchoolFees: 935000,
      paidSemesters: [],
      pendingSemesters: ['Semestre 1', 'Semestre 2', 'Semestre 3'],
      currentSemester: 'Semestre 1'
    };
  }
}

// Fonction améliorée pour récupérer les frais RÉELS
async function getFraisConfiguration(filiereId: number | null, vagueId: string | null) {
  console.log(`🔍 Récupération frais pour filière: ${filiereId}, vague: ${vagueId}`);

  // Valeurs par défaut réalistes
  let fraisInscription = 50000;
  let fraisScolarite = 885000;

  try {
    // 1. Récupérer le frais d'inscription universel RÉEL
    const fraisInscriptionConfig = await prisma.fraisConfiguration.findUnique({
      where: { type: 'INSCRIPTION_UNIVERSEL' as any }
    });

    if (fraisInscriptionConfig) {
      fraisInscription = fraisInscriptionConfig.montant;
      console.log(`✅ Frais inscription récupéré: ${fraisInscription} FCFA`);
    } else {
      console.log('⚠️ Frais inscription non trouvé, utilisation valeur par défaut: 50,000 FCFA');
    }

    // 2. Récupérer les frais de scolarité RÉELS depuis FraisFormation
    if (filiereId && vagueId) {
      const fraisFormation = await prisma.fraisFormation.findFirst({
        where: {
          filiereId: filiereId,
          vagueId: vagueId,
          statut: 'ACTIF'
        }
      });

      if (fraisFormation) {
        fraisScolarite = fraisFormation.fraisScolarite;
        console.log(`✅ Frais scolarité récupéré: ${fraisScolarite} FCFA pour filière ${filiereId}, vague ${vagueId}`);
      } else {
        console.log(`⚠️ Frais formation non trouvé pour filière ${filiereId}, vague ${vagueId}`);
        console.log(`ℹ️ Utilisation frais scolarité par défaut: ${fraisScolarite} FCFA`);
      }
    } else {
      console.log('❌ FilièreId ou vagueId manquant pour récupérer les frais de scolarité');
    }

    console.log(`💰 Configuration frais finale:`);
    console.log(`   - Inscription: ${fraisInscription} FCFA`);
    console.log(`   - Scolarité: ${fraisScolarite} FCFA`);
    console.log(`   - Total: ${fraisInscription + fraisScolarite} FCFA`);
    
    return {
      fraisInscription,
      fraisScolarite
    };
    
  } catch (error) {
    console.error('❌ Erreur récupération frais réels:', error);
    return {
      fraisInscription: 50000,
      fraisScolarite: 885000
    };
  }
}

// Fonctions utilitaires pour le mapping
function mapPaymentType(methode: string): 'inscription' | 'scolarite' | 'cantine' | 'activites' {
  // Logique de mapping selon votre business
  if (methode.includes('inscription')) return 'inscription';
  if (methode.includes('scolarite')) return 'scolarite';
  if (methode.includes('cantine')) return 'cantine';
  return 'activites';
}

function mapPaymentStatus(payment: any): 'en_attente' | 'approuve' | 'rejete' | 'saisi_manuel' {
  // Logique de détermination du statut selon votre business
  if (payment.reference?.startsWith('MAN-')) return 'en_attente';
  if (payment.reference?.startsWith('APP-')) return 'approuve';
  if (payment.reference?.startsWith('REJ-')) return 'rejete';
  return 'saisi_manuel';
}

// Handler pour les méthodes non autorisées
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, PUT, PATCH, OPTIONS',
    },
  });
}