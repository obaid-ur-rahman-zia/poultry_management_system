import puppeteer from "puppeteer";

export async function generateAccountLedgerPDF(
  transactions,
  openingBalance,
  accountsData,
  startDate,
  endDate,
  acc_id
) {
  let browser;

  try {
    console.log("Starting Account Ledger PDF generation...");
    console.log("Transactions count:", transactions.length);

    // Find the account data
    const accountData = accountsData.find(
      (acc) => acc.acc_id === parseInt(acc_id)
    );

    if (!accountData) {
      throw new Error(`Account with ID ${acc_id} not found`);
    }

    console.log("Account found:", accountData.account_nam);

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
    const htmlContent = generateLedgerHTML(
      transactions,
      openingBalance,
      accountData,
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

function generateLedgerHTML(
  transactions,
  openingBalance,
  accountData,
  startDate,
  endDate
) {
  if (!transactions || !Array.isArray(transactions)) {
    console.error("Invalid transactions:", transactions);
    return "<html><body><h1>No data available</h1></body></html>";
  }

  if (!accountData) {
    console.error("Invalid accountData:", accountData);
    return "<html><body><h1>Account data not available</h1></body></html>";
  }

  // Format account code with null safety
  const formatAccountCode = (accountData) => {
    try {
      const head_id = accountData.head_id || 0;
      const sub_id = accountData.subhead?.subhead_id || accountData.sub_id || 0;
      const account_id = accountData.account_id || 0;

      const headPart = String(head_id).padStart(2, "0");
      const subPart = String(sub_id).padStart(3, "0");
      const accountPart = String(account_id).padStart(5, "0");
      return `${headPart}-${subPart}-${accountPart}`;
    } catch (error) {
      console.error("Error formatting account code:", error);
      return "N/A";
    }
  };

  // Calculate running balance
  const calculateRunningBalance = (index) => {
    let balance = openingBalance;
    for (let i = 0; i <= index; i++) {
      const trans = transactions[i];
      balance += (trans.debit || 0) - (trans.credit || 0);
    }
    return balance;
  };

  // Calculate totals
  const totalDebit = transactions.reduce((sum, t) => sum + (t.debit || 0), 0);
  const totalCredit = transactions.reduce((sum, t) => sum + (t.credit || 0), 0);
  const closingBalance =
    transactions.length > 0
      ? calculateRunningBalance(transactions.length - 1)
      : openingBalance;

  const transactionRows = transactions
    .map((trans, index) => {
      const serialNumber = index + 1;
      const runningBalance = calculateRunningBalance(index);

      return `
      <tr style="border-bottom: 1px solid #e5e7eb; page-break-inside: avoid;">
        <td style="padding: 6px; text-align: center; font-size: 10px;">${serialNumber}</td>
        <td style="padding: 6px; font-size: 10px;">${new Date(
          trans.transaction_dat
        ).toLocaleDateString()}</td>
        <td style="padding: 6px; font-size: 10px;">${trans.t_id}</td>
        <td style="padding: 6px; font-size: 10px;">${trans.remarks || "-"}</td>
        <td style="padding: 6px; text-align: right; font-size: 10px;">${
          trans.debit ? trans.debit.toFixed(2) : "-"
        }</td>
        <td style="padding: 6px; text-align: right; font-size: 10px;">${
          trans.credit ? trans.credit.toFixed(2) : "-"
        }</td>
        <td style="padding: 6px; text-align: right; font-weight: 500; font-size: 10px; color: ${
          runningBalance < 0 ? "#dc2626" : "#16a34a"
        };">
          ${runningBalance.toFixed(2)}
        </td>
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
        .account-details {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 10px;
          margin: 10px auto;
          max-width: 500px;
        }
        .account-details div {
          margin-bottom: 5px;
          font-size: 11px;
        }
        .account-details .label {
          font-weight: bold;
          color: #374151;
        }
        .account-details .value {
          color: #111827;
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
          border: 1px solid #9ca3af;
          padding: 8px;
          font-size: 11px;
          font-weight: bold;
          text-align: left;
        }
        td {
          border: 1px solid #e5e7eb;
        }
        .opening-balance {
          background-color: #dbeafe;
          font-weight: 600;
        }
        .closing-balance {
          background-color: #e5e7eb;
          font-weight: bold;
          border-top: 2px solid #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Account Ledger</h1>
        <p>From: <strong>${new Date(
          startDate
        ).toLocaleDateString()}</strong> To: <strong>${new Date(
    endDate
  ).toLocaleDateString()}</strong></p>
      </div>
      
      <!-- Account Details -->
      <div class="account-details">
        <div>
          <span class="label">Account Name: </span>
          <span class="value">${accountData.account_nam || "N/A"}</span>
        </div>
        <div>
          <span class="label">Account Code: </span>
          <span class="value" style="font-family: monospace;">
            ${formatAccountCode(accountData)}
          </span>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="text-align: center;">Sr. No</th>
            <th>Date</th>
            <th>T.No</th>
            <th>Description</th>
            <th style="text-align: right;">Debit</th>
            <th style="text-align: right;">Credit</th>
            <th style="text-align: right;">Balance</th>
          </tr>
        </thead>
        <tbody>
          <!-- Opening Balance Row -->
          <tr class="opening-balance">
            <td style="padding: 6px;"></td>
            <td colspan="3" style="padding: 6px; font-size: 10px;">Opening Balance</td>
            <td style="padding: 6px; text-align: right;"></td>
            <td style="padding: 6px; text-align: right;"></td>
            <td style="padding: 6px; text-align: right; font-size: 10px; color: ${
              openingBalance < 0 ? "#dc2626" : "#16a34a"
            };">
              ${openingBalance.toFixed(2)}
            </td>
          </tr>
          
          <!-- Transaction Rows -->
          ${transactionRows}
          
          <!-- Closing Balance Row -->
          <tr class="closing-balance">
            <td colspan="4" style="padding: 8px; font-size: 11px;">Closing Balance</td>
            <td style="padding: 8px; text-align: right; font-size: 11px;">${totalDebit.toFixed(
              2
            )}</td>
            <td style="padding: 8px; text-align: right; font-size: 11px;">${totalCredit.toFixed(
              2
            )}</td>
            <td style="padding: 8px; text-align: right; font-size: 11px; color: ${
              closingBalance < 0 ? "#dc2626" : "#16a34a"
            };">
              ${closingBalance.toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;
}
