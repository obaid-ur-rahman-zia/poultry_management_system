import React, { useRef, useEffect, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Printer, X } from "lucide-react";

const Invoice = ({ data, type = "sale", onClose }) => {
  const printRef = useRef();
  const [Subtotal, setSubtotal] = useState(0);

  useEffect(() => {
    const subtotal = data.items.reduce((acc, item) => {
      return acc + item.net_amount;
    }, 0);
    setSubtotal(subtotal);
  }, [data]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${type === "sale" ? "Invoice" : "Quotation"}-${
      data.sale_id || data.quotation_id || "New"
    }`,
    pageStyle: `
      @page {
        size: 4.1in 5.2in;
        margin: 0.2in;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PKR",
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Action Buttons - Hidden on Print */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {type === "sale" ? "Sales Invoice" : "Quotation"}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Printer size={18} />
              Print
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              <X size={18} />
              Close
            </button>
          </div>
        </div>

        {/* Invoice Content - This will be printed */}
        <div ref={printRef}>
          <PrintableInvoice
            data={data}
            type={type}
            Subtotal={Subtotal}
            formatDate={formatDate}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </div>
  );
};

// Separate component for printable content with inline styles
const PrintableInvoice = ({
  data,
  type,
  Subtotal,
  formatDate,
  formatCurrency,
}) => {
  return (
    <div
      style={{
        padding: "16px",
        fontSize: "9px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "2px solid #1f2937",
          justifyItems: "center",
        }}
      >
        {/* <h1
          style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 4px 0" }}
        >
          {type === "sale" ? "SALES INVOICE" : "QUOTATION"}
        </h1> */}
        <p style={{ margin: "2px 0", fontSize: "12px", fontWeight: "bold" }}>
          Mukhtar Traders
        </p>
        <div
          style={{
            borderTop: "1px solid #d1d5db",
            justifyContent: "center",
            display: "flex",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              width: "150px",
            }}
          >
            <p style={{ fontSize: "6px", color: "#6b7280", margin: "20 20px" }}>
              Distributer
            </p>
            <p style={{ fontSize: "6px", color: "#6b7280", margin: "20 20px" }}>
              Importer
            </p>
            <p style={{ fontSize: "6px", color: "#6b7280", margin: "20 20px" }}>
              Exporter
            </p>
          </div>
        </div>
        <p style={{ margin: "2px 0", fontSize: "8px" }}>
          Millati Bazaar, 23 Block, Sargodha
        </p>
        <p style={{ margin: "2px 0", fontSize: "6px" }}>
          Near Jamiah Masjid Ahle Hadees.
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyItems: "space-between",
          }}
        >
          <div style={{ margin: "0px 0px" }}>
            <p style={{ fontSize: "5px" }}>
              Chawdary Mukhtar : 0300-6045843 / 0347-4800071
            </p>
          </div>
          <div style={{ margin: "0px 40px" }}>
            <p style={{ fontSize: "5px" }}>
              Chawdary Ahmad Raza : 0301-6435071
            </p>
          </div>
        </div>
      </div>

      {/* Customer & Sale Info */}
      <div style={{ fontSize: "8px" }}>
        <div>
          <p style={{ fontSize: "8px" }}>
            {type === "sale" ? "Sale Invoice# " : "Quotation Invoice# "}
            {data.sale_id || data.quotation_id || "New"}
          </p>
          <p style={{ fontSize: "8px" }}>
            Date: {formatDate(data.sale_dat || new Date())}
          </p>
        </div>
        <div>
          <p style={{ margin: "2px 0" }}>Customer : {data.customer_nam}</p>
          {type === "sale" && data.delivered_to && (
            <p style={{ margin: "2px 0" }}>Delivered To: {data.delivered_to}</p>
          )}
        </div>
        {/* <div>
          <h3 style={{ fontWeight: "600", margin: "0 0 4px 0" }}>Details:</h3>
          <p style={{ margin: "2px 0" }}>Salesman ID: {data.salesman_id}</p>
          {type === "sale" && (
            <>
              {data.bill_by && (
                <p style={{ margin: "2px 0" }}>Bill By: {data.bill_by}</p>
              )}
              {data.payment && (
                <p style={{ margin: "2px 0" }}>Payment: {data.payment}</p>
              )}
              {data.builty_number && (
                <p style={{ margin: "2px 0" }}>
                  Builty #: {data.builty_number}
                </p>
              )}
              {data.ogp_number && (
                <p style={{ margin: "2px 0" }}>OGP #: {data.ogp_number}</p>
              )}
            </>
          )}
        </div> */}
      </div>

      {/* Items Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "10px",
          fontSize: "7px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#1f2937", color: "white" }}>
            <th
              style={{
                border: "1px solid #374151",
                padding: "4px",
                textAlign: "left",
              }}
            >
              Product
            </th>
            <th
              style={{
                border: "1px solid #374151",
                padding: "4px",
                textAlign: "center",
              }}
            >
              Qty
            </th>
            {/* <th
              style={{
                border: "1px solid #374151",
                padding: "4px",
                textAlign: "center",
              }}
            >
              Bonus
            </th> */}
            <th
              style={{
                border: "1px solid #374151",
                padding: "4px",
                textAlign: "right",
              }}
            >
              Unit Price
            </th>
            {data.total_discount > 0 && (
              <th
                style={{
                  border: "1px solid #374151",
                  padding: "4px",
                  textAlign: "right",
                }}
              >
                Disc
              </th>
            )}
            {/* {data.total_tax > 0 && (
              <th
                style={{
                  border: "1px solid #374151",
                  padding: "4px",
                  textAlign: "right",
                }}
              >
                Tax
              </th>
            )} */}
            <th
              style={{
                border: "1px solid #374151",
                padding: "4px",
                textAlign: "right",
              }}
            >
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => (
            <tr key={index}>
              <td
                style={{
                  border: "1px solid #d1d5db",
                  padding: "3px",
                  fontSize: "7px",
                }}
              >
                {item.product_nam}
              </td>
              <td
                style={{
                  border: "1px solid #d1d5db",
                  padding: "3px",
                  textAlign: "center",
                }}
              >
                {item.quantity}
              </td>
              {/* <td
                style={{
                  border: "1px solid #d1d5db",
                  padding: "3px",
                  textAlign: "center",
                }}
              >
                {item.bonus || 0}
              </td> */}
              <td
                style={{
                  border: "1px solid #d1d5db",
                  padding: "3px",
                  textAlign: "right",
                }}
              >
                {formatCurrency(item.unit_price)}
              </td>
              {data.total_discount > 0 && (
                <td
                  style={{
                    border: "1px solid #d1d5db",
                    padding: "3px",
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(item.total_discount_amount || 0)}
                </td>
              )}
              {/* {data.total_tax > 0 && (
                <td
                  style={{
                    border: "1px solid #d1d5db",
                    padding: "3px",
                    textAlign: "right",
                  }}
                >
                  {formatCurrency(item.total_tax_amount || 0)}
                </td>
              )} */}
              <td
                style={{
                  border: "1px solid #d1d5db",
                  padding: "3px",
                  textAlign: "right",
                  fontWeight: "600",
                }}
              >
                {formatCurrency(item.net_amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          fontSize: "6px",
        }}
      >
        <div style={{ width: "60%", fontSize: "6px" }}>
          {/* <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "3px 0",
              borderBottom: "1px solid #d1d5db",
            }}
          >
            <span>Subtotal:</span>
            <span style={{ fontWeight: "600" }}>
              {formatCurrency(data.subtotal_amount)}
            </span>
          </div> */}
          {data.total_discount > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "3px 0",
                borderBottom: "1px solid #d1d5db",
              }}
            >
              <span>Total Discount:</span>
              <span style={{ fontWeight: "600", color: "#dc2626" }}>
                -{formatCurrency(data.total_discount || 0)}
              </span>
            </div>
          )}
          {/* {data.total_tax > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "3px 0",
                borderBottom: "1px solid #d1d5db",
              }}
            >
              <span>Total Tax:</span>
              <span style={{ fontWeight: "600" }}>
                {formatCurrency(data.total_tax || 0)}
              </span>
            </div>
          )} */}
          {data.packing_fare > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "3px 0",
                borderBottom: "1px solid #d1d5db",
              }}
            >
              <span>Packing Fare:</span>
              <span style={{ fontWeight: "600" }}>
                {formatCurrency(data.packing_fare)}
              </span>
            </div>
          )}
          {/* {data.extra_tax > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "3px 0",
                borderBottom: "1px solid #d1d5db",
              }}
            >
              <span>FBR Tax:</span>
              <span style={{ fontWeight: "600" }}>
                {formatCurrency(data.extra_tax)}
              </span>
            </div>
          )} */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "3px 0",
              borderBottom: "1px solid #d1d5db",
            }}
          >
            <span>Bill Total:</span>
            <span style={{ fontWeight: "600" }}>
              {formatCurrency(data.total_amount)}
            </span>
          </div>
          {type === "sale" && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "3px 0",
                borderBottom: "1px solid #d1d5db",
              }}
            >
              <span>Customer Balance:</span>
              <span style={{ fontWeight: "600" }}>
                {formatCurrency(data.customer_balance)}
              </span>
            </div>
          )}
          {type === "sale" && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "3px 0",
                borderBottom: "1px solid #d1d5db",
              }}
            >
              <span>Total Amount:</span>
              <span style={{ fontWeight: "600" }}>
                {formatCurrency(data.customer_balance + data.total_amount)}
              </span>
            </div>
          )}
          {type === "sale" && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "3px 0",
                borderBottom: "1px solid #d1d5db",
              }}
            >
              <span>Received Amount:</span>
              <span style={{ fontWeight: "600", color: "#16a34a" }}>
                {formatCurrency(data.received_amount)}
              </span>
            </div>
          )}{" "}
          {type === "sale" && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "3px 0",
                borderBottom: "1px solid #d1d5db",
              }}
            >
              <span>Remaining Balance:</span>
              <span style={{ fontWeight: "600", color: "#16a34a" }}>
                {formatCurrency(
                  data.customer_balance +
                    data.total_amount -
                    data.received_amount
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Remarks */}
      {data.remarks && (
        <div>
          <h3
            style={{ fontWeight: "600", margin: "0 0 4px 0", fontSize: "8px" }}
          >
            Remarks:
          </h3>
          <p
            style={{
              fontSize: "7px",
              backgroundColor: "#f9fafb",
              padding: "6px",
              borderRadius: "4px",
            }}
          >
            {data.remarks}
          </p>
        </div>
      )}
    </div>
  );
};

export default Invoice;
