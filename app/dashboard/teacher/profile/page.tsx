// app/dashboard/teacher/profile/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import {
  User,
  Mail,
  Camera,
  Trash2,
  LogOut, 
  AlertCircle,
  Calendar,
  BookOpen,
  Phone,
  School, 
  CheckCircle,
  Clock,
  Shield,
  LucideIcon,
  X,
  Users,
  GraduationCap,
  MapPin
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Course {
  id: number;
  matiere: string;
  classe: string;
  jour: string;
  horaire: string;
  type: string;
  salle: string;
  filiere: string;
}

interface Activity {
  id: number;
  type: string;
  description: string;
  timestamp: string;
}

interface ProfileData {
  teacherInfo: {
    name: string;
    email: string;
    phone: string;
    specialite: string;
    createdAt: string;
    userId: string;
  };
  professionalInfo: {
    matiere: string;
    filieres: string[];
    statut: string;
  };
  cours: Course[];
  stats: {
    totalCours: number;
    totalFilieres: number;
    totalMatieres: number;
  };
  activities: Activity[];
}

const TeacherProfilePage = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les données réelles du profil
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("🔄 Chargement des données du profil...");
        
        const response = await fetch('/api/teacher/profile');
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        console.log("✅ Données reçues:", result);
        setProfileData(result);
      } catch (error) {
        console.error('❌ Erreur chargement profil:', error);
        setError(error instanceof Error ? error.message : 'Erreur lors du chargement du profil');
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoaded && user) {
      loadProfileData();
    }
  }, [isLoaded, user]);

  // Upload photo avec Clerk
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
    } catch (error) {
      console.error("Erreur upload:", error);
      alert("Erreur lors du téléchargement de l'image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Supprimer la photo
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

  // Télécharger l'image
  const handleDownloadImage = () => {
    const link = document.createElement("a");
    link.href = user?.imageUrl || "";
    link.download = `photo-profil-${user?.firstName}-${user?.lastName}.jpg`;
    link.click();
  };

  // Déconnexion
  const handleLogout = () => setIsLogoutModalOpen(true);
  const handleConfirmLogout = async () => await signOut({ redirectUrl: "/auth/signin" });
  const handleCancelLogout = () => setIsLogoutModalOpen(false);

  // Fonction pour obtenir l'icône d'activité
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "login":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "profile_view":
        return <User className="w-4 h-4 text-blue-500" />;
      case "schedule_access":
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case "course_teaching":
        return <BookOpen className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Fonction pour obtenir la couleur du badge de type de cours
  const getCourseColor = (type: string) => {
    switch (type) {
      case "theorique":
      case "TH":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pratique":
      case "PR":
        return "bg-green-100 text-green-800 border-green-200";
      case "projet":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "TD":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "TP":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Formater le jour
  const formatDay = (day: string) => {
    const days: { [key: string]: string } = {
      'MONDAY': 'Lundi',
      'TUESDAY': 'Mardi',
      'WEDNESDAY': 'Mercredi',
      'THURSDAY': 'Jeudi',
      'FRIDAY': 'Vendredi',
      'SATURDAY': 'Samedi',
      'SUNDAY': 'Dimanche',
      'LUNDI': 'Lundi',
      'MARDI': 'Mardi',
      'MERCREDI': 'Mercredi',
      'JEUDI': 'Jeudi',
      'VENDREDI': 'Vendredi',
      'SAMEDI': 'Samedi'
    };
    return days[day] || day;
  };

  // Debug: Afficher les données dans la console
  useEffect(() => {
    if (profileData) {
      console.log("📊 Données du profil chargées:", profileData);
      console.log("📅 Cours récupérés:", profileData.cours);
      console.log("🎯 Filières:", profileData.professionalInfo.filieres);
    }
  }, [profileData]);

  if (!isLoaded || isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!user) {
    return <UserNotFound />;
  }

  const profileImage = user.imageUrl || "https://placehold.co/150x150/3b82f6/ffffff?text=P";
  const createdAt = user.createdAt ? new Date(user.createdAt) : new Date();

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
          
          {/* Carte de profil principale */}
          <ProfileMainCard 
            user={user}
            profileData={profileData}
            profileImage={profileImage}
            showImageOptions={showImageOptions}
            setShowImageOptions={setShowImageOptions}
            isUploading={isUploading}
            fileInputRef={fileInputRef}
            handleDeleteImage={handleDeleteImage}
            showImageModal={showImageModal}
            setShowImageModal={setShowImageModal}
            handleDownloadImage={handleDownloadImage}
            handleLogout={handleLogout}
            createdAt={createdAt}
          />

          {/* Section sécurité */}
          <SecuritySection />

          {/* Activité récente */}
          <RecentActivities profileData={profileData} getActivityIcon={getActivityIcon} />

          {/* Mes Cours */}
          <CoursesSection 
            profileData={profileData} 
            formatDay={formatDay}
            getCourseColor={getCourseColor}
          />

        </div>
      </div>

      {/* Modale de déconnexion */}
      <LogoutModal 
        isLogoutModalOpen={isLogoutModalOpen}
        handleCancelLogout={handleCancelLogout}
        handleConfirmLogout={handleConfirmLogout}
      />
    </div>
  );
};

// Composants séparés pour une meilleure lisibilité

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card className="relative overflow-hidden border-0 shadow-xl">
        <div className="bg-principal h-40 w-full relative">
          <Skeleton className="absolute left-8 bottom-0 translate-y-1/2 w-32 h-32 rounded-full" />
        </div>
        <CardHeader className="pt-16 pb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

const ErrorDisplay = ({ error }: { error: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
      <p className="text-gray-600 mb-4">{error}</p>
      <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
        Réessayer
      </Button>
    </div>
  </div>
);

const UserNotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900">Utilisateur non trouvé</h2>
      <p className="text-gray-600 mt-2">Veuillez vous reconnecter</p>
    </div>
  </div>
);

const ProfileMainCard = ({ 
  user, 
  profileData, 
  profileImage, 
  showImageOptions, 
  setShowImageOptions, 
  isUploading, 
  fileInputRef, 
  handleDeleteImage, 
  showImageModal, 
  setShowImageModal, 
  handleDownloadImage, 
  handleLogout, 
  createdAt 
}: any) => (
  <Card className="relative overflow-hidden border-0 shadow-xl">
    {/* Bannière */}
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-40 w-full relative">
      <div className="absolute left-8 bottom-0 translate-y-1/2">
        <div className="relative">
          <Image
            src={profileImage}
            alt="Photo de profil"
            width={128}
            height={128}
            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-2xl cursor-pointer"
            onClick={() => setShowImageOptions(true)}
          />
          <Button
            onClick={() => setShowImageOptions(true)}
            disabled={isUploading}
            size="icon"
            className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full border-2 border-white shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110 disabled:opacity-50 w-10 h-10"
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

    {/* Menu des options d'image */}
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl p-4 max-w-lg w-full relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowImageModal(false)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          >
            <X className="w-5 h-5" />
          </Button>
          <Image
            src={user.imageUrl || profileImage}
            alt="Photo de profil"
            width={500}
            height={500}
            className="w-full h-auto rounded-xl object-cover"
          />
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowImageModal(false)}
              className="px-4 py-2 bg-gray-500 text-white hover:bg-gray-600"
            >
              Fermer
            </Button>
            <Button
              onClick={handleDownloadImage}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              Télécharger
            </Button>
          </div>
        </div>
      </div>
    )}

    {/* Nom et rôle */}
    <CardHeader className="pt-16 pb-6">
      <div className="flex flex-col">
        <CardTitle className="text-2xl font-extrabold text-gray-900">
          {user.firstName} {user.lastName}
        </CardTitle>
        <CardDescription className="mt-1">
          <Badge variant="secondary" className="text-blue-600 bg-blue-50 font-medium">
            Professeur
          </Badge>
          <span className="text-gray-500 text-sm ml-2">
            {profileData?.teacherInfo.specialite || "Spécialité non définie"}
          </span>
        </CardDescription>
      </div>
    </CardHeader>

    {/* Informations personnelles */}
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-700">Informations Personnelles</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InfoItem label="Prénom" value={user.firstName || ""} icon={User} />
        <InfoItem label="Nom" value={user.lastName || ""} icon={User} />
        <InfoItem
          label="E-mail"
          value={user.emailAddresses[0]?.emailAddress || profileData?.teacherInfo.email || ""}
          icon={Mail}
        />
        <InfoItem
          label="Téléphone"
          value={profileData?.teacherInfo.phone || "Non renseigné"}
          icon={Phone}
        />
      </div>
    </CardContent>

    {/* Informations professionnelles */}
    <CardContent className="p-6 border-t">
      <div className="flex items-center gap-3 mb-6">
        <School className="w-6 h-6 text-green-600" />
        <h3 className="text-xl font-bold text-gray-700">Informations Professionnelles</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InfoItem 
          label="Matière principale" 
          value={profileData?.professionalInfo.matiere || "À définir"} 
          icon={BookOpen} 
        />
        <InfoItem 
          label="Filières" 
          value={profileData?.professionalInfo.filieres?.join(", ") || "Aucune filière assignée"} 
          icon={Users} 
        />
        <InfoItem 
          label="Statut" 
          value={profileData?.professionalInfo.statut || "Actif"} 
          icon={CheckCircle} 
        />
      </div>
    </CardContent>

    {/* Statistiques */}
    {profileData?.stats && (
      <CardContent className="p-6 border-t bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-700">Mes Statistiques</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{profileData.stats.totalCours}</div>
            <div className="text-sm text-gray-600">Cours programmés</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">{profileData.stats.totalFilieres}</div>
            <div className="text-sm text-gray-600">Filières</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{profileData.stats.totalMatieres}</div>
            <div className="text-sm text-gray-600">Matières enseignées</div>
          </div>
        </div>
      </CardContent>
    )}

    {/* Date création + bouton */}
    <CardContent className="px-6 py-4 border-t bg-gray-50/50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
          className="w-full sm:w-64 flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl"
        >
          <LogOut className="w-5 h-5" />
          Se déconnecter
        </Button>
      </div>
    </CardContent>
  </Card>
);

const SecuritySection = () => (
  <Card className="border-0 shadow-xl">
    <CardHeader>
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-blue-600" />
        <CardTitle className="text-xl font-bold text-gray-700">Sécurité et Compte</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <Button
        variant="outline"
        onClick={() => window.open("https://accounts.clerk.com/user", "_blank")}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 border border-gray-200 rounded-lg"
      >
        <Shield className="w-5 h-5 text-blue-600" />
        <div className="flex-1 text-left">
          <p className="font-semibold text-gray-900">Gérer la sécurité</p>
          <p className="text-sm text-gray-600">Mot de passe, 2FA, sessions</p>
        </div>
      </Button>
    </CardContent>
  </Card>
);

const RecentActivities = ({ profileData, getActivityIcon }: any) => (
  <Card className="border-0 shadow-xl">
    <CardHeader>
      <div className="flex items-center gap-3">
        <Calendar className="w-6 h-6 text-blue-600" />
        <CardTitle className="text-xl font-bold text-gray-700">Activité Récente</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {profileData?.activities && profileData.activities.length > 0 ? (
          profileData.activities.map((activity: any) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {getActivityIcon(activity.type)}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.timestamp).toLocaleDateString("fr-FR")} à{" "}
                  {new Date(activity.timestamp).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>Aucune activité récente</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const CoursesSection = ({ profileData, formatDay, getCourseColor }: any) => (
  <Card className="border-0 shadow-xl">
    <CardHeader>
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-blue-600" />
        <CardTitle className="text-xl font-bold text-gray-700">Mon Emploi du Temps</CardTitle>
      </div>
      <CardDescription>
        {profileData?.cours && profileData.cours.length > 0 
          ? `${profileData.cours.length} cours programmés`
          : "Aucun cours programmé pour le moment"
        }
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {profileData?.cours && profileData.cours.length > 0 ? (
          profileData.cours.map((course: any) => (
            <div 
              key={course.id} 
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg border border-blue-100 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                <BookOpen className="w-5 h-5 text-blue-600 mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{course.matiere}</p>
                  <p className="text-xs text-gray-500 mt-1">{course.classe}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">{formatDay(course.jour)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">{course.horaire}</span>
                    </div>
                    {course.salle && course.salle !== 'Non assignée' && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{course.salle}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-2 sm:mt-0 sm:text-right">
                <Badge variant="outline" className={`text-xs ${getCourseColor(course.type)}`}>
                  {course.type}
                </Badge>
                {course.filiere && course.filiere !== 'Non assignée' && (
                  <p className="text-xs text-gray-600 mt-1">{course.filiere}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>Aucun cours programmé</p>
            <p className="text-sm mt-1">Vos cours apparaîtront ici une fois programmés</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const LogoutModal = ({ isLogoutModalOpen, handleCancelLogout, handleConfirmLogout }: any) => {
  if (!isLogoutModalOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          Confirmer la déconnexion
        </h3>
        <p className="text-gray-600 text-sm text-center mb-6">
          Êtes-vous sûr de vouloir vous déconnecter ?
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleCancelLogout}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmLogout}
            className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700"
          >
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
};

// Composant InfoItem
interface InfoProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

const InfoItem = ({ icon: Icon, label, value }: InfoProps) => (
  <div className="flex items-center p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
    <Icon className="w-5 h-5 text-blue-600 mr-4" />
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
      <p className="text-gray-800 font-semibold mt-1">{value}</p>
    </div>
  </div>
);

export default TeacherProfilePage;