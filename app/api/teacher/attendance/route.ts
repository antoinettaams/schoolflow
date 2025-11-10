import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface StudentAttendance {
  id: string;
  name: string;
  studentId: string;
  status?: "present" | "absent";
  justified?: boolean;
  reason?: string;
  date?: string;
}

interface TeacherCourse {
  id: string;
  assignationId: string;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  className: string;
  filiereId: number;
  vagueId: string;
  students: StudentAttendance[];
  attendanceTaken: boolean;
}

interface AttendanceDetails {
  date: string;
  students: StudentAttendance[];
  course: {
    subject: string;
    className: string;
    schedule: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const date = searchParams.get('date');
    const courseId = searchParams.get('courseId');

    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { user: { clerkUserId } },
      include: { user: true }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Professeur non trouvé" }, { status: 404 });
    }

    // ACTION 1: Récupérer TOUS les cours du professeur via PlanningAssignation
    if (action === 'teacher-courses') {
      console.log('📚 Récupération des cours via PlanningAssignation pour:', teacher.id);
      
      // Récupérer les assignations de planning du professeur
      const planningAssignations = await prisma.planningAssignation.findMany({
        where: { 
          teacherId: teacher.id 
        },
        include: {
          filiere: true,
          vague: true,
          module: true
        },
        distinct: ['filiereId', 'vagueId', 'moduleId']
      });

      console.log('📅 Assignations trouvées:', planningAssignations.length);

      const coursesPromises = planningAssignations.map(async (assignation) => {
        // Récupérer les étudiants de cette filière et vague
        const students = await prisma.student.findMany({
          where: {
            filiereId: assignation.filiereId,
            vagueId: assignation.vagueId
          },
          include: {
            user: { 
              select: { 
                firstName: true, 
                lastName: true 
              } 
            },
            // Récupérer TOUTES les présences pour ce module
            attendance: {
              where: {
                moduleId: assignation.moduleId,
                subject: assignation.module.nom
              },
              orderBy: {
                date: 'desc'
              }
            }
          },
          orderBy: { user: { lastName: 'asc' } }
        });

        console.log(`👥 Étudiants pour ${assignation.module.nom}:`, students.length);

        // Pour chaque étudiant, prendre la dernière présence
        const studentAttendance: StudentAttendance[] = students.map(student => {
          const latestAttendance = student.attendance[0]; // Dernière présence
          
          return {
            id: student.id,
            name: `${student.user.firstName} ${student.user.lastName}`,
            studentId: student.studentNumber,
            status: latestAttendance?.status as "present" | "absent" | undefined,
            justified: latestAttendance?.justified,
            reason: latestAttendance?.reason || "",
            date: latestAttendance?.date ? latestAttendance.date.toISOString().split('T')[0] : undefined
          };
        });

        const attendanceTaken = studentAttendance.some(student => student.status !== undefined);

        // 🔥 UTILISER LES HEURES PAR DÉFAUT - Plus de dépendance à Enseignement
        const course: TeacherCourse = {
          id: `assignation-${assignation.id}`,
          assignationId: assignation.id,
          date: new Date().toISOString().split('T')[0],
          startTime: "08:00", // Heure par défaut
          endTime: "10:00",   // Heure par défaut
          subject: assignation.module.nom,
          className: `${assignation.filiere.nom} - ${assignation.vague.nom}`,
          filiereId: assignation.filiereId,
          vagueId: assignation.vagueId,
          students: studentAttendance,
          attendanceTaken
        };

        console.log(`✅ Cours créé: ${assignation.module.nom} avec ${students.length} étudiants`);

        return course;
      });

      // Attendre toutes les promesses et filtrer les null
      const coursesResults = await Promise.all(coursesPromises);
      const validCourses = coursesResults.filter((course): course is TeacherCourse => course !== null);
      
      validCourses.sort((a, b) => a.subject.localeCompare(b.subject));

      console.log('✅ Cours chargés:', validCourses.length);

      return NextResponse.json({ 
        courses: validCourses,
        totalCourses: validCourses.length
      });
    }

    // ACTION 2: Sauvegarder les présences pour une date spécifique
    if (action === 'save-attendance') {
      const body = await request.json();
      const { courseId, date, students, semester = "t1" } = body;

      if (!courseId || !date || !students) {
        return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
      }

      console.log('💾 Sauvegarde des présences:', {
        courseId,
        date,
        studentsCount: students.length
      });

      // Extraire l'ID de l'assignation
      const assignationId = courseId.replace('assignation-', '');
      
      // Récupérer l'assignation avec toutes les relations
      const assignation = await prisma.planningAssignation.findUnique({
        where: { id: assignationId },
        include: {
          filiere: true,
          vague: true,
          module: true
        }
      });

      if (!assignation) {
        return NextResponse.json({ error: "Assignation non trouvée" }, { status: 404 });
      }

      // VALIDATION : Vérifier qu'il y a des étudiants avec statut
      const validStudents = students.filter((student: any) => 
        student.status && (student.status === "present" || student.status === "absent")
      );
      
      if (validStudents.length === 0) {
        return NextResponse.json({ 
          error: "Aucun étudiant avec un statut valide à sauvegarder" 
        }, { status: 400 });
      }

      // Traiter chaque étudiant
      const results = await Promise.all(
        validStudents.map(async (student: StudentAttendance & { status: "present" | "absent" }) => {
          try {
            // Chercher si une présence existe déjà pour cette date et ce cours
            const existingAttendance = await prisma.attendance.findFirst({
              where: {
                studentId: student.id,
                date: new Date(date),
                moduleId: assignation.moduleId,
                subject: assignation.module.nom
              }
            });

            const attendanceData = {
              status: student.status,
              justified: student.status === "absent" ? (student.justified || false) : false,
              reason: student.status === "absent" ? (student.reason || null) : null,
              subject: assignation.module.nom,
              semester: semester,
              date: new Date(date),
              courseTime: "08:00-10:00", // Heure par défaut
              updatedAt: new Date(),
              // Sauvegarder toutes les relations
              filiereId: assignation.filiereId,
              vagueId: assignation.vagueId,
              moduleId: assignation.moduleId,
              teacherId: teacher.id
            };

            if (existingAttendance) {
              return await prisma.attendance.update({
                where: { id: existingAttendance.id },
                data: attendanceData
              });
            } else {
              return await prisma.attendance.create({
                data: {
                  studentId: student.id,
                  ...attendanceData
                }
              });
            }
          } catch (error) {
            console.error(`❌ Erreur pour l'étudiant ${student.id}:`, error);
            throw error;
          }
        })
      );

      console.log('✅ Présences sauvegardées avec succès:', results.length);

      // Retourner les données mises à jour
      const updatedStudents = await prisma.student.findMany({
        where: {
          filiereId: assignation.filiereId,
          vagueId: assignation.vagueId
        },
        include: {
          user: { select: { firstName: true, lastName: true } },
          // Récupérer TOUTES les présences pour afficher l'historique
          attendance: {
            where: {
              moduleId: assignation.moduleId,
              subject: assignation.module.nom
            },
            orderBy: {
              date: 'desc'
            }
          }
        },
        orderBy: { user: { lastName: 'asc' } }
      });

      const updatedStudentAttendance: StudentAttendance[] = updatedStudents.map(student => {
        const latestAttendance = student.attendance[0];
        return {
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          studentId: student.studentNumber,
          status: latestAttendance?.status as "present" | "absent" | undefined,
          justified: latestAttendance?.justified,
          reason: latestAttendance?.reason || "",
          date: latestAttendance?.date ? latestAttendance.date.toISOString().split('T')[0] : undefined
        };
      });

      return NextResponse.json({ 
        message: "Présences sauvegardées avec succès",
        savedCount: results.length,
        updatedCourse: {
          id: courseId,
          students: updatedStudentAttendance,
          attendanceTaken: updatedStudentAttendance.some(student => student.status !== undefined)
        }
      });
    }

    // ACTION 3: Récupérer l'historique des présences d'un cours
    if (action === 'attendance-history' && courseId) {
      const assignationId = courseId.replace('assignation-', '');
      
      const assignation = await prisma.planningAssignation.findUnique({
        where: { id: assignationId },
        include: {
          filiere: true,
          vague: true,
          module: true
        }
      });

      if (!assignation) {
        return NextResponse.json({ error: "Assignation non trouvée" }, { status: 404 });
      }

      // Récupérer toutes les dates où des présences ont été prises pour ce cours
      const attendanceDates = await prisma.attendance.findMany({
        where: {
          moduleId: assignation.moduleId,
          subject: assignation.module.nom,
          teacherId: teacher.id
        },
        distinct: ['date'],
        select: {
          date: true
        },
        orderBy: {
          date: 'desc'
        }
      });

      return NextResponse.json({
        dates: attendanceDates.map(a => a.date.toISOString().split('T')[0]),
        course: {
          subject: assignation.module.nom,
          className: `${assignation.filiere.nom} - ${assignation.vague.nom}`,
          schedule: "08:00-10:00" // Heure par défaut
        }
      });
    }

    // ACTION 4: Récupérer les détails des présences pour une date spécifique
    if (action === 'attendance-by-date' && courseId && date) {
      const assignationId = courseId.replace('assignation-', '');
      
      const assignation = await prisma.planningAssignation.findUnique({
        where: { id: assignationId },
        include: {
          filiere: true,
          vague: true,
          module: true
        }
      });

      if (!assignation) {
        return NextResponse.json({ error: "Assignation non trouvée" }, { status: 404 });
      }

      // Récupérer les étudiants avec leurs présences pour la date spécifique
      const students = await prisma.student.findMany({
        where: {
          filiereId: assignation.filiereId,
          vagueId: assignation.vagueId
        },
        include: {
          user: { 
            select: { 
              firstName: true, 
              lastName: true 
            } 
          },
          attendance: {
            where: {
              moduleId: assignation.moduleId,
              subject: assignation.module.nom,
              date: new Date(date)
            }
          }
        },
        orderBy: { user: { lastName: 'asc' } }
      });

      const studentAttendance: StudentAttendance[] = students.map(student => {
        const attendance = student.attendance[0]; // Présence pour cette date spécifique
        
        return {
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          studentId: student.studentNumber,
          status: attendance?.status as "present" | "absent" | undefined,
          justified: attendance?.justified,
          reason: attendance?.reason || "",
          date: attendance?.date ? attendance.date.toISOString().split('T')[0] : undefined
        };
      });

      const attendanceDetails: AttendanceDetails = {
        date: date,
        students: studentAttendance,
        course: {
          subject: assignation.module.nom,
          className: `${assignation.filiere.nom} - ${assignation.vague.nom}`,
          schedule: "08:00-10:00"
        }
      };

      return NextResponse.json(attendanceDetails);
    }

    return NextResponse.json({ error: "Action non valide" }, { status: 400 });

  } catch (error) {
    console.error("❌ Erreur API attendance:", error);
    return NextResponse.json({ 
      error: "Erreur serveur lors du traitement",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { user: { clerkUserId } },
      include: { user: true }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Professeur non trouvé" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // ACTION: Sauvegarder les présences (identique à GET pour la compatibilité)
    if (action === 'save-attendance') {
      return await GET(request);
    }

    return NextResponse.json({ error: "Action non valide" }, { status: 400 });

  } catch (error) {
    console.error("❌ Erreur API POST attendance:", error);
    return NextResponse.json({ 
      error: "Erreur serveur lors du traitement",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const courseId = searchParams.get('courseId');
    const date = searchParams.get('date');

    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { user: { clerkUserId } },
      include: { user: true }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Professeur non trouvé" }, { status: 404 });
    }

    // ACTION: Supprimer les présences d'une date spécifique
    if (action === 'delete-attendance' && courseId && date) {
      const assignationId = courseId.replace('assignation-', '');
      
      // Vérifier que l'assignation appartient bien au professeur
      const assignation = await prisma.planningAssignation.findFirst({
        where: { 
          id: assignationId,
          teacherId: teacher.id 
        },
        include: {
          module: true
        }
      });

      if (!assignation) {
        return NextResponse.json({ error: "Assignation non trouvée ou non autorisée" }, { status: 404 });
      }

      // Supprimer toutes les présences pour cette date, ce module et ce professeur
      const deleteResult = await prisma.attendance.deleteMany({
        where: {
          moduleId: assignation.moduleId,
          subject: assignation.module.nom,
          teacherId: teacher.id,
          date: new Date(date)
        }
      });

      console.log(`🗑️ Présences supprimées: ${deleteResult.count} pour le ${date}`);

      return NextResponse.json({
        message: `Présences du ${date} supprimées avec succès`,
        deletedCount: deleteResult.count
      });
    }

    return NextResponse.json({ error: "Action non valide" }, { status: 400 });

  } catch (error) {
    console.error("❌ Erreur API DELETE attendance:", error);
    return NextResponse.json({ 
      error: "Erreur lors de la suppression des présences",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}