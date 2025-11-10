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
        createdBy: `${payment.createdBy.firstName} ${payment.createdBy.lastName}`
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
      createdBy: `${payment.createdBy.firstName} ${payment.createdBy.lastName}`
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

// POST - Créer un nouveau paiement (saisie manuelle)
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
      description
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

    // Vérifier que l'étudiant existe dans le modèle Student
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        filiere: true,
        vague: true
      }
    });

    if (!student) {
      return NextResponse.json({
        success: false,
        error: 'Élève non trouvé',
        message: 'Aucun étudiant ne correspond à cet identifiant.'
      }, { status: 404 });
    }

    // Récupérer les frais réels pour cette filière et vague
    const fraisConfig = await getFraisConfiguration(student.filiereId, student.vagueId);
    
    // Générer une référence si non fournie
    const paymentReference = reference || `${type.toUpperCase().substring(0, 3)}-${Date.now()}`;

    // Créer ou trouver une inscription pour cet étudiant
    let inscriptionId = studentId;
    
    const existingInscription = await prisma.inscription.findFirst({
      where: { 
        OR: [
          { email: student.user.email },
          { 
            AND: [
              { nom: student.user.lastName },
              { prenom: student.user.firstName }
            ]
          }
        ]
      }
    });

    if (existingInscription) {
      inscriptionId = existingInscription.id;
      console.log(`✅ Inscription existante trouvée: ${inscriptionId}`);
    } else {
      // Créer une inscription automatiquement avec les frais réels
      const nouvelleInscription = await prisma.inscription.create({
        data: {
          nom: student.user.lastName,
          prenom: student.user.firstName,
          email: student.user.email,
          telephone: student.user.phone || '',
          fraisInscription: fraisConfig.fraisInscription,
          filiereId: student.filiereId,
          vagueId: student.vagueId,
          statut: 'APPROUVE',
          createdById: 'default-user-id'
        }
      });
      inscriptionId = nouvelleInscription.id;
      console.log(`✅ Nouvelle inscription créée: ${inscriptionId}`);
    }

    // Créer le paiement
    const nouveauPaiement = await prisma.paiement.create({
      data: {
        inscriptionId: inscriptionId,
        montant: parseInt(montant.toString()),
        datePaiement: new Date(date),
        modePaiement: methode,
        reference: paymentReference,
        createdById: 'default-user-id'
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
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      parentName: student.user.lastName,
      filiere: student.filiere?.nom || 'Non assigné',
      vague: student.vague?.nom || 'Non assigné',
      montant: nouveauPaiement.montant,
      type: type as any,
      methode: methode as any,
      statut: 'saisi_manuel' as const,
      datePaiement: nouveauPaiement.datePaiement.toISOString().split('T')[0],
      reference: nouveauPaiement.reference,
      notes: notes,
      semester: semester,
      description: description || `Paiement ${type} - ${student.user.firstName} ${student.user.lastName}`,
      createdBy: `${nouveauPaiement.createdBy.firstName} ${nouveauPaiement.createdBy.lastName}`
    };

    return NextResponse.json({
      success: true,
      data: formattedPayment,
      message: 'Paiement enregistré avec succès'
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Erreur création paiement:', error);

    if (error.code === 'P2003') {
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

// PUT - Mettre à jour un paiement (approbation/rejet)
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

    let updatedPayment;
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
    updatedPayment = await prisma.paiement.update({
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
      createdBy: `${updatedPayment.createdBy.firstName} ${updatedPayment.createdBy.lastName}`
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

// PATCH - Récupérer le résumé des étudiants RÉELS depuis le modèle Student
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    console.log('🔍 Récupération des étudiants réels depuis le modèle Student:', { studentId });

    if (studentId) {
      // Résumé d'un étudiant spécifique
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          filiere: true,
          vague: true,
        }
      });

      if (!student) {
        return NextResponse.json({
          success: false,
          error: 'Élève non trouvé',
          message: 'Aucun étudiant ne correspond à cet identifiant.'
        }, { status: 404 });
      }

      const studentSummary = await getStudentPaymentSummary(student);

      return NextResponse.json({
        success: true,
        data: studentSummary,
        message: 'Résumé étudiant récupéré avec succès'
      });
    } else {
      // Résumé de TOUS les étudiants existants dans le modèle Student
      const students = await prisma.student.findMany({
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          filiere: true,
          vague: true,
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`📊 ${students.length} étudiant(s) réel(s) trouvé(s) dans le modèle Student`);

      if (students.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'Aucun étudiant trouvé dans la base de données'
        });
      }

      const studentsSummary = await Promise.all(
        students.map(student => getStudentPaymentSummary(student))
      );

      console.log(`✅ ${studentsSummary.length} étudiant(s) réel(s) traité(s)`);

      return NextResponse.json({
        success: true,
        data: studentsSummary,
        message: `${studentsSummary.length} étudiant(s) réel(s) récupéré(s) avec succès`
      });
    }

  } catch (error) {
    console.error('❌ Erreur résumé étudiants:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur de chargement',
      message: 'Impossible de charger les étudiants depuis la base de données.',
      data: []
    }, { status: 500 });
  }
}

// Fonction pour le résumé étudiant avec données RÉELLES depuis le modèle Student
async function getStudentPaymentSummary(student: any): Promise<StudentPaymentSummary> {
  try {
    // Récupérer les frais RÉELS pour cette filière et vague
    const fraisConfig = await getFraisConfiguration(student.filiereId, student.vagueId);
    const fraisInscription = fraisConfig.fraisInscription;
    const fraisScolarite = fraisConfig.fraisScolarite;
    
    // CORRECTION : Le total des frais est seulement inscription + scolarité
    const totalFrais = fraisInscription + fraisScolarite;

    // Récupérer TOUS les paiements pour cet étudiant
    const inscriptionsEtudiant = await prisma.inscription.findMany({
      where: {
        OR: [
          { email: student.user.email },
          { 
            AND: [
              { nom: student.user.lastName },
              { prenom: student.user.firstName }
            ]
          }
        ]
      },
      include: {
        paiements: true
      }
    });

    // Calculer le total payé depuis tous les paiements
    let totalPaye = 0;
    inscriptionsEtudiant.forEach(inscription => {
      totalPaye += inscription.paiements.reduce((sum: number, p: any) => sum + p.montant, 0);
    });

    // CORRECTION : Calcul des semestres payés - SEULEMENT pour la scolarité
    const semestres = ['Semestre 1', 'Semestre 2', 'Semestre 3'];
    const montantParSemestre = Math.round(fraisScolarite / 3);
    
    let paidSemesters: string[] = [];
    let pendingSemesters: string[] = [...semestres];
    
    // CORRECTION : Calcul plus précis des semestres payés
    // On sépare l'inscription de la scolarité
    const montantInscriptionPaye = Math.min(totalPaye, fraisInscription);
    const montantScolaritePaye = Math.max(0, totalPaye - fraisInscription);
    
    if (montantScolaritePaye > 0) {
      const semestresPayes = Math.floor(montantScolaritePaye / montantParSemestre);
      paidSemesters = semestres.slice(0, semestresPayes);
      pendingSemesters = semestres.slice(semestresPayes);
    }

    const remainingAmount = Math.max(0, totalFrais - totalPaye);

    console.log(`💰 Étudiant ${student.user.firstName} ${student.user.lastName}:`);
    console.log(`   - Filière: ${student.filiere?.nom}`);
    console.log(`   - Vague: ${student.vague?.nom}`);
    console.log(`   - Frais inscription: ${fraisInscription} FCFA`);
    console.log(`   - Frais scolarité: ${fraisScolarite} FCFA`);
    console.log(`   - Total frais: ${totalFrais} FCFA`);
    console.log(`   - Total payé: ${totalPaye} FCFA`);
    console.log(`   - Reste à payer: ${remainingAmount} FCFA`);
    console.log(`   - Semestres payés: ${paidSemesters.join(', ')}`);
    console.log(`   - Semestres en attente: ${pendingSemesters.join(', ')}`);

    return {
      id: student.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
      filiere: student.filiere?.nom || 'Non assigné',
      vague: student.vague?.nom || 'Non assigné',
      parentName: student.user.lastName,
      registrationFee: fraisInscription,
      tuitionFee: fraisScolarite,
      paidAmount: totalPaye,
      remainingAmount: remainingAmount,
      totalSchoolFees: totalFrais,
      paidSemesters,
      pendingSemesters,
      currentSemester: pendingSemesters[0] || 'Terminé'
    };
  } catch (error) {
    console.error('❌ Erreur calcul résumé étudiant pour:', student.id, error);
    // En cas d'erreur, retourner un résumé basé uniquement sur les données disponibles
    return {
      id: student.id,
      name: `${student.user.firstName} ${student.user.lastName}`,
      filiere: student.filiere?.nom || 'Non assigné',
      vague: student.vague?.nom || 'Non assigné',
      parentName: student.user.lastName,
      registrationFee: 50000,
      tuitionFee: 885000,
      paidAmount: 0,
      remainingAmount: 935000,
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
      where: { type: 'INSCRIPTION_UNIVERSEL' }
    });

    if (fraisInscriptionConfig) {
      fraisInscription = fraisInscriptionConfig.montant;
      console.log(`✅ Frais inscription récupéré: ${fraisInscription} FCFA`);
    } else {
      console.log('⚠️ Frais inscription non trouvé, utilisation valeur par défaut: 50,000 FCFA');
      
      // Essayer de récupérer depuis une autre source si disponible
      const autreFraisConfig = await prisma.fraisConfiguration.findFirst({
        where: {
          type: { contains: 'INSCRIPTION' }
        }
      });
      
      if (autreFraisConfig) {
        fraisInscription = autreFraisConfig.montant;
        console.log(`✅ Frais inscription alternatif récupéré: ${fraisInscription} FCFA`);
      }
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
        
        // Essayer de récupérer depuis la table Filiere si elle a un champ frais
        const filiere = await prisma.filiere.findUnique({
          where: { id: filiereId }
        });
        
        if (filiere) {
          console.log(`ℹ️ Filière trouvée: ${filiere.nom}, mais pas de frais spécifique`);
        }
        
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