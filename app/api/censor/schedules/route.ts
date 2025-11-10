// app/api/censor/schedules/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Types pour les données
interface ScheduleSlot {
  day: string;
  startTime: string;
  endTime: string;
  classroom?: string;
}

interface SchedulePeriod {
  startDate: string;
  endDate: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vagueId = searchParams.get('vagueId');
    const filiereId = searchParams.get('filiereId');

    // Construction dynamique du where
    const where: any = {}
    
    if (vagueId && vagueId !== 'all') {
      where.vagueId = vagueId
    }
    
    if (filiereId && filiereId !== 'all') {
      where.filiereId = parseInt(filiereId)
    }

    const planningAssignations = await prisma.planningAssignation.findMany({
      where,
      include: {
        vague: { 
          select: { 
            id: true, 
            nom: true,
            dateDebut: true,
            dateFin: true
          } 
        },
        filiere: { 
          select: { 
            id: true, 
            nom: true 
          } 
        },
        module: { 
          select: { 
            id: true, 
            nom: true,
            coefficient: true,
            typeModule: true
          } 
        },
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formatage de la réponse pour correspondre à l'interface attendue
    const formattedSchedules = planningAssignations.map(assignation => ({
      id: assignation.id,
      vagueId: assignation.vagueId,
      filiereId: assignation.filiereId,
      moduleId: assignation.moduleId,
      teacherId: assignation.teacherId,
      vague: assignation.vague,
      filiere: assignation.filiere,
      module: assignation.module,
      teacher: {
        id: assignation.teacher.user.id,
        firstName: assignation.teacher.user.firstName,
        lastName: assignation.teacher.user.lastName,
        email: assignation.teacher.user.email
      },
      slots: assignation.scheduleSlots as unknown as ScheduleSlot[],
      period: assignation.schedulePeriod as unknown as SchedulePeriod,
      createdAt: assignation.createdAt.toISOString(),
      updatedAt: assignation.updatedAt.toISOString()
    }));

    return NextResponse.json(formattedSchedules);
  } catch (error) {
    console.error("❌ Erreur récupération planning assignations:", error);
    return NextResponse.json(
      { 
        error: "Erreur lors de la récupération des emplois du temps",
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// POST pour créer un nouvel emploi du temps
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { 
      vagueId, 
      filiereId, 
      moduleId, 
      teacherId, 
      period, 
      slots 
    } = body;

    // Validation des données requises
    if (!vagueId || !filiereId || !moduleId || !teacherId || !period || !slots) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que le teacher existe et est bien un enseignant
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true }
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Enseignant non trouvé" },
        { status: 404 }
      );
    }

    // Création de l'assignation planning
    const newAssignation = await prisma.planningAssignation.create({
      data: {
        vagueId,
        filiereId: parseInt(filiereId),
        moduleId: parseInt(moduleId),
        teacherId,
        scheduleSlots: slots as any,
        schedulePeriod: period as any
      },
      include: {
        vague: { 
          select: { 
            id: true, 
            nom: true,
            dateDebut: true,
            dateFin: true
          } 
        },
        filiere: { 
          select: { 
            id: true, 
            nom: true 
          } 
        },
        module: { 
          select: { 
            id: true, 
            nom: true,
            coefficient: true,
            typeModule: true
          } 
        },
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Formatage de la réponse
    const formattedResponse = {
      id: newAssignation.id,
      vagueId: newAssignation.vagueId,
      filiereId: newAssignation.filiereId,
      moduleId: newAssignation.moduleId,
      teacherId: newAssignation.teacherId,
      vague: newAssignation.vague,
      filiere: newAssignation.filiere,
      module: newAssignation.module,
      teacher: {
        id: newAssignation.teacher.user.id,
        firstName: newAssignation.teacher.user.firstName,
        lastName: newAssignation.teacher.user.lastName,
        email: newAssignation.teacher.user.email
      },
      slots: newAssignation.scheduleSlots as unknown as ScheduleSlot[],
      period: newAssignation.schedulePeriod as unknown as SchedulePeriod,
      createdAt: newAssignation.createdAt.toISOString(),
      updatedAt: newAssignation.updatedAt.toISOString()
    };

    return NextResponse.json(formattedResponse, { status: 201 });
  } catch (error) {
    console.error("❌ Erreur création planning assignation:", error);
    return NextResponse.json(
      { 
        error: "Erreur lors de la création de l'emploi du temps",
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}