// app/api/comptable/balance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

// GET /api/comptable/balance - Récupérer les opérations, vagues, filières et stats
export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est un comptable OU un secrétaire
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true }
    });

    if (!user || (user.role !== 'COMPTABLE' && user.role !== 'SECRETAIRE')) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const vague = searchParams.get('vague');
    const search = searchParams.get('search');
    const dateStart = searchParams.get('dateStart');
    const dateEnd = searchParams.get('dateEnd');

    switch (action) {
      case 'vagues': {
        const vagues = await prisma.vague.findMany({
          where: { isActive: true },
          select: { id: true, nom: true },
          orderBy: { nom: 'asc' }
        });
        return NextResponse.json(vagues);
      }

      case 'filieres': {
        const filieres = await prisma.filiere.findMany({
          select: { id: true, nom: true },
          orderBy: { nom: 'asc' }
        });
        return NextResponse.json(filieres);
      }

      case 'stats': {
        const totalOperations = await prisma.operation.count();
        
        const totalDebit = await prisma.operation.aggregate({
          _sum: { debit: true }
        });

        const totalCredit = await prisma.operation.aggregate({
          _sum: { credit: true }
        });

        const operationsParVague = await prisma.operation.groupBy({
          by: ['vague'],
          _count: { id: true },
          _sum: { debit: true, credit: true }
        });

        return NextResponse.json({
          totalOperations,
          totalDebit: totalDebit._sum.debit || 0,
          totalCredit: totalCredit._sum.credit || 0,
          solde: (totalDebit._sum.debit || 0) - (totalCredit._sum.credit || 0),
          operationsParVague
        });
      }

      default: {
        const where: any = {};

        if (vague && vague !== 'all') {
          where.vague = vague;
        }

        if (search) {
          where.OR = [
            { libelle: { contains: search, mode: 'insensitive' } },
            { reference: { contains: search, mode: 'insensitive' } }
          ];
        }

        if (dateStart && dateEnd) {
          where.date = {
            gte: new Date(dateStart),
            lte: new Date(dateEnd)
          };
        }

        const operations = await prisma.operation.findMany({
          where,
          orderBy: { date: 'desc' }
        });

        return NextResponse.json(operations);
      }
    }
  } catch (error) {
    console.error('Erreur API balance:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des données' },
      { status: 500 }
    );
  }
}

// POST /api/comptable/balance - Créer une opération ou effectuer d'autres actions
export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est un comptable OU un secrétaire
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true, id: true }
    });

    if (!user || (user.role !== 'COMPTABLE' && user.role !== 'SECRETAIRE')) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'create': {
        const { date, vague, filiere, libelle, debit, credit, reference } = body;

        if (!date || !vague || !filiere || !libelle || !reference) {
          return NextResponse.json(
            { error: 'Tous les champs obligatoires doivent être remplis' },
            { status: 400 }
          );
        }

        const debitValue = Number(debit) || 0;
        const creditValue = Number(credit) || 0;

        if (debitValue < 0 || creditValue < 0) {
          return NextResponse.json(
            { error: 'Les montants doivent être positifs' },
            { status: 400 }
          );
        }

        // Vérifier que la vague existe
        const vagueExists = await prisma.vague.findUnique({
          where: { id: vague }
        });

        if (!vagueExists) {
          return NextResponse.json(
            { error: 'La vague sélectionnée n\'existe pas' },
            { status: 400 }
          );
        }

        // Vérifier que la filière existe
        const filiereExists = await prisma.filiere.findUnique({
          where: { id: parseInt(filiere) }
        });

        if (!filiereExists) {
          return NextResponse.json(
            { error: 'La filière sélectionnée n\'existe pas' },
            { status: 400 }
          );
        }

        const finalReference = reference || `OP-${Date.now()}`;

        const newOperation = await prisma.operation.create({
          data: {
            date: new Date(date),
            vague,
            filiere,
            libelle,
            debit: debitValue,
            credit: creditValue,
            reference: finalReference
          }
        });

        return NextResponse.json(newOperation, { status: 201 });
      }

      case 'delete': {
        // Seuls les comptables peuvent supprimer
        const user = await prisma.user.findUnique({
          where: { clerkUserId: userId },
          select: { role: true }
        });

        if (!user || user.role !== 'COMPTABLE') {
          return NextResponse.json(
            { error: 'Seuls les comptables peuvent supprimer des opérations' },
            { status: 403 }
          );
        }

        const { id } = body;

        if (!id) {
          return NextResponse.json(
            { error: 'ID de l\'opération requis' },
            { status: 400 }
          );
        }

        await prisma.operation.delete({
          where: { id }
        });

        return NextResponse.json({ message: 'Opération supprimée avec succès' });
      }

      default:
        return NextResponse.json(
          { error: 'Action non supportée' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erreur API balance POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de l\'opération' },
      { status: 500 }
    );
  }
}