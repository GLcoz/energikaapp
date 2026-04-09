"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  User as UserIcon,
  Shield,
  Plus,
  Trash2,
  X,
  Save,
} from "lucide-react";
import type { User } from "@/lib/types";

const demoUsers: User[] = [
  {
    id: "1",
    email: "admin@energika.ma",
    firstName: "Admin",
    lastName: "Energika",
    role: "ADMIN",
    phone: "0661000000",
  },
  {
    id: "2",
    email: "ortho@energika.ma",
    firstName: "Sara",
    lastName: "Benani",
    role: "ORTHO",
    phone: "0662000000",
  },
];

export default function ParametresPage() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(demoUsers);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "ORTHO" as "ADMIN" | "ORTHO",
    phone: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("energika_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const u: User = {
      id: `u${Date.now()}`,
      ...newUser,
    };
    setUsers([...users, u]);
    setShowAddUser(false);
    setNewUser({
      firstName: "",
      lastName: "",
      email: "",
      role: "ORTHO",
      phone: "",
    });
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("Supprimer ce compte ?")) {
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            Paramètres
          </h1>
          <p className="page-subtitle">
            Gestion du centre et des comptes
          </p>
        </div>
      </div>

      {/* Center Info */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
          <Shield size={20} className="text-[var(--color-primary)]" />
          Informations du Centre
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Nom du centre
            </label>
            <input
              type="text"
              defaultValue="Energika - Centre d'Orthophonie"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              defaultValue="0539123456"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Adresse
            </label>
            <input
              type="text"
              defaultValue="Rue de la Liberté, Tanger"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Email
            </label>
            <input
              type="email"
              defaultValue="contact@energika.ma"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          </div>
        </div>
        <button className="btn btn-primary mt-4">
          <Save size={16} />
          Enregistrer
        </button>
      </div>

      {/* Users Management */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <UserIcon size={20} className="text-[var(--color-primary)]" />
            Comptes utilisateurs
          </h2>
          <button
            onClick={() => setShowAddUser(true)}
            className="btn btn-primary text-sm"
          >
            <Plus size={16} />
            Nouveau compte
          </button>
        </div>

        <div className="space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border-light)] hover:border-[var(--color-border-default)] transition-all"
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white font-bold text-sm">
                {u.firstName[0]}
                {u.lastName[0]}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {u.firstName} {u.lastName}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {u.email} • {u.phone || "—"}
                </p>
              </div>
              <span
                className={`badge ${
                  u.role === "ADMIN" ? "badge-info" : "badge-success"
                }`}
              >
                {u.role === "ADMIN" ? "Administrateur" : "Orthophoniste"}
              </span>
              {u.id !== user?.id && (
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RLS Info for Supabase */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
          <Shield size={20} className="text-amber-500" />
          Politiques de Sécurité (RLS)
        </h2>
        <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
          <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
            <p className="font-medium text-[var(--color-text-primary)]">
              Tables financières (expenses, monthly_billings)
            </p>
            <p className="text-xs mt-1">
              Accès restreint aux utilisateurs avec le rôle <code className="bg-blue-50 text-blue-700 px-1 py-0.5 rounded">ADMIN</code> uniquement
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
            <p className="font-medium text-[var(--color-text-primary)]">
              Table patients
            </p>
            <p className="text-xs mt-1">
              Les orthophonistes ne voient que leurs propres patients (filtré par <code className="bg-blue-50 text-blue-700 px-1 py-0.5 rounded">therapist_id</code>)
            </p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
            <p className="font-medium text-[var(--color-text-primary)]">
              Table sessions
            </p>
            <p className="text-xs mt-1">
              Chaque orthophoniste ne voit que ses propres séances
            </p>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                Nouveau Compte
              </h2>
              <button
                onClick={() => setShowAddUser(false)}
                className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.firstName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, firstName: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.lastName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, lastName: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  placeholder="ortho@energika.ma"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Rôle *
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        role: e.target.value as "ADMIN" | "ORTHO",
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 bg-white"
                  >
                    <option value="ORTHO">Orthophoniste</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) =>
                      setNewUser({ ...newUser, phone: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    placeholder="06XXXXXXXX"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  <Plus size={16} />
                  Créer le compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
