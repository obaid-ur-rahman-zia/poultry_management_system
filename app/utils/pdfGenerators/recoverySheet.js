import puppeteer from "puppeteer";

export async function generateRecoverySheetPDF(
  recoveryData,
  customerBalances,
  lastTransactionDates,
  selectedDate,
  areaName,
  subareaName,
  salesmanName
) {
  let browser;

  try {
    console.log("Starting Recovery Sheet PDF generation...");
    console.log("Recovery data count:", recoveryData.length);

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
    const htmlContent = generateRecoveryHTML(
      recoveryData,
      customerBalances,
      lastTransactionDates,
      selectedDate,
      areaName,
      subareaName,
      salesmanName
    );
    console.log("HTML generated, length:", htmlContent.length);

    // Set the HTML content
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    console.log("Content set, generating PDF...");

    // Generate PDF with landscape for wide table
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

function generateRecoveryHTML(
  recoveryData,
  customerBalances,
  lastTransactionDates,
  selectedDate,
  areaName,
  subareaName,
  salesmanName
) {
  if (!recoveryData || !Array.isArray(recoveryData)) {
    console.error("Invalid recoveryData:", recoveryData);
    return "<html><body><h1>No data available</h1></body></html>";
  }

  // Calculate remaining amount
  const calculateRemaining = (totalAmount, receivedAmount) => {
    return Number(totalAmount) - Number(receivedAmount);
  };

  // Calculate grand totals
  let grandTotalReceived = 0;
  let grandTotalRemaining = 0;

  const dataRows = recoveryData
    .map((sale, index) => {
      const serialNumber = index + 1;
      const balance = customerBalances[sale.customer_id] || 0;
      const received = Number(sale.received_amount || 0);
      const remaining = calculateRemaining(
        sale.total_amount,
        sale.received_amount
      );
      const lastDate = lastTransactionDates[sale.customer_id];

      grandTotalReceived += received;
      grandTotalRemaining += remaining;

      return `
      <tr style="border-bottom: 1px solid #e5e7eb; page-break-inside: avoid;">
        <td style="padding: 6px; text-align: center; font-size: 9px;">${serialNumber}</td>
        <td style="padding: 6px; font-weight: 600; font-size: 9px;">${
          sale.customer?.acc_id || sale.customer_id
        }</td>
        <td style="padding: 6px; font-size: 9px;">
          <div style="font-weight: 500;">${
            sale.customer?.account_nam || "N/A"
          }</div>
          <div style="font-size: 8px; color: #666;">
            (${sale.customer?.subarea?.subarea_nam || "N/A"}) | (${
        sale.customer?.account_contact || "N/A"
      })
          </div>
        </td>
        <td style="padding: 6px; font-size: 8px;">${
          sale.customer?.account_address || "N/A"
        }</td>
        <td style="padding: 6px; text-align: right; font-size: 9px; color: ${
          balance < 0 ? "#dc2626" : "#16a34a"
        }; font-weight: 600;">
          ${balance.toFixed(2)}
        </td>
        <td style="padding: 6px; text-align: right; font-size: 9px;">${received.toFixed(
          2
        )}</td>
        <td style="padding: 6px; text-align: right; font-size: 9px; color: ${
          remaining > 0 ? "#dc2626" : "#16a34a"
        }; font-weight: 600;">
          ${remaining.toFixed(2)}
        </td>
        <td style="padding: 6px; text-align: center; font-size: 8px;">
          ${lastDate ? new Date(lastDate).toLocaleDateString() : "N/A"}
        </td>
        <td style="padding: 6px; text-align: center; font-size: 9px;">${
          sale.customer?.account_contact || "N/A"
        }</td>
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
        .header-info {
          font-size: 11px;
          color: #666;
          margin: 3px 0;
        }
        .header-info span {
          font-weight: 600;
          color: #374151;
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
        th {
          background-color: #f3f4f6;
          border: 1px solid #9ca3af;
          padding: 8px;
          font-size: 10px;
          font-weight: bold;
          text-align: left;
        }
        td {
          border: 1px solid #e5e7eb;
        }
        .grand-total {
          background-color: #e5e7eb;
          font-weight: bold;
          border-top: 2px solid #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Recovery Sheet</h1>
        <p class="header-info">
          <span>Date:</span> ${new Date(selectedDate).toLocaleDateString()}
        </p>
        <p class="header-info">
          <span>Salesman:</span> ${salesmanName}
        </p>
        <p class="header-info">
          <span>Area:</span> ${areaName} | <span>Subarea:</span> ${subareaName}
        </p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="text-align: center;">Sr</th>
            <th>C.ID</th>
            <th>Customer Name</th>
            <th>Address</th>
            <th style="text-align: right;">Balance</th>
            <th style="text-align: right;">Received</th>
            <th style="text-align: right;">Remaining</th>
            <th style="text-align: center;">Last Date</th>
            <th style="text-align: center;">Phone</th>
          </tr>
        </thead>
        <tbody>
          ${dataRows}
          
          <!-- Grand Total Row -->
          <tr class="grand-total">
            <td colspan="5" style="padding: 8px; text-align: right; font-size: 10px;">Grand Total:</td>
            <td style="padding: 8px; text-align: right; font-size: 10px;">${grandTotalReceived.toFixed(
              2
            )}</td>
            <td style="padding: 8px; text-align: right; font-size: 10px;">${grandTotalRemaining.toFixed(
              2
            )}</td>
            <td colspan="2"></td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;
}
