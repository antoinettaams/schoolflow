"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";

// Interfaces pour les types
interface UserPublicMetadata {
  role?: string;
} 

interface Filiere {
  id: string;
  name: string;
  description?: string;
  duree?: string;
  vagues?: Vague[];
}

interface Vague {
  id: string;
  name: string;
  description?: string;
  periode?: string;
}

interface UserData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  studentNumber?: string;
  filiereId?: string;     
  vagueNumber?: string;    
  matiere?: string;
  enfantName?: string;
  relation?: string;
}

export default function SignUpPage() {
  const router = useRouter();
  const { isLoaded: authLoaded, userId } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();

  const [role, setRole] = useState("Etudiant");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiliere, setSelectedFiliere] = useState("");
  const [selectedVague, setSelectedVague] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isSecretaire, setIsSecretaire] = useState(false);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [vagues, setVagues] = useState<Vague[]>([]);
  const [loadingFilieres, setLoadingFilieres] = useState(true);

  // Charger les filières et vagues disponibles
  useEffect(() => {
    const fetchFilieresVagues = async () => {
      try {
        setLoadingFilieres(true);
        const response = await fetch('/api/filieres-vagues');
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des filières et vagues');
        }

        const data = await response.json();
        setFilieres(data.filieres || []);
        setVagues(data.vagues || []);
      } catch (error) {
        console.error("Erreur chargement filières/vagues:", error);
        toast.error("Erreur lors du chargement des filières et vagues");
      } finally {
        setLoadingFilieres(false);
      }
    };

    fetchFilieresVagues();
  }, []);

  // Vérification des permissions ADMIN ou SECRETAIRE
  useEffect(() => {
    if (!authLoaded || !userLoaded) return;

    console.log("DEBUG - User ID:", userId);
    console.log("DEBUG - User:", user);

    if (!userId) {
      console.log("Non connecté - Redirection vers /auth/SignIn");
      router.push("/auth/SignIn");
      return;
    }

    const userRole = (user?.publicMetadata as UserPublicMetadata)?.role;
    console.log("DEBUG - User role:", userRole);
    
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
    
    console.log("DEBUG - Is admin?", isAdmin);
    console.log("DEBUG - Is secretaire?", isSecretaireUser);
    
    if (!isAdmin && !isSecretaireUser) {
      console.log("Accès refusé - Pas admin ni secrétaire - Redirection vers dashboard");
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

    console.log("Accès autorisé - Admin ou Secrétaire détecté");
    setIsLoading(false);
  }, [authLoaded, userLoaded, userId, user, router]);

  // Réinitialiser la vague quand la filière change
  useEffect(() => {
    setSelectedVague("");
  }, [selectedFiliere]);

  // Obtenir les vagues disponibles pour la filière sélectionnée
  const getVaguesForFiliere = () => {
    if (!selectedFiliere) return vagues;
    
    const filiere = filieres.find(f => f.id === selectedFiliere);
    if (filiere && filiere.vagues && filiere.vagues.length > 0) {
      return filiere.vagues;
    }
    
    return vagues;
  };

  const renderRoleFields = () => {
    switch (role) {
      case "Etudiant":
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="studentNumber" className="block mb-2 font-title font-medium text-dark">
                Numéro d&apos;étudiant *
              </label>
              <input
                id="studentNumber"
                name="studentNumber"
                type="text"
                placeholder="Ex: ETU-2024-001"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                required
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
                disabled={loadingFilieres}
              >
                <option value="">-- Sélectionnez une filière --</option>
                {loadingFilieres ? (
                  <option value="" disabled>Chargement des filières...</option>
                ) : filieres.length === 0 ? (
                  <option value="" disabled>Aucune filière disponible</option>
                ) : (
                  filieres.map((filiere) => (
                    <option key={filiere.id} value={filiere.id}>
                      {filiere.name} {filiere.duree && `- ${filiere.duree}`}
                    </option>
                  ))
                )}
              </select>
              {loadingFilieres && (
                <p className="text-xs text-gray-500 mt-1">Chargement des filières...</p>
              )}
            </div>

            <div>
              <label htmlFor="vague" className="block mb-2 font-title font-medium text-dark">
                Vague *
              </label>
              <select
                id="vague"
                name="vague"
                value={selectedVague}
                onChange={(e) => setSelectedVague(e.target.value)}
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                required
                disabled={loadingFilieres || !selectedFiliere}
              >
                <option value="">-- Sélectionnez une vague --</option>
                {loadingFilieres ? (
                  <option value="" disabled>Chargement des vagues...</option>
                ) : !selectedFiliere ? (
                  <option value="" disabled>Sélectionnez d'abord une filière</option>
                ) : getVaguesForFiliere().length === 0 ? (
                  <option value="" disabled>Aucune vague disponible pour cette filière</option>
                ) : (
                  getVaguesForFiliere().map((vague) => (
                    <option key={vague.id} value={vague.id}>
                      {vague.name} {vague.periode && `- ${vague.periode}`}
                    </option>
                  ))
                )}
              </select>
              {selectedFiliere && getVaguesForFiliere().length === 0 && !loadingFilieres && (
                <p className="text-xs text-yellow-600 mt-1">
                  Aucune vague disponible pour cette filière. Contactez l'administration.
                </p>
              )}
            </div>
          </div>
        );
        
      case "Parent":
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="enfantName" className="block mb-2 font-title font-medium text-dark">
                Nom complet de l&apos;enfant *
              </label>
              <input
                id="enfantName"
                name="enfantName"
                type="text"
                placeholder="Ex: Jean Dupont"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Important : Le nom doit correspondre exactement à celui de l'étudiant
              </p>
            </div>

            <div>
              <label htmlFor="enfantFiliere" className="block mb-2 font-title font-medium text-dark">
                Filière de l&apos;enfant *
              </label>
              <select
                id="enfantFiliere"
                name="filiere"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                required
                disabled={loadingFilieres}
              >
                <option value="">-- Sélectionnez la filière de l&apos;enfant --</option>
                {loadingFilieres ? (
                  <option value="" disabled>Chargement des filières...</option>
                ) : filieres.length === 0 ? (
                  <option value="" disabled>Aucune filière disponible</option>
                ) : (
                  filieres.map((filiere) => (
                    <option key={filiere.id} value={filiere.id}>
                      {filiere.name}
                    </option>
                  ))
                )}
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                💡 <strong>Important :</strong> Vous pourrez voir l'emploi du temps et les notes de votre enfant 
                une fois le compte créé. Assurez-vous que le nom correspond exactement.
              </p>
            </div>
          </div>
        );

      case "Enseignant":
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="matiere" className="block mb-2 font-title font-medium text-dark">
                Matière enseignée *
              </label>
              <input
                id="matiere"
                name="matiere"
                type="text"
                placeholder="Ex: Mathématiques, Informatique, Physique..."
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                required
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                📚 <strong>Information :</strong> Vous serez assigné à des cours selon votre matière 
                et pourrez gérer vos emplois du temps.
              </p>
            </div>
          </div>
        );
  
      case "Secretaire":
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm text-green-800 font-medium">
                👩‍💼 Aucune information supplémentaire requise pour la secrétaire.
              </p>
              <p className="text-xs text-green-600 mt-1">
                Vous pourrez gérer les inscriptions et les emplois du temps.
              </p>
            </div>
          </div>
        );
  
      case "Comptable":
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <p className="text-sm text-purple-800 font-medium">
                💰 Aucune information supplémentaire requise pour le comptable.
              </p>
              <p className="text-xs text-purple-600 mt-1">
                Vous pourrez gérer les paiements et les finances de l'établissement.
              </p>
            </div>
          </div>
        );
  
      case "Censeur":
        return (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-sm text-red-800 font-medium">
                🎓 Aucune information supplémentaire requise pour le censeur.
              </p>
              <p className="text-xs text-red-600 mt-1">
                Vous pourrez superviser le bon déroulement des activités académiques.
              </p>
            </div>
          </div>
        );
  
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Toast de chargement
    const loadingToast = toast.loading('Création du compte en cours...');

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const phone = formData.get("phone") as string;
      
      // Validation du nom complet
      const nameParts = name.trim().split(" ");
      if (nameParts.length < 2) {
        throw new Error("Veuillez entrer un nom complet (prénom et nom)");
      }

      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ");

      // Validation des champs requis selon le rôle
      if (role === "Etudiant") {
        if (!formData.get("filiere") || !formData.get("vague")) {
          throw new Error("Veuillez sélectionner une filière et une vague pour l'étudiant");
        }
        if (!formData.get("studentNumber")) {
          throw new Error("Le numéro d'étudiant est requis");
        }
      }

      if (role === "Parent") {
        if (!formData.get("enfantName") || !formData.get("filiere") || !formData.get("relation")) {
          throw new Error("Veuillez remplir tous les champs requis pour le parent");
        }
      }

      if (role === "Enseignant" && !formData.get("matiere")) {
        throw new Error("La matière enseignée est requise");
      }

      // 🚨 CORRECTION : Utiliser les bons noms de champs pour l'API
      const userData: UserData = {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: isSecretaire ? "Etudiant" : role,
        phone: phone ? phone.trim() : "",
        studentNumber: formData.get("studentNumber") as string,
        filiereId: formData.get("filiere") as string,      // ← CORRIGÉ : filiereId au lieu de filiere
        vagueNumber: formData.get("vague") as string,      // ← CORRIGÉ : vagueNumber au lieu de vague
        matiere: formData.get("matiere") as string,
        enfantName: formData.get("enfantName") as string,
        relation: formData.get("relation") as string,
      };

      console.log("🚨 DONNÉES CORRIGÉES envoyées à l'API:", userData);

      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création du compte');
      }

      // SUCCÈS - Toast de succès avec informations détaillées
      toast.dismiss(loadingToast);
      toast.success(
        <div className="max-w-md">
          <div className="font-bold text-green-800 mb-2">
            ✅ Compte {isSecretaire ? "Étudiant" : role} créé avec succès !
          </div>
          <div className="text-sm space-y-1">
            <div><strong>👤 Nom :</strong> {firstName} {lastName}</div>
            <div><strong>📧 Email :</strong> {email}</div>
            <div><strong>📞 Téléphone :</strong> {phone || 'Non renseigné'}</div>
            {role === "Etudiant" && (
              <>
                <div><strong>🎓 Filière :</strong> {filieres.find(f => f.id === selectedFiliere)?.name}</div>
                <div><strong>🌊 Vague :</strong> {getVaguesForFiliere().find(v => v.id === selectedVague)?.name}</div>
                <div><strong>🎫 Numéro étudiant :</strong> {userData.studentNumber}</div>
              </>
            )}
            {role === "Parent" && (
              <div><strong>👶 Enfant :</strong> {userData.enfantName}</div>
            )}
            <div><strong>🔑 Mot de passe temporaire :</strong> {result.user.temporaryPassword}</div>
            <div className="mt-2 text-xs text-gray-600">
              L'utilisateur devra changer son mot de passe à la première connexion.
            </div>
          </div>
        </div>,
        { 
          duration: 15000,
          icon: '🎉'
        }
      );
      
      // Réinitialisation
      if (!isSecretaire) {
        setRole("Etudiant");
      }
      setSelectedFiliere("");
      setSelectedVague("");
      
      const form = e.target as HTMLFormElement;
      form.reset();
      
    } catch (err: unknown) {
      // ERREUR - Toast d'erreur
      toast.dismiss(loadingToast);
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la création du compte";
      toast.error(
        <div>
          <div className="font-bold">❌ Erreur de création</div>
          <div>{errorMessage}</div>
        </div>,
        { duration: 8000 }
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
            duration: 15000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 8000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
          loading: {
            duration: Infinity,
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
                  Mode Secrétaire : Inscription étudiants uniquement
                </p>
              </div>
            )}
          </div>

          <div className="relative flex-1 bg-white border-l border-gray-200 flex flex-col items-center justify-center p-3 md:p-8">
            <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">
              <h2 className="text-2xl font-title font-bold text-center text-dark mb-6">
                {isSecretaire ? "Inscrire un étudiant" : "Créer un compte"}
              </h2>

              {/* SELECTION DU ROLE */}
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
                      setSelectedVague("");
                    }}
                    className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                    required
                  >
                    <option value="">-- Choisir un rôle --</option>
                    <option value="Enseignant">👨‍🏫 Enseignant</option>
                    <option value="Etudiant">👨‍🎓 Étudiant</option>
                    <option value="Parent">👨‍👦 Parent</option>
                    <option value="Secretaire">👩‍💼 Secrétaire</option>
                    <option value="Comptable">💰 Comptable</option>
                    <option value="Censeur">🎓 Censeur</option>
                  </select>
                </div>
              ) : (
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
                    placeholder="Ex: Jean Dupont"
                    className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Prénom et nom séparés par un espace</p>
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

                <div>
                  <label htmlFor="phone" className="block mb-2 font-title font-medium text-dark">
                    Numéro de téléphone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Ex: +2250700000000 (recommandé) ou 0700000000"
                    className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format international recommandé</p>
                </div>
              </div>

              {role && <div className="mb-6">{renderRoleFields()}</div>}

              <button
                type="submit"
                disabled={isSubmitting || loadingFilieres}
                className="mt-4 mb-4 w-full bg-lien font-link text-white p-2 rounded-md font-semibold hover:bg-principal transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting 
                  ? "⏳ Création en cours..." 
                  : loadingFilieres
                  ? "📥 Chargement des données..."
                  : isSecretaire 
                    ? "👨‍🎓 Inscrire l'étudiant" 
                    : `👤 Créer le compte ${role}`
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
                Gestionnaire d'école{" "}
                <span className="font-bold font-title text-dark">SchoolFlow</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {filieres.length} filières • {vagues.length} vagues
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}