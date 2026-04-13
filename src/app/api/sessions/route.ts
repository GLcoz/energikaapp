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

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(sessions.map(mapSession));
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const relatedPatient = await prisma.patient.findUnique({
      where: { id: body.patientId },
      select: { therapistId: true, firstName: true, lastName: true },
    });

    const fallbackProfile = await prisma.profile.findFirst({
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    const therapistId = body.therapistId || relatedPatient?.therapistId || fallbackProfile?.id;
    if (!therapistId) {
      return NextResponse.json(
        { error: "No therapist profile found to attach session" },
        { status: 400 }
      );
    }

    const title =
      body.title ||
      (relatedPatient
        ? `Séance - ${relatedPatient.firstName} ${relatedPatient.lastName}`
        : "Séance");

    const session = await prisma.session.create({
      data: {
        title,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        notes: body.notes || null,
        isCompleted: false,
        patientId: body.patientId,
        therapistId,
      },
    });

    return NextResponse.json(mapSession(session), { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
