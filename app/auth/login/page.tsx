"use client";
import Image from "next/image";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="relative w-full max-w-5xl h-auto min-h-[600px] md:h-[calc(100vh-64px)] rounded-lg shadow-xl overflow-hidden flex flex-col md:flex-row">

        <div className="relative w-full md:w-1/2 bg-principal text-white flex flex-col items-center justify-center p-8 md:p-10 text-center">
          {/* Logo */}
          <div className="mb-8">
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
        
        {/* --- Formulaire --- */}
        <div className="relative flex-1 bg-white flex flex-col items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-sm">
            {/* En-tête du formulaire */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-title font-bold text-dark mb-2">
                Connexion
              </h2>
              <p className="text-gray-600">
                Accédez à votre compte
              </p>
            </div>

            {/* Formulaire */}
            <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md border border-gray-200">
              {/* Champ Email/Identifiant */}
              <div className="mb-4">
                <label htmlFor="email" className="block mb-2 font-medium text-dark">
                  Email ou Identifiant
                </label>
                <input
                  id="email"
                  name="email"
                  type="text"
                  placeholder="Entrez votre email ou identifiant"
                  className="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 
                  focus:outline-none focus:ring-2 focus:ring-bluvy focus:border-transparent transition-colors"
                />
              </div>

              {/* Champ Mot de passe */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="password" className="font-medium text-dark">
                    Mot de passe
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-lien text-sm hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Entrez votre mot de passe"
                  className="w-full p-2 bg-gray-50 rounded-lg border border-gray-300 
                  focus:outline-none focus:ring-2 focus:ring-bluvy focus:border-transparent transition-colors"
                />
              </div>

              {/* Bouton de connexion */}
              <button className="w-full bg-lien text-white p-2 rounded-lg font-semibold hover:bg-principal transition-colors">
                Se connecter
              </button>

              {/* Séparateur */}
              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-3 text-gray-500 text-sm">Ou</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Bouton Google */}
              <button
                className="mb-4 w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg p-2 hover:bg-gray-50 transition-colors"
              >
                <FcGoogle className="text-xl" />
                <span className="font-medium text-gray-700">Continuer avec Google</span>
              </button>

              {/* Lien vers l'inscription */}
              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  Vous n'avez pas de compte ?{" "}
                  <Link
                    href="/auth/register"
                    className="text-lien font-medium hover:underline"
                  >
                    S'inscrire
                  </Link>
                </p>
              </div>
            </div>

            {/* Texte bas */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
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