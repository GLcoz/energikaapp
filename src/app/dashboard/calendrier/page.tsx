"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Calendar as CalendarIcon, Plus, X, Clock, User as UserIcon } from "lucide-react";
import { demoSessions, demoPatients, demoBillings } from "@/lib/demo-data";
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
  const [sessions, setSessions] = useState<Session[]>(demoSessions);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<Session | null>(null);
  const [newSession, setNewSession] = useState({
    patientId: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("energika_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const currentMonth = new Date().getMonth() + 1;

  // Transform sessions to FullCalendar events
  const events = sessions.map((session) => {
    const patient = demoPatients.find((p) => p.id === session.patientId);
    const billing = demoBillings.find(
      (b) => b.patientId === session.patientId && b.month === currentMonth
    );
    const isUnpaid = billing && billing.status !== "PAID";

    return {
      id: session.id,
      title: `${patient?.firstName} ${patient?.lastName}`,
      start: session.startTime,
      end: session.endTime,
      backgroundColor: session.isCompleted
        ? "#10b981"
        : isUnpaid
        ? "#ef4444"
        : "#1e6bb8",
      borderColor: session.isCompleted
        ? "#059669"
        : isUnpaid
        ? "#dc2626"
        : "#1e40af",
      textColor: "#ffffff",
      extendedProps: {
        sessionId: session.id,
        patientId: session.patientId,
        isCompleted: session.isCompleted,
        isUnpaid,
        notes: session.notes,
      },
    };
  });

  const handleDateClick = (info: { dateStr: string }) => {
    setSelectedDate(info.dateStr);
    setNewSession({
      patientId: "",
      startTime: `${info.dateStr}T09:00`,
      endTime: `${info.dateStr}T09:45`,
      notes: "",
    });
    setShowAddModal(true);
  };

  const handleEventClick = (info: { event: { id: string } }) => {
    const session = sessions.find((s) => s.id === info.event.id);
    if (session) setSelectedEvent(session);
  };

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = demoPatients.find((p) => p.id === newSession.patientId);
    if (!patient) return;

    const session: Session = {
      id: `s${Date.now()}`,
      title: `Séance - ${patient.firstName} ${patient.lastName}`,
      startTime: newSession.startTime,
      endTime: newSession.endTime,
      notes: newSession.notes,
      isCompleted: false,
      patientId: newSession.patientId,
      therapistId: user?.id || "2",
    };
    setSessions([...sessions, session]);
    setShowAddModal(false);
  };

  const toggleComplete = (sessionId: string) => {
    setSessions(
      sessions.map((s) =>
        s.id === sessionId ? { ...s, isCompleted: !s.isCompleted } : s
      )
    );
    setSelectedEvent(null);
  };

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
            setSelectedDate(new Date().toISOString().split("T")[0]);
            setNewSession({
              patientId: "",
              startTime: `${new Date().toISOString().split("T")[0]}T09:00`,
              endTime: `${new Date().toISOString().split("T")[0]}T09:45`,
              notes: "",
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
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-[var(--color-text-muted)]">Patient impayé</span>
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
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          editable={true}
          selectable={true}
          dayMaxEvents={3}
          height="auto"
          buttonText={{
            today: "Aujourd'hui",
            month: "Mois",
            week: "Semaine",
            day: "Jour",
            list: "Liste",
          }}
          slotMinTime="08:00:00"
          slotMaxTime="19:00:00"
          allDaySlot={false}
          slotDuration="00:30:00"
          eventDisplay="block"
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false,
            hour12: false,
          }}
        />
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
              const patient = demoPatients.find(
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

                  <div className="flex items-center gap-2">
                    <span
                      className={`badge ${
                        selectedEvent.isCompleted ? "badge-success" : "badge-info"
                      }`}
                    >
                      {selectedEvent.isCompleted ? "Terminée" : "Planifiée"}
                    </span>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => toggleComplete(selectedEvent.id)}
                      className={`flex-1 btn ${
                        selectedEvent.isCompleted
                          ? "btn-secondary"
                          : "btn-primary"
                      }`}
                    >
                      {selectedEvent.isCompleted
                        ? "Marquer non terminée"
                        : "Marquer terminée"}
                    </button>
                  </div>
                </div>
              );
            })()}
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
                  {demoPatients.map((p) => (
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
