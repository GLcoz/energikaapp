import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetAllPayments() {
  console.log("🚀 Réinitialisation de TOUS les paiements (conservation des patients)...\n");

  // 1. Compter les patients existants
  const patients = await prisma.patient.findMany({
    where: { isActive: true },
    orderBy: { firstName: "asc" },
  });
  console.log(`📋 Nombre de patients conservés : ${patients.length}`);

  // 2. Supprimer tous les anciens paiements / billings
  const deleted = await prisma.monthlyBilling.deleteMany({});
  console.log(`🗑️ Anciennes lignes de paiement supprimées : ${deleted.count}`);

  // 3. Mois et année en cours (Octobre 2026)
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // 4. Recréer une ligne de paiement vierge pour chaque patient actif
  console.log(`\n✨ Génération des nouvelles lignes de paiement vierges (${currentMonth}/${currentYear}) :`);
  let createdCount = 0;
  for (const p of patients) {
    await prisma.monthlyBilling.create({
      data: {
        patientId: p.id,
        month: currentMonth,
        year: currentYear,
        amountDue: p.monthlyFee,
        amountPaid: 0,
        status: "PENDING",
        paidAt: null,
      },
    });
    createdCount++;
    console.log(`  - [PENDING] ${p.firstName} ${p.lastName} : Forfait ${p.monthlyFee} DH, Payé: 0 DH, Date: null`);
  }

  console.log(`\n✅ ${createdCount} lignes de paiement réinitialisées avec succès pour ${currentMonth}/${currentYear}.`);
  console.log("Tous les patients ont été conservés intacts !");
}

resetAllPayments()
  .catch((e) => {
    console.error("❌ Erreur lors de la réinitialisation :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
