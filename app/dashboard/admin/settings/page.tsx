"use client";

import React, { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Save,
  Key, 
  AlertTriangle,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";

// Interface pour typer les erreurs Clerk
interface ClerkError {
  errors: Array<{
    code: string;
    message: string;
    longMessage?: string;
    meta?: unknown;
  }>;
  message?: string;
}

const AdminSettingsPage = () => {
  const { user } = useUser();
  const { signOut, openSignIn, session } = useClerk();
  const router = useRouter();

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    username: user?.username || "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    currentPassword: "",
    newPassword: "",
  });

  // Sync form data if user changes outside component
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      username: user?.username || "",
      email: user?.primaryEmailAddress?.emailAddress || ""
    }));
  }, [user?.firstName, user?.lastName, user?.username, user?.primaryEmailAddress?.emailAddress]);

  // Gestion du mode sombre
  useEffect(() => {
    // Vérifier la préférence stockée ou le préférence système
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    } else {
      // Vérifier la préférence système
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(systemPrefersDark);
    }
  }, []);

  useEffect(() => {
    // Appliquer le mode sombre au document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Sauvegarder la préférence
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Vérifie si la session est récente (moins de 5 min)
  const isSessionRecent = () => {
    if (!session?.lastActiveAt) return false;
    const lastActive = new Date(session.lastActiveAt);
    const now = new Date();
    const diff = now.getTime() - lastActive.getTime();
    return diff <= 5 * 60 * 1000;
  };

  const triggerReauthentication = () => {
    openSignIn({ redirectUrl: window.location.href });
  };

  // Fonction utilitaire pour gérer les erreurs Clerk
  const handleClerkError = (error: unknown): string => {
    const clerkError = error as ClerkError;
    
    if (clerkError.errors?.[0]?.code === "session_verification_required" ||
        clerkError.errors?.[0]?.code === "verification_required" ||
        clerkError.message?.includes("additional verification") ||
        clerkError.message?.includes("re-authenticate")) {
      setNeedsReauth(true);
      return "Vérification de sécurité requise";
    }
    
    return clerkError.errors?.[0]?.message || clerkError.message || "Une erreur inconnue est survenue";
  };

  // Mise à jour du profil avec email et username
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Utilisateur non connecté.");
      return;
    }

    if (!isSessionRecent()) {
      setNeedsReauth(true);
      return;
    }

    setIsLoading(true);
    try {
      // Met à jour prénom, nom et username
      await user.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
      });

      // Mise à jour de l'email via createEmailAddress() et vérification
      if (formData.email !== user?.primaryEmailAddress?.emailAddress) {
        await user.createEmailAddress({ email: formData.email });
        toast.success("Un email de vérification a été envoyé à la nouvelle adresse.");
      }

      toast.success("Profil mis à jour avec succès !");
      setProfileOpen(false);
    } catch (error) {
      const errorMessage = handleClerkError(error);
      if (!needsReauth) {
        toast.error("Erreur lors de la mise à jour : " + errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Changement du mot de passe avec déconnexion et redirection après
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Utilisateur non connecté.");
      return;
    }

    if (!isSessionRecent()) {
      setNeedsReauth(true);
      return;
    }

    if (!formData.currentPassword || !formData.newPassword) {
      toast.error("Veuillez remplir les deux champs du mot de passe.");
      return;
    }
    if (formData.newPassword.length < 8) {
      toast.error("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setIsLoading(true);
    try {
      await user.updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      toast.success("Mot de passe modifié avec succès !");
      
      setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
      setPasswordOpen(false);
      
      // Déconnexion après changement de mot de passe
      toast.success("Veuillez vous reconnecter avec votre nouveau mot de passe.");
      
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      const clerkError = error as ClerkError;
      const errorCode = clerkError.errors?.[0]?.code;
      
      if (errorCode === "session_verification_required" ||
          errorCode === "verification_required" ||
          clerkError.message?.includes("additional verification") ||
          clerkError.message?.includes("re-authenticate")) {
        setNeedsReauth(true);
      } else if (errorCode === "form_password_incorrect") {
        toast.error("Mot de passe actuel incorrect.");
      } else if (errorCode === "form_password_pwned") {
        toast.error("Ce mot de passe a été compromis. Veuillez en choisir un autre.");
      } else if (errorCode === "form_password_size") {
        toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      } else {
        const errorMessage = handleClerkError(error);
        if (!needsReauth) {
          toast.error("Erreur lors du changement de mot de passe : " + errorMessage);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:pl-5 pt-20 lg:pt-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres Administrateur</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gérez votre compte administrateur</p>
        </div>
      </div>

      {/* Modal re-authentication */}
      <Dialog open={needsReauth} onOpenChange={setNeedsReauth}>
        <DialogContent className="bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Vérification requise
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Une vérification de sécurité est nécessaire pour continuer.
            </DialogDescription>
          </DialogHeader>
          
          <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Pour des raisons de sécurité, vous devez vous ré-authentifier pour effectuer cette action.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setNeedsReauth(false)}
              className="flex-1 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Annuler
            </Button>
            <Button
              onClick={triggerReauthentication}
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              Se ré-authentifier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 flex flex-col gap-6">
          {/* Profile Section */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="dark:text-white">Profil Administrateur</CardTitle>
                  <CardDescription className="dark:text-gray-400">Modifiez vos informations personnelles</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
                  <Button
                    variant="ghost"
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="w-full h-auto px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                  >
                    <div className="text-left">
                      <span className="font-medium text-gray-900 dark:text-white">Informations personnelles</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Modifiez votre nom, prénom, nom d&apos;utilisateur et email</p>
                    </div>
                    {profileOpen ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </Button>
                  {profileOpen && (
                    <div className="px-4 pb-4">
                      <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="dark:text-white">Prénom</Label>
                            <Input
                              id="firstName"
                              type="text"
                              value={formData.firstName}
                              onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                              placeholder="Votre prénom"
                              required
                              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="dark:text-white">Nom</Label>
                            <Input
                              id="lastName"
                              type="text"
                              value={formData.lastName}
                              onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                              placeholder="Votre nom"
                              required
                              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="username" className="dark:text-white">Nom d&apos;utilisateur</Label>
                          <Input
                            id="username"
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                            placeholder="Votre nom d&apos;utilisateur"
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2 dark:text-white">
                            <Mail className="w-4 h-4" />
                            Adresse email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="Votre email"
                            required
                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Un email de vérification sera envoyé si vous changez d&apos;adresse
                          </p>
                        </div>

                        <Separator className="dark:bg-gray-600" />

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {isLoading ? "Mise à jour..." : "Enregistrer les modifications"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Apparence */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Sun className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="dark:text-white">Apparence</CardTitle>
                  <CardDescription className="dark:text-gray-400">Personnalisez l&apos;apparence de votre interface</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode" className="dark:text-white">Mode sombre</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {darkMode ? "Interface en mode sombre" : "Interface en mode clair"}
                    </p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="dark:text-white">Sécurité</CardTitle>
                  <CardDescription className="dark:text-gray-400">Protégez votre compte administrateur</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg">
                  <Button
                    variant="ghost"
                    onClick={() => setPasswordOpen(!passwordOpen)}
                    className="w-full h-auto px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                  >
                    <div className="text-left">
                      <span className="font-medium text-gray-900 dark:text-white">Modifier le mot de passe</span>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mettez à jour votre mot de passe régulièrement</p>
                    </div>
                    {passwordOpen ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </Button>
                  {passwordOpen && (
                    <div className="px-4 pb-4">
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword" className="dark:text-white">Mot de passe actuel</Label>
                            <div className="relative">
                              <Input
                                id="currentPassword"
                                type={showOldPassword ? "text" : "password"}
                                value={formData.currentPassword}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    currentPassword: e.target.value,
                                  }))
                                }
                                placeholder="Entrez votre mot de passe actuel"
                                required
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent dark:text-gray-400 dark:hover:bg-gray-600"
                              >
                                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="newPassword" className="dark:text-white">Nouveau mot de passe</Label>
                            <div className="relative">
                              <Input
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                value={formData.newPassword}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    newPassword: e.target.value,
                                  }))
                                }
                                placeholder="Choisissez un nouveau mot de passe"
                                required
                                minLength={8}
                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent dark:text-gray-400 dark:hover:bg-gray-600"
                              >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 8 caractères</p>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                          >
                            <Key className="w-4 h-4 mr-2" />
                            {isLoading ? "Changement..." : "Mettre à jour le mot de passe"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="dark:text-white">Informations du Compte</CardTitle>
                  <CardDescription className="dark:text-gray-400">Détails de votre compte administrateur</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="space-y-2">
                  <p className="text-gray-500 dark:text-gray-400">ID Utilisateur</p>
                  <p className="font-mono text-gray-900 dark:text-white">{user?.id}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-500 dark:text-gray-400">Rôle</p>
                  <p className="font-medium text-green-600 dark:text-green-400">Administrateur</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-500 dark:text-gray-400">Membre depuis</p>
                  <p className="text-gray-900 dark:text-white">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString("fr-FR") : "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;