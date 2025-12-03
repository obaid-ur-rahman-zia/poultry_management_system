import RecoverySheetReportController from "@/app/controllers/employee/recoveryController";

export async function GET(request) {
  return RecoverySheetReportController.readRecovery(request);
}

export const dynamic = "force-dynamic";
