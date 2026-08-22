import AccountSubHeadRepository from "@/app/repositories/account/accountSubHead/accountSubHeadRepository";
import { errorResponse } from "@/app/utils/response";
import puppeteer from "puppeteer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const data = await AccountSubHeadRepository.readTrialBalance(
      startDate,
      endDate,
    );

    const html = buildReportHtml(data, startDate, endDate);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "15mm", bottom: "15mm", left: "12mm", right: "12mm" },
    });

    await browser.close();

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Subhead_Trial_Balance_${new Date().toISOString().split("T")[0]}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Print route error:", err);
    return errorResponse(err, 500);
  }
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function getDateRangeText(startDate, endDate) {
  if (startDate && endDate)
    return `From ${new Date(startDate).toLocaleDateString()} To ${new Date(endDate).toLocaleDateString()}`;
  if (startDate)
    return `From ${new Date(startDate).toLocaleDateString()} To ${new Date().toLocaleDateString()}`;
  if (endDate)
    return `From Beginning To ${new Date(endDate).toLocaleDateString()}`;
  return "All Time Records";
}

function buildReportHtml(data, startDate, endDate) {
  const { details = [], conclusion, wholeSaleProfit } = data;

  const subheadSections = details
    .filter((s) => s.accounts.length > 0)
    .map((subhead) => {
      const rows = subhead.accounts
        .map(
          (acc) => `
        <tr>
          <td>${acc.name}</td>
          <td>${acc.contact || "-"}</td>
          <td class="num">${formatCurrency(acc.total_debit)}</td>
          <td class="num">${formatCurrency(acc.total_credit)}</td>
          <td class="num bold">${formatCurrency(acc.balance)}</td>
        </tr>`,
        )
        .join("");

      return `
      <div class="section">
        <div class="subhead-header">${subhead.subhead_nam} <span class="badge">${subhead.accounts.length} Accounts</span></div>
        <table>
          <thead>
            <tr>
              <th style="width:40%">Account Name</th>
              <th style="width:15%">Contact</th>
              <th style="width:15%" class="num">Total Debit</th>
              <th style="width:15%" class="num">Total Credit</th>
              <th style="width:15%" class="num">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="subtotal-row">
          <span>Total ${subhead.subhead_nam}</span>
          <span></span>
          <span class="num green">${formatCurrency(subhead.total_debit)}</span>
          <span class="num red">${formatCurrency(subhead.total_credit)}</span>
          <span class="num blue bold">${formatCurrency(subhead.total_balance)}</span>
        </div>
      </div>`;
    })
    .join("");

  const wholeSaleSection = wholeSaleProfit
    ? `
    <div class="section">
      <div class="section-title">WHOLE SALE PROFIT</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Balance of Income Acc under Income (Credit)</td>
            <td class="num green bold">${formatCurrency(wholeSaleProfit.income_acc_credit)}</td>
          </tr>
          <tr>
            <td>Total Expense Head Balance</td>
            <td class="num red bold">${formatCurrency(wholeSaleProfit.expense_head_debit)}</td>
          </tr>
          <tr class="total-row">
            <td class="bold">Whole Sale Profit</td>
            <td class="num blue bold large">${formatCurrency(wholeSaleProfit.profit)}</td>
          </tr>
        </tbody>
      </table>
    </div>`
    : "";

  const conclusionSection = conclusion
    ? `
    <div class="section">
      <div class="section-title">GRAND CONCLUSION</div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="num green-h">Total Debit</th>
            <th class="num red-h">Total Credit</th>
            <th class="num blue-h">Total Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr class="total-row">
            <td class="bold">Final Aggregates</td>
            <td class="num green bold large">${formatCurrency(conclusion.total_debit)}</td>
            <td class="num red bold large">${formatCurrency(conclusion.total_credit)}</td>
            <td class="num blue bold large">${formatCurrency(conclusion.total_balance)}</td>
          </tr>
        </tbody>
      </table>
    </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Overall Business Report</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      color: #222;
      background: #fff;
    }
    .report-header {
      text-align: center;
      margin-bottom: 12px;
      border-bottom: 2px solid #333;
      padding-bottom: 8px;
    }
    .report-header h1 {
      font-size: 16px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .report-header p { font-size: 10px; color: #555; margin-top: 2px; }
    .section { margin-bottom: 14px; }
    .subhead-header {
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 4px;
      color: #1a1a1a;
      border-left: 3px solid #2d6a4f;
      padding-left: 6px;
    }
    .section-title {
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      color: #1a1a1a;
      border-bottom: 1px solid #999;
      margin-bottom: 6px;
      padding-bottom: 3px;
    }
    .badge {
      font-size: 8px;
      font-weight: normal;
      background: #e2e8f0;
      border-radius: 3px;
      padding: 1px 4px;
      color: #555;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2px;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 3px 5px;
      font-size: 9.5px;
    }
    thead tr { background: #f1f5f9; }
    th { font-weight: bold; color: #333; }
    tbody tr:nth-child(even) { background: #fafafa; }
    .num { text-align: right; }
    .bold { font-weight: bold; }
    .large { font-size: 11px; }
    .green { color: #166534; }
    .red { color: #991b1b; }
    .blue { color: #1e3a8a; }
    .green-h { color: #166534; }
    .red-h { color: #991b1b; }
    .blue-h { color: #1e3a8a; }
    .subtotal-row {
      display: grid;
      grid-template-columns: 40% 15% 15% 15% 15%;
      background: #e5e7eb;
      border: 1.5px solid #ccc;
      padding: 3px 5px;
      font-weight: bold;
      font-size: 9.5px;
      margin-bottom: 10px;
    }
    .total-row { background: #e5e7eb; }
    @page { margin: 0; }
  </style>
</head>
<body>
  <div class="report-header">
    <h1>Overall Business Report</h1>
    <p>${getDateRangeText(startDate, endDate)}</p>
  </div>

  ${subheadSections}
  ${wholeSaleSection}
  ${conclusionSection}
</body>
</html>`;
}
