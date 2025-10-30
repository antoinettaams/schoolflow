"use client";

import { useSignIn, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";

// Interface pour l'utilisateur Clerk
interface ClerkUser {
  publicMetadata?: {
    role?: string;
  };
}

// Interface pour les erreurs Clerk
interface ClerkError {
  errors?: Array<{
    code?: string;
    message?: string;
  }>;
  message?: string;
}

export default function SigninPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { user, isSignedIn } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔥 REDIRECTION SI DÉJÀ CONNECTÉ
  useEffect(() => {
    if (isSignedIn && user) {
      console.log("✅ Utilisateur déjà connecté, détermination du dashboard...");
      redirectToDashboard(user);
    }
  }, [isSignedIn, user]);

  // 🔥 FONCTION DE REDIRECTION BASÉE SUR LE RÔLE
  const redirectToDashboard = (user: ClerkUser) => {
    const userRole = user.publicMetadata?.role;
    
    console.log("🔍 Rôle utilisateur:", userRole);
    
    const roleRoutes: Record<string, string> = {
      'Administrateur': '/dashboard/admin',
      'Secretaire': '/dashboard/secretaire', 
      'Comptable': '/dashboard/comptable',
      'Censeur': '/dashboard/censeur',
      'Professeur': '/dashboard/teacher',
      'Élève': '/dashboard/student',
      'Parent': '/dashboard/parent',
    };

    const redirectPath = userRole ? roleRoutes[userRole] : '/not-found';
    
    console.log('🎯 Redirection directe vers:', redirectPath);
    window.location.href = redirectPath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isSignedIn) return;

    setIsLoading(true);
    setError("");

    try {
      // Étape 1: Tentative de connexion
      const result = await signIn.create({
        identifier: email,
        password,
      });

      // Étape 2: Vérifier le statut
      if (result.status === "complete") {
        console.log("✅ Connexion réussie, activation de la session...");
        
        // Étape 3: Activer la session
        await setActive({ session: result.createdSessionId });
        window.location.reload();
        // Redirection automatique via useEffect après que isSignedIn soit true
      } else {
        console.log("❌ Statut de connexion:", result.status);
        
        if (result.status === "needs_second_factor") {
          setError("Vérification à deux facteurs requise");
        } else if (result.status === "needs_new_password") {
          setError("Mot de passe expiré, veuillez le changer");
        } else {
          setError("Échec de la connexion. Veuillez réessayer.");
        }
      }
    } catch (err) {
      console.error("❌ Erreur détaillée:", err);
      
      const clerkError = err as ClerkError;
      
      if (clerkError.errors && clerkError.errors[0]) {
        const errorDetail = clerkError.errors[0];
        if (errorDetail.code === "form_identifier_not_found") {
          setError("Aucun compte trouvé avec cet email/identifiant");
        } else if (errorDetail.code === "form_password_incorrect") {
          setError("Mot de passe incorrect");
        } else if (errorDetail.code === "form_param_format_invalid") {
          setError("Format d'email invalide");
        } else {
          setError(errorDetail.message || "Erreur de connexion");
        }
      } else {
        setError("Erreur inattendue lors de la connexion");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Si déjà connecté, afficher un message de chargement
  if (isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirection vers votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center bg-white min-h-screen p-3">
      <div className="w-full max-w-4xl h-auto md:h-[500px] rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* --- Partie gauche (Branding) --- */}
        <div className="w-full md:w-1/2 bg-principal text-white flex flex-col items-center justify-center text-center md:flex">
          <div className="">
            <Link href="/" className="flex items-center justify-center">
              <Image 
                src="/images/logo.png" 
                alt="SchoolFlow Logo" 
                className="h-48 w-48"
                width={192}
                height={192}
                priority
              />
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Bienvenue !</h1>
          <p className="text-lg text-gray-100 max-w-xs">
            Connectez-vous pour accéder à votre espace personnel.
          </p>
        </div>

        {/* --- Partie droite (Formulaire) --- */}
        <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-xs">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-title font-bold text-dark">Connexion</h2>
              <p className="text-gray-600 mt-2">Accédez à votre compte</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block mb-2 font-medium text-dark">
                  Email ou Identifiant
                </label>
                <input
                  id="email"
                  name="email"
                  type="text"
                  placeholder="Entrez votre email ou identifiant"
                  className="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bluvy focus:border-transparent transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="password" className="font-medium text-dark">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => window.location.href = '/auth/forgot-password'}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Entrez votre mot de passe"
                  className="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bluvy focus:border-transparent transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading || !isLoaded}
                className="w-full bg-lien text-white p-2 rounded-lg font-semibold hover:bg-principal transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-4"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connexion...
                  </>
                ) : (
                  `Se connecter ${!isLoaded ? '(Chargement...)' : ''}`
                )}
              </button>

              <div className="text-center pt-3">
                <p className="text-gray-600 text-sm">
                  Vous n&apos;avez pas de compte ?{" "}
                  <Link 
                    href="/auth/signup" 
                    className="text-lien font-medium hover:underline"
                  >
                    S&apos;inscrire
                  </Link>
                </p>
              </div>
            </form>

            <div className="text-center mt-2 pt-3 border-t border-gray-200">
              <p className="text-gray-600 text-sm">
                Gestionnaire d&apos;école{" "}
                <span className="font-bold font-title text-dark">SchoolFlow</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}