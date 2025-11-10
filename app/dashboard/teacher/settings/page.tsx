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
  AlertTriangle,
  Phone,
  School,
  BookOpen,
  GraduationCap,
  Bell,
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
import { toast } from "sonner";

// Interface pour les erreurs Clerk
interface ClerkError {
  code?: string;
  message?: string;
  longMessage?: string;
}

interface ClerkErrorResponse {
  errors?: ClerkError[];
  message?: string;
}

const TeacherSettingsPage = () => {
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

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
  });

  // Métadonnées professeur 
  const teacherMetadata = {
    subject: "Mathématiques",
    classes: "Terminale S2, Première S1",
    filiere: "Scientifique",
  };

  //Vérification accès professeur
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    } else if (isLoaded && user) {
      const role = user.publicMetadata?.role || "inconnu";
      if (role !== "Enseignant") {
        toast.error("Accès réservé aux professeurs uniquement !");
        router.push("/dashboard");
      } else {
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          username: user.username || "",
          email: user.primaryEmailAddress?.emailAddress || "",
          phone: user.primaryPhoneNumber?.phoneNumber || "",
          currentPassword: "",
          newPassword: "",
        });
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
    openSignIn({ 
      redirectUrl: window.location.href,
      appearance: {
        elements: {
          formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
        }
      }
    });
  };

  const handleClerkError = (error: unknown): string => {
    const clerkError = error as ClerkErrorResponse;
    
    if (clerkError?.errors?.[0]?.code === "session_verification_required" ||
        clerkError?.errors?.[0]?.code === "verification_required" ||
        clerkError?.message?.includes("additional verification") ||
        clerkError?.message?.includes("re-authenticate")) {
      setNeedsReauth(true);
      return "Vérification de sécurité requise";
    }

    return clerkError?.errors?.[0]?.message || clerkError?.message || "Une erreur inconnue est survenue";
  };

  // Mise à jour du profil professeur
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
      // Mise à jour des informations de base
      await user.update({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      });

      // Mise à jour du username
      if (formData.username && formData.username !== user.username) {
        await user.update({
          username: formData.username.trim(),
        });
      }

      // Gestion de l'email
      const currentEmail = user.primaryEmailAddress?.emailAddress;
      if (formData.email !== currentEmail) {
        // Vérifier si l'email existe déjà
        const emailExists = user.emailAddresses.some(
          (emailAddr) => emailAddr.emailAddress === formData.email
        );

        if (!emailExists) {
          // Créer une nouvelle adresse email
          await user.createEmailAddress({ email: formData.email });
          toast.info("Un email de vérification a été envoyé à la nouvelle adresse.");
        } else {
          toast.info("Cette adresse email est déjà associée à votre compte.");
        }
      }

      toast.success("Profil professeur mis à jour avec succès !");
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

  // Changement de mot de passe
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
      await signOut();
      toast.info("Veuillez vous reconnecter avec votre nouveau mot de passe.");
      router.push("/sign-in");
    } catch (error) {
      const clerkError = error as ClerkErrorResponse;
      const errorCode = clerkError?.errors?.[0]?.code;
      
      if (errorCode === "session_verification_required" ||
          errorCode === "verification_required" ||
          clerkError?.message?.includes("additional verification") ||
          clerkError?.message?.includes("re-authenticate")) {
        setNeedsReauth(true);
      } else if (errorCode === "form_password_incorrect") {
        toast.error("Mot de passe actuel incorrect.");
      } else if (errorCode === "form_password_pwned") {
        toast.error("Ce mot de passe a été compromis. Veuillez en choisir un autre.");
      } else if (errorCode === "form_password_size") {
        toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      } else if (errorCode === "form_password_no_uppercase" || errorCode === "form_password_no_lowercase") {
        toast.error("Le mot de passe doit contenir des majuscules et minuscules.");
      } else if (errorCode === "form_password_no_number") {
        toast.error("Le mot de passe doit contenir au moins un chiffre.");
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

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <div className="h-screen overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* En-tête */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">Paramètres Professeur</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1 sm:mt-2 break-words">
              Gérez votre compte et vos préférences
            </p>
          </div>

          {/* Modal ré-authentification */}
          <Dialog open={needsReauth} onOpenChange={setNeedsReauth}>
            <DialogContent className="max-w-[95vw] sm:max-w-md mx-2 sm:mx-auto">
              <DialogHeader>
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <DialogTitle className="text-center text-lg sm:text-xl break-words">
                  Vérification requise
                </DialogTitle>
                <DialogDescription className="text-center text-sm sm:text-base break-words">
                  Une vérification de sécurité est nécessaire pour continuer.
                </DialogDescription>
              </DialogHeader>
              
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <AlertDescription className="text-yellow-800 text-sm break-words">
                  Pour des raisons de sécurité, veuillez vous ré-authentifier.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={() => setNeedsReauth(false)}
                  className="w-full sm:flex-1 text-sm sm:text-base"
                >
                  Annuler
                </Button>
                <Button
                  onClick={triggerReauthentication}
                  className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                >
                  Se ré-authentifier
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Section Profil */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                    Profil Professeur
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-500 break-words">
                    Modifiez vos informations personnelles
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Section profil accordéon*/}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="w-full h-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between hover:bg-gray-50 min-w-0"
                  >
                    <div className="text-left min-w-0 flex-1 mr-3">
                      <span className="font-medium text-gray-900 text-sm sm:text-base block break-words">
                        Informations personnelles
                      </span>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
                        Modifiez votre nom, prénom, nom d&apos;utilisateur, email et téléphone
                      </p>
                    </div>
                    {profileOpen ? (
                      <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </Button>

                  {profileOpen && (
                    <div className="px-3 sm:px-4 pb-4">
                      <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-2 min-w-0">
                            <Label htmlFor="firstName" className="text-sm font-medium">Prénom</Label>
                            <Input
                              id="firstName"
                              type="text"
                              value={formData.firstName}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  firstName: e.target.value,
                                }))
                              }
                              placeholder="Votre prénom"
                              className="text-sm sm:text-base"
                              required
                            />
                          </div>

                          <div className="space-y-2 min-w-0">
                            <Label htmlFor="lastName" className="text-sm font-medium">Nom</Label>
                            <Input
                              id="lastName"
                              type="text"
                              value={formData.lastName}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  lastName: e.target.value,
                                }))
                              }
                              placeholder="Votre nom"
                              className="text-sm sm:text-base"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2 min-w-0">
                          <Label htmlFor="username" className="text-sm font-medium">Nom d&apos;utilisateur</Label>
                          <Input
                            id="username"
                            type="text"
                            value={formData.username}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                username: e.target.value,
                              }))
                            }
                            placeholder="Nom d&apos;utilisateur"
                            className="text-sm sm:text-base"
                          />
                        </div>

                        <div className="space-y-2 min-w-0">
                          <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="break-words">Adresse email</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            placeholder="votre@email.com"
                            className="text-sm sm:text-base"
                            required
                          />
                          <p className="text-xs sm:text-sm text-gray-500 break-words">
                            Un email de vérification sera envoyé si vous changez d&apos;adresse
                          </p>
                        </div>

                        <div className="space-y-2 min-w-0">
                          <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span className="break-words">Numéro de téléphone</span>
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="+229 90 00 00 00"
                            className="text-sm sm:text-base"
                          />
                        </div>

                        <Separator />

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base min-w-0"
                          >
                            <Save className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">
                              {isLoading ? "Mise à jour..." : "Enregistrer"}
                            </span>
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Informations Professionnelles */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
                  <School className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                    Informations Professionnelles
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-500 break-words">
                    Vos informations d&apos;enseignement (consultation seule)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {/* Matière enseignée */}
                  <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 min-w-0">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase break-words">Matière</p>
                      <p className="text-gray-800 font-semibold text-sm sm:text-base break-words">
                        {teacherMetadata.subject}
                      </p>
                    </div>
                  </div>
                  
                  {/* Filière */}
                  <div className="flex items-center p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 min-w-0">
                    <School className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-500 uppercase break-words">Filière</p>
                      <p className="text-gray-800 font-semibold text-sm sm:text-base break-words">
                        {teacherMetadata.filiere}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Message d'information */}
                <Alert className="bg-blue-50 border-blue-200">
                  <Bell className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <AlertDescription className="text-blue-800 text-sm break-words">
                    Les modifications des informations professionnelles (matière, classes, filière) 
                    doivent être demandées à l&apos;administration.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Section Apparence */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                    Apparence
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-500 break-words">
                    Personnalisez l&apos;apparence de votre interface
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg min-w-0">
                  <div className="space-y-0.5 min-w-0 flex-1 mr-4">
                    <Label htmlFor="dark-mode" className="text-sm sm:text-base font-medium block break-words">
                      Mode sombre
                    </Label>
                    <p className="text-xs sm:text-sm text-gray-500 break-words">
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

          {/* Section Sécurité */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-red-50 rounded-lg flex-shrink-0">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                    Sécurité
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-500 break-words">
                    Protégez votre compte professeur
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    onClick={() => setPasswordOpen(!passwordOpen)}
                    className="w-full h-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between hover:bg-gray-50 min-w-0"
                  >
                    <div className="text-left min-w-0 flex-1 mr-3">
                      <span className="font-medium text-gray-900 text-sm sm:text-base block break-words">
                        Modifier le mot de passe
                      </span>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words">
                        Mettez à jour votre mot de passe régulièrement
                      </p>
                    </div>
                    {passwordOpen ? (
                      <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </Button>

                  {passwordOpen && (
                    <div className="px-3 sm:px-4 pb-4">
                      <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                          <div className="space-y-2 min-w-0">
                            <Label htmlFor="currentPassword" className="text-sm font-medium">Mot de passe actuel</Label>
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
                                className="text-sm sm:text-base pr-10"
                                required
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              >
                                {showOldPassword ? 
                                  <EyeOff className="w-4 h-4 text-gray-400" /> : 
                                  <Eye className="w-4 h-4 text-gray-400" />
                                }
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2 min-w-0">
                            <Label htmlFor="newPassword" className="text-sm font-medium">Nouveau mot de passe</Label>
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
                                className="text-sm sm:text-base pr-10"
                                required
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              >
                                {showNewPassword ? 
                                  <EyeOff className="w-4 h-4 text-gray-400" /> : 
                                  <Eye className="w-4 h-4 text-gray-400" />
                                }
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 break-words">
                              Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules et chiffres.
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={isLoading}
                            variant="destructive"
                            className="text-sm sm:text-base min-w-0"
                          >
                            <Key className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="truncate">
                              {isLoading ? "Changement..." : "Mettre à jour"}
                            </span>
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
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
                  <School className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                    Informations du Compte
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-500 break-words">
                    Détails de votre compte professeur
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-sm">
                <div className="space-y-2 min-w-0">
                  <p className="text-gray-500 text-xs sm:text-sm break-words">ID Utilisateur</p>
                  <p className="font-mono text-gray-900 text-xs sm:text-sm break-all">{user?.id}</p>
                </div>
                <div className="space-y-2 min-w-0">
                  <p className="text-gray-500 text-xs sm:text-sm break-words">Rôle</p>
                  <p className="font-medium text-green-600 text-xs sm:text-sm break-words">Professeur</p>
                </div>
                <div className="space-y-2 min-w-0">
                  <p className="text-gray-500 text-xs sm:text-sm break-words">Membre depuis</p>
                  <p className="text-gray-900 text-xs sm:text-sm break-words">
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

export default TeacherSettingsPage;