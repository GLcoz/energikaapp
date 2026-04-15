"use client";

import { useState, useEffect } from "react";
import {
  Contact,
  Search,
  Phone,
  Send,
  ExternalLink,
} from "lucide-react";
import { generateWhatsAppMessage } from "@/lib/utils";
import type { Patient } from "@/lib/types";

export default function RepertoirePage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const response = await fetch("/api/patients", { cache: "no-store" });
        if (response.ok) {
          setPatients((await response.json()) as Patient[]);
        }
      } catch {
        // Handle error implicitly
      } finally {
        setLoading(false);
      }
    };
    void loadPatients();
  }, []);

  const filteredContacts = patients
    .filter(
      (p) =>
        p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.parentName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.parentPhone.includes(searchTerm)
    )
    .sort((a, b) => a.firstName.localeCompare(b.firstName));

  if (loading) {
    return (
      <div className="space-y-6 fade-in">
        <div className="skeleton h-12 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-5 h-32 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Contact className="w-5 h-5 text-white" />
            </div>
            Répertoire Téléphonique
          </h1>
          <p className="page-subtitle">
            Contacts des parents de patients
          </p>
        </div>
      </div>

      {/* Stats & Search Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 card p-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
            <Contact className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)] leading-none">{patients.length}</p>
            <p className="text-xs text-[var(--color-text-muted)]">Contacts enregistrés</p>
          </div>
        </div>
        
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Rechercher un contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
        </div>
      </div>

      {/* Contact Grid */}
      {filteredContacts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
            Aucun contact trouvé
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Essayez de modifier votre recherche.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredContacts.map((patient) => {
            const whatsappUrl = generateWhatsAppMessage(
              patient.parentPhone,
              `${patient.firstName} ${patient.lastName}`,
              "ce mois", // Generic info if we don't have a specific month reasoning
              0 // Amount 0 triggers general contact message if modified, but generateWhatsAppMessage expects standard structure. Let's see how generateWhatsAppMessage is defined, presumably for unpaid. Assuming it requires remaining amount. Wait, if remaining is 0, what does it generate? Let's just create a direct link.
            );
            
            // Generate standard generic whatsapp message link without predefined template structure
            const genericWhatsapp = `https://wa.me/${patient.parentPhone.replace(/[\s\-\+]/g, "").startsWith("0") ? "212" + patient.parentPhone.replace(/[\s\-\+]/g, "").substring(1) : patient.parentPhone.replace(/[\s\-\+]/g, "")}`;

            return (
              <div key={patient.id} className="card p-5 flex flex-col justify-between">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-lg border border-indigo-200">
                    {patient.firstName[0]}
                    {patient.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">
                      {patient.parentName || "Parent de " + patient.firstName}
                    </h3>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Patient: {patient.firstName} {patient.lastName}
                    </p>
                  </div>
                </div>

                <div className="bg-[var(--color-bg-tertiary)] p-3 rounded-lg mb-4 flex items-center justify-between border border-[var(--color-border-light)]">
                  <span className="font-mono text-sm font-medium text-[var(--color-text-primary)]">
                    {patient.parentPhone}
                  </span>
                </div>

                <div className="flex gap-2 w-full">
                  <a
                    href={genericWhatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 btn btn-whatsapp !py-2 text-sm"
                  >
                    <Send size={14} />
                    WhatsApp
                  </a>
                  <a
                    href={`tel:${patient.parentPhone}`}
                    className="flex-1 btn btn-secondary !py-2 text-sm border-indigo-100 hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    <Phone size={14} />
                    Appeler
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
