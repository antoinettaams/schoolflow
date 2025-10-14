"use client";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-5xl h-auto min-h-[600px] md:h-[calc(100vh-64px)] rounded-lg shadow-xl overflow-hidden flex flex-col md:flex-row">

        {/* --- Colonne de gauche (fond bleu) --- */}
        <div className="relative w-full md:w-1/2 bg-principal text-white flex flex-col items-center justify-center p-8 md:p-10 text-center">
          {/* Logo */}
          <div className="hidden md:block mb-8">
            <Link href="/" className="flex items-center space-x-2">
              <svg className="h-8 w-8 text-tertiary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5v-2l-10 5-10-5v2z" />
              </svg>
              <span className="text-xl font-title font-bold text-tertiary">SchoolFlow</span>
            </Link>
          </div>

          {/* Texte */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-title font-bold">
            Bienvenue
          </h1>
        </div>

        {/* --- Colonne de droite (fond blanc) --- */}
        <div className="relative flex-1 bg-white flex flex-col items-center justify-center p-8 md:p-12">

          {/* Formulaire */}
          <div className="bg-white p-6 sm:p-8 md:p-10 rounded-lg shadow-md w-full max-w-sm border border-gray-200">
            
            {/* Champ Nom */}
            <label
              htmlFor="name"
              className="block mb-1 font-title font-medium text-dark"
            >
              Nom
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Entrer votre nom"
              className="w-full p-2 mb-4 bg-gray-100 rounded-md border border-gray-300 
             focus:outline-none focus:ring-2 focus:ring-bluvy transition-colors"
            />

            {/* Champ Mot de passe */}
            <label
              htmlFor="password"
              className="block mb-1 font-title font-medium text-dark"
            >
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Entrer votre mot de passe"
              className="w-full p-2 mb-4 bg-gray-100 rounded-md border border-gray-300 
             focus:outline-none focus:ring-2 focus:ring-bluvy transition-colors"
            />

            <Link
              href="/forgot-password"
              className="text-lien font-link text-sm hover:underline block mb-6"
            >
              Mot de passe oublié ?
            </Link>

            <button className="w-full bg-lien font-link text-white p-2 rounded-md font-semibold hover:bg-principal transition-colors mb-3">
              Se connecter
            </button>

            {/* Lien vers l'inscription */}
            <p className="text-center text-dark text-sm">
              Vous n'avez pas de compte ?{" "}
              <Link
                href="/auth/register"
                className="text-lien font-link hover:underline font-medium"
              >
                S'inscrire
              </Link>
            </p>
          </div>

          {/* Texte bas */}
          <div className="absolute bottom-6 text-gray-600 text-center text-xs sm:text-sm w-full">
            Gestionnaire d'école <br />
            <span className="font-bold font-title">SchoolFlow</span>
          </div>
        </div>
      </div>
    </div>
  );
}
