import prisma from "../lib/prisma.js";


export async function resetSequences() {
  try {
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE voucher_voucher_id_seq RESTART WITH 1;`);
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE transaction_transaction_id_seq RESTART WITH 1;`);
    console.log("Voucher and Transaction ID counters reset to 1 ✅");
  } catch (error) {
    console.error("Error resetting sequences:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetSequences();
