"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Stethoscope } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Failed to fetch") || error.message.toLowerCase().includes("fetch")) {
          setError("Impossible de joindre Supabase (Failed to fetch). Vérifiez que votre projet Supabase n'est pas en pause (Paused) ou que les clés dans .env sont correctes.");
        } else if (error.message.toLowerCase().includes("invalid login credentials")) {
          setError("Email ou mot de passe incorrect.");
        } else {
          setError(`Erreur de connexion : ${error.message}`);
        }
      } else if (data.user) {
        const authUser = data.user;
        const emailValue = authUser.email ?? email;
        const emailPrefix = emailValue.split("@")[0] ?? "Utilisateur";
        const fallbackFirstName =
          typeof authUser.user_metadata?.firstName === "string"
            ? authUser.user_metadata.firstName
            : emailPrefix;
        const fallbackLastName =
          typeof authUser.user_metadata?.lastName === "string"
            ? authUser.user_metadata.lastName
            : "";
        const metadataRoleValue =
          authUser.app_metadata?.role ?? authUser.user_metadata?.role;
        const normalizedRole =
          typeof metadataRoleValue === "string"
            ? metadataRoleValue.toUpperCase()
            : "";
        const isAdminEmail = emailValue.toLowerCase() === "admin@energika.ma";
        const fallbackRole =
          normalizedRole === "ADMIN" || isAdminEmail ? "ADMIN" : "ORTHO";

        let userToStore = {
          id: authUser.id,
          email: emailValue,
          firstName: fallbackFirstName,
          lastName: fallbackLastName,
          role: fallbackRole,
        };

        try {
          const response = await fetch(
            `/api/auth/profile/${authUser.id}?email=${encodeURIComponent(emailValue)}`
          );
          if (response.ok) {
            const profile = await response.json();
            userToStore = {
              id: profile.id ?? authUser.id,
              email: profile.email ?? emailValue,
              firstName: profile.firstName ?? fallbackFirstName,
              lastName: profile.lastName ?? fallbackLastName,
              role: profile.role === "ADMIN" ? "ADMIN" : "ORTHO",
            };
          }
        } catch {
          // Ignore profile fetch errors and use fallback data
        }

        localStorage.setItem("energika_user", JSON.stringify(userToStore));
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e6bb8 100%)",
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-20 -left-20 w-96 h-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }}
          />
          <div
            className="absolute bottom-20 right-10 w-72 h-72 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }}
          />
          <div
            className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full opacity-5"
            style={{ background: "radial-gradient(circle, #ffffff, transparent)" }}
          />
        </div>

        <div className="relative z-10 text-center px-12 fade-in">
          <div className="mb-8 flex justify-center">
            <div className="w-32 h-32 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center p-4 border border-white/20">
              <Image
                src="/logo.png"
                alt="Energika Logo"
                width={100}
                height={100}
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Energika
          </h1>
          <p className="text-lg text-blue-200 mb-2">
            Centre d&apos;Orthophonie
          </p>
          <p className="text-sm text-blue-300/70 max-w-sm mx-auto leading-relaxed">
            Coaching et Réussite Scolaire — Gestion intelligente de votre centre
          </p>

          <div className="mt-12 flex items-center justify-center gap-8 text-blue-200/60">
            <div className="text-center">
              <div className="text-2xl font-bold text-white count-up">500+</div>
              <div className="text-xs">Patients suivis</div>
            </div>
            <div className="w-px h-10 bg-blue-400/30" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white count-up">5</div>
              <div className="text-xs">Orthophonistes</div>
            </div>
            <div className="w-px h-10 bg-blue-400/30" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white count-up">98%</div>
              <div className="text-xs">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--color-bg-primary)]">
        <div className="w-full max-w-md fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] mb-4">
              <Stethoscope className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Energika</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Bienvenue 👋
            </h2>
            <p className="text-[var(--color-text-muted)] mt-1">
              Connectez-vous à votre espace de gestion
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 fade-in">
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5"
              >
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@energika.ma"
                required
                className="w-full px-4 py-3 rounded-lg border border-[var(--color-border-default)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5"
              >
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-border-default)] bg-white text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn size={18} />
                  Se connecter
                </div>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
