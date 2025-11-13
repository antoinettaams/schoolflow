// app/api/comptable/factures/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

// GET /api/comptable/factures - Point d'entrée unique pour toute la page
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

    if (!user || !['ADMIN', 'COMPTABLE', 'SECRETAIRE'].includes(user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url); 
    const action = searchParams.get('action');

    console.log('🔍 API Factures - Action:', action);

    switch (action) {
      case 'stats':
        return await handleGetStats();
      case 'students':
        return await handleGetStudents();
      case 'facture':
        const factureId = searchParams.get('id');
        if (factureId) {
          return await handleGetFacture(factureId);
        }
        return NextResponse.json({ error: 'ID facture manquant' }, { status: 400 });
      default:
        return await handleGetFactures(request);
    }
  } catch (error) {
    console.error('❌ Erreur API factures:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// POST /api/comptable/factures - Créer une facture ou mettre à jour le statut
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

    if (!user || !['ADMIN', 'COMPTABLE', 'SECRETAIRE'].includes(user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const body = await request.json();

    console.log('📥 API Factures POST - Action:', action, 'Data:', body);

    switch (action) {
      case 'create':
        return await handleCreateFacture(body, user.id);
      case 'update-statut':
        return await handleUpdateStatut(body);
      default:
        return NextResponse.json({ error: 'Action non supportée' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Erreur API factures POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// Handlers
async function handleGetFactures(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    console.log('🔍 Filtres factures:', { statut, type, search });

    let where: any = {};

    if (statut && statut !== 'all') {
      where.statut = statut;
    }

    if (type && type !== 'all') {
      where.typePaiement = type;
    }

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { 
          student: {
            studentNumber: { contains: search, mode: 'insensitive' }
          }
        },
        {
          paiement: {
            inscription: {
              OR: [
                { nom: { contains: search, mode: 'insensitive' } },
                { prenom: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
              ]
            }
          }
        }
      ];
    }

    console.log('📋 Query where:', JSON.stringify(where, null, 2));

    const factures = await prisma.facture.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            },
            filiere: {
              select: {
                nom: true
              }
            },
            vague: {
              select: {
                nom: true
              }
            }
          }
        },
        paiement: {
          include: {
            inscription: {
              include: {
                filiere: true,
                vague: true
              }
            },
            createdBy: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ ${factures.length} facture(s) trouvée(s)`);

    const formattedFactures = factures.map(facture => {
      const student = facture.student;
      const user = student?.user;
      const inscription = facture.paiement?.inscription;
      
      const studentName = user ? 
        `${user.firstName} ${user.lastName}` : 
        inscription ? `${inscription.prenom} ${inscription.nom}` :
        `Étudiant ${student?.studentNumber || 'Inconnu'}`;
      
      const parentName = user?.firstName || 'Non disponible';
      const parentEmail = user?.email || inscription?.email || 'Non disponible';
      const filiere = student?.filiere?.nom || inscription?.filiere?.nom || 'Non assigné';
      const vague = student?.vague?.nom || inscription?.vague?.nom || 'Non assigné';

      return {
        id: facture.id,
        numero: facture.numero,
        paymentId: facture.paiementId,
        studentId: facture.studentId,
        studentName,
        parentName,
        parentEmail,
        filiere,
        vague,
        typePaiement: facture.typePaiement,
        methodePaiement: facture.methodePaiement,
        datePaiement: facture.datePaiement?.toISOString().split('T')[0] || '',
        dateFacturation: facture.createdAt.toISOString().split('T')[0],
        montant: facture.montantTotal,
        statut: facture.statut,
        semester: facture.semester,
        items: facture.items.map(item => ({
          id: item.id,
          description: item.description,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
          montant: item.montant
        })),
        notes: facture.notes,
        banque: facture.banque,
        numeroCheque: facture.numeroCheque,
        numeroCompte: facture.numeroCompte,
        operateurMobile: facture.operateurMobile,
        numeroTelephone: facture.numeroTelephone,
        createdBy: facture.paiement?.createdBy ? 
          `${facture.paiement.createdBy.firstName} ${facture.paiement.createdBy.lastName}` : 
          'Système'
      };
    });

    return NextResponse.json(formattedFactures);

  } catch (error) {
    console.error('❌ Erreur handleGetFactures:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des factures' },
      { status: 500 }
    );
  }
}

async function handleGetStats() {
  try {
    console.log('📊 Récupération des statistiques...');

    const [
      totalFactures,
      totalGenerees,
      totalEnvoyees,
      totalPayees,
      totalInscriptions,
      totalScolarite,
      montantTotal
    ] = await Promise.all([
      prisma.facture.count(),
      prisma.facture.count({ where: { statut: 'generee' } }),
      prisma.facture.count({ where: { statut: 'envoyee' } }),
      prisma.facture.count({ where: { statut: 'payee' } }),
      prisma.facture.count({ where: { typePaiement: 'inscription' } }),
      prisma.facture.count({ where: { typePaiement: 'scolarite' } }),
      prisma.facture.aggregate({
        _sum: {
          montantTotal: true
        }
      })
    ]);

    const stats = {
      totalFactures,
      totalGenerees,
      totalEnvoyees,
      totalPayees,
      totalInscriptions,
      totalScolarite,
      montantTotal: montantTotal._sum.montantTotal || 0
    };

    console.log('✅ Statistiques récupérées:', stats);

    return NextResponse.json(stats);

  } catch (error) {
    console.error('❌ Erreur handleGetStats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}

async function handleGetStudents() {
  try {
    console.log('👥 Récupération des étudiants...');

    // CORRECTION: Utiliser les valeurs d'enum mises à jour
    const inscriptions = await prisma.inscription.findMany({
      where: {
        OR: [
          { statut: 'PAYE_COMPLET' },
          { statut: 'COMPLET' },
          { statut: 'PAYE' }
        ]
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
          include: {
            facture: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    console.log(`📊 ${inscriptions.length} inscription(s) payée(s) trouvée(s)`);

    // CORRECTION: Filtrer les inscriptions sans facture
    const inscriptionsSansFacture = inscriptions.filter(inscription => {
      const aDesFactures = inscription.paiements.some((paiement: any) => 
        paiement.facture && paiement.facture.length > 0
      );
      return !aDesFactures;
    });

    console.log(`📊 ${inscriptionsSansFacture.length} inscription(s) sans facture`);

    const formattedStudents = inscriptionsSansFacture.map(inscription => ({
      id: inscription.id,
      name: `${inscription.prenom} ${inscription.nom}`,
      email: inscription.email,
      telephone: inscription.telephone,
      filiere: inscription.filiere?.nom || 'Non assigné',
      vague: inscription.vague?.nom || 'Non assigné',
      fraisInscription: inscription.fraisInscription,
      fraisPayes: inscription.fraisPayes,
      statut: inscription.statut
    }));

    return NextResponse.json(formattedStudents);

  } catch (error) {
    console.error('❌ Erreur handleGetStudents:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des étudiants' },
      { status: 500 }
    );
  }
}

async function handleGetFacture(id: string) {
  try {
    console.log(`📄 Récupération de la facture ${id}...`);

    const facture = await prisma.facture.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            },
            filiere: {
              select: {
                nom: true
              }
            },
            vague: {
              select: {
                nom: true
              }
            }
          }
        },
        paiement: {
          include: {
            inscription: {
              include: {
                filiere: true,
                vague: true
              }
            },
            createdBy: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        items: true
      }
    });

    if (!facture) {
      console.log('❌ Facture non trouvée:', id);
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    console.log('✅ Facture récupérée:', facture.numero);

    return NextResponse.json(facture);

  } catch (error) {
    console.error('❌ Erreur handleGetFacture:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la facture' },
      { status: 500 }
    );
  }
}

async function handleCreateFacture(data: any, userId: string) {
  try {
    console.log('🆕 Création d\'une nouvelle facture:', data);
    console.log('👤 Utilisateur créateur:', userId);

    const {
      studentId,
      typePaiement,
      methodePaiement,
      datePaiement,
      montant,
      description,
      notes,
      semester,
      banque,
      numeroCheque,
      numeroCompte,
      operateurMobile,
      numeroTelephone
    } = data;

    if (!studentId || !montant || !description) {
      console.log('❌ Champs obligatoires manquants');
      return NextResponse.json(
        { error: 'Champs obligatoires manquants: studentId, montant, description' },
        { status: 400 }
      );
    }

    if (typePaiement === 'scolarite' && !semester) {
      console.log('❌ Semestre manquant pour scolarité');
      return NextResponse.json(
        { error: 'Le semestre est obligatoire pour les frais de scolarité' },
        { status: 400 }
      );
    }

    const inscription = await prisma.inscription.findUnique({
      where: { id: studentId },
      include: {
        filiere: true,
        vague: true
      }
    });

    if (!inscription) {
      console.log('❌ Inscription non trouvée:', studentId);
      return NextResponse.json(
        { error: 'Inscription non trouvée' },
        { status: 404 }
      );
    }

    console.log('✅ Inscription trouvée:', `${inscription.prenom} ${inscription.nom}`);

    const factureExistante = await prisma.facture.findFirst({
      where: {
        paiement: {
          inscriptionId: studentId
        }
      }
    });

    if (factureExistante) {
      console.log('❌ Facture existe déjà pour cette inscription:', factureExistante.numero);
      return NextResponse.json(
        { error: 'Une facture existe déjà pour cette inscription' },
        { status: 400 }
      );
    }

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) {
      console.log('❌ Utilisateur non trouvé dans la base:', userId);
      return NextResponse.json(
        { error: 'Utilisateur non autorisé' },
        { status: 403 }
      );
    }

    const factureCount = await prisma.facture.count();
    const numero = `FACT-${new Date().getFullYear()}-${(factureCount + 1).toString().padStart(4, '0')}`;

    console.log('🔢 Numéro de facture généré:', numero);

    const paiement = await prisma.paiement.create({
      data: {
        montant: parseInt(montant),
        modePaiement: methodePaiement,
        datePaiement: new Date(datePaiement),
        reference: `PAY-${Date.now()}`,
        createdById: userId,
        inscriptionId: inscription.id
      }
    });

    console.log('✅ Paiement créé:', paiement.id);

    let student = await prisma.student.findFirst({
      where: {
        user: {
          email: inscription.email
        }
      }
    });

    if (!student) {
      console.log('🆕 Création d\'étudiant temporaire pour:', inscription.email);
      
      try {
        const user = await prisma.user.create({
          data: {
            clerkUserId: `temp_${Date.now()}_${inscription.email}`,
            email: inscription.email,
            role: 'ETUDIANT',
            firstName: inscription.prenom,
            lastName: inscription.nom,
            phone: inscription.telephone || '',
            isActive: true
          }
        });

        student = await prisma.student.create({
          data: {
            userId: user.id,
            studentNumber: `TEMP-${Date.now()}`,
            filiereId: inscription.filiereId || undefined,
            vagueId: inscription.vagueId || undefined
          }
        });

        console.log('✅ Étudiant temporaire créé:', student.id);
      } catch (error) {
        console.error('❌ Erreur création étudiant temporaire:', error);
      }
    }

    const factureData: any = {
      numero,
      paiementId: paiement.id,
      typePaiement,
      methodePaiement,
      datePaiement: new Date(datePaiement),
      montantTotal: parseInt(montant),
      statut: 'generee',
      semester: typePaiement === 'scolarite' ? semester : null,
      notes,
      banque,
      numeroCheque,
      numeroCompte,
      operateurMobile,
      numeroTelephone,
      items: {
        create: {
          description,
          quantite: 1,
          prixUnitaire: parseInt(montant),
          montant: parseInt(montant)
        }
      }
    };

    if (student) {
      factureData.studentId = student.id;
    }

    const facture = await prisma.facture.create({
      data: factureData,
      include: {
        student: {
          include: {
            user: true,
            filiere: true,
            vague: true
          }
        },
        items: true,
        paiement: {
          include: {
            inscription: true,
            createdBy: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    console.log('✅ Facture créée avec succès:', facture.numero);

    return NextResponse.json({
      success: true,
      data: facture,
      message: 'Facture créée avec succès'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Erreur handleCreateFacture:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Erreur de référence: utilisateur ou inscription non valide' },
          { status: 400 }
        );
      }
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Une facture existe déjà pour ce paiement' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la création de la facture: ' + (error instanceof Error ? error.message : 'Erreur inconnue') },
      { status: 500 }
    );
  }
}

async function handleUpdateStatut(data: { id: string; statut: string }) {
  try {
    const { id, statut } = data;

    console.log(`🔄 Mise à jour statut facture ${id} -> ${statut}`);

    const statutsValides = ['generee', 'envoyee', 'annulee', 'payee'];
    if (!statutsValides.includes(statut)) {
      console.log('❌ Statut invalide:', statut);
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      );
    }

    const facture = await prisma.facture.update({
      where: { id },
      data: { 
        statut: statut as any
      },
      include: {
        student: {
          include: {
            user: true
          }
        },
        paiement: {
          include: {
            inscription: true
          }
        }
      }
    });

    console.log('✅ Statut facture mis à jour:', facture.numero);

    return NextResponse.json({
      success: true,
      data: facture,
      message: 'Statut mis à jour avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur handleUpdateStatut:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du statut' },
      { status: 500 }
    );
  }
}