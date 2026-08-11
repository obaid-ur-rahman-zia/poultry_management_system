"use client";
import React, { useState } from "react";
import { Printer, X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { toast } from "react-toastify";
import { FileText } from "lucide-react";
import { exportToCSV } from "@/app/utils/exportToCsv";

export default function TrialBalanceModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [trialBalanceData, setTrialBalanceData] = useState([]);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const accountsPerPage = 20;

  // Format account code as 01-003-00002
  const formatAccountCode = (head_id, sub_id, account_id) => {
    const headPart = String(head_id).padStart(2, "0");
    const subPart = String(sub_id).padStart(3, "0");
    const accountPart = String(account_id).padStart(5, "0");
    return `${headPart}-${subPart}-${accountPart}`;
  };

  const fetchTrialBalance = async () => {
    setIsLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (startDate) params.append("start_dat", startDate);
      if (endDate) params.append("end_dat", endDate);

      const res = await fetch(
        `/api/account/accounts/read/trialBalance?${params.toString()}`
      );
      const data = await res.json();

      setTrialBalanceData(data.response_result.balances);
      setTotalDebit(data.response_result.totalDebit);
      setTotalCredit(data.response_result.totalCredit);
      setIsOpen(true);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching trial balance:", error);
      toast.error("Failed to fetch trial balance");
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastAccount = currentPage * accountsPerPage;
  const indexOfFirstAccount = indexOfLastAccount - accountsPerPage;
  const currentAccounts = trialBalanceData.slice(
    indexOfFirstAccount,
    indexOfLastAccount
  );
  const totalPages = Math.ceil(trialBalanceData.length / accountsPerPage);

  // Get date range text
  const getDateRangeText = () => {
    if (startDate && endDate) {
      return `From ${new Date(startDate).toLocaleDateString()} To ${new Date(
        endDate
      ).toLocaleDateString()}`;
    } else if (startDate) {
      return `From ${new Date(
        startDate
      ).toLocaleDateString()} To ${new Date().toLocaleDateString()}`;
    } else if (endDate) {
      return `From Beginning To ${new Date(endDate).toLocaleDateString()}`;
    } else {
      return `From Beginning To ${new Date().toLocaleDateString()}`;
    }
  };

  const handleExport = () => {
    if (!trialBalanceData.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Sr No",
      "Account Code",
      "Account Name",
      "Debit Balance",
      "Credit Balance",
    ];

    const rows = trialBalanceData.map((account, index) => [
      index + 1,
      formatAccountCode(account.head_id, account.sub_id, account.account_id),
      account.account_nam,
      account.debit_balance > 0 ? account.debit_balance.toFixed(2) : "",
      account.credit_balance > 0 ? account.credit_balance.toFixed(2) : "",
    ]);

    // Grand Total row (correct for trial balance)
    rows.push([
      "",
      "",
      "Grand Total",
      totalDebit.toFixed(2),
      totalCredit.toFixed(2),
    ]);

    exportToCSV(
      `Trial_Balance_${getDateRangeText().replace(/\s+/g, "_")}.csv`,
      headers,
      rows
    );
  };

  return (
    <div>
      {/* Card to trigger report */}
      <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>

        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-500 transition-colors duration-300">
              <FileText className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Trial Balance Report
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            View all accounts and their trial balance
          </p>

          {/* Date Inputs */}
          <div className="space-y-3 mb-4">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-700 mb-1">
                Start Date (Optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-[40px] border-2 border-gray-200 rounded-lg px-3 text-sm focus:border-green-500 focus:outline-none"
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
                className="h-[40px] border-2 border-gray-200 rounded-lg px-3 text-sm focus:border-green-500 focus:outline-none"
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
              onClick={fetchTrialBalance}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-teal-700 transition-all duration-300 disabled:opacity-50"
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
            <div className="flex items-center justify-end  border-b">
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
            <div className="flex-1 overflow-auto ">
              {/* Report Header */}
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 ">
                  Trial Balance
                </h1>
                <p className="text-gray-600 text-sm">{getDateRangeText()}</p>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-4 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        Sr No
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        Account Code
                      </th>
                      <th className="px-4 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        Account Name
                      </th>
                      <th className="px-4 py-2 text-right font-bold text-gray-700 border border-gray-300">
                        Debit Balance
                      </th>
                      <th className="px-4 py-2 text-right font-bold text-gray-700 border border-gray-300">
                        Credit Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentAccounts.map((account, index) => {
                      const serialNumber = indexOfFirstAccount + index + 1;
                      return (
                        <tr
                          key={account.acc_id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-4 py-2 text-center border border-gray-300">
                            {serialNumber}
                          </td>
                          <td className="px-4 py-2 font-mono text-sm border border-gray-300">
                            {formatAccountCode(
                              account.head_id,
                              account.sub_id,
                              account.account_id
                            )}
                          </td>
                          <td className="px-4 py-2 font-medium border border-gray-300">
                            {account.account_nam}
                          </td>
                          <td className="px-4 py-2 text-right border border-gray-300">
                            {account.debit_balance > 0 ? (
                              <span className="text-green-600 font-semibold">
                                {account.debit_balance.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right border border-gray-300">
                            {account.credit_balance > 0 ? (
                              <span className="text-red-600 font-semibold">
                                {account.credit_balance.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Grand Total Row */}
                    <tr className="bg-green-50 border-t-2 border-gray-400 font-bold">
                      <td colSpan="3" className="px-4 py-3 text-right border border-gray-300">
                        Grand Total:
                      </td>
                      <td className="px-4 py-3 text-right text-green-600 border border-gray-300">
                        {totalDebit.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600 border border-gray-300">
                        {totalCredit.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer with Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-6 border-t">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstAccount + 1} to{" "}
                  {Math.min(indexOfLastAccount, trialBalanceData.length)} of{" "}
                  {trialBalanceData.length} accounts
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
                  <div className="px-4 py-1 bg-green-500 text-white rounded-lg font-medium">
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
