"use client";
import React, { useState, useEffect } from "react";
import { X, FileText } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/app/utils/exportToCsv";
import Select from "react-select";

const selectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#9333EA" : "#E5E7EB",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(147, 51, 234, 0.1)" : "none",
    borderWidth: "2px",
    minHeight: "30px",
    "&:hover": {
      borderColor: "#9333EA",
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#9333EA"
      : state.isFocused
        ? "#F3E8FF"
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

export default function LocalSaleReport() {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [localAccountId, setLocalAccountId] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch("/api/account/accounts/readAll?all=true");
        if (res.ok) {
          const result = await res.json();
          let accountsData = [];
          if (result.response_result) {
            accountsData = result.response_result?.data || result.response_result;
          } else if (result.data) {
            accountsData = result.data;
          }
          if (!Array.isArray(accountsData)) accountsData = [];

          const localAccounts = accountsData.filter(
            (acc) => acc.subhead?.subhead_nam?.toLowerCase() === "local sale" || acc.subhead?.subhead_nam?.toLowerCase() === "local sales"
          );

          setAccounts(localAccounts.length ? localAccounts : accountsData);
        }
      } catch (err) {
        console.error("Error fetching accounts:", err);
      }
    };
    fetchAccounts();
  }, []);

  const fetchReport = async () => {
    if (!startDate || !endDate || !localAccountId) {
      toast.error("Please select start date, end date, and a local account");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/localSale/read/readReportDetail?start_dat=${startDate}&end_dat=${endDate}&local_account=${localAccountId}`
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

  const purchaserRows = Object.values(
    reportData.reduce((groups, item) => {
      const key = item.purchaser_account;
      const row = groups[key] || {
        purchaser_account: key,
        account: item.purchaser_account_ref,
        totalWeight: 0,
        totalAmount: 0,
        totalPreviousBalance: 0,
        totalReceived: 0,
        totalNetBalance: 0,
        cost: 0,
        hasCostData: true,
      };

      row.totalWeight += Number(item.purchaser_weight) || 0;
      row.totalAmount += Number(item.purchaser_amount) || 0;
      row.totalPreviousBalance += Number(item.previous_balance) || 0;
      row.totalReceived += Number(item.received_amount) || 0;
      row.totalNetBalance += Number(item.net_balance) || 0;

      if (!item.stock_allocations?.length) {
        row.hasCostData = false;
      } else {
        row.cost += item.stock_allocations.reduce(
          (sum, allocation) =>
            sum +
            (Number(allocation.weight) || 0) *
              (Number(allocation.rate ?? allocation.stock_lot?.rate) || 0),
          0,
        );
      }

      groups[key] = row;
      return groups;
    }, {}),
  ).sort((a, b) =>
    (a.account?.account_nam || "").localeCompare(b.account?.account_nam || ""),
  );

  const grandTotalWeight = purchaserRows.reduce((s, row) => s + row.totalWeight, 0);
  const grandTotalAmount = purchaserRows.reduce((s, row) => s + row.totalAmount, 0);
  const grandTotalPreviousBalance = purchaserRows.reduce(
    (s, row) => s + row.totalPreviousBalance,
    0,
  );
  const grandTotalReceived = purchaserRows.reduce((s, row) => s + row.totalReceived, 0);
  const grandTotalNetBalance = purchaserRows.reduce(
    (s, row) => s + row.totalNetBalance,
    0,
  );
  const totalPurchaseCost = purchaserRows.every((row) => row.hasCostData)
    ? purchaserRows.reduce((s, row) => s + row.cost, 0)
    : null;
  const averagePurchaseRate =
    totalPurchaseCost !== null && grandTotalWeight > 0
      ? totalPurchaseCost / grandTotalWeight
      : null;
  const totalProfit =
    totalPurchaseCost !== null ? grandTotalAmount - totalPurchaseCost : null;

  const selectedAccountName = accounts.find((a) => a.acc_id === (localAccountId ? parseInt(localAccountId) : null))?.account_nam || "Unknown Account";

  const accountOptions = accounts.map((a) => ({
    value: a.acc_id,
    label: a.account_nam,
  }));

  const handleExport = () => {
    if (!reportData.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Purchaser",
      "Weight",
      "Rate",
      "Amount",
      "Previous Balance",
      "Received",
      "Net Balance",
    ];

    const rows = purchaserRows.map((row) => [
      row.account?.account_contact
        ? `${row.account?.account_nam || "—"} (${row.account.account_contact})`
        : row.account?.account_nam || "—",
      row.totalWeight.toFixed(2),
      row.totalWeight > 0 ? (row.totalAmount / row.totalWeight).toFixed(2) : "0.00",
      row.totalAmount.toFixed(2),
      row.totalPreviousBalance.toFixed(2),
      row.totalReceived.toFixed(2),
      row.totalNetBalance.toFixed(2),
    ]);
    rows.push([
      "Grand Total",
      grandTotalWeight.toFixed(2),
      "",
      grandTotalAmount.toFixed(2),
      grandTotalPreviousBalance.toFixed(2),
      grandTotalReceived.toFixed(2),
      grandTotalNetBalance.toFixed(2),
    ]);
    rows.push([
      "Total Purchase Cost",
      "",
      averagePurchaseRate?.toFixed(2) || "Unavailable",
      totalPurchaseCost?.toFixed(2) || "Unavailable",
      "",
      "",
      "",
    ]);
    rows.push([
      "Profit",
      "",
      "",
      totalPurchaseCost === null
        ? "Unavailable"
        : `${grandTotalAmount.toFixed(2)} - ${totalPurchaseCost.toFixed(2)} = ${totalProfit.toFixed(2)}`,
      "",
      "",
      "",
    ]);

    exportToCSV(`Local_Sale_Report_${startDate}_to_${endDate}.csv`, headers, rows);
  };

  const fmt = (n, decimals = 2) =>
    Number(n).toLocaleString(undefined, { minimumFractionDigits: decimals });

  return (
    <div>
      <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative p-6">

          <h3 className="text-lg font-semibold text-gray-900 mb-10">
            LOCAL SALE REPORT
          </h3>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Local Account
              </label>
              <Select
                options={accountOptions}
                placeholder="Search Account..."
                isSearchable
                value={
                  localAccountId
                    ? accountOptions.find((a) => a.value === parseInt(localAccountId)) || null
                    : null
                }
                onChange={(opt) => setLocalAccountId(opt ? opt.value : "")}
                styles={selectStyles}
                className="w-full text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setLocalAccountId("");
              }}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
            <button
              onClick={fetchReport}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "View"}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[100vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-2 border-b border-gray-300">
              <div>
                <h1 className="text-xl font-bold">Local Sale Report</h1>
                <p className="text-sm font-semibold text-gray-800 uppercase">
                  {selectedAccountName}
                </p>
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

            <div className="flex-1 overflow-auto p-4">
              {purchaserRows.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500 border border-gray-300 rounded">
                  No records found for this period
                </div>
              ) : (
                <>
                <table className="w-full border-collapse text-sm border border-gray-400">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-800 border border-gray-400">
                        Purchaser
                      </th>
                      
                      <th className="px-3 py-2 text-right font-semibold text-gray-800 border border-gray-400">
                        Weight
                      </th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-800 border border-gray-400">
                        Rate
                      </th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-800 border border-gray-400">
                        Amount
                      </th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-800 border border-gray-400">
                        Prev. Balance
                      </th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-800 border border-gray-400">
                        Received
                      </th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-800 border border-gray-400">
                        Net Balance
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {purchaserRows.map((row) => (
                      <tr key={row.purchaser_account} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 border border-black">
                          <div className="text-gray-900 font-medium">{row.account?.account_nam || "—"}</div>
                          <div className="text-xs text-gray-500">{row.account?.account_contact}</div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono border border-black">{fmt(row.totalWeight, 0)}</td>
                        <td className="px-3 py-2 text-right font-mono border border-black">
                          {fmt(row.totalWeight > 0 ? row.totalAmount / row.totalWeight : 0)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono border border-black">{fmt(row.totalAmount)}</td>
                        <td className="px-3 py-2 text-right font-mono border border-black">{fmt(row.totalPreviousBalance)}</td>
                        <td className="px-3 py-2 text-right font-mono border border-black">{fmt(row.totalReceived)}</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold border border-black">{fmt(row.totalNetBalance)}</td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot>
                    <tr className="bg-gray-800 text-white font-bold">
                      <td
                        colSpan={1}
                        className="px-3 py-3 text-left border border-black"
                      >
                        Grand Total:
                      </td>
                      <td colSpan={2} className="px-10 py-3 text-left font-mono border border-black">
                        {fmt(grandTotalWeight, 0)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono border border-black">
                        {fmt(grandTotalAmount)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono border border-black">
                        {fmt(grandTotalPreviousBalance)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono border border-black">
                        {fmt(grandTotalReceived)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono border border-black">
                        {fmt(grandTotalNetBalance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
                <div className="mt-5 space-y-2 text-center font-semibold">
                  <p>
                    Total Purchase Cost: {totalPurchaseCost === null ? "Unavailable" : fmt(totalPurchaseCost)}
                  </p>
                  <p>
                    Average Purchase Rate: {averagePurchaseRate === null ? "Unavailable" : fmt(averagePurchaseRate)}
                  </p>
                  <p >
                    Profit: {fmt(grandTotalAmount)} - {totalPurchaseCost === null ? "Unavailable" : fmt(totalPurchaseCost)} = {totalProfit === null ? "Unavailable" : fmt(totalProfit)}
                  </p>
                </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
