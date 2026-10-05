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
  Calendar,
  Edit2,
  RotateCcw,
  X,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency, getMonthName } from "@/lib/utils";
import type { MonthlyBilling, Patient, PaymentStatus } from "@/lib/types";

export default function PaiementsPage() {
  const [billings, setBillings] = useState<MonthlyBilling[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal d'encaissement (avec sélection de la date de paiement)
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<MonthlyBilling | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | string>("");
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Modal d'édition directe de la date de paiement
  const [editDateModalOpen, setEditDateModalOpen] = useState(false);
  const [editBilling, setEditBilling] = useState<MonthlyBilling | null>(null);
  const [editDateValue, setEditDateValue] = useState<string>("");
  const [editDateSubmitting, setEditDateSubmitting] = useState(false);

  // Modal de confirmation de réinitialisation de tous les paiements
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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
            paidAt: null,
          }),
        })
      )
    );

    await loadData();
  };

  // Réinitialiser TOUS les paiements (garde les patients)
  const handleResetAllPayments = async () => {
    setIsResetting(true);
    try {
      const res = await fetch("/api/billings/reset", {
        method: "POST",
      });
      if (res.ok) {
        setShowResetAllModal(false);
        await loadData();
      } else {
        alert("Erreur lors de la réinitialisation des paiements.");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur réseau lors de la réinitialisation.");
    } finally {
      setIsResetting(false);
    }
  };

  // Ouvrir le modal d'encaissement avec choix de date
  const openPayModal = (billing: MonthlyBilling, full: boolean = true) => {
    const remaining = billing.amountDue - billing.amountPaid;
    setSelectedBilling(billing);
    setPaymentAmount(full ? remaining : Math.round(remaining / 2));
    // Date du jour par défaut au format YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0];
    setPaymentDate(today);
    setPaymentNotes(billing.notes || "");
    setPayModalOpen(true);
  };

  // Soumettre le paiement avec date
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBilling) return;

    const amountToAdd = parseFloat(String(paymentAmount));
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      alert("Veuillez saisir un montant valide.");
      return;
    }

    setPaySubmitting(true);
    try {
      const newPaid = Math.min(
        selectedBilling.amountPaid + amountToAdd,
        selectedBilling.amountDue
      );
      const newStatus: PaymentStatus =
        newPaid >= selectedBilling.amountDue ? "PAID" : "PARTIAL";

      // Formater la date choisie en ISO
      const isoDate = paymentDate
        ? new Date(`${paymentDate}T12:00:00.000Z`).toISOString()
        : new Date().toISOString();

      const res = await fetch(`/api/billings/${selectedBilling.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaid: newPaid,
          status: newStatus,
          paidAt: isoDate,
          notes: paymentNotes || undefined,
        }),
      });

      if (res.ok) {
        const updated = (await res.json()) as MonthlyBilling;
        setBillings((prev) =>
          prev.map((b) => (b.id === selectedBilling.id ? updated : b))
        );
        setPayModalOpen(false);
        setSelectedBilling(null);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement du paiement.");
    } finally {
      setPaySubmitting(false);
    }
  };

  // Ouvrir le modal d'édition de date
  const openEditDateModal = (billing: MonthlyBilling) => {
    setEditBilling(billing);
    if (billing.paidAt) {
      const d = new Date(billing.paidAt).toISOString().split("T")[0];
      setEditDateValue(d);
    } else {
      setEditDateValue(new Date().toISOString().split("T")[0]);
    }
    setEditDateModalOpen(true);
  };

  // Sauvegarder la nouvelle date de paiement
  const handleSavePaymentDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBilling) return;

    setEditDateSubmitting(true);
    try {
      const isoDate = editDateValue
        ? new Date(`${editDateValue}T12:00:00.000Z`).toISOString()
        : null;

      const res = await fetch(`/api/billings/${editBilling.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paidAt: isoDate,
        }),
      });

      if (res.ok) {
        const updated = (await res.json()) as MonthlyBilling;
        setBillings((prev) =>
          prev.map((b) => (b.id === editBilling.id ? updated : b))
        );
        setEditDateModalOpen(false);
        setEditBilling(null);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification de la date.");
    } finally {
      setEditDateSubmitting(false);
    }
  };

  // Réinitialiser un paiement individuel (remettre en PENDING avec 0 DH payé)
  const handleResetSingleBilling = async (billing: MonthlyBilling) => {
    const patient = patients.find((p) => p.id === billing.patientId);
    const name = patient ? `${patient.firstName} ${patient.lastName}` : "ce patient";
    if (
      !confirm(
        `Annuler l'encaissement et remettre le paiement de ${name} en attente (0 DH payé) ?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/billings/${billing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PENDING",
          amountPaid: 0,
          paidAt: null,
        }),
      });

      if (res.ok) {
        const updated = (await res.json()) as MonthlyBilling;
        setBillings((prev) =>
          prev.map((b) => (b.id === billing.id ? updated : b))
        );
        setEditDateModalOpen(false);
      }
    } catch (e) {
      console.error(e);
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
  const totalPaidCount = filteredBillings.filter((b) => b.status === "PAID").length;

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
            Suivi des forfaits et dates de paiement — {getMonthName(currentMonth)} {currentYear}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void loadData()}
            className="btn btn-secondary text-sm"
            title="Actualiser les données"
          >
            <RefreshCw size={15} />
            Actualiser
          </button>
          <button
            onClick={() => setShowResetAllModal(true)}
            className="btn text-sm text-red-600 bg-red-50 hover:bg-red-100 border border-red-200"
            title="Réinitialiser tous les paiements"
          >
            <RotateCcw size={15} />
            Reset tous les paiements
          </button>
          <button
            onClick={() => void handleGenerateBillings()}
            className="btn btn-primary text-sm"
          >
            <Plus size={15} />
            Générer le mois
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          className="stat-card"
          style={{ "--card-accent": "#10b981", "--card-accent-end": "#059669" } as React.CSSProperties}
        >
          <p className="text-sm text-[var(--color-text-muted)]">Total dû ({getMonthName(currentMonth)})</p>
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
        <div
          className="stat-card"
          style={{ "--card-accent": "#8b5cf6", "--card-accent-end": "#6366f1" } as React.CSSProperties}
        >
          <p className="text-sm text-[var(--color-text-muted)]">Paiements réglés</p>
          <p className="text-2xl font-bold text-violet-600 mt-1">
            {totalPaidCount} / {filteredBillings.length}
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
        <div className="flex flex-wrap gap-2">
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
                  <th>Date de paiement</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBillings.map((billing) => {
                  const patient = patients.find((p) => p.id === billing.patientId);
                  const remaining = billing.amountDue - billing.amountPaid;

                  return (
                    <tr key={billing.id}>
                      {/* Patient */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {patient?.firstName?.[0]?.toUpperCase() || "?"}
                            {patient?.lastName?.[0]?.toUpperCase() || ""}
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--color-text-primary)]">
                              {patient?.firstName} {patient?.lastName}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                              {patient?.parentPhone}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Forfait */}
                      <td className="font-medium text-slate-800">
                        {formatCurrency(billing.amountDue)}
                      </td>

                      {/* Payé */}
                      <td className="text-green-600 font-semibold">
                        {formatCurrency(billing.amountPaid)}
                      </td>

                      {/* Restant */}
                      <td
                        className={`font-semibold ${
                          remaining > 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {formatCurrency(remaining)}
                      </td>

                      {/* Statut */}
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

                      {/* Date de paiement */}
                      <td>
                        {billing.paidAt ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-100">
                              <Calendar size={13} className="text-blue-500 flex-shrink-0" />
                              {new Date(billing.paidAt).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </span>
                            <button
                              onClick={() => openEditDateModal(billing)}
                              title="Modifier la date de paiement"
                              className="p-1 text-[var(--color-text-muted)] hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit2 size={13} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-text-muted)] italic flex items-center gap-1">
                            <Clock size={12} className="opacity-50" />
                            En attente
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td>
                        {billing.status !== "PAID" ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openPayModal(billing, true)}
                              className="btn btn-primary text-xs py-1.5 px-3"
                              title="Encaisser avec sélection de la date"
                            >
                              <Check size={13} />
                              Encaisser
                            </button>
                            <button
                              onClick={() => openPayModal(billing, false)}
                              className="btn btn-secondary text-xs py-1.5 px-2.5"
                              title="Paiement partiel avec date"
                            >
                              Partiel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-md flex items-center gap-1 border border-green-200">
                              <CheckCircle2 size={13} />
                              Encaissé
                            </span>
                            <button
                              onClick={() => openEditDateModal(billing)}
                              className="btn btn-secondary text-xs py-1 px-2"
                              title="Modifier date ou réinitialiser"
                            >
                              <Edit2 size={12} />
                            </button>
                          </div>
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

      {/* ─── Modal d'encaissement de paiement (avec sélection de la Date) ─── */}
      {payModalOpen && selectedBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md fade-in">
          <div className="glass-modal rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl fade-in">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[var(--color-border-light)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                    Encaisser le forfait
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {getMonthName(currentMonth)} {currentYear}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPayModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {(() => {
              const patient = patients.find((p) => p.id === selectedBilling.patientId);
              const remaining = selectedBilling.amountDue - selectedBilling.amountPaid;

              return (
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  {/* Info patient */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)] font-medium">Enfant</p>
                      <p className="text-sm font-bold text-[var(--color-text-primary)]">
                        {patient?.firstName} {patient?.lastName}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {patient?.parentPhone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--color-text-muted)] font-medium">Reste dû</p>
                      <p className="text-base font-bold text-red-600">
                        {formatCurrency(remaining)}
                      </p>
                    </div>
                  </div>

                  {/* Montant encaissé */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                      Montant encaissé (DH) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        max={remaining}
                        required
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                      />
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(remaining)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-600 hover:underline px-2 py-1"
                      >
                        Tout régler
                      </button>
                    </div>
                  </div>

                  {/* DATE DE PAIEMENT */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1 flex items-center gap-1.5">
                      <Calendar size={14} className="text-blue-600" />
                      Date de paiement de l&apos;enfant *
                    </label>
                    <input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    />
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                      Date à laquelle le parent a réglé le forfait.
                    </p>
                  </div>

                  {/* Notes / Mode de paiement */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                      Remarques ou mode de paiement (optionnel)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Espèces, Virement bancaire, Chèque..."
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    />
                  </div>

                  {/* Boutons validation */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setPayModalOpen(false)}
                      className="flex-1 btn btn-secondary text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={paySubmitting}
                      className="flex-1 btn btn-primary text-sm flex items-center justify-center gap-1.5"
                    >
                      <Check size={16} />
                      {paySubmitting ? "Enregistrement..." : "Valider le paiement"}
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* ─── Modal pour Modifier la Date de paiement ─── */}
      {editDateModalOpen && editBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md fade-in">
          <div className="glass-modal rounded-3xl max-w-sm w-full p-6 shadow-2xl fade-in">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--color-border-light)]">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-blue-600" />
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  Date de paiement
                </h3>
              </div>
              <button
                onClick={() => setEditDateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {(() => {
              const patient = patients.find((p) => p.id === editBilling.patientId);
              return (
                <form onSubmit={handleSavePaymentDate} className="space-y-4">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Patient : <strong className="text-slate-800">{patient?.firstName} {patient?.lastName}</strong>
                  </p>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                      Nouvelle date de paiement :
                    </label>
                    <input
                      type="date"
                      required
                      value={editDateValue}
                      onChange={(e) => setEditDateValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => void handleResetSingleBilling(editBilling)}
                      className="btn text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200"
                      title="Annuler ce paiement et le remettre en attente"
                    >
                      Remettre en attente (0 DH)
                    </button>
                    <button
                      type="submit"
                      disabled={editDateSubmitting}
                      className="flex-1 btn btn-primary text-xs"
                    >
                      {editDateSubmitting ? "..." : "Enregistrer"}
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* ─── Modal de Confirmation de Réinitialisation de TOUS les paiements ─── */}
      {showResetAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md fade-in">
          <div className="glass-modal rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl fade-in border-2 border-red-200/80">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <RotateCcw size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Réinitialiser tous les paiements ?
                </h3>
                <p className="text-xs text-red-600 font-medium">
                  Action pour {getMonthName(currentMonth)} {currentYear}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Cette action va remettre <strong>tous les paiements à 0 DH (statut En attente)</strong> et effacer les dates de paiement existantes.
              <br /><br />
              <strong className="text-green-700 bg-green-50 px-2 py-1 rounded inline-block">
                ✓ Les fiches de tous les patients sont conservées intactes !
              </strong>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowResetAllModal(false)}
                disabled={isResetting}
                className="flex-1 btn btn-secondary text-sm"
              >
                Annuler
              </button>
              <button
                onClick={() => void handleResetAllPayments()}
                disabled={isResetting}
                className="flex-1 btn bg-red-600 hover:bg-red-700 text-white text-sm font-semibold flex items-center justify-center gap-1.5"
              >
                {isResetting ? (
                  "Réinitialisation..."
                ) : (
                  <>
                    <RotateCcw size={15} />
                    Confirmer le reset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
