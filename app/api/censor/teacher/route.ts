// app/api/censor/professeurs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Vérification auth censeur
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const client = await clerkClient();
    const currentUser = await client.users.getUser(userId);
    const userRole = currentUser.publicMetadata?.role as string || "";
    
    const isCenseur = userRole && (
      userRole.toLowerCase().includes("censeur") || 
      userRole === "Censeur"
    );

    if (!isCenseur) {
      return NextResponse.json({ error: "Accès réservé au censeur" }, { status: 403 });
    }

    // Récupérer tous les utilisateurs
    const users = await client.users.getUserList({
      limit: 500
    });

    // Filtrer seulement les enseignants actifs
    const professeursClerk = users.data.filter(user => {
      const role = user.publicMetadata?.role as string;
      const statut = user.publicMetadata?.status as string;
      
      const isTeacher = role && (
        role.toLowerCase().includes("enseignant") || 
        role === "Enseignant" ||
        role.toLowerCase().includes("teacher")
      );
      
      const isActive = statut !== "inactif";
      
      return isTeacher && isActive;
    });

    console.log(`📊 ${professeursClerk.length} professeurs trouvés dans Clerk`);

    // SYNCHRONISATION: Créer les teachers manquants dans la base de données
    const professeursFormatted = await Promise.all(
      professeursClerk.map(async (user) => {
        try {
          // Vérifier si l'user existe déjà dans notre table users
          let dbUser = await prisma.user.findUnique({
            where: { clerkUserId: user.id }
          });

          // Si l'user n'existe pas, le créer
          if (!dbUser) {
            console.log(`➕ Création de l'user pour ${user.firstName} ${user.lastName}`);
            dbUser = await prisma.user.create({
              data: {
                clerkUserId: user.id,
                email: user.emailAddresses[0]?.emailAddress || '',
                role: 'ENSEIGNANT',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phoneNumbers[0]?.phoneNumber || '',
                isActive: true
              }
            });
          }

          // Vérifier si le teacher existe déjà
          let teacher = await prisma.teacher.findUnique({
            where: { userId: dbUser.id }
          });

          // Si le teacher n'existe pas, le créer
          if (!teacher) {
            console.log(`👨‍🏫 Création du teacher pour ${user.firstName} ${user.lastName}`);
            teacher = await prisma.teacher.create({
              data: {
                userId: dbUser.id,
                matiere: (user.publicMetadata?.specialite as string) || "À définir"
              }
            });
          }

          // Retourner les données formatées avec l'ID du teacher
          return {
            id: teacher.id, // ID de la table teachers (pour les assignations)
            clerkId: user.id, // ID Clerk
            userId: dbUser.id, // ID de la table users
            nom: user.lastName || "",
            prenom: user.firstName || "",
            email: user.emailAddresses[0]?.emailAddress || "",
            telephone: user.phoneNumbers[0]?.phoneNumber || "",
            statut: user.publicMetadata?.status || 'actif',
            specialite: user.publicMetadata?.specialite || "",
            matiere: teacher.matiere,
            createdAt: user.createdAt
          };

        } catch (error) {
          console.error(`❌ Erreur synchronisation pour ${user.id}:`, error);
          // Retourner les données de base sans synchronisation en cas d'erreur
          return {
            id: user.id, // Fallback à l'ID Clerk
            clerkId: user.id,
            userId: null,
            nom: user.lastName || "",
            prenom: user.firstName || "",
            email: user.emailAddresses[0]?.emailAddress || "",
            telephone: user.phoneNumbers[0]?.phoneNumber || "",
            statut: user.publicMetadata?.status || 'actif',
            specialite: user.publicMetadata?.specialite || "",
            matiere: "À définir",
            createdAt: user.createdAt,
            error: "Erreur synchronisation"
          };
        }
      })
    );

    console.log(`✅ ${professeursFormatted.length} professeurs synchronisés`);

    return NextResponse.json(professeursFormatted);

  } catch (error: unknown) {
    console.error("❌ Erreur récupération professeurs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des professeurs" },
      { status: 500 }
    );
  }
}