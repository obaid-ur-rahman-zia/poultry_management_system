import { generateSaleReportPDF } from "@/app/utils/pdfGenerators/saleReport";
import SaleRepository from "@/app/repositories/sale/saleRepository";
import { NextResponse } from "next/server";
import { generateSaleSummaryPDF } from "@/app/utils/pdfGenerators/saleSummary";

class SaleReportController {
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
      const salesData = await SaleRepository.readReportDetail({
        start_dat,
        end_dat,
      });

      // Generate PDF
      const pdfBuffer = await generateSaleReportPDF(
        salesData,
        start_dat,
        end_dat
      );
      const uint8Array = new Uint8Array(pdfBuffer);
      // Return PDF as download
      return new NextResponse(uint8Array, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Sale_Report_${start_dat}_to_${end_dat}.pdf"`,
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
      const includeProfitQty = searchParams.get("includeProfitQty") === "true";

      if (!start_dat || !end_dat) {
        return NextResponse.json(
          { error: "start_dat and end_dat are required" },
          { status: 400 }
        );
      }

      // Fetch sales data
      const salesData = await SaleRepository.readReportDetail({
        start_dat,
        end_dat,
      });

      // Generate PDF
      const pdfBuffer = await generateSaleSummaryPDF(
        salesData,
        start_dat,
        end_dat,
        includeProfitQty
      );
      const uint8Array = new Uint8Array(pdfBuffer);

      // Return PDF as download
      return new NextResponse(uint8Array, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Sale_Summary_${start_dat}_to_${end_dat}.pdf"`,
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

export default new SaleReportController();
