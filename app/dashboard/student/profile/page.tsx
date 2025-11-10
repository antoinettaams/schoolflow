// app/dashboard/student/profile/page.tsx
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
  GraduationCap,
  Hash, 
  CheckCircle,
  Clock,
  Shield,
  LucideIcon,
  X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UserActivity {
  id: number;
  type: string;
  description: string;
  timestamp: Date;
  icon: string;
}

interface Subject {
  id: number;
  nom: string;
  description: string;
  coefficient: number;
  typeModule: string;
  couleur: string;
  enseignements: any[];
}

interface Grade {
  id: string;
  module: {
    id: number;
    nom: string;
    coefficient: number;
    typeModule: string;
  };
  interrogation1: number | null;
  interrogation2: number | null;
  interrogation3: number | null;
  devoir: number | null;
  composition: number | null;
  rang: number | null;
  formulaUsed: string | null;
  teacher: {
    firstName: string;
    lastName: string;
    matiere: string;
  } | null;
  createdAt: string;
}

interface StudentData {
  user: {
    id: string;
    clerkUserId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: string;
    createdAt: string;
  };
  student: {
    id: string;
    studentNumber: string;
    vagueNumber: number | null;
    filiere: {
      id: number;
      nom: string;
      description: string | null;
      dureeFormation: string;
    } | null;
    vague: {
      id: string;
      nom: string;
      description: string | null;
      dateDebut: string;
      dateFin: string;
    } | null;
  };
  grades: Grade[];
  activities: UserActivity[];
  subjects: Subject[];
}

// Composant Skeleton pour le chargement
const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <div className="h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Carte de profil principale - Skeleton */}
          <Card className="relative overflow-hidden border-0 shadow-xl">
            {/* Bannière Skeleton */}
            <div className="bg-gray-300 h-40 w-full relative animate-pulse">
              <div className="absolute left-8 bottom-0 translate-y-1/2">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gray-400 border-4 border-white shadow-2xl" />
                  <div className="absolute bottom-0 right-0 w-10 h-10 bg-gray-500 rounded-full border-2 border-white" />
                </div>
              </div>
            </div>

            {/* Header Skeleton */}
            <CardHeader className="pt-16 pb-6">
              <div className="flex flex-col space-y-2">
                <div className="h-8 bg-gray-300 rounded w-1/3 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              </div>
            </CardHeader>

            {/* Informations personnelles Skeleton */}
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-300 rounded w-48 animate-pulse"></div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center p-4">
                    <div className="w-5 h-5 bg-gray-300 rounded mr-4 animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                      <div className="h-5 bg-gray-300 rounded w-32 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>

            {/* Informations scolaires Skeleton */}
            <CardContent className="p-6 border-t">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-300 rounded w-48 animate-pulse"></div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center p-4">
                    <div className="w-5 h-5 bg-gray-300 rounded mr-4 animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                      <div className="h-5 bg-gray-300 rounded w-32 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>

            {/* Footer Skeleton */}
            <CardContent className="px-6 py-4 border-t bg-gray-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="h-4 bg-gray-300 rounded w-40 animate-pulse"></div>
                <div className="h-12 bg-gray-300 rounded w-64 animate-pulse"></div>
              </div>
            </CardContent>
          </Card>

          {/* Section sécurité Skeleton */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-300 rounded w-48 animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-300 rounded w-32 mb-1 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activité récente Skeleton */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-300 rounded w-48 animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-1 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section matières Skeleton */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-300 rounded w-64 animate-pulse"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                    <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-300 rounded w-32 mb-1 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                        <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StudentProfilePage = () => {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les données de l'étudiant
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/student/profile');
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des données');
        }
        
        const data = await response.json();
        setStudentData(data);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Impossible de charger les données du profil');
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && clerkUser) {
      fetchStudentData();
    }
  }, [isLoaded, clerkUser]);

  // Upload photo
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
      await clerkUser?.setProfileImage({ file });
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
      await clerkUser?.setProfileImage({ file: null });
      alert("Photo supprimée avec succès !");
      setShowImageOptions(false);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression");
    }
  };

  // Télécharger l'image
  const handleDownloadImage = () => {
    const link = document.createElement("a");
    link.href = clerkUser?.imageUrl || "";
    link.download = `photo-profil-${clerkUser?.firstName}-${clerkUser?.lastName}.jpg`;
    link.click();
  };

  // Déconnexion
  const handleLogout = () => setIsLogoutModalOpen(true);
  const handleConfirmLogout = async () => await signOut({ redirectUrl: "/auth/signin" });
  const handleCancelLogout = () => setIsLogoutModalOpen(false);

  // Fonction pour rendre les icônes d'activité
  const renderActivityIcon = (iconName: string) => {
    const iconProps = { className: "w-4 h-4" };
    
    switch (iconName) {
      case 'check-circle':
        return <CheckCircle {...iconProps} className={`${iconProps.className} text-green-500`} />;
      case 'book-open':
        return <BookOpen {...iconProps} className={`${iconProps.className} text-blue-500`} />;
      case 'clock':
        return <Clock {...iconProps} className={`${iconProps.className} text-orange-500`} />;
      default:
        return <CheckCircle {...iconProps} className={`${iconProps.className} text-gray-500`} />;
    }
  };

  // Afficher le skeleton pendant le chargement
  if (!isLoaded || loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (!clerkUser || !studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600">Aucune donnée trouvée</p>
        </div>
      </div>
    );
  }

  const profileImage = clerkUser.imageUrl || "https://placehold.co/150x150/3b82f6/ffffff?text=É";
  const createdAt = clerkUser.createdAt ? new Date(clerkUser.createdAt) : new Date();
  
  const studentId = studentData.student.studentNumber || "Non assigné";
  const enrollmentYear = studentData.student.vague?.dateDebut 
    ? new Date(studentData.student.vague.dateDebut).getFullYear().toString()
    : "2024";
  const filiere = studentData.student.filiere?.nom || "Non assigné";

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
          <Card className="relative overflow-hidden border-0 shadow-xl">
            {/* Bannière */}
            <div className="bg-principal h-40 w-full relative">
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

                  {clerkUser.imageUrl && (
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
                    src={clerkUser.imageUrl || profileImage}
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
                  {studentData.user.firstName} {studentData.user.lastName}
                </CardTitle>
                <CardDescription className="mt-1">
                  <Badge variant="secondary" className="text-blue-600 bg-blue-50 font-medium">
                    Élève
                  </Badge>
                  <span className="text-gray-500 text-sm ml-2">Matricule: {studentId}</span>
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
                <InfoItem label="Prénom" value={studentData.user.firstName} icon={User} />
                <InfoItem label="Nom" value={studentData.user.lastName} icon={User} />
                <InfoItem
                  label="E-mail"
                  value={studentData.user.email}
                  icon={Mail}
                />
                <InfoItem
                  label="Compte créé le"
                  value={new Date(studentData.user.createdAt).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  icon={Calendar}
                />
              </div>
            </CardContent>

            {/* Informations scolaires */}
            <CardContent className="p-6 border-t">
              <div className="flex items-center gap-3 mb-6">
                <GraduationCap className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold text-gray-700">Informations Scolaires</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SchoolInfoItem label="Filière" value={filiere} icon={GraduationCap} />
                <SchoolInfoItem label="Matricule" value={studentId} icon={Hash} />
                <SchoolInfoItem label="Année Scolaire" value={enrollmentYear} icon={Calendar} />
                {studentData.student.vague && (
                  <SchoolInfoItem 
                    label="Vague" 
                    value={studentData.student.vague.nom} 
                    icon={User} 
                  />
                )}
              </div>
            </CardContent>

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

          {/* Section sécurité */}
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

          {/* Activité récente */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-600" />
                <CardTitle className="text-xl font-bold text-gray-700">Activité Récente</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studentData.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {renderActivityIcon(activity.icon)}
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
                ))}
                {studentData.activities.length === 0 && (
                  <p className="text-center text-gray-500 py-4">Aucune activité récente</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section matières selon la filière */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <CardTitle className="text-xl font-bold text-gray-700">Matières - {filiere}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {studentData.subjects.map((matiere) => (
                  <div 
                    key={matiere.id}
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <BookOpen className={`w-5 h-5 ${matiere.couleur}`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{matiere.nom}</p>
                      <p className="text-sm text-gray-600">{matiere.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          Coef: {matiere.coefficient}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {matiere.typeModule}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                {studentData.subjects.length === 0 && (
                  <p className="text-center text-gray-500 py-4 col-span-2">
                    Aucune matière trouvée pour cette filière
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section notes récentes */}
          {studentData.grades.length > 0 && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  <CardTitle className="text-xl font-bold text-gray-700">Notes Récentes</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {studentData.grades.slice(0, 5).map((grade) => (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{grade.module.nom}</p>
                        <p className="text-sm text-gray-600">
                          {grade.teacher && `Prof: ${grade.teacher.firstName} ${grade.teacher.lastName}`}
                        </p>
                      </div>
                      <div className="text-right">
                        {grade.composition && (
                          <p className="font-semibold text-blue-600">
                            Composition: {grade.composition}/20
                          </p>
                        )}
                        {grade.rang && (
                          <p className="text-sm text-gray-500">Rang: {grade.rang}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modale de déconnexion */}
      {isLogoutModalOpen && (
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
      )}
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

// Composant SchoolInfoItem pour les informations scolaires
const SchoolInfoItem = ({ icon: Icon, label, value }: InfoProps) => (
  <div className="flex items-center p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
    <Icon className="w-5 h-5 text-green-600 mr-4" />
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
      <p className="text-gray-800 font-semibold mt-1">{value}</p>
    </div>
  </div>
);

export default StudentProfilePage;