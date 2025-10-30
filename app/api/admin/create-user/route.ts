// app/api/admin/create-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    // 🔐 VÉRIFICATION AUTH ADMIN AVEC API CLERK
    const { userId } = await auth();
    
    console.log("🔍 DEBUG - User ID:", userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin ou secrétaire via l'API Clerk
    const client = await clerkClient();
    const currentUser = await client.users.getUser(userId);
    const userRole = currentUser.publicMetadata.role as string;
    
    console.log("🔍 DEBUG - User role:", userRole);
    console.log("🔍 DEBUG - PublicMetadata:", currentUser.publicMetadata);
    
    const isAdmin = userRole && (
      userRole.toLowerCase().includes("admin") || 
      userRole === "Administrateur"
    );

    const isSecretaire = userRole && (
      userRole.toLowerCase().includes("secretaire") || 
      userRole === "Secrétaire"
    );
    
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

    // ✅ CORRIGÉ : 'phone' est gardé car utilisé dans le formulaire
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
      departement,
      specialite,
      domaine,
      customPassword,
      vagueNumber
    } = await req.json();

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

    // 🔥 SOLUTION : Utiliser l'API fetch directement vers l'API Clerk
    const clerkApiUrl = 'https://api.clerk.com/v1/users';
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;

    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY manquante dans l'environnement");
    }

    const password = customPassword || generateTemporaryPassword();

    console.log("🔑 Mot de passe:", customPassword ? "Personnalisé" : "Temporaire");

    // 🔥 CORRECTION : Créer un username à partir de l'email
    const username = email.split('@')[0]; // Prend la partie avant le @
    const cleanUsername = username.replace(/[^a-zA-Z0-9_]/g, '_'); // Nettoie le username

    // ✅ CORRIGÉ : Données pour l'API Clerk avec numéro de téléphone
    const userData = {
      email_address: [email],
      username: cleanUsername,
      first_name: firstName,
      last_name: lastName,
      password: password,
      // ✅ AJOUT du numéro de téléphone dans les données utilisateur
      ...(phone && {
        phone_numbers: [phone] // Ajoute le numéro si fourni
      }),
      public_metadata: {
        role: role,
        status: "active",
        createdBy: userId,
        createdAt: new Date().toISOString(),
        // ✅ AJOUT du phone dans les métadonnées aussi
        phone: phone || null,
        // Champs spécifiques selon le rôle
        ...(role === "Etudiant" && {
          studentNumber: studentNumber,
          filiere: filiere,
          vagueNumber: vagueNumber
        }),
        ...(role === "Enseignant" && {
          matiere: matiere,
          filiere: filiere || null
        }),
        ...(role === "Parent" && {
          enfantName: enfantName,
          filiere: filiere,
          relation: relation
        }),
        ...(role === "Secretaire" && {
          departement: departement
        }),
        ...(role === "Comptable" && {
          specialite: specialite
        }),
        ...(role === "Censeur" && {
          domaine: domaine
        })
      }
    };

    console.log("📤 Données envoyées à Clerk:", userData);

    // 🔥 APPEL DIRECT À L'API CLERK
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

    const createdUser = await response.json();
    console.log("✅ Utilisateur créé avec succès:", createdUser.id);

    return NextResponse.json({
      success: true,
      message: `${role} ${firstName} ${lastName} créé avec succès !`,
      user: {
        id: createdUser.id,
        email: createdUser.email_addresses?.[0]?.email_address,
        firstName: createdUser.first_name,
        lastName: createdUser.last_name,
        role: role,
        phone: phone || "Non renseigné", // ✅ RETOURNER le numéro de téléphone
        temporaryPassword: customPassword ? "Personnalisé" : password,
        vagueNumber: vagueNumber
      },
      credentials: {
        email: email,
        phone: phone || "Non renseigné", // ✅ AJOUT dans les credentials
        password: customPassword ? "Personnalisé" : password,
        loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/sign-in`,
        vagueNumber: vagueNumber
      }
    });

  } catch (error) {
    console.error("❌ Erreur détaillée création utilisateur:", error);
    
    return NextResponse.json(
      { 
        error: "Erreur lors de la création: " + (error as Error).message
      },
      { status: 500 }
    );
  }
}

// 🔥 GÉNÉRER UN MOT DE PASSE TEMPORAIRE SÉCURISÉ
function generateTemporaryPassword() {
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
  
  // Compléter avec des caractères aléatoires
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Mélanger le mot de passe
  return password.split('').sort(() => Math.random() - 0.5).join('');
}