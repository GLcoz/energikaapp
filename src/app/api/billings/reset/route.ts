import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Supprimer tous les anciens paiements
    await prisma.monthlyBilling.deleteMany({});

    // Recréer les lignes vierges pour tous les patients actifs
    const patients = await prisma.patient.findMany({
      where: { isActive: true },
    });

    for (const p of patients) {
      await prisma.monthlyBilling.create({
        data: {
          patientId: p.id,
          month: currentMonth,
          year: currentYear,
          amountDue: p.monthlyFee,
          amountPaid: 0,
          status: "PENDING",
          paidAt: null,
        },
      });
    }

    return NextResponse.json({ success: true, count: patients.length });
  } catch (error) {
    console.error("Error resetting billings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
