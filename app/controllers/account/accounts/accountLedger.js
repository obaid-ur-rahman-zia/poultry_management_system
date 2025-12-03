import { generateAccountLedgerPDF } from "@/app/utils/pdfGenerators/accountLedger";
import { NextResponse } from "next/server";
import transactionRepository from "@/app/repositories/transaction/transactionRepository";
import accountsRepository from "@/app/repositories/account/accounts/accountsRepository";

class AccountLedgerReportController {
  async readLedger(request) {
    try {
      const { searchParams } = new URL(request.url);
      const acc_id = searchParams.get("acc_id");
      const start_dat = searchParams.get("start_dat");
      const end_dat = searchParams.get("end_dat");
      const end = new Date(end_dat);
      end.setHours(23, 59, 59, 999);

      if (!acc_id || !start_dat || !end_dat) {
        return NextResponse.json(
          { error: "acc_id, start_dat and end_dat are required" },
          { status: 400 }
        );
      }

      // Fetch ledger data
      const ledgerData = await transactionRepository.readAccountLedger({
        acc_id,
        start_dat,
        end,
      });

      const openingBalance = await transactionRepository.readOpeningBalance({
        acc_id,
        start_dat,
      });

      const transactions = ledgerData;

      // Fetch account details
      const accountsData = await accountsRepository.readAll();

      if (!accountsData) {
        throw new Error("Account not found");
      }

      // Generate PDF
      const pdfBuffer = await generateAccountLedgerPDF(
        transactions,
        openingBalance,
        accountsData,
        start_dat,
        end_dat,
        acc_id
      );
      const uint8Array = new Uint8Array(pdfBuffer);

      // Return PDF as download
      return new NextResponse(uint8Array, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Account_Ledger_${start_dat}_to_${end_dat}.pdf"`,
          "Content-Length": pdfBuffer.length.toString(),
        },
      });
    } catch (error) {
      console.error("PDF Generation Error:", error);
      return NextResponse.json(
        { error: "Failed to generate PDF", details: error.message },
        { status: 500 }
      );
    }
  }
}

export default new AccountLedgerReportController();
