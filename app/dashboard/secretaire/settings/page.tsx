// app/dashboard/secretaire/parametres/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Sun,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Save,
  Key,
  FileText,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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

// Composants Skeleton personnalisés
const ProfileSkeleton = () => (
  <Card>
    <CardHeader className="p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-4 sm:p-6 pt-0">
      <div className="space-y-3 sm:space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="w-5 h-5 rounded-full" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const AppearanceSkeleton = () => (
  <Card>
    <CardHeader className="p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-4 sm:p-6 pt-0">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 min-w-0 flex-1">
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="w-10 h-6 rounded-full" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const SecuritySkeleton = () => (
  <Card>
    <CardHeader className="p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-4 sm:p-6 pt-0">
      <div className="space-y-3 sm:space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="w-5 h-5 rounded-full" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const AccountInfoSkeleton = () => (
  <Card>
    <CardHeader className="p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-4 sm:p-6 pt-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const HeaderSkeleton = () => (
  <div className="bg-white border-b border-gray-200 p-4 sm:p-6 flex-shrink-0">
    <div className="max-w-4xl mx-auto">
      <Skeleton className="h-7 w-48 mb-2" />
      <Skeleton className="h-4 w-64" />
    </div>
  </div>
);

const SecretaireSettingsPage = () => {
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
  const [pageLoading, setPageLoading] = useState(true);
  
  // États pour les modifications
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  });

  // 🔒 Vérification accès secrétaire
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    } else if (isLoaded && user) {
      const role = user.publicMetadata?.role || "inconnu";
      if (role !== "secretaire") {
        toast.error("Accès réservé aux secrétaires uniquement !");
        router.push("/dashboard");
      } else {
        // Pré-remplir les infos du profil Clerk
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          username: user.username || "",
          email: user.primaryEmailAddress?.emailAddress || "",
          currentPassword: "",
          newPassword: "",
        });
        
        // Simuler un chargement pour voir les skeletons
        setTimeout(() => setPageLoading(false), 1000);
      }
    }
  }, [user, isLoaded, router]);

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

  // 🔥 Mettre à jour le profil avec Clerk
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
      await user.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
      });
      
      // Si l'email est modifié
      if (formData.email !== user?.primaryEmailAddress?.emailAddress) {
        await user.createEmailAddress({ email: formData.email });
        toast.info("Un email de vérification a été envoyé à la nouvelle adresse.");
      }
      
      toast.success("Profil secrétaire mis à jour avec succès !");
      setProfileOpen(false);
    } catch (error: unknown) {
      const clerkError = error as ClerkError;
      if (
        clerkError?.errors?.[0]?.code === "session_verification_required" ||
        clerkError?.errors?.[0]?.code === "verification_required" ||
        clerkError?.message?.includes("additional verification") ||
        clerkError?.message?.includes("re-authenticate")
      ) {
        setNeedsReauth(true);
      } else {
        toast.error("Erreur lors de la mise à jour : " + (clerkError?.errors?.[0]?.message || clerkError?.message || "Erreur inconnue"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 Changer le mot de passe avec Clerk
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
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "" }));
      setPasswordOpen(false);
      
      // Déconnexion après changement de mot de passe
      await signOut();
      toast.info("Veuillez vous reconnecter avec votre nouveau mot de passe.");
      router.push("/sign-in");
    } catch (error: unknown) {
      const clerkError = error as ClerkError;
      if (
        clerkError?.errors?.[0]?.code === "session_verification_required" ||
        clerkError?.errors?.[0]?.code === "verification_required" ||
        clerkError?.message?.includes("additional verification") ||
        clerkError?.message?.includes("re-authenticate")
      ) {
        setNeedsReauth(true);
      } else if (clerkError?.errors?.[0]?.code === "form_password_incorrect") {
        toast.error("Mot de passe actuel incorrect.");
      } else if (clerkError?.errors?.[0]?.code === "form_password_pwned") {
        toast.error("Ce mot de passe a été compromis. Veuillez en choisir un autre.");
      } else if (clerkError?.errors?.[0]?.code === "form_password_size") {
        toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      } else {
        toast.error("Erreur lors du changement de mot de passe : " + (clerkError?.errors?.[0]?.message || clerkError?.message || "Erreur inconnue"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded || pageLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col lg:pl-5 pt-20 lg:pt-6">
        <HeaderSkeleton />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 flex flex-col gap-4 sm:gap-6">
            <ProfileSkeleton />
            <AppearanceSkeleton />
            <SecuritySkeleton />
            <AccountInfoSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:pl-5 pt-20 lg:pt-6">
      {/* En-tête */}
      <div className="bg-white border-b border-gray-200 p-4 sm:p-6 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Paramètres Secrétaire</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Gérez votre compte secrétaire</p>
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
              className="flex-1 bg-pink-600 hover:bg-pink-700 text-sm sm:text-base"
            >
              Se ré-authentifier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contenu principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 flex flex-col gap-4 sm:gap-6">
          
          {/* Section Profil Secrétaire */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-50 rounded-lg">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg">Profil Secrétaire</CardTitle>
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
                            className="bg-pink-600 hover:bg-pink-700 text-sm sm:text-base w-full sm:w-auto"
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

          {/* Section Apparence */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-50 rounded-lg">
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
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
          
          {/* Section Sécurité */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg">Sécurité</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Protégez votre compte secrétaire</CardDescription>
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
                                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
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
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg">Informations du Compte</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Détails de votre compte secrétaire</CardDescription>
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
                  <p className="font-medium text-pink-600 text-xs sm:text-sm">Secrétaire</p>
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

export default SecretaireSettingsPage;