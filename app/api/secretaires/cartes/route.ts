import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    // GET spécifique pour une carte
    if (id) {
      const carte = await prisma.carteEtudiante.findUnique({
        where: { id },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          filiere: {
            select: {
              nom: true,
              description: true,
              dureeFormation: true,
            },
          },
          vague: {
            select: {
              nom: true,
              dateDebut: true,
              dateFin: true,
            },
          },
        },
      });

      if (!carte) {
        return NextResponse.json(
          { error: 'Carte non trouvée' },
          { status: 404 }
        );
      }

      const formattedCarte = {
        id: carte.id,
        eleve: `${carte.student.user.firstName} ${carte.student.user.lastName}`,
        email: carte.student.user.email,
        telephone: carte.student.user.phone,
        filiere: carte.filiere.nom,
        vague: carte.vague.nom,
        numeroCarte: carte.numeroCarte,
        dateExpiration: carte.dateExpiration.toISOString().split('T')[0],
        statut: carte.statut.toLowerCase(),
        dateCreation: carte.dateCreation.toISOString().split('T')[0],
        photo: carte.includePhoto ? `/photos/${carte.studentId}.jpg` : null,
        qrCode: carte.includeQRCode ? `QR-${carte.studentId}` : null,
        numeroEtudiant: carte.student.studentNumber,
      };

      return NextResponse.json(formattedCarte);
    }

    // Action pour récupérer les statistiques
    if (action === 'statistiques') {
      const totalCartes = await prisma.carteEtudiante.count();
      const cartesActives = await prisma.carteEtudiante.count({
        where: { statut: 'ACTIVE' },
      });
      const cartesExpirees = await prisma.carteEtudiante.count({
        where: { statut: 'EXPIREE' },
      });
      const cartesEnAttente = await prisma.carteEtudiante.count({
        where: { statut: 'EN_ATTENTE' },
      });

      const statistiques = {
        total: totalCartes,
        actives: cartesActives,
        expirees: cartesExpirees,
        enAttente: cartesEnAttente,
      };

      return NextResponse.json(statistiques);
    }

    // Action pour récupérer les étudiants éligibles
    if (action === 'eleves-eligibles') {
      const students = await prisma.student.findMany({
        where: {
          // Vérification qu'aucune carte active n'existe
          cartes: {
            none: {
              statut: 'ACTIVE',
            },
          },
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          filiere: {
            select: {
              nom: true,
            },
          },
          vague: {
            select: {
              nom: true,
            },
          },
        },
      });

      // Filtrer les étudiants qui ont des inscriptions payées
      const studentsWithInscriptions = await Promise.all(
        students.map(async (student) => {
          const inscriptions = await prisma.inscription.findMany({
            where: {
              email: student.user.email,
              statut: 'PAYE_COMPLET',
            },
          });

          return {
            student,
            hasPaidInscription: inscriptions.length > 0,
          };
        })
      );

      const elevesEligibles = studentsWithInscriptions
        .filter(({ hasPaidInscription }) => hasPaidInscription)
        .map(({ student }) => ({
          id: student.id,
          nom: student.user.lastName,
          prenom: student.user.firstName,
          email: student.user.email,
          filiere: student.filiere?.nom || 'Non assigné',
          vague: student.vague?.nom || 'Non assigné',
          numeroEtudiant: student.studentNumber,
          statutPaiement: 'paye' as const,
        }));
 
      return NextResponse.json(elevesEligibles);
    }

    // Récupération normale des cartes avec filtres
    const searchTerm = searchParams.get('search') || '';
    const filiereId = searchParams.get('filiereId');
    const vagueId = searchParams.get('vagueId');
    const statut = searchParams.get('statut');

    const where: any = {};

    if (searchTerm) {
      where.OR = [
        { student: { user: { firstName: { contains: searchTerm, mode: 'insensitive' } } } },
        { student: { user: { lastName: { contains: searchTerm, mode: 'insensitive' } } } },
        { numeroCarte: { contains: searchTerm, mode: 'insensitive' } },
        { student: { user: { email: { contains: searchTerm, mode: 'insensitive' } } } },
        { student: { studentNumber: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    if (filiereId && filiereId !== 'toutes') {
      where.filiereId = parseInt(filiereId);
    }

    if (vagueId && vagueId !== 'toutes') {
      where.vagueId = vagueId;
    }

    if (statut && statut !== 'toutes') {
      where.statut = statut.toUpperCase();
    }

    const cartes = await prisma.carteEtudiante.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        filiere: {
          select: {
            id: true,
            nom: true,
          },
        },
        vague: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedCartes = cartes.map(carte => ({
      id: carte.id,
      eleve: `${carte.student.user.firstName} ${carte.student.user.lastName}`,
      email: carte.student.user.email,
      filiere: carte.filiere.nom,
      vague: carte.vague.nom,
      numeroCarte: carte.numeroCarte,
      dateExpiration: carte.dateExpiration.toISOString().split('T')[0],
      statut: carte.statut.toLowerCase(),
      dateCreation: carte.dateCreation.toISOString().split('T')[0],
      photo: carte.includePhoto ? `/photos/${carte.studentId}.jpg` : null,
      qrCode: carte.includeQRCode ? `QR-${carte.studentId}` : null,
      numeroEtudiant: carte.student.studentNumber,
    }));

    return NextResponse.json(formattedCartes);
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Action pour renouveler une carte
    if (action === 'renouveler') {
      const { carteId, dateExpiration } = body;
      
      const ancienneCarte = await prisma.carteEtudiante.findUnique({
        where: { id: carteId },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!ancienneCarte) {
        return NextResponse.json(
          { error: 'Carte non trouvée' },
          { status: 404 }
        );
      }

      await prisma.carteEtudiante.update({
        where: { id: carteId },
        data: { statut: 'INACTIVE' },
      });

      const lastCarte = await prisma.carteEtudiante.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      const sequence = lastCarte 
        ? parseInt(lastCarte.numeroCarte.split('-')[2]) + 1 
        : 1;
      const numeroCarte = `CF-${new Date().getFullYear()}-${sequence.toString().padStart(3, '0')}`;

      const nouvelleCarte = await prisma.carteEtudiante.create({
        data: {
          numeroCarte,
          dateExpiration: new Date(dateExpiration),
          includeQRCode: ancienneCarte.includeQRCode,
          includePhoto: ancienneCarte.includePhoto,
          studentId: ancienneCarte.studentId,
          vagueId: ancienneCarte.vagueId,
          filiereId: ancienneCarte.filiereId,
          statut: 'ACTIVE',
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          filiere: {
            select: {
              nom: true,
            },
          },
          vague: {
            select: {
              nom: true,
            },
          },
        },
      });

      const formattedCarte = {
        id: nouvelleCarte.id,
        eleve: `${nouvelleCarte.student.user.firstName} ${nouvelleCarte.student.user.lastName}`,
        email: nouvelleCarte.student.user.email,
        filiere: nouvelleCarte.filiere.nom,
        vague: nouvelleCarte.vague.nom,
        numeroCarte: nouvelleCarte.numeroCarte,
        dateExpiration: nouvelleCarte.dateExpiration.toISOString().split('T')[0],
        statut: nouvelleCarte.statut.toLowerCase(),
        dateCreation: nouvelleCarte.dateCreation.toISOString().split('T')[0],
        photo: nouvelleCarte.includePhoto ? `/photos/${nouvelleCarte.studentId}.jpg` : null,
        qrCode: nouvelleCarte.includeQRCode ? `QR-${nouvelleCarte.studentId}` : null,
        numeroEtudiant: nouvelleCarte.student.studentNumber,
      };

      return NextResponse.json(formattedCarte, { status: 201 });
    }

    // Action normale de création de carte
    const {
      studentId,
      dateExpiration,
      includeQRCode = true,
      includePhoto = true,
    } = body;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Étudiant non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si l'étudiant a une inscription payée
    const inscriptions = await prisma.inscription.findMany({
      where: {
        email: student.user.email,
        statut: 'PAYE_COMPLET',
      },
    });

    if (inscriptions.length === 0) {
      return NextResponse.json(
        { error: "L'étudiant n'a pas payé les frais de formation" },
        { status: 400 }
      );
    }

    const existingCarte = await prisma.carteEtudiante.findFirst({
      where: { 
        studentId,
        statut: 'ACTIVE'
      },
    });

    if (existingCarte) {
      return NextResponse.json(
        { error: 'Une carte active existe déjà pour cet étudiant' },
        { status: 400 }
      );
    }

    const lastCarte = await prisma.carteEtudiante.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const sequence = lastCarte 
      ? parseInt(lastCarte.numeroCarte.split('-')[2]) + 1 
      : 1;
    const numeroCarte = `CF-${new Date().getFullYear()}-${sequence.toString().padStart(3, '0')}`;

    const nouvelleCarte = await prisma.carteEtudiante.create({
      data: {
        numeroCarte,
        dateExpiration: new Date(dateExpiration),
        includeQRCode,
        includePhoto,
        studentId: student.id,
        vagueId: student.vagueId!,
        filiereId: student.filiereId!,
        statut: 'ACTIVE',
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        filiere: {
          select: {
            nom: true,
          },
        },
        vague: {
          select: {
            nom: true,
          },
        },
      },
    });

    const formattedCarte = {
      id: nouvelleCarte.id,
      eleve: `${nouvelleCarte.student.user.firstName} ${nouvelleCarte.student.user.lastName}`,
      email: nouvelleCarte.student.user.email,
      filiere: nouvelleCarte.filiere.nom,
      vague: nouvelleCarte.vague.nom,
      numeroCarte: nouvelleCarte.numeroCarte,
      dateExpiration: nouvelleCarte.dateExpiration.toISOString().split('T')[0],
      statut: nouvelleCarte.statut.toLowerCase(),
      dateCreation: nouvelleCarte.dateCreation.toISOString().split('T')[0],
      photo: nouvelleCarte.includePhoto ? `/photos/${nouvelleCarte.studentId}.jpg` : null,
      qrCode: nouvelleCarte.includeQRCode ? `QR-${nouvelleCarte.studentId}` : null,
      numeroEtudiant: nouvelleCarte.student.studentNumber,
    };

    return NextResponse.json(formattedCarte, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la carte:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { action, carteIds, data, id } = body;

    // Mise à jour d'une carte spécifique
    if (id) {
      const { statut, dateExpiration, includeQRCode, includePhoto } = data || body;

      const carte = await prisma.carteEtudiante.update({
        where: { id },
        data: {
          ...(statut && { statut: statut.toUpperCase() }),
          ...(dateExpiration && { dateExpiration: new Date(dateExpiration) }),
          ...(includeQRCode !== undefined && { includeQRCode }),
          ...(includePhoto !== undefined && { includePhoto }),
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          filiere: {
            select: {
              nom: true,
            },
          },
          vague: {
            select: {
              nom: true,
            },
          },
        },
      });

      const formattedCarte = {
        id: carte.id,
        eleve: `${carte.student.user.firstName} ${carte.student.user.lastName}`,
        email: carte.student.user.email,
        filiere: carte.filiere.nom,
        vague: carte.vague.nom,
        numeroCarte: carte.numeroCarte,
        dateExpiration: carte.dateExpiration.toISOString().split('T')[0],
        statut: carte.statut.toLowerCase(),
        dateCreation: carte.dateCreation.toISOString().split('T')[0],
        photo: carte.includePhoto ? `/photos/${carte.studentId}.jpg` : null,
        qrCode: carte.includeQRCode ? `QR-${carte.studentId}` : null,
        numeroEtudiant: carte.student.studentNumber,
      };

      return NextResponse.json(formattedCarte);
    }

    // Actions batch
    if (action === 'changer-statut' && carteIds && data?.statut) {
      await prisma.carteEtudiante.updateMany({
        where: {
          id: {
            in: carteIds,
          },
        },
        data: {
          statut: data.statut.toUpperCase(),
        },
      });

      return NextResponse.json({ 
        message: `${carteIds.length} carte(s) mise(s) à jour avec succès` 
      });
    }

    return NextResponse.json(
      { error: 'Action non supportée' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour des cartes:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de carte manquant' },
        { status: 400 }
      );
    }

    await prisma.carteEtudiante.delete({
      where: { id },
    });

    return NextResponse.json({ 
      message: 'Carte supprimée avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la carte:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
    
  }
}