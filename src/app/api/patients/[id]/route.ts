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
  if (!notes) return "";

  return notes
    .split("\n")
    .filter((line) => !line.trim().startsWith(EXIT_META_PREFIX))
    .join("\n")
    .trim();
}

function withExitMeta(
  notes: string | null,
  isActive: boolean | undefined,
  exitDate: string | undefined,
  exitReason: string | undefined
) {
  const baseNotes = removeExitMeta(notes);

  if (isActive !== false) {
    return baseNotes || null;
  }

  const safeExitDate = exitDate || new Date().toISOString().split("T")[0];
  const safeExitReason = (exitReason || "Non renseignée").trim();
  const marker = `${EXIT_META_PREFIX}${safeExitDate}|${safeExitReason}`;

  if (!baseNotes) {
    return marker;
  }

  return `${baseNotes}\n${marker}`;
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
    notes: removeExitMeta(patient.notes) || undefined,
    startDate: patient.startDate.toISOString(),
    createdAt: patient.createdAt.toISOString(),
    exitDate,
    exitReason,
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.patient.findUnique({
      where: { id },
      select: { notes: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const hasIsActive = typeof body.isActive === "boolean";
    const hasExitDate = typeof body.exitDate === "string";
    const hasExitReason = typeof body.exitReason === "string";

    const nextNotes =
      hasIsActive || hasExitDate || hasExitReason
        ? withExitMeta(
            existing.notes,
            hasIsActive ? body.isActive : undefined,
            hasExitDate ? body.exitDate : undefined,
            hasExitReason ? body.exitReason : undefined
          )
        : existing.notes;

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        firstName: typeof body.firstName === "string" ? body.firstName : undefined,
        lastName: typeof body.lastName === "string" ? body.lastName : undefined,
        parentName:
          body.parentName === null
            ? null
            : typeof body.parentName === "string"
            ? body.parentName
            : undefined,
        parentPhone:
          typeof body.parentPhone === "string" ? body.parentPhone : undefined,
        isActive: hasIsActive ? body.isActive : undefined,
        notes: nextNotes,
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
