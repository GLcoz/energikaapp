import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Fetch closing for the date
    const closings = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM daily_cash_closings WHERE date = $1::date LIMIT 1`,
      dateParam
    );
    const closingRecord = closings[0] || null;

    // Fetch transactions for the date
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM daily_cash_transactions WHERE date = $1::date ORDER BY time ASC`,
      dateParam
    );

    const transactions = rows.map((r) => ({
      id: r.id,
      date: typeof r.date === "object" ? r.date.toISOString().split("T")[0] : String(r.date),
      time: typeof r.time === "object" ? r.time.toISOString() : String(r.time),
      type: r.type,
      category: r.category,
      amount: Number(r.amount),
      paymentMethod: r.payment_method,
      patientId: r.patient_id,
      patientName: r.patient_name,
      billingId: r.billing_id,
      description: r.description,
      createdBy: r.created_by,
      createdAt: typeof r.created_at === "object" ? r.created_at.toISOString() : String(r.created_at),
    }));

    const openingAmount = closingRecord ? Number(closingRecord.opening_amount || 0) : 0;

    let totalVisites = 0;
    let totalPaiementsMois = 0;
    let totalAutresEntrees = 0;
    let totalSorties = 0;
    let totalCash = 0;
    let totalVirement = 0;
    let totalCheque = 0;

    for (const t of transactions) {
      if (t.type === "SORTIE") {
        totalSorties += t.amount;
      } else {
        if (t.type === "VISITE") totalVisites += t.amount;
        else if (t.type === "PAIEMENT_MOIS") totalPaiementsMois += t.amount;
        else totalAutresEntrees += t.amount;

        if (t.paymentMethod === "CASH") totalCash += t.amount;
        else if (t.paymentMethod === "VIREMENT") totalVirement += t.amount;
        else if (t.paymentMethod === "CHEQUE") totalCheque += t.amount;
      }
    }

    const totalEntrees = totalVisites + totalPaiementsMois + totalAutresEntrees;
    const soldeTheorique = openingAmount + totalEntrees - totalSorties;

    const closing = closingRecord
      ? {
          id: closingRecord.id,
          date: typeof closingRecord.date === "object" ? closingRecord.date.toISOString().split("T")[0] : String(closingRecord.date),
          openingAmount: Number(closingRecord.opening_amount || 0),
          closingAmount: closingRecord.closing_amount !== null ? Number(closingRecord.closing_amount) : null,
          expectedAmount: closingRecord.expected_amount !== null ? Number(closingRecord.expected_amount) : null,
          difference: closingRecord.difference !== null ? Number(closingRecord.difference) : null,
          isClosed: Boolean(closingRecord.is_closed),
          closedAt: closingRecord.closed_at ? new Date(closingRecord.closed_at).toISOString() : null,
          closedBy: closingRecord.closed_by || null,
          notes: closingRecord.notes || null,
        }
      : null;

    return NextResponse.json({
      closing,
      transactions,
      summary: {
        openingAmount,
        totalVisites,
        totalPaiementsMois,
        totalAutresEntrees,
        totalEntrees,
        totalSorties,
        soldeTheorique,
        totalCash,
        totalVirement,
        totalCheque,
      },
    });
  } catch (error) {
    console.error("Error fetching caisse data:", error);
    return NextResponse.json({ error: "Failed to fetch caisse data" }, { status: 500 });
  }
}
