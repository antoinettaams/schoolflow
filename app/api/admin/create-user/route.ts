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

// Fonction pour formater le numéro de téléphone
function formatPhoneNumber(phone: string): string | null {
  if (!phone) return null;
  
  // Supprimer tous les caractères non numériques sauf le +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  console.log(`📞 Formatage téléphone: ${phone} -> ${cleaned}`);
  
  // Si le numéro commence par 229 sans +, ajouter le +
  if (cleaned.startsWith('229') && !cleaned.startsWith('+229')) {
    cleaned = '+' + cleaned;
  }
  
  // Si le numéro commence par 0, le convertir en +229
  if (cleaned.startsWith('0')) {
    cleaned = '+229' + cleaned.substring(1);
  }
  
  // CORRECTION: Pour le Bénin, les numéros doivent avoir 8 chiffres après +229
  if (cleaned.startsWith('+229')) {
    const digitsAfterCode = cleaned.substring(4).replace(/\D/g, '');
    
    // Vérifier la longueur
    if (digitsAfterCode.length !== 8) {
      console.warn(`❌ Numéro Bénin invalide: ${cleaned} (${digitsAfterCode.length} chiffres, attendu: 8)`);
      return null;
    }
    
    // Reconstruire le numéro valide
    cleaned = '+229' + digitsAfterCode;
    console.log(`✅ Numéro Bénin formaté: ${cleaned}`);
  }
  
  // Vérifier le format E.164
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  
  if (e164Regex.test(cleaned)) {
    console.log(`✅ Format E.164 valide: ${cleaned}`);
    return cleaned;
  }
  
  console.warn(`❌ Format de téléphone invalide: ${phone} -> ${cleaned}`);
  return null;
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

    // RÉCUPÉRER LES DONNÉES
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

    // AFFICHER TOUTES LES DONNÉES POUR DEBUG
    console.log("📥 DONNÉES COMPLÈTES reçues:", { 
      email, 
      firstName, 
      lastName, 
      role, 
      phone, 
      studentNumber, 
      filiereId, 
      vagueNumber,
      matiere, 
      enfantName, 
      relation,
      customPassword: customPassword ? "OUI" : "NON"
    });

    // Validation de base
    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Email, prénom, nom et rôle sont requis" },
        { status: 400 }
      );
    }

    // FORMATER LE NUMÉRO DE TÉLÉPHONE
    const formattedPhone = phone ? formatPhoneNumber(phone) : null;
    
    console.log("📞 Téléphone formaté:", {
      original: phone,
      formatted: formattedPhone,
      isValid: !!formattedPhone,
      length: formattedPhone ? formattedPhone.length : 0
    });

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

    // PRÉPARER LES MÉTADONNÉES - NE PAS ENVOYER LES CHAMPS NULL/UNDEFINED
    const publicMetadata: any = {
      role: role,
      status: "active",
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
    };

    // Ajouter seulement les champs qui ont des valeurs
    if (formattedPhone || phone) {
      publicMetadata.phone = formattedPhone || phone;
    }
    if (studentNumber) {
      publicMetadata.studentNumber = studentNumber;
    }
    if (filiereId) {
      publicMetadata.filiereId = filiereId;
    }
    if (matiere) {
      publicMetadata.matiere = matiere;
    }
    if (enfantName) {
      publicMetadata.enfantName = enfantName;
    }
    if (relation) {
      publicMetadata.relation = relation;
    }
    if (vagueNumber) {
      publicMetadata.vagueNumber = vagueNumber;
    }

    console.log("📋 Métadonnées préparées:", publicMetadata);

    // Données pour Clerk
    const userData: any = {
      email_address: [email],
      username: cleanUsername,
      first_name: firstName,
      last_name: lastName,
      password: password,
      public_metadata: publicMetadata
    };

    // Ajouter le numéro de téléphone seulement s'il est valide E.164
    if (formattedPhone) {
      userData.phone_numbers = [formattedPhone];
      console.log("✅ Téléphone ajouté comme phone_number:", formattedPhone);
    } else if (phone) {
      console.warn("❌ Téléphone non ajouté comme phone_number - format invalide, mais conservé dans métadonnées");
    }

    console.log("📤 Données envoyées à Clerk:", JSON.stringify(userData, null, 2));

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
    console.log("✅ Utilisateur Clerk créé:", clerkUser.id);

    // RÉPONSE DE SUCCÈS
    return NextResponse.json({
      success: true,
      message: `${role} ${firstName} ${lastName} créé avec succès !`,
      user: {
        clerkId: clerkUser.id,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: role,
        phone: formattedPhone || phone || "Non renseigné",
        phoneStatus: formattedPhone ? "Validé" : (phone ? "Format invalide" : "Non renseigné"),
        temporaryPassword: customPassword ? "Personnalisé" : password,
        vagueNumber: vagueNumber || "Non assigné",
        studentNumber: studentNumber || "Non attribué",
        filiereId: filiereId || "Non assigné"
      },
      credentials: {
        email: email,
        phone: formattedPhone || phone || "Non renseigné",
        password: customPassword ? "Personnalisé" : password,
        loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/sign-in`
      }
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