import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EXIT_META_PREFIX = "__EXIT_META__:";

function parseExitMeta(notes: string | null) {
  if (!notes) return { exitDate: undefined, exitReason: undefined };

  const markerLine = notes
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith(EXIT_META_PREFIX));

  if (!markerLine) return { exitDate: undefined, exitReason: undefined };

  const payload = markerLine.slice(EXIT_META_PREFIX.length);
  const separatorIndex = payload.indexOf("|");

  if (separatorIndex === -1) {
    return { exitDate: undefined, exitReason: undefined };
  }

  const exitDate = payload.slice(0, separatorIndex).trim();
  const exitReason = payload.slice(separatorIndex + 1).trim();

  return {
    exitDate: exitDate || undefined,
    exitReason: exitReason || undefined,
  };
}

function removeExitMeta(notes: string | null) {
  if (!notes) return undefined;

  const cleaned = notes
    .split("\n")
    .filter((line) => !line.trim().startsWith(EXIT_META_PREFIX))
    .join("\n")
    .trim();

  return cleaned || undefined;
}

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
  const { exitDate, exitReason } = parseExitMeta(patient.notes);

  return {
    ...patient,
    dateOfBirth: patient.dateOfBirth?.toISOString(),
    parentName: patient.parentName ?? undefined,
    parentEmail: patient.parentEmail ?? undefined,
    notes: removeExitMeta(patient.notes),
    startDate: patient.startDate.toISOString(),
    createdAt: patient.createdAt.toISOString(),
    exitDate,
    exitReason,
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

    let therapistId = providedProfile?.id || fallbackProfile?.id;

    if (!therapistId && rawTherapistId) {
      const therapistEmail =
        typeof body.therapistEmail === "string" && body.therapistEmail.trim()
          ? body.therapistEmail.trim().toLowerCase()
          : `${rawTherapistId}@local.energika`;
      const therapistFirstName =
        typeof body.therapistFirstName === "string" && body.therapistFirstName.trim()
          ? body.therapistFirstName.trim()
          : "Therapeute";
      const therapistLastName =
        typeof body.therapistLastName === "string" ? body.therapistLastName.trim() : "";
      const therapistRole = body.therapistRole === "ADMIN" ? "ADMIN" : "ORTHO";

      const createdProfile = await prisma.profile.upsert({
        where: { authId: rawTherapistId },
        update: {
          email: therapistEmail,
          firstName: therapistFirstName,
          lastName: therapistLastName,
          role: therapistRole,
        },
        create: {
          authId: rawTherapistId,
          email: therapistEmail,
          firstName: therapistFirstName,
          lastName: therapistLastName,
          role: therapistRole,
        },
        select: { id: true },
      });

      therapistId = createdProfile.id;
    }

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
        parentEmail: null,
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
