"use client";

import { useState } from "react";
import Image from "next/image";
import logoImg from "../../public/logo.png";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, Stethoscope, Lock, Mail, ShieldCheck, Calendar, Sparkles } from "lucide-react";
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
    <div className="min-h-screen flex bg-slate-900">
      {/* Left Panel - Luxury Branding Showcase */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12"
        style={{
          background: "linear-gradient(135deg, #080c14 0%, #0d1e3d 50%, #1e40af 100%)",
        }}
      >
        {/* Ambient Glowing Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #38bdf8, transparent)" }}
          />
          <div
            className="absolute bottom-10 right-10 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #2563eb, transparent)" }}
          />
          <div
            className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full opacity-10 blur-2xl"
            style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }}
          />
        </div>

        <div className="relative z-10 max-w-md w-full text-center fade-in">
          {/* Glowing Brand Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition-opacity" />
              <div className="relative w-28 h-28 rounded-3xl bg-white/95 backdrop-blur-xl flex items-center justify-center p-3 border border-white/40 shadow-2xl overflow-hidden">
                <Image
                  src={logoImg}
                  alt="Energika Logo"
                  width={88}
                  height={88}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-blue-200 mb-4 backdrop-blur-md">
            <Sparkles size={12} className="text-cyan-300" />
            Système ERP Médical Avancé
          </div>

          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
            Energika
          </h1>
          <p className="text-lg font-medium text-blue-200 mb-2">
            Centre d&apos;Orthophonie & Suivi
          </p>
          <p className="text-sm text-slate-300/80 leading-relaxed mb-8 max-w-sm mx-auto">
            Plateforme complète pour le suivi des patients, la gestion des séances et le pilotage financier de votre cabinet.
          </p>

          {/* Feature Highlights */}
          <div className="space-y-2.5 text-left bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-3 text-xs text-slate-200 font-medium">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={14} />
              </div>
              <span>Dossiers patients complets & suivi d&apos;assiduité</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200 font-medium">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center flex-shrink-0">
                <Calendar size={14} />
              </div>
              <span>Calendrier dynamique & séances sous-traitées</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200 font-medium">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0">
                <Sparkles size={14} />
              </div>
              <span>Suivi automatique des forfaits et relances WhatsApp</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form with Glassmorphism */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-slate-100/60">
        {/* Soft background orbs for frosted glass depth */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md glass-modal rounded-3xl p-8 sm:p-10 fade-in relative z-10">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mb-4 border border-blue-100">
              <Stethoscope size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Espace de Connexion
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Connectez-vous pour accéder au tableau de bord du cabinet
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50/80 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5 fade-in">
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
              >
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@energika.ma"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
              >
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3.5 text-sm font-bold shadow-lg shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Vérification des accès...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <LogIn size={18} />
                  <span>Accéder à la plateforme</span>
                </div>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
            Cabinet Energika &copy; {new Date().getFullYear()} • Gestion Médicale Sécurisée
          </div>
        </div>
      </div>
    </div>
  );
}
