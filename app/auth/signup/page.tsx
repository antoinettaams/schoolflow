"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";

export default function SignUpPage() {
  const router = useRouter();
  const { isLoaded: authLoaded, userId } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();

  const [role, setRole] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiliere, setSelectedFiliere] = useState("");
  const [availableNiveaux, setAvailableNiveaux] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // ⚡ CORRECTION : Vérification des permissions ADMIN
  useEffect(() => {
    if (!authLoaded || !userLoaded) return;

    console.log("🔍 DEBUG - User ID:", userId);
    console.log("🔍 DEBUG - User:", user);

    // Si pas connecté → rediriger vers la page de connexion
    if (!userId) {
      console.log("🚫 Non connecté - Redirection vers /auth/SignIn");
      router.push("/auth/SignIn");
      return;
    }

    // Vérifier si l'utilisateur est admin
    const userRole = (user?.publicMetadata as any)?.role;
    console.log("🔍 DEBUG - User role:", userRole);
    
    const isAdmin = userRole && (
      userRole.toLowerCase().includes("admin") || 
      userRole === "Administrateur" || 
      userRole === "administrateur"
    );
    
    console.log("🔍 DEBUG - Is admin?", isAdmin);
    
    if (!isAdmin) {
      console.log("🚫 Accès refusé - Pas admin - Redirection vers dashboard");
      setAccessDenied(true);
      // Rediriger vers le dashboard approprié selon le rôle
      setTimeout(() => {
        if (userRole === "Secretaire") {
          router.push("/dashboard/secretaire");
        } else if (userRole === "Comptable") {
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

    console.log("✅ Accès autorisé - Admin détecté");
    setIsLoading(false);
  }, [authLoaded, userLoaded, userId, user, router]);

  const filieres = [
      { id: "informatique", name: "Informatique", niveaux: ["Licence", "Master"] },
      { id: "mathematiques", name: "Mathématiques", niveaux: ["Licence", "Master"] },
    ];
  
    // Mettre à jour les niveaux disponibles quand une filière est sélectionnée
    useEffect(() => {
      if (selectedFiliere) {
        const filiere = filieres.find(f => f.id === selectedFiliere);
        if (filiere) {
          setAvailableNiveaux(filiere.niveaux);
        }
      } else {
        setAvailableNiveaux([]);
      }
    }, [selectedFiliere]);
  
    const renderRoleFields = () => {
      switch (role) {
        case "Etudiant":
          return (
            <div className="space-y-4">
              <div>
                <label htmlFor="studentNumber" className="block mb-2 font-title font-medium text-dark">
                  Numéro d'étudiant
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
  
              <div>
                <label htmlFor="niveau" className="block mb-2 font-title font-medium text-dark">
                  Niveau d'étude *
                </label>
                <select
                  id="niveau"
                  name="niveau"
                  className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                  required
                  disabled={!selectedFiliere}
                >
                  <option value="">
                    {!selectedFiliere
                      ? "-- Sélectionnez d'abord une filière --"
                      : "-- Sélectionnez le niveau --"}
                  </option>
                  {availableNiveaux.map((niveau, index) => (
                    <option key={index} value={niveau}>
                      {niveau}
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
                  Nom de l'enfant *
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
                  Filière de l'enfant *
                </label>
                <select
                  id="filiere"
                  name="filiere"
                  className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                  required
                >
                  <option value="">-- Sélectionnez la filière de l'enfant --</option>
                  {filieres.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="relation" className="block mb-2 font-title font-medium text-dark">
                  Relation avec l'enfant *
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
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
  
      try {
        const formData = new FormData(e.target as HTMLFormElement);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        
        // Extraire prénom et nom
        const nameParts = name.split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || firstName;

        // Préparer les données pour l'API
        const userData = {
          email,
          firstName,
          lastName,
          role,
          phone: phone || "",
          studentNumber: formData.get("studentNumber") as string,
          filiere: formData.get("filiere") as string,
          niveau: formData.get("niveau") as string,
          matiere: formData.get("matiere") as string,
          enfantName: formData.get("enfantName") as string,
          relation: formData.get("relation") as string,
        };

        console.log("📤 Données envoyées à l'API:", userData);
  
        // 🔥 APPEL API BACKEND
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
  
        // 🔥 SUCCÈS - Afficher les identifiants
        const successMessage = `✅ Compte ${role} créé avec succès !
  
📧 Email: ${email}
📞 Téléphone: ${phone || 'Non renseigné'}
🔑 Mot de passe temporaire: ${result.user.temporaryPassword}

📋 Identifiants à communiquer à l'utilisateur :
- Lien de connexion: ${window.location.origin}/sign-in
- Email: ${email}
- Mot de passe temporaire: ${result.user.temporaryPassword}

⚠️ L'utilisateur devra changer son mot de passe à la première connexion.`;
        
        alert(successMessage);
        
        // Réinitialiser le formulaire
        setRole("");
        setSelectedFiliere("");
        setAvailableNiveaux([]);
        
        // Reset form fields
        const form = e.target as HTMLFormElement;
        form.reset();
        
      } catch (err: any) {
        alert(err.message || "❌ Erreur lors de la création du compte");
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
              ❌ Seul un administrateur peut créer de nouveaux comptes.
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-5xl h-auto min-h-[800px] md:h-[calc(100vh-32px)] rounded-lg shadow-xl overflow-hidden flex flex-col md:flex-row">
        <div className="bg-principal relative w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-10 text-white text-center">
          <div className="mb-8">
            <Link href="/" className="no-underline flex items-center space-x-2 hover:underline">
              <svg className="h-8 w-8 text-tertiary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5v-2l-10 5-10-5v2z" />
              </svg>
              <span className="text-xl font-title font-bold text-tertiary">SchoolFlow</span>
            </Link>
          </div>
          <h1 className="text-3xl font-title sm:text-4xl md:text-5xl font-bold">Bienvenue</h1>
          <p className="mt-4 text-lg opacity-90 max-w-md">
            Créer de nouveaux comptes pour votre établissement
          </p>
        </div>

        <div className="relative flex-1 bg-white border-l border-gray-200 flex flex-col items-center justify-center p-4 md:p-8">
          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">
            <h2 className="text-2xl font-title font-bold text-center text-dark mb-6">
              Créer un compte
            </h2>

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
                  setAvailableNiveaux([]);
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
              {isSubmitting ? "Création en cours..." : "Créer le compte"}
            </button>

            <p className="text-center text-dark text-sm">
              <Link
                href="/dashboard/admin"
                className="text-lien font-link no-underline hover:underline font-medium"
              >
                ← Retour au dashboard
              </Link>
            </p>
          </form>
          <div className="pt-4 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm">
              Gestionnaire d'école{" "}
              <span className="font-bold font-title text-dark">SchoolFlow</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}