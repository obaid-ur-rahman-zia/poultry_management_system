import puppeteer from "puppeteer";

export async function generatePurchaseReportPDF(
  purchaseData,
  startDate,
  endDate
) {
  let browser;

  try {
    console.log("Starting Purchase PDF generation...");
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
    const htmlContent = generatePurchaseReportHTML(
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

function generatePurchaseReportHTML(purchaseData, startDate, endDate) {
  let serialCounter = 1;

  // Check if purchaseData is valid
  if (!purchaseData || !Array.isArray(purchaseData)) {
    console.error("Invalid purchaseData:", purchaseData);
    return "<html><body><h1>No data available</h1></body></html>";
  }

  const purchaseTables = purchaseData
    .map((purchase) => {
      const otherCharges =
        (purchase.packing_fare || 0) + (purchase.loading_fare || 0);

      const productRows = purchase.products
        .map((item) => {
          const currentSerial = serialCounter++;
          return `
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: center; font-size: 9px;">${currentSerial}</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-size: 9px;">${
            item.product.product_title
          }</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-size: 9px;">${
            item.quantity
          }</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-size: 9px;">${
            item.packing
          }</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-size: 9px;">${
            item.total_unit
          }</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-size: 9px;">${Number(
            item.unit_price
          ).toFixed(2)}</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-size: 9px;">${Number(
            item.prod_subtotal_amount
          ).toFixed(2)}</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-size: 9px;">${Number(
            item.total_discount_amount || 0
          ).toFixed(2)}</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-size: 9px;">${Number(
            item.total_tax_amount || 0
          ).toFixed(2)}</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: 500; font-size: 9px;">${Number(
            item.net_amount
          ).toFixed(2)}</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-size: 9px;">${
            item.batch || "-"
          }</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-size: 9px;">${
            item.expiry ? new Date(item.expiry).toLocaleDateString() : "-"
          }</td>
        </tr>
      `;
        })
        .join("");

      return `
      <div style="margin-bottom: 20px; border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; page-break-inside: avoid;">
        <!-- Purchase Info -->
        <div style="margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 6px;">
            <div>
              <strong>Purchase ID:</strong> ${purchase.purchase_id}
              <span style="margin-left: 20px;"><strong>Ref. Invoice ID:</strong> ${
                purchase.invoice_id
              }</span>
            </div>
            <div>
              <strong>Purchase Date:</strong> ${new Date(
                purchase.purchase_dat
              ).toLocaleDateString()}
              <span style="margin-left: 20px;"><strong>Ref. Invoice Date:</strong> ${new Date(
                purchase.invoice_dat
              ).toLocaleDateString()}</span>
            </div>
          </div>
          <div style="font-size: 10px;">
            <strong>Supplier:</strong> ${purchase.suppliers.account_nam} (${
        purchase.suppliers.account_contact || "N/A"
      })
          </div>
        </div>

        <!-- Products Table -->
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f3f4f6; border-bottom: 2px solid #9ca3af;">
              <th style="border: 1px solid #9ca3af; padding: 6px; text-align: left; font-size: 9px;">Sr</th>
              <th style="border: 1px solid #9ca3af; padding: 6px; text-align: left; font-size: 9px;">Item Name</th>
              <th style="border: 1px solid #9ca3af; padding: 6px; text-align: right; font-size: 9px;">Qty</th>
              <th style="border: 1px solid #9ca3af; padding: 6px; text-align: right; font-size: 9px;">Packing</th>
              <th style="border: 1px solid #9ca3af; padding: 6px; text-align: right; font-size: 9px;">Total Units</th>
              <th style="border: 1px solid #9ca3af; padding: 6px; text-align: right; font-size: 9px;">Unit Price</th>
              <th style="border: 1px solid #9ca3af; padding: 6px; text-align: right; font-size: 9px;">Sub Total</th>
              <th style="border: 1px solid #9ca3af; padding: 6px; text-align: right; font-size: 9px;">Disc</th>
              <th style="border: 1px solid #9ca3af; padding: 6px; text-align: right; font-size: 9px;">Tax</th>
              <th style="border: 1px solid #9ca3af; padding: 6px; text-align: right; font-size: 9px;">Net Amount</th>
              <th style="border: 1px solid #9ca3af; padding: 6px; text-align: left; font-size: 9px;">Batch</th>
              <th style="border: 1px solid #9ca3af; padding: 6px; text-align: left; font-size: 9px;">Expiry</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
            <!-- Grand Total Row -->
            <tr style="background-color: #fff7ed; border-top: 2px solid #6b7280; font-weight: bold;">
              <td colspan="3" style="border: 1px solid #6b7280; padding: 8px;"></td>
              <td style="border: 1px solid #6b7280; padding: 8px; text-align: left; font-size: 9px;">Grand Total:</td>
              <td style="border: 1px solid #6b7280; padding: 8px; font-size: 9px;">Sub Total: ${Number(
                purchase.subtotal_amount
              ).toFixed(2)}</td>
              <td style="border: 1px solid #6b7280; padding: 8px; font-size: 9px;">T. Disc: ${Number(
                purchase.total_discount
              ).toFixed(2)}</td>
              <td style="border: 1px solid #6b7280; padding: 8px; font-size: 9px;">T. Tax: ${Number(
                purchase.bill_tax
              ).toFixed(2)}</td>
              <td colspan="3" style="border: 1px solid #6b7280; padding: 8px; font-size: 9px;">
                Other Charges: ${otherCharges.toFixed(2)} | Net: ${Number(
        purchase.total_amount
      ).toFixed(2)}
              </td>
              <td colspan="2" style="border: 1px solid #6b7280;"></td>
            </tr>
          </tbody>
        </table>
      </div>
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
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Purchase Detail Report</h1>
        <p>From: <strong>${new Date(
          startDate
        ).toLocaleDateString()}</strong> To: <strong>${new Date(
    endDate
  ).toLocaleDateString()}</strong></p>
      </div>
      
      ${purchaseTables}
    </body>
    </html>
  `;
}
