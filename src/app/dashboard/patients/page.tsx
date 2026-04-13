"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  Calendar,
  Edit2,
  Trash2,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { demoPatients, demoBillings, demoSessions } from "@/lib/demo-data";
import type { Patient, Session, User } from "@/lib/types";

export default function PatientsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>(demoPatients);
  const [sessions, setSessions] = useState<Session[]>(demoSessions);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editCoordinates, setEditCoordinates] = useState({
    parentName: "",
    parentPhone: "",
  });
  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    parentName: "",
    parentPhone: "",
    monthlyFee: 1200,
    startDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("energika_user");
    if (stored) setUser(JSON.parse(stored));

    const loadData = async () => {
      try {
        const [patientsRes, sessionsRes] = await Promise.all([
          fetch("/api/patients", { cache: "no-store" }),
          fetch("/api/sessions", { cache: "no-store" }),
        ]);

        if (patientsRes.ok) {
          const patientsData = (await patientsRes.json()) as Patient[];
          setPatients(patientsData);
        }

        if (sessionsRes.ok) {
          const sessionsData = (await sessionsRes.json()) as Session[];
          setSessions(sessionsData);
        }
      } catch {
        setPatients(demoPatients);
        setSessions(demoSessions);
      }
    };

    void loadData();
  }, []);

  const isOrtho = String(user?.role ?? "").toUpperCase() === "ORTHO";

  const filteredPatients = patients.filter(
    (p) =>
      `${p.firstName} ${p.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      p.parentPhone.includes(searchTerm)
  );

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPatient,
          therapistId: user?.id,
          therapistEmail: user?.email,
          therapistFirstName: user?.firstName,
          therapistLastName: user?.lastName,
          therapistRole: user?.role,
        }),
      });

      if (!response.ok) return;

      const created = (await response.json()) as Patient;
      setPatients((prev) => [created, ...prev]);
      setShowAddModal(false);
      setNewPatient({
        firstName: "",
        lastName: "",
        parentName: "",
        parentPhone: "",
        monthlyFee: 1200,
        startDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
    } catch {
      // keep UI unchanged on network/server error
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce patient ?")) {
      try {
        const response = await fetch(`/api/patients/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) return;

        setPatients((prev) => prev.filter((p) => p.id !== id));
        if (selectedPatient?.id === id) setSelectedPatient(null);
        if (editingPatient?.id === id) {
          setEditingPatient(null);
          setShowEditModal(false);
        }
      } catch {
        // keep UI unchanged on network/server error
      }
    }
  };

  const openEditCoordinatesModal = (patient: Patient) => {
    setEditingPatient(patient);
    setEditCoordinates({
      parentName: patient.parentName ?? "",
      parentPhone: patient.parentPhone,
    });
    setShowEditModal(true);
  };

  const handleUpdateCoordinates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;

    try {
      const response = await fetch(`/api/patients/${editingPatient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editCoordinates),
      });

      if (!response.ok) return;

      const updated = (await response.json()) as Patient;

      setPatients((prev) =>
        prev.map((patient) => (patient.id === editingPatient.id ? updated : patient))
      );

      if (selectedPatient?.id === editingPatient.id) {
        setSelectedPatient(updated);
      }

      setShowEditModal(false);
      setEditingPatient(null);
    } catch {
      // keep UI unchanged on network/server error
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
                <button
                  onClick={() => openEditCoordinatesModal(patient)}
                  className="btn btn-secondary text-xs py-2 px-3"
                >
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

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Séances (accordéon)
                  </p>
                  <button
                    onClick={() => openEditCoordinatesModal(selectedPatient)}
                    className="btn btn-secondary text-xs py-2 px-3"
                  >
                    <Edit2 size={14} />
                    Modifier coordonnées
                  </button>
                </div>

                <div className="space-y-2">
                  {sessions
                    .filter((session) => session.patientId === selectedPatient.id)
                    .sort(
                      (a, b) =>
                        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                    )
                    .map((session) => {
                      const isOpen = openSessionId === session.id;
                      return (
                        <div
                          key={session.id}
                          className="rounded-xl border border-[var(--color-border-light)]"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenSessionId((prev) =>
                                prev === session.id ? null : session.id
                              )
                            }
                            className="w-full p-3 flex items-center justify-between text-left"
                          >
                            <div>
                              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                {new Date(session.startTime).toLocaleString("fr-FR", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              <p className="text-xs text-[var(--color-text-muted)]">
                                {session.isCompleted ? "Terminée" : "Planifiée"}
                              </p>
                            </div>
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>

                          {isOpen && (
                            <div className="px-3 pb-3 text-sm text-[var(--color-text-secondary)] border-t border-[var(--color-border-light)] pt-2">
                              {session.notes || "Aucune note sur cette séance."}
                            </div>
                          )}
                        </div>
                      );
                    })}

                  {sessions.filter((session) => session.patientId === selectedPatient.id)
                    .length === 0 && (
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Aucune séance pour ce patient.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <a
                href={`tel:${selectedPatient.parentPhone}`}
                className="flex-1 btn btn-secondary"
              >
                <Phone size={16} />
                Appeler
              </a>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                Modifier coordonnées
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPatient(null);
                }}
                className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateCoordinates} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Nom du parent
                </label>
                <input
                  type="text"
                  value={editCoordinates.parentName}
                  onChange={(e) =>
                    setEditCoordinates((prev) => ({
                      ...prev,
                      parentName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Téléphone parent *
                </label>
                <input
                  type="tel"
                  required
                  value={editCoordinates.parentPhone}
                  onChange={(e) =>
                    setEditCoordinates((prev) => ({
                      ...prev,
                      parentPhone: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPatient(null);
                  }}
                  className="flex-1 btn btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  Enregistrer
                </button>
              </div>
            </form>
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

              <div>
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
