import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
  status: "active" | "upcoming" | "completed";
  description: string;
  filieres: Array<{ id: string; name: string }>;
  totalEtudiants: number;
  totalFormateurs: number;
  semestres: string[];
}

// Fonction utilitaire pour déterminer le statut
function getVagueStatus(dateDebut: Date, dateFin: Date): "active" | "upcoming" | "completed" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(dateDebut);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(dateFin);
  end.setHours(23, 59, 59, 999);

  if (today < start) return "upcoming";
  if (today > end) return "completed";
  return "active";
}

// ------------------ GET ------------------
export async function GET(): Promise<NextResponse> {
  try {
    console.log("🔍 [GET] Début de la récupération des vagues");
    
    // Authentification
    const { userId } = await auth();
    console.log("👤 [GET] User ID:", userId);
    
    if (!userId) {
      console.log("❌ [GET] Utilisateur non authentifié");
      return NextResponse.json(
        { error: "Non authentifié" }, 
        { status: 401 }
      );
    }

    // Récupération des données avec les relations CORRIGÉES
    console.log("📦 [GET] Récupération des vagues depuis la base de données...");
    const vagues = await prisma.vague.findMany({
      include: {
        students: {
          select: { id: true }
        },
        filieresPivot: {
          include: {
            filiere: {
              select: { id: true, nom: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`✅ [GET] ${vagues.length} vagues trouvées dans la base`);

    // Si aucune vague n'est créée, retourner un tableau vide
    if (vagues.length === 0) {
      console.log("ℹ️ [GET] Aucune vague créée - retour d'un tableau vide");
      return NextResponse.json([]);
    }

    // Formatage des données
    const vaguesFormatted: VagueResponse[] = vagues.map((vague) => {
      const formattedVague: VagueResponse = {
        id: vague.id,
        name: vague.nom,
        startDate: vague.dateDebut.toISOString().split("T")[0],
        endDate: vague.dateFin.toISOString().split("T")[0],
        status: getVagueStatus(vague.dateDebut, vague.dateFin),
        description: vague.description || "",
        filieres: vague.filieresPivot?.map((vp) => ({
          id: vp.filiere.id.toString(),
          name: vp.filiere.nom,
        })) || [],
        totalEtudiants: vague.students?.length || 0,
        totalFormateurs: 0, // À adapter selon votre modèle
        semestres: vague.semestres ? vague.semestres.split(",").filter(Boolean) : [],
      };

      console.log(`📝 [GET] Vague formatée: ${formattedVague.name} (${formattedVague.id})`);
      return formattedVague;
    });

    console.log("✅ [GET] Toutes les vagues ont été formatées avec succès");
    
    return NextResponse.json(vaguesFormatted);

  } catch (error: unknown) {
    console.error("❌ [GET] Erreur lors de la récupération des vagues:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    
    console.error("📝 [GET] Détails de l'erreur:", errorMessage);

    // Si c'est une erreur de table inexistante (premier démarrage), retourner un tableau vide
    if (errorMessage.includes("does not exist") || (error as any).code === "P2021") {
      console.log("ℹ️ [GET] La table vagues n'existe pas encore - retour d'un tableau vide");
      return NextResponse.json([]);
    }

    return NextResponse.json(
      { 
        error: "Erreur lors de la récupération des vagues",
        details: errorMessage
      }, 
      { status: 500 }
    );
  }
}

// ------------------ POST ------------------
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("🚀 [POST] Début de la création d'une nouvelle vague");
    
    // Authentification
    const { userId } = await auth();
    console.log("👤 [POST] User ID:", userId);
    
    if (!userId) {
      console.log("❌ [POST] Utilisateur non authentifié");
      return NextResponse.json(
        { error: "Non authentifié" }, 
        { status: 401 }
      );
    }

    // Validation des données
    const body: VagueRequest = await req.json();
    console.log("📥 [POST] Données reçues:", body);

    const { name, startDate, endDate, description, semestres } = body;

    // Validation des champs requis
    if (!name?.trim() || !startDate || !endDate || !semestres) {
      console.log("❌ [POST] Champs requis manquants:", { 
        name: !!name?.trim(), 
        startDate: !!startDate, 
        endDate: !!endDate, 
        semestres: !!semestres 
      });
      return NextResponse.json(
        { error: "Nom, dates et semestres sont requis" }, 
        { status: 400 }
      );
    }

    // Validation des dates
    const dateDebut = new Date(startDate);
    const dateFin = new Date(endDate);
    
    if (isNaN(dateDebut.getTime()) || isNaN(dateFin.getTime())) {
      console.log("❌ [POST] Dates invalides:", { dateDebut, dateFin });
      return NextResponse.json(
        { error: "Les dates fournies sont invalides" }, 
        { status: 400 }
      );
    }

    if (dateDebut >= dateFin) {
      console.log("❌ [POST] Date de fin antérieure à la date de début");
      return NextResponse.json(
        { error: "La date de fin doit être postérieure à la date de début" }, 
        { status: 400 }
      );
    }

    // Formatage des semestres
    const semestresArray = Array.isArray(semestres) ? semestres : [semestres];
    const semestresFormatted = semestresArray
      .map((s) => String(s).trim())
      .filter(Boolean);

    if (semestresFormatted.length === 0) {
      console.log("❌ [POST] Aucun semestre valide fourni");
      return NextResponse.json(
        { error: "Au moins un semestre valide est requis" }, 
        { status: 400 }
      );
    }

    console.log("📝 [POST] Données validées:", {
      name: name.trim(),
      dateDebut,
      dateFin,
      description: description?.trim() || null,
      semestres: semestresFormatted
    });

    // Création dans la base de données
    console.log("💾 [POST] Création de la vague dans la base de données...");
    
    const vague = await prisma.vague.create({
      data: {
        nom: name.trim(),
        description: description?.trim() || null,
        semestres: semestresFormatted.join(","),
        dateDebut,
        dateFin,
        isActive: true,
      },
    });

    console.log("✅ [POST] Vague créée avec succès:", vague.id);

    // Formatage de la réponse
    const vagueResponse: VagueResponse = {
      id: vague.id,
      name: vague.nom,
      startDate: vague.dateDebut.toISOString().split("T")[0],
      endDate: vague.dateFin.toISOString().split("T")[0],
      status: getVagueStatus(vague.dateDebut, vague.dateFin),
      description: vague.description || "",
      filieres: [], // Initialement vide, vous pouvez ajouter des filières plus tard
      totalEtudiants: 0,
      totalFormateurs: 0,
      semestres: vague.semestres ? vague.semestres.split(",").filter(Boolean) : [],
    };

    console.log("🎉 [POST] Vague créée avec succès:", vagueResponse);

    return NextResponse.json(vagueResponse, { status: 201 });

  } catch (error: any) {
    console.error("❌ [POST] Erreur lors de la création de la vague:", error);
    
    // Gestion des erreurs Prisma spécifiques
    if (error.code === "P2002") {
      console.log("❌ [POST] Erreur de contrainte d'unicité");
      return NextResponse.json(
        { error: "Une vague avec ce nom existe déjà" }, 
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    
    return NextResponse.json(
      { 
        error: "Erreur lors de la création de la vague",
        details: errorMessage
      }, 
      { status: 500 }
    );
  }
}

// ------------------ PUT ------------------
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("✏️ [PUT] Début de la modification d'une vague");
    
    // Authentification
    const { userId } = await auth();
    console.log("👤 [PUT] User ID:", userId);
    
    if (!userId) {
      console.log("❌ [PUT] Utilisateur non authentifié");
      return NextResponse.json(
        { error: "Non authentifié" }, 
        { status: 401 }
      );
    }

    // Validation des données
    const body: VagueRequest = await req.json();
    console.log("📥 [PUT] Données reçues:", body);

    const { id, name, startDate, endDate, description, semestres } = body;

    // Validation des champs requis
    if (!id || !name?.trim() || !startDate || !endDate || !semestres) {
      console.log("❌ [PUT] Champs requis manquants");
      return NextResponse.json(
        { 
          error: "Tous les champs sont requis",
          details: {
            id: !!id,
            name: !!name?.trim(),
            startDate: !!startDate,
            endDate: !!endDate,
            semestres: !!semestres
          }
        }, 
        { status: 400 }
      );
    }

    // Validation des dates
    const dateDebut = new Date(startDate);
    const dateFin = new Date(endDate);
    
    if (isNaN(dateDebut.getTime()) || isNaN(dateFin.getTime())) {
      console.log("❌ [PUT] Dates invalides");
      return NextResponse.json(
        { error: "Les dates fournies sont invalides" }, 
        { status: 400 }
      );
    }

    if (dateDebut >= dateFin) {
      console.log("❌ [PUT] Date de fin antérieure à la date de début");
      return NextResponse.json(
        { error: "La date de fin doit être postérieure à la date de début" }, 
        { status: 400 }
      );
    }

    // Formatage des semestres
    const semestresArray = Array.isArray(semestres) ? semestres : [semestres];
    const semestresFormatted = semestresArray
      .map((s) => String(s).trim())
      .filter(Boolean);

    if (semestresFormatted.length === 0) {
      console.log("❌ [PUT] Aucun semestre valide fourni");
      return NextResponse.json(
        { error: "Au moins un semestre valide est requis" }, 
        { status: 400 }
      );
    }

    console.log("📝 [PUT] Données validées pour la mise à jour:", {
      id,
      name: name.trim(),
      dateDebut,
      dateFin,
      description: description?.trim() || null,
      semestres: semestresFormatted
    });

    // Mise à jour dans la base de données
    console.log("💾 [PUT] Mise à jour de la vague dans la base de données...");
    
    const vague = await prisma.vague.update({
      where: { id },
      data: {
        nom: name.trim(),
        description: description?.trim() || null,
        semestres: semestresFormatted.join(","),
        dateDebut,
        dateFin,
      },
    });

    console.log("✅ [PUT] Vague mise à jour avec succès:", vague.id);

    // Formatage de la réponse
    const vagueResponse: VagueResponse = {
      id: vague.id,
      name: vague.nom,
      startDate: vague.dateDebut.toISOString().split("T")[0],
      endDate: vague.dateFin.toISOString().split("T")[0],
      status: getVagueStatus(vague.dateDebut, vague.dateFin),
      description: vague.description || "",
      filieres: [],
      totalEtudiants: 0,
      totalFormateurs: 0,
      semestres: vague.semestres ? vague.semestres.split(",").filter(Boolean) : [],
    };

    console.log("🎉 [PUT] Vague mise à jour avec succès:", vagueResponse);

    return NextResponse.json(vagueResponse);

  } catch (error: any) {
    console.error("❌ [PUT] Erreur lors de la modification de la vague:", error);
    
    // Gestion des erreurs Prisma spécifiques
    if (error.code === "P2025") {
      console.log("❌ [PUT] Vague non trouvée");
      return NextResponse.json(
        { error: "Vague non trouvée" }, 
        { status: 404 }
      );
    }

    if (error.code === "P2002") {
      console.log("❌ [PUT] Erreur de contrainte d'unicité");
      return NextResponse.json(
        { error: "Une vague avec ce nom existe déjà" }, 
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    
    return NextResponse.json(
      { 
        error: "Erreur lors de la modification de la vague",
        details: errorMessage
      }, 
      { status: 500 }
    );
  }
}

// ------------------ DELETE ------------------
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("🗑️ [DELETE] Début de la suppression d'une vague");
    
    // Authentification
    const { userId } = await auth();
    console.log("👤 [DELETE] User ID:", userId);
    
    if (!userId) {
      console.log("❌ [DELETE] Utilisateur non authentifié");
      return NextResponse.json(
        { error: "Non authentifié" }, 
        { status: 401 }
      );
    }

    // Récupération de l'ID
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    console.log("📋 [DELETE] ID à supprimer:", id);

    if (!id) {
      console.log("❌ [DELETE] ID manquant");
      return NextResponse.json(
        { error: "ID requis" }, 
        { status: 400 }
      );
    }

    // Suppression dans la base de données
    console.log("💾 [DELETE] Suppression de la vague dans la base de données...");
    
    const deletedVague = await prisma.vague.delete({ 
      where: { id } 
    });

    console.log("✅ [DELETE] Vague supprimée avec succès:", deletedVague.id);

    return NextResponse.json({ 
      success: true,
      message: "Vague supprimée avec succès", 
      id: deletedVague.id 
    });

  } catch (error: any) {
    console.error("❌ [DELETE] Erreur lors de la suppression de la vague:", error);
    
    // Gestion des erreurs Prisma spécifiques
    if (error.code === "P2025") {
      console.log("❌ [DELETE] Vague non trouvée");
      return NextResponse.json(
        { error: "Vague non trouvée" }, 
        { status: 404 }
      );
    }

    if (error.code === "P2003") {
      console.log("❌ [DELETE] Contrainte de clé étrangère");
      return NextResponse.json(
        { error: "Impossible de supprimer cette vague car elle est liée à d'autres éléments" },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    
    return NextResponse.json(
      { 
        error: "Erreur lors de la suppression de la vague",
        details: errorMessage
      }, 
      { status: 500 }
    );
  }
}