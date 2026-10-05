"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Banknote,
  Calendar,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  Users,
  Search,
  Printer,
  ChevronLeft,
  ChevronRight,
  X,
  Stethoscope,
  CreditCard,
  Building,
  Coins,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type {
  CaisseData,
  CaisseTransaction,
  CaisseTransactionType,
  PaymentMethod,
  Patient,
  User,
} from "@/lib/types";

export default function CaissePage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [caisseData, setCaisseData] = useState<CaisseData | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [showOpeningModal, setShowOpeningModal] = useState(false);

  // Form states
  const [txType, setTxType] = useState<CaisseTransactionType>("VISITE");
  const [txAmount, setTxAmount] = useState<string>("200");
  const [txMethod, setTxMethod] = useState<PaymentMethod>("CASH");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [customPatientName, setCustomPatientName] = useState<string>("");
  const [txDescription, setTxDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Closing form state
  const [countedAmount, setCountedAmount] = useState<string>("");
  const [closingNotes, setClosingNotes] = useState<string>("");

  // Opening form state
  const [newOpeningAmount, setNewOpeningAmount] = useState<string>("500");

  // Load Caisse Data
  const loadCaisseData = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        fetch(`/api/caisse?date=${date}`, { cache: "no-store" }),
        fetch("/api/patients", { cache: "no-store" }),
      ]);
      if (cRes.ok) {
        const data = await cRes.json();
        setCaisseData(data);
        if (data.closing?.openingAmount) {
          setNewOpeningAmount(String(data.closing.openingAmount));
        }
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setPatients(pData);
      }
    } catch (err) {
      console.error("Failed to load caisse data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("energika_user");
    if (stored) setUser(JSON.parse(stored));
    void loadCaisseData(selectedDate);
  }, [selectedDate, loadCaisseData]);

  // Handle date change
  const changeDateByDays = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  // Handle patient select in modal
  const handlePatientChange = (patientId: string) => {
    setSelectedPatientId(patientId);
    const p = patients.find((x) => x.id === patientId);
    if (p) {
      if (txType === "PAIEMENT_MOIS") {
        setTxAmount(String(p.monthlyFee));
        setTxDescription(`Forfait mensuel de ${p.firstName} ${p.lastName}`);
      } else if (txType === "VISITE") {
        setTxDescription(`Séance / Visite pour ${p.firstName} ${p.lastName}`);
      }
    }
  };

  // Switch type in modal
  const handleTypeSelect = (type: CaisseTransactionType) => {
    setTxType(type);
    if (type === "PAIEMENT_MOIS") {
      if (selectedPatientId) {
        const p = patients.find((x) => x.id === selectedPatientId);
        if (p) {
          setTxAmount(String(p.monthlyFee));
          setTxDescription(`Forfait mensuel de ${p.firstName} ${p.lastName}`);
        }
      } else if (patients.length > 0) {
        const first = patients[0];
        setSelectedPatientId(first.id);
        setTxAmount(String(first.monthlyFee));
        setTxDescription(`Forfait mensuel de ${first.firstName} ${first.lastName}`);
      }
    } else if (type === "VISITE") {
      if (!txAmount || Number(txAmount) > 500) {
        setTxAmount("200");
      }
      setTxDescription(selectedPatientId ? `Séance / Visite ponctuelle` : "Visite / Bilan ponctuel");
    } else if (type === "SORTIE") {
      setTxAmount("50");
      setTxDescription("Achat fournitures / frais de caisse");
    } else {
      setTxAmount("100");
      setTxDescription("Autre entrée de caisse");
    }
  };

  // Submit new transaction
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || Number(txAmount) <= 0) return;

    setSubmitting(true);
    try {
      const payload = {
        date: selectedDate,
        type: txType,
        amount: Number(txAmount),
        paymentMethod: txMethod,
        patientId: selectedPatientId || null,
        patientName: customPatientName || null,
        description: txDescription,
        createdBy: user ? `${user.firstName} ${user.lastName}` : "Admin",
      };

      const res = await fetch("/api/caisse/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowAddModal(false);
        // Reset form
        setTxAmount("200");
        setSelectedPatientId("");
        setCustomPatientName("");
        setTxDescription("");
        await loadCaisseData(selectedDate);
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de l'enregistrement");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Voulez-vous vraiment annuler cette entrée de caisse ?")) return;
    try {
      const res = await fetch(`/api/caisse/transaction/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadCaisseData(selectedDate);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Set opening amount
  const handleSetOpening = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/caisse/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          action: "SET_OPENING",
          openingAmount: Number(newOpeningAmount),
        }),
      });
      if (res.ok) {
        setShowOpeningModal(false);
        await loadCaisseData(selectedDate);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Close cash register
  const handleCloseCaisse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countedAmount) return;
    try {
      const res = await fetch("/api/caisse/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          action: "CLOSE",
          closingAmount: Number(countedAmount),
          notes: closingNotes,
          closedBy: user ? `${user.firstName} ${user.lastName}` : "Admin",
        }),
      });
      if (res.ok) {
        setShowClosingModal(false);
        setCountedAmount("");
        setClosingNotes("");
        await loadCaisseData(selectedDate);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reopen cash register
  const handleReopenCaisse = async () => {
    if (!confirm("Voulez-vous rouvrir la caisse pour modifier ou ajouter des entrées ?")) return;
    try {
      const res = await fetch("/api/caisse/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          action: "REOPEN",
        }),
      });
      if (res.ok) {
        await loadCaisseData(selectedDate);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isClosed = Boolean(caisseData?.closing?.isClosed);
  const summary = caisseData?.summary || {
    openingAmount: 0,
    totalVisites: 0,
    totalPaiementsMois: 0,
    totalAutresEntrees: 0,
    totalEntrees: 0,
    totalSorties: 0,
    soldeTheorique: 0,
    totalCash: 0,
    totalVirement: 0,
    totalCheque: 0,
  };

  return (
    <div className="space-y-7 fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <Banknote size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Caisse du Jour
                </h1>
                {isClosed ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100/80 text-amber-800 border border-amber-300/60 backdrop-blur-md">
                    <Lock size={12} />
                    Clôturée
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-300/60 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Caisse Ouverte
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Suivi des encaissements en direct (Visites ponctuelles, Forfaits mensuels, Dépenses cash)
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector and Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Day Navigation */}
          <div className="flex items-center rounded-xl bg-white/80 border border-slate-200 shadow-xs p-1">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="Jour précédent"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-2 px-2">
              <Calendar size={15} className="text-emerald-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 border-none focus:outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={() => changeDateByDays(1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              title="Jour suivant"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
              className="btn btn-secondary text-xs py-2 px-3"
            >
              Aujourd&apos;hui
            </button>
          )}

          {/* Opening Fund button */}
          <button
            onClick={() => setShowOpeningModal(true)}
            className="btn btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
            title="Définir le fond de caisse initial"
          >
            <Coins size={15} className="text-amber-600" />
            <span>Fond : {formatCurrency(summary.openingAmount)}</span>
          </button>

          {/* Add Transaction Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary text-xs py-2 px-4 shadow-md shadow-emerald-600/20 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Ajouter sur la caisse</span>
          </button>

          {/* Close or Reopen Button */}
          {isClosed ? (
            <button
              onClick={handleReopenCaisse}
              className="btn btn-secondary text-xs py-2 px-3.5 text-amber-700 border-amber-200 hover:bg-amber-50"
            >
              <Unlock size={14} />
              Rouvrir
            </button>
          ) : (
            <button
              onClick={() => {
                setCountedAmount(String(summary.soldeTheorique));
                setShowClosingModal(true);
              }}
              className="btn btn-secondary text-xs py-2 px-3.5 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <Lock size={14} className="text-slate-500" />
              Clôturer la journée
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-xl border border-slate-200 bg-white/80 hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
            title="Imprimer le récapitulatif du jour"
          >
            <Printer size={16} />
          </button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Solde Théorique */}
        <div className="stat-card" style={{ "--card-accent": "#059669", "--card-accent-end": "#10b981" } as React.CSSProperties}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Solde Théorique en Caisse
              </p>
              <p className="text-2xl lg:text-3xl font-extrabold text-emerald-700 mt-2 font-tabular">
                {formatCurrency(summary.soldeTheorique)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
              <Banknote size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Fond du matin</span>
            <strong className="text-slate-700 font-semibold">{formatCurrency(summary.openingAmount)}</strong>
          </div>
        </div>

        {/* Visites du jour */}
        <div className="stat-card" style={{ "--card-accent": "#2563eb", "--card-accent-end": "#38bdf8" } as React.CSSProperties}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Visites / Séances du jour
              </p>
              <p className="text-2xl lg:text-3xl font-extrabold text-blue-700 mt-2 font-tabular">
                {formatCurrency(summary.totalVisites)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
              <Stethoscope size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Nombre de visites</span>
            <strong className="text-blue-700 font-semibold">
              {caisseData?.transactions.filter((t) => t.type === "VISITE").length || 0} séances
            </strong>
          </div>
        </div>

        {/* Forfaits mensuels */}
        <div className="stat-card" style={{ "--card-accent": "#0ea5e9", "--card-accent-end": "#06b6d4" } as React.CSSProperties}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Forfaits mensuels encaissés
              </p>
              <p className="text-2xl lg:text-3xl font-extrabold text-cyan-700 mt-2 font-tabular">
                {formatCurrency(summary.totalPaiementsMois)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center text-cyan-600 border border-cyan-100">
              <Calendar size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Forfaits d&apos;enfants</span>
            <strong className="text-cyan-700 font-semibold">
              {caisseData?.transactions.filter((t) => t.type === "PAIEMENT_MOIS").length || 0} enfants
            </strong>
          </div>
        </div>

        {/* Sorties de caisse */}
        <div className="stat-card" style={{ "--card-accent": "#ef4444", "--card-accent-end": "#f97316" } as React.CSSProperties}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Sorties & Dépenses cash
              </p>
              <p className="text-2xl lg:text-3xl font-extrabold text-red-600 mt-2 font-tabular">
                {formatCurrency(summary.totalSorties)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
              <ArrowDownRight size={24} />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Dépenses immédiates</span>
            <strong className="text-red-700 font-semibold">
              {caisseData?.transactions.filter((t) => t.type === "SORTIE").length || 0} sorties
            </strong>
          </div>
        </div>
      </div>

      {/* Modes de paiement breakdown chips */}
      <div className="flex flex-wrap items-center gap-3 bg-white/70 p-4 rounded-2xl border border-slate-200/80 backdrop-blur-md">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2 flex items-center gap-1.5">
          <Coins size={14} className="text-amber-500" />
          Répartition par mode :
        </span>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
          <Banknote size={14} className="text-emerald-600" />
          <span>Espèces (Cash) : <strong>{formatCurrency(summary.totalCash)}</strong></span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200">
          <Building size={14} className="text-blue-600" />
          <span>Virements : <strong>{formatCurrency(summary.totalVirement)}</strong></span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 text-xs font-semibold border border-purple-200">
          <CreditCard size={14} className="text-purple-600" />
          <span>Chèques : <strong>{formatCurrency(summary.totalCheque)}</strong></span>
        </div>
      </div>

      {/* Clôture Alert Banner if closed */}
      {isClosed && caisseData?.closing && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0">
              <Lock size={18} />
            </div>
            <div>
              <p className="text-sm font-bold">
                Caisse clôturée le {formatDate(selectedDate)} par {caisseData.closing.closedBy || "Admin"}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Espèces réelles comptées : <strong>{formatCurrency(caisseData.closing.closingAmount || 0)}</strong>
                {" • "}
                Écart : <strong className={Number(caisseData.closing.difference) === 0 ? "text-emerald-700" : "text-red-700"}>
                  {caisseData.closing.difference !== undefined && caisseData.closing.difference !== null
                    ? (caisseData.closing.difference > 0 ? `+${formatCurrency(caisseData.closing.difference)}` : formatCurrency(caisseData.closing.difference))
                    : "0 DH"}
                </strong>
                {caisseData.closing.notes && ` • Note: ${caisseData.closing.notes}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleReopenCaisse}
            className="btn btn-secondary text-xs py-1.5 px-3 self-start sm:self-auto border-amber-300 hover:bg-amber-100"
          >
            Déverrouiller
          </button>
        </div>
      )}

      {/* Journal Table of Transactions */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Banknote size={20} className="text-emerald-600" />
              Journal des Opérations de Caisse
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Historique chronologique des entrées et sorties pour le {formatDate(selectedDate)}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus size={15} />
            Nouvelle opération
          </button>
        </div>

        {loading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : !caisseData?.transactions || caisseData.transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3 rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote size={28} />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">Aucune opération enregistrée pour cette date</p>
              <p className="text-xs text-slate-500 mt-1">
                Cliquez sur le bouton ci-dessous pour ajouter un paiement de visite ou de forfait.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary text-xs mt-2"
            >
              <Plus size={14} />
              Ajouter sur la caisse
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Type d&apos;opération</th>
                  <th>Patient / Tiers</th>
                  <th>Description</th>
                  <th>Mode</th>
                  <th className="text-right">Montant</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {caisseData.transactions.map((tx) => {
                  const isSortie = tx.type === "SORTIE";
                  const timeStr = new Date(tx.time).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="text-xs text-slate-500 font-mono">{timeStr}</td>
                      <td>
                        {tx.type === "VISITE" && (
                          <span className="badge badge-info flex items-center gap-1.5 w-fit">
                            <Stethoscope size={11} />
                            Visite / Séance
                          </span>
                        )}
                        {tx.type === "PAIEMENT_MOIS" && (
                          <span className="badge badge-success flex items-center gap-1.5 w-fit">
                            <Calendar size={11} />
                            Paiement Mois
                          </span>
                        )}
                        {tx.type === "AUTRE_ENTREE" && (
                          <span className="badge bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5 w-fit">
                            <ArrowUpRight size={11} />
                            Entrée diverse
                          </span>
                        )}
                        {tx.type === "SORTIE" && (
                          <span className="badge badge-danger flex items-center gap-1.5 w-fit">
                            <ArrowDownRight size={11} />
                            Sortie cash
                          </span>
                        )}
                      </td>
                      <td>
                        {tx.patientName ? (
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Users size={13} className="text-slate-400" />
                            {tx.patientName}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="text-xs text-slate-600 max-w-xs truncate">
                        {tx.description || "—"}
                      </td>
                      <td>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {tx.paymentMethod === "CASH" ? "💵 Espèces" : tx.paymentMethod === "VIREMENT" ? "🏦 Virement" : "📝 Chèque"}
                        </span>
                      </td>
                      <td className="text-right font-bold font-tabular text-sm">
                        <span className={isSortie ? "text-red-600" : "text-emerald-700"}>
                          {isSortie ? `-${formatCurrency(tx.amount)}` : `+${formatCurrency(tx.amount)}`}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer cette opération"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Modal 1 : Ajouter sur la caisse ─────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
          <div className="glass-modal max-w-lg w-full p-6 sm:p-7 rounded-3xl shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    Ajouter sur la caisse
                  </h3>
                  <p className="text-xs text-slate-500">Date : {formatDate(selectedDate)}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-5">
              {/* Type selector visual cards */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Type d&apos;opération *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleTypeSelect("VISITE")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      txType === "VISITE"
                        ? "border-blue-500 bg-blue-50/80 shadow-xs ring-2 ring-blue-500/20"
                        : "border-slate-200 bg-white/60 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-blue-900">
                      <Stethoscope size={16} className="text-blue-600" />
                      Visite / Séance
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Séance ponctuelle ou bilan</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeSelect("PAIEMENT_MOIS")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      txType === "PAIEMENT_MOIS"
                        ? "border-emerald-500 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-white/60 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                      <Calendar size={16} className="text-emerald-600" />
                      Paiement de Mois
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Règlement forfait mensuel</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeSelect("AUTRE_ENTREE")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      txType === "AUTRE_ENTREE"
                        ? "border-purple-500 bg-purple-50/80 shadow-xs ring-2 ring-purple-500/20"
                        : "border-slate-200 bg-white/60 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-purple-900">
                      <ArrowUpRight size={16} className="text-purple-600" />
                      Autre Entrée
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Acompte, bilan externe...</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeSelect("SORTIE")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      txType === "SORTIE"
                        ? "border-red-500 bg-red-50/80 shadow-xs ring-2 ring-red-500/20"
                        : "border-slate-200 bg-white/60 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm text-red-900">
                      <ArrowDownRight size={16} className="text-red-600" />
                      Sortie de Caisse
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Dépense immédiate / courses</p>
                  </button>
                </div>
              </div>

              {/* Patient Selection */}
              {txType !== "SORTIE" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    {txType === "PAIEMENT_MOIS" ? "Patient abonné (Forfait) *" : "Patient (Optionnel)"}
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => handlePatientChange(e.target.value)}
                    required={txType === "PAIEMENT_MOIS"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">
                      {txType === "PAIEMENT_MOIS"
                        ? "— Sélectionner un enfant —"
                        : "— Visiteur ponctuel (Sans fiche) —"}
                    </option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} • Forfait: {p.monthlyFee} DH
                      </option>
                    ))}
                  </select>

                  {/* If Visite and no patient selected, allow typing visitor name */}
                  {txType === "VISITE" && !selectedPatientId && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Nom du visiteur / enfant (ex: Karim Tazi)"
                        value={customPatientName}
                        onChange={(e) => setCustomPatientName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Montant */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Montant (DH) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    required
                    placeholder="Ex: 200"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-900 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    DH
                  </span>
                </div>

                {/* Quick amount pills for visits */}
                {txType === "VISITE" && (
                  <div className="flex gap-2 mt-2">
                    {[150, 200, 250, 300].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTxAmount(String(amt))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                          txAmount === String(amt)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {amt} DH
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Mode de règlement
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "CASH", label: "💵 Espèces" },
                    { id: "VIREMENT", label: "🏦 Virement" },
                    { id: "CHEQUE", label: "📝 Chèque" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setTxMethod(m.id as PaymentMethod)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        txMethod === m.id
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-2xs ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Motif / Description
                </label>
                <input
                  type="text"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder="Ex: Séance de rééducation, bilan initial..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary text-xs py-2.5 px-4"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary text-xs py-2.5 px-6 shadow-md shadow-emerald-600/20 bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>{submitting ? "Enregistrement..." : "Enregistrer dans la caisse"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 2 : Définir le fond de caisse ─────────────────────── */}
      {showOpeningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
          <div className="glass-modal max-w-md w-full p-6 rounded-3xl shadow-2xl fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Coins size={20} className="text-amber-500" />
                <h3 className="text-lg font-bold text-slate-900">Fond de Caisse Initial</h3>
              </div>
              <button
                onClick={() => setShowOpeningModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Saisissez les espèces laissées dans le tiroir au début de la journée pour rendre la monnaie.
            </p>
            <form onSubmit={handleSetOpening} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Montant initial (DH)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={newOpeningAmount}
                  onChange={(e) => setNewOpeningAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-base font-bold text-slate-900"
                  placeholder="500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowOpeningModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary text-xs">
                  Valider le fond
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal 3 : Clôturer la journée ──────────────────────────── */}
      {showClosingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md">
          <div className="glass-modal max-w-md w-full p-6 sm:p-7 rounded-3xl shadow-2xl fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Lock size={20} className="text-slate-700" />
                <h3 className="text-lg font-bold text-slate-900">Clôture de Caisse Journalière</h3>
              </div>
              <button
                onClick={() => setShowClosingModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Fond de caisse :</span>
                <strong>{formatCurrency(summary.openingAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Recettes totales :</span>
                <strong className="text-emerald-700">+{formatCurrency(summary.totalEntrees)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Dépenses cash :</span>
                <strong className="text-red-600">-{formatCurrency(summary.totalSorties)}</strong>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-sm text-slate-900">
                <span>Solde théorique attendu :</span>
                <span className="text-emerald-700 font-extrabold">{formatCurrency(summary.soldeTheorique)}</span>
              </div>
            </div>

            <form onSubmit={handleCloseCaisse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Espèces réelles comptées dans le tiroir *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={countedAmount}
                    onChange={(e) => setCountedAmount(e.target.value)}
                    required
                    placeholder={String(summary.soldeTheorique)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-base font-bold text-slate-900 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    DH
                  </span>
                </div>
                {countedAmount && (
                  <p className="text-xs font-semibold mt-2">
                    Écart :{" "}
                    {Number(countedAmount) - summary.soldeTheorique === 0 ? (
                      <span className="text-emerald-600">✓ Parfait (aucun écart)</span>
                    ) : Number(countedAmount) - summary.soldeTheorique > 0 ? (
                      <span className="text-blue-600">
                        + {formatCurrency(Number(countedAmount) - summary.soldeTheorique)} (Excédent de caisse)
                      </span>
                    ) : (
                      <span className="text-red-600">
                        - {formatCurrency(Math.abs(Number(countedAmount) - summary.soldeTheorique))} (Manquant de caisse)
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Notes de clôture
                </label>
                <textarea
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  rows={2}
                  placeholder="Remarques éventuelles sur la journée..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowClosingModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs py-2 px-5 bg-slate-900 hover:bg-black text-white"
                >
                  Valider la clôture
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
