import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function mapSession(session: {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  room: string | null;
  notes: string | null;
  isCompleted: boolean;
  isAbsent: boolean;
  isSubcontracted: boolean;
  subcontractorName: string | null;
  subcontractorPhone: string | null;
  subcontractorFee: number | null;
  subcontractorNotes: string | null;
  patientId: string;
  therapistId: string;
}) {
  return {
    ...session,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime.toISOString(),
    room: session.room ?? undefined,
    notes: session.notes ?? undefined,
    subcontractorName: session.subcontractorName ?? undefined,
    subcontractorPhone: session.subcontractorPhone ?? undefined,
    subcontractorFee: session.subcontractorFee ?? undefined,
    subcontractorNotes: session.subcontractorNotes ?? undefined,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // If explicitly toggling off subcontracting, clear all subcontractor fields
    const isTogglingOff = body.isSubcontracted === false;

    const updated = await prisma.session.update({
      where: { id },
      data: {
        title: typeof body.title === "string" ? body.title : undefined,
        isCompleted:
          typeof body.isCompleted === "boolean" ? body.isCompleted : undefined,
        isAbsent:
          typeof body.isAbsent === "boolean" ? body.isAbsent : undefined,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
        room: typeof body.room === "string" ? (body.room || null) : undefined,
        notes: typeof body.notes === "string" ? body.notes : undefined,
        patientId: typeof body.patientId === "string" && body.patientId ? body.patientId : undefined,
        // Subcontracting fields
        isSubcontracted:
          typeof body.isSubcontracted === "boolean" ? body.isSubcontracted : undefined,
        subcontractorName: isTogglingOff
          ? null
          : typeof body.subcontractorName === "string"
          ? (body.subcontractorName || null)
          : undefined,
        subcontractorPhone: isTogglingOff
          ? null
          : typeof body.subcontractorPhone === "string"
          ? (body.subcontractorPhone || null)
          : undefined,
        subcontractorFee: isTogglingOff
          ? null
          : typeof body.subcontractorFee === "number"
          ? body.subcontractorFee
          : undefined,
        subcontractorNotes: isTogglingOff
          ? null
          : typeof body.subcontractorNotes === "string"
          ? (body.subcontractorNotes || null)
          : undefined,
      },
    });

    return NextResponse.json(mapSession(updated));
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.session.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
