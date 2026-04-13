// ─── Script de nettoyage de la base de données ─────────────────────────────
// Supprime TOUTES les données de test :
//   - MonthlyBilling (paiements)
//   - Session (séances)
//   - Patient (patients)
//   - Expense (dépenses)
// Les comptes utilisateurs (Profile) sont conservés pour permettre la connexion.
// ⚠️ Cette action est IRRÉVERSIBLE.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log("🧹 Nettoyage de la base de données Energika...\n");

  // 1. Supprimer les paiements (dépendent de Patient)
  const deletedBillings = await prisma.monthlyBilling.deleteMany({});
  console.log(`✅ Paiements supprimés : ${deletedBillings.count}`);

  // 2. Supprimer les séances (dépendent de Patient et Profile)
  const deletedSessions = await prisma.session.deleteMany({});
  console.log(`✅ Séances supprimées : ${deletedSessions.count}`);

  // 3. Supprimer les patients (dépendent de Profile)
  const deletedPatients = await prisma.patient.deleteMany({});
  console.log(`✅ Patients supprimés : ${deletedPatients.count}`);

  // 4. Supprimer les dépenses
  const deletedExpenses = await prisma.expense.deleteMany({});
  console.log(`✅ Dépenses supprimées : ${deletedExpenses.count}`);

  console.log("\n🎉 Base de données nettoyée avec succès !");
  console.log("Les comptes utilisateurs (Profile) ont été conservés.\n");
}

cleanDatabase()
  .catch((e) => {
    console.error("❌ Erreur lors du nettoyage :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
