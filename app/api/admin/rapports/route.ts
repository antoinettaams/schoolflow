// app/api/admin/finances/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'stats' ou 'export'
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const vagueId = searchParams.get('vagueId');
    const filiereId = searchParams.get('filiereId');
    const formatExport = searchParams.get('format'); // 'excel' ou 'pdf'

    // Filtres communs
    const dateFilter = {
      ...(dateDebut && dateFin && {
        datePaiement: {
          gte: new Date(dateDebut),
          lte: new Date(dateFin)
        }
      })
    };

    const additionalFilters: any = {};
    if (vagueId) additionalFilters.vagueId = vagueId;
    if (filiereId) additionalFilters.filiereId = parseInt(filiereId);

    if (action === 'export') {
      // === MODE EXPORT ===
      const paiements = await prisma.paiement.findMany({
        where: { ...dateFilter, ...additionalFilters },
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
          },
          facture: true
        },
        orderBy: { datePaiement: 'desc' }
      });

      const operations = await prisma.operation.findMany({
        where: {
          date: dateFilter.datePaiement,
          ...additionalFilters
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          inscription: {
            include: {
              filiere: true
            }
          }
        },
        orderBy: { date: 'desc' }
      });

      const factures = await prisma.facture.findMany({
        where: {
          datePaiement: dateFilter.datePaiement
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          items: true,
          paiement: {
            include: {
              inscription: {
                include: {
                  filiere: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Préparation des données pour l'export
      const exportData = {
        metadata: {
          titre: "Rapport Financier",
          periode: dateDebut && dateFin 
            ? `${format(new Date(dateDebut), 'dd/MM/yyyy')} - ${format(new Date(dateFin), 'dd/MM/yyyy')}`
            : 'Toutes périodes',
          dateGeneration: new Date().toISOString(),
          totalElements: paiements.length + operations.length + factures.length
        },
        sections: {
          paiements: paiements.map(p => ({
            id: p.id,
            date: format(new Date(p.datePaiement), 'dd/MM/yyyy'),
            montant: p.montant,
            modePaiement: p.modePaiement,
            reference: p.reference,
            etudiant: p.inscription ? `${p.inscription.prenom} ${p.inscription.nom}` : 'N/A',
            filiere: p.inscription?.filiere?.nom || 'N/A',
            vague: p.inscription?.vague?.nom || 'N/A',
            createur: p.createdBy ? `${p.createdBy.firstName} ${p.createdBy.lastName}` : 'Système'
          })),
          operations: operations.map(op => ({
            id: op.id,
            date: format(new Date(op.date), 'dd/MM/yyyy'),
            libelle: op.libelle,
            debit: op.debit,
            credit: op.credit,
            solde: op.debit - op.credit,
            type: op.type,
            source: op.source,
            etudiant: op.student ? `${op.student.user.firstName} ${op.student.user.lastName}` : 'N/A',
            filiere: op.filiere
          })),
          factures: factures.map(f => ({
            id: f.id,
            numero: f.numero,
            date: format(new Date(f.datePaiement), 'dd/MM/yyyy'),
            montantTotal: f.montantTotal,
            statut: f.statut,
            typePaiement: f.typePaiement,
            etudiant: f.student ? `${f.student.user.firstName} ${f.student.user.lastName}` : 'N/A',
            items: f.items.map(item => ({
              description: item.description,
              quantite: item.quantite,
              prixUnitaire: item.prixUnitaire,
              montant: item.montant
            }))
          }))
        },
        resume: {
          totalPaiements: paiements.reduce((acc, p) => acc + p.montant, 0),
          totalDebit: operations.reduce((acc, op) => acc + op.debit, 0),
          totalCredit: operations.reduce((acc, op) => acc + op.credit, 0),
          soldeNet: paiements.reduce((acc, p) => acc + p.montant, 0) - operations.reduce((acc, op) => acc + op.debit, 0),
          nombrePaiements: paiements.length,
          nombreOperations: operations.length,
          nombreFactures: factures.length
        }
      };

      // Retour selon le format demandé
      if (formatExport === 'excel') {
        return NextResponse.json({
          type: 'excel',
          data: exportData,
          fileName: `rapport-financier-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
        });
      } else if (formatExport === 'pdf') {
        return NextResponse.json({
          type: 'pdf',
          data: exportData,
          fileName: `rapport-financier-${format(new Date(), 'yyyy-MM-dd')}.pdf`
        });
      }

      return NextResponse.json(exportData);

    } else {
      // === MODE STATISTIQUES (par défaut) ===
      
      // KPI Principaux
      const [chiffreAffaires, recettesAnnee, depenses, statsType, evolution] = await Promise.all([
        // Chiffre d'affaires période
        prisma.paiement.aggregate({
          _sum: { montant: true },
          where: { ...dateFilter, ...additionalFilters }
        }),

        // Recettes année en cours
        prisma.paiement.aggregate({
          _sum: { montant: true },
          where: {
            datePaiement: {
              gte: new Date(new Date().getFullYear(), 0, 1)
            },
            ...additionalFilters
          }
        }),

        // Dépenses
        prisma.operation.aggregate({
          _sum: { debit: true },
          where: {
            date: dateFilter.datePaiement,
            type: 'depense',
            ...additionalFilters
          }
        }),

        // Stats par type de paiement
        prisma.paiement.groupBy({
          by: ['modePaiement'],
          _sum: { montant: true },
          _count: { id: true },
          where: { ...dateFilter, ...additionalFilters }
        }),

        // Évolution mensuelle (simplifiée)
        prisma.paiement.findMany({
          where: {
            datePaiement: {
              gte: new Date(new Date().getFullYear(), 0, 1)
            },
            ...additionalFilters
          },
          select: {
            datePaiement: true,
            montant: true
          },
          orderBy: { datePaiement: 'asc' }
        })
      ]);

      // Top filières par revenus
      const filieres = await prisma.filiere.findMany({
        include: {
          inscriptions: {
            where: {
              statut: { in: ['PAYE_COMPLET', 'PAYE_PARTIEL'] },
              ...(dateFilter.datePaiement && {
                dateInscription: dateFilter.datePaiement
              })
            },
            include: {
              paiements: true
            }
          },
          fraisFormations: {
            include: {
              vague: true
            }
          }
        }
      });

      const beneficeNet = (chiffreAffaires._sum.montant || 0) - (depenses._sum.debit || 0);

      // Traitement évolution mensuelle
      const evolutionMensuelle = evolution.reduce((acc: any[], paiement) => {
        const mois = format(new Date(paiement.datePaiement), 'yyyy-MM');
        const existing = acc.find(item => item.mois === mois);
        
        if (existing) {
          existing.total += paiement.montant;
          existing.nombre_paiements += 1;
        } else {
          acc.push({
            mois,
            total: paiement.montant,
            nombre_paiements: 1
          });
        }
        return acc;
      }, []).sort((a, b) => a.mois.localeCompare(b.mois));

      return NextResponse.json({
        kpis: {
          chiffreAffaires: chiffreAffaires._sum.montant || 0,
          recettesTotales: recettesAnnee._sum.montant || 0,
          depenses: depenses._sum.debit || 0,
          beneficeNet,
          nombreTransactions: statsType.reduce((acc, stat) => acc + stat._count.id, 0)
        },
        statsParType: statsType.map(stat => ({
          mode: stat.modePaiement,
          montant: stat._sum.montant || 0,
          count: stat._count.id
        })),
        evolutionMensuelle,
        topFilieres: filieres.map(filiere => {
          const revenus = filiere.inscriptions.reduce((acc, ins) => 
            acc + ins.paiements.reduce((sum, p) => sum + p.montant, 0), 0
          );
          return {
            id: filiere.id,
            nom: filiere.nom,
            revenus,
            nombreEtudiants: filiere.inscriptions.length,
            fraisMoyens: filiere.fraisFormations[0]?.fraisScolarite || 0
          };
        }).sort((a, b) => b.revenus - a.revenus).slice(0, 5)
      });
    }

  } catch (error) {
    console.error('Erreur API finances:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données financières' },
      { status: 500 }
    );
  }
}