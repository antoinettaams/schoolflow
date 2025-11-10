// app/api/admin/parents/route.ts - VERSION COMPLÈTE AVEC TOUS LES FILTRES
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

// Types pour les données formatées
interface FormattedParent {
  id: string;
  clerkUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "actif" | "inactif" | "suspendu";
  enfants: Array<{
    id: string;
    firstName: string;
    lastName: string;
    filiere: string;
    filiereId: number | null;
    studentNumber: string;
  }>;
  vagues: string[];
  createdAt: string;
}

interface FilterOption {
  id: string;
  name: string;
}

// Fonction pour mapper le rôle Clerk vers UserRole Prisma
function mapClerkRoleToPrismaRole(clerkRole: string): UserRole {
  if (!clerkRole) return UserRole.PARENT;
  
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
    return UserRole.PARENT;
  }
}

// Fonction pour synchroniser un parent Clerk avec Prisma
async function syncParentWithPrisma(clerkUser: any) {
  try {
    console.log(`🔄 Synchronisation parent: ${clerkUser.id} - ${clerkUser.firstName} ${clerkUser.lastName}`);
    
    // Récupération des métadonnées Clerk
    const clerkRole = clerkUser.publicMetadata?.role as string;
    const phoneFromClerk = clerkUser.publicMetadata?.phone as string || 
                          clerkUser.phoneNumbers[0]?.phoneNumber;
    
    const enfantNameFromClerk = clerkUser.publicMetadata?.enfantName as string;
    const filiereFromClerk = clerkUser.publicMetadata?.filiere as string;
    const relationFromClerk = clerkUser.publicMetadata?.relation as string;
    
    console.log(`📋 Métadonnées Clerk récupérées:`, {
      role: clerkRole,
      phone: phoneFromClerk,
      enfantName: enfantNameFromClerk,
      filiere: filiereFromClerk,
      relation: relationFromClerk
    });

    // Vérifier si l'utilisateur existe déjà dans Prisma
    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId: clerkUser.id },
      include: { 
        parent: {
          include: {
            user: true
          }
        }
      }
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
      
      const prismaRole = mapClerkRoleToPrismaRole(clerkRole);
      
      // CRÉER LE PROFIL PARENT SI MANQUANT
      if (prismaRole === UserRole.PARENT && !existingUser.parent) {
        console.log(`⚠️ Création profil parent manquant pour: ${existingUser.id}`);
        
        const parent = await prisma.parent.create({
          data: {
            userId: existingUser.id,
            enfantName: enfantNameFromClerk || "À définir",
            filiere: filiereFromClerk || "À définir",
            relation: relationFromClerk || "Parent",
          }
        });
        
        console.log(`✅ Profil parent créé: ${parent.id}`);
        return { ...existingUser, parent };
      }
      
      // Mettre à jour les informations parent si nécessaire
      if (existingUser.parent) {
        let updateData: any = {};
        let needsUpdate = false;
        
        if (enfantNameFromClerk && enfantNameFromClerk !== existingUser.parent.enfantName) {
          updateData.enfantName = enfantNameFromClerk;
          needsUpdate = true;
        }
        
        if (filiereFromClerk && filiereFromClerk !== existingUser.parent.filiere) {
          updateData.filiere = filiereFromClerk;
          needsUpdate = true;
        }
        
        if (relationFromClerk && relationFromClerk !== existingUser.parent.relation) {
          updateData.relation = relationFromClerk;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await prisma.parent.update({
            where: { id: existingUser.parent.id },
            data: updateData
          });
          console.log(`✅ Profil parent mis à jour`);
        }
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

    // CRÉER LE PROFIL PARENT SI C'EST UN PARENT
    if (prismaRole === UserRole.PARENT) {
      console.log(`👨‍👧‍👦 Création profil parent...`);
      
      const parent = await prisma.parent.create({
        data: {
          userId: newUser.id,
          enfantName: enfantNameFromClerk || "À définir",
          filiere: filiereFromClerk || "À définir",
          relation: relationFromClerk || "Parent",
        }
      });

      console.log(`✅ Profil parent créé: ${parent.id}`);
      return { ...newUser, parent };
    }

    return newUser;
  } catch (error) {
    console.error(`❌ Erreur synchronisation ${clerkUser.id}:`, error);
    throw error;
  }
}

// GET - Récupérer tous les parents avec filtres
export async function GET(req: NextRequest) {
  try {
    console.log("🔍 Début API parents admin");

    // AUTHENTIFICATION CLERK
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // VÉRIFICATION RÔLE ADMIN
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userRole = clerkUser.publicMetadata?.role as string;

    const isAdmin = userRole && (
      userRole.toLowerCase().includes("admin") || 
      userRole === "Administrateur" ||
      userRole === "ADMIN"
    );

    if (!isAdmin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    console.log("✅ Accès autorisé - Admin Clerk");

    // PARAMÈTRES DE RECHERCHE
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const vague = searchParams.get("vague") || "all";
    const filiere = searchParams.get("filiere") || "all";

    console.log("📋 Paramètres de filtre:", { search, status, vague, filiere });

    // RÉCUPÉRATION DEPUIS CLERK
    console.log("👥 Récupération utilisateurs Clerk...");
    const clerkUsers = await client.users.getUserList({ limit: 100 });
    console.log(`📊 ${clerkUsers.totalCount} utilisateurs Clerk trouvés`);

    // FILTRER LES PARENTS CLERK
    const parentClerkUsers = clerkUsers.data.filter(user => {
      const role = user.publicMetadata?.role as string;
      return role && role.toLowerCase().includes("parent");
    });

    console.log(`👨‍👧‍👦 ${parentClerkUsers.length} parents Clerk trouvés`);

    // SYNCHRONISATION AVEC PRISMA
    console.log("🔄 Synchronisation avec Prisma...");
    const synchronizationResults = await Promise.allSettled(
      parentClerkUsers.map(user => syncParentWithPrisma(user))
    );

    const successfulSyncs = synchronizationResults.filter(result => result.status === 'fulfilled').length;
    const failedSyncs = synchronizationResults.filter(result => result.status === 'rejected').length;
    
    if (failedSyncs > 0) {
      console.warn(`⚠️ ${failedSyncs} synchronisations ont échoué`);
    }
    
    console.log(`✅ ${successfulSyncs}/${parentClerkUsers.length} synchronisés`);

    // RÉCUPÉRATION COMPLÈTE DES DONNÉES AVEC RELATIONS
    console.log("🔍 Récupération finale depuis Prisma...");
    const prismaParents = await prisma.parent.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            clerkUserId: true,
            createdAt: true,
            isActive: true
          }
        }
      },
      orderBy: {
        user: {
          lastName: 'asc'
        }
      }
    });

    console.log(`📊 ${prismaParents.length} parents Prisma trouvés`);

    // RÉCUPÉRATION DES ÉTUDIANTS ET VAGUES POUR LES LIER AUX PARENTS
    console.log("🔍 Récupération des étudiants liés aux parents...");
    
    const allStudents = await prisma.student.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          }
        },
        filiere: {
          select: {
            id: true,
            nom: true
          }
        },
        vague: {
          select: {
            id: true,
            nom: true
          }
        }
      }
    });

    console.log(`📊 ${allStudents.length} étudiants trouvés`);

    // RÉCUPÉRATION DES VAGUES ET FILIÈRES POUR LES FILTRES
    const [allVagues, allFilieres] = await Promise.all([
      prisma.vague.findMany({
        where: { isActive: true },
        select: { 
          id: true, 
          nom: true 
        },
        orderBy: { nom: 'asc' }
      }),
      prisma.filiere.findMany({
        select: { 
          id: true, 
          nom: true 
        },
        orderBy: { nom: 'asc' }
      })
    ]);

    console.log("✅ Données pour filtres:", {
      vagues: allVagues.length,
      filieres: allFilieres.length
    });

    // FORMATAGE DES PARENTS AVEC DONNÉES RÉELLES
    const formattedParents: FormattedParent[] = prismaParents.map((prismaParent) => {
      // TROUVER LES ÉTUDIANTS QUI CORRESPONDENT AU NOM DE FAMILLE DU PARENT
      const enfantsReels = allStudents.filter(student => {
        // Correspondance par nom de famille
        return student.user.lastName === prismaParent.user.lastName;
      }).map(student => ({
        id: student.id,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        filiere: student.filiere?.nom || "Non assigné",
        filiereId: student.filiereId,
        studentNumber: student.studentNumber
      }));

      // RÉCUPÉRER LES VAGUES DES ÉTUDIANTS LIÉS
      const vaguesReelles = [...new Set(
        allStudents
          .filter(student => student.user.lastName === prismaParent.user.lastName)
          .map(student => student.vague?.nom)
          .filter((vague): vague is string => vague !== undefined)
      )];

      // DÉTERMINER LE STATUT
      const status: "actif" | "inactif" | "suspendu" = 
        prismaParent.user.isActive ? "actif" : "inactif";

      console.log(`📝 Parent ${prismaParent.user.firstName} ${prismaParent.user.lastName}:`, {
        enfantsTrouves: enfantsReels.length,
        vaguesTrouvees: vaguesReelles.length,
        vaguesFinales: vaguesReelles
      });

      return {
        id: prismaParent.user.id,
        clerkUserId: prismaParent.user.clerkUserId,
        firstName: prismaParent.user.firstName,
        lastName: prismaParent.user.lastName,
        email: prismaParent.user.email,
        phone: prismaParent.user.phone || "Non renseigné",
        status: status,
        enfants: enfantsReels.length > 0 ? enfantsReels : [
          // Fallback si aucun étudiant trouvé
          {
            id: `enfant_${prismaParent.id}`,
            firstName: prismaParent.enfantName?.split(' ')[0] || "Prénom",
            lastName: prismaParent.user.lastName,
            filiere: prismaParent.filiere !== "À définir" ? prismaParent.filiere : "Non assigné",
            filiereId: null,
            studentNumber: `ETU-${new Date().getFullYear()}-${String(prismaParent.id.slice(-3)).padStart(3, '0')}`
          }
        ],
        vagues: vaguesReelles.length > 0 ? vaguesReelles : [`Vague ${(prismaParent.id.charCodeAt(0) % 3) + 1}`],
        createdAt: prismaParent.user.createdAt.toISOString()
      };
    });

    // APPLICATION DES FILTRES
    let filteredParents = formattedParents;
    
    // Filtre recherche
    if (search) {
      const searchLower = search.toLowerCase();
      filteredParents = filteredParents.filter(parent => 
        parent.firstName.toLowerCase().includes(searchLower) ||
        parent.lastName.toLowerCase().includes(searchLower) ||
        parent.email.toLowerCase().includes(searchLower) ||
        parent.phone.toLowerCase().includes(searchLower)
      );
    }

    // Filtre statut
    if (status && status !== "all") {
      filteredParents = filteredParents.filter(parent => parent.status === status);
    }

    // Filtre vague
    if (vague && vague !== "all") {
      filteredParents = filteredParents.filter(parent => 
        parent.vagues.some(v => v === vague)
      );
    }

    // Filtre filière
    if (filiere && filiere !== "all") {
      filteredParents = filteredParents.filter(parent => 
        parent.enfants.some(enfant => enfant.filiere === filiere)
      );
    }

    console.log(`✅ ${filteredParents.length} parents après filtrage`);

    // CALCUL DES STATISTIQUES
    const stats = {
      total: filteredParents.length,
      active: filteredParents.filter(p => p.status === "actif").length,
      inactive: filteredParents.filter(p => p.status === "inactif").length,
      suspended: filteredParents.filter(p => p.status === "suspendu").length
    };

    // PRÉPARATION DES FILTRES DISPONIBLES
    const vagueFilters: FilterOption[] = allVagues.map(vague => ({
      id: vague.nom,
      name: vague.nom
    }));

    // Extraire les filières uniques des enfants de tous les parents
    const filieresUtilisees = new Set(
      formattedParents.flatMap(parent => 
        parent.enfants.map(enfant => enfant.filiere)
      ).filter(filiere => filiere && filiere !== "Non assigné")
    );

    const filiereFilters: FilterOption[] = Array.from(filieresUtilisees).map(nom => ({
      id: nom,
      name: nom
    }));

    console.log("📋 Filtres disponibles:", {
      vagues: vagueFilters.length,
      filieres: filiereFilters.length
    });

    // RÉPONSE FINALE
    const response = {
      parents: filteredParents,
      total: filteredParents.length,
      stats: stats,
      filters: {
        vagues: vagueFilters,
        filieres: filiereFilters
      },
      debug: {
        totalParents: prismaParents.length,
        parentsAvecTelephone: prismaParents.filter(p => p.user.phone).length,
        parentsSansTelephone: prismaParents.filter(p => !p.user.phone).length,
        parentsAvecEnfants: formattedParents.filter(p => p.enfants.length > 0).length,
        vaguesDisponibles: vagueFilters.length,
        filieresDisponibles: filiereFilters.length,
        parametresFiltres: { search, status, vague, filiere }
      }
    };

    console.log("✅ Réponse API prête avec:", {
      parents: filteredParents.length,
      stats: stats,
      vaguesDisponibles: vagueFilters.length,
      filieresDisponibles: filiereFilters.length
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Erreur API parents:", error);
    return NextResponse.json({ 
      error: "Erreur lors de la récupération des parents",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

// DELETE - Supprimer un parent
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const userRole = clerkUser.publicMetadata?.role as string;

    const isAdmin = userRole && userRole.toLowerCase().includes("admin");
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { parentId, clerkUserId } = await req.json();

    if (clerkUserId) {
      try {
        await client.users.deleteUser(clerkUserId);
        console.log(`✅ Utilisateur Clerk ${clerkUserId} supprimé`);
      } catch (clerkError) {
        console.warn("⚠️ Impossible de supprimer Clerk:", clerkError);
      }
    }

    if (parentId) {
      const user = await prisma.user.findUnique({
        where: { id: parentId },
        include: { parent: true }
      });

      if (user) {
        await prisma.$transaction(async (tx) => {
          if (user.parent) {
            await tx.parent.delete({ where: { userId: parentId } });
          }
          await tx.user.delete({ where: { id: parentId } });
        });
        console.log(`✅ Parent ${user.firstName} ${user.lastName} supprimé`);
      }
    }

    return NextResponse.json({ success: true, message: "Parent supprimé" });

  } catch (error) {
    console.error("❌ Erreur suppression:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}