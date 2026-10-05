// ─── Types for Energika ERP ──────────────────────────────────────

export type Role = "ADMIN" | "ORTHO";

export type PaymentStatus = "PAID" | "PENDING" | "PARTIAL";

export type ExpenseCategory =
  | "LOYER"
  | "SALAIRE"
  | "MATERIEL"
  | "MARKETING"
  | "AUTRE";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  parentName?: string;
  parentPhone: string;
  parentEmail?: string;
  monthlyFee: number;
  startDate: string;
  notes?: string;
  isActive: boolean;
  exitDate?: string;
  exitReason?: string;
  therapistId: string;
  therapist?: User;
  createdAt: string;
}

export interface MonthlyBilling {
  id: string;
  month: number;
  year: number;
  status: PaymentStatus;
  amountDue: number;
  amountPaid: number;
  paidAt?: string;
  notes?: string;
  patientId: string;
  patient?: Patient;
}

export interface Session {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  room?: string;
  notes?: string;
  isCompleted: boolean;
  isAbsent: boolean;
  isSubcontracted: boolean;
  subcontractorName?: string;
  subcontractorPhone?: string;
  subcontractorFee?: number;
  subcontractorNotes?: string;
  patientId: string;
  patient?: Patient;
  therapistId: string;
  therapist?: User;
}

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description?: string;
}

export interface DailyStats {
  totalCollected: number;
  paymentsCount: number;
  sessionsToday: number;
}

export interface MonthlyBilan {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  paidCount: number;
  pendingCount: number;
  partialCount: number;
}

export interface MonthlyChartData {
  month: string;
  revenus: number;
  depenses: number;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  LOYER: "Loyer",
  SALAIRE: "Salaire",
  MATERIEL: "Matériel",
  MARKETING: "Marketing",
  AUTRE: "Autre",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PAID: "Payé",
  PENDING: "En attente",
  PARTIAL: "Partiel",
};

export interface Contact {
  id: string;
  name: string;
  phone: string;
  role?: string;
  notes?: string;
}

export type CaisseTransactionType = "VISITE" | "PAIEMENT_MOIS" | "AUTRE_ENTREE" | "SORTIE";
export type PaymentMethod = "CASH" | "VIREMENT" | "CHEQUE";

export interface CaisseTransaction {
  id: string;
  date: string;
  time: string;
  type: CaisseTransactionType;
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
  patientId?: string;
  patientName?: string;
  billingId?: string;
  description?: string;
  createdBy?: string;
  createdAt: string;
}

export interface CaisseClosing {
  id: string;
  date: string;
  openingAmount: number;
  closingAmount?: number | null;
  expectedAmount?: number | null;
  difference?: number | null;
  isClosed: boolean;
  closedAt?: string | null;
  closedBy?: string | null;
  notes?: string | null;
}

export interface CaisseData {
  closing: CaisseClosing | null;
  transactions: CaisseTransaction[];
  summary: {
    openingAmount: number;
    totalVisites: number;
    totalPaiementsMois: number;
    totalAutresEntrees: number;
    totalEntrees: number;
    totalSorties: number;
    soldeTheorique: number;
    totalCash: number;
    totalVirement: number;
    totalCheque: number;
  };
}
