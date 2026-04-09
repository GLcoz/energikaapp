"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
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
import {
  demoPatients,
  demoBillings,
  demoSessions,
  demoExpenses,
  demoChartData,
  getDailyStats,
  getMonthlyBilan,
  getUnpaidPatients,
} from "@/lib/demo-data";
import type { User } from "@/lib/types";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const dailyStats = getDailyStats();
  const monthlyBilan = getMonthlyBilan();
  const unpaid = getUnpaidPatients();
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    const stored = localStorage.getItem("energika_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-8 fade-in">
      {/* Page Header */}
      <div>
        <h1 className="page-title">
          Bonjour, {user?.firstName} 👋
        </h1>
        <p className="page-subtitle">
          Voici un aperçu de votre centre pour {getMonthName(currentMonth)}{" "}
          {new Date().getFullYear()}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Patients */}
        <div className="stat-card" style={{ "--card-accent": "#3b82f6", "--card-accent-end": "#06b6d4" } as React.CSSProperties}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-muted)]">
                Patients actifs
              </p>
              <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1 count-up">
                {demoPatients.filter((p) => p.isActive).length}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-3 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-green-500" />
            <span className="text-green-600 font-medium">+2</span> ce mois
          </p>
        </div>

        {/* Sessions Today */}
        <div className="stat-card" style={{ "--card-accent": "#06b6d4", "--card-accent-end": "#10b981" } as React.CSSProperties}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-muted)]">
                Séances aujourd&apos;hui
              </p>
              <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1 count-up">
                {dailyStats.sessionsToday}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-cyan-600" />
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-3 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-500" />
            Prochaine à 10h00
          </p>
        </div>

        {isAdmin && (
          <>
            {/* Monthly Revenue */}
            <div className="stat-card" style={{ "--card-accent": "#10b981", "--card-accent-end": "#059669" } as React.CSSProperties}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-muted)]">
                    Revenus du mois
                  </p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1 count-up">
                    {formatCurrency(monthlyBilan.totalRevenue)}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-3 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-green-500" />
                {monthlyBilan.paidCount} forfaits payés
              </p>
            </div>

            {/* Net Profit */}
            <div
              className="stat-card"
              style={{
                "--card-accent": monthlyBilan.netProfit >= 0 ? "#10b981" : "#ef4444",
                "--card-accent-end": monthlyBilan.netProfit >= 0 ? "#06b6d4" : "#f97316",
              } as React.CSSProperties}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-muted)]">
                    Bénéfice Net
                  </p>
                  <p
                    className={`text-3xl font-bold mt-1 count-up ${
                      monthlyBilan.netProfit >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(monthlyBilan.netProfit)}
                  </p>
                </div>
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    monthlyBilan.netProfit >= 0 ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  {monthlyBilan.netProfit >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-3 flex items-center gap-1">
                <Receipt className="w-3 h-3 text-gray-400" />
                Dépenses: {formatCurrency(monthlyBilan.totalExpenses)}
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
                  <p className="text-sm font-medium text-[var(--color-text-muted)]">
                    Mes patients
                  </p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1 count-up">
                    {demoPatients.length}
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            {/* Ortho - Completed */}
            <div className="stat-card" style={{ "--card-accent": "#f59e0b", "--card-accent-end": "#f97316" } as React.CSSProperties}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-muted)]">
                    Séances terminées
                  </p>
                  <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1 count-up">
                    {demoSessions.filter((s) => s.isCompleted).length}
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
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                  Caisse du jour
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Total des paiements encaissés aujourd&apos;hui
                </p>
              </div>
            </div>
            <div className="flex items-center gap-8 flex-wrap">
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Montant encaissé
                </p>
                <p className="text-4xl font-bold text-green-600 count-up">
                  {formatCurrency(dailyStats.totalCollected)}
                </p>
              </div>
              <div className="w-px h-12 bg-[var(--color-border-default)]" />
              <div>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Paiements reçus
                </p>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {dailyStats.paymentsCount}
                </p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue vs Expenses Chart */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
                Revenus vs Dépenses
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-6">
                Comparaison mensuelle
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demoChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      tickFormatter={(v) => `${v / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      formatter={(value) => formatCurrency(Number(value ?? 0))}
                    />
                    <Legend />
                    <Bar
                      dataKey="revenus"
                      name="Revenus"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="depenses"
                      name="Dépenses"
                      fill="#ef4444"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue Trend */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
                Tendance des revenus
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-6">
                Évolution mensuelle
              </p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={demoChartData}>
                    <defs>
                      <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      tickFormatter={(v) => `${v / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      formatter={(value) => formatCurrency(Number(value ?? 0))}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenus"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#colorRevenu)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Payment Status Summary */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
              État des paiements — {getMonthName(currentMonth)}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-6">
              Suivi des forfaits mensuels
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                <p className="text-sm text-green-700 font-medium">Payés</p>
                <p className="text-2xl font-bold text-green-700">
                  {monthlyBilan.paidCount}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-sm text-amber-700 font-medium">En attente</p>
                <p className="text-2xl font-bold text-amber-700">
                  {monthlyBilan.pendingCount}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                <p className="text-sm text-orange-700 font-medium">Partiels</p>
                <p className="text-2xl font-bold text-orange-700">
                  {monthlyBilan.partialCount}
                </p>
              </div>
            </div>

            {/* Unpaid List */}
            {unpaid.length > 0 && (
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
                      {unpaid.map((item) => (
                        <tr key={item.id}>
                          <td className="font-medium text-[var(--color-text-primary)]">
                            {item.patient.firstName} {item.patient.lastName}
                          </td>
                          <td>{formatCurrency(item.amountDue)}</td>
                          <td>{formatCurrency(item.amountPaid)}</td>
                          <td className="font-semibold text-red-600">
                            {formatCurrency(item.amountDue - item.amountPaid)}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                item.status === "PARTIAL"
                                  ? "badge-warning"
                                  : "badge-danger"
                              }`}
                            >
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

      {/* Recent Sessions - visible to all */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
          Séances d&apos;aujourd&apos;hui
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-6">
          Planning des rendez-vous
        </p>
        <div className="space-y-3">
          {demoSessions.map((session) => {
            const patient = demoPatients.find(
              (p) => p.id === session.patientId
            );
            const billing = demoBillings.find(
              (b) =>
                b.patientId === session.patientId &&
                b.month === new Date().getMonth() + 1
            );
            const isUnpaid = billing && billing.status !== "PAID";

            return (
              <div
                key={session.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border-light)] hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-tertiary)] transition-all"
              >
                <div
                  className={`w-1 h-12 rounded-full ${
                    session.isCompleted
                      ? "bg-green-400"
                      : isUnpaid
                      ? "bg-red-400"
                      : "bg-blue-400"
                  }`}
                />
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
                    {new Date(session.startTime).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(session.endTime).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`badge ${
                    session.isCompleted ? "badge-success" : "badge-info"
                  }`}
                >
                  {session.isCompleted ? "Terminée" : "À venir"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
