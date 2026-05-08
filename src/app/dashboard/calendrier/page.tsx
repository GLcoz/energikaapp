"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Calendar as CalendarIcon, Plus, X, ChevronDown, ChevronUp, UserX, Edit2, Trash2, Handshake } from "lucide-react";
import type { Session, Patient, User } from "@/lib/types";

// Dynamic import FullCalendar to avoid SSR issues
const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-3 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
    </div>
  ),
});

// Import FullCalendar plugins dynamically
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";

export default function CalendrierPage() {
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSessionError, setAddSessionError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Session | null>(null);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);
  const [newSession, setNewSession] = useState({
    patientId: "",
    startTime: "",
    endTime: "",
    room: "",
    notes: "",
    isSubcontracted: false,
    subcontractorName: "",
    subcontractorPhone: "",
    subcontractorNotes: "",
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSession, setEditSession] = useState({
    id: "",
    patientId: "",
    startTime: "",
    endTime: "",
    room: "",
    notes: "",
    isSubcontracted: false,
    subcontractorName: "",
    subcontractorPhone: "",
    subcontractorNotes: "",
  });
  const [editSessionError, setEditSessionError] = useState("");

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
          setPatients((await patientsRes.json()) as Patient[]);
        }
        if (sessionsRes.ok) {
          setSessions((await sessionsRes.json()) as Session[]);
        }
      } catch {
        // keep empty — no demo fallback
      }
    };

    void loadData();
  }, []);

  const currentMonth = new Date().getMonth() + 1;

  // Transform sessions to FullCalendar events
  const events = sessions.map((session) => {
    const patient = patients.find((p) => p.id === session.patientId);

    // Priority: absent (orange) > subcontracted (purple) > completed (green) > planned (blue)
    const bgColor = session.isAbsent
      ? "#f97316"
      : session.isSubcontracted
      ? "#8b5cf6"
      : session.isCompleted
      ? "#10b981"
      : "#1e6bb8";
    const borderColor = session.isAbsent
      ? "#ea580c"
      : session.isSubcontracted
      ? "#7c3aed"
      : session.isCompleted
      ? "#059669"
      : "#1e40af";

    const roomLabel = session.room ? ` [${session.room}]` : "";
    const nameLabel = `${patient?.firstName} ${patient?.lastName}`;

    return {
      id: session.id,
      title: session.isAbsent
        ? `🚫 ${nameLabel}${roomLabel}`
        : session.isSubcontracted
        ? `🤝 ${nameLabel}${roomLabel}`
        : `${nameLabel}${roomLabel}`,
      start: session.startTime,
      end: session.endTime,
      backgroundColor: bgColor,
      borderColor,
      textColor: "#ffffff",
      extendedProps: {
        sessionId: session.id,
        patientId: session.patientId,
        isCompleted: session.isCompleted,
        isAbsent: session.isAbsent,
        room: session.room,
        notes: session.notes,
      },
    };
  });

  const handleDateClick = (info: { date: Date; dateStr: string }) => {
    setAddSessionError("");
    
    // For datetime-local input, we need YYYY-MM-DDTHH:mm
    // We adjust for timezone offset to get the correct local time string
    const start = info.date;
    const offset = start.getTimezoneOffset() * 60000;
    const localStart = new Date(start.getTime() - offset).toISOString().slice(0, 16);
    
    // Default duration: 45 minutes
    const end = new Date(start.getTime() + 45 * 60000);
    const localEnd = new Date(end.getTime() - offset).toISOString().slice(0, 16);

    setNewSession({
      patientId: "",
      startTime: localStart,
      endTime: localEnd,
      room: "",
      notes: "",
      isSubcontracted: false,
      subcontractorName: "",
      subcontractorPhone: "",
      subcontractorNotes: "",
    });
    setShowAddModal(true);
  };

  const handleEventClick = (info: { event: { id: string } }) => {
    const session = sessions.find((s) => s.id === info.event.id);
    if (session) setSelectedEvent(session);
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSessionError("");
    const patient = patients.find((p) => p.id === newSession.patientId);
    if (!patient) {
      setAddSessionError("Veuillez sélectionner un patient.");
      return;
    }
    if (new Date(newSession.endTime) <= new Date(newSession.startTime)) {
      setAddSessionError("L'heure de fin doit être après l'heure de début.");
      return;
    }

    // Calculate subcontractor fee: 50% of per-session cost
    // Per-session cost = monthlyFee / total sessions per month (derived from all sessions this month for this patient)
    const sessionsThisMonth = sessions.filter((s) => {
      const d = new Date(s.startTime);
      const sessionMonth = d.getMonth() + 1;
      const sessionYear = d.getFullYear();
      return s.patientId === patient.id && sessionMonth === currentMonth && sessionYear === new Date().getFullYear();
    }).length + 1; // +1 for the one being created
    const perSessionCost = patient.monthlyFee / Math.max(sessionsThisMonth, 1);
    const subFee = Math.round(perSessionCost / 2 * 100) / 100;

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Séance - ${patient.firstName} ${patient.lastName}`,
          startTime: new Date(newSession.startTime).toISOString(),
          endTime: new Date(newSession.endTime).toISOString(),
          room: newSession.room || null,
          notes: newSession.notes,
          patientId: newSession.patientId,
          therapistId: user?.id,
          therapistEmail: user?.email,
          therapistFirstName: user?.firstName,
          therapistLastName: user?.lastName,
          therapistRole: user?.role,
          isSubcontracted: newSession.isSubcontracted,
          subcontractorName: newSession.subcontractorName || null,
          subcontractorPhone: newSession.subcontractorPhone || null,
          subcontractorFee: newSession.isSubcontracted ? subFee : null,
          subcontractorNotes: newSession.subcontractorNotes || null,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setAddSessionError(errorData?.error || "Impossible de créer la séance.");
        return;
      }

      const created = (await response.json()) as Session;
      setSessions((prev) =>
        [...prev, created].sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        )
      );
      setShowAddModal(false);
    } catch {
      setAddSessionError("Erreur réseau. Veuillez réessayer.");
    }
  };

  const toggleComplete = async (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !target.isCompleted }),
      });
      if (!response.ok) return;
      const updated = (await response.json()) as Session;
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
      setSelectedEvent(updated);
    } catch {
      // keep UI unchanged on network/server error
    }
  };

  const toggleAbsent = async (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isAbsent: !target.isAbsent,
          isCompleted: target.isAbsent ? target.isCompleted : false,
        }),
      });
      if (!response.ok) return;
      const updated = (await response.json()) as Session;
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
      setSelectedEvent(updated);
    } catch {
      // keep UI unchanged on network/server error
    }
  };

  const openEditModal = (session: Session) => {
    const offset = new Date(session.startTime).getTimezoneOffset() * 60000;
    const toLocal = (iso: string) =>
      new Date(new Date(iso).getTime() - offset).toISOString().slice(0, 16);
    setEditSession({
      id: session.id,
      patientId: session.patientId,
      startTime: toLocal(session.startTime),
      endTime: toLocal(session.endTime),
      room: session.room ?? "",
      notes: session.notes ?? "",
      isSubcontracted: session.isSubcontracted ?? false,
      subcontractorName: session.subcontractorName ?? "",
      subcontractorPhone: session.subcontractorPhone ?? "",
      subcontractorNotes: session.subcontractorNotes ?? "",
    });
    setEditSessionError("");
    setShowEditModal(true);
    setSelectedEvent(null);
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSessionError("");
    if (new Date(editSession.endTime) <= new Date(editSession.startTime)) {
      setEditSessionError("L'heure de fin doit être après l'heure de début.");
      return;
    }
    try {
      const patient = patients.find((p) => p.id === editSession.patientId);
      // Recalculate fee for subcontracted sessions
      const sessionsThisMonthForPatient = sessions.filter((s) => {
        const d = new Date(s.startTime);
        return s.patientId === editSession.patientId && d.getMonth() + 1 === currentMonth && d.getFullYear() === new Date().getFullYear();
      }).length || 1;
      const editPerSessionCost = (patient?.monthlyFee ?? 0) / sessionsThisMonthForPatient;
      const editSubFee = Math.round(editPerSessionCost / 2 * 100) / 100;

      const response = await fetch(`/api/sessions/${editSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: patient ? `Séance - ${patient.firstName} ${patient.lastName}` : undefined,
          startTime: new Date(editSession.startTime).toISOString(),
          endTime: new Date(editSession.endTime).toISOString(),
          room: editSession.room || null,
          notes: editSession.notes,
          patientId: editSession.patientId,
          isSubcontracted: editSession.isSubcontracted,
          subcontractorName: editSession.subcontractorName || null,
          subcontractorPhone: editSession.subcontractorPhone || null,
          subcontractorFee: editSession.isSubcontracted ? editSubFee : null,
          subcontractorNotes: editSession.subcontractorNotes || null,
        }),
      });
      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as { error?: string } | null;
        setEditSessionError(err?.error || "Impossible de modifier la séance.");
        return;
      }
      const updated = (await response.json()) as Session;
      setSessions((prev) => prev.map((s) => (s.id === editSession.id ? updated : s)));
      setShowEditModal(false);
    } catch {
      setEditSessionError("Erreur réseau. Veuillez réessayer.");
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm("Supprimer cette séance définitivement ?")) return;
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      if (!response.ok) return;
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setSelectedEvent(null);
    } catch {
      // keep UI unchanged on error
    }
  };

  const handleSessionMoveOrResize = async (info: {
    event: { id: string; start: Date | null; end: Date | null };
  }) => {
    if (!info.event.start || !info.event.end) return;

    try {
      const response = await fetch(`/api/sessions/${info.event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: info.event.start.toISOString(),
          endTime: info.event.end.toISOString(),
        }),
      });

      if (!response.ok) return;

      const updated = (await response.json()) as Session;
      setSessions((prev) =>
        prev.map((session) => (session.id === info.event.id ? updated : session))
      );
    } catch {
      // keep UI unchanged on network/server error
    }
  };

  const orderedSessions = [...sessions].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            {user?.role === "ORTHO" ? "Mon Calendrier" : "Calendrier"}
          </h1>
          <p className="page-subtitle">
            Planning des séances • Cliquez sur un jour pour ajouter une séance
          </p>
        </div>
        <button
          onClick={() => {
            setAddSessionError("");
            const now = new Date();
            const offset = now.getTimezoneOffset() * 60000;
            const today = new Date(now.getTime() - offset).toISOString().split("T")[0];
            setNewSession({
              patientId: "",
              startTime: `${today}T09:00`,
              endTime: `${today}T09:45`,
              room: "",
              notes: "",
              isSubcontracted: false,
              subcontractorName: "",
              subcontractorPhone: "",
              subcontractorNotes: "",
            });
            setShowAddModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={18} />
          Nouvelle Séance
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[var(--color-primary)]" />
          <span className="text-[var(--color-text-muted)]">Planifiée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-[var(--color-text-muted)]">Terminée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-[var(--color-text-muted)]">Patient absent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-violet-500" />
          <span className="text-[var(--color-text-muted)]">Sous-traitée</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="card p-4 lg:p-6">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          locale="fr"
          events={events}
          dateClick={handleDateClick as any}
          eventClick={handleEventClick}
          eventDrop={handleSessionMoveOrResize}
          eventResize={handleSessionMoveOrResize}
          editable={true}
          selectable={true}
          dayMaxEvents={3}
          height="800px"
          slotEventOverlap={true}
          eventOverlap={true}
          buttonText={{
            today: "Aujourd'hui",
            month: "Mois",
            week: "Semaine",
            day: "Jour",
            list: "Liste",
          }}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          allDaySlot={false}
          slotDuration="00:30:00"
          snapDuration="00:05:00"
          slotLabelInterval="01:00"
          expandRows={true}
          nowIndicator={true}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5, 6],
            startTime: "09:00",
            endTime: "19:00",
          }}
          eventDisplay="block"
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false,
            hour12: false,
          }}
        />
      </div>

      <div className="card p-4 lg:p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Séances (accordéon)
        </h2>

        <div className="space-y-3">
          {orderedSessions.length === 0 && (
            <p className="text-sm text-[var(--color-text-muted)]">
              Aucune séance planifiée.
            </p>
          )}

          {orderedSessions.map((session) => {
            const patient = patients.find((p) => p.id === session.patientId);
            const isOpen = openSessionId === session.id;

            return (
              <div
                key={session.id}
                className={`rounded-xl border bg-white ${
                  session.isAbsent
                    ? "border-orange-200"
                    : session.isSubcontracted
                    ? "border-violet-200"
                    : "border-[var(--color-border-light)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenSessionId((prev) => (prev === session.id ? null : session.id))
                  }
                  className="w-full flex items-center justify-between gap-3 p-4 text-left"
                >
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {patient?.firstName} {patient?.lastName}
                      {session.room && (
                        <span className="ml-2 text-xs font-normal bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          Salle {session.room}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {new Date(session.startTime).toLocaleString("fr-FR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {session.isAbsent && (
                      <span className="badge" style={{ background: "#fed7aa", color: "#c2410c" }}>
                        Absent
                      </span>
                    )}
                    {session.isSubcontracted && (
                      <span className="badge" style={{ background: "#ede9fe", color: "#6d28d9" }}>
                        🤝 Sous-traitée
                      </span>
                    )}
                    {!session.isAbsent && (
                      <span className={`badge ${session.isCompleted ? "badge-success" : "badge-info"}`}>
                        {session.isCompleted ? "Terminée" : "Planifiée"}
                      </span>
                    )}
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-[var(--color-border-light)] space-y-3">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {session.notes || "Aucune note pour cette séance."}
                    </p>
                    <div className="flex gap-2">
                      {!session.isAbsent && (
                        <button
                          onClick={() => void toggleComplete(session.id)}
                          className={`btn ${session.isCompleted ? "btn-secondary" : "btn-primary"}`}
                        >
                          {session.isCompleted ? "Marquer non terminée" : "Marquer terminée"}
                        </button>
                      )}
                      <button
                        onClick={() => void toggleAbsent(session.id)}
                        className={`btn ${
                          session.isAbsent
                            ? "btn-secondary"
                            : "text-orange-600 hover:bg-orange-50 border border-[var(--color-border-default)]"
                        }`}
                      >
                        <UserX size={14} />
                        {session.isAbsent ? "Annuler absence" : "Patient absent"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                Détail de la séance
              </h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
              >
                <X size={20} />
              </button>
            </div>

            {(() => {
              const patient = patients.find(
                (p) => p.id === selectedEvent.patientId
              );
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                      {patient?.firstName[0]}
                      {patient?.lastName[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-text-primary)]">
                        {patient?.firstName} {patient?.lastName}
                      </h3>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {patient?.notes}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                      <p className="text-xs text-[var(--color-text-muted)]">Début</p>
                      <p className="text-sm font-medium">
                        {new Date(selectedEvent.startTime).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                      <p className="text-xs text-[var(--color-text-muted)]">Fin</p>
                      <p className="text-sm font-medium">
                        {new Date(selectedEvent.endTime).toLocaleString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {selectedEvent.room && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <p className="text-xs text-blue-600 font-medium">Salle</p>
                      <p className="text-sm font-bold text-blue-800">{selectedEvent.room}</p>
                    </div>
                  )}

                  {selectedEvent.isSubcontracted && (
                    <div className="p-4 rounded-lg bg-violet-50 border border-violet-200 space-y-2">
                      <p className="text-xs font-semibold text-violet-700 flex items-center gap-1.5">
                        <Handshake size={14} /> Séance sous-traitée
                      </p>
                      {selectedEvent.subcontractorName && (
                        <p className="text-sm text-violet-900">
                          <span className="font-medium">Orthophoniste :</span> {selectedEvent.subcontractorName}
                        </p>
                      )}
                      {selectedEvent.subcontractorPhone && (
                        <p className="text-sm text-violet-900">
                          <span className="font-medium">Tél :</span> {selectedEvent.subcontractorPhone}
                        </p>
                      )}
                      {selectedEvent.subcontractorFee != null && (
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div className="p-2 rounded bg-violet-100/60 text-center">
                            <p className="text-[10px] text-violet-600">Ortho</p>
                            <p className="text-sm font-bold text-violet-800">{selectedEvent.subcontractorFee} DH</p>
                          </div>
                          <div className="p-2 rounded bg-green-100/60 text-center">
                            <p className="text-[10px] text-green-600">Centre</p>
                            <p className="text-sm font-bold text-green-800">{selectedEvent.subcontractorFee} DH</p>
                          </div>
                        </div>
                      )}
                      {selectedEvent.subcontractorNotes && (
                        <p className="text-xs text-violet-600 italic mt-1">{selectedEvent.subcontractorNotes}</p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {selectedEvent.isAbsent && (
                      <span className="badge" style={{ background: "#fed7aa", color: "#c2410c" }}>
                        Absent
                      </span>
                    )}
                    {selectedEvent.isSubcontracted && (
                      <span className="badge" style={{ background: "#ede9fe", color: "#6d28d9" }}>
                        🤝 Sous-traitée
                      </span>
                    )}
                    {!selectedEvent.isAbsent && (
                      <span
                        className={`badge ${
                          selectedEvent.isCompleted ? "badge-success" : "badge-info"
                        }`}
                      >
                        {selectedEvent.isCompleted ? "Terminée" : "Planifiée"}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    {!selectedEvent.isAbsent && (
                      <button
                        onClick={() => void toggleComplete(selectedEvent.id)}
                        className={`flex-1 btn ${
                          selectedEvent.isCompleted ? "btn-secondary" : "btn-primary"
                        }`}
                      >
                        {selectedEvent.isCompleted ? "Marquer non terminée" : "Marquer terminée"}
                      </button>
                    )}
                    <button
                      onClick={() => void toggleAbsent(selectedEvent.id)}
                      className={`flex-1 btn ${
                        selectedEvent.isAbsent
                          ? "btn-secondary"
                          : "text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200"
                      }`}
                    >
                      <UserX size={14} />
                      {selectedEvent.isAbsent ? "Annuler absence" : "Patient absent"}
                    </button>
                  </div>

                  {/* Edit / Delete row */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => openEditModal(selectedEvent)}
                      className="flex-1 btn btn-secondary text-sm"
                    >
                      <Edit2 size={14} />
                      Modifier
                    </button>
                    <button
                      onClick={() => void deleteSession(selectedEvent.id)}
                      className="btn text-sm text-red-600 hover:bg-red-50 border border-[var(--color-border-default)]"
                    >
                      <Trash2 size={14} />
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                Modifier la séance
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => void handleUpdateSession(e)} className="space-y-4">
              {editSessionError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {editSessionError}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Patient *
                </label>
                <select
                  required
                  value={editSession.patientId}
                  onChange={(e) => setEditSession({ ...editSession, patientId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 bg-white"
                >
                  <option value="">Sélectionner un patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Heure de début *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editSession.startTime}
                    onChange={(e) => setEditSession({ ...editSession, startTime: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Heure de fin *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={editSession.endTime}
                    onChange={(e) => setEditSession({ ...editSession, endTime: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Salle
                </label>
                <input
                  type="text"
                  value={editSession.room}
                  onChange={(e) => setEditSession({ ...editSession, room: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  placeholder="Ex: 1, 2, A, B..."
                />
              </div>

              {/* Subcontracting Toggle - Admin only */}
              {user?.role === "ADMIN" && (
                <>
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      editSession.isSubcontracted
                        ? "bg-violet-50 border-violet-300"
                        : "bg-[var(--color-bg-tertiary)] border-[var(--color-border-default)]"
                    }`}
                    onClick={() =>
                      setEditSession({ ...editSession, isSubcontracted: !editSession.isSubcontracted })
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Handshake size={16} className={editSession.isSubcontracted ? "text-violet-600" : "text-[var(--color-text-muted)]"} />
                      <span className={`text-sm font-medium ${editSession.isSubcontracted ? "text-violet-700" : "text-[var(--color-text-secondary)]"}`}>
                        Séance sous-traitée
                      </span>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${editSession.isSubcontracted ? "bg-violet-500" : "bg-gray-300"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${editSession.isSubcontracted ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                  </div>

                  {editSession.isSubcontracted && (
                    <div className="space-y-3 p-4 rounded-lg bg-violet-50/50 border border-violet-200">
                      <div>
                        <label className="block text-sm font-medium text-violet-700 mb-1">
                          Nom de l&apos;orthophoniste *
                        </label>
                        <input
                          type="text"
                          required
                          value={editSession.subcontractorName}
                          onChange={(e) =>
                            setEditSession({ ...editSession, subcontractorName: e.target.value })
                          }
                          className="w-full px-3 py-2.5 rounded-lg border border-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 bg-white"
                          placeholder="Ex: Dr. Amina Bouzid"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-violet-700 mb-1">
                          Téléphone
                        </label>
                        <input
                          type="text"
                          value={editSession.subcontractorPhone}
                          onChange={(e) =>
                            setEditSession({ ...editSession, subcontractorPhone: e.target.value })
                          }
                          className="w-full px-3 py-2.5 rounded-lg border border-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 bg-white"
                          placeholder="06 XX XX XX XX"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-violet-700 mb-1">
                          Notes sous-traitance
                        </label>
                        <textarea
                          value={editSession.subcontractorNotes}
                          onChange={(e) =>
                            setEditSession({ ...editSession, subcontractorNotes: e.target.value })
                          }
                          rows={2}
                          className="w-full px-3 py-2.5 rounded-lg border border-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 resize-none bg-white"
                          placeholder="Notes spécifiques à la sous-traitance..."
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Notes
                </label>
                <textarea
                  value={editSession.notes}
                  onChange={(e) => setEditSession({ ...editSession, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none"
                  placeholder="Notes de séance..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  <Edit2 size={16} />
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Session Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                Nouvelle Séance
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSession} className="space-y-4">
              {addSessionError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {addSessionError}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Patient *
                </label>
                <select
                  required
                  value={newSession.patientId}
                  onChange={(e) =>
                    setNewSession({ ...newSession, patientId: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 bg-white"
                >
                  <option value="">Sélectionner un patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Heure de début *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newSession.startTime}
                    onChange={(e) =>
                      setNewSession({ ...newSession, startTime: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Heure de fin *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newSession.endTime}
                    onChange={(e) =>
                      setNewSession({ ...newSession, endTime: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Salle
                </label>
                <input
                  type="text"
                  value={newSession.room}
                  onChange={(e) =>
                    setNewSession({ ...newSession, room: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  placeholder="Ex: 1, 2, A, B..."
                />
              </div>

              {/* Subcontracting Toggle - Admin only */}
              {user?.role === "ADMIN" && (
                <>
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      newSession.isSubcontracted
                        ? "bg-violet-50 border-violet-300"
                        : "bg-[var(--color-bg-tertiary)] border-[var(--color-border-default)]"
                    }`}
                    onClick={() =>
                      setNewSession({ ...newSession, isSubcontracted: !newSession.isSubcontracted })
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Handshake size={16} className={newSession.isSubcontracted ? "text-violet-600" : "text-[var(--color-text-muted)]"} />
                      <span className={`text-sm font-medium ${newSession.isSubcontracted ? "text-violet-700" : "text-[var(--color-text-secondary)]"}`}>
                        Séance sous-traitée
                      </span>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${newSession.isSubcontracted ? "bg-violet-500" : "bg-gray-300"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${newSession.isSubcontracted ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                  </div>

                  {newSession.isSubcontracted && (
                    <div className="space-y-3 p-4 rounded-lg bg-violet-50/50 border border-violet-200">
                      <div>
                        <label className="block text-sm font-medium text-violet-700 mb-1">
                          Nom de l&apos;orthophoniste *
                        </label>
                        <input
                          type="text"
                          required
                          value={newSession.subcontractorName}
                          onChange={(e) =>
                            setNewSession({ ...newSession, subcontractorName: e.target.value })
                          }
                          className="w-full px-3 py-2.5 rounded-lg border border-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 bg-white"
                          placeholder="Ex: Dr. Amina Bouzid"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-violet-700 mb-1">
                          Téléphone
                        </label>
                        <input
                          type="text"
                          value={newSession.subcontractorPhone}
                          onChange={(e) =>
                            setNewSession({ ...newSession, subcontractorPhone: e.target.value })
                          }
                          className="w-full px-3 py-2.5 rounded-lg border border-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 bg-white"
                          placeholder="06 XX XX XX XX"
                        />
                      </div>
                      {/* Auto-calculated fee display */}
                      {newSession.patientId && (() => {
                        const selectedPatient = patients.find(p => p.id === newSession.patientId);
                        if (!selectedPatient) return null;
                        const monthSessions = sessions.filter(s => {
                          const d = new Date(s.startTime);
                          return s.patientId === selectedPatient.id && d.getMonth() + 1 === currentMonth && d.getFullYear() === new Date().getFullYear();
                        }).length + 1;
                        const perSession = selectedPatient.monthlyFee / Math.max(monthSessions, 1);
                        const halfFee = Math.round(perSession / 2 * 100) / 100;
                        return (
                          <div className="p-3 rounded-lg bg-white border border-violet-200">
                            <p className="text-xs text-violet-600 font-medium mb-2">💰 Répartition automatique (50/50)</p>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div>
                                <p className="text-[10px] text-gray-500">Mensualité</p>
                                <p className="text-sm font-bold text-gray-800">{selectedPatient.monthlyFee} DH</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-violet-500">Ortho</p>
                                <p className="text-sm font-bold text-violet-700">{halfFee} DH</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-green-500">Centre</p>
                                <p className="text-sm font-bold text-green-700">{halfFee} DH</p>
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1 text-center">{monthSessions} séances ce mois → {Math.round(perSession * 100) / 100} DH/séance</p>
                          </div>
                        );
                      })()}
                      <div>
                        <label className="block text-sm font-medium text-violet-700 mb-1">
                          Notes sous-traitance
                        </label>
                        <textarea
                          value={newSession.subcontractorNotes}
                          onChange={(e) =>
                            setNewSession({ ...newSession, subcontractorNotes: e.target.value })
                          }
                          rows={2}
                          className="w-full px-3 py-2.5 rounded-lg border border-violet-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 resize-none bg-white"
                          placeholder="Notes spécifiques à la sous-traitance..."
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Notes
                </label>
                <textarea
                  value={newSession.notes}
                  onChange={(e) =>
                    setNewSession({ ...newSession, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none"
                  placeholder="Notes de séance..."
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
                  Créer la séance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
