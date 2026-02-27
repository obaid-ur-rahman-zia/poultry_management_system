"use client";
import React, { useState } from "react";
import { Printer, X, ChevronLeft, ChevronRight } from "lucide-react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/app/utils/exportToCsv";

export default function BalanceSheetReport() {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const transactionsPerPage = 15;

  const fetchBalanceSheet = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/account/accounts/read/balanceSheet?start_date=${startDate}&end_date=${endDate}`,
      );
      const data = await response.json();

      if (data.response_result) {
        setOpeningBalance(data.response_result.openingBalance || 0);
        setClosingBalance(data.response_result.closingBalance || 0);
        setTransactions(data.response_result.transactions || []);
        setIsOpen(true);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching balance sheet:", error);
      toast.error("Failed to fetch balance sheet");
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction,
  );
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  // Calculate running balance
  const calculateRunningBalance = (index) => {
    let balance = openingBalance;
    for (let i = 0; i <= index; i++) {
      const trans = transactions[i];
      if (trans.type === "opposite") {
        // For opposite transactions, we need to check if cash in hand (acc_id=1) is receiving or paying
        // If cash in hand is receiving, add to balance
        // If cash in hand is paying, subtract from balance
        if (trans.received_by === 1) {
          balance += trans.amount;
        } else if (trans.paid_by === 1) {
          balance -= trans.amount;
        }
      } else if (trans.type === "self") {
        // For self transactions
        if (trans.transaction_type === "receive") {
          balance += trans.amount;
        } else if (trans.transaction_type === "pay") {
          balance -= trans.amount;
        }
      }
    }
    return balance;
  };

  const handleExport = () => {
    if (!transactions.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Sr No",
      "Date",
      "Name",
      "Paid",
      "Name",
      "Received",
      "Description",
      "Running Balance",
    ];

    const rows = [];

    // Opening Balance row
    rows.push([
      "",
      new Date(startDate).toLocaleDateString(),
      "",
      "",
      "",
      "",
      "Opening Balance",
      openingBalance.toFixed(2),
    ]);

    // Transaction rows
    transactions.forEach((trans, index) => {
      const runningBalance = calculateRunningBalance(index);
      let payerName = "";
      let amountPaid = "";
      let receiverName = "";
      let amountReceived = "";
      let description = trans.description || "-";

      if (trans.type === "opposite") {
        payerName = trans.paid_by_account?.account_nam || "-";
        receiverName = trans.received_by_account?.account_nam || "-";
        amountPaid = trans.amount.toFixed(2);
        amountReceived = trans.amount.toFixed(2);
      } else if (trans.type === "self") {
        if (trans.transaction_type === "receive") {
          payerName = trans.account?.account_nam || "-";
          amountPaid = trans.amount.toFixed(2);
        } else {
          receiverName = trans.account?.account_nam || "-";
          amountReceived = trans.amount.toFixed(2);
        }
      }

      rows.push([
        index + 1,
        new Date(trans.transaction_date).toLocaleDateString(),
        receiverName,
        amountReceived,
        payerName,
        amountPaid,
        description,
        runningBalance.toFixed(2),
      ]);
    });

    // Closing Balance row
    rows.push([
      "",
      new Date(endDate).toLocaleDateString(),
      "",
      "",
      "",
      "",
      "Closing Balance",
      closingBalance.toFixed(2),
    ]);

    exportToCSV(`Balance_Sheet_${startDate}_to_${endDate}.csv`, headers, rows);
  };

  return (
    <div>
      {/* Card to trigger balance sheet */}
      <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-500 transition-colors duration-300">
              <FileText className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Balance Sheet Report
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
              onClick={fetchBalanceSheet}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "View Report"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center print:bg-white print:relative print:p-0">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[100vh] overflow-hidden flex flex-col print:max-h-none print:shadow-none">
            {/* Header */}
            <div className="flex items-center justify-end p-1 border-b print:hidden">
              <div className="flex gap-1">
                <button
                  onClick={handleExport}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            <div className="flex-1 overflow-auto px-4 py-1">
              {/* Report Header */}
              <div className="text-center mb-4">
                <h1 className="text-xl font-bold text-gray-900">
                  Balance Sheet Report - Cash in Hand
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
                </p>
              </div>

              {/* Opening Balance */}
              <div className="bg-blue-50 rounded-lg p-3 mb-4 inline-block">
                <div className="text-left">
                  <span className="font-semibold text-gray-700">
                    Opening Balance:{" "}
                  </span>
                  <span
                    className={
                      openingBalance < 0 ? "text-red-600" : "text-green-600"
                    }
                  >
                    {openingBalance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        Sr. No
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        Paid
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        Name
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        Received
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        Description
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Transaction Rows */}
                    {currentTransactions.map((trans, index) => {
                      const actualIndex = indexOfFirstTransaction + index;
                      const serialNumber = actualIndex + 1;
                      const runningBalance =
                        calculateRunningBalance(actualIndex);

                      let payerName = "";
                      let amountPaid = "";
                      let receiverName = "";
                      let amountReceived = "";
                      let description = trans.description || "-";

                      if (trans.type === "opposite") {
                        payerName = trans.paid_by_account?.account_nam || "-";
                        receiverName =
                          trans.received_by_account?.account_nam || "-";
                        amountPaid = trans.amount.toFixed(2);
                        amountReceived = trans.amount.toFixed(2);
                      } else if (trans.type === "self") {
                        if (trans.transaction_type === "receive") {
                          payerName = trans.account?.account_nam || "-";
                          amountPaid = trans.amount.toFixed(2);
                        } else {
                          receiverName = trans.account?.account_nam || "-";
                          amountReceived = trans.amount.toFixed(2);
                        }
                      }

                      return (
                        <tr
                          key={`${trans.type}-${trans.transaction_id}`}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-3 py-2 border border-gray-300">{serialNumber}</td>
                          <td className="px-3 py-2 border border-gray-300">
                            {new Date(
                              trans.transaction_date,
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 border border-gray-300">{receiverName}</td>
                          <td className="px-3 py-2 border border-gray-300">{amountReceived || "-"}</td>
                          <td className="px-3 py-2 border border-gray-300">{payerName}</td>
                          <td className="px-3 py-2 border border-gray-300">{amountPaid || "-"}</td>
                          <td className="px-3 py-2 border border-gray-300">{description}</td>
                          <td className="px-3 py-2 font-medium border border-gray-300">
                            <span
                              className={
                                runningBalance < 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }
                            >
                              {runningBalance.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Closing Balance Row */}
                    {transactions.length > 0 && (
                      <tr className="bg-gray-200 border-t-2 border-gray-400 font-bold">
                        <td className="px-3 py-2 border border-gray-300"></td>
                        <td className="px-3 py-2 border border-gray-300" colSpan="6">
                          Closing Balance
                        </td>
                        <td className="px-3 py-2 border border-gray-300">
                          <span
                            className={
                              closingBalance < 0
                                ? "text-red-600"
                                : "text-green-600"
                            }
                          >
                            {closingBalance.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer with Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-6 border-t print:hidden">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstTransaction + 1} to{" "}
                  {Math.min(indexOfLastTransaction, transactions.length)} of{" "}
                  {transactions.length} transactions
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
                  <div className="px-4 py-1 bg-blue-500 text-white rounded-lg font-medium">
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
