import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const patients = await prisma.patient.findMany({
    select: { id: true, firstName: true, lastName: true, monthlyFee: true, isActive: true },
    orderBy: { firstName: "asc" },
  });
  console.log(`Active: ${patients.filter((x) => x.isActive).length}, Total: ${patients.length}`);
  for (const p of patients) {
    console.log(`- ${p.firstName} ${p.lastName} | Fee: ${p.monthlyFee} DH | Active: ${p.isActive}`);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
