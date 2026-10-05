import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      date = new Date().toISOString().split("T")[0],
      action, // 'SET_OPENING', 'CLOSE', 'REOPEN'
      openingAmount = 0,
      closingAmount = null,
      notes = "",
      closedBy = "Admin",
    } = body;

    if (!action) {
      return NextResponse.json({ error: "Action requise" }, { status: 400 });
    }

    if (action === "SET_OPENING") {
      await prisma.$executeRawUnsafe(
        `INSERT INTO daily_cash_closings (date, opening_amount)
         VALUES ($1::date, $2)
         ON CONFLICT (date) DO UPDATE SET opening_amount = $2`,
        date,
        Number(openingAmount)
      );
      return NextResponse.json({ success: true, message: "Fond de caisse enregistré" });
    }

    if (action === "CLOSE") {
      // Calculate expected amount from transactions
      const txRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT type, amount FROM daily_cash_transactions WHERE date = $1::date`,
        date
      );

      const closingRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT opening_amount FROM daily_cash_closings WHERE date = $1::date LIMIT 1`,
        date
      );
      const opening = closingRows.length > 0 ? Number(closingRows[0].opening_amount || 0) : 0;

      let totalIn = 0;
      let totalOut = 0;
      for (const t of txRows) {
        if (t.type === "SORTIE") totalOut += Number(t.amount);
        else totalIn += Number(t.amount);
      }

      const expected = opening + totalIn - totalOut;
      const actual = Number(closingAmount);
      const difference = actual - expected;

      await prisma.$executeRawUnsafe(
        `INSERT INTO daily_cash_closings (
           date, opening_amount, closing_amount, expected_amount, difference, is_closed, closed_at, closed_by, notes
         ) VALUES (
           $1::date, $2, $3, $4, $5, TRUE, NOW(), $6, $7
         ) ON CONFLICT (date) DO UPDATE SET
           closing_amount = $3,
           expected_amount = $4,
           difference = $5,
           is_closed = TRUE,
           closed_at = NOW(),
           closed_by = $6,
           notes = $7`,
        date,
        opening,
        actual,
        expected,
        difference,
        closedBy,
        notes
      );

      return NextResponse.json({
        success: true,
        message: "Caisse clôturée avec succès",
        expected,
        difference,
      });
    }

    if (action === "REOPEN") {
      await prisma.$executeRawUnsafe(
        `UPDATE daily_cash_closings
         SET is_closed = FALSE, closed_at = NULL, closing_amount = NULL, difference = NULL
         WHERE date = $1::date`,
        date
      );
      return NextResponse.json({ success: true, message: "Caisse rouverte" });
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (error) {
    console.error("Error managing caisse closing:", error);
    return NextResponse.json({ error: "Failed to manage closing" }, { status: 500 });
  }
}
