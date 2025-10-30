"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";

// ✅ Interface pour typer les métadonnées
interface UserPublicMetadata {
  role?: string;
}

export default function SignUpPage() {
  const router = useRouter();
  const { isLoaded: authLoaded, userId } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();

  const [role, setRole] = useState("Etudiant");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiliere, setSelectedFiliere] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isSecretaire, setIsSecretaire] = useState(false);

  // ✅ Tableau des filières SIMPLIFIÉ (sans niveaux)
  const filieres = [
    { id: "informatique", name: "Informatique" },
    { id: "mathematiques", name: "Mathématiques" },
  ];

  // ⚡ Vérification des permissions ADMIN ou SECRETAIRE
  useEffect(() => {
    if (!authLoaded || !userLoaded) return;

    console.log("🔍 DEBUG - User ID:", userId);
    console.log("🔍 DEBUG - User:", user);

    if (!userId) {
      console.log("🚫 Non connecté - Redirection vers /auth/SignIn");
      router.push("/auth/SignIn");
      return;
    }

    // ✅ CORRIGÉ : Typage approprié pour les métadonnées
    const userRole = (user?.publicMetadata as UserPublicMetadata)?.role;
    console.log("🔍 DEBUG - User role:", userRole);
    
    const isAdmin = userRole && (
      userRole.toLowerCase().includes("admin") || 
      userRole === "Administrateur" || 
      userRole === "administrateur"
    );

    const isSecretaireUser = userRole && (
      userRole.toLowerCase().includes("secretaire") || 
      userRole === "Secrétaire" || 
      userRole === "secretaire"
    );
    
    console.log("🔍 DEBUG - Is admin?", isAdmin);
    console.log("🔍 DEBUG - Is secretaire?", isSecretaireUser);
    
    if (!isAdmin && !isSecretaireUser) {
      console.log("🚫 Accès refusé - Pas admin ni secrétaire - Redirection vers dashboard");
      setAccessDenied(true);
      toast.error("Accès refusé : réservé aux administrateurs et secrétaires");
      setTimeout(() => {
        if (userRole === "Comptable") {
          router.push("/dashboard/comptable");
        } else if (userRole === "Enseignant") {
          router.push("/dashboard/teacher");
        } else if (userRole === "Etudiant") {
          router.push("/dashboard/student");
        } else {
          router.push("/dashboard");
        }
      }, 2000);
      return;
    }

    if (isSecretaireUser) {
      setIsSecretaire(true);
      setRole("Etudiant");
    }

    console.log("✅ Accès autorisé - Admin ou Secrétaire détecté");
    setIsLoading(false);
  }, [authLoaded, userLoaded, userId, user, router]);

  const renderRoleFields = () => {
    switch (role) {
      case "Etudiant":
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="studentNumber" className="block mb-2 font-title font-medium text-dark">
                Numéro d&apos;étudiant
              </label>
              <input
                id="studentNumber"
                name="studentNumber"
                type="text"
                placeholder="Ex: ETU-2024-001"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
              />
            </div>

            <div>
              <label htmlFor="vagueNumber" className="block mb-2 font-title font-medium text-dark">
                Numéro de Vague
              </label>
              <input
                id="vagueNumber"
                name="vagueNumber"
                type="text"
                placeholder="Ex: Janvier: 2024-2025"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
              />
            </div>
  
            <div>
              <label htmlFor="filiere" className="block mb-2 font-title font-medium text-dark">
                Filière *
              </label>
              <select
                id="filiere"
                name="filiere"
                value={selectedFiliere}
                onChange={(e) => setSelectedFiliere(e.target.value)}
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                required
              >
                <option value="">-- Sélectionnez une filière --</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
  
      case "Enseignant":
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="matiere" className="block mb-2 font-title font-medium text-dark">
                Matière enseignée
              </label>
              <input
                id="matiere"
                name="matiere"
                type="text"
                placeholder="Ex: Mathématiques, Physique, etc."
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
              />
            </div>
          </div>
        );
  
      case "Parent":
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="enfantName" className="block mb-2 font-title font-medium text-dark">
                Nom de l&apos;enfant *
              </label>
              <input
                id="enfantName"
                name="enfantName"
                type="text"
                placeholder="Ex: Jean Dupont"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                required
              />
            </div>
  
            <div>
              <label htmlFor="filiere" className="block mb-2 font-title font-medium text-dark">
                Filière de l&apos;enfant *
              </label>
              <select
                id="filiere"
                name="filiere"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                required
              >
                <option value="">-- Sélectionnez la filière de l&apos;enfant --</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="relation" className="block mb-2 font-title font-medium text-dark">
                Relation avec l&apos;enfant *
              </label>
              <select
                id="relation"
                name="relation"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                required
              >
                <option value="">-- Sélectionnez --</option>
                <option value="Père">Père</option>
                <option value="Mère">Mère</option>
                <option value="Tuteur">Tuteur</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>
        );
  
      case "Secretaire":
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Aucune information supplémentaire requise pour la secrétaire.
            </p>
          </div>
        );
  
      case "Comptable":
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Aucune information supplémentaire requise pour le comptable.
            </p>
          </div>
        );
  
      case "Censeur":
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Aucune information supplémentaire requise pour le censeur.
            </p>
          </div>
        );
  
      default:
        return null;
    }
  };

  // ✅ Interface pour les données utilisateur
  interface UserData {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phone: string;
    studentNumber?: string;
    filiere?: string;
    matiere?: string;
    enfantName?: string;
    relation?: string;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // ✅ Toast de chargement
    const loadingToast = toast.loading('Création du compte en cours...');

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const phone = formData.get("phone") as string;
      
      const nameParts = name.split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || firstName;

      // ✅ Données utilisateur
      const userData: UserData = {
        email,
        firstName,
        lastName,
        role: isSecretaire ? "Etudiant" : role,
        phone: phone || "",
        studentNumber: formData.get("studentNumber") as string,
        filiere: formData.get("filiere") as string,
        matiere: formData.get("matiere") as string,
        enfantName: formData.get("enfantName") as string,
        relation: formData.get("relation") as string,
      };

      console.log("📤 Données envoyées à l&apos;API:", userData);

      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création');
      }

      // ✅ SUCCÈS - Toast de succès avec informations détaillées
      toast.dismiss(loadingToast);
      toast.success(
        <div className="max-w-md">
          <div className="font-bold text-green-800 mb-2">
            ✅ Compte {isSecretaire ? "Étudiant" : role} créé avec succès !
          </div>
          <div className="text-sm space-y-1">
            <div><strong>📧 Email:</strong> {email}</div>
            <div><strong>📞 Téléphone:</strong> {phone || 'Non renseigné'}</div>
            <div><strong>🔑 Mot de passe temporaire:</strong> {result.user.temporaryPassword}</div>
            <div className="mt-2 text-xs text-gray-600">
              L&apos;utilisateur devra changer son mot de passe à la première connexion.
            </div>
          </div>
        </div>,
        { 
          duration: 120000, // Reste affiché 2 minutes
          icon: '🎉'
        }
      );
      
      // Réinitialisation
      if (!isSecretaire) {
        setRole("");
      }
      setSelectedFiliere("");
      
      const form = e.target as HTMLFormElement;
      form.reset();
      
    } catch (err: unknown) {
      // ✅ ERREUR - Toast d'erreur
      toast.dismiss(loadingToast);
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la création du compte";
      toast.error(
        <div>
          <div className="font-bold">❌ Erreur</div>
          <div>{errorMessage}</div>
        </div>,
        { duration: 5000 }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h1 className="text-xl font-bold mb-2">Accès Refusé</h1>
            <p className="mb-4">
              ❌ Seuls les administrateurs et secrétaires peuvent créer de nouveaux comptes.
            </p>
            <p className="text-sm text-gray-600">
              Vous allez être redirigé vers votre dashboard...
            </p>
          </div>
          <Link 
            href="/dashboard" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-block"
          >
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ✅ Composant Toaster pour afficher les notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            border: '1px solid #e5e5e5',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
          success: {
            duration: 8000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 6000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
          loading: {
            duration: Infinity, // Reste jusqu'à ce qu'on le dismiss manuellement
          },
        }}
      />
      
      <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="relative w-full max-w-5xl h-auto min-h-[800px] md:h-[calc(100vh-32px)] rounded-lg shadow-xl overflow-hidden flex flex-col md:flex-row">
          <div className="bg-principal relative w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-10 text-white text-center">     
              <Link href="/" className="flex items-center justify-center">
                <Image 
                  src="/images/logo.png" 
                  alt="SchoolFlow Logo"
                  width={192}       
                  height={192}      
                  className="h-48 w-48"
                />
              </Link>
            <h1 className="text-3xl font-title sm:text-4xl md:text-5xl font-bold">Bienvenue</h1>
            <p className="mt-2 text-lg opacity-90 max-w-md">
              {isSecretaire 
                ? "Inscription des nouveaux étudiants" 
                : "Créer de nouveaux comptes pour votre établissement"
              }
            </p>
            {isSecretaire && (
              <div className="mt-4 bg-blue-800 bg-opacity-50 p-3 rounded-lg">
                <p className="text-sm font-medium">
                  📝 Mode Secrétaire : Inscription étudiants uniquement
                </p>
              </div>
            )}
          </div>

          <div className="relative flex-1 bg-white border-l border-gray-200 flex flex-col items-center justify-center p-3 md:p-8">
            <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">
              <h2 className="text-2xl font-title font-bold text-center text-dark mb-6">
                {isSecretaire ? "Inscrire un étudiant" : "Créer un compte"}
              </h2>

              {/* SELECTION DU ROLE - CACHÉ POUR LA SECRETAIRE */}
              {!isSecretaire ? (
                <div className="mb-6">
                  <label htmlFor="role" className="block mb-2 font-title font-medium text-dark">
                    Sélectionnez le rôle *
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      setSelectedFiliere("");
                    }}
                    className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                    required
                  >
                    <option value="">-- Choisir un rôle --</option>
                    <option value="Enseignant">Enseignant</option>
                    <option value="Etudiant">Étudiant</option>
                    <option value="Parent">Parent</option>
                    <option value="Secretaire">Secrétaire</option>
                    <option value="Comptable">Comptable</option>
                    <option value="Censeur">Censeur</option>
                  </select>
                </div>
              ) : (
                // AFFICHAGE DU ROLE FIXE POUR LA SECRETAIRE
                <div className="mb-6">
                  <label className="block mb-2 font-title font-medium text-dark">
                    Rôle
                  </label>
                  <div className="w-full p-3 bg-green-50 border border-green-200 rounded-md text-green-800 font-medium">
                    👨‍🎓 Étudiant (Mode Secrétaire)
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    La secrétaire ne peut inscrire que des étudiants
                  </p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div>
                  <label htmlFor="name" className="block mb-2 font-title font-medium text-dark">
                    Nom complet *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Entrer votre nom complet"
                    className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block mb-2 font-title font-medium text-dark">
                    Adresse e-mail *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="exemple@gmail.com"
                    className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                    required
                  />
                </div>

                {/* CHAMP NUMÉRO DE TÉLÉPHONE */}
                <div>
                  <label htmlFor="phone" className="block mb-2 font-title font-medium text-dark">
                    Numéro de téléphone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Ex: +225 07 12 34 56 78"
                    className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                  />
                </div>
              </div>

              {role && <div className="mb-6">{renderRoleFields()}</div>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 mb-4 w-full bg-lien font-link text-white p-2 rounded-md font-semibold hover:bg-principal transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting 
                  ? "Création en cours..." 
                  : isSecretaire 
                    ? "Inscrire l&apos;étudiant" 
                    : "Créer le compte"
                }
              </button>

              <p className="text-center text-dark text-sm">
                <Link
                  href={isSecretaire ? "/dashboard/secretaire" : "/dashboard/admin"}
                  className="text-lien font-link no-underline hover:underline font-medium"
                >
                  ← Retour au dashboard
                </Link>
              </p>
            </form>
            <div className="pt-4 border-t border-gray-200 text-center">
              <p className="text-gray-600 text-sm">
                Gestionnaire d&apos;école{" "}
                <span className="font-bold font-title text-dark">SchoolFlow</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}