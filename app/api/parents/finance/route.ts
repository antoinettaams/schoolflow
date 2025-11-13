// app/api/parent/finance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient, StatutInscription, FactureStatut } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log(`💰 Récupération des données financières pour le parent: ${userId}`);

    // Récupérer l'utilisateur parent
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        parent: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (!user.parent) {
      return NextResponse.json({ 
        error: "Profil parent non trouvé",
        message: "Votre compte n'est pas configuré comme parent"
      }, { status: 400 });
    }

    // Trouver les étudiants liés à ce parent (par nom de l'enfant)
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { user: { firstName: { contains: user.parent.enfantName, mode: 'insensitive' } } },
          { user: { lastName: { contains: user.parent.enfantName, mode: 'insensitive' } } },
          { user: { firstName: { contains: user.parent.enfantName.split(' ')[0], mode: 'insensitive' } } },
          { user: { lastName: { contains: user.parent.enfantName.split(' ')[0], mode: 'insensitive' } } }
        ]
      },
      include: {
        user: true,
        filiere: true,
        vague: true,
        facture: {
          include: {
            items: true,
            paiement: {
              include: {
                inscription: {
                  include: {
                    filiere: true,
                    vague: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (students.length === 0) {
      return NextResponse.json({ 
        error: "Aucun étudiant trouvé",
        message: "Aucun étudiant n'est associé à votre compte parent"
      }, { status: 404 });
    }

    // Pour simplifier, prenons le premier étudiant trouvé
    const student = students[0];

    // Récupérer les données complètes
    const [inscriptions, fraisFormations, fraisConfigurations] = await Promise.all([
      // Inscriptions
      prisma.inscription.findMany({
        where: {
          email: student.user.email,
          statut: {
            in: ['APPROUVE', 'PAYE_COMPLET', 'PAYE_PARTIEL', 'PAYE', 'COMPLET'] as StatutInscription[]
          }
        },
        include: {
          filiere: true,
          vague: true,
          paiements: {
            include: {
              facture: {
                include: {
                  items: true
                }
              }
            }
          }
        }
      }),

      // Frais de formation
      prisma.fraisFormation.findMany({
        where: {
          OR: [
            { vagueId: student.vagueId },
            { filiereId: student.filiereId }
          ]
        },
        include: {
          filiere: true,
          vague: true
        }
      }),

      // Configurations de frais
      prisma.fraisConfiguration.findMany()
    ]);

    // Formater les données pour le frontend
    const financeData = await formatFinanceData(
      student, 
      inscriptions, 
      fraisFormations, 
      fraisConfigurations
    );

    console.log(`✅ Données financières chargées pour ${user.parent.enfantName}`);
    
    return NextResponse.json({
      success: true,
      data: financeData
    });

  } catch (error) {
    console.error("❌ Erreur récupération des données financières:", error);
    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la récupération des données financières",
        details: error instanceof Error ? error.message : "Erreur inconnue",
        success: false
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { action, reference } = await req.json();

    if (!action) {
      return NextResponse.json({ error: "Action manquante" }, { status: 400 });
    }

    switch (action) {
      case 'download-receipt':
        return await handleDownloadReceipt(userId, reference);
      
      case 'generate-payment-link':
        return await handleGeneratePaymentLink(userId, reference);
      
      default:
        return NextResponse.json({ error: "Action non supportée" }, { status: 400 });
    }

  } catch (error) {
    console.error("❌ Erreur traitement de la requête:", error);
    return NextResponse.json(
      { 
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
        success: false
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Gestion du téléchargement de reçu
async function handleDownloadReceipt(parentUserId: string, reference: string) {
  if (!reference) {
    return NextResponse.json({ error: "Référence manquante" }, { status: 400 });
  }

  // Récupérer le parent
  const parent = await prisma.parent.findUnique({
    where: { userId: parentUserId },
    include: { user: true }
  });

  if (!parent) {
    return NextResponse.json({ error: "Parent non trouvé" }, { status: 404 });
  }

  // Trouver la facture correspondante
  const facture = await prisma.facture.findFirst({
    where: {
      OR: [
        { numero: reference },
        { paiement: { inscription: { email: parent.user.email } } }
      ]
    },
    include: {
      student: {
        include: {
          user: true,
          filiere: true,
          vague: true
        }
      },
      paiement: {
        include: {
          inscription: {
            include: {
              filiere: true,
              vague: true
            }
          }
        }
      },
      items: true
    }
  });

  if (!facture) {
    return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 });
  }

  // Vérifier que le parent a accès à cette facture
  const hasAccess = await verifyParentAccess(parentUserId, facture.student.user.email);
  if (!hasAccess) {
    return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
  }

  // Générer le contenu du reçu
  const receiptContent = generateReceiptContent(facture, parent);

  return NextResponse.json({
    success: true,
    data: {
      content: receiptContent,
      fileName: `reçu-${reference}.txt`,
      facture: {
        reference: facture.numero,
        amount: facture.montantTotal,
        date: facture.datePaiement,
        status: facture.statut
      }
    }
  });
}

// Génération de lien de paiement (simulé)
async function handleGeneratePaymentLink(parentUserId: string, reference: string) {
  // Cette fonction génère un lien de paiement simulé
  // Dans une vraie application, intégrez avec un service de paiement comme Stripe, PayPal, etc.

  return NextResponse.json({
    success: true,
    data: {
      paymentUrl: `https://votre-ecole.com/payment/${reference}`,
      reference: reference,
      message: "Veuillez vous rendre à la comptabilité pour effectuer le paiement",
      instructions: "Présentez cette référence à la comptabilité: " + reference
    }
  });
}

// Fonction pour formater les données financières
async function formatFinanceData(
  student: any,
  inscriptions: any[],
  fraisFormations: any[],
  fraisConfigurations: any[]
) {
  // Calcul des totaux
  const totalFactures = student.facture.reduce((sum: number, facture: any) => sum + facture.montantTotal, 0);
  const facturesPayees = student.facture.filter((f: any) => f.statut === 'payee');
  const totalPaye = facturesPayees.reduce((sum: number, facture: any) => sum + facture.montantTotal, 0);
  const facturesEnAttente = student.facture.filter((f: any) => f.statut === 'envoyee' || f.statut === 'generee');
  const totalEnAttente = facturesEnAttente.reduce((sum: number, facture: any) => sum + facture.montantTotal, 0);

  // Calcul des frais en retard
  const today = new Date();
  const facturesEnRetard = student.facture.filter((f: any) => {
    if (f.statut === 'payee') return false;
    const dueDate = new Date(f.datePaiement);
    dueDate.setDate(dueDate.getDate() + 30); // 30 jours après la date de paiement prévue
    return dueDate < today;
  });
  const totalEnRetard = facturesEnRetard.reduce((sum: number, facture: any) => sum + facture.montantTotal, 0);

  // Formater les frais
  const fees = await formatFees(student.facture, fraisFormations, fraisConfigurations);

  // Données de l'étudiant
  const studentData = {
    id: student.id,
    name: `${student.user.firstName} ${student.user.lastName}`,
    class: student.filiere?.nom || "Non assigné",
    program: student.filiere?.nom || "Non assigné",
    registrationStatus: inscriptions.length > 0 ? "registered" : "pending",
    registrationFee: fraisConfigurations.find(f => f.type === 'INSCRIPTION_UNIVERSEL')?.montant || 10000,
    tuitionFee: fraisFormations.reduce((sum, ff) => sum + ff.fraisScolarite, 0) || 885000,
    paidAmount: totalPaye,
    remainingAmount: totalEnAttente,
    totalSchoolFees: totalFactures || 985000
  };

  return {
    student: studentData,
    fees: fees,
    summary: {
      totalAll: totalFactures,
      totalPaid: totalPaye,
      totalPending: totalEnAttente,
      totalOverdue: totalEnRetard
    },
    inscriptions: inscriptions.map(inscription => ({
      id: inscription.id,
      statut: inscription.statut,
      fraisInscription: inscription.fraisInscription,
      fraisPayes: inscription.fraisPayes,
      dateInscription: inscription.dateInscription,
      filiere: inscription.filiere?.nom,
      vague: inscription.vague?.nom
    }))
  };
}

// Fonction pour formater les frais
async function formatFees(factures: any[], fraisFormations: any[], fraisConfigurations: any[]) {
  const fees: any[] = [];

  // Frais d'inscription
  const fraisInscriptionConfig = fraisConfigurations.find(f => f.type === 'INSCRIPTION_UNIVERSEL');
  if (fraisInscriptionConfig) {
    const factureInscription = factures.find(f => 
      f.items.some((item: any) => item.description.toLowerCase().includes('inscription'))
    );

    fees.push({
      id: 1,
      description: `Frais d'inscription - Année scolaire ${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
      amount: fraisInscriptionConfig.montant,
      dueDate: new Date(new Date().getFullYear(), 8, 1).toLocaleDateString('fr-FR'), // 1er septembre
      status: factureInscription ? "paid" : "pending",
      paymentDate: factureInscription?.datePaiement?.toLocaleDateString('fr-FR') || "",
      type: "Inscription",
      reference: `INS-${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
    });
  }

  // Frais de scolarité par trimestre
  const fraisScolariteAnnuel = fraisFormations.reduce((sum, ff) => sum + ff.fraisScolarite, 0);
  if (fraisScolariteAnnuel > 0) {
    for (let trimestre = 1; trimestre <= 3; trimestre++) {
      const factureScolarite = factures.find(f => 
        f.items.some((item: any) => 
          item.description.toLowerCase().includes('scolarité') && 
          item.description.includes(`Trimestre ${trimestre}`)
        )
      );

      const dueDate = new Date(new Date().getFullYear(), 8 + ((trimestre - 1) * 3), 15);
      
      fees.push({
        id: 1 + trimestre,
        description: `Frais de scolarité - Trimestre ${trimestre}`,
        amount: Math.round(fraisScolariteAnnuel / 3),
        dueDate: dueDate.toLocaleDateString('fr-FR'),
        status: factureScolarite ? "paid" : (dueDate < new Date() ? "overdue" : "pending"),
        paymentDate: factureScolarite?.datePaiement?.toLocaleDateString('fr-FR') || "",
        type: "Scolarité",
        reference: `SCO-${new Date().getFullYear()}-T${trimestre}`
      });
    }
  }

  // Autres frais (cantine, activités, etc.)
  const autresFrais = factures.filter(f => 
    !f.items.some((item: any) => 
      item.description.toLowerCase().includes('inscription') || 
      item.description.toLowerCase().includes('scolarité')
    )
  );

  autresFrais.forEach((facture, index) => {
    const mainItem = facture.items[0];
    fees.push({
      id: 10 + index,
      description: mainItem?.description || `Frais divers - ${facture.numero}`,
      amount: facture.montantTotal,
      dueDate: facture.datePaiement?.toLocaleDateString('fr-FR') || new Date().toLocaleDateString('fr-FR'),
      status: facture.statut === 'payee' ? "paid" : (new Date(facture.datePaiement) < new Date() ? "overdue" : "pending"),
      paymentDate: facture.statut === 'payee' ? facture.datePaiement?.toLocaleDateString('fr-FR') : "",
      type: "Activités",
      reference: facture.numero
    });
  });

  return fees;
}

// Générer le contenu du reçu
function generateReceiptContent(facture: any, parent: any) {
  const student = facture.student;
  
  return `
RECU DE PAIEMENT - SCHOOLFLOW
==============================

INFORMATIONS DE PAIEMENT
------------------------
Référence: ${facture.numero}
Date de paiement: ${facture.datePaiement?.toLocaleDateString('fr-FR') || 'N/A'}
Mode de paiement: ${facture.methodePaiement || 'Non spécifié'}
Montant total: ${new Intl.NumberFormat('fr-FR').format(facture.montantTotal)} FCFA
Statut: ${facture.statut}

DÉTAIL DES FRAIS
----------------
${facture.items.map((item: any) => 
  `• ${item.description}: ${item.quantite} x ${new Intl.NumberFormat('fr-FR').format(item.prixUnitaire)} FCFA = ${new Intl.NumberFormat('fr-FR').format(item.montant)} FCFA`
).join('\n')}

INFORMATIONS ÉLÈVE
------------------
Nom: ${student.user.firstName} ${student.user.lastName}
Matricule: ${student.studentNumber}
Filière: ${student.filiere?.nom || 'N/A'}
Vague: ${student.vague?.nom || 'N/A'}

INFORMATIONS PARENT
-------------------
Nom: ${parent.user.firstName} ${parent.user.lastName}
Email: ${parent.user.email}
Relation: ${parent.relation}

ÉTABLISSEMENT
-------------
École: SchoolFlow Academy
Adresse: [Adresse de l'école]
Téléphone: [Téléphone de l'école]
Email: contact@schoolflow.edu

Date d'émission: ${new Date().toLocaleDateString('fr-FR')}
Heure d'émission: ${new Date().toLocaleTimeString('fr-FR')}

Ce reçu est valable comme justificatif de paiement.
Merci pour votre confiance.

Signature du Directeur
______________________

[Cachet de l'établissement]
  `.trim();
}

// Vérifier l'accès du parent
async function verifyParentAccess(parentUserId: string, studentEmail: string): Promise<boolean> {
  const parent = await prisma.parent.findUnique({
    where: { userId: parentUserId },
    include: { user: true }
  });

  if (!parent) return false;

  // Vérifier par nom de l'enfant ou email
  const students = await prisma.student.findMany({
    where: {
      OR: [
        { user: { email: studentEmail } },
        { user: { firstName: { contains: parent.enfantName, mode: 'insensitive' } } },
        { user: { lastName: { contains: parent.enfantName, mode: 'insensitive' } } }
      ]
    }
  });

  return students.length > 0;
}