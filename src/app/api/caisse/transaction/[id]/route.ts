import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if it has a linked billing_id
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM daily_cash_transactions WHERE id = $1`,
      id
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Transaction introuvable" }, { status: 404 });
    }

    const tx = rows[0];

    // If it was linked to a billing, reset billing
    if (tx.billing_id) {
      await prisma.monthlyBilling.update({
        where: { id: tx.billing_id },
        data: {
          amountPaid: 0,
          status: "PENDING",
          paidAt: null,
          notes: "Annulé suite à suppression en caisse",
        },
      });
    }

    await prisma.$queryRawUnsafe(
      `DELETE FROM daily_cash_transactions WHERE id = $1`,
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting caisse transaction:", error);
    return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
  }
}
