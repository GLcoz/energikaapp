import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting database cleanup...");

  // Cut-off date: 2026-09-01T00:00:00.000Z
  const cutoffDate = new Date("2026-09-01T00:00:00.000Z");

  // 1. Find patients to delete (startDate < September 1st, 2026)
  const patientsToDelete = await prisma.patient.findMany({
    where: {
      startDate: {
        lt: cutoffDate,
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      startDate: true,
    },
  });

  console.log(`\nFound ${patientsToDelete.length} patients created before 1 September 2026:`);
  for (const p of patientsToDelete) {
    console.log(`  - ${p.firstName} ${p.lastName} (Start: ${p.startDate.toISOString().slice(0, 10)})`);
  }

  // 2. Delete these patients (Cascade will delete their Sessions and MonthlyBillings)
  if (patientsToDelete.length > 0) {
    const deleteResult = await prisma.patient.deleteMany({
      where: {
        id: {
          in: patientsToDelete.map((p) => p.id),
        },
      },
    });
    console.log(`\n✅ Deleted ${deleteResult.count} patients (and all their linked sessions & billings via cascade).`);
  }

  // 3. Reset all remaining payments (MonthlyBilling)
  const resetResult = await prisma.monthlyBilling.updateMany({
    data: {
      status: "PENDING",
      amountPaid: 0,
      paidAt: null,
    },
  });
  console.log(`\n✅ Reset ${resetResult.count} payment record(s) to PENDING with 0 amount paid.`);

  // 4. Verify remaining patients
  const remainingPatients = await prisma.patient.findMany({
    orderBy: { startDate: "asc" },
    include: {
      _count: {
        select: {
          billings: true,
          sessions: true,
        },
      },
    },
  });

  console.log(`\n📋 Remaining Patients in Database (${remainingPatients.length}):`);
  for (const p of remainingPatients) {
    console.log(
      `  - ${p.firstName} ${p.lastName} | Start: ${p.startDate.toISOString().slice(0, 10)} | Billings: ${p._count.billings} | Sessions: ${p._count.sessions}`
    );
  }

  // 5. Verify remaining billings
  const remainingBillings = await prisma.monthlyBilling.findMany({
    include: {
      patient: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  console.log(`\n💳 Current Monthly Billings (${remainingBillings.length}):`);
  for (const b of remainingBillings) {
    console.log(
      `  - [${b.month}/${b.year}] ${b.patient.firstName} ${b.patient.lastName} | Status: ${b.status} | Due: ${b.amountDue} | Paid: ${b.amountPaid} | PaidAt: ${b.paidAt}`
    );
  }

  console.log("\n✨ Database cleanup & payment reset completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during cleanup:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
