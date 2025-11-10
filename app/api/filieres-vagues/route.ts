// app/api/filieres-vagues/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log("🔍 Début récupération filières et vagues");

    // Récupérer toutes les filières (sans filtre isActive car le champ n'existe pas)
    const filieresWithVagues = await prisma.filiere.findMany({
      include: {
        vaguesPivot: {
          include: {
            vague: {
              select: {
                id: true,
                nom: true,
                dateDebut: true,
                dateFin: true,
                isActive: true // Ce champ existe dans le modèle Vague
              }
            }
          }
        }
      },
      orderBy: {
        nom: 'asc'
      }
    });

    // Récupérer toutes les vagues actives
    const toutesVagues = await prisma.vague.findMany({
      where: { isActive: true }, // Ce champ existe dans Vague
      select: { 
        id: true, 
        nom: true,
        description: true,
        dateDebut: true,
        dateFin: true
      },
      orderBy: {
        dateDebut: 'desc'
      }
    });

    console.log(`📊 ${filieresWithVagues.length} filières trouvées`);
    console.log(`🌊 ${toutesVagues.length} vagues actives trouvées`);

    // Formater les données pour le frontend
    const filieres = filieresWithVagues.map(filiere => ({
      id: filiere.id.toString(),
      name: filiere.nom,
      description: filiere.description,
      duree: filiere.dureeFormation,
      vagues: filiere.vaguesPivot
        .filter(vp => vp.vague !== null && vp.vague.isActive) // Filtrer les vagues actives
        .map(vp => ({
          id: vp.vague!.id,
          name: vp.vague!.nom,
          periode: `${vp.vague!.dateDebut.toLocaleDateString('fr-FR')} - ${vp.vague!.dateFin.toLocaleDateString('fr-FR')}`,
          dateDebut: vp.vague!.dateDebut,
          dateFin: vp.vague!.dateFin
        }))
    }));

    const vagues = toutesVagues.map(vague => ({
      id: vague.id,
      name: vague.nom,
      description: vague.description,
      periode: `${vague.dateDebut.toLocaleDateString('fr-FR')} - ${vague.dateFin.toLocaleDateString('fr-FR')}`,
      dateDebut: vague.dateDebut,
      dateFin: vague.dateFin
    }));

    const response = {
      filieres,
      vagues,
      stats: {
        totalFilieres: filieres.length,
        totalVagues: vagues.length,
        totalVaguesActives: toutesVagues.length
      }
    };

    console.log("✅ Données formatées avec succès");
    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Erreur récupération filières/vagues:", error);
    return NextResponse.json(
      { 
        error: "Erreur serveur lors de la récupération des filières et vagues",
        details: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 }
    );
  }
}