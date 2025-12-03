import puppeteer from "puppeteer";

export async function generatePurchaseSummaryPDF(
  purchaseData,
  startDate,
  endDate
) {
  let browser;

  try {
    console.log("Starting Purchase Summary PDF generation...");
    console.log("Purchase data length:", purchaseData.length);

    // Launch browser with more options
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });

    console.log("Browser launched");

    const page = await browser.newPage();

    // Generate HTML content
    const htmlContent = generatePurchaseSummaryHTML(
      purchaseData,
      startDate,
      endDate
    );
    console.log("HTML generated, length:", htmlContent.length);

    // Set the HTML content
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    console.log("Content set, generating PDF...");

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        right: "10mm",
        bottom: "15mm",
        left: "10mm",
      },
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; padding: 5px;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
      preferCSSPageSize: false,
    });

    console.log("PDF generated, size:", pdfBuffer.length, "bytes");

    return pdfBuffer;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    console.error("Error stack:", error.stack);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
      console.log("Browser closed");
    }
  }
}

function generatePurchaseSummaryHTML(purchaseData, startDate, endDate) {
  // Check if purchaseData is valid
  if (!purchaseData || !Array.isArray(purchaseData)) {
    console.error("Invalid purchaseData:", purchaseData);
    return "<html><body><h1>No data available</h1></body></html>";
  }

  // Calculate grand totals
  const grandTotals = purchaseData.reduce(
    (acc, purchase) => ({
      subtotal: acc.subtotal + Number(purchase.subtotal_amount),
      discount: acc.discount + Number(purchase.total_discount),
      tax: acc.tax + Number(purchase.bill_tax),
      otherCharges:
        acc.otherCharges +
        (Number(purchase.packing_fare) + Number(purchase.loading_fare)),
      netAmount: acc.netAmount + Number(purchase.total_amount),
    }),
    { subtotal: 0, discount: 0, tax: 0, otherCharges: 0, netAmount: 0 }
  );

  const purchaseRows = purchaseData
    .map((purchase, index) => {
      const otherCharges =
        Number(purchase.packing_fare) + Number(purchase.loading_fare);

      return `
        <tr style="page-break-inside: avoid;">
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: center; font-size: 10px;">${
            index + 1
          }</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-weight: 600; font-size: 10px;">${
            purchase.purchase_id
          }</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-size: 10px;">${new Date(
            purchase.purchase_dat
          ).toLocaleDateString()}</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-size: 10px;">
            <div style="font-weight: 500;">${
              purchase.suppliers.account_nam
            }</div>
            <div style="font-size: 9px; color: #666;">(${
              purchase.suppliers.account_contact || "N/A"
            })</div>
          </td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-size: 10px;">${Number(
            purchase.subtotal_amount
          ).toFixed(2)}</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: 600; font-size: 10px;">${Number(
            purchase.total_discount
          ).toFixed(2)}</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: 600; font-size: 10px;">${Number(
            purchase.bill_tax
          ).toFixed(2)}</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-size: 10px;">${otherCharges.toFixed(
            2
          )}</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-size: 10px;">${Number(
            purchase.total_amount
          ).toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .header {
          text-align: center;
          margin-bottom: 15px;
        }
        .header h1 {
          font-size: 20px;
          margin: 0 0 5px 0;
        }
        .header p {
          font-size: 12px;
          color: #666;
          margin: 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        thead {
          display: table-header-group;
        }
        tbody {
          display: table-row-group;
        }
        tr {
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Purchase Summary</h1>
        <p>From: <strong>${new Date(
          startDate
        ).toLocaleDateString()}</strong> To: <strong>${new Date(
    endDate
  ).toLocaleDateString()}</strong></p>
      </div>
      
      <table>
        <thead>
          <tr style="background-color: #f3f4f6; border-bottom: 2px solid #9ca3af;">
            <th style="border: 1px solid #9ca3af; padding: 8px; text-align: left; font-weight: bold; font-size: 11px;">Sr</th>
            <th style="border: 1px solid #9ca3af; padding: 8px; text-align: left; font-weight: bold; font-size: 11px;">Pur. ID</th>
            <th style="border: 1px solid #9ca3af; padding: 8px; text-align: left; font-weight: bold; font-size: 11px;">Date</th>
            <th style="border: 1px solid #9ca3af; padding: 8px; text-align: left; font-weight: bold; font-size: 11px;">Supplier</th>
            <th style="border: 1px solid #9ca3af; padding: 8px; text-align: right; font-weight: bold; font-size: 11px;">Subtotal</th>
            <th style="border: 1px solid #9ca3af; padding: 8px; text-align: right; font-weight: bold; font-size: 11px;">Disc.</th>
            <th style="border: 1px solid #9ca3af; padding: 8px; text-align: right; font-weight: bold; font-size: 11px;">Tax</th>
            <th style="border: 1px solid #9ca3af; padding: 8px; text-align: right; font-weight: bold; font-size: 11px;">Other Charges</th>
            <th style="border: 1px solid #9ca3af; padding: 8px; text-align: right; font-weight: bold; font-size: 11px;">Net Amount</th>
          </tr>
        </thead>
        <tbody>
          ${purchaseRows}
          
          <!-- Grand Total Row -->
          <tr style="background-color: #e5e7eb; border-top: 2px solid #6b7280; font-weight: bold; page-break-inside: avoid;">
            <td colspan="4" style="border: 1px solid #6b7280; padding: 8px; font-size: 11px;">Grand Total:</td>
            <td style="border: 1px solid #6b7280; padding: 8px; text-align: right; font-size: 11px;">${grandTotals.subtotal.toFixed(
              2
            )}</td>
            <td style="border: 1px solid #6b7280; padding: 8px; text-align: right; font-size: 11px;">${grandTotals.discount.toFixed(
              2
            )}</td>
            <td style="border: 1px solid #6b7280; padding: 8px; text-align: right; font-size: 11px;">${grandTotals.tax.toFixed(
              2
            )}</td>
            <td style="border: 1px solid #6b7280; padding: 8px; text-align: right; font-size: 11px;">${grandTotals.otherCharges.toFixed(
              2
            )}</td>
            <td style="border: 1px solid #6b7280; padding: 8px; text-align: right; font-size: 11px;">${grandTotals.netAmount.toFixed(
              2
            )}</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;
}
