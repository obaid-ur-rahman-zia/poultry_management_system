import puppeteer from "puppeteer";

export async function generateWholeSaleDetailReportPDF(reportData, startDate, endDate) {
  let browser;

  try {
    console.log("Starting Whole Sale Detail Report PDF generation...");
    console.log("Report data length:", reportData.length);

    browser = await puppeteer.launch({
      headless: "new",
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
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
    const htmlContent = generateReportHTML(reportData, startDate, endDate);
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

function generateReportHTML(reportData, startDate, endDate) {
  if (!reportData || !Array.isArray(reportData)) {
    console.error("Invalid reportData:", reportData);
    return "<html><body><h1>No data available</h1></body></html>";
  }

  // Group sales by Date then by Former
  const groupedByDate = reportData.reduce((acc, item) => {
    const dateStr = new Date(item.sale_date).toLocaleDateString("en-GB").replace(/\//g, "-");

    if (!acc[dateStr]) {
      acc[dateStr] = {
        dateStr,
        formers: {},
      };
    }

    const formerKey =
      item.former_account_ref?.account_id ||
      item.former_account_ref?.account_nam ||
      "Unknown";
    const formerName = item.former_account_ref?.account_nam || "Unknown";

    if (!acc[dateStr].formers[formerKey]) {
      acc[dateStr].formers[formerKey] = {
        formerName,
        formerContact: item.former_account_ref?.account_contact || "",
        sales: [],
      };
    }

    acc[dateStr].formers[formerKey].sales.push(item);
    return acc;
  }, {});

  // Compute per-former and per-date totals
  const dates = Object.values(groupedByDate).map((dateGroup) => {
    const formers = Object.values(dateGroup.formers).map((group) => {
      const totalWeight = group.sales.reduce((s, i) => s + (Number(i.weight) || 0), 0);
      const totalFormerAmount = group.sales.reduce((s, i) => s + (Number(i.former_amount) || 0), 0);
      const totalPurchaserAmount = group.sales.reduce((s, i) => s + (Number(i.purcher_amount) || 0), 0);
      const totalProfit = group.sales.reduce((s, i) => s + (Number(i.profit) || 0), 0);
      return {
        ...group,
        totalWeight,
        totalFormerAmount,
        totalPurchaserAmount,
        totalProfit,
      };
    });

    const dateTotalWeight = formers.reduce((s, f) => s + f.totalWeight, 0);
    const dateTotalFormerAmount = formers.reduce((s, f) => s + f.totalFormerAmount, 0);
    const dateTotalPurchaserAmount = formers.reduce((s, f) => s + f.totalPurchaserAmount, 0);
    const dateTotalProfit = formers.reduce((s, f) => s + f.totalProfit, 0);

    return {
      dateStr: dateGroup.dateStr,
      formers,
      dateTotalWeight,
      dateTotalFormerAmount,
      dateTotalPurchaserAmount,
      dateTotalProfit,
    };
  });

  // Grand totals
  const grandTotalWeight = dates.reduce((s, d) => s + d.dateTotalWeight, 0);
  const grandTotalFormerAmount = dates.reduce((s, d) => s + d.dateTotalFormerAmount, 0);
  const grandTotalPurchaserAmount = dates.reduce((s, d) => s + d.dateTotalPurchaserAmount, 0);
  const grandTotalProfit = dates.reduce((s, d) => s + d.dateTotalProfit, 0);

  const fmt = (n, decimals = 2) =>
    Number(n).toLocaleString(undefined, { minimumFractionDigits: decimals });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB").replace(/\//g, "-");
  };

  let tableContent = "";

  if (dates.length === 0) {
    tableContent = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 20px; color: #666;">
          No records found for this period
        </td>
      </tr>
    `;
  } else {
    dates.forEach((dateGroup, di) => {
      // Date Header
      tableContent += `
        <tr>
          <td colspan="9" style="padding: 4px; font-weight: bold; text-align: center; border: 1px solid black; font-size: 14px; background-color: #e5e7eb;">
            Date: ${dateGroup.dateStr}
          </td>
        </tr>
      `;

      dateGroup.formers.forEach((group, gi) => {
        // Former Header
        tableContent += `
          <tr>
            <td colspan="9" style="padding: 4px; font-weight: bold; background-color: #f9fafb; border: 1px solid black; font-size: 14px;">
              ${group.formerName}
            </td>
          </tr>
        `;

        // Sale Rows
        group.sales.forEach((item, si) => {
          tableContent += `
            <tr style="font-size: 10px;">
              <td style="padding: 4px; border: 1px solid black; text-align: center;">${si + 1}</td>
              <td style="padding: 4px; border: 1px solid black;">${item.van_number || "-"}</td>
              <td style="padding: 4px; border: 1px solid black; text-align: right; font-family: monospace;">${fmt(item.weight, 0)}</td>
              <td style="padding: 4px; border: 1px solid black; text-align: right; font-family: monospace;">${fmt(item.former_rate)}</td>
              <td style="padding: 4px; border: 1px solid black; text-align: right; font-family: monospace;">${fmt(item.former_amount)}</td>
              <td style="padding: 4px; border: 1px solid black;">${item.purcher_account_ref?.account_nam || "—"}</td>
              <td style="padding: 4px; border: 1px solid black; text-align: right; font-family: monospace;">${fmt(item.purcher_rate || 0)}</td>
              <td style="padding: 4px; border: 1px solid black; text-align: right; font-family: monospace;">${fmt(item.purcher_amount)}</td>
              <td style="padding: 4px; border: 1px solid black; text-align: right; font-family: monospace; font-weight: bold;">${fmt(item.profit)}</td>
            </tr>
          `;
        });

        // Former Subtotal
        tableContent += `
          <tr style="font-size: 10px; font-weight: bold; background-color: #f3f4f6;">
            <td colspan="2" style="padding: 4px; border: 1px solid black; text-align: right;">Total:</td>
            <td style="padding: 4px; border: 1px solid black; text-align: right; font-family: monospace;">${fmt(group.totalWeight, 0)}</td>
            <td style="padding: 4px; border: 1px solid black;"></td>
            <td style="padding: 4px; border: 1px solid black; text-align: right; font-family: monospace;">${fmt(group.totalFormerAmount)}</td>
            <td style="padding: 4px; border: 1px solid black;"></td>
            <td style="padding: 4px; border: 1px solid black;"></td>
            <td style="padding: 4px; border: 1px solid black; text-align: right; font-family: monospace;">${fmt(group.totalPurchaserAmount)}</td>
            <td style="padding: 4px; border: 1px solid black; text-align: right; font-family: monospace;">${fmt(group.totalProfit)}</td>
          </tr>
        `;
      });

      // Date Subtotal
      tableContent += `
        <tr style="font-size: 10px; font-weight: bold;">
          <td colspan="2" style="padding: 4px; border: 1px solid black; text-align: right;">Date Total (${dateGroup.dateStr}):</td>
          <td style="padding: 4px; border: 1px solid black; text-align: right; font-family: monospace;">${fmt(dateGroup.dateTotalWeight, 0)}</td>
          <td style="padding: 4px; border: 1px solid black;"></td>
          <td style="padding: 4px; border: 1px solid black; text-align: right; font-family: monospace;">${fmt(dateGroup.dateTotalFormerAmount)}</td>
          <td style="padding: 4px; border: 1px solid black;"></td>
          <td style="padding: 4px; border: 1px solid black;"></td>
          <td style="padding: 4px; border: 1px solid black; text-align: right; font-family: monospace;">${fmt(dateGroup.dateTotalPurchaserAmount)}</td>
          <td style="padding: 4px; border: 1px solid black; text-align: right; font-family: monospace;">${fmt(dateGroup.dateTotalProfit)}</td>
        </tr>
      `;

      if (di < dates.length - 1) {
        tableContent += `
          <tr>
            <td colspan="9" style="padding: 8px; border: none; background-color: white;"></td>
          </tr>
        `;
      }
    });

    // Grand Total
    tableContent += `
      <tr style="font-size: 11px; font-weight: bold; background-color: #1f2937; color: white;">
        <td colspan="2" style="padding: 6px; border: 1px solid black; text-align: right;">Grand Total:</td>
        <td style="padding: 6px; border: 1px solid black; text-align: right; font-family: monospace;">${fmt(grandTotalWeight, 0)}</td>
        <td style="padding: 6px; border: 1px solid black;"></td>
        <td style="padding: 6px; border: 1px solid black; text-align: right; font-family: monospace;">${fmt(grandTotalFormerAmount)}</td>
        <td style="padding: 6px; border: 1px solid black;"></td>
        <td style="padding: 6px; border: 1px solid black;"></td>
        <td style="padding: 6px; border: 1px solid black; text-align: right; font-family: monospace;">${fmt(grandTotalPurchaserAmount)}</td>
        <td style="padding: 6px; border: 1px solid black; text-align: right; font-family: monospace;">${fmt(grandTotalProfit)}</td>
      </tr>
    `;
  }

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
        .header h2 {
          font-size: 16px;
          margin: 0 0 5px 0;
          text-transform: uppercase;
        }
        .header p {
          font-size: 12px;
          color: #666;
          margin: 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
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
          border: 1px solid black;
          padding: 4px;
          font-size: 11px;
          font-weight: bold;
          text-align: left;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>BHAGTANWALA POULTRY NETWORK</h1>
        <h2>Whole Sale Report</h2>
        <p>${formatDate(startDate)} – ${formatDate(endDate)}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="width: 5%; text-align: center;">Sr.No.</th>
            <th style="width: 12%;">Van #</th>
            <th style="width: 10%; text-align: right;">Weight</th>
            <th style="width: 11%; text-align: right;">Former Rate</th>
            <th style="width: 13%; text-align: right;">Former Amt</th>
            <th style="width: 15%;">Purchaser</th>
            <th style="width: 11%; text-align: right;">Purcher Rate</th>
            <th style="width: 13%; text-align: right;">Purcher Amt</th>
            <th style="width: 10%; text-align: right;">Profit</th>
          </tr>
        </thead>
        <tbody>
          ${tableContent}
        </tbody>
      </table>
    </body>
    </html>
  `;
}
