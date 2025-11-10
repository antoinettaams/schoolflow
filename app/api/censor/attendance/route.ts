// app/api/censor/attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) { 
  try {
    const { userId: clerkUserId } = await auth();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log('🔍 Vérification des droits pour:', clerkUserId);

    // Vérifier si l'utilisateur a le rôle CENSEUR ou ADMIN
    const user = await prisma.user.findFirst({
      where: { 
        clerkUserId,
        role: {
          in: ["CENSEUR", "ADMIN"]
        }
      },
      select: { 
        id: true, 
        role: true, 
        firstName: true, 
        lastName: true 
      }
    });

    if (!user) {
      return NextResponse.json({ 
        error: "Accès non autorisé. Rôle CENSEUR ou ADMIN requis." 
      }, { status: 403 });
    }

    console.log('✅ Accès autorisé pour:', user.firstName, user.lastName, '- Rôle:', user.role);

    if (action === 'all-records') {
      try {
        // Récupérer toutes les présences avec les relations
        const attendanceRecords = await prisma.attendance.findMany({
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
          take: 500 // Réduit pour les tests
        });

        console.log('📊 Nombre de présences récupérées:', attendanceRecords.length);

        // Formater les données
        const formattedRecords = attendanceRecords.map(record => {
          const courseTime = record.courseTime || "08:00-10:00";
          const [startTime, endTime] = courseTime.split('-');

          return {
            id: record.id,
            date: record.date.toISOString(),
            student: {
              id: record.student.id,
              name: `${record.student.user.firstName} ${record.student.user.lastName}`,
              studentId: record.student.studentNumber
            },
            teacher: {
              id: record.teacher.id,
              name: `${record.teacher.user.firstName} ${record.teacher.user.lastName}`
            },
            course: {
              subject: record.subject,
              className: `${record.filiere?.nom || 'Non assigné'} - ${record.vague?.nom || 'Non assigné'}`,
              filiere: record.filiere?.nom || 'Non assigné',
              vague: record.vague?.nom || 'Non assigné',
              startTime: startTime || "08:00",
              endTime: endTime || "10:00"
            },
            status: record.status as "present" | "absent",
            justified: record.justified,
            reason: record.reason || undefined,
            semester: record.semester
          };
        });

        return NextResponse.json({
          success: true,
          records: formattedRecords,
          total: formattedRecords.length,
          message: `${formattedRecords.length} enregistrements chargés`
        });

      } catch (dbError) {
        console.error('❌ Erreur base de données:', dbError);
        return NextResponse.json({
          error: "Erreur lors de l'accès aux données",
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        }, { status: 500 });
      }
    }

    // ACTION: Statistiques
    if (action === 'stats') {
      try {
        const totalRecords = await prisma.attendance.count();
        const presents = await prisma.attendance.count({
          where: { status: "present" }
        });
        const absents = await prisma.attendance.count({
          where: { status: "absent" }
        });
        const justified = await prisma.attendance.count({
          where: { 
            status: "absent",
            justified: true
          }
        });
        const unjustified = await prisma.attendance.count({
          where: { 
            status: "absent",
            justified: false
          }
        });

        return NextResponse.json({
          success: true,
          stats: {
            total: totalRecords,
            presents,
            absents,
            justified,
            unjustified
          }
        });
      } catch (error) {
        console.error('❌ Erreur statistiques:', error);
        return NextResponse.json({
          error: "Erreur lors du calcul des statistiques"
        }, { status: 500 });
      }
    }

    // ACTION: Options de filtre
    if (action === 'filter-options') {
      try {
        const filieres = await prisma.filiere.findMany({
          select: { nom: true }
        });
        
        const vagues = await prisma.vague.findMany({
          select: { nom: true }
        });
        
        const modules = await prisma.attendance.findMany({
          distinct: ['subject'],
          select: { subject: true },
          where: {
            subject: {
              not: null
            }
          }
        });
        
        const teachers = await prisma.teacher.findMany({
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        });

        return NextResponse.json({
          success: true,
          filieres: filieres.map(f => f.nom),
          vagues: vagues.map(v => v.nom),
          modules: modules.map(m => m.subject).filter(Boolean),
          teachers: teachers.map(t => `${t.user.firstName} ${t.user.lastName}`)
        });
      } catch (error) {
        console.error('❌ Erreur options filtre:', error);
        return NextResponse.json({
          error: "Erreur lors du chargement des options"
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      error: "Action non valide",
      availableActions: ['all-records', 'stats', 'filter-options']
    }, { status: 400 });

  } catch (error) {
    console.error("❌ Erreur API censor attendance:", error);
    return NextResponse.json({ 
      error: "Erreur serveur interne",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}