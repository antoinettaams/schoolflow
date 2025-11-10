import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient()

// GET - Récupérer tous les événements (accessible à TOUS les rôles)
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const where: any = {}
    
    if (type && type !== 'all') {
      where.type = type
    }

    // Récupérer TOUS les événements (pas de vérification de rôle)
    const events = await prisma.event.findMany({
      where,
      orderBy: { 
        createdAt: 'desc' 
      }
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("❌ Erreur récupération événements:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des événements" },
      { status: 500 }
    );
  }
}