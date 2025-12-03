import puppeteer from "puppeteer";

export async function generateSaleSummaryPDF(
  salesData,
  startDate,
  endDate,
  includeProfitQty
) {
  let browser;

  try {
    console.log("Starting Sale Summary PDF generation...");
    console.log("Sales data length:", salesData.length);

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
    const htmlContent = generateSummaryHTML(
      salesData,
      startDate,
      endDate,
      includeProfitQty
    );
    console.log("HTML generated, length:", htmlContent.length);

    // Set the HTML content
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    console.log("Content set, generating PDF...");

    // Generate PDF with landscape orientation for wide table
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

function generateSummaryHTML(salesData, startDate, endDate, includeProfitQty) {
  if (!salesData || !Array.isArray(salesData)) {
    console.error("Invalid salesData:", salesData);
    return "<html><body><h1>No data available</h1></body></html>";
  }

  // Helper functions
  const calculateBillAmount = (products) => {
    return products.reduce((sum, p) => sum + Number(p.prod_subtotal_amount), 0);
  };

  const calculateTotalDiscount = (products) => {
    return products.reduce(
      (sum, p) => sum + Number(p.total_discount_amount || 0),
      0
    );
  };

  const calculateTotalTax = (products) => {
    return products.reduce(
      (sum, p) => sum + Number(p.total_tax_amount || 0),
      0
    );
  };

  const calculateNetAmount = (products) => {
    return products.reduce((sum, p) => sum + Number(p.net_amount), 0);
  };

  const calculateTotalQty = (products) => {
    return products.reduce((sum, item) => sum + Number(item.quantity), 0);
  };

  const calculateProfit = (products) => {
    return products.reduce((totalProfit, item) => {
      const unitPurchasePrice =
        Number(item.product.purchase_price) / Number(item.product.packing);
      const unitSalePrice = Number(item.unit_price);
      const profitPerUnit = unitSalePrice - unitPurchasePrice;
      const productProfit = profitPerUnit * Number(item.quantity);
      return totalProfit + productProfit;
    }, 0);
  };

  // Calculate grand totals
  let grandTotalBillAmount = 0;
  let grandTotalDiscount = 0;
  let grandTotalTax = 0;
  let grandTotalNetBill = 0;
  let grandTotalPackingTax = 0;
  let grandTotalReceived = 0;
  let grandTotalQty = 0;
  let grandTotalProfit = 0;

  const salesRows = salesData
    .map((sale, index) => {
      const billAmount = calculateBillAmount(sale.products);
      const billDiscount = calculateTotalDiscount(sale.products);
      const billTax = calculateTotalTax(sale.products);
      const netBill = calculateNetAmount(sale.products);
      const packingTax = Number(sale.packing_fare) + Number(sale.extra_tax);
      const received = Number(sale.received_amount);
      const purchaseQty = calculateTotalQty(sale.products);
      const profit = calculateProfit(sale.products);

      // Add to grand totals
      grandTotalBillAmount += billAmount;
      grandTotalDiscount += billDiscount;
      grandTotalTax += billTax;
      grandTotalNetBill += netBill;
      grandTotalPackingTax += packingTax;
      grandTotalReceived += received;
      grandTotalQty += purchaseQty;
      grandTotalProfit += profit;

      return `
      <tr style="border-bottom: 1px solid #e5e7eb; page-break-inside: avoid;">
        <td style="padding: 6px; text-align: center; font-size: 9px;">${
          index + 1
        }</td>
        <td style="padding: 6px; font-weight: 600; font-size: 9px;">${
          sale.sale_id
        }</td>
        <td style="padding: 6px; font-size: 9px;">
          <div style="font-weight: 500;">${sale.customer.account_nam}</div>
          <div style="font-size: 8px; color: #666;">
            (${sale.customer.subarea?.subarea_nam || "N/A"}) | (${
        sale.customer.account_contact || "N/A"
      })
          </div>
        </td>
        <td style="padding: 6px; text-align: right; font-size: 9px;">${billAmount.toFixed(
          2
        )}</td>
        <td style="padding: 6px; text-align: right; font-size: 9px;">${billDiscount.toFixed(
          2
        )}</td>
        <td style="padding: 6px; text-align: right; font-size: 9px;">${billTax.toFixed(
          2
        )}</td>
        <td style="padding: 6px; text-align: right; font-weight: 600; font-size: 9px;">${netBill.toFixed(
          2
        )}</td>
        <td style="padding: 6px; text-align: right; font-weight: 600; font-size: 9px;">${packingTax.toFixed(
          2
        )}</td>
        <td style="padding: 6px; text-align: right; font-size: 9px;">${received.toFixed(
          2
        )}</td>
        
        ${
          includeProfitQty
            ? `
          <td style="padding: 6px; text-align: right; font-size: 9px;">${purchaseQty}</td>
          <td style="padding: 6px; text-align: right; font-size: 9px; color: ${
            profit >= 0 ? "#16a34a" : "#dc2626"
          }; font-weight: 600;">
            ${profit.toFixed(2)}
          </td>
        `
            : ""
        }
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
        <h1>Summary of Sales</h1>
        <p>From: <strong>${new Date(
          startDate
        ).toLocaleDateString()}</strong> To: <strong>${new Date(
    endDate
  ).toLocaleDateString()}</strong></p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="text-align: center;">Sr</th>
            <th>Sale ID</th>
            <th>Name</th>
            <th style="text-align: right;">Bill Amount</th>
            <th style="text-align: right;">Bill Discount</th>
            <th style="text-align: right;">Bill Tax</th>
            <th style="text-align: right;">Net Bill</th>
            <th style="text-align: right;">Packing+FBR</th>
            <th style="text-align: right;">Received</th>
            ${
              includeProfitQty
                ? `
              <th style="text-align: right;">Purchase Qty</th>
              <th style="text-align: right;">Profit</th>
            `
                : ""
            }
          </tr>
        </thead>
        <tbody>
          ${salesRows}
          
          <!-- Grand Total Row -->
          <tr class="grand-total">
            <td colspan="3" style="padding: 8px; text-align: right; font-size: 10px;">Grand Total:</td>
            <td style="padding: 8px; text-align: right; font-size: 10px;">${grandTotalBillAmount.toFixed(
              2
            )}</td>
            <td style="padding: 8px; text-align: right; font-size: 10px;">${grandTotalDiscount.toFixed(
              2
            )}</td>
            <td style="padding: 8px; text-align: right; font-size: 10px;">${grandTotalTax.toFixed(
              2
            )}</td>
            <td style="padding: 8px; text-align: right; font-size: 10px;">${grandTotalNetBill.toFixed(
              2
            )}</td>
            <td style="padding: 8px; text-align: right; font-size: 10px;">${grandTotalPackingTax.toFixed(
              2
            )}</td>
            <td style="padding: 8px; text-align: right; font-size: 10px;">${grandTotalReceived.toFixed(
              2
            )}</td>
            ${
              includeProfitQty
                ? `
              <td style="padding: 8px; text-align: right; font-size: 10px;">${grandTotalQty}</td>
              <td style="padding: 8px; text-align: right; font-size: 10px;">${grandTotalProfit.toFixed(
                2
              )}</td>
            `
                : ""
            }
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;
}
