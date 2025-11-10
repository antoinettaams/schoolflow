import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// les données de requête
interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  studentNumber?: string;
  filiere?: string;
  matiere?: string;
  enfantName?: string;
  relation?: string;
  customPassword?: string;
  vagueNumber?: string;
}

// les données utilisateur Clerk
interface ClerkUserData {
  email_address: string[];
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  phone_numbers?: string[];
  public_metadata: {
    role: string;
    status: string;
    createdBy: string;
    createdAt: string;
    phone?: string | undefined;
    studentNumber?: string;
    filiere?: string;
    matiere?: string;
    enfantName?: string;
    relation?: string;
    vagueNumber?: string;
  };
}

// Type pour l'erreur Clerk
interface ClerkError {
  errors?: Array<{
    code?: string;
    message?: string;
  }>;
}

// Type pour la réponse utilisateur Clerk - CORRIGÉ
interface ClerkUserResponse {
  id: string;
  email_addresses: Array<{ email_address: string }>;
  first_name: string | null;
  last_name: string | null;
  primary_email_address_id: string | null;
  primary_phone_number_id: string | null;
  primary_web3_wallet_id: string | null;
  username: string | null;
  profile_image_url: string;
  image_url: string;
  has_image: boolean;
  public_metadata: Record<string, any>;
  private_metadata: Record<string, any>;
  unsafe_metadata: Record<string, any>;
  external_id: string | null;
  created_at: number;
  updated_at: number;
  last_sign_in_at: number | null;
  banned: boolean;
  locked: boolean;
  lockout_expires_in_seconds: number | null;
  verification_attempts_remaining: number;
  last_active_at: number | null;
  create_organization_enabled: boolean;
  totp_enabled: boolean;
  backup_code_enabled: boolean;
  two_factor_enabled: boolean;
  phone_numbers: Array<any>;
  web3_wallets: Array<any>;
  external_accounts: Array<any>;
  password_enabled: boolean;
  saml_accounts: Array<any>;
}

export async function POST(req: NextRequest) {
  try {
    // VÉRIFICATION AUTH ADMIN
    const { userId: currentUserId } = await auth();
    
    console.log("🔍 DEBUG - User ID:", currentUserId);
    
    if (!currentUserId) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin ou secrétaire via l'API Clerk
    const client = await clerkClient();
    const currentUser = await client.users.getUser(currentUserId);
    const userRole = currentUser.publicMetadata?.role as string || "";
    
    console.log("🔍 DEBUG - User role:", userRole);
    
    const isAdmin = userRole.toLowerCase().includes("admin") || userRole === "Administrateur";
    const isSecretaire = userRole.toLowerCase().includes("secretaire") || userRole === "Secrétaire";
    
    console.log("🔍 DEBUG - Is admin?", isAdmin);
    console.log("🔍 DEBUG - Is secretaire?", isSecretaire);
    
    // Autoriser seulement les admins et secrétaires
    if (!isAdmin && !isSecretaire) {
      return NextResponse.json(
        { 
          error: "Accès non autorisé - Rôle admin ou secrétaire requis",
          details: {
            yourRole: userRole || "non défini",
            required: "admin/Administrateur ou secrétaire"
          }
        },
        { status: 403 }
      );
    }

    // 🗄️ VÉRIFICATION ET CRÉATION AUTOMATIQUE DE L'ADMIN DANS PRISMA
    const existingAdmin = await prisma.user.findUnique({
      where: { clerkUserId: currentUserId }
    });

    if (!existingAdmin) {
      console.log("🔄 Admin non trouvé dans Prisma, création automatique...");
      
      // CORRECTION : Ne pas typer la réponse de client.users.getUser()
      const clerkUser = await client.users.getUser(currentUserId);
      const adminEmail = clerkUser.emailAddresses[0]?.emailAddress;
      
      if (!adminEmail) {
        return NextResponse.json(
          { error: "Impossible de créer l'admin: email manquant" },
          { status: 400 }
        );
      }

      await prisma.user.create({
        data: {
          clerkUserId: currentUserId,
          email: adminEmail,
          firstName: clerkUser.firstName || "Admin",
          lastName: clerkUser.lastName || "System",
          role: "ADMIN",
        }
      });
      
      console.log("✅ Admin créé automatiquement dans Prisma");
    }

    // RECUPERATION DES DONNÉES
    const requestData: CreateUserRequest = await req.json();
    
    const { 
      email, 
      firstName, 
      lastName, 
      role, 
      phone, 
      studentNumber, 
      filiere, 
      matiere, 
      enfantName, 
      relation,
      customPassword,
      vagueNumber
    } = requestData;

    console.log("📥 Données reçues:", { 
      email, firstName, lastName, role, phone, vagueNumber 
    });

    // Validation de base
    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Email, prénom, nom et rôle sont requis" },
        { status: 400 }
      );
    }

    // CRÉATION DANS CLERK
    const clerkApiUrl = 'https://api.clerk.com/v1/users';
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;

    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY manquante dans l'environnement");
    }

    const password = customPassword || generateTemporaryPassword();
    console.log("🔑 Mot de passe:", customPassword ? "Personnalisé" : "Temporaire");

    // Créer un username valide
    const username = email.split('@')[0];
    const cleanUsername = username.replace(/[^a-zA-Z0-9_]/g, '_');

    // CORRECTION : Utiliser undefined au lieu de null pour les propriétés optionnelles
    const userData: ClerkUserData = {
      email_address: [email],
      username: cleanUsername,
      first_name: firstName,
      last_name: lastName,
      password: password,
      public_metadata: {
        role: role,
        status: "active",
        createdBy: currentUserId,
        createdAt: new Date().toISOString(),
        phone: phone || undefined,
      }
    };

    if (phone) {
      userData.phone_numbers = [phone];
    }

    // Ajouter les métadonnées spécifiques au rôle
    if (role === "Etudiant") {
      userData.public_metadata.studentNumber = studentNumber;
      userData.public_metadata.filiere = filiere;
      userData.public_metadata.vagueNumber = vagueNumber;
    } else if (role === "Enseignant") {
      userData.public_metadata.matiere = matiere;
      userData.public_metadata.filiere = filiere || undefined;
    } else if (role === "Parent") {
      userData.public_metadata.enfantName = enfantName;
      userData.public_metadata.filiere = filiere;
      userData.public_metadata.relation = relation;
    }

    console.log("📤 Données envoyées à Clerk:", userData);

    // REQUETE À CLERK
    const response = await fetch(clerkApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData: ClerkError = await response.json();
      console.error("❌ Erreur API Clerk:", errorData);
      
      if (errorData.errors?.[0]?.code === 'identifier_exists') {
        return NextResponse.json(
          { error: "Un utilisateur avec cet email existe déjà" },
          { status: 400 }
        );
      }
      
      throw new Error(errorData.errors?.[0]?.message || "Erreur API Clerk");
    }

    // CORRECTION : Typer uniquement la réponse de l'API REST Clerk
    const clerkUser: ClerkUserResponse = await response.json();
    console.log("✅ Utilisateur Clerk créé:", clerkUser.id);

    try {
      const dbUser = await prisma.user.create({
        data: {
          clerkUserId: clerkUser.id,
          email: email,
          firstName: firstName,
          lastName: lastName,
          phone: phone || null,
          role: role.toUpperCase() as "ETUDIANT" | "ENSEIGNANT" | "PARENT" | "ADMIN" | "SECRETAIRE",
          createdById: currentUserId,
        }
      });

      console.log("✅ Utilisateur DB créé:", dbUser.id);

      if (role === "Etudiant") {
        // CORRECTION : Convertir vagueNumber en number si nécessaire, ou utiliser une valeur par défaut
        const vagueNum = vagueNumber ? parseInt(vagueNumber) || 0 : 0;
        const filiereId = filiere ? parseInt(filiere) || 0 : 0;

        await prisma.student.create({
          data: {
            userId: dbUser.id,
            studentNumber: studentNumber || `ETU-${Date.now()}`,
            vagueNumber: vagueNum,
            filiereId: filiereId,
            vagueId: "",
          }
        });
        console.log("Étudiant créé");

      } else if (role === "Enseignant") {
        await prisma.teacher.create({
          data: {
            userId: dbUser.id,
            matiere: matiere || "Non spécifiée",
          }
        });
        console.log("Enseignant créé");

      } else if (role === "Parent") {
        await prisma.parent.create({
          data: {
            userId: dbUser.id,
            enfantName: enfantName || "Non spécifié",
            filiere: filiere || "Non spécifiée",
            relation: relation || "Non spécifiée",
          }
        });
        console.log("Parent créé");
      }

      return NextResponse.json({
        success: true,
        message: `${role} ${firstName} ${lastName} créé avec succès !`,
        user: {
          id: dbUser.id,
          clerkId: clerkUser.id,
          email: email,
          firstName: firstName,
          lastName: lastName,
          role: role,
          phone: phone || "Non renseigné",
          temporaryPassword: customPassword ? "Personnalisé" : password,
          vagueNumber: vagueNumber
        },
        credentials: {
          email: email,
          phone: phone || "Non renseigné",
          password: customPassword ? "Personnalisé" : password,
          loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/sign-in`,
          vagueNumber: vagueNumber
        }
      });

    } catch (dbError: unknown) {
      console.error("❌ Erreur DB, suppression de l'utilisateur Clerk...", dbError);

      try {
        await fetch(`${clerkApiUrl}/${clerkUser.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${clerkSecretKey}` },
        });
        console.log("✅ Utilisateur Clerk supprimé (compensation)");
      } catch (deleteError) {
        console.error("❌ Impossible de supprimer l'utilisateur Clerk:", deleteError);
      }

      const errorMessage = dbError instanceof Error ? dbError.message : "Erreur base de données inconnue";
      throw new Error(`Erreur base de données: ${errorMessage}`);
    }

  } catch (error: unknown) {
    console.error("❌ Erreur détaillée création utilisateur:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    
    return NextResponse.json(
      { 
        error: "Erreur lors de la création: " + errorMessage
      },
      { status: 500 }
    );
  }
}

// GÉNÉRER UN MOT DE PASSE TEMPORAIRE SÉCURISÉ
function generateTemporaryPassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  // Assurer au moins un caractère de chaque type
  const requirements = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz", 
    "0123456789",
    "!@#$%^&*"
  ];
  
  // Ajouter un caractère de chaque type
  requirements.forEach(req => {
    password += req[Math.floor(Math.random() * req.length)];
  });
  
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Mélanger le mot de passe
  return password.split('').sort(() => Math.random() - 0.5).join('');
}