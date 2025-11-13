"use client";

import React, { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Save,
  Key,
  Users,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface ClerkError {
  errors?: Array<{
    code: string;
    message: string;
    longMessage?: string;
    meta?: Record<string, unknown>;
  }>;
  message?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
}

const ParentSettingsPage = () => {
  const { user, isLoaded } = useUser();
  const { signOut, openSignIn, session } = useClerk();
  const router = useRouter();
  
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("fr");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  });

  // 🔒 Vérification accès parent
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    } else if (isLoaded && user) {
      const role = user.publicMetadata?.role || "inconnu";
      if (role !== "Parent") {
        toast.error("Accès réservé aux parents uniquement !");
        router.push("/dashboard");
      } else {
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          username: user.username || "",
          email: user.primaryEmailAddress?.emailAddress || "",
          currentPassword: "",
          newPassword: "",
        });
      }
    }
  }, [user, isLoaded, router]);

  // Vérifie si la session est récente (moins de 5 min)
  const isSessionRecent = (): boolean => {
    if (!session?.lastActiveAt) return false;
    const lastActive = new Date(session.lastActiveAt);
    const now = new Date();
    const diff = now.getTime() - lastActive.getTime();
    return diff <= 5 * 60 * 1000;
  };

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

  // 🔥 Mettre à jour le profil avec Clerk
  const handleProfileUpdate = async (e: React.FormEvent): Promise<void> => {
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
      await user.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
      });
      
      if (formData.email !== user?.primaryEmailAddress?.emailAddress) {
        await user.createEmailAddress({ email: formData.email });
        toast.info("Un email de vérification a été envoyé à la nouvelle adresse.");
      }
      
      toast.success("Profil parent mis à jour avec succès !");
      setProfileOpen(false);
    } catch (error: unknown) {
      if (requiresReauthentication(error)) {
        setNeedsReauth(true);
      } else {
        toast.error("Erreur lors de la mise à jour : " + getErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 Changer le mot de passe avec Clerk
  const handlePasswordChange = async (e: React.FormEvent): Promise<void> => {
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
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "" }));
      setPasswordOpen(false);
      await signOut();
      
      toast.info("Veuillez vous reconnecter avec votre nouveau mot de passe.");
      router.push("/sign-in");
    } catch (error: unknown) {
      if (requiresReauthentication(error)) {
        setNeedsReauth(true);
      } else if ((error as ClerkError)?.errors?.[0]?.code === "form_password_incorrect") {
        toast.error("Mot de passe actuel incorrect.");
      } else if ((error as ClerkError)?.errors?.[0]?.code === "form_password_pwned") {
        toast.error("Ce mot de passe a été compromis. Veuillez en choisir un autre.");
      } else if ((error as ClerkError)?.errors?.[0]?.code === "form_password_size") {
        toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      } else {
        toast.error("Erreur lors du changement de mot de passe : " + getErrorMessage(error));
      }
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
    <div className="min-h-screen bg-white flex flex-col lg:pl-5 pt-20 lg:pt-6">
      {/* En-tête */}
      <div className="bg-white border-b border-gray-200 p-4 sm:p-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Paramètres Parent</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Gérez votre compte parent</p>
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
            >
              Se ré-authentifier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 flex flex-col gap-4 sm:gap-6">
          
          {/* Section Profil Parent */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg">Profil Parent</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Modifiez vos informations personnelles</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {/* Section profil dépliante */}
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
                        Modifiez votre nom, prénom, nom d&apos;utilisateur et email
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
                          {/* Prénom */}
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-sm sm:text-base">Prénom</Label>
                            <Input
                              id="firstName"
                              type="text"
                              value={formData.firstName}
                              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                              placeholder="Votre prénom"
                              required
                              className="text-sm sm:text-base"
                            />
                          </div>

                          {/* Nom */}
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-sm sm:text-base">Nom</Label>
                            <Input
                              id="lastName"
                              type="text"
                              value={formData.lastName}
                              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                              placeholder="Votre nom"
                              required
                              className="text-sm sm:text-base"
                            />
                          </div>
                        </div>

                        {/* Nom d'utilisateur */}
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-sm sm:text-base">Nom d&apos;utilisateur</Label>
                          <Input
                            id="username"
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="Votre nom d&apos;utilisateur"
                            className="text-sm sm:text-base"
                          />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2 text-sm sm:text-base">
                            <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                            Adresse email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
                            className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base w-full sm:w-auto"
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

          {/* Section Sécurité */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg">Sécurité</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Protégez votre compte parent</CardDescription>
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
                                onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
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
                                {showOldPassword ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
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
                                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                                placeholder="Nouveau mot de passe"
                                required
                                minLength={8}
                                className="text-sm sm:text-base pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              >
                                {showNewPassword ? <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" /> : <Eye className="w-3 h-3 sm:w-4 sm:h-4" />}
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
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg">Informations du Compte</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Détails de votre compte parent</CardDescription>
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
                  <p className="font-medium text-green-600 text-xs sm:text-sm">Parent</p>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-gray-500 text-xs sm:text-sm">Membre depuis</p>
                  <p className="text-gray-900 text-xs sm:text-sm">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
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

export default ParentSettingsPage;