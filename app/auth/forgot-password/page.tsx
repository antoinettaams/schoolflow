"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isLoaded, signIn } = useSignIn();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<"request" | "reset">("request");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
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
    } catch (err: any) {
      console.error(err);
      setError("Erreur : vérifiez l’adresse e-mail.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;
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
    } catch (err: any) {
      console.error(err);
      setError("Erreur lors de la réinitialisation du mot de passe.");
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
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
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
                onChange={(e) => setCode(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
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
