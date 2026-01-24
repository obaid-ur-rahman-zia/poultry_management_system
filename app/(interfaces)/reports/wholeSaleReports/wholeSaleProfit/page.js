"use client";
import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { toast } from "react-toastify";
import { exportToCSV } from "@/app/utils/exportToCsv";

export default function WholeSaleProfitModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupBy, setGroupBy] = useState("date");
  const [reportData, setReportData] = useState([]);
  const [grandTotalPurchase, setGrandTotalPurchase] = useState(0);
  const [grandTotalSale, setGrandTotalSale] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const rowsPerPage = 15;

  // Format period display based on group type
  const formatPeriod = (period, groupType) => {
    if (groupType === "date") {
      const date = new Date(period);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } else if (groupType === "month") {
      const [year, month] = period.split("-");
      const date = new Date(year, parseInt(month) - 1);
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } else if (groupType === "year") {
      return period;
    }
    return period;
  };

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    let start_dat = startDate;
    let end_dat = endDate;

    if (groupBy === "month") {
      // startDate is YYYY-MM
      start_dat = `${startDate}-01`;
      // Calculate last day of end month
      const [year, month] = endDate.split("-");
      const lastDay = new Date(year, month, 0).getDate();
      end_dat = `${endDate}-${lastDay}`;
    } else if (groupBy === "year") {
      // startDate is YYYY
      start_dat = `${startDate}-01-01`;
      end_dat = `${endDate}-12-31`;
    }

    // Basic validation after transformation (string comparison still works for ISO dates usually, but Date object is safer)
    if (new Date(start_dat) > new Date(end_dat)) {
      toast.error("Start date must be before end date");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/wholeSale/read/readProfitReport?start_dat=${start_dat}&end_dat=${end_dat}&group_by=${groupBy}`,
      );
      const data = await res.json();
      console.log("Whole Sale Profit/Loss Data", data);

      if (data.response_code === 200) {
        setReportData(data.response_result.results);
        setGrandTotalPurchase(data.response_result.grandTotalPurchase);
        setGrandTotalSale(data.response_result.grandTotalSale);
        setNetProfit(data.response_result.netProfit);
        setIsOpen(true);
        setCurrentPage(1);
      } else {
        toast.error(data.response_message || "Failed to fetch report");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch report");
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = reportData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(reportData.length / rowsPerPage);

  // Get column header based on groupBy
  const getPeriodHeader = () => {
    if (groupBy === "date") return "Date";
    if (groupBy === "month") return "Month";
    if (groupBy === "year") return "Year";
    return "Period";
  };

  const handleExport = () => {
    if (!reportData.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      getPeriodHeader(),
      "Whole Sale Purchase",
      "Whole Sale Amount",
      "Profit",
      "Loss",
    ];

    const rows = reportData.map((row) => {
      const profit = row.profit_loss > 0 ? row.profit_loss : 0;
      const loss = row.profit_loss < 0 ? Math.abs(row.profit_loss) : 0;

      return [
        formatPeriod(row.period, groupBy),
        row.purchase_amount.toFixed(2),
        row.sale_amount.toFixed(2),
        profit.toFixed(2),
        loss.toFixed(2),
      ];
    });

    // Append grand total row
    rows.push([
      "Grand Total",
      grandTotalPurchase.toFixed(2),
      grandTotalSale.toFixed(2),
      netProfit > 0 ? netProfit.toFixed(2) : "0.00",
      netProfit < 0 ? Math.abs(netProfit).toFixed(2) : "0.00",
    ]);

    exportToCSV(
      `Whole_Sale_Profit_Loss_Report_${groupBy}_${startDate}_to_${endDate}.csv`,
      headers,
      rows,
    );
  };

  // Helper to render date input based on groupBy
  const renderDateInput = (value, onChange) => {
    if (groupBy === "date") {
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
        />
      );
    } else if (groupBy === "month") {
      return (
        <input
          type="month"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
        />
      );
    } else if (groupBy === "year") {
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let i = currentYear - 10; i <= currentYear + 5; i++) {
        years.push(i);
      }
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
        >
          <option value="">Select Year</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      );
    }
  };

  return (
    <div>
      {/* Card to trigger report */}
      <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-500 transition-colors duration-300">
              <FileText className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 ">
            Whole Sale Profit / Loss Report
          </h3>

          <h1 className="text-sm font-bold text-gray-900 mb-4">All</h1>

          {/* Filters */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Group By
              </label>
              <select
                value={groupBy}
                onChange={(e) => {
                  setGroupBy(e.target.value);
                  setStartDate("");
                  setEndDate("");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              >
                <option value="date">Date</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              {renderDateInput(startDate, setStartDate)}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date
              </label>
              {renderDateInput(endDate, setEndDate)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setGroupBy("date");
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
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[100vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-end p-1 border-b">
              <div className="flex gap-1">
                <button
                  onClick={handleExport}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  title="Export CSV"
                >
                  Export
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {/* Report Header */}
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Whole Sale Profit & Loss Report
                </h1>
                <p className="text-gray-600 text-sm">
                  From:{" "}
                  <span className="font-semibold">
                    {new Date(startDate).toLocaleDateString()}
                  </span>{" "}
                  To:{" "}
                  <span className="font-semibold">
                    {new Date(endDate).toLocaleDateString()}
                  </span>
                  {" | "}
                  <span className="font-semibold">
                    Grouped by:{" "}
                    {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
                  </span>
                </p>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-4 py-2 text-left font-bold text-gray-700">
                        {getPeriodHeader()}
                      </th>
                      <th className="px-4 py-2 text-right font-bold text-gray-700">
                        Whole Sale Purchase
                      </th>
                      <th className="px-4 py-2 text-right font-bold text-gray-700">
                        Whole Sale Amount
                      </th>
                      <th className="px-4 py-2 text-right font-bold text-gray-700">
                        Profit
                      </th>
                      <th className="px-4 py-2 text-right font-bold text-gray-700">
                        Loss
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((row, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-4 py-2 font-medium">
                          {formatPeriod(row.period, groupBy)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {row.purchase_amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {row.sale_amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {row.profit_loss > 0 ? row.profit_loss.toFixed(2) : 0}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">
                          {row.profit_loss < 0
                            ? Math.abs(row.profit_loss).toFixed(2)
                            : 0}
                        </td>
                      </tr>
                    ))}

                    {/* Grand Total Row */}
                    {reportData.length > 0 && (
                      <tr className="bg-indigo-50 border-t-2 border-gray-400 font-bold">
                        <td className="px-4 py-3">Grand Total:</td>
                        <td className="px-4 py-3 text-right">
                          {grandTotalPurchase.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {grandTotalSale.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {netProfit > 0 ? netProfit.toFixed(2) : 0}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {netProfit < 0 ? Math.abs(netProfit).toFixed(2) : 0}
                        </td>
                      </tr>
                    )}

                    {/* Net Profit Row */}
                    {reportData.length > 0 && (
                      <tr className="bg-gray-100 border-t border-gray-300 font-bold">
                        <td colSpan="3" className="px-4 py-3 text-right">
                          Net Profit:
                        </td>
                        <td className="px-4 py-3 text-right text-lg">
                          <span
                            className={
                              netProfit >= 0 ? "text-green-600" : "text-red-600"
                            }
                          >
                            {netProfit.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold"></td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {reportData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No data found for the selected period
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-6 border-t">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstRow + 1} to{" "}
                  {Math.min(indexOfLastRow, reportData.length)} of{" "}
                  {reportData.length} records
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="px-4 py-1 bg-indigo-500 text-white rounded-lg font-medium">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
