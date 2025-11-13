import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const vagueId = searchParams.get('vagueId') || 'all';
    const searchTerm = searchParams.get('search') || '';
    const statutPaiement = searchParams.get('statut') || 'all';

    // Récupérer TOUTES les données séparément
    const [vagues, students, inscriptions, fraisFormations] = await Promise.all([
      // Vagues
      prisma.vague.findMany({
        where: { isActive: true },
        select: { id: true, nom: true, dateDebut: true, dateFin: true },
        orderBy: { createdAt: 'desc' },
      }),
      
      // Students avec leurs relations
      prisma.student.findMany({
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          filiere: { select: { nom: true } },
          vague: { select: { nom: true } },
        },
      }),
      
      // Inscriptions avec paiements
      prisma.inscription.findMany({
        include: { paiements: true },
      }),
      
      // Frais de formation
      prisma.fraisFormation.findMany({}),
    ]);

    // Transformer les étudiants
    const transformedStudents = students.map(student => {
      const inscription = inscriptions.find(ins => ins.email === student.user.email);
      const fraisFormation = fraisFormations.find(
        ff => ff.vagueId === student.vagueId && ff.filiereId === student.filiereId
      );

      const montantInscription = inscription?.fraisInscription || 0;
      const montantScolarite = fraisFormation?.fraisScolarite || 0;
      
      const paiementsInscription = inscription?.paiements || [];
      const montantPaye = paiementsInscription.reduce((sum, p) => sum + p.montant, 0);

      // Statut de paiement
      let statutPaiement: 'paye' | 'partiel' | 'en_retard' | 'non_paye';
      const totalAttendu = montantInscription + montantScolarite;

      if (montantPaye >= totalAttendu) {
        statutPaiement = 'paye';
      } else if (montantPaye > 0) {
        statutPaiement = 'partiel';
      } else {
        const aujourdHui = new Date();
        const vague = vagues.find(v => v.id === student.vagueId);
        statutPaiement = (vague && aujourdHui > vague.dateFin) ? 'en_retard' : 'non_paye';
      }

      // Statut d'inscription
      let statutInscription: 'complete' | 'partielle' | 'en_attente' = 'en_attente';
      if (inscription) {
        if (['COMPLET', 'PAYE_COMPLET', 'APPROUVE'].includes(inscription.statut)) {
          statutInscription = 'complete';
        } else if (inscription.statut === 'PAYE_PARTIEL') {
          statutInscription = 'partielle';
        }
      }

      return {
        id: student.id,
        nom: student.user.lastName,
        prenom: student.user.firstName,
        email: student.user.email,
        filiere: student.filiere?.nom || 'Non assigné',
        statutInscription,
        statutPaiement,
        montantInscription,
        montantScolarite,
        montantPaye,
        dateInscription: inscription?.dateInscription.toISOString().split('T')[0] || student.createdAt.toISOString().split('T')[0],
        vagueName: student.vague?.nom || 'Non assigné',
        vagueId: student.vagueId || '',
      };
    });

    // Appliquer les filtres
    let filteredStudents = transformedStudents;

    if (vagueId !== 'all') {
      filteredStudents = filteredStudents.filter(student => student.vagueId === vagueId);
    }

    if (searchTerm) {
      filteredStudents = filteredStudents.filter(student =>
        [student.nom, student.prenom, student.filiere, student.email].some(field =>
          field.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (statutPaiement !== 'all') {
      filteredStudents = filteredStudents.filter(student => student.statutPaiement === statutPaiement);
    }

    // Statistiques
    const totalInscription = filteredStudents.reduce((sum, s) => sum + s.montantInscription, 0);
    const totalScolarite = filteredStudents.reduce((sum, s) => sum + s.montantScolarite, 0);
    const totalPaye = filteredStudents.reduce((sum, s) => sum + s.montantPaye, 0);
    const totalRestant = totalInscription + totalScolarite - totalPaye;
    const tauxPaiement = totalInscription + totalScolarite > 0 
      ? (totalPaye / (totalInscription + totalScolarite)) * 100 
      : 0;

    const globalStats = {
      totalInscription,
      totalScolarite,
      totalPaye,
      totalRestant,
      tauxPaiement,
      studentsCount: filteredStudents.length,
      completeInscriptions: filteredStudents.filter(s => s.statutInscription === 'complete').length,
      paiementsEnRetard: filteredStudents.filter(s => s.statutPaiement === 'en_retard').length,
    };

    return NextResponse.json({
      vagues: vagues.map(v => ({
        id: v.id,
        name: v.nom,
        startDate: v.dateDebut.toISOString().split('T')[0],
        endDate: v.dateFin.toISOString().split('T')[0],
        students: filteredStudents.filter(s => s.vagueId === v.id),
      })),
      filteredStudents,
      globalStats,
    });

  } catch (error) {
    console.error('Erreur API finances:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données financières' },
      { status: 500 }
    );
  }
}