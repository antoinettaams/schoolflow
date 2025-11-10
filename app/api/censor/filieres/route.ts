// app/api/censor/filieres/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Types pour les données de requête
interface ModuleRequest {
  id?: number;
  name: string;
  coefficient: number;
  type: 'theorique' | 'pratique' | 'mixte' | 'projet';
  description?: string;
  semestreId?: number;
}

interface FiliereRequest {
  id?: number;
  name: string;
  duration: string;
  description?: string;
  vagues: string[];
  modules: ModuleRequest[];
}

interface FiliereResponse {
  id: number;
  name: string;
  duration: string;
  description?: string;
  vagues: Array<{ id: string; name: string }>;
  modules: Array<{
    id: number;
    name: string;
    coefficient: number;
    type: string;
    description?: string;
    semestre?: { id: number; name: string };
  }>;
  totalStudents: number;
  createdAt: string;
}

// Fonction utilitaire pour normaliser les données
function normalizeFiliereData(data: any): FiliereRequest {
  return {
    id: data.id,
    name: data.name?.trim() || '',
    duration: data.duration?.trim() || '',
    description: data.description?.trim() || '',
    vagues: Array.isArray(data.vagues) ? data.vagues : [],
    modules: Array.isArray(data.modules) ? data.modules.map((module: any) => ({
      id: module.id,
      name: module.name?.trim() || '',
      coefficient: Number(module.coefficient) || 1,
      type: module.type || 'theorique',
      description: module.description?.trim() || '',
      semestreId: module.semestreId
    })) : []
  };
}

// ------------------ GET ------------------
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("🔍 [GET] Début de la récupération des filières");
    
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const filieres = await prisma.filiere.findMany({
      include: {
        vaguesPivot: {
          include: {
            vague: {
              select: { id: true, nom: true }
            }
          }
        },
        modules: {
          include: {
            semestre: {
              select: { id: true, nom: true }
            }
          }
        },
        students: {
          select: { id: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`✅ [GET] ${filieres.length} filières trouvées`);

    const filieresFormatted: FiliereResponse[] = filieres.map((filiere) => ({
      id: filiere.id,
      name: filiere.nom,
      duration: filiere.dureeFormation,
      description: filiere.description || undefined,
      vagues: filiere.vaguesPivot.map(vp => ({
        id: vp.vague.id,
        name: vp.vague.nom
      })),
      modules: filiere.modules.map(module => ({
        id: module.id,
        name: module.nom,
        coefficient: module.coefficient,
        type: module.typeModule,
        description: module.description || undefined,
        semestre: module.semestre ? {
          id: module.semestre.id,
          name: module.semestre.nom
        } : undefined
      })),
      totalStudents: filiere.students.length,
      createdAt: filiere.createdAt.toISOString()
    }));

    return NextResponse.json(filieresFormatted);

  } catch (error: unknown) {
    console.error("❌ [GET] Erreur:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ 
      error: "Erreur lors de la récupération des filières",
      details: errorMessage
    }, { status: 500 });
  }
}

// ------------------ POST ------------------
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("🚀 [POST] Début de la création d'une nouvelle filière");
    
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { name, duration, description, vagues, modules } = normalizeFiliereData(body);

    // Validation des champs requis
    if (!name || !duration || vagues.length === 0 || modules.length === 0) {
      return NextResponse.json(
        { error: "Nom, durée, vagues et modules sont requis" }, 
        { status: 400 }
      );
    }

    console.log("🔄 [POST] Début de la création sans transaction...");

    // 1. Vérifier d'abord que les vagues existent
    const existingVagues = await prisma.vague.findMany({
      where: { id: { in: vagues } },
      select: { id: true }
    });

    if (existingVagues.length !== vagues.length) {
      const missingVagues = vagues.filter(id => !existingVagues.find(v => v.id === id));
      return NextResponse.json(
        { error: `Vagues non trouvées: ${missingVagues.join(', ')}` }, 
        { status: 400 }
      );
    }

    // 2. Créer la filière
    const filiere = await prisma.filiere.create({
      data: {
        nom: name,
        dureeFormation: duration,
        description: description || null,
      },
    });

    console.log("✅ [POST] Filière créée:", filiere.id);

    // 3. Créer les relations avec les vagues via VagueFiliere
    if (vagues.length > 0) {
      await prisma.vagueFiliere.createMany({
        data: vagues.map(vagueId => ({
          vagueId: vagueId,
          filiereId: filiere.id
        }))
      });
      console.log("✅ [POST] Relations vagues créées:", vagues.length);
    }

    // 4. Créer les modules
    if (modules.length > 0) {
      const modulesData = modules.map(module => ({
        nom: module.name,
        coefficient: module.coefficient,
        typeModule: module.type,
        description: module.description || null,
        filiereId: filiere.id,
        semestreId: module.semestreId || null
      }));

      await prisma.module.createMany({
        data: modulesData
      });
      console.log("✅ [POST] Modules créés:", modules.length);
    }

    // 5. Récupérer la filière complète avec ses relations
    const filiereComplete = await prisma.filiere.findUnique({
      where: { id: filiere.id },
      include: {
        vaguesPivot: {
          include: {
            vague: { select: { id: true, nom: true } }
          }
        },
        modules: {
          include: {
            semestre: { select: { id: true, nom: true } }
          }
        },
        students: { select: { id: true } }
      }
    });

    if (!filiereComplete) {
      throw new Error("Erreur lors de la récupération de la filière créée");
    }

    // Formatage de la réponse
    const filiereResponse: FiliereResponse = {
      id: filiereComplete.id,
      name: filiereComplete.nom,
      duration: filiereComplete.dureeFormation,
      description: filiereComplete.description || undefined,
      vagues: filiereComplete.vaguesPivot.map(vp => ({
        id: vp.vague.id,
        name: vp.vague.nom
      })),
      modules: filiereComplete.modules.map(module => ({
        id: module.id,
        name: module.nom,
        coefficient: module.coefficient,
        type: module.typeModule,
        description: module.description || undefined,
        semestre: module.semestre ? {
          id: module.semestre.id,
          name: module.semestre.nom
        } : undefined
      })),
      totalStudents: filiereComplete.students.length,
      createdAt: filiereComplete.createdAt.toISOString()
    };

    console.log("🎉 [POST] Filière créée avec succès:", filiereResponse.id);

    return NextResponse.json(filiereResponse, { status: 201 });

  } catch (error: any) {
    console.error("❌ [POST] Erreur lors de la création de la filière:", error);
    
    // Gestion des erreurs Prisma spécifiques
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Une filière avec ce nom existe déjà" }, 
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: "Erreur lors de la création de la filière", details: errorMessage }, 
      { status: 500 }
    );
  }
}

// ------------------ PUT ------------------
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("✏️ [PUT] Début de la modification d'une filière");
    
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📥 [PUT] Données reçues:", body);
    
    const { id, name, duration, description, vagues, modules } = normalizeFiliereData(body);

    // Validation des champs requis
    if (!id || !name || !duration || vagues.length === 0 || modules.length === 0) {
      console.log("❌ [PUT] Champs requis manquants:", { id, name, duration, vagues, modules });
      return NextResponse.json(
        { error: "Tous les champs sont requis" }, 
        { status: 400 }
      );
    }

    // 1. Vérifier que la filière existe
    const existingFiliere = await prisma.filiere.findUnique({
      where: { id }
    });

    if (!existingFiliere) {
      return NextResponse.json({ error: "Filière non trouvée" }, { status: 404 });
    }

    // 2. Vérifier que les vagues existent
    const existingVagues = await prisma.vague.findMany({
      where: { id: { in: vagues } },
      select: { id: true }
    });

    console.log("🔍 [PUT] Vagues demandées:", vagues);
    console.log("🔍 [PUT] Vagues existantes:", existingVagues.map(v => v.id));

    if (existingVagues.length !== vagues.length) {
      const missingVagues = vagues.filter(id => !existingVagues.find(v => v.id === id));
      return NextResponse.json(
        { error: `Vagues non trouvées: ${missingVagues.join(', ')}` }, 
        { status: 400 }
      );
    }

    // 3. Vérifier si des modules existants ont des assignations de planning
    console.log("🔍 [PUT] Vérification des assignations avant suppression des modules...");
    const existingModules = await prisma.module.findMany({
      where: { filiereId: id },
      include: {
        planningAssignations: {
          select: { id: true }
        }
      }
    });

    const modulesWithAssignations = existingModules.filter(
      module => module.planningAssignations.length > 0
    );

    if (modulesWithAssignations.length > 0) {
      const moduleNames = modulesWithAssignations.map(m => m.nom).join(', ');
      return NextResponse.json(
        { 
          error: "Impossible de modifier cette filière car certains modules existants sont utilisés dans des plannings",
          details: `Modules concernés: ${moduleNames}`,
          modules: modulesWithAssignations.map(m => ({ id: m.id, name: m.nom }))
        },
        { status: 400 }
      );
    }

    // 4. Mettre à jour la filière
    const filiere = await prisma.filiere.update({
      where: { id },
      data: {
        nom: name,
        dureeFormation: duration,
        description: description || null,
      },
    });

    console.log("✅ [PUT] Filière mise à jour:", filiere.id);

    // 5. Mettre à jour les relations avec les vagues via VagueFiliere
    // Supprimer les anciennes relations
    await prisma.vagueFiliere.deleteMany({ where: { filiereId: id } });
    
    // Créer les nouvelles relations
    if (vagues.length > 0) {
      await prisma.vagueFiliere.createMany({
        data: vagues.map(vagueId => ({
          vagueId: vagueId,
          filiereId: id
        }))
      });
      console.log("✅ [PUT] Relations vagues mises à jour:", vagues.length);
    }

    // 6. Mettre à jour les modules
    // Supprimer les anciens modules (maintenant qu'on sait qu'il n'y a pas d'assignations)
    await prisma.module.deleteMany({ where: { filiereId: id } });
    console.log("✅ [PUT] Anciens modules supprimés");
    
    // Créer les nouveaux modules
    if (modules.length > 0) {
      const modulesData = modules.map(module => ({
        nom: module.name,
        coefficient: module.coefficient,
        typeModule: module.type,
        description: module.description || null,
        filiereId: id,
        semestreId: module.semestreId || null
      }));

      await prisma.module.createMany({ data: modulesData });
      console.log("✅ [PUT] Nouveaux modules créés:", modules.length);
    }

    // Récupérer la filière complète avec ses relations
    const filiereComplete = await prisma.filiere.findUnique({
      where: { id },
      include: {
        vaguesPivot: {
          include: {
            vague: { select: { id: true, nom: true } }
          }
        },
        modules: {
          include: {
            semestre: { select: { id: true, nom: true } }
          }
        },
        students: { select: { id: true } }
      }
    });

    if (!filiereComplete) {
      throw new Error("Erreur lors de la récupération de la filière mise à jour");
    }

    // Formatage de la réponse
    const filiereResponse: FiliereResponse = {
      id: filiereComplete.id,
      name: filiereComplete.nom,
      duration: filiereComplete.dureeFormation,
      description: filiereComplete.description || undefined,
      vagues: filiereComplete.vaguesPivot.map(vp => ({
        id: vp.vague.id,
        name: vp.vague.nom
      })),
      modules: filiereComplete.modules.map(module => ({
        id: module.id,
        name: module.nom,
        coefficient: module.coefficient,
        type: module.typeModule,
        description: module.description || undefined,
        semestre: module.semestre ? {
          id: module.semestre.id,
          name: module.semestre.nom
        } : undefined
      })),
      totalStudents: filiereComplete.students.length,
      createdAt: filiereComplete.createdAt.toISOString()
    };

    console.log("🎉 [PUT] Filière mise à jour avec succès:", filiereResponse.id);

    return NextResponse.json(filiereResponse);

  } catch (error: any) {
    console.error("❌ [PUT] Erreur lors de la modification de la filière:", error);
    
    // Gestion des erreurs Prisma spécifiques
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Filière non trouvée" }, { status: 404 });
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Une filière avec ce nom existe déjà" }, 
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: "Erreur lors de la modification de la filière", details: errorMessage }, 
      { status: 500 }
    );
  }
}

// ------------------ DELETE ------------------
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    console.log("🗑️ [DELETE] Début de la suppression d'une filière");
    
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const filiereId = parseInt(id);

    // Vérifier que la filière existe
    const existingFiliere = await prisma.filiere.findUnique({
      where: { id: filiereId },
      include: { 
        students: { select: { id: true } },
        modules: {
          include: {
            planningAssignations: {
              select: { id: true }
            }
          }
        }
      }
    });

    if (!existingFiliere) {
      return NextResponse.json({ error: "Filière non trouvée" }, { status: 404 });
    }

    // Vérifier s'il y a des étudiants associés
    if (existingFiliere.students.length > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer cette filière car elle est associée à des étudiants" },
        { status: 400 }
      );
    }

    // CORRECTION CRITIQUE : Vérifier s'il y a des assignations de planning
    const modulesWithAssignations = existingFiliere.modules.filter(
      module => module.planningAssignations.length > 0
    );

    if (modulesWithAssignations.length > 0) {
      const moduleNames = modulesWithAssignations.map(m => m.nom).join(', ');
      return NextResponse.json(
        { 
          error: "Impossible de supprimer cette filière car certains modules sont utilisés dans des plannings",
          details: `Modules concernés: ${moduleNames}`,
          modules: modulesWithAssignations.map(m => ({ id: m.id, name: m.nom }))
        },
        { status: 400 }
      );
    }

    console.log("🔄 [DELETE] Début de la suppression sans transaction...");

    // ÉTAPE 1: Supprimer d'abord les relations avec les vagues
    await prisma.vagueFiliere.deleteMany({ 
      where: { filiereId } 
    });
    console.log("✅ [DELETE] Relations vagues supprimées");

    // ÉTAPE 2: Supprimer les modules (maintenant qu'on sait qu'il n'y a pas d'assignations)
    await prisma.module.deleteMany({ 
      where: { filiereId } 
    });
    console.log("✅ [DELETE] Modules supprimés");

    // ÉTAPE 3: Supprimer la filière
    await prisma.filiere.delete({ 
      where: { id: filiereId } 
    });
    console.log("✅ [DELETE] Filière supprimée");

    console.log("🎉 [DELETE] Filière supprimée avec succès:", filiereId);

    return NextResponse.json({ 
      success: true,
      message: "Filière supprimée avec succès", 
      id: filiereId 
    });

  } catch (error: any) {
    console.error("❌ [DELETE] Erreur lors de la suppression de la filière:", error);
    
    // Gestion des erreurs Prisma spécifiques
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Filière non trouvée" }, { status: 404 });
    }

    if (error.code === "P2003") {
      // Maintenant on sait exactement d'où vient l'erreur
      console.error("🔍 [DELETE] Détails de l'erreur P2003:", error.meta);
      return NextResponse.json(
        { 
          error: "Impossible de supprimer cette filière car elle est liée à d'autres éléments du système",
          details: "Veuillez d'abord supprimer toutes les assignations de planning liées aux modules de cette filière"
        },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la filière", details: errorMessage }, 
      { status: 500 }
    );
  }
}