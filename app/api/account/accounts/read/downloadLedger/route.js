import AccountLedgerReportController from "@/app/controllers/account/accounts/accountLedger";

export async function GET(req) {
  return AccountLedgerReportController.readLedger(req);
}

export const dynamic = "force-dynamic";
