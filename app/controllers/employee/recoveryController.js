import { generateRecoverySheetPDF } from "@/app/utils/pdfGenerators/recoverySheet";
import { NextResponse } from "next/server";
import employeeRepository from "@/app/repositories/employee/employeeRepository";
import transactionRepository from "@/app/repositories/transaction/transactionRepository";

class RecoverySheetReportController {
  async readRecovery(request) {
    try {
      const { searchParams } = new URL(request.url);
      const date = searchParams.get("date");
      const salesman_id = searchParams.get("salesman_id");
      const area_id = searchParams.get("area_id");
      const subarea_id = searchParams.get("subarea_id");
      const area_name = searchParams.get("area_name");
      const subarea_name = searchParams.get("subarea_name");
      const salesman_name = searchParams.get("salesman_name");

      if (!date || !salesman_id || !area_id || !subarea_id) {
        return NextResponse.json(
          { error: "date, salesman_id, area_id, and subarea_id are required" },
          { status: 400 }
        );
      }

      console.log("Fetching recovery data...");

      // Fetch recovery data
      const recoveryResponse = await employeeRepository.readRecovery({
        salesman_id: salesman_id,
        area_id: area_id,
        subarea_id: subarea_id,
        startDate: new Date(date),
        endDate: new Date(date),
      });
      const sales = recoveryResponse;

      if (!sales || sales.length === 0) {
        console.log("No sales data found");
        throw new Error("Failed to fetch recovery data");
      }

      console.log(`Found ${sales.length} sales`);

      // Fetch customer balances and last transaction dates
      const uniqueCustomerIds = [
        ...new Set(sales.map((sale) => sale.customer_id)),
      ];

      console.log(
        `Fetching data for ${uniqueCustomerIds.length} unique customers`
      );

      const customerBalances = {};
      const lastTransactionDates = {};

      await Promise.all(
        uniqueCustomerIds.map(async (customerId) => {
          try {
            console.log(`Fetching balance for customer ${customerId}`);

            // Fetch balance - FIX: use customerId instead of acc_id
            const result = await transactionRepository.getBalance(customerId);

            const totalDebit = Number(result._sum.debit) || 0;
            const totalCredit = Number(result._sum.credit) || 0;
            const balance = totalDebit - totalCredit;
            customerBalances[customerId] = balance;

            // Fetch last transaction date - FIX: pass as object
            const lastTransResponse =
              await transactionRepository.readLastTransaction({
                acc_id: customerId,
              });

            if (lastTransResponse && lastTransResponse.transaction_dat) {
              lastTransactionDates[customerId] =
                lastTransResponse.transaction_dat;
            } else {
              lastTransactionDates[customerId] = null;
            }
          } catch (error) {
            console.error(
              `Error fetching data for customer ${customerId}:`,
              error
            );
            customerBalances[customerId] = 0;
            lastTransactionDates[customerId] = null;
          }
        })
      );

      console.log("Customer balances:", customerBalances);
      console.log("Last transaction dates:", lastTransactionDates);

      // Generate PDF
      const pdfBuffer = await generateRecoverySheetPDF(
        sales,
        customerBalances,
        lastTransactionDates,
        date,
        area_name || "N/A",
        subarea_name || "N/A",
        salesman_name || "N/A"
      );
      const uint8Array = new Uint8Array(pdfBuffer);

      // Return PDF as download
      return new NextResponse(uint8Array, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Recovery_Sheet_${date}_${area_name}_${subarea_name}.pdf"`,
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

export default new RecoverySheetReportController();
