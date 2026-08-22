"use client";
import React, { useState } from "react";
import { X, FileText } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/app/utils/exportToCsv";

export default function WholeSaleReport() {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/wholeSale/read/readReportDetail?start_dat=${startDate}&end_dat=${endDate}`,
      );

      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await res.json();
      setReportData(data.response_result || []);
      setIsOpen(true);
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch report");
    } finally {
      setIsLoading(false);
    }
  };

  // Group sales by Date then by Former
  const groupedByDate = reportData.reduce((acc, item) => {
    const dateStr = new Date(item.sale_date).toLocaleDateString();
    
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

  const handleExport = () => {
    if (!reportData.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Sr.No.",
      "Former",
      "Sale ID",
      "Van Number",
      "Weight",
      "Former Rate",
      "Former Amount",
      "Purchaser Name",
      "Purchaser Rate",
      "Purchaser Amount",
      "Profit",
    ];

    const rows = [];
    dates.forEach((dateGroup) => {
      rows.push([`Date: ${dateGroup.dateStr}`, "", "", "", "", "", "", "", "", "", ""]);
      
      dateGroup.formers.forEach((group) => {
        group.sales.forEach((item, index) => {
          rows.push([
            index + 1,
            group.formerName,
            item.sale_id,
            item.van_number,
            item.weight,
            Number(item.former_rate).toFixed(2),
            Number(item.former_amount).toFixed(2),
            item.purcher_account_ref?.account_nam || "N/A",
            Number(item.purcher_rate || 0).toFixed(2),
            Number(item.purcher_amount).toFixed(2),
            Number(item.profit).toFixed(2),
          ]);
        });
        rows.push([
          "",
          `${group.formerName} - Total`,
          "",
          "",
          group.totalWeight,
          "",
          group.totalFormerAmount.toFixed(2),
          "",
          "",
          group.totalPurchaserAmount.toFixed(2),
          group.totalProfit.toFixed(2),
        ]);
      });
      rows.push([
        "",
        `Date Total (${dateGroup.dateStr})`,
        "",
        "",
        dateGroup.dateTotalWeight,
        "",
        dateGroup.dateTotalFormerAmount.toFixed(2),
        "",
        "",
        dateGroup.dateTotalPurchaserAmount.toFixed(2),
        dateGroup.dateTotalProfit.toFixed(2),
      ]);
    });

    exportToCSV(
      `Whole_Sale_Report_${startDate}_to_${endDate}.csv`,
      headers,
      rows,
    );
  };

  const fmt = (n, decimals = 2) =>
    Number(n).toLocaleString(undefined, { minimumFractionDigits: decimals });

  return (
    <div>
      {/* Card to trigger report */}
      <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative p-6">

          <h3 className="text-lg mb-15 font-semibold text-gray-900">
            WHOLESALE DAILY REPORT
          </h3>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-1 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-1 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
            <button
              onClick={fetchReport}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "View Report"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[100vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-2 border-b border-gray-300">
              <div>
                <h1 className="text-xl font-bold ">Whole Sale Report</h1>
                <p className="text-sm text-gray-600">
                  {new Date(startDate).toLocaleDateString()} –{" "}
                  {new Date(endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {formers.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500 border border-gray-300 rounded">
                  No records found for this period
                </div>
              ) : (
                <table className="w-full border-collapse text-xs border border-gray-400">
                  {/* Column Headers */}
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-1 py-1 text-left font-semibold text-gray-800 border border-gray-400">
                        Sr.No.
                      </th>
                      <th className="px-1 py-1 text-left font-semibold text-gray-800 border border-gray-400">
                        Van #
                      </th>
                      <th className="px-1 py-1 text-right font-semibold text-gray-800 border border-gray-400">
                        Weight
                      </th>
                      <th className="px-1 py-1 text-right font-semibold text-gray-800 border border-gray-400">
                        Former Rate
                      </th>
                      <th className="px-1 py-1 text-right font-semibold text-gray-800 border border-gray-400">
                        Former Amt
                      </th>
                      <th className="px-1 py-1 text-left font-semibold text-gray-800 border border-gray-400">
                        Purchaser
                      </th>
                      <th className="px-1 py-1 text-right font-semibold text-gray-800 border border-gray-400">
                        Purcher Rate
                      </th>
                      <th className="px-1 py-1 text-right font-semibold text-gray-800 border border-gray-400">
                        Purcher Amt
                      </th>
                      <th className="px-1 py-1 text-right font-semibold text-gray-800 border border-gray-400">
                        Profit
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {dates.map((dateGroup, di) => (
                      <React.Fragment key={`date-${di}`}>
                        {/* Date Header Row */}
                        <tr>
                          <td
                            colSpan={9}
                            className="px-1 py-1 font-bold text-center bg-orange-100 text-orange-900 border border-black text-lg"
                          >
                            Date: {dateGroup.dateStr}
                          </td>
                        </tr>

                        {dateGroup.formers.map((group, gi) => (
                          <React.Fragment key={`former-${di}-${gi}`}>
                            {/* Former Header Row */}
                            <tr>
                              <td
                                colSpan={9}
                                className="px-1 py-1 font-bold bg-gray-50 border border-black"
                              >
                                {group.formerName}
                                {group.formerContact && (
                                  <span className="ml-2 font-normal text-xs ">
                                    ({group.formerContact})
                                  </span>
                                )}
                              </td>
                            </tr>

                            {/* Individual Sale Rows */}
                            {group.sales.map((item, si) => (
                              <tr
                                key={item.sale_id}
                                className="hover:bg-gray-100 transition-colors"
                              >
                                <td className="px-1 py-1 border border-black text-center">
                                  {si + 1}
                                </td>
                                <td className="px-1 py-1 border border-black">
                                  {item.van_number}
                                </td>
                                <td className="px-1 py-1 text-right font-mono border border-black">
                                  {fmt(item.weight, 0)}
                                </td>
                                <td className="px-1 py-1 text-right font-mono border border-black">
                                  {fmt(item.former_rate)}
                                </td>
                                <td className="px-1 py-1 text-right font-mono border border-black">
                                  {fmt(item.former_amount)}
                                </td>
                                <td className="px-1 py-1 border border-black">
                                  <div className="text-gray-900">
                                    {item.purcher_account_ref?.account_nam || "—"}
                                  </div>
                                </td>
                                <td className="px-1 py-1 text-right font-mono border border-black">
                                  {fmt(item.purcher_rate || 0)}
                                </td>
                                <td className="px-1 py-1 text-right font-mono border border-black">
                                  {fmt(item.purcher_amount)}
                                </td>
                                <td className="px-1 py-1 text-right font-mono font-semibold border border-black">
                                  {fmt(item.profit)}
                                </td>
                              </tr>
                            ))}

                            {/* Per-Former Subtotal Row */}
                            <tr className="bg-gray-100 font-semibold">
                              <td
                                colSpan={2}
                                className="px-1 py-1 text-right text-gray-700 border border-black"
                              >
                                {group.formerName} Total:
                              </td>
                              <td className="px-1 py-1 text-right font-mono text-gray-800 border border-black">
                                {fmt(group.totalWeight, 0)}
                              </td>
                              <td className="px-1 py-1 border border-black" />
                              <td className="px-1 py-1 text-right font-mono text-gray-800 border border-black">
                                {fmt(group.totalFormerAmount)}
                              </td>
                              <td className="px-1 py-1 border border-black" />
                              <td className="px-1 py-1 border border-black" />
                              <td className="px-1 py-1 text-right font-mono text-gray-800 border border-black">
                                {fmt(group.totalPurchaserAmount)}
                              </td>
                              <td className="px-1 py-1 text-right font-mono font-bold text-gray-900 border border-black">
                                {fmt(group.totalProfit)}
                              </td>
                            </tr>
                          </React.Fragment>
                        ))}

                        {/* Per-Date Subtotal Row */}
                        <tr className="bg-orange-50 font-bold text-orange-900">
                          <td
                            colSpan={2}
                            className="px-1 py-1 text-right border border-black"
                          >
                            Date Total ({dateGroup.dateStr}):
                          </td>
                          <td className="px-1 py-1 text-right font-mono border border-black">
                            {fmt(dateGroup.dateTotalWeight, 0)}
                          </td>
                          <td className="px-1 py-1 border border-black" />
                          <td className="px-1 py-1 text-right font-mono border border-black">
                            {fmt(dateGroup.dateTotalFormerAmount)}
                          </td>
                          <td className="px-1 py-1 border border-black" />
                          <td className="px-1 py-1 border border-black" />
                          <td className="px-1 py-1 text-right font-mono border border-black">
                            {fmt(dateGroup.dateTotalPurchaserAmount)}
                          </td>
                          <td className="px-1 py-1 text-right font-mono border border-black">
                            {fmt(dateGroup.dateTotalProfit)}
                          </td>
                        </tr>

                        {/* Spacer between dates */}
                        {di < dates.length - 1 && (
                          <tr>
                            <td
                              colSpan={9}
                              className="py-2 border-0 bg-white"
                            />
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>

                  {/* Grand Total Footer */}
                  <tfoot>
                    <tr className="bg-gray-800 text-white font-bold">
                      <td
                        colSpan={2}
                        className="px-1 py-1 text-right border border-black"
                      >
                        Grand Total:
                      </td>
                      <td className="px-1 py-1 text-right font-mono border border-black">
                        {fmt(grandTotalWeight, 0)}
                      </td>
                      <td className="px-1 py-1 border border-black" />
                      <td className="px-1 py-1 text-right font-mono border border-black">
                        {fmt(grandTotalFormerAmount)}
                      </td>
                      <td className="px-1 py-1 border border-black" />
                      <td className="px-1 py-1 border border-black" />
                      <td className="px-1 py-1 text-right font-mono border border-black">
                        {fmt(grandTotalPurchaserAmount)}
                      </td>
                      <td className="px-1 py-1 text-right font-mono border border-black">
                        {fmt(grandTotalProfit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
