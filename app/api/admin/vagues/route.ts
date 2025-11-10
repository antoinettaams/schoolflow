import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Récupérer toutes les vagues OU une vague spécifique OU les statistiques
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const stats = searchParams.get('stats');
    const includeStats = searchParams.get('includeStats') === 'true';

    // Route: GET /api/admin/vagues?stats=true
    if (stats === 'true') {
      const vagues = await prisma.vague.findMany({
        include: {
          students: true,
          planningAssignations: {
            include: {
              teacher: true
            }
          },
          filieresPivot: {
            include: {
              filiere: true
            }
          }
        }
      });

      const totalVagues = vagues.length;
      
      const today = new Date();
      const vaguesActive = vagues.filter(v => {
        const start = new Date(v.dateDebut);
        const end = new Date(v.dateFin);
        return today >= start && today <= end;
      }).length;

      const vaguesUpcoming = vagues.filter(v => {
        const start = new Date(v.dateDebut);
        return today < start;
      }).length;

      const vaguesCompleted = vagues.filter(v => {
        const end = new Date(v.dateFin);
        return today > end;
      }).length;

      const totalEtudiantsGlobal = vagues.reduce((acc, vague) => 
        acc + vague.students.length, 0
      );

      const totalFormateursGlobal = vagues.reduce((acc, vague) => {
        const formateursUniques = new Set(
          vague.planningAssignations.map(pa => pa.teacherId)
        );
        return acc + formateursUniques.size;
      }, 0);

      const statsParFiliere: { [key: string]: number } = {};
      vagues.forEach(vague => {
        vague.filieresPivot.forEach(vf => {
          const filiereName = vf.filiere.nom;
          statsParFiliere[filiereName] = (statsParFiliere[filiereName] || 0) + 1;
        });
      });

      return NextResponse.json({
        general: {
          totalVagues,
          vaguesActive,
          vaguesUpcoming,
          vaguesCompleted,
          totalEtudiantsGlobal,
          totalFormateursGlobal
        },
        parFiliere: statsParFiliere
      });
    }

    // Route: GET /api/admin/vagues?id=[vague-id]
    if (id) {
      const vague = await prisma.vague.findUnique({
        where: { id },
        include: {
          filieresPivot: {
            include: {
              filiere: true
            }
          },
          students: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              filiere: true
            }
          },
          planningAssignations: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true
                    }
                  }
                }
              },
              module: true,
              filiere: true
            }
          }
        }
      });

      if (!vague) {
        return NextResponse.json(
          { error: 'Vague non trouvée' },
          { status: 404 }
        );
      }

      const today = new Date();
      const startDate = new Date(vague.dateDebut);
      const endDate = new Date(vague.dateFin);
      
      let status: 'active' | 'upcoming' | 'completed';
      if (today < startDate) {
        status = 'upcoming';
      } else if (today > endDate) {
        status = 'completed';
      } else {
        status = 'active';
      }

      const vagueFormatted = {
        id: vague.id,
        name: vague.nom,
        startDate: vague.dateDebut.toISOString().split('T')[0],
        endDate: vague.dateFin.toISOString().split('T')[0],
        status,
        description: vague.description,
        semestres: vague.semestres.split(',').map(s => s.trim()).filter(s => s),
        isActive: vague.isActive,
        createdAt: vague.createdAt,
        updatedAt: vague.updatedAt,
        filieres: vague.filieresPivot.map(vf => ({
          id: vf.filiere.id.toString(),
          name: vf.filiere.nom,
          description: vf.filiere.description
        })),
        students: vague.students.map(student => ({
          id: student.id,
          studentNumber: student.studentNumber,
          firstName: student.user.firstName,
          lastName: student.user.lastName,
          email: student.user.email,
          filiere: student.filiere?.nom
        })),
        planning: vague.planningAssignations.map(pa => ({
          id: pa.id,
          teacher: {
            id: pa.teacher.id,
            name: `${pa.teacher.user.firstName} ${pa.teacher.user.lastName}`
          },
          module: {
            id: pa.module.id,
            name: pa.module.nom,
            coefficient: pa.module.coefficient
          },
          filiere: {
            id: pa.filiere.id,
            name: pa.filiere.nom
          },
          scheduleSlots: pa.scheduleSlots,
          schedulePeriod: pa.schedulePeriod
        }))
      };

      return NextResponse.json(vagueFormatted);
    }

    // Route: GET /api/admin/vagues (toutes les vagues)
    const vagues = await prisma.vague.findMany({
      include: {
        filieresPivot: {
          include: {
            filiere: true
          }
        },
        students: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        planningAssignations: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            module: true,
            filiere: true
          }
        }
      },
      orderBy: {
        dateDebut: 'desc'
      }
    });

    // Transformer les données pour le frontend
    const vaguesFormatted = vagues.map(vague => {
      const today = new Date();
      const startDate = new Date(vague.dateDebut);
      const endDate = new Date(vague.dateFin);
      
      let status: 'active' | 'upcoming' | 'completed';
      if (today < startDate) {
        status = 'upcoming';
      } else if (today > endDate) {
        status = 'completed';
      } else {
        status = 'active';
      }

      // Compter les étudiants par filière
      const filieresWithStats = vague.filieresPivot.map(vf => {
        const studentsInFiliere = vague.students.filter(student => 
          student.filiereId === vf.filiereId
        );
        
        const enseignantsInFiliere = vague.planningAssignations
          .filter(pa => pa.filiereId === vf.filiereId)
          .map(pa => pa.teacherId)
          .filter((value, index, self) => self.indexOf(value) === index);

        return {
          id: vf.filiere.id.toString(),
          name: vf.filiere.nom,
          description: vf.filiere.description,
          totalEtudiants: studentsInFiliere.length,
          totalFormateurs: enseignantsInFiliere.length
        };
      });

      // Statistiques globales
      const totalEtudiants = vague.students.length;
      const totalFormateurs = [
        ...new Set(vague.planningAssignations.map(pa => pa.teacherId))
      ].length;

      // Extraire les semestres
      const semestres = vague.semestres.split(',').map(s => s.trim()).filter(s => s);

      return {
        id: vague.id,
        name: vague.nom,
        startDate: vague.dateDebut.toISOString().split('T')[0],
        endDate: vague.dateFin.toISOString().split('T')[0],
        status,
        description: vague.description,
        filieres: filieresWithStats,
        totalEtudiants,
        totalFormateurs,
        semestres,
        isActive: vague.isActive,
        createdAt: vague.createdAt,
        updatedAt: vague.updatedAt
      };
    });

    return NextResponse.json(vaguesFormatted);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des données' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle vague
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      name, 
      startDate, 
      endDate, 
      description, 
      semestres, 
      filiereIds,
      isActive = true 
    } = body;

    if (!name || !startDate || !endDate || !semestres) {
      return NextResponse.json(
        { error: 'Les champs nom, startDate, endDate et semestres sont obligatoires' },
        { status: 400 }
      );
    }

    const nouvelleVague = await prisma.vague.create({
      data: {
        nom: name,
        description,
        semestres: Array.isArray(semestres) ? semestres.join(', ') : semestres,
        dateDebut: new Date(startDate),
        dateFin: new Date(endDate),
        isActive,
        ...(filiereIds && filiereIds.length > 0 && {
          filieresPivot: {
            create: filiereIds.map((filiereId: number) => ({
              filiereId
            }))
          }
        })
      },
      include: {
        filieresPivot: {
          include: {
            filiere: true
          }
        }
      }
    });

    return NextResponse.json(
      { 
        message: 'Vague créée avec succès', 
        vague: nouvelleVague 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erreur lors de la création de la vague:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Une vague avec ce nom existe déjà' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de la vague' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une vague
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la vague requis' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      startDate, 
      endDate, 
      description, 
      semestres, 
      filiereIds,
      isActive 
    } = body;

    const vagueExistante = await prisma.vague.findUnique({
      where: { id }
    });

    if (!vagueExistante) {
      return NextResponse.json(
        { error: 'Vague non trouvée' },
        { status: 404 }
      );
    }

    const vagueMaj = await prisma.vague.update({
      where: { id },
      data: {
        ...(name && { nom: name }),
        ...(description && { description }),
        ...(semestres && { semestres: Array.isArray(semestres) ? semestres.join(', ') : semestres }),
        ...(startDate && { dateDebut: new Date(startDate) }),
        ...(endDate && { dateFin: new Date(endDate) }),
        ...(isActive !== undefined && { isActive }),
        ...(filiereIds && {
          filieresPivot: {
            deleteMany: {},
            create: filiereIds.map((filiereId: number) => ({
              filiereId
            }))
          }
        })
      },
      include: {
        filieresPivot: {
          include: {
            filiere: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Vague mise à jour avec succès',
      vague: vagueMaj
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la vague:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour de la vague' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une vague
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de la vague requis' },
        { status: 400 }
      );
    }

    const vagueExistante = await prisma.vague.findUnique({
      where: { id }
    });

    if (!vagueExistante) {
      return NextResponse.json(
        { error: 'Vague non trouvée' },
        { status: 404 }
      );
    }

    await prisma.vague.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Vague supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la vague:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression de la vague' },
      { status: 500 }
    );
  }
}