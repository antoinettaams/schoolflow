// app/dashboard/censeur/profile/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  User,
  Mail,
  Camera,
  Trash2,
  LogOut,
  AlertCircle,
  Calendar,
  CheckCircle,
  Shield,
  Users,
  BookOpen,
  LucideIcon,
} from "lucide-react";
import Image from "next/image";

// Interface pour les activités utilisateur
interface UserActivity {
  id: number;
  type: string;
  description: string;
  timestamp: Date;
  icon: React.ReactNode; // ✅ Correction : utiliser React.ReactNode au lieu de JSX.Element
}

const CenseurProfilePage = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔥 Activité simulée pour censeur
  const getUserActivity = (): UserActivity[] => [
    {
      id: 1,
      type: "login",
      description: "Connexion réussie",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
    },
    {
      id: 2,
      type: "attendance_check",
      description: "Vérification des absences terminée",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      icon: <Users className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 3,
      type: "schedule_update",
      description: "Emploi du temps mis à jour",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      icon: <BookOpen className="w-4 h-4 text-purple-500" />,
    },
    {
      id: 4,
      type: "discipline",
      description: "Rapport de discipline généré",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      icon: <Shield className="w-4 h-4 text-orange-500" />,
    },
  ];

  useEffect(() => {
    setUserActivity(getUserActivity());
  }, []);

  // ✅ Upload photo
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image valide");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5MB");
      return;
    }

    try {
      setIsUploading(true);
      await user?.setProfileImage({ file });
      alert("✅ Photo de profil mise à jour avec succès !");
      setShowImageOptions(false);

      // Ajouter dans le journal d'activité
      setUserActivity((prev) => [
        {
          id: Date.now(),
          type: "profile_update",
          description: "Photo de profil mise à jour",
          timestamp: new Date(),
          icon: <Camera className="w-4 h-4 text-blue-500" />,
        },
        ...prev,
      ]);
    } catch (error) {
      console.error("Erreur upload:", error);
      alert("Erreur lors du téléchargement de l'image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ✅ Supprimer la photo
  const handleDeleteImage = async (): Promise<void> => {
    if (!confirm("Supprimer votre photo de profil ?")) return;
    try {
      await user?.setProfileImage({ file: null });
      alert("✅ Photo supprimée avec succès !");
      setShowImageOptions(false);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression");
    }
  };

  // ✅ Télécharger l'image
  const handleDownloadImage = (): void => {
    const link = document.createElement("a");
    link.href = user?.imageUrl || "";
    link.download = `photo-profil-${user?.firstName}-${user?.lastName}.jpg`;
    link.click();
  };

  // ✅ Déconnexion
  const handleLogout = (): void => setIsLogoutModalOpen(true);
  const handleConfirmLogout = async (): Promise<void> => await signOut({ redirectUrl: "/auth/signin" });
  const handleCancelLogout = (): void => setIsLogoutModalOpen(false);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  const profileImage = user.imageUrl || "https://placehold.co/150x150/8b5cf6/ffffff?text=C";
  const createdAt = user.createdAt ? new Date(user.createdAt) : new Date();

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      <div className="h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* ✅ Carte de profil */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative">
            {/* Bannière */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-40 w-full relative">
              <div className="absolute left-8 bottom-0 translate-y-1/2">
                <div className="relative">
                  <Image
                    src={profileImage}
                    alt="Photo de profil"
                    width={128}
                    height={128}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-2xl cursor-pointer"
                    onClick={() => setShowImageOptions(true)}
                  />
                  <button
                    onClick={() => setShowImageOptions(true)}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 p-2 bg-purple-600 text-white rounded-full border-2 border-white shadow-lg hover:bg-purple-700 transition-transform transform hover:scale-110 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Menu des options d'image */}
            {showImageOptions && (
              <>
                <div className="absolute left-8 top-48 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-purple-50 border-b border-gray-100"
                  >
                    <Camera className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {isUploading ? "Téléchargement..." : "Changer la photo"}
                      </p>
                      <p className="text-sm text-gray-500">JPEG, PNG, max 5MB</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowImageModal(true);
                      setShowImageOptions(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-purple-50 border-b border-gray-100"
                  >
                    <User className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-800">Voir la photo</p>
                      <p className="text-sm text-gray-500">Afficher en grand</p>
                    </div>
                  </button>

                  {user.imageUrl && (
                    <button
                      onClick={handleDeleteImage}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-semibold text-gray-800">Supprimer la photo</p>
                        <p className="text-sm text-gray-500">Retirer la photo actuelle</p>
                      </div>
                    </button>
                  )}
                </div>

                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowImageOptions(false)}
                />
              </>
            )}

            {/* Image Modal */}
            {showImageModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-xl p-4 max-w-lg w-full relative">
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
                  >
                    ✕
                  </button>
                  <Image
                    src={user.imageUrl}
                    alt="Photo de profil"
                    width={500}
                    height={500}
                    className="w-full h-auto rounded-xl object-cover"
                  />
                  <div className="flex justify-end gap-3 p-4 border-t border-gray-200 mt-4">
                    <button
                      onClick={() => setShowImageModal(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      Fermer
                    </button>
                    <button
                      onClick={handleDownloadImage}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Télécharger
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Nom et rôle */}
            <div className="pt-16 pb-6 px-8 border-b border-gray-100">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-purple-600 font-medium">Censeur</p>
            </div>

            {/* Informations personnelles */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-3">
                <User className="w-6 h-6 text-purple-600" />
                Informations Personnelles
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Info label="Prénom" value={user.firstName || ""} icon={User} color="purple" />
                <Info label="Nom" value={user.lastName || ""} icon={User} color="purple" />
                <Info
                  label="E-mail"
                  value={user.emailAddresses[0]?.emailAddress || ""}
                  icon={Mail}
                  color="purple"
                />
                <Info label="ID Utilisateur" value={user.id} icon={User} color="purple" />
              </div>
            </div>

            {/* Date création + bouton */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-4">
              <p className="text-sm text-gray-500">
                Compte créé le{" "}
                {createdAt.toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <button
                onClick={handleLogout}
                className="w-64 flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl"
              >
                <LogOut className="w-6 h-6" />
                Se déconnecter
              </button>
            </div>
          </div>

          {/* Section sécurité */}
          <Section
            title="Sécurité et Compte"
            icon={<Shield className="w-6 h-6 text-purple-600" />}
          >
            <button
              onClick={() => window.open("https://accounts.clerk.com/user", "_blank")}
              className="text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <p className="font-semibold text-gray-900">Gérer la sécurité</p>
              <p className="text-sm text-gray-600">Mot de passe, 2FA, sessions</p>
            </button>
          </Section>

          {/* Activité */}
          <Section
            title="Activité Récente"
            icon={<Calendar className="w-6 h-6 text-purple-600" />}
          >
            <div className="space-y-3">
              {userActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  {activity.icon}
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {activity.timestamp.toLocaleDateString("fr-FR")} à{" "}
                      {activity.timestamp.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Confirmer la déconnexion
            </h3>
            <p className="text-gray-600 text-sm text-center mb-6">
              Êtes-vous sûr de vouloir vous déconnecter ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelLogout}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ Composants utilitaires
interface InfoProps {
  icon: LucideIcon;
  label: string;
  value: string;
  color?: string;
}

const Info = ({ icon: Icon, label, value, color = "blue" }: InfoProps) => (
  <div className="flex items-center p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
    <Icon className={`w-5 h-5 text-${color}-600 mr-4`} />
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
      <p className="text-gray-800 font-semibold mt-1">{value}</p>
    </div>
  </div>
);

interface SectionProps {
  title: string;
  icon: React.ReactNode; // ✅ Correction : utiliser React.ReactNode au lieu de JSX.Element
  children: React.ReactNode;
}

const Section = ({ title, icon, children }: SectionProps) => (
  <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
    <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-3">
      {icon}
      {title}
    </h3>
    {children}
  </div>
);
export default CenseurProfilePage;