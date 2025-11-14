// app/api/parents/attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log(`🎯 API parents/attendance appelée pour: ${userId}`);

    // Récupérer l'utilisateur parent avec ses étudiants
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        email: true,
        parent: {
          select: {
            id: true,
            enfantName: true,
            filiere: true,
            relation: true,
            students: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                },
                filiere: {
                  select: {
                    nom: true,
                    description: true
                  }
                },
                vague: {
                  select: {
                    id: true,
                    nom: true,
                    description: true
                  }
                },
                // Inclure les présences
                attendance: {
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
                    module: {
                      select: {
                        nom: true
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
                  },
                  orderBy: {
                    date: 'desc'
                  },
                  take: 100
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (user.role !== UserRole.PARENT) {
      return NextResponse.json({ error: "Accès réservé aux parents" }, { status: 403 });
    }

    if (!user.parent) {
      return NextResponse.json({ error: "Profil parent non trouvé" }, { status: 400 });
    }

    const parentData = user.parent;

    // Vérifier si le parent a des étudiants associés
    if (!parentData.students || parentData.students.length === 0) {
      console.log(`❌ Aucun étudiant associé au parent: ${user.email}`);
      
      return NextResponse.json({
        success: false,
        error: "Aucun étudiant associé",
        message: "Aucun étudiant n'est associé à votre compte parent.",
        student: {
          studentName: parentData.enfantName,
          studentClass: parentData.filiere,
          studentStatus: "non_associe" as const,
          filiere: parentData.filiere,
          vague: "Non spécifié"
        },
        attendance: [],
        stats: {
          totalClasses: 0,
          present: 0,
          absent: 0,
          justifiedAbsences: 0,
          unjustifiedAbsences: 0,
          attendanceRate: 0
        },
        filters: {
          vagues: [],
          modules: [],
          semestres: []
        }
      }, { status: 404 });
    }

    // Utiliser le premier étudiant associé
    const student = parentData.students[0];
    console.log(`✅ Étudiant trouvé: ${student.user.firstName} ${student.user.lastName}`);

    // Utiliser les présences réelles de la base de données
    const attendanceRecords = student.attendance;
    console.log(`📊 ${attendanceRecords.length} enregistrements de présence réels trouvés`);

    // Si pas de données réelles, retourner un message
    if (attendanceRecords.length === 0) {
      console.log("📋 Aucune donnée de présence trouvée dans la base");
      
      return NextResponse.json({
        success: true,
        student: {
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          studentClass: student.filiere?.nom || parentData.filiere,
          studentStatus: "inscrit" as const,
          filiere: student.filiere?.nom || parentData.filiere,
          vague: student.vague?.nom || "Non spécifié"
        },
        attendance: [],
        stats: {
          totalClasses: 0,
          present: 0,
          absent: 0,
          justifiedAbsences: 0,
          unjustifiedAbsences: 0,
          attendanceRate: 0
        },
        filters: {
          vagues: student.vague?.nom ? [student.vague.nom] : [],
          modules: [],
          semestres: []
        },
        metadata: {
          note: "Aucune donnée de présence enregistrée pour le moment",
          dataSource: "database"
        }
      });
    }

    // Calculer les statistiques avec les données réelles
    const totalClasses = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
    const absentCount = attendanceRecords.filter(record => record.status === 'absent').length;
    const justifiedAbsences = attendanceRecords.filter(record => 
      record.status === 'absent' && record.justified
    ).length;
    const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

    // Formater les données réelles
    const formattedAttendance = attendanceRecords.map(record => ({
      id: record.id,
      date: record.date.toLocaleDateString('fr-FR'),
      day: record.date.toLocaleDateString('fr-FR', { weekday: 'long' }),
      subject: record.subject || record.module?.nom || 'Non spécifié',
      time: record.courseTime,
      teacher: record.teacher ? 
        `${record.teacher.user.firstName} ${record.teacher.user.lastName}` : 
        'Non spécifié',
      status: record.status as "present" | "absent",
      justified: record.justified,
      reason: record.reason || '',
      semestre: record.semester,
      module: record.module?.nom || 'Non spécifié',
      vague: record.vague?.nom || student.vague?.nom || 'Non spécifié'
    }));

    // Récupérer les filtres disponibles depuis les données réelles
    const uniqueVagues = [...new Set(attendanceRecords.map(r => r.vague?.nom).filter(Boolean))] as string[];
    const uniqueModules = [...new Set(attendanceRecords.map(r => r.module?.nom).filter(Boolean))] as string[];
    const uniqueSemestres = [...new Set(attendanceRecords.map(r => r.semester).filter(Boolean))] as string[];

    const responseData = {
      success: true,
      student: {
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        studentClass: student.filiere?.nom || parentData.filiere,
        studentStatus: "inscrit" as const,
        filiere: student.filiere?.nom || parentData.filiere,
        vague: student.vague?.nom || "Non spécifié"
      },
      attendance: formattedAttendance,
      stats: {
        totalClasses,
        present: presentCount,
        absent: absentCount,
        justifiedAbsences,
        unjustifiedAbsences: absentCount - justifiedAbsences,
        attendanceRate
      },
      filters: {
        vagues: uniqueVagues.length > 0 ? uniqueVagues : [student.vague?.nom || "Vague actuelle"],
        modules: uniqueModules.length > 0 ? uniqueModules : ["Tous les modules"],
        semestres: uniqueSemestres.length > 0 ? uniqueSemestres : ["Semestre 1", "Semestre 2"]
      },
      metadata: {
        parentName: `${user.firstName} ${user.lastName}`,
        enfantName: parentData.enfantName,
        generatedAt: new Date().toISOString(),
        recordsCount: formattedAttendance.length,
        dataSource: 'database'
      }
    };

    console.log(`✅ Données réelles préparées - ${formattedAttendance.length} présences, taux: ${attendanceRate}%`);

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("❌ Erreur récupération des absences:", error);
    
    // En cas d'erreur, retourner une erreur claire plutôt que des données fictives
    return NextResponse.json({
      success: false,
      error: "Erreur serveur",
      message: "Impossible de récupérer les données de présence.",
      attendance: [],
      stats: {
        totalClasses: 0,
        present: 0,
        absent: 0,
        justifiedAbsences: 0,
        unjustifiedAbsences: 0,
        attendanceRate: 0
      }
    }, { status: 500 });
  }
}