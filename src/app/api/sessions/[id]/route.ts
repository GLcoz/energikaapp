import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function mapSession(session: {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  notes: string | null;
  isCompleted: boolean;
  patientId: string;
  therapistId: string;
}) {
  return {
    ...session,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime.toISOString(),
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
        isCompleted:
          typeof body.isCompleted === "boolean" ? body.isCompleted : undefined,
        startTime: body.startTime ? new Date(body.startTime) : undefined,
        endTime: body.endTime ? new Date(body.endTime) : undefined,
        notes: typeof body.notes === "string" ? body.notes : undefined,
      },
    });

    return NextResponse.json(mapSession(updated));
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
