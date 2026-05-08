"use client";

import { useEffect, useState, useCallback } from "react";
import { Handshake, Users, DollarSign, TrendingUp, Calendar, Phone } from "lucide-react";
import { formatCurrency, getMonthName } from "@/lib/utils";
import type { User, Patient, Session } from "@/lib/types";

export default function SousTraitancePage() {
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        fetch("/api/patients", { cache: "no-store" }),
        fetch("/api/sessions", { cache: "no-store" }),
      ]);
      if (pRes.ok) setPatients((await pRes.json()) as Patient[]);
      if (sRes.ok) setSessions((await sRes.json()) as Session[]);
    } catch {
      // keep empty on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("energika_user");
    if (stored) setUser(JSON.parse(stored));
    void loadData();
  }, [loadData]);

  // Filter subcontracted sessions for selected month
  const subSessions = sessions.filter((s) => {
    if (!s.isSubcontracted) return false;
    const d = new Date(s.startTime);
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
  });

  // Stats
  const totalSubFees = subSessions.reduce((sum, s) => sum + (s.subcontractorFee ?? 0), 0);
  const centerRevenue = totalSubFees; // 50/50 split means center earns the same
  const totalSubSessions = subSessions.length;

  // Group by subcontractor name
  const bySubcontractor = subSessions.reduce((acc, s) => {
    const name = s.subcontractorName || "Non renseigné";
    if (!acc[name]) acc[name] = { sessions: [], total: 0, phone: s.subcontractorPhone || "" };
    acc[name].sessions.push(s);
    acc[name].total += s.subcontractorFee ?? 0;
    return acc;
  }, {} as Record<string, { sessions: Session[]; total: number; phone: string }>);

  // Group by patient
  const byPatient = subSessions.reduce((acc, s) => {
    const patient = patients.find((p) => p.id === s.patientId);
    const name = patient ? `${patient.firstName} ${patient.lastName}` : "Inconnu";
    if (!acc[name]) acc[name] = { sessions: [], total: 0, monthlyFee: patient?.monthlyFee ?? 0 };
    acc[name].sessions.push(s);
    acc[name].total += s.subcontractorFee ?? 0;
    return acc;
  }, {} as Record<string, { sessions: Session[]; total: number; monthlyFee: number }>);

  if (loading) {
    return (
      <div className="space-y-8 fade-in">
        <div className="skeleton h-8 w-64 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stat-card">
              <div className="skeleton h-4 w-32 rounded mb-3" />
              <div className="skeleton h-8 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Handshake className="w-5 h-5 text-white" />
            </div>
            Sous-traitance
          </h1>
          <p className="page-subtitle">
            Suivi des séances sous-traitées et répartition financière (50/50)
          </p>
        </div>

        {/* Month selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-[var(--color-border-default)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/30"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {getMonthName(i + 1)}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-[var(--color-border-default)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/30"
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="stat-card" style={{ "--card-accent": "#8b5cf6", "--card-accent-end": "#7c3aed" } as React.CSSProperties}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-muted)]">Séances sous-traitées</p>
              <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">{totalSubSessions}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-violet-600" />
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-3">
            {getMonthName(selectedMonth)} {selectedYear}
          </p>
        </div>

        <div className="stat-card" style={{ "--card-accent": "#a855f7", "--card-accent-end": "#9333ea" } as React.CSSProperties}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-muted)]">Versé aux orthophonistes</p>
              <p className="text-3xl font-bold text-violet-600 mt-1">{formatCurrency(totalSubFees)}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-violet-600" />
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-3">Part orthophoniste (50%)</p>
        </div>

        <div className="stat-card" style={{ "--card-accent": "#10b981", "--card-accent-end": "#059669" } as React.CSSProperties}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-muted)]">Revenus Centre</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(centerRevenue)}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-3">Part centre Energika (50%)</p>
        </div>
      </div>

      {/* By Subcontractor */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1 flex items-center gap-2">
          <Users className="w-5 h-5 text-violet-500" />
          Par orthophoniste
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-6">
          Détail par sous-traitant — {getMonthName(selectedMonth)} {selectedYear}
        </p>

        {Object.keys(bySubcontractor).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
            <Handshake className="w-8 h-8 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-muted)]">Aucune séance sous-traitée ce mois.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(bySubcontractor)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([name, data]) => (
                <div
                  key={name}
                  className="flex items-center gap-4 p-4 rounded-xl border border-violet-100 bg-violet-50/30 hover:bg-violet-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{name}</p>
                    {data.phone && (
                      <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                        <Phone size={10} /> {data.phone}
                      </p>
                    )}
                    <p className="text-xs text-[var(--color-text-muted)]">{data.sessions.length} séance(s)</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-violet-700">{formatCurrency(data.total)}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">à verser</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* By Patient */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
          Par patient
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-6">
          Détail des patients pris en charge par des sous-traitants
        </p>

        {Object.keys(byPatient).length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
            Aucune donnée pour ce mois.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Mensualité</th>
                  <th>Séances sous-traitées</th>
                  <th>Coût ortho</th>
                  <th>Revenu centre</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byPatient).map(([name, data]) => (
                  <tr key={name}>
                    <td className="font-medium text-[var(--color-text-primary)]">{name}</td>
                    <td>{formatCurrency(data.monthlyFee)}</td>
                    <td>
                      <span className="badge" style={{ background: "#ede9fe", color: "#6d28d9" }}>
                        {data.sessions.length}
                      </span>
                    </td>
                    <td className="text-violet-600 font-semibold">{formatCurrency(data.total)}</td>
                    <td className="text-green-600 font-semibold">{formatCurrency(data.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail List */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
          Toutes les séances sous-traitées
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-6">
          Liste détaillée — {getMonthName(selectedMonth)} {selectedYear}
        </p>

        {subSessions.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
            Aucune séance sous-traitée ce mois.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient</th>
                  <th>Orthophoniste</th>
                  <th>Horaire</th>
                  <th>Part Ortho</th>
                  <th>Part Centre</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {subSessions
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map((s) => {
                    const patient = patients.find((p) => p.id === s.patientId);
                    return (
                      <tr key={s.id}>
                        <td>
                          {new Date(s.startTime).toLocaleDateString("fr-FR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                          })}
                        </td>
                        <td className="font-medium text-[var(--color-text-primary)]">
                          {patient?.firstName} {patient?.lastName}
                        </td>
                        <td>{s.subcontractorName || "—"}</td>
                        <td className="text-xs">
                          {new Date(s.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          {" - "}
                          {new Date(s.endTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="text-violet-600 font-semibold">{formatCurrency(s.subcontractorFee ?? 0)}</td>
                        <td className="text-green-600 font-semibold">{formatCurrency(s.subcontractorFee ?? 0)}</td>
                        <td>
                          <span className={`badge ${s.isCompleted ? "badge-success" : s.isAbsent ? "" : "badge-info"}`}
                            style={s.isAbsent ? { background: "#fed7aa", color: "#c2410c" } : {}}
                          >
                            {s.isAbsent ? "Absent" : s.isCompleted ? "Terminée" : "Planifiée"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
