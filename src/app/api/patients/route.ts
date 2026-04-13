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

export async function GET() {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(patients.map(mapPatient));
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body?.firstName || !body?.lastName || !body?.parentPhone || !body?.startDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const rawTherapistId =
      typeof body.therapistId === "string" ? body.therapistId.trim() : "";

    const providedProfile = rawTherapistId
      ? await prisma.profile.findFirst({
          where: {
            OR: [{ id: rawTherapistId }, { authId: rawTherapistId }],
          },
          select: { id: true },
        })
      : null;

    const fallbackProfile = await prisma.profile.findFirst({
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    const therapistId = providedProfile?.id || fallbackProfile?.id;
    if (!therapistId) {
      return NextResponse.json(
        { error: "No therapist profile found to attach patient" },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        parentName: body.parentName || null,
        parentPhone: body.parentPhone,
        parentEmail: body.parentEmail || null,
        monthlyFee: Number(body.monthlyFee ?? 0),
        startDate: new Date(body.startDate),
        notes: body.notes || null,
        therapistId,
        isActive: true,
      },
    });

    return NextResponse.json(mapPatient(patient), { status: 201 });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
