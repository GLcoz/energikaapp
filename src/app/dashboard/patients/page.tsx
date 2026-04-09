"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  Edit2,
  Trash2,
  Eye,
  X,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { demoPatients, demoBillings } from "@/lib/demo-data";
import type { Patient, User } from "@/lib/types";

export default function PatientsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>(demoPatients);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    monthlyFee: 1200,
    startDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("energika_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const isOrtho = String(user?.role ?? "").toUpperCase() === "ORTHO";

  const filteredPatients = patients.filter(
    (p) =>
      `${p.firstName} ${p.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      p.parentPhone.includes(searchTerm)
  );

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    const patient: Patient = {
      id: `p${Date.now()}`,
      ...newPatient,
      isActive: true,
      therapistId: user?.id || "2",
      createdAt: new Date().toISOString(),
    };
    setPatients([...patients, patient]);
    setShowAddModal(false);
    setNewPatient({
      firstName: "",
      lastName: "",
      parentName: "",
      parentPhone: "",
      parentEmail: "",
      monthlyFee: 1200,
      startDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  const handleDeletePatient = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce patient ?")) {
      setPatients(patients.filter((p) => p.id !== id));
      if (selectedPatient?.id === id) setSelectedPatient(null);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            Patients
          </h1>
          <p className="page-subtitle">
            {filteredPatients.length} patient{filteredPatients.length > 1 ? "s" : ""} enregistré{filteredPatients.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus size={18} />
          Nouveau Patient
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <input
          type="text"
          placeholder="Rechercher par nom ou téléphone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all"
        />
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredPatients.map((patient) => {
          const billing = demoBillings.find(
            (b) =>
              b.patientId === patient.id &&
              b.month === new Date().getMonth() + 1
          );

          return (
            <div key={patient.id} className="card p-5 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                    {patient.firstName[0]}
                    {patient.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">
                      {patient.firstName} {patient.lastName}
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Depuis {formatDate(patient.startDate)}
                    </p>
                  </div>
                </div>
                {!isOrtho && (
                  <span
                    className={`badge ${
                      billing?.status === "PAID"
                        ? "badge-success"
                        : billing?.status === "PARTIAL"
                        ? "badge-warning"
                        : "badge-danger"
                    }`}
                  >
                    {billing?.status === "PAID"
                      ? "Payé"
                      : billing?.status === "PARTIAL"
                      ? "Partiel"
                      : "Impayé"}
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <span>{patient.parentPhone}</span>
                </div>
                {patient.parentName && (
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    <span>{patient.parentName}</span>
                  </div>
                )}
                {!isOrtho && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    <span>Forfait: {formatCurrency(patient.monthlyFee)}/mois</span>
                  </div>
                )}
              </div>

              {patient.notes && (
                <p className="mt-3 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] rounded-lg p-3 line-clamp-2">
                  {patient.notes}
                </p>
              )}

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--color-border-light)]">
                <button
                  onClick={() => setSelectedPatient(patient)}
                  className="flex-1 btn btn-secondary text-xs py-2"
                >
                  <Eye size={14} />
                  Voir
                </button>
                <button className="btn btn-secondary text-xs py-2 px-3">
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDeletePatient(patient.id)}
                  className="btn text-xs py-2 px-3 text-red-500 hover:bg-red-50 border border-[var(--color-border-default)]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                Dossier Patient
              </h2>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
                {selectedPatient.firstName[0]}
                {selectedPatient.lastName[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {selectedPatient.dateOfBirth
                    ? formatDate(selectedPatient.dateOfBirth)
                    : "Date de naissance non renseignée"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                  <p className="text-xs text-[var(--color-text-muted)]">Parent</p>
                  <p className="text-sm font-medium">{selectedPatient.parentName || "—"}</p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                  <p className="text-xs text-[var(--color-text-muted)]">Téléphone</p>
                  <p className="text-sm font-medium">{selectedPatient.parentPhone}</p>
                </div>
                {!isOrtho && (
                  <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                    <p className="text-xs text-[var(--color-text-muted)]">Forfait</p>
                    <p className="text-sm font-medium">{formatCurrency(selectedPatient.monthlyFee)}</p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                  <p className="text-xs text-[var(--color-text-muted)]">Début PEC</p>
                  <p className="text-sm font-medium">{formatDate(selectedPatient.startDate)}</p>
                </div>
              </div>

              {selectedPatient.notes && (
                <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)]">
                  <p className="text-xs text-[var(--color-text-muted)] mb-1">Notes cliniques</p>
                  <p className="text-sm">{selectedPatient.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <a
                href={`tel:${selectedPatient.parentPhone}`}
                className="flex-1 btn btn-secondary"
              >
                <Phone size={16} />
                Appeler
              </a>
              {selectedPatient.parentEmail && (
                <a
                  href={`mailto:${selectedPatient.parentEmail}`}
                  className="flex-1 btn btn-secondary"
                >
                  <Mail size={16} />
                  Email
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                Nouveau Patient
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddPatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPatient.firstName}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, firstName: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    placeholder="Prénom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPatient.lastName}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, lastName: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    placeholder="Nom de famille"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Nom du parent
                </label>
                <input
                  type="text"
                  value={newPatient.parentName}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, parentName: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  placeholder="Nom complet du parent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Téléphone parent *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPatient.parentPhone}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, parentPhone: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    placeholder="06XXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Email parent
                  </label>
                  <input
                    type="email"
                    value={newPatient.parentEmail}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, parentEmail: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    placeholder="email@exemple.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {!isOrtho && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                      Forfait mensuel (DH) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newPatient.monthlyFee}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          monthlyFee: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    />
                  </div>
                )}
                <div className={isOrtho ? "col-span-2" : ""}>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    required
                    value={newPatient.startDate}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Notes cliniques
                </label>
                <textarea
                  value={newPatient.notes}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none"
                  placeholder="Observations, diagnostic, etc."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  <Plus size={16} />
                  Ajouter le patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
