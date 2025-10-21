"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function RegisterPage() {
  const [role, setRole] = useState("");

  // Retourne les champs spécifiques selon le rôle
  const renderRoleFields = () => {
    switch (role) {
      case "Administrateur":
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="adminNumber" className="block mb-2 font-title font-medium text-dark">
                Numéro d'administrateur
              </label>
              <input
                id="adminNumber"
                name="adminNumber"
                type="text"
                placeholder="Ex: ADM-2024-001"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
              />
            </div>
          </div>
        );

      case "Enseignant":
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="teacherNumber" className="block mb-2 font-title font-medium text-dark">
                Numéro d'enseignant
              </label>
              <input
                id="teacherNumber"
                name="teacherNumber"
                type="text"
                placeholder="Ex: ENS-2024-001"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
              />
            </div>

            <div>
              <label htmlFor="filiere" className="block mb-2 font-title font-medium text-dark">
                Classe/Filière
              </label>
              <input
                id="filiere"
                name="filiere"
                type="text"
                placeholder="Ex: Mathématiques"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
              />
            </div>

            <div>
              <label htmlFor="matiere" className="block mb-2 font-title font-medium text-dark">
                Matière enseignée
              </label>
              <input
                id="matiere"
                name="matiere"
                type="text"
                placeholder="Ex: Algebra"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
              />
            </div>
          </div>
        );

      case "Etudiant":
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="studentNumber" className="block mb-2 font-title font-medium text-dark">
                Numéro d'étudiant
              </label>
              <input
                id="studentNumber"
                name="studentNumber"
                type="text"
                placeholder="Ex: ETU-2024-001"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
              />
            </div>

            <div>
              <label htmlFor="studentId" className="block mb-2 font-title font-medium text-dark">
                Identifiant étudiant
              </label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                placeholder="Ex: 20240001"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
              />
            </div>

            <div>
              <label htmlFor="filiere" className="block mb-2 font-title font-medium text-dark">
                Classe/Filière
              </label>
              <input
                id="filiere"
                name="filiere"
                type="text"
                placeholder="Ex: Informatique"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
              />
            </div>

            <div>
              <label htmlFor="niveau" className="block mb-2 font-title font-medium text-dark">
                Niveau d'étude
              </label>
              <select
                id="niveau"
                name="niveau"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
              >
                <option value="">-- Sélectionnez le niveau --</option>
                <option value="Licence 1">Licence 1</option>
                <option value="Licence 2">Licence 2</option>
                <option value="Licence 3">Licence 3</option>
                <option value="Master 1">Master 1</option>
                <option value="Master 2">Master 2</option>
                <option value="Doctorat">Doctorat</option>
              </select>
            </div>
          </div>
        );

      case "Parent":
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="parentNumber" className="block mb-2 font-title font-medium text-dark">
                Numéro de parent
              </label>
              <input
                id="parentNumber"
                name="parentNumber"
                type="text"
                placeholder="Ex: PAR-2024-001"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
              />
            </div>

            <div>
              <label htmlFor="childName" className="block mb-2 font-title font-medium text-dark">
                Nom de l'enfant
              </label>
              <input
                id="childName"
                name="childName"
                type="text"
                placeholder="Ex: Kossi Aimé"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
              />
            </div>

            <div>
              <label htmlFor="childStudentNumber" className="block mb-2 font-title font-medium text-dark">
                Numéro d'étudiant de l'enfant
              </label>
              <input
                id="childStudentNumber"
                name="childStudentNumber"
                type="text"
                placeholder="Ex: ETU-2024-001"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
              />
            </div>

            <div>
              <label htmlFor="childClass" className="block mb-2 font-title font-medium text-dark">
                Classe / Filière de l'enfant
              </label>
              <input
                id="childClass"
                name="childClass"
                type="text"
                placeholder="Ex: Licence 1"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
              />
            </div>

            <div>
              <label htmlFor="relation" className="block mb-2 font-title font-medium text-dark">
                Lien de parenté
              </label>
              <select
                id="relation"
                name="relation"
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
              >
                <option value="">-- Sélectionnez le lien --</option>
                <option value="Père">Père</option>
                <option value="Mère">Mère</option>
                <option value="Tuteur">Tuteur</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-5xl h-auto min-h-[800px] md:h-[calc(100vh-32px)] rounded-lg shadow-xl overflow-hidden flex flex-col md:flex-row">

        {/* Colonne gauche */}
        <div className="bg-principal relative w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-10 text-white text-center">
          <div className="mb-8">
            <Link href="/" className="no-underline flex items-center space-x-2 hover:underline">
              <svg className="h-8 w-8 text-tertiary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5v-2l-10 5-10-5v2z" />
              </svg>
              <span className="text-xl font-title font-bold text-tertiary">SchoolFlow</span>
            </Link>
          </div>
          <h1 className="text-3xl font-title sm:text-4xl md:text-5xl font-bold">Bienvenue</h1>
          <p className="mt-4 text-lg opacity-90 max-w-md">
            Rejoignez SchoolFlow et simplifiez la gestion de votre établissement
          </p>
        </div>

        {/* Colonne droite */}
        <div className="relative flex-1 bg-white border-l border-gray-200 flex flex-col items-center justify-center p-4 md:p-8">
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200 mb-16">
            <h2 className="text-2xl font-title font-bold text-center text-dark mb-6">
              Créer un compte
            </h2>

            {/* Sélecteur de rôle */}
            <div className="mb-6">
              <label htmlFor="role" className="block mb-2 font-title font-medium text-dark">
                Sélectionnez votre rôle *
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                required
              >
                <option value="">-- Choisir un rôle --</option>
                <option value="Administrateur">Administrateur</option>
                <option value="Enseignant">Enseignant</option>
                <option value="Etudiant">Étudiant</option>
                <option value="Parent">Parent</option>
              </select>
            </div>

            {/* Champs communs */}
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="name" className="block mb-2 font-title font-medium text-dark">
                  Nom complet *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Entrer votre nom complet"
                  className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block mb-2 font-title font-medium text-dark">
                  Adresse e-mail *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="exemple@gmail.com"
                  className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                  required
                />
              </div>
            </div>

            {/* Champs spécifiques selon rôle */}
            {role && (
              <div className="mb-6">
                {renderRoleFields()}
              </div>
            )}

            {/* Mots de passe */}
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block mb-2 font-title font-medium text-dark">
                  Mot de passe *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Entrer votre mot de passe"
                  className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block mb-2 font-title font-medium text-dark">
                  Confirmez votre mot de passe *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirmer votre mot de passe"
                  className="w-full p-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-bluvy"
                  required
                />
              </div>
            </div>

            {/* Bouton inscription */}
            <button 
              type="submit"
              className="mt-4 mb-4 w-full bg-lien font-link text-white p-2 rounded-md font-semibold hover:bg-principal transition-colors duration-200 mb-4"
            >
              S'inscrire
            </button>

            {/* Lien vers la connexion */}
            <p className="text-center text-dark text-sm">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/auth/login"
                className="text-lien font-link no-underline hover:underline font-medium"
              >
                Se connecter
              </Link>
            </p>
          </div>

          {/* Texte bas - Maintenant bien visible */}
          <div className="absolute bottom-4 left-0 right-0 text-gray-600 text-center text-xs sm:text-sm">
            <div className="pt-4 border-t border-gray-200 text-center">
              <p className="text-gray-600 text-sm">
                Gestionnaire d'école{" "}
                <span className="font-bold font-title text-dark">SchoolFlow</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}