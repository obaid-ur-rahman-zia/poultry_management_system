import puppeteer from "puppeteer";

export async function generateSaleReportPDF(salesData, startDate, endDate) {
  let browser;

  try {
    console.log("Starting PDF generation...");
    console.log("Sales data length:", salesData.length);

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
    const htmlContent = generateReportHTML(salesData, startDate, endDate);
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

function generateReportHTML(salesData, startDate, endDate) {
  let serialCounter = 1;

  // Check if salesData is valid
  if (!salesData || !Array.isArray(salesData)) {
    console.error("Invalid salesData:", salesData);
    return "<html><body><h1>No data available</h1></body></html>";
  }

  const salesRows = salesData
    .map((sale) => {
      const totalQty = sale.products.reduce((sum, p) => sum + p.quantity, 0);
      const totalDiscount = sale.products.reduce(
        (sum, p) => sum + (p.total_discount_amount || 0),
        0
      );
      const totalTax = sale.products.reduce(
        (sum, p) => sum + (p.total_tax_amount || 0),
        0
      );
      const totalNetAmount = sale.products.reduce(
        (sum, p) => sum + p.net_amount,
        0
      );
      const totalBeforeDiscount = sale.products.reduce(
        (sum, p) => sum + p.prod_subtotal_amount,
        0
      );

      const productRows = sale.products
        .map((item) => {
          const currentSerial = serialCounter++;
          return `
        <tr>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: center; font-size: 10px;">${currentSerial}</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; font-size: 10px;">${
            item.product.product_title
          }</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-size: 10px;">${item.unit_price.toFixed(
            2
          )}</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-size: 10px;">${
            item.quantity
          }</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-size: 10px;">${item.prod_subtotal_amount.toFixed(
            2
          )}</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-size: 10px;">${(
            item.total_discount_amount || 0
          ).toFixed(2)}</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-size: 10px;">${(
            item.total_tax_amount || 0
          ).toFixed(2)}</td>
          <td style="border: 1px solid #e5e7eb; padding: 6px; text-align: right; font-weight: 500; font-size: 10px;">${item.net_amount.toFixed(
            2
          )}</td>
        </tr>
      `;
        })
        .join("");

      return `
      <tr style="background-color: #dbeafe; border-top: 2px solid #9ca3af; page-break-inside: avoid;">
        <td style="padding: 8px; font-weight: 600; border: 1px solid #9ca3af; font-size: 10px;">${
          sale.sale_id
        }</td>
        <td style="padding: 8px; border: 1px solid #9ca3af; font-size: 10px;">
          <div style="font-weight: 600;">
            ${sale.customer.account_nam} (${
        sale.customer.subarea?.subarea_nam || "N/A"
      }) | (${sale.customer.account_contact || "N/A"})
          </div>
        </td>
        <td colspan="6" style="padding: 8px; text-align: center; font-weight: 500; border: 1px solid #9ca3af; font-size: 10px;">
          ${new Date(sale.sale_dat).toLocaleDateString()}
        </td>
      </tr>
      ${productRows}
      <tr style="background-color: #f3f4f6; border-top: 2px solid #6b7280; font-weight: bold; page-break-inside: avoid;">
        <td colspan="3" style="padding: 8px; border: 1px solid #6b7280;"></td>
        <td style="padding: 8px; text-align: right; border: 1px solid #6b7280; font-size: 10px;">Qty: ${totalQty}</td>
        <td style="padding: 8px; text-align: right; border: 1px solid #6b7280; font-size: 10px;">Subtotal: ${totalBeforeDiscount.toFixed(
          2
        )}</td>
        <td style="padding: 8px; text-align: right; border: 1px solid #6b7280; font-size: 10px;">Disc: ${totalDiscount.toFixed(
          2
        )}</td>
        <td style="padding: 8px; text-align: right; border: 1px solid #6b7280; font-size: 10px;">Tax:${totalTax.toFixed(
          2
        )}</td>
        <td style="padding: 8px; text-align: right; border: 1px solid #6b7280; font-size: 10px;">Net: ${totalNetAmount.toFixed(
          2
        )}</td>
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
        <h1>Sale Detail Report</h1>
        <p>From: <strong>${new Date(
          startDate
        ).toLocaleDateString()}</strong> To: <strong>${new Date(
    endDate
  ).toLocaleDateString()}</strong></p>
      </div>
      
      <table>
        <thead>
          <tr style="background-color: #f3f4f6; border-bottom: 2px solid #9ca3af;">
            <th style="padding: 8px; text-align: left; font-weight: bold; border: 1px solid #9ca3af; font-size: 11px;">Sr</th>
            <th style="padding: 8px; text-align: left; font-weight: bold; border: 1px solid #9ca3af; font-size: 11px;">Description</th>
            <th style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid #9ca3af; font-size: 11px;">Price</th>
            <th style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid #9ca3af; font-size: 11px;">Qty</th>
            <th style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid #9ca3af; font-size: 11px;">Sub Total</th>
            <th style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid #9ca3af; font-size: 11px;">Discount</th>
            <th style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid #9ca3af; font-size: 11px;">Tax</th>
            <th style="padding: 8px; text-align: right; font-weight: bold; border: 1px solid #9ca3af; font-size: 11px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${salesRows}
        </tbody>
      </table>
    </body>
    </html>
  `;
}
