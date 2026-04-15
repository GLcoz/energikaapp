"use client";

import { useState, useEffect } from "react";
import {
  Contact as ContactIcon,
  Search,
  Phone,
  Send,
  Plus,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
import type { Contact } from "@/lib/types";

export default function RepertoirePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState<Partial<Contact>>({
    name: "",
    phone: "",
    role: "",
    notes: "",
  });

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const response = await fetch("/api/contacts", { cache: "no-store" });
        if (response.ok) {
          setContacts((await response.json()) as Contact[]);
        }
      } catch {
        // Handle error implicitly
      } finally {
        setLoading(false);
      }
    };
    void loadContacts();
  }, []);

  const filteredContacts = contacts
    .filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.role || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.notes || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleOpenAddModal = () => {
    setModalMode("ADD");
    setFormData({ name: "", phone: "", role: "", notes: "" });
    setErrorMsg("");
    setShowModal(true);
  };

  const handleOpenEditModal = (contact: Contact) => {
    setModalMode("EDIT");
    setFormData({ ...contact });
    setErrorMsg("");
    setShowModal(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      if (modalMode === "ADD") {
        const response = await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          setErrorMsg(data?.error || "Erreur lors de l'ajout du contact.");
          return;
        }

        const newContact = (await response.json()) as Contact;
        setContacts((prev) => [...prev, newContact]);
      } else {
        const response = await fetch(`/api/contacts/${formData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          setErrorMsg(data?.error || "Erreur lors de la modification du contact.");
          return;
        }

        const updatedContact = (await response.json()) as Contact;
        setContacts((prev) =>
          prev.map((c) => (c.id === updatedContact.id ? updatedContact : c))
        );
      }
      setShowModal(false);
    } catch {
      setErrorMsg("Erreur de connexion.");
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce contact ?")) return;

    try {
      const response = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (response.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      // Keep UI unchanged on error
    }
  };

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
              <ContactIcon className="w-5 h-5 text-white" />
            </div>
            Répertoire Téléphonique
          </h1>
          <p className="page-subtitle">
            Vos contacts personnels et professionnels
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="btn btn-primary"
        >
          <Plus size={18} />
          Nouveau Contact
        </button>
      </div>

      {/* Stats & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 card p-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
            <ContactIcon className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)] leading-none">{contacts.length}</p>
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
            Essayez de modifier votre recherche ou ajoutez un nouveau contact.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredContacts.map((contact) => {
            const genericWhatsapp = `https://wa.me/${contact.phone.replace(/[\s\-\+]/g, "").startsWith("0") ? "212" + contact.phone.replace(/[\s\-\+]/g, "").substring(1) : contact.phone.replace(/[\s\-\+]/g, "")}`;

            return (
              <div key={contact.id} className="card p-5 flex flex-col justify-between group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-lg border border-indigo-200 uppercase">
                      {contact.name.substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-text-primary)]">
                        {contact.name}
                      </h3>
                      {contact.role && (
                        <p className="text-xs text-[var(--color-text-muted)] font-medium">
                          {contact.role}
                        </p>
                      )}
                      {contact.notes && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">
                          {contact.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditModal(contact)}
                      className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-tertiary)]"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => void handleDeleteContact(contact.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="bg-[var(--color-bg-tertiary)] p-3 rounded-lg mb-4 flex items-center justify-between border border-[var(--color-border-light)]">
                  <span className="font-mono text-sm font-medium text-[var(--color-text-primary)]">
                    {contact.phone}
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
                    href={`tel:${contact.phone}`}
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

      {/* Modal ADD / EDIT */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                {modalMode === "ADD" ? "Nouveau Contact" : "Modifier le Contact"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => void handleSaveContact(e)} className="space-y-4">
              {errorMsg && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {errorMsg}
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  placeholder="Ex: Dr. Benjelloun, Fournisseur X..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Numéro de téléphone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  placeholder="Ex: 06 00 00 00 00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Rôle ou Qualité (Optionnel)
                </label>
                <input
                  type="text"
                  value={formData.role || ""}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  placeholder="Ex: Psychiatre, Électricien, Parent..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Notes / Description (Optionnel)
                </label>
                <textarea
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none"
                  placeholder="Informations utiles..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Annuler
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  {modalMode === "ADD" ? (
                    <>
                      <Plus size={16} /> Ajouter
                    </>
                  ) : (
                    <>
                      <Edit2 size={16} /> Mettre à jour
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
