"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  MessageCircle,
  Phone,
  Send,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, getMonthName, generateWhatsAppMessage } from "@/lib/utils";
import type { Patient, MonthlyBilling } from "@/lib/types";

export default function RelancesPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [billings, setBillings] = useState<MonthlyBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentReminders, setSentReminders] = useState<Set<string>>(new Set());

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, bRes] = await Promise.all([
        fetch("/api/patients", { cache: "no-store" }),
        fetch("/api/billings", { cache: "no-store" }),
      ]);
      if (pRes.ok) setPatients((await pRes.json()) as Patient[]);
      if (bRes.ok) setBillings((await bRes.json()) as MonthlyBilling[]);
    } catch {
      // keep empty on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const markSent = (id: string) => {
    setSentReminders(new Set([...sentReminders, id]));
  };

  // We find all unpaid billings (PENDING or PARTIAL status)
  const unpaid = billings
    .filter((b) => b.status !== "PAID")
    .map((b) => ({
      ...b,
      patient: patients.find((p) => p.id === b.patientId),
    }))
    .filter((b) => b.patient) as (MonthlyBilling & { patient: Patient })[];

  if (loading) {
    return (
      <div className="space-y-6 fade-in">
        <div className="skeleton h-8 w-64 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="stat-card">
              <div className="skeleton h-4 w-32 rounded mb-3" />
              <div className="skeleton h-8 w-16 rounded" />
            </div>
          ))}
        </div>
        <div className="card p-6 h-48 skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            Relances
          </h1>
          <p className="page-subtitle">
            Rappels de paiement — {getMonthName(currentMonth)} {currentYear}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="stat-card" style={{ "--card-accent": "#ef4444", "--card-accent-end": "#f97316" } as React.CSSProperties}>
          <p className="text-sm text-[var(--color-text-muted)]">Impayés</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{unpaid.length}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">total de forfaits en attente</p>
        </div>
        <div className="stat-card" style={{ "--card-accent": "#f59e0b", "--card-accent-end": "#f97316" } as React.CSSProperties}>
          <p className="text-sm text-[var(--color-text-muted)]">Montant total dû</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">
            {formatCurrency(
              unpaid.reduce((sum, u) => sum + (u.amountDue - u.amountPaid), 0)
            )}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">à récupérer</p>
        </div>
        <div className="stat-card" style={{ "--card-accent": "#10b981", "--card-accent-end": "#059669" } as React.CSSProperties}>
          <p className="text-sm text-[var(--color-text-muted)]">Relances envoyées</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {sentReminders.size}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            sur {unpaid.length}
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
        <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">
            Envoi de rappels via WhatsApp
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Cliquez sur le bouton WhatsApp pour ouvrir un message pré-rempli à
            envoyer au parent du patient. Le numéro sera automatiquement formaté
            au format international marocain (+212).
          </p>
        </div>
      </div>

      {/* Unpaid List */}
      {unpaid.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
            Aucun impayé 🎉
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Tous les patients ont réglé leur forfait.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {unpaid.map((item) => {
            const remaining = item.amountDue - item.amountPaid;
            const whatsappUrl = generateWhatsAppMessage(
              item.patient.parentPhone,
              `${item.patient.firstName} ${item.patient.lastName}`,
              getMonthName(item.month),
              remaining
            );
            const isSent = sentReminders.has(item.id);

            return (
              <div
                key={item.id}
                className="card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                {/* Patient Info */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                      {item.patient.firstName[0]}
                      {item.patient.lastName[0]}
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white pulse-dot" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">
                      {item.patient.firstName} {item.patient.lastName}
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Parent: {item.patient.parentName || "—"} •{" "}
                      {item.patient.parentPhone}
                    </p>
                    <p className="text-xs font-medium text-[var(--color-text-secondary)] mt-0.5">
                      Forfait de {getMonthName(item.month)} {item.year}
                    </p>
                  </div>
                </div>

                {/* Amount Info */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Restant
                    </p>
                    <p className="text-lg font-bold text-red-600">
                      {formatCurrency(remaining)}
                    </p>
                  </div>

                  <span
                    className={`badge ${
                      item.status === "PARTIAL"
                        ? "badge-warning"
                        : "badge-danger"
                    }`}
                  >
                    {item.status === "PARTIAL" ? "Partiel" : "Impayé"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 w-full sm:w-auto">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markSent(item.id)}
                    className="flex-1 sm:flex-none btn btn-whatsapp text-sm"
                  >
                    <Send size={14} />
                    WhatsApp
                    <ExternalLink size={12} />
                  </a>
                  <a
                    href={`tel:${item.patient.parentPhone}`}
                    className="flex-1 sm:flex-none btn btn-secondary text-sm"
                  >
                    <Phone size={14} />
                    Appeler
                  </a>
                </div>

                {isSent && (
                  <span className="text-xs text-green-600 font-medium whitespace-nowrap">
                    ✓ Envoyé
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
