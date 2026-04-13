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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.monthlyBilling.update({
      where: { id },
      data: {
        status: body.status ?? undefined,
        amountPaid: typeof body.amountPaid === "number" ? body.amountPaid : undefined,
        paidAt: body.paidAt ? new Date(body.paidAt) : undefined,
        notes: typeof body.notes === "string" ? body.notes : undefined,
      },
    });

    return NextResponse.json(mapBilling(updated));
  } catch (error) {
    console.error("Error updating billing:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.monthlyBilling.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting billing:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
