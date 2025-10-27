"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Sun,
  Moon,
  Globe,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Bell,
  User,
  Mail,
  Save,
  Key,
} from "lucide-react";

const StudentSettingsPage = () => {
  const { user } = useUser();
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("fr");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    username: user?.username || "",
    currentPassword: "",
    newPassword: "",
  });

  // ✅ Mise à jour du profil étudiant
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await user?.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
      });

      if (formData.email !== user?.primaryEmailAddress?.emailAddress) {
        await user?.createEmailAddress({ email: formData.email });
      }

      alert("Profil étudiant mis à jour avec succès !");
      setProfileOpen(false);
    } catch (error) {
      console.error("Erreur mise à jour profil:", error);
      alert("Erreur lors de la mise à jour du profil");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Changement de mot de passe
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await user?.updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      alert("Mot de passe modifié avec succès !");
      setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
      setPasswordOpen(false);
    } catch (error) {
      console.error("Erreur changement mot de passe:", error);
      alert("Erreur lors du changement de mot de passe");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:pl-5 pt-20 lg:pt-6">
      {/* En-tête */}
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres Étudiant</h1>
          <p className="text-gray-500 mt-1">Gérez votre compte et vos préférences</p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 flex flex-col gap-6">
          
          {/* Section Profil Étudiant */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Profil Étudiant</h2>
                <p className="text-sm text-gray-500">Modifiez vos informations personnelles</p>
              </div>
            </div>

            {/* Section profil dépliante */}
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="text-left">
                  <span className="font-medium text-gray-900">Informations personnelles</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Modifiez votre nom, email et nom d'utilisateur
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
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              firstName: e.target.value,
                            }))
                          }
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
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              lastName: e.target.value,
                            }))
                          }
                          placeholder="Votre nom"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom d'utilisateur
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            username: e.target.value,
                          }))
                        }
                        placeholder="Nom d'utilisateur"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Adresse email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="votre@email.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Un email de vérification sera envoyé si vous changez d'adresse
                      </p>
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

          {/* Apparence */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Sun className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Apparence</h2>
                <p className="text-sm text-gray-500">Personnalisez l’apparence de votre interface</p>
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <span className="font-medium text-gray-900">Mode sombre</span>
                <p className="text-sm text-gray-500 mt-1">
                  {darkMode ? "Interface en mode sombre" : "Interface en mode clair"}
                </p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Général */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Général</h2>
                <p className="text-sm text-gray-500">Langue et notifications</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between py-3">
                <div>
                  <span className="font-medium text-gray-900">Langue</span>
                  <p className="text-sm text-gray-500 mt-1">Définir la langue d’affichage</p>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <span className="font-medium text-gray-900">Notifications</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Recevoir des notifications sur les cours et annonces
                  </p>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationsEnabled ? "bg-green-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationsEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-50 rounded-lg">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sécurité</h2>
                <p className="text-sm text-gray-500">Protégez votre compte étudiant</p>
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
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  currentPassword: e.target.value,
                                }))
                              }
                              placeholder="Entrez votre mot de passe actuel"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowOldPassword(!showOldPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showOldPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
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
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  newPassword: e.target.value,
                                }))
                              }
                              placeholder="Choisissez un nouveau mot de passe"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showNewPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
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
        </div>
      </div>
    </div>
  );
};

export default StudentSettingsPage;
