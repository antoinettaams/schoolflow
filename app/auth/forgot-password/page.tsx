"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

// Définition du type pour les erreurs Clerk
interface ClerkError {
  errors: Array<{
    code: string;
    message: string;
    longMessage?: string;
  }>;
}

// Type guard pour vérifier si une erreur est de type ClerkError
function isClerkError(error: unknown): error is ClerkError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errors' in error &&
    Array.isArray((error as ClerkError).errors)
  );
}

// Fonction utilitaire pour extraire le message d'erreur
function getErrorMessage(error: unknown): string {
  if (isClerkError(error)) {
    return error.errors[0]?.message || "Une erreur est survenue";
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "Une erreur inconnue est survenue";
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isLoaded, signIn } = useSignIn();

  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [stage, setStage] = useState<"request" | "reset">("request");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      setMessage("📩 Un code de réinitialisation a été envoyé à votre email.");
      setStage("reset");
    } catch (err) {
      console.error("Erreur lors de l'envoi du code:", err);
      setError(`Erreur : ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (res.status === "complete") {
        setMessage("✅ Mot de passe réinitialisé avec succès !");
        setTimeout(() => router.push("/auth/signin"), 2000);
      } else {
        setError("Erreur : code invalide ou expiré.");
      }
    } catch (err) {
      console.error("Erreur lors de la réinitialisation:", err);
      setError(`Erreur lors de la réinitialisation : ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-center text-dark mb-2">
          Réinitialiser le mot de passe
        </h1>
        <p className="text-center text-gray-500 mb-6">
          {stage === "request"
            ? "Entrez votre adresse e-mail pour recevoir un code de réinitialisation."
            : "Entrez le code reçu et votre nouveau mot de passe."}
        </p>

        {/* Étape 1 — Demande du code */}
        {stage === "request" && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-gray-700 font-medium">
                Adresse e-mail
              </label>
              <input
                type="email"
                id="email"
                className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="exemple@email.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Envoi en cours..." : "Envoyer le code"}
            </button>
          </form>
        )}

        {/* Étape 2 — Réinitialisation */}
        {stage === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-gray-700 font-medium">
                Code de vérification
              </label>
              <input
                type="text"
                id="code"
                className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Entrez le code reçu"
                value={code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-700 font-medium">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                id="password"
                className="w-full border border-gray-300 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Entrez le nouveau mot de passe"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
            </button>
          </form>
        )}

        {/* Messages */}
        {message && (
          <p className="mt-4 text-green-600 text-center text-sm">{message}</p>
        )}
        {error && (
          <p className="mt-4 text-red-500 text-center text-sm">{error}</p>
        )}

        <div className="text-center mt-6">
          <button
            onClick={() => router.push("/auth/signin")}
            className="text-blue-600 hover:underline text-sm"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
}
