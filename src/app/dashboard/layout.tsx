"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logoImg from "../../../public/logo.png";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Receipt,
  Wallet,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Settings,
  Stethoscope,
  Contact,
  UserMinus,
  Handshake,
  ShieldCheck,
  Sparkles,
  Banknote,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "ORTHO";
};

type NavGroup = {
  title: string;
  links: {
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[];
};

const adminNavGroups: NavGroup[] = [
  {
    title: "Vue d'ensemble",
    links: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/dashboard/caisse", label: "Caisse du jour", icon: Banknote },
      { href: "/dashboard/calendrier", label: "Calendrier", icon: Calendar },
    ],
  },
  {
    title: "Patients & Fiches",
    links: [
      { href: "/dashboard/patients", label: "Patients actifs", icon: Users },
      { href: "/dashboard/patients-quittes", label: "Patients quittés", icon: UserMinus },
      { href: "/dashboard/repertoire", label: "Répertoire", icon: Contact },
    ],
  },
  {
    title: "Gestion Financière",
    links: [
      { href: "/dashboard/caisse", label: "Caisse du jour", icon: Banknote },
      { href: "/dashboard/paiements", label: "Paiements & Forfaits", icon: Wallet },
      { href: "/dashboard/depenses", label: "Dépenses", icon: Receipt },
      { href: "/dashboard/sous-traitance", label: "Sous-traitance", icon: Handshake },
      { href: "/dashboard/relances", label: "Relances WhatsApp", icon: Bell },
    ],
  },
  {
    title: "Système",
    links: [
      { href: "/dashboard/parametres", label: "Paramètres", icon: Settings },
    ],
  },
];

const orthoNavGroups: NavGroup[] = [
  {
    title: "Vue d'ensemble",
    links: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/dashboard/caisse", label: "Caisse du jour", icon: Banknote },
      { href: "/dashboard/calendrier", label: "Mon Calendrier", icon: Calendar },
    ],
  },
  {
    title: "Patients",
    links: [
      { href: "/dashboard/patients", label: "Patients actifs", icon: Users },
      { href: "/dashboard/patients-quittes", label: "Patients quittés", icon: UserMinus },
      { href: "/dashboard/repertoire", label: "Répertoire", icon: Contact },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("energika_user");
    if (!stored) {
      router.push("/");
      return;
    }

    const parsedUser = JSON.parse(stored) as User;
    const isAdminEmail =
      typeof parsedUser.email === "string" &&
      parsedUser.email.toLowerCase() === "admin@energika.ma";

    const normalizedRole =
      parsedUser.role === "ADMIN" ||
      String(parsedUser.role).toUpperCase() === "ADMIN" ||
      isAdminEmail
        ? "ADMIN"
        : "ORTHO";

    const normalizedUser: User = {
      ...parsedUser,
      role: normalizedRole,
    };

    setUser(normalizedUser);

    const syncProfileRole = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) return;

        const emailParam = authUser.email
          ? `?email=${encodeURIComponent(authUser.email)}`
          : "";
        const response = await fetch(
          `/api/auth/profile/${authUser.id}${emailParam}`
        );
        if (!response.ok) return;

        const profile = await response.json();
        const isSyncedAdminEmail =
          typeof (profile.email ?? normalizedUser.email) === "string" &&
          String(profile.email ?? normalizedUser.email).toLowerCase() ===
            "admin@energika.ma";
        const syncedUser: User = {
          id: profile.id ?? normalizedUser.id,
          email: profile.email ?? normalizedUser.email,
          firstName: profile.firstName ?? normalizedUser.firstName,
          lastName: profile.lastName ?? normalizedUser.lastName,
          role:
            profile.role === "ADMIN" || isSyncedAdminEmail ? "ADMIN" : "ORTHO",
        };

        setUser(syncedUser);
        localStorage.setItem("energika_user", JSON.stringify(syncedUser));
      } catch {
        // Keep local data on sync fail
      }
    };

    void syncProfileRole();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("energika_user");
    router.push("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-400">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  const navGroups = user.role === "ADMIN" ? adminNavGroups : orthoNavGroups;

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-primary)]">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar fixed lg:static inset-y-0 left-0 z-50 w-68 flex flex-col transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.08] bg-white/[0.01]">
          <div className="relative group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center overflow-hidden p-0.5">
                <Image
                  src={logoImg}
                  alt="Energika"
                  width={34}
                  height={34}
                  className="object-contain transition-transform group-hover:scale-105"
                />
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-white tracking-tight">Energika</h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">
              Cabinet d&apos;Orthophonie
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Categorized Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1.5">
                {group.title}
              </p>
              {group.links.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/dashboard" && pathname.startsWith(link.href));
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`sidebar-link ${isActive ? "active" : ""}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon
                      size={18}
                      className={isActive ? "text-cyan-400" : "text-slate-400"}
                    />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Card Capsule */}
        <div className="p-3 border-t border-white/[0.08] bg-white/[0.01]">
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] transition-all"
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/25">
                  {user.firstName[0]?.toUpperCase()}
                  {user.lastName[0]?.toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#090d16]" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  {user.role === "ADMIN" ? (
                    <span className="flex items-center gap-1 text-blue-300">
                      <ShieldCheck size={11} /> Admin
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-cyan-300">
                      <Stethoscope size={11} /> Ortho
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#0f172a] rounded-xl border border-white/10 p-1.5 shadow-2xl slide-in z-50">
                <div className="px-3 py-2 border-b border-white/5 mb-1">
                  <p className="text-xs font-semibold text-white truncate">{user.email}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                    {user.role === "ADMIN" ? "Rôle Administrateur" : "Rôle Orthophoniste"}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                >
                  <LogOut size={14} />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Bar Header */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 lg:px-8 glass-header">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Menu size={22} />
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-xs font-semibold text-slate-700 shadow-2xs">
              <Calendar size={13} className="text-blue-600" />
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>

            <Link
              href="/dashboard/caisse"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-xs font-bold transition-all shadow-2xs"
              title="Accéder à la Caisse du jour"
            >
              <Banknote size={14} className="text-emerald-600" />
              <span>Caisse</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user.role === "ADMIN" && (
              <Link
                href="/dashboard/relances"
                className="relative p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                title="Relances et rappels"
              >
                <Bell size={19} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full pulse-dot" />
              </Link>
            )}

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2.5 pl-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                {user.firstName[0]?.toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                  <Sparkles size={9} className="text-amber-500" />
                  {user.role === "ADMIN" ? "Administrateur" : "Orthophoniste"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Canvas */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
