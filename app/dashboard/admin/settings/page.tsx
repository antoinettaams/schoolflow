"use client";

import React, { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  Sun,
  Moon,
  Globe,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Save,
  Key,
  Shield,
  AlertTriangle,
} from "lucide-react";

const AdminSettingsPage = () => {
  const { user } = useUser();
  const { openSignIn, session } = useClerk();

  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("fr");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    username: user?.username || "",
    currentPassword: "",
    newPassword: "",
  });

  // 🔹 Vérifier si la session est récente
  const isSessionRecent = () => {
    if (!session?.lastActiveAt) return false;
    const lastActive = new Date(session.lastActiveAt);
    const now = new Date();
    const timeDiff = now.getTime() - lastActive.getTime();
    return timeDiff <= 5 * 60 * 1000; // 5 minutes
  };

  // 🔹 Ouvrir la modale de re-authentification
  const triggerReauthentication = () => {
    openSignIn({
      redirectUrl: window.location.href,
    });
  };

  // 🔹 Mettre à jour le profil (SEULEMENT nom et prénom)
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Utilisateur non connecté.");

    // Vérifier si la session est récente
    if (!isSessionRecent()) {
      setNeedsReauth(true);
      return;
    }

    setIsLoading(true);

    try {
      // SEULEMENT firstName et lastName (comme dans le code qui fonctionne)
      await user.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      alert("✅ Profil mis à jour avec succès !");
      setProfileOpen(false);
    } catch (error: any) {
      console.error("Erreur mise à jour profil:", error);
      
      // 🔥 Gestion spécifique de l'erreur de vérification Clerk
      if (error.errors?.[0]?.code === "session_verification_required" || 
          error.errors?.[0]?.code === "verification_required" ||
          error.message?.includes("additional verification") ||
          error.message?.includes("re-authenticate")) {
        setNeedsReauth(true);
      } else {
        alert("❌ Erreur lors de la mise à jour : " + (error.errors?.[0]?.message || error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Changer le mot de passe (avec gestion d'erreur de vérification)
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Utilisateur non connecté.");
    
    // Vérifier si la session est récente
    if (!isSessionRecent()) {
      setNeedsReauth(true);
      return;
    }

    if (!formData.currentPassword || !formData.newPassword) {
      alert("Veuillez remplir les deux champs du mot de passe.");
      return;
    }

    if (formData.newPassword.length < 8) {
      alert("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setIsLoading(true);

    try {
      // Changer le mot de passe
      await user.updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      alert("🔒 Mot de passe modifié avec succès !");
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "" }));
      setPasswordOpen(false);
    } catch (error: any) {
      console.error("Erreur changement mot de passe:", error);
      
      // 🔥 Gestion spécifique de l'erreur de vérification Clerk
      if (error.errors?.[0]?.code === "session_verification_required" || 
          error.errors?.[0]?.code === "verification_required" ||
          error.message?.includes("additional verification") ||
          error.message?.includes("re-authenticate")) {
        setNeedsReauth(true);
      } else if (error.errors?.[0]?.code === "form_password_incorrect") {
        alert("❌ Mot de passe actuel incorrect.");
      } else if (error.errors?.[0]?.code === "form_password_pwned") {
        alert("❌ Ce mot de passe a été compromis. Veuillez en choisir un autre.");
      } else if (error.errors?.[0]?.code === "form_password_size") {
        alert("❌ Le mot de passe doit contenir au moins 8 caractères.");
      } else {
        alert("❌ Erreur lors du changement de mot de passe : " + (error.errors?.[0]?.message || error.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:pl-5 pt-20 lg:pt-6">
      {/* En-tête */}
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres Administrateur</h1>
          <p className="text-gray-500 mt-1">Gérez votre compte administrateur</p>
        </div>
      </div>

      {/* 🔥 MODALE DE RE-AUTHENTIFICATION */}
      {needsReauth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Vérification requise</h3>
                  <p className="text-sm text-gray-600">Une vérification de sécurité est nécessaire pour continuer.</p>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  Pour des raisons de sécurité, vous devez vous ré-authentifier pour effectuer cette action.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setNeedsReauth(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={triggerReauthentication}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Se ré-authentifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 flex flex-col gap-6">
          
          {/* Section Profil Administrateur */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Profil Administrateur</h2>
                <p className="text-sm text-gray-500">Modifiez vos informations personnelles</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="text-left">
                    <span className="font-medium text-gray-900">Informations personnelles</span>
                    <p className="text-sm text-gray-500 mt-1">
                      Modifiez votre nom et prénom
                    </p>
                  </div>
                  {profileOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {profileOpen && (
                  <div className="px-4 pb-4">
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prénom
                          </label>
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={e => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                            placeholder="Votre prénom"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom
                          </label>
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={e => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                            placeholder="Votre nom"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>

                      {/* Email (lecture seule) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Adresse email
                        </label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-gray-600">{user?.primaryEmailAddress?.emailAddress}</span>
                          <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Vérifié
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Pour modifier votre email, contactez le support
                        </p>
                      </div>

                      {/* Username (lecture seule) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom d'utilisateur
                        </label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-gray-600">{user?.username || "Non défini"}</span>
                          <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Lecture seule
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {isLoading ? "Mise à jour..." : "Enregistrer les modifications"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section Sécurité */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-50 rounded-lg">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sécurité</h2>
                <p className="text-sm text-gray-500">Protégez votre compte administrateur</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setPasswordOpen(!passwordOpen)}
                  className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="text-left">
                    <span className="font-medium text-gray-900">Modifier le mot de passe</span>
                    <p className="text-sm text-gray-500 mt-1">
                      Mettez à jour votre mot de passe régulièrement
                    </p>
                  </div>
                  {passwordOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {passwordOpen && (
                  <div className="px-4 pb-4">
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mot de passe actuel
                          </label>
                          <div className="relative">
                            <input
                              type={showOldPassword ? "text" : "password"}
                              value={formData.currentPassword}
                              onChange={e => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                              placeholder="Entrez votre mot de passe actuel"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowOldPassword(!showOldPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nouveau mot de passe
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={formData.newPassword}
                              onChange={e => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                              placeholder="Choisissez un nouveau mot de passe"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                              minLength={8}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Minimum 8 caractères
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-sm focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
                        >
                          <Key className="w-4 h-4" />
                          {isLoading ? "Changement..." : "Mettre à jour le mot de passe"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Informations du compte */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-50 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Informations du Compte</h2>
                <p className="text-sm text-gray-500">Détails de votre compte administrateur</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-2">
                <p className="text-gray-500">ID Utilisateur</p>
                <p className="font-mono text-gray-900">{user?.id}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-500">Rôle</p>
                <p className="font-medium text-green-600">Administrateur</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-500">Membre depuis</p>
                <p className="text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;