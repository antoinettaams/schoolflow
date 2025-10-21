"use client";
import React, { useState } from "react";
import {
  User,
  Mail,
  Edit2,
  Camera,
  Trash2,
  LogOut,
  BookOpen,
  GraduationCap,
  Hash,
  Calendar,
} from "lucide-react";

// Données fictives de l'étudiant
const initialProfileData = {
  firstName: "Antoinetta",
  lastName: "Dupont",
  email: "antoinettadupont@gmail.com",
  profileImageUrl: "https://placehold.co/150x150/3b82f6/ffffff?text=AD",
  role: "Élève",
  class: "Terminale S2",
  studentId: "STU2024001",
  birthDate: "15 Mars 2006",
  enrollmentYear: "2025",
};

const StudentProfilePage = () => {
  const [profileData, setProfileData] = useState(initialProfileData);
  const [showImageOptions, setShowImageOptions] = useState(false);

  // Gérer le téléchargement d'image
  const handleImageUpload = () => {
    setShowImageOptions(false);
    alert("Ouvrir le sélecteur de fichiers pour télécharger une nouvelle photo");
    // Simulation du changement de photo
    const newUrl = "https://placehold.co/150x150/10b981/ffffff?text=Nouveau+AM";
    setProfileData((prev) => ({ ...prev, profileImageUrl: newUrl }));
  };

  // Voir la photo en grand
  const handleViewImage = () => {
    setShowImageOptions(false);
    window.open(profileData.profileImageUrl, '_blank');
  };

  // Supprimer la photo
  const handleImageDelete = () => {
    setShowImageOptions(false);
    if (window.confirm("Êtes-vous sûr de vouloir supprimer votre photo de profil ?")) {
      setProfileData((prev) => ({
        ...prev,
        profileImageUrl: "https://placehold.co/150x150/3b82f6/ffffff?text=AM",
      }));
    }
  };

  // Gérer la déconnexion
  const handleLogout = () => {
    alert("Déconnexion simulée. Redirection vers la page de connexion...");
  };

  // Champ d'information non éditable
  const InfoField = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: string;
  }) => (
    <div className="flex items-center p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors lg:pl-5 pt-20 lg:pt-6">
      <Icon className="w-5 h-5 text-blue-600 mr-4 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-gray-800 font-semibold mt-1">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Contenu avec barre de défilement native */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          
          {/* Carte de Profil Principale */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Bannière + Avatar */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-40 w-full relative">
              <div className="absolute left-8 bottom-0 transform translate-y-1/2">
                <div className="relative">
                  <img
                    src={profileData.profileImageUrl}
                    alt="Photo de profil"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-2xl cursor-pointer"
                    onClick={() => setShowImageOptions(true)}
                  />
                  <button
                    onClick={() => setShowImageOptions(true)}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full border-2 border-white shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110"
                    title="Modifier la photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Menu déroulant pour les options de photo */}
            {showImageOptions && (
              <div className="absolute left-8 top-48 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-10 overflow-hidden">
                <button
                  onClick={handleImageUpload}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100"
                >
                  <Camera className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-800">Ajouter une photo</p>
                    <p className="text-sm text-gray-500">Télécharger une nouvelle photo</p>
                  </div>
                </button>
                <button
                  onClick={handleViewImage}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100"
                >
                  <Edit2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-800">Voir la photo</p>
                    <p className="text-sm text-gray-500">Afficher en taille réelle</p>
                  </div>
                </button>
                <button
                  onClick={handleImageDelete}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-semibold text-gray-800">Supprimer la photo</p>
                    <p className="text-sm text-gray-500">Retirer la photo de profil</p>
                  </div>
                </button>
              </div>
            )}

            {/* Overlay pour fermer le menu */}
            {showImageOptions && (
              <div 
                className="fixed inset-0 z-0" 
                onClick={() => setShowImageOptions(false)}
              />
            )}

            {/* Nom et Rôle */}
            <div className="pt-16 pb-6 px-8 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
                    {profileData.firstName} {profileData.lastName}
                  </h2>
                  <p className="text-blue-600 font-medium">{profileData.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Matricule</p>
                  <p className="text-lg font-bold text-gray-800">{profileData.studentId}</p>
                </div>
              </div>
            </div>

            {/* Informations Personnelles */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-3">
                <User className="w-6 h-6 text-blue-600" />
                Informations Personnelles
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <InfoField
                  icon={User}
                  label="Prénom"
                  value={profileData.firstName}
                />
                <InfoField
                  icon={User}
                  label="Nom de Famille"
                  value={profileData.lastName}
                />
                <InfoField
                  icon={Mail}
                  label="Adresse E-mail"
                  value={profileData.email}
                />
                <InfoField
                  icon={Calendar}
                  label="Date de Naissance"
                  value={profileData.birthDate}
                />
              </div>
            </div>

            {/* Informations Scolaires */}
            <div className="p-6 border-t border-gray-100">
              <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-green-600" />
                Informations Scolaires
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <BookOpen className="w-5 h-5 text-green-600 mr-4 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Classe</p>
                    <p className="text-gray-800 font-semibold">{profileData.class}</p>
                  </div>
                </div>
                <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Hash className="w-5 h-5 text-green-600 mr-4 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Matricule</p>
                    <p className="text-gray-800 font-semibold">{profileData.studentId}</p>
                  </div>
                </div>
                <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Calendar className="w-5 h-5 text-green-600 mr-4 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Année Scolaire</p>
                    <p className="text-gray-800 font-semibold">{profileData.enrollmentYear}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Déconnexion - Bouton avec largeur réduite */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div>
                <button
                  onClick={handleLogout}
                  className="w-64 flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition shadow-lg hover:shadow-xl duration-200"
                >
                  <LogOut className="w-6 h-6" />
                  Se Déconnecter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;