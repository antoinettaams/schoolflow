// app/api/censor/vagues/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Types pour les données de requête
interface VagueRequest {
  id?: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  semestres: string[] | string;
}

interface VagueResponse {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  description: string;
  filieres: Array<{ id: string; name: string }>;
  totalEtudiants: number;
  totalFormateurs: number;
  semestres: string[];
}

// ✅ Fonction utilitaire pour déterminer le statut
function getVagueStatus(dateDebut: Date, dateFin: Date): string {
  const today = new Date();
  if (today < dateDebut) return "upcoming";
  if (today > dateFin) return "completed";
  return "active";
}

// ------------------ GET ------------------
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // ✅ CORRECTION : Utiliser uniquement les champs existants dans votre schéma
    const vagues = await prisma.vague.findMany({
      // Supprimer les relations qui n'existent pas
      // include: {
      //   students: true,
      //   filieresPivot: { include: { filiere: true } },
      // },
      orderBy: { createdAt: "desc" },
    });

    const vaguesFormatted: VagueResponse[] = vagues.map((vague) => ({
      id: vague.id,
      name: vague.nom,
      startDate: vague.dateDebut.toISOString().split("T")[0],
      endDate: vague.dateFin.toISOString().split("T")[0],
      status: getVagueStatus(vague.dateDebut, vague.dateFin),
      description: vague.description || "",
      filieres: [], // ✅ CORRECTION : Tableau vide car pas de relation filières
      totalEtudiants: 0, // ✅ CORRECTION : 0 car pas de relation students
      totalFormateurs: 0,
      semestres: vague.semestres ? vague.semestres.split(",") : [],
    }));

    return NextResponse.json(vaguesFormatted);
  } catch (error: unknown) {
    console.error("Erreur récupération vagues:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des vagues" },
      { status: 500 }
    );
  }
}

// ------------------ POST ------------------
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { name, startDate, endDate, description, semestres }: VagueRequest = await req.json();

    // Validation
    if (!name || !startDate || !endDate || !semestres) {
      return NextResponse.json(
        { error: "Nom, dates et semestres sont requis" },
        { status: 400 }
      );
    }

    const dateDebut = new Date(startDate);
    const dateFin = new Date(endDate);
    if (dateDebut >= dateFin) {
      return NextResponse.json(
        { error: "La date de fin doit être postérieure à la date de début" },
        { status: 400 }
      );
    }

    const semestresArray = Array.isArray(semestres) ? semestres : [semestres];
    const semestresFormatted = semestresArray.map((s) => String(s));

    // ✅ CORRECTION : Création simple sans relations
    const vague = await prisma.vague.create({
      data: {
        nom: name,
        description: description || null,
        semestres: semestresFormatted.join(","),
        dateDebut,
        dateFin,
        isActive: true,
      },
      // Supprimer les includes qui n'existent pas
    });

    const vagueResponse: VagueResponse = {
      id: vague.id,
      name: vague.nom,
      startDate: vague.dateDebut.toISOString().split("T")[0],
      endDate: vague.dateFin.toISOString().split("T")[0],
      status: getVagueStatus(vague.dateDebut, vague.dateFin),
      description: vague.description || "",
      filieres: [], // ✅ CORRECTION : Tableau vide
      totalEtudiants: 0, // ✅ CORRECTION : 0
      totalFormateurs: 0,
      semestres: vague.semestres ? vague.semestres.split(",") : [],
    };

    return NextResponse.json(vagueResponse);
  } catch (error: any) {
    console.error("Erreur création vague:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Une vague avec ce nom existe déjà" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur lors de la création de la vague" }, { status: 500 });
  }
}

// ------------------ PUT ------------------
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id, name, startDate, endDate, description, semestres }: VagueRequest = await req.json();

    if (!id || !name || !startDate || !endDate || !semestres) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    const dateDebut = new Date(startDate);
    const dateFin = new Date(endDate);
    if (dateDebut >= dateFin) {
      return NextResponse.json(
        { error: "La date de fin doit être postérieure à la date de début" },
        { status: 400 }
      );
    }

    const semestresArray = Array.isArray(semestres) ? semestres : [semestres];
    const semestresFormatted = semestresArray.map((s) => String(s));

    // ✅ CORRECTION : Mise à jour simple sans relations
    const vague = await prisma.vague.update({
      where: { id },
      data: {
        nom: name,
        description: description || null,
        semestres: semestresFormatted.join(","),
        dateDebut,
        dateFin,
      },
      // Supprimer les includes qui n'existent pas
    });

    const vagueResponse: VagueResponse = {
      id: vague.id,
      name: vague.nom,
      startDate: vague.dateDebut.toISOString().split("T")[0],
      endDate: vague.dateFin.toISOString().split("T")[0],
      status: getVagueStatus(vague.dateDebut, vague.dateFin),
      description: vague.description || "",
      filieres: [], // ✅ CORRECTION : Tableau vide
      totalEtudiants: 0, // ✅ CORRECTION : 0
      totalFormateurs: 0,
      semestres: vague.semestres ? vague.semestres.split(",") : [],
    };

    return NextResponse.json(vagueResponse);
  } catch (error: any) {
    console.error("Erreur modification vague:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Vague non trouvée" }, { status: 404 });
    }
    return NextResponse.json({ error: "Erreur lors de la modification de la vague" }, { status: 500 });
  }
}

// ------------------ DELETE ------------------
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    await prisma.vague.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Vague supprimée avec succès" });
  } catch (error: any) {
    console.error("Erreur suppression vague:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Vague non trouvée" }, { status: 404 });
    }
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Impossible de supprimer cette vague car elle est liée à d'autres éléments" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Erreur lors de la suppression de la vague" }, { status: 500 });
  }
}