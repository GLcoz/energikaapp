"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
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
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  Banknote,
  Plus,
} from "lucide-react";
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
  const totalDue = monthBillings.reduce((sum, b) => sum + b.amountDue, 0);
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

  const collectionRate = totalDue > 0 ? Math.round((totalRevenue / totalDue) * 100) : 0;

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
        <div className="skeleton h-10 w-72 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card">
              <div className="skeleton h-4 w-32 rounded mb-3" />
              <div className="skeleton h-8 w-24 rounded" />
            </div>
          ))}
        </div>
        <div className="card p-6"><div className="skeleton h-48 rounded-xl" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="page-title text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              Bonjour, {user?.firstName} 👋
            </h1>
          </div>
          <p className="page-subtitle text-sm text-slate-500 mt-1">
            Activité clinique et financière — {getMonthName(currentMonth)} {currentYear}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-xs font-semibold text-blue-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {activePatients.length} patients actifs suivis
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Patients */}
        <div className="stat-card" style={{ "--card-accent": "#2563eb", "--card-accent-end": "#38bdf8" } as React.CSSProperties}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Patients actifs</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2 font-tabular">
                {activePatients.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-xs border border-blue-100">
              <Users size={22} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total enregistrés</span>
            <strong className="text-slate-700">{patients.length}</strong>
          </div>
        </div>

        {/* Sessions Today */}
        <div className="stat-card" style={{ "--card-accent": "#0ea5e9", "--card-accent-end": "#10b981" } as React.CSSProperties}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Séances aujourd&apos;hui</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2 font-tabular">
                {todaySessions.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 shadow-xs border border-cyan-100">
              <Calendar size={22} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{nextTime ? `Prochaine à ${nextTime}` : "Toutes terminées"}</span>
            <strong className="text-cyan-700 font-semibold">{completedToday}/{todaySessions.length} faites</strong>
          </div>
        </div>

        {isAdmin && (
          <>
            {/* Monthly Revenue */}
            <div className="stat-card" style={{ "--card-accent": "#059669", "--card-accent-end": "#10b981" } as React.CSSProperties}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Revenus du mois</p>
                  <p className="text-2xl lg:text-3xl font-extrabold text-emerald-700 mt-2 font-tabular">
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-xs border border-emerald-100">
                  <TrendingUp size={22} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Taux d&apos;encaissement</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {collectionRate}%
                </span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="stat-card" style={{
              "--card-accent": netProfit >= 0 ? "#10b981" : "#ef4444",
              "--card-accent-end": netProfit >= 0 ? "#06b6d4" : "#f97316",
            } as React.CSSProperties}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Bénéfice Net</p>
                  <p className={`text-2xl lg:text-3xl font-extrabold mt-2 font-tabular ${netProfit >= 0 ? "text-slate-900" : "text-red-600"}`}>
                    {formatCurrency(netProfit)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs border ${
                  netProfit >= 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                }`}>
                  {netProfit >= 0 ? (
                    <TrendingUp size={22} />
                  ) : (
                    <TrendingDown size={22} />
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Dépenses déduites</span>
                <strong className="text-slate-700">{formatCurrency(totalExpenses)}</strong>
              </div>
            </div>
          </>
        )}

        {!isAdmin && (
          <>
            {/* Ortho - My Patients */}
            <div className="stat-card" style={{ "--card-accent": "#10b981", "--card-accent-end": "#059669" } as React.CSSProperties}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Mes patients suivis</p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2 font-tabular">
                    {activePatients.length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-xs border border-emerald-100">
                  <Users size={22} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                Fiches patients actives
              </div>
            </div>

            {/* Ortho - Completed today */}
            <div className="stat-card" style={{ "--card-accent": "#f59e0b", "--card-accent-end": "#f97316" } as React.CSSProperties}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Séances terminées</p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2 font-tabular">
                    {completedToday}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-xs border border-amber-100">
                  <CheckCircle2 size={22} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                Aujourd&apos;hui
              </div>
            </div>
          </>
        )}
      </div>

      {isAdmin && (
        <>
          {/* Caisse du Jour & Suivi financier */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Caisse du Jour */}
            <div className="card p-6 bg-gradient-to-br from-white via-white to-emerald-50/30 border border-emerald-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                      <Banknote size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Caisse du jour</h2>
                      <p className="text-xs text-slate-500">Recettes & flux du jour</p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/caisse"
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors border border-emerald-200/60"
                  >
                    Ouvrir
                    <ArrowUpRight size={13} />
                  </Link>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Montant encaissé</p>
                    <p className="text-3xl font-extrabold text-emerald-600 mt-1 font-tabular">
                      {formatCurrency(totalCollectedToday)}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 flex items-center justify-between text-xs">
                    <span className="text-emerald-800 font-medium">Paiements reçus aujourd&apos;hui</span>
                    <span className="font-bold text-emerald-900 bg-white px-2 py-0.5 rounded-md shadow-2xs">
                      {todayPaid.length}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/dashboard/caisse"
                className="w-full btn btn-primary py-2.5 text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 mt-4"
              >
                <Plus size={14} />
                <span>Ajouter sur la caisse (Visite ou Forfait)</span>
              </Link>
            </div>

            {/* État des paiements mensuels */}
            <div className="lg:col-span-2 card p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Suivi des Forfaits — {getMonthName(currentMonth)}
                  </h3>
                  <p className="text-xs text-slate-500">Répartition du statut des règlements</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-medium">Total dû</p>
                  <p className="text-sm font-bold text-slate-800">{formatCurrency(totalDue)}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>Progression des encaissements</span>
                  <span className="font-bold text-blue-600">{collectionRate}% réglé</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 transition-all duration-700"
                    style={{ width: `${Math.min(collectionRate, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
                  <p className="text-xs text-emerald-700 font-semibold">Payés</p>
                  <p className="text-2xl font-extrabold text-emerald-800 mt-1 font-tabular">{paidCount}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 text-center">
                  <p className="text-xs text-amber-700 font-semibold">En attente</p>
                  <p className="text-2xl font-extrabold text-amber-800 mt-1 font-tabular">{pendingCount}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-100 text-center">
                  <p className="text-xs text-orange-700 font-semibold">Partiels</p>
                  <p className="text-2xl font-extrabold text-orange-800 mt-1 font-tabular">{partialCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Patients avec impayés */}
          {unpaidBillings.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Patients avec paiement en attente ({unpaidBillings.length})
                    </h4>
                    <p className="text-xs text-slate-400">Pour le mois en cours</p>
                  </div>
                </div>
              </div>

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
                    {unpaidBillings.slice(0, 6).map((item) => (
                      <tr key={item.id}>
                        <td className="font-semibold text-slate-800">
                          {item.patient?.firstName} {item.patient?.lastName}
                        </td>
                        <td className="font-medium text-slate-600">{formatCurrency(item.amountDue)}</td>
                        <td className="text-emerald-600 font-medium">{formatCurrency(item.amountPaid)}</td>
                        <td className="font-bold text-red-600">
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
        </>
      )}

      {/* Today's Sessions */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-xs border border-blue-100">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Séances d&apos;aujourd&apos;hui
              </h3>
              <p className="text-xs text-slate-500">Planning des rendez-vous de la journée</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {todaySessions.length} rendez-vous
          </span>
        </div>

        {todaySessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-36 text-center gap-2 rounded-xl bg-slate-50/50 border border-dashed border-slate-200">
            <Calendar className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">Aucune séance planifiée pour aujourd&apos;hui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
                    className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs transition-all"
                  >
                    <div className={`w-1.5 h-10 rounded-full ${
                      session.isAbsent
                        ? "bg-orange-500"
                        : session.isCompleted
                        ? "bg-emerald-500"
                        : isUnpaid
                        ? "bg-red-400"
                        : "bg-blue-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {patient?.firstName} {patient?.lastName}
                        </p>
                        {session.room && (
                          <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                            S.{session.room}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {new Date(session.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        {" - "}
                        {new Date(session.endTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className={`badge ${
                      session.isAbsent
                        ? "badge-warning"
                        : session.isCompleted
                        ? "badge-success"
                        : "badge-info"
                    }`}>
                      {session.isAbsent ? "Absent" : session.isCompleted ? "Terminée" : "Planifiée"}
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
