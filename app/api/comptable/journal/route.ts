import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Types pour la requête
interface ExportRequest {
  action: 'export';
  type: 'pdf' | 'excel';
  filters: {
    dateDebut: string;
    dateFin: string;
    type: string;
    search: string;
  };
}

interface CreateOperationRequest {
  action: 'create';
  data: {
    date: string;
    vague: string;
    filiere: string;
    libelle: string;
    debit: number;
    credit: number;
    reference: string;
  };
}

interface SyncRequest {
  action: 'sync';
}

type ApiRequest = ExportRequest | CreateOperationRequest | SyncRequest;

// Interface pour le frontend
interface OperationAutomatique {
  id: string;
  numero: string;
  date: string;
  type: 'inscription_eleve' | 'paiement_scolarite' | 'paiement_inscription';
  studentId?: string | null;
  studentName?: string;
  parentName?: string;
  filiere?: string;
  vague?: string;
  compteDebit: string;
  compteCredit: string;
  libelle: string;
  montant: number;
  reference: string;
  statut: 'comptabilise' | 'annule';
  modePaiement?: 'especes' | 'cheque' | 'virement' | 'mobile_money' | 'carte';
  source: 'paiement_auto' | 'inscription_auto';
  dateComptabilisation: string;
  notes?: string;
}

// GET - Récupérer les opérations avec filtres - CORRIGÉ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Utiliser des dates récentes par défaut
   // Dans votre API, remplacez les dates par défaut :
const today = new Date();
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

const dateDebut = searchParams.get('dateDebut') || firstDayOfMonth.toISOString().split('T')[0];
const dateFin = searchParams.get('dateFin') || lastDayOfMonth.toISOString().split('T')[0];
    const type = searchParams.get('type') || 'all';
    const searchTerm = searchParams.get('search') || '';

    // Construction dynamique du where
    const where: any = {
      date: {
        gte: new Date(dateDebut),
        lte: new Date(dateFin + 'T23:59:59.999Z')
      }
    };

    // Ajouter la recherche si elle existe
    if (searchTerm) {
      where.OR = [
        { libelle: { contains: searchTerm, mode: 'insensitive' } },
        { reference: { contains: searchTerm, mode: 'insensitive' } },
        { vague: { contains: searchTerm, mode: 'insensitive' } },
        { filiere: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // Ajouter le filtre par type si spécifié
    if (type !== 'all') {
      where.type = type;
    }

    console.log('Requête Prisma avec where:', JSON.stringify(where, null, 2));

    // CORRECTION : Syntaxe orderBy corrigée
    const operations = await prisma.operation.findMany({
      where,
      include: {
        inscription: {
          include: {
            filiere: true,
            vague: true,
            createdBy: true,
            paiements: true
          }
        },
        paiement: {
          include: {
            inscription: {
              include: {
                filiere: true,
                vague: true,
                createdBy: true
              }
            }
          }
        },
        student: {
          include: {
            user: true,
            filiere: true,
            vague: true
          }
        }
      },
      // CORRECTION : orderBy doit être un tableau
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    console.log('Opérations récupérées:', operations.length);
    console.log('Période:', dateDebut, 'à', dateFin);
    console.log('Filtres appliqués:', { type, searchTerm });

    // Transformer les opérations pour le frontend
    const transformedOperations: OperationAutomatique[] = operations.map(op => {
      // Déterminer les informations de l'étudiant
      let studentName = 'Système';
      let parentName = 'Système';
      let filiere = op.filiere;
      let vague = op.vague;
      let studentId = op.studentId;

      if (op.inscription) {
        studentName = `${op.inscription.prenom} ${op.inscription.nom}`;
        parentName = op.inscription.createdBy?.firstName || 'Parent';
        filiere = op.inscription.filiere?.nom || filiere;
        vague = op.inscription.vague?.nom || vague;
        studentId = op.inscription.id;
      } else if (op.student) {
        studentName = `${op.student.user.firstName} ${op.student.user.lastName}`;
        parentName = 'Parent';
        filiere = op.student.filiere?.nom || filiere;
        vague = op.student.vague?.nom || vague;
      }

      // Déterminer le type et la source
      let operationType: 'inscription_eleve' | 'paiement_scolarite' | 'paiement_inscription' = 'paiement_scolarite';
      let source: 'paiement_auto' | 'inscription_auto' = op.source as 'paiement_auto' | 'inscription_auto';

      if (op.type === 'inscription') {
        operationType = 'inscription_eleve';
        source = 'inscription_auto';
      } else if (op.type === 'paiement_inscription') {
        operationType = 'paiement_inscription';
        source = 'paiement_auto';
      } else if (op.type === 'paiement_scolarite') {
        operationType = 'paiement_scolarite';
        source = 'paiement_auto';
      }

      // Déterminer le mode de paiement
      let modePaiement: 'especes' | 'cheque' | 'virement' | 'mobile_money' | 'carte' = 'especes';
      if (op.paiement?.modePaiement) {
        modePaiement = op.paiement.modePaiement as any;
      }

      return {
        id: op.id,
        numero: `JOU-${op.date.getFullYear()}-${op.id.slice(-3).toUpperCase()}`,
        date: op.date.toISOString().split('T')[0],
        type: operationType,
        studentId,
        studentName,
        parentName,
        filiere,
        vague,
        compteDebit: '101',
        compteCredit: operationType === 'paiement_inscription' ? '702' : '701',
        libelle: op.libelle,
        montant: op.debit > 0 ? op.debit : op.credit,
        reference: op.reference,
        statut: op.statut as 'comptabilise' | 'annule',
        modePaiement,
        source,
        dateComptabilisation: op.date.toISOString().split('T')[0],
        notes: `Opération ${op.source} - ${op.libelle}`
      };
    });

    // Appliquer le filtre par type
    let filteredOperations = transformedOperations;
    if (type !== 'all') {
      filteredOperations = filteredOperations.filter(op => op.type === type);
    }

    // Calculer les statistiques
    const totalOperations = filteredOperations.length;
    const totalEncaissements = filteredOperations
      .filter(op => ['paiement_inscription', 'paiement_scolarite'].includes(op.type))
      .reduce((sum, op) => sum + op.montant, 0);
    const operationsPaiementAuto = filteredOperations.filter(op => op.source === 'paiement_auto').length;

    return NextResponse.json({
      success: true,
      data: {
        operations: filteredOperations,
        statistics: {
          totalOperations,
          totalEncaissements,
          operationsPaiementAuto,
          periode: `${dateDebut} à ${dateFin}`
        },
        filters: {
          dateDebut,
          dateFin,
          type,
          searchTerm
        }
      }
    });

  } catch (error) {
    console.error('Erreur API journal:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur serveur lors de la récupération des opérations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Toutes les actions (export, create, sync)
export async function POST(request: NextRequest) {
  try {
    const body: ApiRequest = await request.json();
    
    switch (body.action) {
      case 'export':
        return handleExport(body);
      
      case 'create':
        return handleCreateOperation(body);
      
      case 'sync':
        return handleSyncOperations();
      
      default:
        return NextResponse.json(
          { success: false, error: 'Action non supportée' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erreur API journal POST:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Gestion de l'export - Retourne les données brutes pour le frontend
async function handleExport(request: ExportRequest) {
  try {
    const { type, filters } = request;

    // Récupérer les données pour l'export
    const operations = await prisma.operation.findMany({
      where: {
        date: {
          gte: new Date(filters.dateDebut),
          lte: new Date(filters.dateFin + 'T23:59:59.999Z')
        },
        OR: filters.search ? [
          { libelle: { contains: filters.search, mode: 'insensitive' } },
          { reference: { contains: filters.search, mode: 'insensitive' } }
        ] : undefined
      },
      include: {
        inscription: {
          include: {
            filiere: true,
            vague: true
          }
        },
        paiement: true,
        student: {
          include: {
            user: true
          }
        }
      },
      // CORRECTION ICI AUSSI
      orderBy: [
        { date: 'desc' }
      ]
    });

    // Transformer pour l'export
    const exportData = operations.map(op => {
      let studentName = 'Système';
      if (op.inscription) {
        studentName = `${op.inscription.prenom} ${op.inscription.nom}`;
      } else if (op.student) {
        studentName = `${op.student.user.firstName} ${op.student.user.lastName}`;
      }

      return {
        numero: `JOU-${op.date.getFullYear()}-${op.id.slice(-3).toUpperCase()}`,
        date: op.date.toLocaleDateString('fr-FR'),
        type: op.type,
        eleve: studentName,
        filiere: op.filiere,
        vague: op.vague,
        libelle: op.libelle,
        debit: op.debit,
        credit: op.credit,
        montant: op.debit > 0 ? op.debit : op.credit,
        reference: op.reference,
        modePaiement: op.paiement?.modePaiement || 'Non spécifié',
        statut: op.statut,
        source: op.source
      };
    });

    return NextResponse.json({
      success: true,
      type: type,
      message: `Données exportées avec succès pour ${exportData.length} opérations`,
      data: {
        operations: exportData,
        metadata: {
          title: `Journal des Opérations - ${filters.dateDebut} à ${filters.dateFin}`,
          generatedAt: new Date().toLocaleDateString('fr-FR'),
          totalOperations: exportData.length,
          totalMontant: exportData.reduce((sum, op) => sum + op.montant, 0),
          filters: {
            periode: `${filters.dateDebut} à ${filters.dateFin}`,
            type: filters.type === 'all' ? 'Tous types' : filters.type,
            search: filters.search || 'Aucune'
          }
        }
      }
    });

  } catch (error) {
    console.error('Erreur export:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'export' },
      { status: 500 }
    );
  }
}

// Créer une opération manuelle
async function handleCreateOperation(request: CreateOperationRequest) {
  try {
    const { data } = request;
    const { date, vague, filiere, libelle, debit, credit, reference } = data;

    if (!date || !libelle || !reference) {
      return NextResponse.json(
        { success: false, error: 'Date, libellé et référence sont obligatoires' },
        { status: 400 }
      );
    }

    const nouvelleOperation = await prisma.operation.create({
      data: {
        date: new Date(date),
        vague: vague || '',
        filiere: filiere || '',
        libelle,
        debit: debit || 0,
        credit: credit || 0,
        reference,
        type: 'manuel',
        source: 'manuel',
        statut: 'comptabilise'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Opération créée avec succès',
      data: { 
        operation: {
          id: nouvelleOperation.id,
          numero: `JOU-${new Date(date).getFullYear()}-${nouvelleOperation.id.slice(-3).toUpperCase()}`,
          date: nouvelleOperation.date.toISOString().split('T')[0],
          libelle: nouvelleOperation.libelle,
          montant: nouvelleOperation.debit > 0 ? nouvelleOperation.debit : nouvelleOperation.credit,
          reference: nouvelleOperation.reference,
          debit: nouvelleOperation.debit,
          credit: nouvelleOperation.credit
        }
      }
    });

  } catch (error) {
    console.error('Erreur création opération:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de l\'opération' },
      { status: 500 }
    );
  }
}

// Synchroniser les opérations - CORRIGÉE
async function handleSyncOperations() {
  try {
    // 1. Trouver les inscriptions sans opération d'inscription
    const inscriptionsSansOperation = await prisma.inscription.findMany({
      where: {
        // Vérifier via une sous-requête qu'il n'y a pas d'opération liée
        operation: {
          none: {
            type: 'inscription'
          }
        }
      },
      include: {
        filiere: true,
        vague: true,
        createdBy: true,
        paiements: {
          include: {
            operation: true
          }
        }
      }
    });

    // 2. Trouver tous les paiements sans opération
    const paiementsSansOperation = await prisma.paiement.findMany({
      where: {
        operation: {
          none: {} // Aucune opération liée
        }
      },
      include: {
        inscription: {
          include: {
            filiere: true,
            vague: true,
            createdBy: true
          }
        }
      }
    });

    console.log('Inscriptions sans opération:', inscriptionsSansOperation.length);
    console.log('Paiements sans opération:', paiementsSansOperation.length);

    let operationsCreees = 0;

    // Créer les opérations pour les inscriptions manquantes
    for (const inscription of inscriptionsSansOperation) {
      await prisma.operation.create({
        data: {
          date: inscription.dateInscription,
          vague: inscription.vague?.nom || '',
          filiere: inscription.filiere?.nom || '',
          libelle: `Inscription - ${inscription.prenom} ${inscription.nom}`,
          debit: inscription.fraisInscription,
          credit: 0,
          reference: `INS-${inscription.id}`,
          type: 'inscription',
          source: 'auto',
          statut: 'comptabilise',
          inscriptionId: inscription.id
        }
      });
      operationsCreees++;
    }

    // Créer les opérations pour les paiements manquants
    for (const paiement of paiementsSansOperation) {
      const inscription = paiement.inscription;
      
      // Déterminer le type d'opération basé sur le libellé ou d'autres critères
      let typeOperation = 'paiement_inscription'; // valeur par défaut
      
      // Logique pour déterminer le type basé sur le libellé ou d'autres champs disponibles
      if (paiement.montant >= 50000) { // Exemple: si montant élevé, c'est probablement la scolarité
        typeOperation = 'paiement_scolarite';
      }

      await prisma.operation.create({
        data: {
          date: paiement.datePaiement,
          vague: inscription?.vague?.nom || '',
          filiere: inscription?.filiere?.nom || '',
          libelle: `Paiement - ${inscription?.prenom} ${inscription?.nom}`,
          debit: paiement.montant,
          credit: 0,
          reference: paiement.reference || `PAI-${paiement.id}`,
          type: typeOperation,
          source: 'auto',
          statut: 'comptabilise',
          inscriptionId: inscription?.id,
          paiementId: paiement.id
        }
      });
      operationsCreees++;
    }

    return NextResponse.json({
      success: true,
      message: 'Synchronisation terminée',
      data: {
        operationsSynchronisees: operationsCreees,
        nouvellesOperations: operationsCreees,
        inscriptionsTraitees: inscriptionsSansOperation.length,
        paiementsTraites: paiementsSansOperation.length,
        derniereSynchronisation: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur synchronisation:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la synchronisation' },
      { status: 500 }
    );
  }
}