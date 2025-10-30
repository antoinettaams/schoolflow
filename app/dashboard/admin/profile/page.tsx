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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface ActivityItem {
  id: number;
  type: string;
  description: string;
  timestamp: Date;
  icon: React.ReactNode;
}

const AdminProfilePage = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [userActivity, setUserActivity] = useState<ActivityItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔥 Activité simulée
  const getUserActivity = (): ActivityItem[] => [
    {
      id: 1,
      type: "login",
      description: "Connexion réussie",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
    },
    {
      id: 2,
      type: "profile_update",
      description: "Photo de profil mise à jour",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      icon: <Camera className="w-4 h-4 text-blue-500" />,
    },
    {
      id: 3,
      type: "password_change",
      description: "Mot de passe modifié",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      icon: <AlertCircle className="w-4 h-4 text-orange-500" />,
    },
    {
      id: 4,
      type: "security",
      description: "Vérification de sécurité effectuée",
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      icon: <Shield className="w-4 h-4 text-purple-500" />,
    },
  ];

  useEffect(() => {
    setUserActivity(getUserActivity());
  }, []);

  // ✅ Upload photo
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

      // Ajouter dans le journal d&apos;activité
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
  const handleDeleteImage = async () => {
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

  // ✅ Télécharger l&apos;image
  const handleDownloadImage = () => {
    const link = document.createElement("a");
    link.href = user?.imageUrl || "";
    link.download = `photo-profil-${user?.firstName}-${user?.lastName}.jpg`;
    link.click();
  };

  // ✅ Déconnexion
  const handleLogout = () => setIsLogoutModalOpen(true);
  const handleConfirmLogout = async () => await signOut({ redirectUrl: "/auth/signin" });
  const handleCancelLogout = () => setIsLogoutModalOpen(false);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  const profileImage =
    user.imageUrl || "https://placehold.co/150x150/3b82f6/ffffff?text=Admin";
  const createdAt = user.createdAt ? new Date(user.createdAt) : new Date();
  const userRole = (user.publicMetadata?.role as string) || "Administrateur";

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
          <Card className="rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative">
            {/* Bannière */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-40 w-full relative">
              <div className="absolute left-8 bottom-0 translate-y-1/2">
                <div className="relative">
                  <Image
                    src={profileImage}
                    alt="Photo de profil"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-2xl cursor-pointer"
                    onClick={() => setShowImageOptions(true)}
                  />
                  <Button
                    onClick={() => setShowImageOptions(true)}
                    disabled={isUploading}
                    size="icon"
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full border-2 border-white shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Menu des options d&apos;image */}
            {showImageOptions && (
              <>
                <div className="absolute left-8 top-48 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100"
                  >
                    <Camera className="w-5 h-5 text-blue-600" />
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
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100"
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
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
                <div className="bg-white rounded-xl p-4 max-w-lg w-full relative">
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
                  >
                    ✕
                  </button>
                  <Image
                    src={user.imageUrl || profileImage}
                    alt="Photo de profil"
                    className="w-full h-[70vh] rounded-xl object-cover"
                  />
                  <div className="flex justify-end gap-3 p-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowImageModal(false)}
                    >
                      Fermer
                    </Button>
                    <Button
                      onClick={handleDownloadImage}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Télécharger
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Nom et rôle */}
            <CardHeader className="pt-16 pb-6 border-b border-gray-100">
              <CardTitle className="text-2xl font-extrabold text-gray-900">
                {user.firstName} {user.lastName}
              </CardTitle>
              <CardDescription>
                <Badge variant="secondary" className="text-blue-600 bg-white font-medium">
                  {userRole}
                </Badge>
              </CardDescription>
            </CardHeader>

            {/* Informations personnelles */}
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-3">
                <User className="w-6 h-6 text-blue-600" />
                Informations Personnelles
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Info label="Prénom" value={user.firstName || ""} icon={User} />
                <Info label="Nom" value={user.lastName || ""} icon={User} />
                <Info
                  label="E-mail"
                  value={user.emailAddresses[0]?.emailAddress || ""}
                  icon={Mail}
                />
                <Info label="ID Utilisateur" value={user.id} icon={User} />
              </div>
            </CardContent>

            {/* Date création + bouton */}
            <CardContent className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-4">
              <p className="text-sm text-gray-500">
                Compte créé le{" "}
                {createdAt.toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-64 flex items-center justify-center gap-3 bg-red-500"
              >
                <LogOut className="w-6 h-6" />
                Se déconnecter
              </Button>
            </CardContent>
          </Card>

          {/* Section sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-blue-600" />
                Sécurité et Compte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => window.open("https://accounts.clerk.com/user", "_blank")}
                className="text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="font-semibold text-gray-900">Gérer la sécurité</p>
                  <p className="text-sm text-gray-600">Mot de passe, 2FA, sessions</p>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Activité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-600" />
                Activité Récente
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de déconnexion */}
      <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-lg font-semibold text-gray-900">
              Confirmer la déconnexion
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 text-sm">
              Êtes-vous sûr de vouloir vous déconnecter ?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={handleCancelLogout}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmLogout}
              className="flex-1"
            >
              Se déconnecter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ✅ Composants utilitaires
interface InfoProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

const Info = ({ icon: Icon, label, value }: InfoProps) => (
  <div className="flex items-center p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
    <Icon className="w-5 h-5 text-blue-600 mr-4" />
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
      <p className="text-gray-800 font-semibold mt-1">{value}</p>
    </div>
  </div>
);

export default AdminProfilePage;