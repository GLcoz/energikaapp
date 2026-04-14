"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  Receipt,
  Clock,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { formatCurrency, getMonthName } from "@/lib/utils";
import type { User, Patient, Session, MonthlyBilling, Expense } from "@/lib/types";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [billings, setBillings] = useState<MonthlyBilling[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const todayStr = new Date().toDateString();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes, bRes, eRes] = await Promise.all([
        fetch("/api/patients", { cache: "no-store" }),
        fetch("/api/sessions", { cache: "no-store" }),
        fetch("/api/billings", { cache: "no-store" }),
        fetch("/api/expenses", { cache: "no-store" }),
      ]);
      if (pRes.ok) setPatients((await pRes.json()) as Patient[]);
      if (sRes.ok) setSessions((await sRes.json()) as Session[]);
      if (bRes.ok) setBillings((await bRes.json()) as MonthlyBilling[]);
      if (eRes.ok) setExpenses((await eRes.json()) as Expense[]);
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

  const isAdmin = user?.role === "ADMIN";

  // ── Computed Stats ────────────────────────────────────────────────
  const activePatients = patients.filter((p) => p.isActive);

  const todaySessions = sessions.filter(
    (s) => new Date(s.startTime).toDateString() === todayStr
  );
  const completedToday = todaySessions.filter((s) => s.isCompleted).length;

  const monthBillings = billings.filter(
    (b) => b.month === currentMonth && b.year === currentYear
  );
  const totalRevenue = monthBillings.reduce((sum, b) => sum + b.amountPaid, 0);
  const totalExpenses = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const paidCount = monthBillings.filter((b) => b.status === "PAID").length;
  const pendingCount = monthBillings.filter((b) => b.status === "PENDING").length;
  const partialCount = monthBillings.filter((b) => b.status === "PARTIAL").length;

  const todayPaid = billings.filter(
    (b) => b.paidAt && new Date(b.paidAt).toDateString() === todayStr
  );
  const totalCollectedToday = todayPaid.reduce((sum, b) => sum + b.amountPaid, 0);

  const unpaidBillings = monthBillings
    .filter((b) => b.status !== "PAID")
    .map((b) => ({ ...b, patient: patients.find((p) => p.id === b.patientId) }))
    .filter((b) => b.patient);

  // Upcoming session today
  const now = new Date();
  const nextSession = todaySessions
    .filter((s) => !s.isCompleted && new Date(s.startTime) > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

  const nextTime = nextSession
    ? new Date(nextSession.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : null;

  // Skeleton
  if (loading) {
    return (
      <div className="space-y-8 fade-in">
        <div className="skeleton h-8 w-64 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card">
              <div className="skeleton h-4 w-32 rounded mb-3" />
              <div className="skeleton h-8 w-16 rounded" />
            </div>
          ))}
        </div>
        <div className="card p-6"><div className="skeleton h-48 rounded" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Page Header */}
      <div>
        <h1 className="page-title">
          Bonjour, {user?.firstName} 👋
        </h1>
        <p className="page-subtitle">
          Voici un aperçu de votre centre pour {getMonthName(currentMonth)}{" "}
          {currentYear}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Patients */}
        <div className="stat-card" style={{ "--card-accent": "#3b82f6", "--card-accent-end": "#06b6d4" } as React.CSSProperties}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-muted)]">Patients actifs</p>
              <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1 count-up">
                {activePatients.length}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-3">{patients.length} au total</p>
        </div>

        {/* Sessions Today */}
        <div className="stat-card" style={{ "--card-accent": "#06b6d4", "--card-accent-end": "#10b981" } as React.CSSProperties}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-muted)]">Séances aujourd&apos;hui</p>
              <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1 count-up">
                {todaySessions.length}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-cyan-600" />
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-3 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-500" />
            {nextTime ? `Prochaine à ${nextTime}` : "Aucune à venir"}
          </p>
        </div>

        {isAdmin && (
          <>
            {/* Monthly Revenue */}
            <div className="stat-card" style={{ "--card-accent": "#10b981", "--card-accent-end": "#059669" } as React.CSSProperties}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-muted)]">Revenus du mois</p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1 count-up">
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-3 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-green-500" />
                {paidCount} forfaits payés
              </p>
            </div>

            {/* Net Profit */}
            <div className="stat-card" style={{
              "--card-accent": netProfit >= 0 ? "#10b981" : "#ef4444",
              "--card-accent-end": netProfit >= 0 ? "#06b6d4" : "#f97316",
            } as React.CSSProperties}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-muted)]">Bénéfice Net</p>
                  <p className={`text-3xl font-bold mt-1 count-up ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(netProfit)}
                  </p>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${netProfit >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                  {netProfit >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-3 flex items-center gap-1">
                <Receipt className="w-3 h-3 text-gray-400" />
                Dépenses: {formatCurrency(totalExpenses)}
              </p>
            </div>
          </>
        )}

        {!isAdmin && (
          <>
            {/* Ortho - My Patients */}
            <div className="stat-card" style={{ "--card-accent": "#10b981", "--card-accent-end": "#059669" } as React.CSSProperties}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-muted)]">Mes patients</p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1 count-up">
                    {activePatients.length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            {/* Ortho - Completed today */}
            <div className="stat-card" style={{ "--card-accent": "#f59e0b", "--card-accent-end": "#f97316" } as React.CSSProperties}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-muted)]">Séances terminées</p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1 count-up">
                    {completedToday}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {isAdmin && (
        <>
          {/* Caisse du Jour */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Caisse du jour</h2>
                <p className="text-xs text-[var(--color-text-muted)]">Total des paiements encaissés aujourd&apos;hui</p>
              </div>
            </div>
            <div className="flex items-center gap-8 flex-wrap">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Montant encaissé</p>
                <p className="text-4xl font-bold text-green-600 count-up">{formatCurrency(totalCollectedToday)}</p>
              </div>
              <div className="w-px h-12 bg-[var(--color-border-default)]" />
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">Paiements reçus</p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">{todayPaid.length}</p>
              </div>
            </div>
          </div>

          {/* Payment Status Summary */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
              État des paiements — {getMonthName(currentMonth)}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-6">Suivi des forfaits mensuels</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                <p className="text-sm text-green-700 font-medium">Payés</p>
                <p className="text-2xl font-bold text-green-700">{paidCount}</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-sm text-amber-700 font-medium">En attente</p>
                <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
              </div>
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                <p className="text-sm text-orange-700 font-medium">Partiels</p>
                <p className="text-2xl font-bold text-orange-700">{partialCount}</p>
              </div>
            </div>

            {unpaidBillings.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Patients avec impayés
                </h4>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Forfait</th>
                        <th>Payé</th>
                        <th>Restant</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unpaidBillings.map((item) => (
                        <tr key={item.id}>
                          <td className="font-medium text-[var(--color-text-primary)]">
                            {item.patient?.firstName} {item.patient?.lastName}
                          </td>
                          <td>{formatCurrency(item.amountDue)}</td>
                          <td>{formatCurrency(item.amountPaid)}</td>
                          <td className="font-semibold text-red-600">
                            {formatCurrency(item.amountDue - item.amountPaid)}
                          </td>
                          <td>
                            <span className={`badge ${item.status === "PARTIAL" ? "badge-warning" : "badge-danger"}`}>
                              {item.status === "PARTIAL" ? "Partiel" : "En attente"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Today's Sessions - visible to all */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
          Séances d&apos;aujourd&apos;hui
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-6">Planning des rendez-vous</p>

        {todaySessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
            <Calendar className="w-8 h-8 text-[var(--color-text-muted)]" />
            <p className="text-sm text-[var(--color-text-muted)]">Aucune séance planifiée aujourd&apos;hui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaySessions
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .map((session) => {
                const patient = patients.find((p) => p.id === session.patientId);
                const billing = billings.find(
                  (b) => b.patientId === session.patientId && b.month === currentMonth
                );
                const isUnpaid = billing && billing.status !== "PAID";

                return (
                  <div
                    key={session.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border-light)] hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-tertiary)] transition-all"
                  >
                    <div className={`w-1 h-12 rounded-full ${
                      session.isAbsent
                        ? "bg-orange-400"
                        : session.isCompleted
                        ? "bg-green-400"
                        : isUnpaid
                        ? "bg-red-400"
                        : "bg-blue-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                          {patient?.firstName} {patient?.lastName}
                        </p>
                        {isUnpaid && isAdmin && (
                          <span className="w-2 h-2 rounded-full bg-red-500 pulse-dot flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {new Date(session.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        {" - "}
                        {new Date(session.endTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className={`badge ${
                      session.isAbsent
                        ? ""
                        : session.isCompleted
                        ? "badge-success"
                        : "badge-info"
                    }`} style={session.isAbsent ? { background: "#fed7aa", color: "#c2410c" } : {}}>
                      {session.isAbsent ? "Absent" : session.isCompleted ? "Terminée" : "À venir"}
                    </span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
