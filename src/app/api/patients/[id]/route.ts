import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function mapPatient(patient: {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  parentName: string | null;
  parentPhone: string;
  parentEmail: string | null;
  monthlyFee: number;
  startDate: Date;
  notes: string | null;
  isActive: boolean;
  therapistId: string;
  createdAt: Date;
}) {
  return {
    ...patient,
    dateOfBirth: patient.dateOfBirth?.toISOString(),
    parentName: patient.parentName ?? undefined,
    parentEmail: patient.parentEmail ?? undefined,
    notes: patient.notes ?? undefined,
    startDate: patient.startDate.toISOString(),
    createdAt: patient.createdAt.toISOString(),
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        parentName: body.parentName ?? null,
        parentPhone: body.parentPhone,
      },
    });

    return NextResponse.json(mapPatient(updated));
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.patient.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting patient:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
