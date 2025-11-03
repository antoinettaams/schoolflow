"use client";

import React, { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  Sun,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// Interface pour les erreurs Clerk
interface ClerkError {
  errors: Array<{
    code: string;
    message: string;
    longMessage?: string;
    meta?: unknown;
  }>;
  message?: string;
}

const CenseurSettingsPage = () => {
  const { user } = useUser();
  const { signOut, openSignIn, session } = useClerk();

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

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.primaryEmailAddress?.emailAddress || "",
      username: user?.username || "",
    }));
  }, [user]);

  // Vérifie si la session est récente (5 min max)
  const isSessionRecent = (): boolean => {
    if (!session?.lastActiveAt) return false;
    const lastActive = new Date(session.lastActiveAt);
    const now = new Date();
    const diff = now.getTime() - lastActive.getTime();
    return diff <= 5 * 60 * 1000;
  };

  // Ouvre la modale de ré-authentification Clerk
  const triggerReauthentication = (): void => {
    openSignIn({ redirectUrl: window.location.href });
  };

  // Fonction utilitaire pour vérifier si une erreur nécessite une ré-authentification
  const requiresReauthentication = (error: unknown): boolean => {
    const clerkError = error as ClerkError;
    return (
      clerkError?.errors?.[0]?.code === "session_verification_required" ||
      clerkError?.errors?.[0]?.code === "verification_required" ||
      (typeof clerkError?.message === 'string' && clerkError.message.includes("re-authenticate"))
    );
  };

  // Fonction utilitaire pour obtenir le message d'erreur
  const getErrorMessage = (error: unknown): string => {
    const clerkError = error as ClerkError;
    return clerkError?.errors?.[0]?.message || clerkError?.message || "Une erreur inconnue s'est produite";
  };

  // Mise à jour du profil utilisateur
  const handleProfileUpdate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!user) {
      alert("Utilisateur non connecté.");
      return;
    }
    if (!isSessionRecent()) {
      setNeedsReauth(true);
      return;
    }
    setIsLoading(true);
    try {
      await user.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
      });
      // Modification email
      if (formData.email !== user.primaryEmailAddress?.emailAddress) {
        await user.createEmailAddress({ email: formData.email });
        alert("Un email de vérification a été envoyé à la nouvelle adresse.");
      }
      alert("Profil mis à jour avec succès !");
      setProfileOpen(false);
    } catch (error: unknown) {
      if (requiresReauthentication(error)) {
        setNeedsReauth(true);
      } else {
        alert("Erreur lors de la mise à jour : " + getErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Changement sécurisé du mot de passe avec déconnexion automatique
  const handlePasswordChange = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!user) {
      alert("Utilisateur non connecté.");
      return;
    }
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
      await user.updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      alert("Mot de passe modifié avec succès !");
      setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
      setPasswordOpen(false);
      await signOut();
      window.location.href = "/sign-in";
    } catch (error: unknown) {
      if (requiresReauthentication(error)) {
        setNeedsReauth(true);
      } else if ((error as ClerkError)?.errors?.[0]?.code === "form_password_incorrect") {
        alert("Mot de passe actuel incorrect.");
      } else {
        alert("Erreur lors du changement de mot de passe : " + getErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:pl-5 pt-20 lg:pt-6">
      {/* En-tête */}
      <div className="bg-white border-b border-gray-200 p-4 sm:p-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Paramètres Censeur</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Gérez votre compte censeur</p>
        </div>
      </div>

      {/* Modal ré-authentification */}
      <Dialog open={needsReauth} onOpenChange={setNeedsReauth}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
              Vérification requise
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Une vérification de sécurité est nécessaire pour continuer.
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Pour des raisons de sécurité, veuillez vous ré-authentifier.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setNeedsReauth(false)}
              className="flex-1 text-sm sm:text-base"
            >
              Annuler
            </Button>
            <Button
              onClick={triggerReauthentication}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-sm sm:text-base"
            >
              Se ré-authentifier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 flex flex-col gap-4 sm:gap-6">
          {/* Profil */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg">Profil Censeur</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Modifiez vos informations personnelles</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                <div className="border border-gray-200 rounded-lg">
                  <Button
                    variant="ghost"
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="w-full h-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="text-left min-w-0 flex-1">
                      <span className="font-medium text-gray-900 text-sm sm:text-base block truncate">
                        Informations personnelles
                      </span>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        Modifiez votre nom, email et nom d&apos;utilisateur
                      </p>
                    </div>
                    {profileOpen ? (
                      <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 ml-2" />
                    )}
                  </Button>
                  
                  {profileOpen && (
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                      <form onSubmit={handleProfileUpdate} className="space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-sm sm:text-base">Prénom</Label>
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                              placeholder="Votre prénom"
                              required
                              className="text-sm sm:text-base"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-sm sm:text-base">Nom</Label>
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                              placeholder="Votre nom"
                              required
                              className="text-sm sm:text-base"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-sm sm:text-base">Nom d&apos;utilisateur</Label>
                          <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                            placeholder="Votre nom d&apos;utilisateur"
                            className="text-sm sm:text-base"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2 text-sm sm:text-base">
                            <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                            Adresse email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="votre@email.com"
                            required
                            className="text-sm sm:text-base"
                          />
                          <p className="text-xs text-gray-500">
                            Un email de vérification sera envoyé si vous changez d&apos;adresse
                          </p>
                        </div>

                        <Separator />

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-purple-600 hover:bg-purple-700 text-sm sm:text-base w-full sm:w-auto"
                          >
                            <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            {isLoading ? "Mise à jour..." : "Enregistrer"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Apparence */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg">Apparence</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Personnalisez l&apos;apparence de votre interface</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <Label htmlFor="dark-mode" className="text-sm sm:text-base">Mode sombre</Label>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                      {darkMode ? "Interface en mode sombre" : "Interface en mode clair"}
                    </p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Général */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg">Général</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Paramètres généraux de l&apos;application</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <Label htmlFor="language" className="text-sm sm:text-base">Langue</Label>
                    <p className="text-xs sm:text-sm text-gray-500">Définir la langue d&apos;affichage</p>
                  </div>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-full sm:w-[180px] text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr" className="text-sm sm:text-base">Français</SelectItem>
                      <SelectItem value="en" className="text-sm sm:text-base">English</SelectItem>
                      <SelectItem value="es" className="text-sm sm:text-base">Español</SelectItem>
                      <SelectItem value="de" className="text-sm sm:text-base">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <Label htmlFor="notifications" className="text-sm sm:text-base">Notifications</Label>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                      Recevoir des notifications importantes
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                    className="flex-shrink-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sécurité */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg">Sécurité</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Protégez votre compte censeur</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                <div className="border border-gray-200 rounded-lg">
                  <Button
                    variant="ghost"
                    onClick={() => setPasswordOpen(!passwordOpen)}
                    className="w-full h-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="text-left min-w-0 flex-1">
                      <span className="font-medium text-gray-900 text-sm sm:text-base block truncate">
                        Modifier le mot de passe
                      </span>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        Mettez à jour votre mot de passe régulièrement
                      </p>
                    </div>
                    {passwordOpen ? (
                      <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0 ml-2" />
                    )}
                  </Button>

                  {passwordOpen && (
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                      <form onSubmit={handlePasswordChange} className="space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword" className="text-sm sm:text-base">Mot de passe actuel</Label>
                            <div className="relative">
                              <Input
                                id="currentPassword"
                                type={showOldPassword ? "text" : "password"}
                                value={formData.currentPassword}
                                onChange={(e) =>
                                  setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))
                                }
                                placeholder="Mot de passe actuel"
                                required
                                className="text-sm sm:text-base pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              >
                                {showOldPassword ? (
                                  <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                                ) : (
                                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-sm sm:text-base">Nouveau mot de passe</Label>
                            <div className="relative">
                              <Input
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                value={formData.newPassword}
                                onChange={(e) =>
                                  setFormData((prev) => ({ ...prev, newPassword: e.target.value }))
                                }
                                placeholder="Nouveau mot de passe"
                                required
                                className="text-sm sm:text-base pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              >
                                {showNewPassword ? (
                                  <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                                ) : (
                                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères</p>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={isLoading}
                            variant="destructive"
                            className="bg-red-500 text-sm sm:text-base w-full sm:w-auto"
                          >
                            <Key className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            {isLoading ? "Changement..." : "Mettre à jour"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations du compte */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg">Informations du Compte</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Détails de votre compte censeur</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-xs sm:text-sm">
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-gray-500 text-xs sm:text-sm">ID Utilisateur</p>
                  <p className="font-mono text-gray-900 text-xs sm:text-sm break-all">{user?.id}</p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-gray-500 text-xs sm:text-sm">Rôle</p>
                  <p className="font-medium text-purple-600 text-xs sm:text-sm">Censeur</p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-gray-500 text-xs sm:text-sm">Membre depuis</p>
                  <p className="text-gray-900 text-xs sm:text-sm">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("fr-FR") : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CenseurSettingsPage;