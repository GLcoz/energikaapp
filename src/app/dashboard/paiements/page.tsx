"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Search,
  Check,
  AlertCircle,
  Clock,
  Filter,
  Plus,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, getMonthName } from "@/lib/utils";
import type { MonthlyBilling, Patient, PaymentStatus } from "@/lib/types";

export default function PaiementsPage() {
  const [billings, setBillings] = useState<MonthlyBilling[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [patientsRes, billingsRes] = await Promise.all([
        fetch("/api/patients", { cache: "no-store" }),
        fetch("/api/billings", { cache: "no-store" }),
      ]);

      if (patientsRes.ok) {
        const data = (await patientsRes.json()) as Patient[];
        setPatients(data);
      }
      if (billingsRes.ok) {
        const data = (await billingsRes.json()) as MonthlyBilling[];
        setBillings(data);
      }
    } catch {
      // réseau indisponible — laisser vide
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Générer automatiquement les lignes de paiement du mois en cours
  // pour chaque patient actif qui n'en a pas encore
  const handleGenerateBillings = async () => {
    const activePatients = patients.filter((p) => p.isActive);
    const existingThisMonth = billings.filter(
      (b) => b.month === currentMonth && b.year === currentYear
    );
    const existingPatientIds = new Set(existingThisMonth.map((b) => b.patientId));

    const toCreate = activePatients.filter((p) => !existingPatientIds.has(p.id));

    if (toCreate.length === 0) {
      alert("Tous les patients actifs ont déjà une ligne de paiement ce mois-ci.");
      return;
    }

    await Promise.all(
      toCreate.map((p) =>
        fetch("/api/billings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: p.id,
            month: currentMonth,
            year: currentYear,
            amountDue: p.monthlyFee,
            amountPaid: 0,
            status: "PENDING",
          }),
        })
      )
    );

    await loadData();
  };

  const handleMarkPaid = async (billing: MonthlyBilling) => {
    const res = await fetch(`/api/billings/${billing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "PAID",
        amountPaid: billing.amountDue,
        paidAt: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      const updated = (await res.json()) as MonthlyBilling;
      setBillings((prev) => prev.map((b) => (b.id === billing.id ? updated : b)));
    }
  };

  const handlePartialPayment = async (billing: MonthlyBilling) => {
    const amount = prompt("Montant payé (DH):");
    if (!amount) return;
    const paid = parseFloat(amount);
    if (isNaN(paid) || paid <= 0) return;

    const newPaid = billing.amountPaid + paid;
    const newStatus: PaymentStatus = newPaid >= billing.amountDue ? "PAID" : "PARTIAL";

    const res = await fetch(`/api/billings/${billing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountPaid: newPaid,
        status: newStatus,
        paidAt: newStatus === "PAID" ? new Date().toISOString() : undefined,
      }),
    });
    if (res.ok) {
      const updated = (await res.json()) as MonthlyBilling;
      setBillings((prev) => prev.map((b) => (b.id === billing.id ? updated : b)));
    }
  };

  const filteredBillings = billings
    .filter((b) => b.month === currentMonth && b.year === currentYear)
    .filter((b) => filter === "ALL" || b.status === filter)
    .filter((b) => {
      const patient = patients.find((p) => p.id === b.patientId);
      return patient
        ? `${patient.firstName} ${patient.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        : false;
    });

  const totalDue = filteredBillings.reduce((sum, b) => sum + b.amountDue, 0);
  const totalPaid = filteredBillings.reduce((sum, b) => sum + b.amountPaid, 0);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            Paiements
          </h1>
          <p className="page-subtitle">
            Suivi des forfaits — {getMonthName(currentMonth)} {currentYear}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => void loadData()}
            className="btn btn-secondary"
            title="Actualiser"
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
          <button
            onClick={() => void handleGenerateBillings()}
            className="btn btn-primary"
          >
            <Plus size={16} />
            Générer le mois
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div
          className="stat-card"
          style={{ "--card-accent": "#10b981", "--card-accent-end": "#059669" } as React.CSSProperties}
        >
          <p className="text-sm text-[var(--color-text-muted)]">Total dû</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
            {formatCurrency(totalDue)}
          </p>
        </div>
        <div
          className="stat-card"
          style={{ "--card-accent": "#3b82f6", "--card-accent-end": "#06b6d4" } as React.CSSProperties}
        >
          <p className="text-sm text-[var(--color-text-muted)]">Total encaissé</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div
          className="stat-card"
          style={{ "--card-accent": "#ef4444", "--card-accent-end": "#f97316" } as React.CSSProperties}
        >
          <p className="text-sm text-[var(--color-text-muted)]">Reste à percevoir</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {formatCurrency(totalDue - totalPaid)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Rechercher un patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
        </div>
        <div className="flex gap-2">
          {(["ALL", "PAID", "PENDING", "PARTIAL"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn text-xs py-2 px-3 ${
                filter === f ? "btn-primary" : "btn-secondary"
              }`}
            >
              {f === "ALL" && <Filter size={14} />}
              {f === "PAID" && <Check size={14} />}
              {f === "PENDING" && <Clock size={14} />}
              {f === "PARTIAL" && <AlertCircle size={14} />}
              {f === "ALL"
                ? "Tous"
                : f === "PAID"
                ? "Payés"
                : f === "PENDING"
                ? "En attente"
                : "Partiels"}
            </button>
          ))}
        </div>
      </div>

      {/* Billing Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-3 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
          </div>
        ) : filteredBillings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
            <Wallet className="w-10 h-10 text-[var(--color-text-muted)]" />
            <p className="text-[var(--color-text-muted)] text-sm">
              Aucun paiement pour ce mois.
            </p>
            <p className="text-[var(--color-text-muted)] text-xs">
              Cliquez sur &quot;Générer le mois&quot; pour créer les lignes de paiement de vos patients actifs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Forfait</th>
                  <th>Payé</th>
                  <th>Restant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBillings.map((billing) => {
                  const patient = patients.find((p) => p.id === billing.patientId);
                  const remaining = billing.amountDue - billing.amountPaid;

                  return (
                    <tr key={billing.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {patient?.firstName[0]}
                            {patient?.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--color-text-primary)]">
                              {patient?.firstName} {patient?.lastName}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                              {patient?.parentPhone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="font-medium">
                        {formatCurrency(billing.amountDue)}
                      </td>
                      <td className="text-green-600 font-medium">
                        {formatCurrency(billing.amountPaid)}
                      </td>
                      <td
                        className={`font-semibold ${
                          remaining > 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {formatCurrency(remaining)}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            billing.status === "PAID"
                              ? "badge-success"
                              : billing.status === "PARTIAL"
                              ? "badge-warning"
                              : "badge-danger"
                          }`}
                        >
                          {billing.status === "PAID"
                            ? "Payé"
                            : billing.status === "PARTIAL"
                            ? "Partiel"
                            : "En attente"}
                        </span>
                      </td>
                      <td>
                        {billing.status !== "PAID" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => void handleMarkPaid(billing)}
                              className="btn btn-primary text-xs py-1.5 px-3"
                            >
                              <Check size={12} />
                              Tout payé
                            </button>
                            <button
                              onClick={() => void handlePartialPayment(billing)}
                              className="btn btn-secondary text-xs py-1.5 px-3"
                            >
                              Partiel
                            </button>
                          </div>
                        )}
                        {billing.status === "PAID" && (
                          <span className="text-xs text-[var(--color-text-muted)]">
                            ✓ Encaissé
                          </span>
                        )}
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
