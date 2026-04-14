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
  patientId: string;
  therapistId: string;
}) {
  return {
    ...session,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime.toISOString(),
    room: session.room ?? undefined,
    notes: session.notes ?? undefined,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

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
