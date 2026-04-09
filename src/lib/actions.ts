// ─── Server Actions for Energika ERP ──────────────────────────────
// These would connect to Prisma/Supabase in production. 
// For the demo, they operate on demo data.

"use server";

import { prisma } from "@/lib/prisma";

// ─── getDailyStats() ─────────────────────────────────────────────
// Returns total revenue collected today and number of payments
export async function getDailyStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const todayPayments = await prisma.monthlyBilling.findMany({
      where: {
        paidAt: {
          gte: today,
          lt: tomorrow,
        },
        status: { in: ["PAID", "PARTIAL"] },
      },
    });

    const totalCollected = todayPayments.reduce(
      (sum, p) => sum + p.amountPaid,
      0
    );

    const sessionsToday = await prisma.session.count({
      where: {
        startTime: { gte: today, lt: tomorrow },
      },
    });

    return {
      totalCollected,
      paymentsCount: todayPayments.length,
      sessionsToday,
    };
  } catch {
    return { totalCollected: 0, paymentsCount: 0, sessionsToday: 0 };
  }
}

// ─── getMonthlyBilan() ───────────────────────────────────────────
// Returns revenue, expenses, and net profit for the current month
export async function getMonthlyBilan() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  try {
    const billings = await prisma.monthlyBilling.findMany({
      where: { month, year },
    });

    const firstOfMonth = new Date(year, month - 1, 1);
    const lastOfMonth = new Date(year, month, 0, 23, 59, 59);

    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: firstOfMonth, lte: lastOfMonth },
      },
    });

    const totalRevenue = billings.reduce((sum, b) => sum + b.amountPaid, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      paidCount: billings.filter((b) => b.status === "PAID").length,
      pendingCount: billings.filter((b) => b.status === "PENDING").length,
      partialCount: billings.filter((b) => b.status === "PARTIAL").length,
    };
  } catch {
    return {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      paidCount: 0,
      pendingCount: 0,
      partialCount: 0,
    };
  }
}

// ─── getUnpaidPatients() ─────────────────────────────────────────
// Returns list of patients with unpaid monthly billing
export async function getUnpaidPatients() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  try {
    return await prisma.monthlyBilling.findMany({
      where: {
        month,
        year,
        status: { in: ["PENDING", "PARTIAL"] },
      },
      include: {
        patient: true,
      },
      orderBy: {
        patient: { lastName: "asc" },
      },
    });
  } catch {
    return [];
  }
}

// ─── generateMonthlyBilling() ────────────────────────────────────
// Generates billing records for all active patients (1st of month)
export async function generateMonthlyBilling() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  try {
    const activePatients = await prisma.patient.findMany({
      where: { isActive: true },
    });

    const results = await Promise.allSettled(
      activePatients.map((patient) =>
        prisma.monthlyBilling.upsert({
          where: {
            patientId_month_year: {
              patientId: patient.id,
              month,
              year,
            },
          },
          update: {},
          create: {
            patientId: patient.id,
            month,
            year,
            amountDue: patient.monthlyFee,
            amountPaid: 0,
            status: "PENDING",
          },
        })
      )
    );

    return {
      generated: results.filter((r) => r.status === "fulfilled").length,
      errors: results.filter((r) => r.status === "rejected").length,
    };
  } catch {
    return { generated: 0, errors: 0 };
  }
}

// ─── markPayment() ───────────────────────────────────────────────
// Mark a billing as paid or partially paid
export async function markPayment(
  billingId: string,
  amount: number,
  fullPayment: boolean
) {
  try {
    const billing = await prisma.monthlyBilling.findUnique({
      where: { id: billingId },
    });

    if (!billing) throw new Error("Billing not found");

    const newAmountPaid = fullPayment ? billing.amountDue : billing.amountPaid + amount;
    const status = newAmountPaid >= billing.amountDue ? "PAID" : "PARTIAL";

    return await prisma.monthlyBilling.update({
      where: { id: billingId },
      data: {
        amountPaid: newAmountPaid,
        status,
        paidAt: status === "PAID" ? new Date() : null,
      },
    });
  } catch (error) {
    throw error;
  }
}
