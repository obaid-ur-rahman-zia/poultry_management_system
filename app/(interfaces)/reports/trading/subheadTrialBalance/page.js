"use client";

import React, { useState, useMemo } from "react";
import {
  Loader2,
  Layers,
  X,
  FileDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { exportToCSV } from "@/app/utils/exportToCsv";

export default function SubheadTrialBalanceModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // 200vh roughly supports ~80-100 items of accounting data
  const itemsPerPage = 80;

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(
        `/api/account/accountSubHead/read/trialBalance?${params.toString()}`,
      );
      const data = await response.json();

      if (data && data.response_result) {
        setReportData(data.response_result);
        setIsOpen(true);
        setCurrentPage(1);
      } else {
        toast.error("No data found");
      }
    } catch (error) {
      console.error("Error fetching trial balance:", error);
      toast.error("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData || !reportData.details) return;

    const headers = [
      "Account Name",
      "Contact",
      "Total Debit",
      "Total Credit",
      "Balance",
    ];
    const rows = [];
    rows.push([`Report Range: ${getDateRangeText()}`, "", "", "", ""]);
    rows.push(["", "", "", "", ""]);

    reportData.details.forEach((subhead) => {
      if (subhead.accounts.length === 0) return;
      rows.push([`SUBHEAD: ${subhead.subhead_nam}`, "", "", "", ""]);
      subhead.accounts.forEach((acc) => {
        rows.push([
          acc.name,
          acc.contact || "-",
          acc.total_debit.toFixed(2),
          acc.total_credit.toFixed(2),
          acc.balance.toFixed(2),
        ]);
      });
      rows.push([
        `TOTAL ${subhead.subhead_nam}`,
        "",
        subhead.total_debit.toFixed(2),
        subhead.total_credit.toFixed(2),
        subhead.total_balance.toFixed(2),
      ]);
      rows.push(["", "", "", "", ""]);
    });

    rows.push([
      "GRAND TOTAL",
      "",
      reportData.conclusion.total_debit.toFixed(2),
      reportData.conclusion.total_credit.toFixed(2),
      reportData.conclusion.total_balance.toFixed(2),
    ]);
    exportToCSV(
      `Subhead_Trial_Balance_${new Date().toISOString().split("T")[0]}.csv`,
      headers,
      rows,
    );
  };

  const getDateRangeText = () => {
    if (startDate && endDate)
      return `From ${new Date(startDate).toLocaleDateString()} To ${new Date(endDate).toLocaleDateString()}`;
    if (startDate)
      return `From ${new Date(startDate).toLocaleDateString()} To ${new Date().toLocaleDateString()}`;
    if (endDate)
      return `From Beginning To ${new Date(endDate).toLocaleDateString()}`;
    return `All Time Records`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Flatten the nested data into a linear list of "Render Blocks" for height-based pagination
  const flatItems = useMemo(() => {
    if (!reportData || !reportData.details) return [];

    const items = [];
    reportData.details.forEach((subhead) => {
      if (subhead.accounts.length === 0) return;

      // Block type: HEADER
      items.push({
        type: "HEADER",
        name: subhead.subhead_nam,
        count: subhead.accounts.length,
      });

      // Block type: ROW (Individual accounts)
      subhead.accounts.forEach((acc) => {
        items.push({ type: "ROW", ...acc, subhead_nam: subhead.subhead_nam });
      });

      // Block type: TOTAL
      items.push({
        type: "SUBTOTAL",
        name: subhead.subhead_nam,
        debit: subhead.total_debit,
        credit: subhead.total_credit,
        balance: subhead.total_balance,
      });
    });

    if (reportData.wholeSaleProfit) {
      items.push({ type: "WHOLE_SALE_PROFIT", ...reportData.wholeSaleProfit });
    }

    // Final block: CONCLUSION
    items.push({ type: "CONCLUSION", ...reportData.conclusion });

    return items;
  }, [reportData]);

  const totalPages = Math.ceil(flatItems.length / itemsPerPage);
  const currentItems = flatItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Group items into logical chunks for rendering (e.g. group consecutive ROWs into one <table>)
  const renderChunks = useMemo(() => {
    const chunks = [];
    let currentTableRows = [];
    let lastSubheadNam = "";

    currentItems.forEach((item, index) => {
      if (item.type === "ROW") {
        currentTableRows.push(item);
        lastSubheadNam = item.subhead_nam;
      } else {
        // If we were building a table, push it first
        if (currentTableRows.length > 0) {
          chunks.push({
            type: "TABLE",
            rows: currentTableRows,
            isContinued: index === 0,
            subheadName: lastSubheadNam,
          });
          currentTableRows = [];
        }
        chunks.push(item);
      }
    });

    if (currentTableRows.length > 0) {
      chunks.push({
        type: "TABLE",
        rows: currentTableRows,
        isContinued: false,
        subheadName: lastSubheadNam,
      });
    }

    return chunks;
  }, [currentItems]);

  return (
    <div>
      {/* Dashboard Card */}
      <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
        <div className="relative p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            OVERALL BUSINESS REPORT
          </h3>
          <div className="space-y-3 mb-4">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-700 mb-1">
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-[40px] border-2 border-gray-200 rounded-lg px-3 text-sm focus:border-green-500 outline-none"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-700 mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-[40px] border-2 border-gray-200 rounded-lg px-3 text-sm focus:border-green-500 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Clear
            </button>
            <button
              onClick={fetchReport}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-teal-700 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5 mx-auto" />
              ) : (
                "View Report"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col">
            <div className="flex items-center justify-end p-1 border-b bg-gray-50">
              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleExport}
                >
                  <FileDown className="mr-2 h-4 w-4" /> Export CSV
                </Button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto sm:p-2 bg-white">
              <div className="mb-2 text-center">
                <h1 className="text-xl font-bold text-gray-900 uppercase">
                  OVERALL BUSINESS REPORT
                </h1>
                <p className="text-gray-600 text-sm">{getDateRangeText()}</p>
              </div>

              <div className="px-4 space-y-4 pb-10">
                {renderChunks.map((chunk, idx) => {
                  if (chunk.type === "HEADER") {
                    return (
                      <div key={idx} className="mt-4 first:mt-0">
                        <span className="text-xl font-extrabold text-gray-800">
                          {chunk.name}
                        </span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {chunk.count} Accounts
                        </Badge>
                      </div>
                    );
                  }

                  if (chunk.type === "TABLE") {
                    return (
                      <div key={idx} className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm mb-2 border border-gray-300">
                          <colgroup>
                            <col className="w-[40%]" />
                            <col className="w-[15%]" />
                            <col className="w-[15%]" />
                            <col className="w-[15%]" />
                            <col className="w-[15%]" />
                          </colgroup>
                          <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                              <th className="px-3 py-2 text-left font-bold text-gray-700 w-[40%] border border-gray-300">
                                Account Name{" "}
                                {chunk.isContinued && (
                                  <span className="text-[10px] text-blue-500 ml-1">
                                    (Continued)
                                  </span>
                                )}
                              </th>
                              <th className="px-3 py-2 text-left font-bold text-gray-700 w-[15%] border border-gray-300">
                                Contact
                              </th>
                              <th className="px-3 py-2 text-right font-bold text-gray-700 border border-gray-300">
                                Total Debit
                              </th>
                              <th className="px-3 py-2 text-right font-bold text-gray-700 border border-gray-300">
                                Total Credit
                              </th>
                              <th className="px-3 py-2 text-right font-bold text-gray-700 border border-gray-300">
                                Balance
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {chunk.rows.map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                className="border-b border-gray-200 hover:bg-gray-50"
                              >
                                <td className="px-3 py-2 font-medium text-gray-900 border border-gray-300">
                                  {row.name}
                                </td>
                                <td className="px-3 py-2 text-gray-600 border border-gray-300">
                                  {row.contact || "-"}
                                </td>
                                <td className="px-3 py-2 text-right border border-gray-300">
                                  {formatCurrency(row.total_debit)}
                                </td>
                                <td className="px-3 py-2 text-right border border-gray-300">
                                  {formatCurrency(row.total_credit)}
                                </td>
                                <td className="px-3 py-2 text-right font-semibold border border-gray-300">
                                  {formatCurrency(row.balance)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  if (chunk.type === "SUBTOTAL") {
                    return (
                      <div
                        key={idx}
                        className="bg-gray-100 border-2 border-gray-200 p-2 mb-4 font-bold grid grid-cols-[40%_15%_15%_15%_15%] text-sm"
                      >
                        <div className="text-left whitespace-nowrap">
                          Total 
                        </div>
                        <div />
                        <div className="text-right text-green-700">
                          {formatCurrency(chunk.debit)}
                        </div>
                        <div className="text-right text-red-700">
                          {formatCurrency(chunk.credit)}
                        </div>
                        <div className="text-right text-blue-700">
                          {formatCurrency(chunk.balance)}
                        </div>
                      </div>
                    );
                  }

                  if (chunk.type === "WHOLE_SALE_PROFIT") {
                    return (
                      <div
                        key={idx}
                        className="mt-8 border-t-2 border-gray-400 pt-4"
                      >
                        <h2 className="text-xl font-bold mb-2 text-gray-800 uppercase">
                          Whole Sale Profit
                        </h2>
                        <table className="w-full border-collapse text-sm border border-gray-300">
                          <thead>
                            <tr className="bg-gray-200 border-b-2 border-gray-400">
                              <th className="px-3 py-2 text-left font-bold text-gray-800 border border-gray-300">
                                Description
                              </th>
                              <th className="px-3 py-2 text-right font-bold text-green-800 border border-gray-300">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-white border-b border-gray-300">
                              <td className="px-3 py-2 font-medium text-gray-900 border border-gray-300">
                                Balance of Income Acc under Income (Credit)
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-green-700 border border-gray-300">
                                {formatCurrency(chunk.income_acc_credit)}
                              </td>
                            </tr>
                            <tr className="bg-white border-b border-gray-300">
                              <td className="px-3 py-2 font-medium text-gray-900 border border-gray-300">
                                Total Expense Head Balance
                              </td>
                              <td className="px-3 py-2 text-right font-bold text-red-700 border border-gray-300">
                                {formatCurrency(chunk.expense_head_debit)}
                              </td>
                            </tr>
                            <tr className="bg-gray-100">
                              <td className="px-3 py-3 font-bold text-gray-900 border border-gray-300">
                                Whole Sale Profit
                              </td>
                              <td className="px-3 py-3 text-right font-bold text-blue-700 text-lg border border-gray-300">
                                {formatCurrency(chunk.profit)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  if (chunk.type === "CONCLUSION") {
                    return (
                      <div
                        key={idx}
                        className="mt-8 border-t-2 border-gray-400 pt-4"
                      >
                        <h2 className="text-xl font-bold mb-2 text-gray-800 uppercase">
                          Grand Conclusion
                        </h2>
                        <table className="w-full border-collapse text-sm border border-gray-300">
                          <thead>
                            <tr className="bg-gray-200 border-b-2 border-gray-400">
                              <th className="px-3 py-2 text-left font-bold text-gray-800 border border-gray-300">
                                Description
                              </th>
                              <th className="px-3 py-2 text-right font-bold text-green-800 border border-gray-300">
                                Total Debit
                              </th>
                              <th className="px-3 py-2 text-right font-bold text-red-800 border border-gray-300">
                                Total Credit
                              </th>
                              <th className="px-3 py-2 text-right font-bold text-blue-800 border border-gray-300">
                                Total Balance
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="bg-white border-b border-gray-300">
                              <td className="px-3 py-3 font-bold text-gray-900 border border-gray-300">
                                Final Aggregates
                              </td>
                              <td className="px-3 py-3 text-right font-bold text-green-700 text-lg border border-gray-300">
                                {formatCurrency(chunk.total_debit)}
                              </td>
                              <td className="px-3 py-3 text-right font-bold text-red-700 text-lg border border-gray-300">
                                {formatCurrency(chunk.total_credit)}
                              </td>
                              <td className="px-3 py-3 text-right font-bold text-blue-700 text-lg border border-gray-300">
                                {formatCurrency(chunk.total_balance)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  return null;
                })}

                {/* Pagination UI */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t mt-4 mb-10">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages} ({flatItems.length}{" "}
                      lines total)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentPage((p) => Math.max(p - 1, 1));
                          document
                            .querySelector(".overflow-auto")
                            ?.scrollTo(0, 0);
                        }}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentPage((p) => Math.min(p + 1, totalPages));
                          document
                            .querySelector(".overflow-auto")
                            ?.scrollTo(0, 0);
                        }}
                        disabled={currentPage === totalPages}
                      >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
