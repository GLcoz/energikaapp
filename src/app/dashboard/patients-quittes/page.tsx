"use client";

import { useEffect, useState } from "react";
import { Search, UserMinus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Patient } from "@/lib/types";

export default function PatientsQuittesPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/patients", { cache: "no-store" });
        if (!response.ok) return;
        setPatients((await response.json()) as Patient[]);
      } catch {
        // keep empty on error
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const exitedPatients = patients.filter((patient) => !patient.isActive);

  const filteredPatients = exitedPatients.filter((patient) => {
    const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    const query = searchTerm.toLowerCase();

    return (
      fullName.includes(query) ||
      patient.parentPhone.includes(searchTerm) ||
      (patient.exitReason || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <UserMinus className="w-5 h-5 text-white" />
            </div>
            Patients quittés
          </h1>
          <p className="page-subtitle">
            {filteredPatients.length} patient
            {filteredPatients.length > 1 ? "s" : ""} enregistré
            {filteredPatients.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <input
          type="text"
          placeholder="Rechercher par nom, téléphone ou cause..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all"
        />
      </div>

      {loading && (
        <div className="card p-6">
          <div className="space-y-3">
            <div className="skeleton h-4 rounded w-1/3" />
            <div className="skeleton h-4 rounded w-full" />
            <div className="skeleton h-4 rounded w-full" />
            <div className="skeleton h-4 rounded w-2/3" />
          </div>
        </div>
      )}

      {!loading && filteredPatients.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
          <UserMinus className="w-10 h-10 text-[var(--color-text-muted)]" />
          <p className="text-[var(--color-text-muted)] text-sm">
            Aucun patient quitté pour le moment.
          </p>
        </div>
      )}

      {!loading && filteredPatients.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-light)]">
                  <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] px-4 py-3 uppercase tracking-wide">
                    Patient
                  </th>
                  <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] px-4 py-3 uppercase tracking-wide">
                    Téléphone parent
                  </th>
                  <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] px-4 py-3 uppercase tracking-wide">
                    Date d&apos;inscription
                  </th>
                  <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] px-4 py-3 uppercase tracking-wide">
                    Date de sortie
                  </th>
                  <th className="text-left text-xs font-semibold text-[var(--color-text-muted)] px-4 py-3 uppercase tracking-wide">
                    Cause
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="border-b border-[var(--color-border-light)] last:border-b-0"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-[var(--color-text-primary)]">
                      {patient.firstName} {patient.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                      {patient.parentPhone}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                      {formatDate(patient.startDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                      {patient.exitDate ? formatDate(patient.exitDate) : "Non renseignée"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                      {patient.exitReason || "Non renseignée"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
