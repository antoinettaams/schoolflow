// app/api/admin/create-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from '@clerk/nextjs/server';

interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  studentNumber?: string;
  filiereId?: string;
  matiere?: string;
  enfantName?: string;
  relation?: string;
  customPassword?: string;
  vagueNumber?: string;
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

    // Vérifier que l'utilisateur est admin via l'API Clerk
    const client = await clerkClient();
    const currentUser = await client.users.getUser(currentUserId);
    const userRole = currentUser.publicMetadata?.role as string || "";
    
    console.log("🔍 DEBUG - User role:", userRole);
    
    const isAdmin = userRole && (
      userRole.toLowerCase().includes("admin") || 
      userRole === "Administrateur" ||
      userRole === "ADMIN"
    );

    const isSecretaire = userRole && (
      userRole.toLowerCase().includes("secretaire") || 
      userRole === "Secrétaire" ||
      userRole === "SECRETAIRE"
    );
    
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

    console.log("Accès autorisé pour le rôle:", userRole);

    //  RÉCUPÉRER LES DONNÉES
    const requestData: CreateUserRequest = await req.json();
    
    const { 
      email, 
      firstName, 
      lastName, 
      role, 
      phone, 
      studentNumber, 
      filiereId, 
      matiere, 
      enfantName, 
      relation,
      customPassword,
      vagueNumber
    } = requestData;

    console.log("📥 Données reçues:", { 
      email, firstName, lastName, role, phone, vagueNumber, filiereId
    });

    // Validation de base
    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Email, prénom, nom et rôle sont requis" },
        { status: 400 }
      );
    }

    //  CRÉATION DANS CLERK
    const clerkApiUrl = 'https://api.clerk.com/v1/users';
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;

    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY manquante dans l'environnement");
    }

    const password = customPassword || generateTemporaryPassword();
    console.log("Mot de passe:", customPassword ? "Personnalisé" : "Temporaire");

    // Créer un username valide
    const username = email.split('@')[0];
    const cleanUsername = username.replace(/[^a-zA-Z0-9_]/g, '_');

    // Données pour Clerk
    const userData = {
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
        phone: phone || null,
        studentNumber: studentNumber,
        filiereId: filiereId,
        matiere: matiere,
        enfantName: enfantName,
        relation: relation,
        vagueNumber: vagueNumber
      }
    };

    if (phone) {
      userData.phone_numbers = [phone];
    }

    console.log("Données envoyées à Clerk:", userData);

    // APPEL À CLERK
    const response = await fetch(clerkApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erreur API Clerk:", errorData);
      
      if (errorData.errors?.[0]?.code === 'identifier_exists') {
        return NextResponse.json(
          { error: "Un utilisateur avec cet email existe déjà" },
          { status: 400 }
        );
      }
      
      throw new Error(errorData.errors?.[0]?.message || "Erreur API Clerk");
    }

    const clerkUser = await response.json();
    console.log("Utilisateur Clerk créé:", clerkUser.id);

    // RÉPONSE DE SUCCÈS (sans Prisma pour l'instant)
    return NextResponse.json({
      success: true,
      message: `${role} ${firstName} ${lastName} créé avec succès dans Clerk !`,
      warning: "La base de données locale n'est pas encore configurée",
      user: {
        clerkId: clerkUser.id,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: role,
        phone: phone || "Non renseigné",
        temporaryPassword: customPassword ? "Personnalisé" : password,
        vagueNumber: vagueNumber,
        studentNumber: studentNumber
      },
      credentials: {
        email: email,
        phone: phone || "Non renseigné",
        password: customPassword ? "Personnalisé" : password,
        loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/sign-in`,
        vagueNumber: vagueNumber
      },
      nextSteps: [
        "Exécutez 'npx prisma db push' pour créer les tables dans la base de données",
        "Les utilisateurs pourront quand même se connecter via Clerk",
        "La synchronisation avec la base locale se fera ultérieurement"
      ]
    });

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
  
  const requirements = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz", 
    "0123456789",
    "!@#$%^&*"
  ];
  
  requirements.forEach(req => {
    password += req[Math.floor(Math.random() * req.length)];
  });
  
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

