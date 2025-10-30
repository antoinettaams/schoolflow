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
      // Modification email : créer un nouvel email avec confirmation
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
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres Censeur</h1>
          <p className="text-gray-500 mt-1">Gérez votre compte censeur</p>
        </div>
      </div>

      {/* Modal ré-authentification */}
      <Dialog open={needsReauth} onOpenChange={setNeedsReauth}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Vérification requise
            </DialogTitle>
            <DialogDescription>
              Une vérification de sécurité est nécessaire pour continuer.
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Pour des raisons de sécurité, veuillez vous ré-authentifier.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setNeedsReauth(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={triggerReauthentication}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Se ré-authentifier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 flex flex-col gap-6">
          {/* Profil */}
          <Card>
            <CardHeader >
              <div className="flex items-center gap-3">
                <div className="p-2  rounded-lg">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Profil Censeur</CardTitle>
                  <CardDescription>Modifiez vos informations personnelles</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg">
                  <Button
                    variant="ghost"
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="w-full h-auto px-4 py-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="text-left">
                      <span className="font-medium text-gray-900">Informations personnelles</span>
                      <p className="text-sm text-gray-500 mt-1">Modifiez votre nom, email et nom d&apos;utilisateur</p>
                    </div>
                    {profileOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </Button>
                  
                  {profileOpen && (
                    <div className="px-4 pb-4">
                      <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">Prénom</Label>
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                              placeholder="Votre prénom"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Nom</Label>
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                              placeholder="Votre nom"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="username">Nom d&apos;utilisateur</Label>
                          <Input
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                            placeholder="Votre nom d&apos;utilisateur"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Adresse email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="votre@email.com"
                            required
                          />
                          <p className="text-sm text-gray-500">
                            Un email de vérification sera envoyé si vous changez d&apos;adresse
                          </p>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-purple-600 hover:bg-purple-700"
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

          {/* Apparence */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Sun className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Apparence</CardTitle>
                  <CardDescription>Personnalisez l&apos;apparence de votre interface</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">Mode sombre</Label>
                    <p className="text-sm text-gray-500">
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

          {/* Général */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Globe className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Général</CardTitle>
                  <CardDescription>Paramètres généraux de l&apos;application</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="language">Langue</Label>
                    <p className="text-sm text-gray-500">Définir la langue d&apos;affichage</p>
                  </div>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Notifications</Label>
                    <p className="text-sm text-gray-500">Recevoir des notifications importantes</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sécurité */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Lock className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <CardTitle>Sécurité</CardTitle>
                  <CardDescription>Protégez votre compte censeur</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg">
                  <Button
                    variant="ghost"
                    onClick={() => setPasswordOpen(!passwordOpen)}
                    className="w-full h-auto px-4 py-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="text-left">
                      <span className="font-medium text-gray-900">Modifier le mot de passe</span>
                      <p className="text-sm text-gray-500 mt-1">Mettez à jour votre mot de passe régulièrement</p>
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
                            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                            <div className="relative">
                              <Input
                                id="currentPassword"
                                type={showOldPassword ? "text" : "password"}
                                value={formData.currentPassword}
                                onChange={(e) =>
                                  setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))
                                }
                                placeholder="Entrez votre mot de passe actuel"
                                required
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              >
                                {showOldPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                            <div className="relative">
                              <Input
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                value={formData.newPassword}
                                onChange={(e) =>
                                  setFormData((prev) => ({ ...prev, newPassword: e.target.value }))
                                }
                                placeholder="Choisissez un nouveau mot de passe"
                                required
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              >
                                {showNewPassword ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={isLoading}
                            variant="destructive"
                            className="bg-red-500"
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

          {/* Informations du compte */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Informations du Compte</CardTitle>
                  <CardDescription>Détails de votre compte censeur</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="space-y-2">
                  <p className="text-gray-500">ID Utilisateur</p>
                  <p className="font-mono text-gray-900">{user?.id}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-500">Rôle</p>
                  <p className="font-medium text-purple-600">Censeur</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-500">Membre depuis</p>
                  <p className="text-gray-900">
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