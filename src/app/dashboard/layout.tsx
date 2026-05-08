"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "ORTHO";
};

const adminLinks = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/patients", label: "Patients", icon: Users },
  { href: "/dashboard/patients-quittes", label: "Patients quittés", icon: UserMinus },
  { href: "/dashboard/calendrier", label: "Calendrier", icon: Calendar },
  { href: "/dashboard/paiements", label: "Paiements", icon: Wallet },
  { href: "/dashboard/depenses", label: "Dépenses", icon: Receipt },
  { href: "/dashboard/sous-traitance", label: "Sous-traitance", icon: Handshake },
  { href: "/dashboard/relances", label: "Relances", icon: Bell },
  { href: "/dashboard/repertoire", label: "Répertoire", icon: Contact },
  { href: "/dashboard/parametres", label: "Paramètres", icon: Settings },
];

const orthoLinks = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/patients", label: "Patients", icon: Users },
  { href: "/dashboard/patients-quittes", label: "Patients quittés", icon: UserMinus },
  { href: "/dashboard/calendrier", label: "Mon Calendrier", icon: Calendar },
  { href: "/dashboard/repertoire", label: "Répertoire", icon: Contact },
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
        // Ignore profile sync errors and keep local data
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
        <div className="w-8 h-8 border-3 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  const links = user.role === "ADMIN" ? adminLinks : orthoLinks;

  return (
    <div className="min-h-screen flex bg-[var(--color-bg-primary)]">
      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
            <Image
              src="/logo.png"
              alt="Energika"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Energika</h2>
            <p className="text-xs text-blue-300/60">Centre d&apos;Orthophonie</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <link.icon size={20} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white text-sm font-bold">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-blue-300/60 flex items-center gap-1">
                  <Stethoscope size={10} />
                  {user.role === "ADMIN" ? "Administrateur" : "Orthophoniste"}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`text-white/40 transition-transform ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1e293b] rounded-lg border border-white/10 p-1 slide-in">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={16} />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-[var(--color-border-default)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <Menu size={24} />
          </button>

          <div className="hidden lg:block">
            <p className="text-sm text-[var(--color-text-muted)]">
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {user.role === "ADMIN" && (
              <Link
                href="/dashboard/relances"
                className="relative p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[var(--color-danger)] rounded-full pulse-dot" />
              </Link>
            )}
            <div className="flex items-center gap-2 pl-4 border-l border-[var(--color-border-default)]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white text-xs font-bold">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <span className="hidden sm:block text-sm font-medium text-[var(--color-text-primary)]">
                {user.firstName}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
