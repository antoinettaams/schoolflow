"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function RegisterPage() {
  const [role, setRole] = useState("");

  // Retourne les champs spécifiques selon le rôle
  const renderRoleFields = () => {
    switch (role) {
      case "Enseignant":
        return (
          <>
            <label htmlFor="filiere" className="block mb-1 font-title font-medium text-dark">
              Classe/Filière
            </label>
            <input
              id="filiere"
              name="filiere"
              type="text"
              placeholder="Ex: Mathématiques"
              className="w-full p-2 mb-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bluvy"
            />

            <label htmlFor="matiere" className="block mb-1 font-title font-medium text-dark">
              Matière enseignée
            </label>
            <input
              id="matiere"
              name="matiere"
              type="text"
              placeholder="Ex: Algebra"
              className="w-full p-2 mb-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bluvy"
            />
          </>
        );

      case "Etudiant":
        return (
          <>
            <label htmlFor="filiere" className="block mb-1 font-title font-medium text-dark">
              Classe/Filière
            </label>
            <input
              id="filiere"
              name="filiere"
              type="text"
              placeholder="Ex: Informatique"
              className="w-full p-2 mb-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bluvy"
            />
          </>
        );

      case "Parent":
        return (
          <>
            <label htmlFor="childName" className="block mb-1 font-title font-medium text-dark">
              Nom de l’enfant
            </label>
            <input
              id="childName"
              name="childName"
              type="text"
              placeholder="Ex: Kossi Aimé"
              className="w-full p-2 mb-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bluvy"
            />

            <label htmlFor="childClass" className="block mb-1 font-title font-medium text-dark">
              Classe / Filière de l’enfant
            </label>
            <input
              id="childClass"
              name="childClass"
              type="text"
              placeholder="Ex: Licence 1"
              className="w-full p-2 mb-4 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bluvy"
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-5xl h-auto min-h-[700px] md:h-[calc(100vh-64px)] rounded-lg shadow-xl overflow-hidden flex flex-col md:flex-row">

        {/* Colonne gauche */}
        <div className="bg-principal relative w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-10 text-white text-center">
          <div className="hidden md:block mb-8">
            <Link href="/" className="no-underline flex items-center space-x-2 hover:underline">
              <svg className="h-8 w-8 text-tertiary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5v-2l-10 5-10-5v2z" />
              </svg>
              <span className="text-xl font-title font-bold text-tertiary">SchoolFlow</span>
            </Link>
          </div>
          <h1 className="text-3xl font-title sm:text-4xl md:text-5xl font-bold">Bienvenue</h1>
        </div>

        {/* Colonne droite */}
        <div className="relative flex-1 bg-white border-l border-gray-200 flex flex-col items-center justify-center p-8 md:p-12">
          <div className="bg-white p-6 sm:p-8 md:p-10 rounded-lg shadow-md w-full max-w-sm border border-gray-200">
            {/* Sélecteur de rôle */}
            <label htmlFor="role" className="block mb-2 font-title font-medium text-dark">
              Sélectionnez votre rôle
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 mb-4 bg-gray-100 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bluvy"
            >
              <option value="">-- Choisir un rôle --</option>
              <option value="Administrateur">Administrateur</option>
              <option value="Enseignant">Enseignant</option>
              <option value="Etudiant">Étudiant</option>
              <option value="Parent">Parent</option>
            </select>

            {/* Champs communs */}
            <label htmlFor="name" className="block mb-1 font-title font-medium text-dark">
              Nom complet
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Entrer votre nom"
              className="w-full p-2 mb-4 bg-gray-100 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bluvy"
            />

            <label htmlFor="email" className="block mb-1 font-title font-medium text-dark">
              Adresse e-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="exemple@gmail.com"
              className="w-full p-2 mb-4 bg-gray-100 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bluvy"
            />

            {/* Champs spécifiques selon rôle */}
            {renderRoleFields()}

            {/* Mots de passe */}
            <label htmlFor="password" className="block mb-1 font-title font-medium text-dark">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Entrer votre mot de passe"
              className="w-full p-2 mb-4 bg-gray-100 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bluvy"
            />

            <label htmlFor="confirmPassword" className="block mb-1 font-title font-medium text-dark">
              Confirmez votre mot de passe
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirmer votre mot de passe"
              className="w-full p-2 mb-6 bg-gray-100 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-bluvy"
            />

            {/* Bouton inscription */}
            <button className="mt-4 w-full bg-lien font-link text-white p-2 rounded-md font-semibold hover:bg-principal mb-4">
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

          {/* Texte bas */}
          <div className="absolute bottom-1 text-gray-600 text-center text-xs sm:text-sm w-full">
            Gestionnaire d'école <br />
            <span className="font-bold font-title">SchoolFlow</span>
          </div>
        </div>
      </div>
    </div>
  );
}
