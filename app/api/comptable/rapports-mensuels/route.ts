// app/api/comptable/rapports-mensuels/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MonthlyReportData {
  id: string;
  mois: string;
  annee: number;
  recettesScolarite: number;
  recettesInscriptions: number;
  autresRecettes: number;
  chargesPersonnel: number;
  chargesFonctionnement: number;
  chargesMateriel: number;
  investissements: number;
  effectifTotal: number;
  nouvellesInscriptions: number;
  tauxRemplissage: number;
}

interface PerformanceFiliere {
  filiere: string;
  vague: string;
  effectif: number;
  recettes: number;
  charges: number;
  rentabilite: number;
}

// GET - Récupérer les rapports mensuels
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const annee = searchParams.get('annee') || new Date().getFullYear().toString();
    const mois = searchParams.get('mois');

    // Si un mois spécifique est demandé
    if (mois) {
      const report = await generateMonthlyReport(parseInt(annee), mois);
      return NextResponse.json({
        success: true,
        data: {
          rapportMensuel: report,
          performanceFilieres: await getPerformanceFilieres(parseInt(annee), mois)
        }
      });
    }

    // Sinon, retourner les 6 derniers mois
    const rapports = await generateLastMonthsReports(parseInt(annee));
    
    return NextResponse.json({
      success: true,
      data: {
        rapportsMensuels: rapports,
        performanceFilieres: await getPerformanceFilieres(parseInt(annee))
      }
    });

  } catch (error) {
    console.error('Erreur API rapports mensuels:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur serveur lors de la génération des rapports'
      },
      { status: 500 }
    );
  }
}

// Générer un rapport mensuel spécifique
async function generateMonthlyReport(annee: number, mois: string): Promise<MonthlyReportData> {
  const dateDebut = new Date(annee, getMonthNumber(mois), 1);
  const dateFin = new Date(annee, getMonthNumber(mois) + 1, 0);
  
  // Récupérer les données financières
  const operations = await prisma.operation.findMany({
    where: {
      date: {
        gte: dateDebut,
        lte: dateFin
      }
    }
  });

  // Calculer les recettes
  const recettesScolarite = operations
    .filter(op => op.type === 'paiement_scolarite')
    .reduce((sum, op) => sum + (op.debit > 0 ? op.debit : op.credit), 0);

  const recettesInscriptions = operations
    .filter(op => op.type === 'paiement_inscription')
    .reduce((sum, op) => sum + (op.debit > 0 ? op.debit : op.credit), 0);

  const autresRecettes = operations
    .filter(op => op.type === 'manuel' && op.debit > 0)
    .reduce((sum, op) => sum + op.debit, 0);

  // Récupérer les effectifs
  const inscriptionsMois = await prisma.inscription.findMany({
    where: {
      dateInscription: {
        gte: dateDebut,
        lte: dateFin
      }
    },
    include: {
      filiere: true,
      vague: true
    }
  });

  const effectifTotal = await prisma.student.count({
    where: {
      createdAt: {
        lte: dateFin
      }
    }
  });

  const nouvellesInscriptions = inscriptionsMois.length;

  // Calculer le taux de remplissage (simplifié)
  const capaciteTotale = await getCapaciteTotale();
  const tauxRemplissage = capaciteTotale > 0 ? Math.min(100, (effectifTotal / capaciteTotale) * 100) : 0;

  // Les charges sont estimées basées sur des pourcentages fixes (à adapter selon votre logique métier)
  const chargesPersonnel = Math.round(recettesScolarite * 0.45);
  const chargesFonctionnement = Math.round(recettesScolarite * 0.15);
  const chargesMateriel = Math.round(recettesScolarite * 0.10);
  const investissements = Math.round(recettesScolarite * 0.05);

  return {
    id: `${annee}-${mois}`,
    mois: getMonthName(getMonthNumber(mois)),
    annee,
    recettesScolarite,
    recettesInscriptions,
    autresRecettes,
    chargesPersonnel,
    chargesFonctionnement,
    chargesMateriel,
    investissements,
    effectifTotal,
    nouvellesInscriptions,
    tauxRemplissage: Math.round(tauxRemplissage)
  };
}

// Générer les rapports des derniers mois
async function generateLastMonthsReports(annee: number): Promise<MonthlyReportData[]> {
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin'];
  const rapports: MonthlyReportData[] = [];

  for (const moisNom of mois) {
    const rapport = await generateMonthlyReport(annee, moisNom);
    rapports.push(rapport);
  }

  return rapports;
}

// Obtenir la performance par filière
async function getPerformanceFilieres(annee: number, mois?: string): Promise<PerformanceFiliere[]> {
  const dateDebut = mois ? 
    new Date(annee, getMonthNumber(mois), 1) : 
    new Date(annee, 0, 1);
  
  const dateFin = mois ? 
    new Date(annee, getMonthNumber(mois) + 1, 0) : 
    new Date(annee, 11, 31);

  // Récupérer les étudiants par filière et vague
  const students = await prisma.student.findMany({
    where: {
      createdAt: {
        lte: dateFin
      }
    },
    include: {
      filiere: true,
      vague: true,
      operation: {
        where: {
          date: {
            gte: dateDebut,
            lte: dateFin
          },
          type: {
            in: ['paiement_scolarite', 'paiement_inscription']
          }
        }
      }
    }
  });

  // Grouper par filière et vague
  const performanceMap = new Map<string, PerformanceFiliere>();

  for (const student of students) {
    if (!student.filiere || !student.vague) continue;

    const key = `${student.filiere.nom}-${student.vague.nom}`;
    
    if (!performanceMap.has(key)) {
      performanceMap.set(key, {
        filiere: student.filiere.nom,
        vague: student.vague.nom,
        effectif: 0,
        recettes: 0,
        charges: 0,
        rentabilite: 0
      });
    }

    const perf = performanceMap.get(key)!;
    perf.effectif += 1;
    
    // Calculer les recettes de l'étudiant
    const recettesEtudiant = student.operation.reduce((sum, op) => 
      sum + (op.debit > 0 ? op.debit : op.credit), 0
    );
    perf.recettes += recettesEtudiant;

    // Estimer les charges (simplifié)
    perf.charges += Math.round(recettesEtudiant * 0.6);
  }

  // Calculer la rentabilité
  const performances = Array.from(performanceMap.values());
  for (const perf of performances) {
    perf.rentabilite = perf.recettes > 0 ? 
      ((perf.recettes - perf.charges) / perf.recettes) * 100 : 0;
  }

  return performances;
}

// Fonctions utilitaires
function getMonthNumber(mois: string): number {
  const moisMap: { [key: string]: number } = {
    'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3,
    'mai': 4, 'juin': 5, 'juillet': 6, 'août': 7,
    'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
  };
  return moisMap[mois.toLowerCase()] || 0;
}

function getMonthName(monthNumber: number): string {
  const mois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  return mois[monthNumber];
}

async function getCapaciteTotale(): Promise<number> {
  // Cette fonction devrait retourner la capacité totale de votre centre
  // Pour l'instant, on retourne une valeur par défaut
  return 150;
}