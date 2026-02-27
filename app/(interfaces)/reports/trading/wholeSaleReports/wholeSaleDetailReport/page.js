"use client";
import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/app/utils/exportToCsv";

export default function WholeSaleReport() {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 10;

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/wholeSale/read/readReportDetail?start_dat=${startDate}&end_dat=${endDate}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await res.json();
      setReportData(data.response_result || []);
      setIsOpen(true);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch report");
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = reportData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(reportData.length / itemsPerPage);

  const handleExport = () => {
    if (!reportData.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Sale ID",
      "Date",
      "Van Number",
      "Weight",
      "Former Name",
      "Former Rate",
      "Former Amount",
      "Purchaser Name",
      "Purchaser Rate",
      "Purchaser Amount",
      "Profit",
    ];

    const rows = reportData.map((item) => [
      item.sale_id,
      new Date(item.sale_date).toLocaleDateString(),
      item.van_number,
      item.weight,
      item.former_account_ref?.account_nam || "N/A",
      Number(item.former_rate).toFixed(2),
      Number(item.former_amount).toFixed(2),
      item.purcher_account_ref?.account_nam || "N/A",
      Number(item.purcher_rate || 0).toFixed(2),
      Number(item.purcher_amount).toFixed(2),
      Number(item.profit).toFixed(2),
    ]);

    exportToCSV(
      `Whole_Sale_Report_${startDate}_to_${endDate}.csv`,
      headers,
      rows
    );
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
            Whole Sale Report
          </h3>

          <h1 className="text-sm font-bold text-gray-900 mb-4">All</h1>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
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
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Whole Sale Report
                </h1>
                <p className="text-sm text-gray-600">
                  {new Date(startDate).toLocaleDateString()} -{" "}
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
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-700 border-b">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-gray-700 border-b">
                        Van #
                      </th>
                      <th className="px-4 py-3 text-right font-bold text-gray-700 border-b">
                        Weight
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-gray-700 border-b border-l">
                        Former
                      </th>
                      <th className="px-4 py-3 text-right font-bold text-gray-700 border-b">
                        Rate
                      </th>
                      <th className="px-4 py-3 text-right font-bold text-gray-700 border-b">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left font-bold text-gray-700 border-b border-l">
                        Purchaser
                      </th>
                      <th className="px-4 py-3 text-right font-bold text-gray-700 border-b">
                        Rate
                      </th>
                      <th className="px-4 py-3 text-right font-bold text-gray-700 border-b">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-right font-bold text-gray-700 border-b border-l bg-green-50">
                        Profit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item) => (
                      <tr
                        key={item.sale_id}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {new Date(item.sale_date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {item.sale_id}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.van_number}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-700 bg-gray-50/50">
                          {Number(item.weight).toLocaleString()}
                        </td>

                        {/* Former Section */}
                        <td className="px-4 py-3 border-l border-gray-100">
                          <div className="font-medium text-gray-900">
                            {item.former_account_ref?.account_nam}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.former_account_ref?.account_contact}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">
                          {Number(item.former_rate).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-gray-900 bg-red-50/30">
                          {Number(item.former_amount).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 }
                          )}
                        </td>

                        {/* Purchaser Section */}
                        <td className="px-4 py-3 border-l border-gray-100">
                          <div className="font-medium text-gray-900">
                            {item.purcher_account_ref?.account_nam}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.purcher_account_ref?.account_contact}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">
                          {Number(item.purcher_rate).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-gray-900 bg-blue-50/30">
                          {Number(item.purcher_amount).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 }
                          )}
                        </td>

                        {/* Profit */}
                        <td className="px-4 py-3 text-right font-mono font-bold text-green-700 border-l border-gray-100 bg-green-50/50">
                          {Number(item.profit).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}

                    {currentItems.length === 0 && (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-4 py-12 text-center text-gray-500"
                        >
                          No records found for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {/* Optional: Totals Row for the current page or whole? 
                       Usually pagination makes totals tricky, but we can sum current page at least 
                   */}
                  {currentItems.length > 0 && (
                    <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right">
                          Page Total:
                        </td>
                        <td colSpan={3} className="px-4 py-3 text-right">
                          {Number(
                            currentItems.reduce(
                              (acc, curr) =>
                                acc + (Number(curr.former_amount) || 0),
                              0
                            )
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td colSpan={3} className="px-4 py-3 text-right">
                          {Number(
                            currentItems.reduce(
                              (acc, curr) =>
                                acc + (Number(curr.purcher_amount) || 0),
                              0
                            )
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-3 text-right text-green-800">
                          {Number(
                            currentItems.reduce(
                              (acc, curr) => acc + (Number(curr.profit) || 0),
                              0
                            )
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstItem + 1} to{" "}
                  {Math.min(indexOfLastItem, reportData.length)} of{" "}
                  {reportData.length} records
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="px-4 py-1 bg-orange-500 text-white rounded-lg font-medium flex items-center">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
