"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  Plus,
  X,
  Search,
  Tag,
  Trash2,
  Download,
} from "lucide-react";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import type { Expense, ExpenseCategory } from "@/lib/types";

const categoryLabels: Record<ExpenseCategory, string> = {
  LOYER: "Loyer",
  SALAIRE: "Salaire",
  MATERIEL: "Matériel",
  MARKETING: "Marketing",
  AUTRE: "Autre",
};

const categoryColors: Record<ExpenseCategory, string> = {
  LOYER: "bg-purple-50 text-purple-700 border-purple-100",
  SALAIRE: "bg-blue-50 text-blue-700 border-blue-100",
  MATERIEL: "bg-amber-50 text-amber-700 border-amber-100",
  MARKETING: "bg-pink-50 text-pink-700 border-pink-100",
  AUTRE: "bg-gray-50 text-gray-700 border-gray-100",
};

export default function DepensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | "ALL">("ALL");
  const [addExpenseError, setAddExpenseError] = useState("");
  const [newExpense, setNewExpense] = useState({
    title: "",
    category: "AUTRE" as ExpenseCategory,
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/expenses", { cache: "no-store" });
      if (res.ok) {
        setExpenses((await res.json()) as Expense[]);
      }
    } catch {
      // keep empty on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredExpenses = expenses
    .filter((e) => filterCategory === "ALL" || e.category === filterCategory)
    .filter(
      (e) =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category for summary
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<ExpenseCategory, number>);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddExpenseError("");

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExpense),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
        setAddExpenseError(errorData?.error || "Impossible d'ajouter la dépense.");
        return;
      }

      const created = (await response.json()) as Expense;
      setExpenses([created, ...expenses]);
      setShowAddModal(false);
      setNewExpense({
        title: "",
        category: "AUTRE",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
        description: "",
      });
    } catch {
      setAddExpenseError("Erreur réseau. Veuillez réessayer.");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Supprimer cette dépense définitivement ?")) return;

    try {
      const response = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!response.ok) return;

      setExpenses(expenses.filter((e) => e.id !== id));
    } catch {
      // Keep UI unchanged on error
    }
  };

  const handleExportPDF = async () => {
    if (!filteredExpenses.length) {
      alert("Aucune dépense à exporter.");
      return;
    }

    const [{ jsPDF }, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const autoTable = autoTableModule.default ?? autoTableModule.autoTable;
    const doc = new jsPDF();

    const pageTitle = "Export des dépenses";
    const subtitle =
      filterCategory === "ALL"
        ? "Toutes les catégories"
        : `Catégorie: ${categoryLabels[filterCategory]}`;
    const today = new Date().toLocaleDateString("fr-FR");

    doc.setFontSize(18);
    doc.text(pageTitle, 14, 16);
    doc.setFontSize(11);
    doc.text(`Date d'export: ${today}`, 14, 24);
    doc.text(subtitle, 14, 30);
    doc.text(`Recherche: ${searchTerm || "Aucune"}`, 14, 36);
    doc.text(`Total: ${formatCurrency(totalExpenses)}`, 14, 42);

    autoTable(doc, {
      startY: 50,
      head: [["Titre", "Catégorie", "Montant", "Date", "Description"]],
      body: filteredExpenses.map((expense) => [
        expense.title,
        categoryLabels[expense.category],
        formatCurrency(expense.amount),
        formatShortDate(expense.date),
        expense.description || "—",
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [220, 38, 38],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
    });

    doc.save(`depenses-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) {
    return (
      <div className="space-y-6 fade-in">
        <div className="skeleton h-12 w-64 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 rounded-xl border-2 skeleton h-24" />
          ))}
        </div>
        <div className="card p-5 h-24 skeleton rounded-xl" />
        <div className="card h-96 skeleton rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            Dépenses
          </h1>
          <p className="page-subtitle">
            Gestion des charges du centre
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportPDF}
            className="btn btn-secondary"
          >
            <Download size={18} />
            Exporter PDF
          </button>
          <button
            onClick={() => {
              setAddExpenseError("");
              setShowAddModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={18} />
            Nouvelle Dépense
          </button>
        </div>
      </div>

      {/* Category Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {(Object.keys(categoryLabels) as ExpenseCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() =>
              setFilterCategory(filterCategory === cat ? "ALL" : cat)
            }
            className={`p-4 rounded-xl border-2 transition-all ${
              filterCategory === cat
                ? "ring-2 ring-[var(--color-primary)] ring-offset-2"
                : ""
            } ${categoryColors[cat]}`}
          >
            <p className="text-xs font-medium opacity-80">
              {categoryLabels[cat]}
            </p>
            <p className="text-lg font-bold mt-1">
              {formatCurrency(byCategory[cat] || 0)}
            </p>
          </button>
        ))}
      </div>

      {/* Total */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">
            Total des dépenses{filterCategory !== "ALL" ? ` (${categoryLabels[filterCategory]})` : ""}
          </p>
          <p className="text-3xl font-bold text-red-600">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        {filterCategory !== "ALL" && (
          <button
            onClick={() => setFilterCategory("ALL")}
            className="btn btn-secondary text-xs"
          >
            Voir tout
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
        <input
          type="text"
          placeholder="Rechercher une dépense..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
        />
      </div>

      {/* Expenses Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Catégorie</th>
                <th>Montant</th>
                <th>Date</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="font-medium text-[var(--color-text-primary)]">
                    {expense.title}
                  </td>
                  <td>
                    <span
                      className={`badge border ${categoryColors[expense.category]}`}
                    >
                      <Tag size={10} className="mr-1" />
                      {categoryLabels[expense.category]}
                    </span>
                  </td>
                  <td className="font-semibold text-red-600">
                    -{formatCurrency(expense.amount)}
                  </td>
                  <td>{formatShortDate(expense.date)}</td>
                  <td className="text-xs text-[var(--color-text-muted)] max-w-48 truncate">
                    {expense.description || "—"}
                  </td>
                  <td>
                    <button
                      onClick={() => void handleDeleteExpense(expense.id)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[var(--color-text-muted)] text-sm">
                    Aucune dépense trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                Nouvelle Dépense
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={(e) => void handleAddExpense(e)} className="space-y-4">
              {addExpenseError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {addExpenseError}
                </p>
              )}
              
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Titre *
                </label>
                <input
                  type="text"
                  required
                  value={newExpense.title}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, title: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  placeholder="Ex: Loyer du mois"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Catégorie *
                </label>
                <select
                  required
                  value={newExpense.category}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      category: e.target.value as ExpenseCategory,
                    })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 bg-white"
                >
                  {(Object.keys(categoryLabels) as ExpenseCategory[]).map(
                    (cat) => (
                      <option key={cat} value={cat}>
                        {categoryLabels[cat]}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Montant (DH) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={newExpense.amount || ""}
                    onChange={(e) =>
                      setNewExpense({
                        ...newExpense,
                        amount: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newExpense.date}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, date: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Description
                </label>
                <textarea
                  value={newExpense.description}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none"
                  placeholder="Détails de la dépense..."
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
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
