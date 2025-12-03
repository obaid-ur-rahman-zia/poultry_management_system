import { generatePurchaseReportPDF } from "@/app/utils/pdfGenerators/purchaseReport";
import PurchaseRepository from "@/app/repositories/purchase/purchaseRepository";
import { NextResponse } from "next/server";
import { generatePurchaseSummaryPDF } from "@/app/utils/pdfGenerators/purchaseSummary";

class PurchaseReportController {
  async readReport(request) {
    try {
      const { searchParams } = new URL(request.url);
      const start_dat = searchParams.get("start_dat");
      const end_dat = searchParams.get("end_dat");

      if (!start_dat || !end_dat) {
        return NextResponse.json(
          { error: "start_dat and end_dat are required" },
          { status: 400 }
        );
      }

      // Fetch data
      const purchaseData = await PurchaseRepository.readReportDetail({
        start_dat,
        end_dat,
      });

      // Generate PDF
      const pdfBuffer = await generatePurchaseReportPDF(
        purchaseData,
        start_dat,
        end_dat
      );
      const uint8Array = new Uint8Array(pdfBuffer);
      // Return PDF as download
      return new NextResponse(uint8Array, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Purchase_Detail_Report_${start_dat}_to_${end_dat}.pdf"`,
          "Content-Length": pdfBuffer.length.toString(),
        },
      });
    } catch (error) {
      console.error("PDF Generation Error:", error);
      return NextResponse.json(
        { error: "Failed to generate PDF" },
        { status: 500 }
      );
    }
  }

  async readSummary(request) {
    try {
      const { searchParams } = new URL(request.url);
      const start_dat = searchParams.get("start_dat");
      const end_dat = searchParams.get("end_dat");

      if (!start_dat || !end_dat) {
        return NextResponse.json(
          { error: "start_dat and end_dat are required" },
          { status: 400 }
        );
      }

      // Fetch data
      const purchaseData = await PurchaseRepository.readReportDetail({
        start_dat,
        end_dat,
      });

      // Generate PDF
      const pdfBuffer = await generatePurchaseSummaryPDF(
        purchaseData,
        start_dat,
        end_dat
      );
      const uint8Array = new Uint8Array(pdfBuffer);
      // Return PDF as download
      return new NextResponse(uint8Array, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Purchase_Summary_Report_${start_dat}_to_${end_dat}.pdf"`,
          "Content-Length": pdfBuffer.length.toString(),
        },
      });
    } catch (error) {
      console.error("PDF Generation Error:", error);
      return NextResponse.json(
        { error: "Failed to generate PDF" },
        { status: 500 }
      );
    }
  }
}

export default new PurchaseReportController();
