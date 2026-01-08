"use client";
import React, { useState, useEffect } from "react";
import { Printer, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import Select from "react-select";
import { FileText } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { exportToCSV } from "@/app/utils/exportToCsv";

// Custom Select Styles
const selectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#6366F1" : "#E5E7EB",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.1)" : "none",
    borderWidth: "2px",
    minHeight: "30px",
    "&:hover": {
      borderColor: "#6366F1",
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#6366F1"
      : state.isFocused
      ? "#F0F9FF"
      : "white",
    color: state.isSelected ? "white" : "#374151",
  }),
  menu: (provided) => ({
    ...provided,
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    border: "1px solid #E5E7EB",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#9CA3AF",
  }),
};

export default function AccountLedgerModal() {
  const { control, setValue, watch } = useForm();
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const selectedAccount = watch("selectedAccount");
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const transactionsPerPage = 15;

  // Fetch all accounts on component mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/account/accounts/readAll");
      const data = await response.json();
      if (data.response_result) {
        setAccounts(data.response_result);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  // Format account code as 01-003-00002
  const formatAccountCode = (head_id, sub_id, account_id) => {
    const headPart = String(head_id).padStart(2, "0");
    const subPart = String(sub_id).padStart(3, "0");
    const accountPart = String(account_id).padStart(5, "0");
    return `${headPart}-${subPart}-${accountPart}`;
  };

  const fetchLedger = async () => {
    if (!selectedAccount || !startDate || !endDate) {
      toast.error("Please select account and both dates");
      return;
    }

    setIsLoading(true);
    try {
      // Fetch transactions
      const transResponse = await fetch(
        `/api/account/accounts/read/readLedger?acc_id=${selectedAccount}&start_dat=${startDate}&end_dat=${endDate}`
      );
      const transData = await transResponse.json();

      setTransactions(transData.response_result.data || []);
      setOpeningBalance(transData.response_result.openingBalance || 0);
      setIsOpen(true);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching ledger:", error);
      toast.error("Failed to fetch ledger");
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  // Get selected account details
  const selectedAccountData = accounts.find(
    (acc) => acc.acc_id === parseInt(selectedAccount)
  );

  // Calculate running balance
  const calculateRunningBalance = (index) => {
    let balance = openingBalance;
    for (let i = 0; i <= index; i++) {
      const trans = transactions[i];
      balance += (trans.debit || 0) - (trans.credit || 0);
    }
    return balance;
  };

  const accountOptions = accounts.map((a) => ({
    value: a.acc_id,
    label: a.account_nam,
  }));

  const handleDownloadPDF = async () => {
    if (!selectedAccount || !startDate || !endDate) {
      toast.error("Please select account and both dates");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/account/accounts/read/downloadLedger?acc_id=${selectedAccount}&start_dat=${startDate}&end_dat=${endDate}`
      );

      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Account_Ledger_${selectedAccountData?.account_nam.replace(
        /\s+/g,
        "_"
      )}_${startDate}_to_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download PDF");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!transactions.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Sr No",
      "Date",
      "Transaction No",
      "Description",
      "Debit",
      "Credit",
      "Running Balance",
    ];

    const rows = [];

    // 🔹 Opening Balance row
    rows.push([
      "",
      new Date(startDate).toLocaleDateString(),
      "",
      "Opening Balance",
      "",
      "",
      openingBalance.toFixed(2),
    ]);

    // 🔹 Transaction rows
    transactions.forEach((trans, index) => {
      const runningBalance = calculateRunningBalance(index);

      rows.push([
        index + 1,
        new Date(trans.transaction_dat).toLocaleDateString(),
        trans.t_id,
        trans.remarks || "-",
        trans.debit ? trans.debit.toFixed(2) : "",
        trans.credit ? trans.credit.toFixed(2) : "",
        runningBalance.toFixed(2),
      ]);
    });

    exportToCSV(
      `Account_Ledger_${selectedAccountData.account_nam}_${startDate}_to_${endDate}.csv`,
      headers,
      rows
    );
  };

  return (
    <div>
      {/* Card to trigger ledger */}
      <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 cursor-pointer  h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-500 transition-colors duration-300">
              <FileText className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Account Ledger
          </h3>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Select Account
              </label>
              <Controller
                control={control}
                name="selectedAccount"
                render={({ field }) => (
                  <Select
                    {...field}
                    options={accountOptions}
                    placeholder="Search accounts..."
                    isSearchable
                    value={
                      selectedAccount
                        ? accountOptions.find(
                            (a) => a.value === selectedAccount
                          )
                        : null
                    }
                    onChange={(opt) => {
                      field.onChange(opt.value);
                    }}
                    styles={selectStyles}
                    className="w-full text-sm"
                  />
                )}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setValue("selectedAccount", "");
                setStartDate("");
                setEndDate("");
              }}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
            <button
              onClick={fetchLedger}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "View Ledger"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isOpen && selectedAccountData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center print:bg-white print:relative print:p-0">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[100vh] overflow-hidden flex flex-col print:max-h-none print:shadow-none">
            {/* Header */}
            <div className="flex items-center justify-end p-1 border-b print:hidden">
              <div className="flex gap-1">
                <button
                  onClick={handleExport}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  title="Export CSV"
                >
                  Export
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  disabled={isLoading}
                >
                  <Printer className="w-4 h-4" />
                  {isLoading ? "Loading..." : "Download PDF"}
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
                <h1 className="text-xl font-bold text-gray-900 ">
                  Account Ledger
                </h1>
                <p className="text-gray-600 text-sm ">
                  From:{" "}
                  <span className="font-semibold">
                    {new Date(startDate).toLocaleDateString()}
                  </span>{" "}
                  To:{" "}
                  <span className="font-semibold">
                    {new Date(endDate).toLocaleDateString()}
                  </span>
                </p>

                {/* Account Details */}
                <div className="bg-gray-50 rounded-lg p-3 inline-block">
                  <div className="text-left">
                    <div className="mb-1">
                      <span className="font-semibold text-gray-700">
                        Account Name:{" "}
                      </span>
                      {selectedAccountData.is_customer === 1 ? (
                        <span className="text-gray-900">
                          {selectedAccountData.account_nam}
                        </span>
                      ) : (
                        <span className="text-gray-900">
                          {selectedAccountData.account_nam}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">
                        Acc Code:{" "}
                      </span>
                      <span className="text-gray-900 font-mono">
                        {formatAccountCode(
                          selectedAccountData.head_id,
                          selectedAccountData.subhead.subhead_id,
                          selectedAccountData.account_id
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-3 py-2 text-left font-bold text-gray-700">
                        Sr. No
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700">
                        T.No
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700">
                        Description
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700">
                        Debit
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700">
                        Credit
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Opening Balance Row */}
                    <tr className="bg-blue-50 border-b border-gray-300 font-semibold">
                      <td className="px-3 py-2"></td>
                      <td className="px-3 py-2" colSpan="3">
                        Opening Balance
                      </td>
                      <td className="px-3 py-2 text-right"></td>
                      <td className="px-3 py-2 text-right"></td>
                      <td className="px-3 py-2 ">
                        <span
                          className={
                            openingBalance < 0
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          {openingBalance.toFixed(2)}
                        </span>
                      </td>
                    </tr>

                    {/* Transaction Rows */}
                    {currentTransactions.map((trans, index) => {
                      const actualIndex = indexOfFirstTransaction + index;
                      const serialNumber = actualIndex + 1;
                      const runningBalance =
                        calculateRunningBalance(actualIndex);

                      return (
                        <tr
                          key={trans.t_id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-3 py-2 t">{serialNumber}</td>
                          <td className="px-3 py-2">
                            {new Date(
                              trans.transaction_dat
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2">{trans.t_id}</td>
                          <td className="px-3 py-2">{trans.remarks || "-"}</td>
                          <td className="px-3 py-2 ">
                            {trans.debit ? trans.debit.toFixed(2) : "-"}
                          </td>
                          <td className="px-3 py-2 ">
                            {trans.credit ? trans.credit.toFixed(2) : "-"}
                          </td>
                          <td className="px-3 py-2  font-medium">
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
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2" colSpan="3">
                          Closing Balance
                        </td>
                        <td className="px-3 py-2 ">
                          {transactions
                            .reduce((sum, t) => sum + (t.debit || 0), 0)
                            .toFixed(2)}
                        </td>
                        <td className="px-3 py-2 ">
                          {transactions
                            .reduce((sum, t) => sum + (t.credit || 0), 0)
                            .toFixed(2)}
                        </td>
                        <td className="px-3 py-2 ">
                          <span
                            className={
                              calculateRunningBalance(transactions.length - 1) <
                              0
                                ? "text-red-600"
                                : "text-green-600"
                            }
                          >
                            {calculateRunningBalance(
                              transactions.length - 1
                            ).toFixed(2)}
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
