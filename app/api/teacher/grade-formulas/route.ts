import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Récupérer les formules du professeur
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { user: { clerkUserId } }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Professeur non trouvé" }, { status: 404 });
    }

    const formulas = await prisma.gradeFormula.findMany({
      where: { teacherId: teacher.id },
      orderBy: { createdAt: 'desc' }
    });

    console.log('📊 Formules trouvées:', formulas.length);

    return NextResponse.json({ formulas });

  } catch (error) {
    console.error("❌ Erreur récupération formules:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une nouvelle formule
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { name, formula, description } = body;

    console.log('➕ Création formule:', { name, formula, description });

    if (!name || !formula) {
      return NextResponse.json({ error: "Nom et formule requis" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { user: { clerkUserId } }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Professeur non trouvé" }, { status: 404 });
    }

    const newFormula = await prisma.gradeFormula.create({
      data: {
        name,
        formula,
        description: description || "",
        teacherId: teacher.id
      }
    });

    console.log('✅ Formule créée:', newFormula.id);

    return NextResponse.json({ formula: newFormula });

  } catch (error) {
    console.error("❌ Erreur création formule:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mettre à jour une formule
export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, formula, description } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { user: { clerkUserId } }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Professeur non trouvé" }, { status: 404 });
    }

    const updatedFormula = await prisma.gradeFormula.update({
      where: { id, teacherId: teacher.id },
      data: {
        ...(name && { name }),
        ...(formula && { formula }),
        ...(description !== undefined && { description })
      }
    });

    console.log('✏️ Formule mise à jour:', updatedFormula.id);

    return NextResponse.json({ formula: updatedFormula });

  } catch (error) {
    console.error("❌ Erreur mise à jour formule:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une formule
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findFirst({
      where: { user: { clerkUserId } }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Professeur non trouvé" }, { status: 404 });
    }

    await prisma.gradeFormula.delete({
      where: { id, teacherId: teacher.id }
    });

    console.log('🗑️ Formule supprimée:', id);

    return NextResponse.json({ message: "Formule supprimée" });

  } catch (error) {
    console.error("❌ Erreur suppression formule:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}