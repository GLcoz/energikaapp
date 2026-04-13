import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function mapBilling(billing: {
  id: string;
  month: number;
  year: number;
  status: string;
  amountDue: number;
  amountPaid: number;
  paidAt: Date | null;
  notes: string | null;
  patientId: string;
}) {
  return {
    ...billing,
    paidAt: billing.paidAt?.toISOString() ?? undefined,
    notes: billing.notes ?? undefined,
  };
}

export async function GET() {
  try {
    const billings = await prisma.monthlyBilling.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    return NextResponse.json(billings.map(mapBilling));
  } catch (error) {
    console.error("Error fetching billings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body?.patientId || !body?.month || !body?.year || !body?.amountDue) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const billing = await prisma.monthlyBilling.upsert({
      where: {
        patientId_month_year: {
          patientId: body.patientId,
          month: Number(body.month),
          year: Number(body.year),
        },
      },
      update: {
        amountDue: Number(body.amountDue),
        amountPaid: Number(body.amountPaid ?? 0),
        status: body.status ?? "PENDING",
        paidAt: body.paidAt ? new Date(body.paidAt) : null,
        notes: body.notes || null,
      },
      create: {
        patientId: body.patientId,
        month: Number(body.month),
        year: Number(body.year),
        amountDue: Number(body.amountDue),
        amountPaid: Number(body.amountPaid ?? 0),
        status: body.status ?? "PENDING",
        paidAt: body.paidAt ? new Date(body.paidAt) : null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(mapBilling(billing), { status: 201 });
  } catch (error) {
    console.error("Error creating billing:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
