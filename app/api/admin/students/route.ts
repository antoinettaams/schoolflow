// app/api/admin/students/route.ts - VERSION COMPLÈTE CORRIGÉE AVEC TYPES
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { PrismaClient, UserRole, Student, User, Filiere, Vague } from "@prisma/client";

// Gestion robuste de la connexion Prisma
let prisma: PrismaClient;

try {
  prisma = new PrismaClient();
  console.log("✅ Prisma Client initialisé");
} catch (error) {
  console.error("❌ Erreur initialisation Prisma:", error);
  prisma = new PrismaClient();
}

// Types pour les données formatées
interface FormattedStudent {
  id: string;
  clerkUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  studentNumber: string;
  filiere: string;
  filiereId: string;
  vagueNumber: string;
  vagueId: string;
  averageGrade: number;
  attendanceRate: number;
  status: string;
  createdAt: string;
  lastActivity: string;
  modules: any[];
  rank: number;
  totalStudents: number;
  anneeScolaire: string;
}

interface FilterOption {
  id: string;
  name: string;
}

// Type pour les étudiants Prisma avec relations
type StudentWithRelations = Student & {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'phone' | 'clerkUserId' | 'createdAt' | 'updatedAt'>;
  filiere: Pick<Filiere, 'id' | 'nom'> | null;
  vague: Pick<Vague, 'id' | 'nom'> | null;
};

// Fonction pour mapper le rôle Clerk vers UserRole Prisma
function mapClerkRoleToPrismaRole(clerkRole: string): UserRole {
  if (!clerkRole) return UserRole.ETUDIANT;
  
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
    return UserRole.ETUDIANT;
  }
}

// Fonction pour récupérer les données utilisateur depuis Clerk
function getClerkUserData(clerkUser: any) {
  const publicMetadata = clerkUser.publicMetadata || {};
  const unsafeMetadata = clerkUser.unsafeMetadata || {};
  const privateMetadata = clerkUser.privateMetadata || {};
  
  const metadata = { ...unsafeMetadata, ...privateMetadata, ...publicMetadata };
  
  // Récupération du téléphone
  const phone = metadata.phone as string || 
               (clerkUser.primaryPhoneNumberId ? 
                 clerkUser.phoneNumbers?.find((p: any) => p.id === clerkUser.primaryPhoneNumberId)?.phoneNumber : 
                 clerkUser.phoneNumbers?.[0]?.phoneNumber);

  // Récupération de l'email
  const email = clerkUser.emailAddresses[0]?.emailAddress || 
               `${clerkUser.id}@no-email.com`;

  // Gestion des différents noms de propriétés pour vagueId
  const vagueId = metadata.vagueId as string || 
                 metadata.vague as string || 
                 metadata.vagueNumber as string ||
                 metadata.vagueIdNumber as string;

  console.log('🔍 Données utilisateur complètes:', {
    email: email,
    phone: phone,
    vagueIdTrouvé: vagueId,
    filiereId: metadata.filiereId,
    studentNumber: metadata.studentNumber,
    role: metadata.role,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName
  });
  
  return {
    email: email,
    phone: phone,
    role: metadata.role as string,
    filiereId: metadata.filiereId as string,
    vagueId: vagueId,
    studentNumber: metadata.studentNumber as string,
    firstName: clerkUser.firstName || "Prénom",
    lastName: clerkUser.lastName || "Nom"
  };
}

// Fonction de synchronisation avec gestion robuste des mises à jour
async function syncClerkUserWithPrisma(clerkUser: any) {
  try {
    console.log(`🔄 Synchronisation de: ${clerkUser.id} - ${clerkUser.firstName} ${clerkUser.lastName}`);
    
    const userData = getClerkUserData(clerkUser);
    
    console.log(`📋 Données récupérées pour ${clerkUser.firstName}:`, userData);

    // Vérifier si l'utilisateur existe déjà dans Prisma
    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId: clerkUser.id },
      include: { 
        student: {
          include: {
            vague: true,
            filiere: true
          }
        }
      }
    });

    if (existingUser) {
      console.log(`✅ Utilisateur déjà dans Prisma: ${existingUser.id}`);
      
      // Mise à jour avec gestion des conflits d'email
      const updateData: any = {};
      let needsUpdate = false;

      // Vérifier si l'email doit être mis à jour
      if (userData.email && userData.email !== existingUser.email) {
        // Vérifier si le nouvel email n'existe pas déjà pour un autre utilisateur
        const emailExists = await prisma.user.findFirst({
          where: { 
            email: userData.email,
            id: { not: existingUser.id } // Exclure l'utilisateur actuel
          }
        });

        if (emailExists) {
          console.warn(`⚠️ Email ${userData.email} existe déjà pour un autre utilisateur (${emailExists.id}), conservation de l'ancien email`);
        } else {
          updateData.email = userData.email;
          needsUpdate = true;
          console.log(`📧 Email à mettre à jour: ${existingUser.email} → ${userData.email}`);
        }
      }

      // Mise à jour du téléphone si différent
      if (userData.phone && userData.phone !== existingUser.phone) {
        updateData.phone = userData.phone;
        needsUpdate = true;
        console.log(`📞 Téléphone à mettre à jour: ${existingUser.phone || 'null'} → ${userData.phone}`);
      }

      // Mise à jour du prénom et nom si différents
      if (userData.firstName && userData.firstName !== existingUser.firstName) {
        updateData.firstName = userData.firstName;
        needsUpdate = true;
        console.log(`👤 Prénom à mettre à jour: ${existingUser.firstName} → ${userData.firstName}`);
      }

      if (userData.lastName && userData.lastName !== existingUser.lastName) {
        updateData.lastName = userData.lastName;
        needsUpdate = true;
        console.log(`👤 Nom à mettre à jour: ${existingUser.lastName} → ${userData.lastName}`);
      }

      if (needsUpdate) {
        try {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: updateData
          });
          console.log(`✅ Informations utilisateur mises à jour`);
        } catch (updateError: any) {
          console.error(`❌ Erreur mise à jour utilisateur:`, updateError);
          // Continuer même en cas d'erreur de mise à jour
        }
      }
      
      const prismaRole = mapClerkRoleToPrismaRole(userData.role);
      
      // CRÉER LE PROFIL ÉTUDIANT SI MANQUANT
      if (prismaRole === UserRole.ETUDIANT && !existingUser.student) {
        console.log(`⚠️ Création profil étudiant manquant pour: ${existingUser.id}`);
        
        const filiereId = userData.filiereId ? parseInt(userData.filiereId) : null;
        
        const student = await prisma.student.create({
          data: {
            userId: existingUser.id,
            studentNumber: userData.studentNumber || `ETU${Date.now()}`,
            vagueId: userData.vagueId || null,
            vagueNumber: 1,
            filiereId: filiereId,
          }
        });
        
        console.log(`✅ Profil étudiant créé avec vagueId: ${student.vagueId}`);
        
        return { ...existingUser, student };
      }
      
      // Mettre à jour les informations étudiant si nécessaire
      if (existingUser.student) {
        let studentUpdateData: any = {};
        let studentNeedsUpdate = false;
        
        if (userData.filiereId && parseInt(userData.filiereId) !== existingUser.student.filiereId) {
          studentUpdateData.filiereId = parseInt(userData.filiereId);
          studentNeedsUpdate = true;
          console.log(`🔄 Mise à jour filière: ${existingUser.student.filiereId} → ${userData.filiereId}`);
        }
        
        if (userData.vagueId && userData.vagueId !== existingUser.student.vagueId) {
          studentUpdateData.vagueId = userData.vagueId;
          studentNeedsUpdate = true;
          console.log(`🔄 Mise à jour vagueId: ${existingUser.student.vagueId} → ${userData.vagueId}`);
        }
        
        if (userData.studentNumber && userData.studentNumber !== existingUser.student.studentNumber) {
          studentUpdateData.studentNumber = userData.studentNumber;
          studentNeedsUpdate = true;
          console.log(`🔄 Mise à jour numéro étudiant: ${existingUser.student.studentNumber} → ${userData.studentNumber}`);
        }
        
        if (studentNeedsUpdate) {
          await prisma.student.update({
            where: { id: existingUser.student.id },
            data: studentUpdateData
          });
          console.log(`✅ Profil étudiant mis à jour`);
        } else {
          console.log(`ℹ️  Aucune mise à jour nécessaire pour l'étudiant`);
        }
      }
      
      return existingUser;
    }

    // CRÉATION D'UN NOUVEL UTILISATEUR
    console.log(`📝 Création nouvel utilisateur dans Prisma...`);
    
    const prismaRole = mapClerkRoleToPrismaRole(userData.role);

    // Vérifier si l'email existe déjà
    const emailExists = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    let finalEmail = userData.email;
    if (emailExists) {
      console.warn(`⚠️ Email ${userData.email} existe déjà, utilisation d'un email alternatif`);
      finalEmail = `${clerkUser.id}@clerk-user.com`;
    }

    const newUser = await prisma.user.create({
      data: {
        clerkUserId: clerkUser.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: finalEmail,
        role: prismaRole,
        phone: userData.phone || null,
        isActive: true,
      }
    });

    console.log(`✅ Utilisateur créé: ${newUser.id}`, {
      email: newUser.email,
      phone: newUser.phone
    });

    // CRÉER LE PROFIL ÉTUDIANT SI C'EST UN ÉTUDIANT
    if (prismaRole === UserRole.ETUDIANT) {
      console.log(`🎓 Création profil étudiant...`);
      
      const filiereId = userData.filiereId ? parseInt(userData.filiereId) : null;
      
      const student = await prisma.student.create({
        data: {
          userId: newUser.id,
          studentNumber: userData.studentNumber || `ETU${Date.now()}`,
          vagueId: userData.vagueId || null,
          vagueNumber: 1,
          filiereId: filiereId,
        }
      });

      console.log(`✅ Profil étudiant créé avec vagueId: ${student.vagueId}`);
      
      return { ...newUser, student };
    }

    return newUser;
  } catch (error: any) {
    console.error(`❌ Erreur synchronisation ${clerkUser.id}:`, error);
    throw error;
  }
}

// Fonction pour réparer les emails et téléphones manquants
async function repairMissingUserData() {
  try {
    console.log("🔧 Réparation des emails et téléphones manquants...");
    
    const client = await clerkClient();
    
    // Récupérer tous les utilisateurs Prisma qui pourraient avoir des données manquantes
    const allPrismaUsers = await prisma.user.findMany({
      include: {
        student: true
      },
      where: {
        OR: [
          { email: { contains: "@no-email.com" } },
          { email: { contains: "@clerk-user.com" } },
          { phone: null }
        ]
      }
    });

    console.log(`🔧 Vérification de ${allPrismaUsers.length} utilisateurs avec données potentiellement manquantes...`);

    let repairedCount = 0;

    for (const user of allPrismaUsers) {
      try {
        // Récupérer l'utilisateur Clerk correspondant
        const clerkUser = await client.users.getUser(user.clerkUserId);
        const userData = getClerkUserData(clerkUser);
        
        console.log(`🔍 Vérification ${user.firstName}:`, {
          emailPrisma: user.email,
          emailClerk: userData.email,
          phonePrisma: user.phone,
          phoneClerk: userData.phone
        });

        const updateData: any = {};
        let needsUpdate = false;

        // Mettre à jour l'email si celui de Clerk est meilleur
        if (userData.email && 
            !userData.email.includes("@no-email.com") && 
            !userData.email.includes("@clerk-user.com") &&
            userData.email !== user.email) {
          
          // Vérifier si l'email n'existe pas déjà pour un autre utilisateur
          const emailExists = await prisma.user.findFirst({
            where: { 
              email: userData.email,
              id: { not: user.id } // Exclure l'utilisateur actuel
            }
          });

          if (!emailExists) {
            updateData.email = userData.email;
            needsUpdate = true;
            console.log(`  🔄 ${user.firstName}: email ${user.email} → ${userData.email}`);
          } else {
            console.warn(`  ⚠️ ${user.firstName}: email ${userData.email} existe déjà pour un autre utilisateur (${emailExists.id})`);
          }
        }

        // Mettre à jour le téléphone si manquant ou différent
        if (userData.phone && userData.phone !== user.phone) {
          updateData.phone = userData.phone;
          needsUpdate = true;
          console.log(`  🔄 ${user.firstName}: téléphone ${user.phone || 'null'} → ${userData.phone}`);
        }

        if (needsUpdate) {
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: updateData
            });
            repairedCount++;
            console.log(`✅ ${user.firstName} ${user.lastName} - données utilisateur réparées`);
          } catch (updateError: any) {
            if (updateError.code === 'P2002') {
              console.warn(`  ⚠️ ${user.firstName}: conflit d'email lors de la mise à jour, skip`);
            } else {
              console.error(`  ❌ ${user.firstName}: erreur mise à jour:`, updateError);
            }
          }
        } else {
          console.log(`ℹ️  ${user.firstName} - Aucune réparation nécessaire pour les données utilisateur`);
        }

      } catch (error: any) {
        if (error.status === 404) {
          console.warn(`  ⚠️ ${user.firstName}: utilisateur Clerk non trouvé (peut-être supprimé)`);
        } else {
          console.error(`❌ Erreur réparation ${user.firstName}:`, error);
        }
      }
    }

    console.log(`🎯 ${repairedCount} utilisateurs réparés sur ${allPrismaUsers.length}`);
    return repairedCount;

  } catch (error) {
    console.error("❌ Erreur réparation données utilisateur:", error);
    return 0;
  }
}

// Fonction pour FORCER la réparation des données problématiques
async function forceRepairProblematicData() {
  try {
    console.log("🚨 FORCE RÉPARATION des données problématiques...");
    
    const client = await clerkClient();
    
    // Récupérer TOUS les utilisateurs Prisma
    const allPrismaUsers = await prisma.user.findMany({
      include: {
        student: true
      }
    });

    console.log(`🚨 Vérification de ${allPrismaUsers.length} utilisateurs...`);

    let repairedCount = 0;
    let skippedCount = 0;

    for (const user of allPrismaUsers) {
      try {
        // Récupérer l'utilisateur Clerk correspondant
        const clerkUser = await client.users.getUser(user.clerkUserId);
        const userData = getClerkUserData(clerkUser);
        
        console.log(`🔍 Vérification FORCE ${user.firstName}:`, {
          emailPrisma: user.email,
          emailClerk: userData.email,
          phonePrisma: user.phone,
          phoneClerk: userData.phone
        });

        // DÉTECTION DES PROBLÈMES
        const hasEmailProblem = user.email.includes("@no-email.com") || 
                               user.email.includes("@clerk-user.com") ||
                               user.email !== userData.email;
        
        const hasPhoneProblem = !user.phone && userData.phone;

        if (hasEmailProblem || hasPhoneProblem) {
          console.log(`🚨 ${user.firstName} a des problèmes:`, {
            emailProblem: hasEmailProblem,
            phoneProblem: hasPhoneProblem
          });

          const updateData: any = {};
          let needsUpdate = false;

          // RÉPARATION EMAIL
          if (hasEmailProblem && userData.email && 
              !userData.email.includes("@no-email.com") && 
              !userData.email.includes("@clerk-user.com")) {
            
            // Vérifier si l'email n'existe pas déjà pour un autre utilisateur
            const emailExists = await prisma.user.findFirst({
              where: { 
                email: userData.email,
                id: { not: user.id }
              }
            });

            if (!emailExists) {
              updateData.email = userData.email;
              needsUpdate = true;
              console.log(`  🔥 FORCE RÉPARATION email: ${user.email} → ${userData.email}`);
            } else {
              console.warn(`  ⚠️ FORCE: email ${userData.email} existe déjà pour ${emailExists.id}`);
              skippedCount++;
            }
          }

          // RÉPARATION TÉLÉPHONE
          if (hasPhoneProblem && userData.phone) {
            updateData.phone = userData.phone;
            needsUpdate = true;
            console.log(`  🔥 FORCE RÉPARATION téléphone: ${user.phone || 'null'} → ${userData.phone}`);
          }

          if (needsUpdate) {
            try {
              await prisma.user.update({
                where: { id: user.id },
                data: updateData
              });
              repairedCount++;
              console.log(`✅ FORCE RÉPARATION réussie pour ${user.firstName}`);
            } catch (updateError: any) {
              if (updateError.code === 'P2002') {
                console.warn(`  ⚠️ FORCE: conflit d'email pour ${user.firstName}`);
                skippedCount++;
              } else {
                console.error(`  ❌ FORCE: erreur pour ${user.firstName}:`, updateError);
              }
            }
          }
        } else {
          console.log(`ℹ️  ${user.firstName} - Aucun problème détecté`);
        }

      } catch (error: any) {
        if (error.status === 404) {
          console.warn(`  ⚠️ ${user.firstName}: utilisateur Clerk non trouvé`);
        } else {
          console.error(`❌ Erreur FORCE réparation ${user.firstName}:`, error);
        }
      }
    }

    console.log(`🎯 FORCE RÉPARATION: ${repairedCount} réparés, ${skippedCount} ignorés sur ${allPrismaUsers.length}`);
    return { repaired: repairedCount, skipped: skippedCount };

  } catch (error) {
    console.error("❌ Erreur FORCE réparation:", error);
    return { repaired: 0, skipped: 0 };
  }
}

// GET - Récupérer tous les étudiants
export async function GET(req: NextRequest) {
  try {
    console.log("🔍 Début API étudiants admin - VERSION FORCE RÉPARATION");

    // TESTER LA CONNEXION PRISMA DÈS LE DÉBUT
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("✅ Connexion Prisma active");
    } catch (dbError) {
      console.error("❌ Base de données inaccessible:", dbError);
      return NextResponse.json(
        { 
          error: "Base de données temporairement indisponible",
          details: "Vérifiez votre connexion et le fichier .env"
        }, 
        { status: 503 }
      );
    }

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
    const filiere = searchParams.get("filiere") || "";
    const vague = searchParams.get("vague") || "";
    const forceRepair = searchParams.get("forceRepair") === "true";
    const superRepair = searchParams.get("superRepair") === "true";

    console.log("📋 Paramètres:", { search, filiere, vague, forceRepair, superRepair });

    // RÉCUPÉRATION DEPUIS CLERK - CORRECTION DE LA PAGINATION
    console.log("👥 Récupération utilisateurs Clerk...");
    let allClerkUsers = [];
    
    try {
      // Utilisation de la pagination correcte pour Clerk
      let page = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const usersBatch = await client.users.getUserList({ 
          limit, 
          offset: page * limit 
        });
        
        allClerkUsers.push(...usersBatch.data);
        
        // Vérifier s'il y a plus d'utilisateurs
        hasMore = usersBatch.data.length === limit;
        page++;
        
        console.log(`📄 Page ${page}: ${usersBatch.data.length} utilisateurs`);
      }

      console.log(`📊 ${allClerkUsers.length} utilisateurs Clerk récupérés au total`);
    } catch (clerkError) {
      console.error("❌ Erreur récupération Clerk:", clerkError);
      allClerkUsers = [];
    }

    // FILTRER LES ÉTUDIANTS CLERK
    const studentClerkUsers = allClerkUsers.filter(user => {
      const userData = getClerkUserData(user);
      const isStudent = userData.role && userData.role.toLowerCase().includes("etudiant");
      
      if (isStudent) {
        console.log(`🎓 Étudiant Clerk: ${user.firstName} ${user.lastName}`, {
          email: userData.email,
          phone: userData.phone,
          vagueId: userData.vagueId,
          filiereId: userData.filiereId,
          studentNumber: userData.studentNumber
        });
      }
      
      return isStudent;
    });

    console.log(`🎓 ${studentClerkUsers.length} étudiants identifiés dans Clerk`);

    // SYNCHRONISATION AVEC PRISMA
    console.log("🔄 Synchronisation avec Prisma...");
    const syncPromises = studentClerkUsers.map(user => 
      syncClerkUserWithPrisma(user).catch(error => {
        console.error(`❌ Échec synchronisation ${user.firstName}:`, error);
        return null;
      })
    );

    const syncResults = await Promise.all(syncPromises);
    const successfulSyncs = syncResults.filter(result => result !== null).length;
    const failedSyncs = syncResults.filter(result => result === null).length;
    
    if (failedSyncs > 0) {
      console.warn(`⚠️ ${failedSyncs} synchronisations ont échoué`);
    }
    
    console.log(`✅ ${successfulSyncs}/${studentClerkUsers.length} synchronisés`);

    // RÉPARATION DES EMAILS ET TÉLÉPHONES MANQUANTS
    let repairCount = 0;
    let superRepairResult = { repaired: 0, skipped: 0 };
    
    if (superRepair) {
      // RÉPARATION FORCÉE COMPLÈTE
      superRepairResult = await forceRepairProblematicData();
      repairCount = superRepairResult.repaired;
    } else if (forceRepair || studentClerkUsers.length > 0) {
      // RÉPARATION NORMALE
      repairCount = await repairMissingUserData();
    }

    if (repairCount > 0 || superRepairResult.repaired > 0) {
      console.log(`🔧 ${repairCount} emails/téléphones réparés`);
    }

    // RÉCUPÉRATION FINALE DEPUIS PRISMA - CORRECTION DES TYPES
    console.log("🔍 Récupération finale depuis Prisma...");
    let prismaStudents: StudentWithRelations[] = [];

    try {
      prismaStudents = await prisma.student.findMany({
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
              updatedAt: true
            }
          },
          filiere: {
            select: {
              id: true,
              nom: true,
            }
          },
          vague: {
            select: {
              id: true,
              nom: true,
            }
          }
        },
        orderBy: {
          user: {
            lastName: 'asc'
          }
        }
      });
    } catch (queryError) {
      console.error("❌ Erreur requête Prisma:", queryError);
      prismaStudents = [];
    }

    console.log(`📊 ${prismaStudents.length} étudiants Prisma trouvés`);

    // ANALYSE DES EMAILS ET TÉLÉPHONES
    const studentsAvecEmailValide = prismaStudents.filter(s => 
      !s.user.email.includes("@no-email.com") && !s.user.email.includes("@clerk-user.com")
    );
    const studentsAvecTelephone = prismaStudents.filter(s => s.user.phone);
    
    console.log("📊 Analyse emails/téléphones:", {
      emailValide: studentsAvecEmailValide.length,
      avecTelephone: studentsAvecTelephone.length,
      total: prismaStudents.length
    });

    // ANALYSE DES PROBLÈMES
    const studentsSansVague = prismaStudents.filter(s => !s.vagueId);
    const studentsSansFiliere = prismaStudents.filter(s => !s.filiereId);
    
    console.log("📊 Analyse des problèmes:", {
      sansVague: studentsSansVague.length,
      sansFiliere: studentsSansFiliere.length,
      total: prismaStudents.length
    });

    // FORMATAGE POUR LE FRONTEND
    const formattedStudents: FormattedStudent[] = prismaStudents.map((prismaStudent, index) => {
      const vagueNom = prismaStudent.vague?.nom || "Non assigné";
      const vagueId = prismaStudent.vagueId || "";
      
      console.log(`📝 Formatage ${prismaStudent.user.firstName}:`, {
        email: prismaStudent.user.email,
        phone: prismaStudent.user.phone,
        vagueId: vagueId
      });
      
      return {
        id: prismaStudent.user.id,
        clerkUserId: prismaStudent.user.clerkUserId,
        firstName: prismaStudent.user.firstName,
        lastName: prismaStudent.user.lastName,
        email: prismaStudent.user.email,
        phone: prismaStudent.user.phone || "Non renseigné",
        studentNumber: prismaStudent.studentNumber || "Non attribué",
        filiere: prismaStudent.filiere?.nom || "Non assigné",
        filiereId: prismaStudent.filiereId?.toString() || "",
        vagueNumber: vagueNom,
        vagueId: vagueId,
        averageGrade: 0,
        attendanceRate: 0,
        status: "actif",
        createdAt: prismaStudent.user.createdAt.toISOString(),
        lastActivity: prismaStudent.user.updatedAt.toISOString(),
        modules: [],
        rank: index + 1,
        totalStudents: prismaStudents.length,
        anneeScolaire: "2024-2025"
      };
    });

    // FILTRES
    let filteredStudents = formattedStudents;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredStudents = formattedStudents.filter(student => 
        student.firstName.toLowerCase().includes(searchLower) ||
        student.lastName.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        student.studentNumber.toLowerCase().includes(searchLower)
      );
    }

    if (filiere && filiere !== "all") {
      filteredStudents = filteredStudents.filter(student => student.filiereId === filiere);
    }

    if (vague && vague !== "all") {
      filteredStudents = filteredStudents.filter(student => student.vagueId === vague);
    }

    console.log(`✅ ${filteredStudents.length} étudiants après filtrage`);

    // FILTRES DISPONIBLES - CORRECTION DES TYPES
    let toutesFilieres: Pick<Filiere, 'id' | 'nom'>[] = [];
    let toutesVagues: Pick<Vague, 'id' | 'nom'>[] = [];

    try {
      toutesFilieres = await prisma.filiere.findMany({
        select: { id: true, nom: true },
        orderBy: { nom: 'asc' }
      });

      toutesVagues = await prisma.vague.findMany({
        where: { isActive: true },
        select: { 
          id: true, 
          nom: true 
        },
        orderBy: { nom: 'asc' }
      });
    } catch (filterError) {
      console.warn("⚠️ Erreur récupération filtres:", filterError);
    }

    // FORMATER LES FILTRES
    const filiereFilters: FilterOption[] = toutesFilieres.map(f => ({ 
      id: f.id.toString(), 
      name: f.nom 
    }));

    const vagueFilters: FilterOption[] = toutesVagues.map(v => ({ 
      id: v.id, 
      name: v.nom 
    }));

    // RÉPONSE FINALE
    const response = {
      students: filteredStudents,
      total: filteredStudents.length,
      stats: {
        total: filteredStudents.length,
        active: filteredStudents.length,
        inactive: 0,
        suspended: 0
      },
      filters: {
        filieres: filiereFilters,
        vagues: vagueFilters
      },
      syncInfo: {
        totalClerkStudents: studentClerkUsers.length,
        totalPrismaStudents: prismaStudents.length,
        studentsSansVague: studentsSansVague.length,
        studentsSansFiliere: studentsSansFiliere.length,
        studentsAvecEmailValide: studentsAvecEmailValide.length,
        studentsAvecTelephone: studentsAvecTelephone.length,
        repairedCount: repairCount,
        superRepairResult: superRepairResult,
        forceRepairUrl: '/api/admin/students?forceRepair=true',
        superRepairUrl: '/api/admin/students?superRepair=true'
      }
    };

    console.log("✅ Réponse API prête");
    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Erreur API étudiants:", error);
    return NextResponse.json({ 
      error: "Erreur lors de la récupération des étudiants",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}

// DELETE - Supprimer un étudiant
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

    const { studentId, clerkUserId } = await req.json();

    if (clerkUserId) {
      try {
        await client.users.deleteUser(clerkUserId);
        console.log(`✅ Utilisateur Clerk ${clerkUserId} supprimé`);
      } catch (clerkError) {
        console.warn("⚠️ Impossible de supprimer Clerk:", clerkError);
      }
    }

    if (studentId) {
      const user = await prisma.user.findUnique({
        where: { id: studentId },
        include: { student: true }
      });

      if (user) {
        await prisma.$transaction(async (tx) => {
          if (user.student) {
            await tx.student.delete({ where: { userId: studentId } });
          }
          await tx.user.delete({ where: { id: studentId } });
        });
        console.log(`✅ Étudiant ${user.firstName} ${user.lastName} supprimé`);
      }
    }

    return NextResponse.json({ success: true, message: "Étudiant supprimé" });

  } catch (error) {
    console.error("❌ Erreur suppression:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}