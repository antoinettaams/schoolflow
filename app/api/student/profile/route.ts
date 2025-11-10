// app/api/student/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer toutes les données de l'étudiant en une seule requête
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        student: {
          include: {
            filiere: {
              include: {
                modules: {
                  include: {
                    enseignements: {
                      include: {
                        teacher: {
                          include: {
                            user: {
                              select: {
                                firstName: true,
                                lastName: true,
                              }
                            }
                          }
                        },
                        salle: true
                      }
                    }
                  }
                }
              }
            },
            vague: true,
            grades: {
              include: {
                module: true,
                filiere: true,
                vague: true,
                teacher: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
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
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (!user.student) {
      return NextResponse.json({ error: 'Profil étudiant non trouvé' }, { status: 404 });
    }

    // Générer les activités basées sur les données réelles
    const activities = generateStudentActivities(user.student);

    // Formater les matières selon la filière
    const subjects = user.student.filiere?.modules.map(module => ({
      id: module.id,
      nom: module.nom,
      description: module.description || `Module ${module.typeModule}`,
      coefficient: module.coefficient,
      typeModule: module.typeModule,
      couleur: getSubjectColor(module.nom),
      enseignements: module.enseignements.map(ens => ({
        jour: ens.jour,
        heureDebut: ens.heureDebut,
        heureFin: ens.heureFin,
        professeur: `${ens.teacher.user.firstName} ${ens.teacher.user.lastName}`,
        salle: ens.salle?.nom
      }))
    })) || [];

    // Formater la réponse complète
    const studentData = {
      user: {
        id: user.id,
        clerkUserId: user.clerkUserId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
      student: {
        id: user.student.id,
        studentNumber: user.student.studentNumber,
        vagueNumber: user.student.vagueNumber,
        filiere: user.student.filiere ? {
          id: user.student.filiere.id,
          nom: user.student.filiere.nom,
          description: user.student.filiere.description,
          dureeFormation: user.student.filiere.dureeFormation,
        } : null,
        vague: user.student.vague ? {
          id: user.student.vague.id,
          nom: user.student.vague.nom,
          description: user.student.vague.description,
          dateDebut: user.student.vague.dateDebut,
          dateFin: user.student.vague.dateFin,
        } : null,
      },
      grades: user.student.grades.map(grade => ({
        id: grade.id,
        module: {
          id: grade.module.id,
          nom: grade.module.nom,
          coefficient: grade.module.coefficient,
          typeModule: grade.module.typeModule,
        },
        interrogation1: grade.interrogation1,
        interrogation2: grade.interrogation2,
        interrogation3: grade.interrogation3,
        devoir: grade.devoir,
        composition: grade.composition,
        rang: grade.rang,
        formulaUsed: grade.formulaUsed,
        teacher: grade.teacher ? {
          firstName: grade.teacher.user.firstName,
          lastName: grade.teacher.user.lastName,
          matiere: grade.teacher.matiere,
        } : null,
        createdAt: grade.createdAt,
      })),
      activities,
      subjects
    };

    return NextResponse.json(studentData);
  } catch (error) {
    console.error('Erreur API profile étudiant:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// Générer les activités de l'étudiant basées sur les données réelles
function generateStudentActivities(student: any) {
  const activities = [];

  // Activité de connexion actuelle
  activities.push({
    id: 1,
    type: 'login',
    description: 'Connexion réussie',
    timestamp: new Date(),
    icon: 'check-circle'
  });

  // Activités basées sur les notes
  student.grades.forEach((grade: any, index: number) => {
    if (grade.composition) {
      activities.push({
        id: 2 + index * 2,
        type: 'exam',
        description: `Examen de ${grade.module.nom} terminé`,
        timestamp: grade.createdAt,
        icon: 'book-open'
      });
    }
    
    if (grade.devoir) {
      activities.push({
        id: 3 + index * 2,
        type: 'homework',
        description: `Devoir de ${grade.module.nom} rendu`,
        timestamp: grade.createdAt,
        icon: 'check-circle'
      });
    }

    if (grade.interrogation1 || grade.interrogation2 || grade.interrogation3) {
      activities.push({
        id: 20 + index,
        type: 'quiz',
        description: `Interrogation de ${grade.module.nom}`,
        timestamp: grade.createdAt,
        icon: 'clock'
      });
    }
  });

  // Trier par date (plus récent en premier)
  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return activities.slice(0, 6); // Retourner les 6 activités les plus récentes
}

// Fonction pour assigner des couleurs aux matières
function getSubjectColor(subjectName: string): string {
  const colorMap: { [key: string]: string } = {
    'Mathématiques': 'text-green-600',
    'Physique': 'text-purple-600',
    'Chimie': 'text-blue-600',
    'SVT': 'text-emerald-600',
    'Français': 'text-red-600',
    'Philosophie': 'text-orange-600',
    'Histoire': 'text-amber-600',
    'Géographie': 'text-amber-600',
    'Anglais': 'text-cyan-600',
    'Espagnol': 'text-cyan-600',
    'Allemand': 'text-cyan-600',
    'Économie': 'text-green-600',
    'Sociologie': 'text-blue-600',
    'Droit': 'text-red-600',
    'Programmation': 'text-blue-600',
    'Réseaux': 'text-green-600',
    'Bases de données': 'text-purple-600',
    'Systèmes': 'text-orange-600',
    'Marketing': 'text-blue-600',
    'Management': 'text-green-600',
    'Comptabilité': 'text-red-600',
    'Négociation': 'text-purple-600',
  };

  return colorMap[subjectName] || 'text-gray-600';
}