"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Bell,
  Globe,
  Sun,
  Moon,
  Save,
  Key,
  School,
  BookOpen,
  GraduationCap,
} from "lucide-react";

const TeacherSettingsPage = () => {
  const { user, isLoaded } = useUser();
  
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("fr");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // États pour les modifications
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
  });

  // Métadonnées professeur (lecture seule)
  const teacherMetadata = {
    subject: "Mathématiques",
    classes: "Terminale S2, Première S1",
    filiere: "Scientifique",
  };

  // 🔥 Charger les données utilisateur
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
        phone: user.primaryPhoneNumber?.phoneNumber || "",
        currentPassword: "",
        newPassword: "",
      });
    }
  }, [user]);

  // 🔥 Mettre à jour le profil avec Clerk
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await user?.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      
      // Si l'email est modifié
      if (formData.email !== user?.primaryEmailAddress?.emailAddress) {
        await user?.createEmailAddress({ email: formData.email });
      }
      
      alert("✅ Profil professeur mis à jour avec succès !");
      setProfileOpen(false);
    } catch (error) {
      console.error("Erreur mise à jour profil:", error);
      alert("❌ Erreur lors de la mise à jour du profil");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 Changer le mot de passe avec Clerk
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await user?.updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      alert("✅ Mot de passe modifié avec succès !");
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "" }));
      setPasswordOpen(false);
    } catch (error) {
      console.error("Erreur changement mot de passe:", error);
      alert("❌ Erreur lors du changement de mot de passe");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-opacity-75"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:pl-5 pt-20 lg:pt-6">
      {/* En-tête */}
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres Professeur</h1>
          <p className="text-gray-500 mt-1">Gérez votre compte professeur</p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 flex flex-col gap-6">
          
          {/* Section Profil Professeur */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Profil Professeur</h2>
                <p className="text-sm text-gray-500">Modifiez vos informations personnelles</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Section profil dépliante */}
              <div className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="text-left">
                    <span className="font-medium text-gray-900">Informations personnelles</span>
                    <p className="text-sm text-gray-500 mt-1">
                      Modifiez votre nom, email et téléphone
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
                        {/* Prénom */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Prénom
                          </label>
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                            placeholder="Votre prénom"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        {/* Nom */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom
                          </label>
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                            placeholder="Votre nom"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Adresse email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="votre@email.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Un email de vérification sera envoyé si vous changez d'adresse
                        </p>
                      </div>

                      {/* Téléphone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Numéro de téléphone
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+229 90 00 00 00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
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

          {/* Section Informations Professionnelles (Lecture seule) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-50 rounded-lg">
                <School className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Informations Professionnelles</h2>
                <p className="text-sm text-gray-500">Vos informations d'enseignement (consultation seule)</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Matière enseignée */}
                <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <BookOpen className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Matière</p>
                    <p className="text-gray-800 font-semibold">{teacherMetadata.subject}</p>
                  </div>
                </div>

                {/* Classes assignées */}
                <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <GraduationCap className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Classes</p>
                    <p className="text-gray-800 font-semibold">{teacherMetadata.classes}</p>
                  </div>
                </div>

                {/* Filière */}
                <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <School className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Filière</p>
                    <p className="text-gray-800 font-semibold">{teacherMetadata.filiere}</p>
                  </div>
                </div>
              </div>

              {/* Message d'information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Information</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Les modifications des informations professionnelles (matière, classes, filière) 
                      doivent être demandées à l'administration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Apparence */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Sun className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Apparence</h2>
                <p className="text-sm text-gray-500">Personnalisez l'apparence de votre interface</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Mode sombre/clair */}
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
          </div>

          {/* Section Général (Langue + Notifications) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Général</h2>
                <p className="text-sm text-gray-500">Paramètres généraux de l'application</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Langue */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <span className="font-medium text-gray-900">Langue</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Définir la langue d'affichage
                  </p>
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

              {/* Notifications */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <span className="font-medium text-gray-900">Notifications</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Recevoir des notifications importantes
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

          {/* Section Sécurité */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-50 rounded-lg">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sécurité</h2>
                <p className="text-sm text-gray-500">Protégez votre compte professeur</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Section mot de passe dépliante */}
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
                        {/* Ancien mot de passe */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mot de passe actuel
                          </label>
                          <div className="relative">
                            <input
                              type={showOldPassword ? "text" : "password"}
                              value={formData.currentPassword}
                              onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
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

                        {/* Nouveau mot de passe */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nouveau mot de passe
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={formData.newPassword}
                              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
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

          {/* Informations du compte */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-50 rounded-lg">
                <School className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Informations du Compte</h2>
                <p className="text-sm text-gray-500">Détails de votre compte professeur</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-2">
                <p className="text-gray-500">ID Utilisateur</p>
                <p className="font-mono text-gray-900">{user?.id}</p>
              </div>
              <div className="space-y-2">
                <p className="text-gray-500">Rôle</p>
                <p className="font-medium text-green-600">Professeur</p>
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

export default TeacherSettingsPage;