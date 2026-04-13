// ─── Demo Data for Energika ERP ──────────────────────────────────
// This simulates the database for the demo. In production, use Prisma + Supabase.

import {
  Patient,
  MonthlyBilling,
  Session,
  Expense,
  MonthlyChartData,
} from "./types";

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

export const demoPatients: Patient[] = [
  {
    id: "p1",
    firstName: "Yasmine",
    lastName: "El Amrani",
    dateOfBirth: "2018-03-15",
    parentName: "Fatima El Amrani",
    parentPhone: "0661234567",
    parentEmail: "fatima.elamrani@gmail.com",
    monthlyFee: 1200,
    startDate: "2025-09-01",
    notes: "Troubles du langage oral, retard de parole",
    isActive: true,
    therapistId: "2",
    createdAt: "2025-09-01",
  },
  {
    id: "p2",
    firstName: "Adam",
    lastName: "Benjelloun",
    dateOfBirth: "2016-07-22",
    parentName: "Rachid Benjelloun",
    parentPhone: "0672345678",
    parentEmail: "rachid.benj@gmail.com",
    monthlyFee: 1500,
    startDate: "2025-10-15",
    notes: "Dyslexie, suivi renforcé",
    isActive: true,
    therapistId: "2",
    createdAt: "2025-10-15",
  },
  {
    id: "p3",
    firstName: "Lina",
    lastName: "Tazi",
    dateOfBirth: "2019-11-08",
    parentName: "Nadia Tazi",
    parentPhone: "0683456789",
    parentEmail: "nadia.tazi@hotmail.com",
    monthlyFee: 1200,
    startDate: "2025-11-01",
    notes: "Bégaiement, exercices de fluidité",
    isActive: true,
    therapistId: "2",
    createdAt: "2025-11-01",
  },
  {
    id: "p4",
    firstName: "Hamza",
    lastName: "Idrissi",
    dateOfBirth: "2017-01-30",
    parentName: "Karim Idrissi",
    parentPhone: "0694567890",
    parentEmail: "karim.idrissi@yahoo.fr",
    monthlyFee: 1400,
    startDate: "2026-01-10",
    notes: "Troubles articulatoires",
    isActive: true,
    therapistId: "2",
    createdAt: "2026-01-10",
  },
  {
    id: "p5",
    firstName: "Sofia",
    lastName: "Chraibi",
    dateOfBirth: "2020-05-12",
    parentName: "Meriem Chraibi",
    parentPhone: "0605678901",
    parentEmail: "meriem.chraibi@gmail.com",
    monthlyFee: 1200,
    startDate: "2026-02-01",
    notes: "Retard de langage, stimulation précoce",
    isActive: true,
    therapistId: "2",
    createdAt: "2026-02-01",
  },
  {
    id: "p6",
    firstName: "Amine",
    lastName: "Fassi",
    dateOfBirth: "2015-09-25",
    parentName: "Hassan Fassi",
    parentPhone: "0616789012",
    parentEmail: "hassan.fassi@gmail.com",
    monthlyFee: 1500,
    startDate: "2025-09-15",
    notes: "Dysorthographie, accompagnement scolaire",
    isActive: true,
    therapistId: "2",
    createdAt: "2025-09-15",
  },
  {
    id: "p7",
    firstName: "Imane",
    lastName: "Bennani",
    dateOfBirth: "2018-12-03",
    parentName: "Latifa Bennani",
    parentPhone: "0627890123",
    parentEmail: "latifa.bennani@gmail.com",
    monthlyFee: 1200,
    startDate: "2025-12-01",
    notes: "Trouble de la compréhension orale",
    isActive: true,
    therapistId: "2",
    createdAt: "2025-12-01",
  },
  {
    id: "p8",
    firstName: "Omar",
    lastName: "Alaoui",
    dateOfBirth: "2016-04-18",
    parentName: "Samira Alaoui",
    parentPhone: "0638901234",
    parentEmail: "samira.alaoui@hotmail.com",
    monthlyFee: 1300,
    startDate: "2026-03-01",
    notes: "Dyscalculie, travail sur le raisonnement logique",
    isActive: true,
    therapistId: "2",
    createdAt: "2026-03-01",
  },
];

export const demoBillings: MonthlyBilling[] = [
  // Current month billings
  { id: "b1", month: currentMonth, year: currentYear, status: "PAID", amountDue: 1200, amountPaid: 1200, paidAt: new Date().toISOString(), patientId: "p1" },
  { id: "b2", month: currentMonth, year: currentYear, status: "PENDING", amountDue: 1500, amountPaid: 0, patientId: "p2" },
  { id: "b3", month: currentMonth, year: currentYear, status: "PAID", amountDue: 1200, amountPaid: 1200, paidAt: new Date().toISOString(), patientId: "p3" },
  { id: "b4", month: currentMonth, year: currentYear, status: "PARTIAL", amountDue: 1400, amountPaid: 700, patientId: "p4" },
  { id: "b5", month: currentMonth, year: currentYear, status: "PENDING", amountDue: 1200, amountPaid: 0, patientId: "p5" },
  { id: "b6", month: currentMonth, year: currentYear, status: "PAID", amountDue: 1500, amountPaid: 1500, paidAt: new Date().toISOString(), patientId: "p6" },
  { id: "b7", month: currentMonth, year: currentYear, status: "PENDING", amountDue: 1200, amountPaid: 0, patientId: "p7" },
  { id: "b8", month: currentMonth, year: currentYear, status: "PAID", amountDue: 1300, amountPaid: 1300, paidAt: new Date().toISOString(), patientId: "p8" },
];

const todayStr = now.toISOString().split("T")[0];

export const demoSessions: Session[] = [
  {
    id: "s1",
    title: "Séance - Yasmine El Amrani",
    startTime: `${todayStr}T09:00:00`,
    endTime: `${todayStr}T09:45:00`,
    isCompleted: true,
    isAbsent: false,
    patientId: "p1",
    therapistId: "2",
  },
  {
    id: "s2",
    title: "Séance - Adam Benjelloun",
    startTime: `${todayStr}T10:00:00`,
    endTime: `${todayStr}T10:45:00`,
    isCompleted: false,
    isAbsent: false,
    patientId: "p2",
    therapistId: "2",
  },
  {
    id: "s3",
    title: "Séance - Lina Tazi",
    startTime: `${todayStr}T11:00:00`,
    endTime: `${todayStr}T11:45:00`,
    isCompleted: false,
    isAbsent: false,
    patientId: "p3",
    therapistId: "2",
  },
  {
    id: "s4",
    title: "Séance - Hamza Idrissi",
    startTime: `${todayStr}T14:00:00`,
    endTime: `${todayStr}T14:45:00`,
    isCompleted: false,
    isAbsent: false,
    patientId: "p4",
    therapistId: "2",
  },
  {
    id: "s5",
    title: "Séance - Sofia Chraibi",
    startTime: `${todayStr}T15:00:00`,
    endTime: `${todayStr}T15:45:00`,
    isCompleted: false,
    isAbsent: false,
    patientId: "p5",
    therapistId: "2",
  },
  {
    id: "s6",
    title: "Séance - Amine Fassi",
    startTime: `${todayStr}T16:00:00`,
    endTime: `${todayStr}T16:45:00`,
    isCompleted: false,
    isAbsent: false,
    patientId: "p6",
    therapistId: "2",
  },
];

export const demoExpenses: Expense[] = [
  { id: "e1", title: "Loyer local", category: "LOYER", amount: 5000, date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`, description: "Loyer mensuel du cabinet" },
  { id: "e2", title: "Salaire - Sara Benani", category: "SALAIRE", amount: 8000, date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-05`, description: "Salaire orthophoniste" },
  { id: "e3", title: "Matériel pédagogique", category: "MATERIEL", amount: 850, date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-10`, description: "Jeux éducatifs et fiches" },
  { id: "e4", title: "Publicité Facebook", category: "MARKETING", amount: 500, date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-12`, description: "Campagne publicitaire locale" },
  { id: "e5", title: "Fournitures bureau", category: "AUTRE", amount: 200, date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`, description: "Papier, cartouches, etc." },
];

export const demoChartData: MonthlyChartData[] = [
  { month: "Jan", revenus: 8500, depenses: 12000 },
  { month: "Fév", revenus: 9200, depenses: 13500 },
  { month: "Mar", revenus: 10100, depenses: 14200 },
  { month: "Avr", revenus: 10600, depenses: 14550 },
  { month: "Mai", revenus: 0, depenses: 0 },
  { month: "Jun", revenus: 0, depenses: 0 },
];

// ─── Helper Functions (simulating Server Actions) ────────────────

export function getDailyStats(): {
  totalCollected: number;
  paymentsCount: number;
  sessionsToday: number;
} {
  const todayPaid = demoBillings.filter(
    (b) =>
      b.paidAt &&
      new Date(b.paidAt).toDateString() === new Date().toDateString()
  );
  return {
    totalCollected: todayPaid.reduce((sum, b) => sum + b.amountPaid, 0),
    paymentsCount: todayPaid.length,
    sessionsToday: demoSessions.length,
  };
}

export function getMonthlyBilan(): {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  paidCount: number;
  pendingCount: number;
  partialCount: number;
} {
  const monthBillings = demoBillings.filter(
    (b) => b.month === currentMonth && b.year === currentYear
  );
  const totalRevenue = monthBillings.reduce((sum, b) => sum + b.amountPaid, 0);
  const totalExpenses = demoExpenses.reduce((sum, e) => sum + e.amount, 0);
  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    paidCount: monthBillings.filter((b) => b.status === "PAID").length,
    pendingCount: monthBillings.filter((b) => b.status === "PENDING").length,
    partialCount: monthBillings.filter((b) => b.status === "PARTIAL").length,
  };
}

export function getUnpaidPatients(): (MonthlyBilling & { patient: Patient })[] {
  return demoBillings
    .filter(
      (b) =>
        b.month === currentMonth &&
        b.year === currentYear &&
        b.status !== "PAID"
    )
    .map((b) => ({
      ...b,
      patient: demoPatients.find((p) => p.id === b.patientId)!,
    }));
}
