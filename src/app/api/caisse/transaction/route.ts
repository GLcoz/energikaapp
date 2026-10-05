import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      date = new Date().toISOString().split("T")[0],
      type, // 'VISITE', 'PAIEMENT_MOIS', 'AUTRE_ENTREE', 'SORTIE'
      amount,
      paymentMethod = "CASH",
      patientId = null,
      patientName = null,
      description = "",
      createdBy = "Admin",
    } = body;

    if (!type || !amount || isNaN(Number(amount))) {
      return NextResponse.json({ error: "Type et montant requis" }, { status: 400 });
    }

    const numAmount = Math.abs(Number(amount));
    let resolvedPatientName = patientName;
    let linkedBillingId = null;

    // If patient is selected, get patient full name if not provided
    if (patientId && !resolvedPatientName) {
      const p = await prisma.patient.findUnique({
        where: { id: patientId },
        select: { firstName: true, lastName: true },
      });
      if (p) {
        resolvedPatientName = `${p.firstName} ${p.lastName}`;
      }
    }

    // If it's a monthly fee payment, also mark the patient's MonthlyBilling as PAID
    if (type === "PAIEMENT_MOIS" && patientId) {
      const txDate = new Date(date);
      const month = txDate.getMonth() + 1;
      const year = txDate.getFullYear();

      // Find or create monthly billing for this patient
      let billing = await prisma.monthlyBilling.findUnique({
        where: {
          patientId_month_year: {
            patientId,
            month,
            year,
          },
        },
      });

      if (!billing) {
        const patient = await prisma.patient.findUnique({ where: { id: patientId } });
        billing = await prisma.monthlyBilling.create({
          data: {
            patientId,
            month,
            year,
            amountDue: patient ? patient.monthlyFee : numAmount,
            amountPaid: numAmount,
            status: "PAID",
            paidAt: new Date(date),
            notes: description ? `Encaissé en caisse: ${description}` : "Encaissé en caisse",
          },
        });
      } else {
        billing = await prisma.monthlyBilling.update({
          where: { id: billing.id },
          data: {
            amountPaid: numAmount,
            status: numAmount >= billing.amountDue ? "PAID" : "PARTIAL",
            paidAt: new Date(date),
            notes: description ? `Encaissé en caisse: ${description}` : billing.notes || "Encaissé en caisse",
          },
        });
      }

      linkedBillingId = billing.id;
    }

    // Insert into daily_cash_transactions
    const result = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO daily_cash_transactions (
        date, time, type, category, amount, payment_method, patient_id, patient_name, billing_id, description, created_by
      ) VALUES (
        $1::date, NOW(), $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) RETURNING *`,
      date,
      type,
      type === "SORTIE" ? "DEPENSE" : "RECETTE",
      numAmount,
      paymentMethod,
      patientId,
      resolvedPatientName,
      linkedBillingId,
      description,
      createdBy
    );

    const inserted = result[0];

    return NextResponse.json({
      success: true,
      transaction: {
        id: inserted.id,
        date: typeof inserted.date === "object" ? inserted.date.toISOString().split("T")[0] : String(inserted.date),
        time: typeof inserted.time === "object" ? inserted.time.toISOString() : String(inserted.time),
        type: inserted.type,
        category: inserted.category,
        amount: Number(inserted.amount),
        paymentMethod: inserted.payment_method,
        patientId: inserted.patient_id,
        patientName: inserted.patient_name,
        billingId: inserted.billing_id,
        description: inserted.description,
        createdBy: inserted.created_by,
        createdAt: typeof inserted.created_at === "object" ? inserted.created_at.toISOString() : String(inserted.created_at),
      },
    });
  } catch (error) {
    console.error("Error creating caisse transaction:", error);
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 });
  }
}
