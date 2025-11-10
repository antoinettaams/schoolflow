// app/api/admin/teachers/route.ts - VERSION CORRIGÉE
import { NextResponse } from "next/server";
import { PrismaClient, UserRole } from '@prisma/client';
import { auth, clerkClient } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

// Fonction de synchronisation similaire à celle des étudiants
async function syncTeacherWithPrisma(clerkUser: any) {
  try {
    console.log(`🔄 Synchronisation professeur: ${clerkUser.id} - ${clerkUser.firstName} ${clerkUser.lastName}`);
    
    // RÉCUPÉRATION DES MÉTADONNÉES CLERK - COMME POUR LES ÉTUDIANTS
    const clerkRole = clerkUser.publicMetadata?.role as string;
    const phoneFromClerk = clerkUser.publicMetadata?.phone as string || clerkUser.phoneNumbers[0]?.phoneNumber;
    
    console.log(`📋 Métadonnées Clerk récupérées:`, {
      role: clerkRole,
      phone: phoneFromClerk,
      allMetadata: clerkUser.publicMetadata
    });

    // Vérifier si l'utilisateur existe déjà dans Prisma
    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId: clerkUser.id },
      include: { teacher: true }
    });

    if (existingUser) {
      console.log(`✅ Utilisateur déjà dans Prisma: ${existingUser.id}`);
      
      // Mise à jour du téléphone si nécessaire
      if (phoneFromClerk && phoneFromClerk !== existingUser.phone) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { phone: phoneFromClerk }
        });
        console.log(`📞 Téléphone mis à jour: ${phoneFromClerk}`);
      }
      
      return existingUser;
    }

    // CRÉER UN NOUVEL UTILISATEUR DANS PRISMA
    console.log(`📝 Création nouvel utilisateur dans Prisma...`);
    
    const prismaRole = mapClerkRoleToPrismaRole(clerkRole);
    const firstName = clerkUser.firstName || "Prénom";
    const lastName = clerkUser.lastName || "Nom";
    const email = clerkUser.emailAddresses[0]?.emailAddress || `${clerkUser.id}@no-email.com`;

    // Création de l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        clerkUserId: clerkUser.id,
        firstName: firstName,
        lastName: lastName,
        email: email,
        role: prismaRole,
        phone: phoneFromClerk || null,
        isActive: true,
      }
    });

    console.log(`✅ Utilisateur créé: ${newUser.id}`);

    // CRÉER LE PROFIL PROFESSEUR SI C'EST UN ENSEIGNANT
    if (prismaRole === UserRole.ENSEIGNANT) {
      console.log(`🎓 Création profil professeur...`);
      
      const teacher = await prisma.teacher.create({
        data: {
          userId: newUser.id,
          matiere: clerkUser.publicMetadata?.matiere || "À définir",
        }
      });

      console.log(`✅ Profil professeur créé: ${teacher.id}`);
      return { ...newUser, teacher };
    }

    return newUser;
  } catch (error) {
    console.error(`❌ Erreur synchronisation ${clerkUser.id}:`, error);
    throw error;
  }
}

function mapClerkRoleToPrismaRole(clerkRole: string): UserRole {
  if (!clerkRole) return UserRole.ENSEIGNANT;
  
  const roleLower = clerkRole.toLowerCase();
  
  if (roleLower.includes("admin") || roleLower === "administrateur") {
    return UserRole.ADMIN;
  } else if (roleLower.includes("prof") || roleLower.includes("teacher") || roleLower.includes("enseignant")) {
    return UserRole.ENSEIGNANT;
  } else if (roleLower.includes("student") || roleLower.includes("etudiant") || roleLower.includes("étudiant")) {
    return UserRole.ETUDIANT;
  } else if (roleLower.includes("parent")) {
    return UserRole.PARENT;
  } else {
    return UserRole.ENSEIGNANT;
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier le rôle admin
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId); 
    const userRole = clerkUser.publicMetadata?.role as string;

    const isAdmin = userRole && (
      userRole.toLowerCase().includes("admin") ||
      userRole === "Administrateur"
    );

    if (!isAdmin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // RÉCUPÉRATION DEPUIS CLERK
    console.log("👥 Récupération utilisateurs Clerk...");
    const clerkUsers = await client.users.getUserList({ limit: 100 });
    
    // FILTRER LES PROFESSEURS CLERK
    const teacherClerkUsers = clerkUsers.data.filter(user => {
      const role = user.publicMetadata?.role as string;
      return role && (
        role.toLowerCase().includes("prof") || 
        role.toLowerCase().includes("teacher") || 
        role.toLowerCase().includes("enseignant")
      );
    });

    console.log(`🎓 ${teacherClerkUsers.length} professeurs Clerk trouvés`);

    // SYNCHRONISATION AVEC PRISMA
    console.log("🔄 Synchronisation avec Prisma...");
    await Promise.allSettled(
      teacherClerkUsers.map(user => syncTeacherWithPrisma(user))
    );

    // Récupérer les professeurs avec les relations et infos à jour
    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            createdAt: true,
            isActive: true
          }
        },
        enseignements: {
          include: {
            module: {
              include: {
                filiere: {
                  select: { nom: true }
                }
              }
            },
            salle: {
              select: { nom: true }
            }
          }
        },
        planningAssignations: {
          include: {
            vague: {
              select: { nom: true }
            },
            filiere: {
              select: { nom: true }
            },
            module: {
              select: { nom: true }
            }
          }
        }
      },
      orderBy: {
        user: { lastName: 'asc' }
      }
    });

    const stats = {
      totalTeachers: teachers.length,
      activeTeachers: teachers.filter(t =>
        t.planningAssignations.length > 0 || t.enseignements.length > 0).length,
      pendingTeachers: teachers.filter(t =>
        t.planningAssignations.length === 0 && t.enseignements.length === 0).length,
      totalVagues: new Set(
        teachers.flatMap(t =>
          t.planningAssignations.map(pa => pa.vague.nom)
        )
      ).size
    };

    console.log("✅ Données teachers récupérées:", {
      total: teachers.length,
      avecAssignations: stats.activeTeachers,
      vaguesUniques: stats.totalVagues,
      premierProfesseur: teachers[0] ? {
        nom: `${teachers[0].user.firstName} ${teachers[0].user.lastName}`,
        phone: teachers[0].user.phone,
        enseignements: teachers[0].enseignements.length,
        assignations: teachers[0].planningAssignations.length
      } : 'Aucun professeur'
    });

    return NextResponse.json({ teachers, stats });

  } catch (error) {
    console.error("❌ Erreur récupération professeurs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des professeurs" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userRole = clerkUser.publicMetadata?.role as string;

    const isAdmin = userRole && (
      userRole.toLowerCase().includes("admin") ||
      userRole === "Administrateur"
    );

    if (!isAdmin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('id');

    if (!teacherId) {
      return NextResponse.json({ error: "ID du professeur requis" }, { status: 400 });
    }

    await prisma.teacher.delete({
      where: { id: teacherId }
    });

    return NextResponse.json({
      success: true,
      message: "Professeur supprimé avec succès"
    });

  } catch (error) {
    console.error("❌ Erreur suppression professeur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du professeur" },
      { status: 500 }
    );
  }
}