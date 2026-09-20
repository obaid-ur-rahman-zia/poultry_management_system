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

export default function LocalSaleReport({ initialAccounts = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [localAccountId, setLocalAccountId] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAccounts = async () => {
    if (initialAccounts !== null) {
      let accountsData = Array.isArray(initialAccounts) ? initialAccounts : [];
      setAccounts(
        accountsData.filter(
          (acc) =>
            acc.account_nam?.toLowerCase() === "bhagtanwala" &&
            acc.subhead?.subhead_nam?.toLowerCase() === "purchaser",
        ),
      );
      return;
    }
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

        setAccounts(
          accountsData.filter(
            (acc) =>
              acc.account_nam?.toLowerCase() === "bhagtanwala" &&
              acc.subhead?.subhead_nam?.toLowerCase() === "purchaser",
          ),
        );
      }
    } catch (err) {
      console.error("Error fetching accounts:", err);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [initialAccounts]);

  useEffect(() => {
    if (accounts.length > 0 && !localAccountId) {
      setLocalAccountId(accounts[0].acc_id.toString());
    }
  }, [accounts, localAccountId]);

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
      setReportData(data.response_result || { localSales: [], dailySources: [] });
      setIsOpen(true);
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch report");
    } finally {
      setIsLoading(false);
    }
  };

  const localSales = Array.isArray(reportData) ? reportData : reportData.localSales || [];
  const dailySources = Array.isArray(reportData)
    ? []
    : reportData.dailySources || [];

  const summarizeDate = (date, sales) => {
    const purchaserRows = Object.values(
      sales.reduce((groups, item) => {
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

        if (!item.source_snapshots?.length) {
          row.hasCostData = false;
        } else {
          const sourceWeight = item.source_snapshots.reduce(
            (sum, snapshot) => sum + (Number(snapshot.weight) || 0),
            0,
          );
          const sourceCost = item.source_snapshots.reduce(
            (sum, snapshot) =>
              sum +
              (Number(snapshot.weight) || 0) *
              (Number(snapshot.rate ?? snapshot.source?.rate) || 0),
            0,
          );
          row.cost += sourceWeight
            ? ((Number(item.purchaser_weight) || 0) * sourceCost) / sourceWeight
            : 0;
        }

        groups[key] = row;
        return groups;
      }, {}),
    ).sort((a, b) =>
      (a.account?.account_nam || "").localeCompare(b.account?.account_nam || ""),
    );
    const totalWeight = purchaserRows.reduce((sum, row) => sum + row.totalWeight, 0);
    const totalAmount = purchaserRows.reduce((sum, row) => sum + row.totalAmount, 0);
    const totalPreviousBalance = purchaserRows.reduce((sum, row) => sum + row.totalPreviousBalance, 0);
    const totalReceived = purchaserRows.reduce((sum, row) => sum + row.totalReceived, 0);
    const totalNetBalance = purchaserRows.reduce((sum, row) => sum + row.totalNetBalance, 0);
    const source = dailySources.find((entry) => entry.date === date);

    const purchaseCost = source ? source.totalCost : null;
    const averagePurchaseRate = purchaseCost !== null && source?.totalWeight > 0
      ? purchaseCost / source.totalWeight
      : null;

    const sourceEntries = source ? source.entries : [];
    const dailyExpense = reportData.dailyExpenses ? (reportData.dailyExpenses[date] || 0) : 0;

    const netReceiving = totalReceived - dailyExpense;
    const profit = purchaseCost !== null ? totalAmount - purchaseCost : null;
    const netProfit = profit !== null ? profit - dailyExpense : null;

    return {
      date,
      purchaserRows,
      totalWeight,
      totalAmount,
      totalPreviousBalance,
      totalReceived,
      totalNetBalance,
      sourceWeight: source?.totalWeight || 0,
      purchaseCost,
      averagePurchaseRate,
      profit,
      weightDifference: (source?.totalWeight || 0) - totalWeight,
      sourceEntries,
      dailyExpense,
      netReceiving,
      netProfit,
    };
  };

  const groupedByDate = localSales.reduce((groups, sale) => {
    const date = new Date(sale.local_sale_date).toISOString().slice(0, 10);
    (groups[date] ||= []).push(sale);
    return groups;
  }, {});
  const dateSections = Object.keys(groupedByDate)
    .sort()
    .map((date) => summarizeDate(date, groupedByDate[date]));

  const grandTotalWeight = dateSections.reduce((sum, day) => sum + day.totalWeight, 0);
  const grandTotalAmount = dateSections.reduce((sum, day) => sum + day.totalAmount, 0);
  const grandTotalPreviousBalance = dateSections.reduce((sum, day) => sum + day.totalPreviousBalance, 0);
  const grandTotalReceived = dateSections.reduce((sum, day) => sum + day.totalReceived, 0);
  const grandTotalNetBalance = dateSections.reduce((sum, day) => sum + day.totalNetBalance, 0);
  const grandTotalSourceWeight = dateSections.reduce((sum, day) => sum + day.sourceWeight, 0);
  const grandTotalWeightDifference = grandTotalSourceWeight - grandTotalWeight;
  const totalPurchaseCost = dateSections.every((day) => day.purchaseCost !== null)
    ? dateSections.reduce((sum, day) => sum + day.purchaseCost, 0)
    : null;
  const totalProfit = totalPurchaseCost !== null ? grandTotalAmount - totalPurchaseCost : null;

  const grandTotalExpense = dateSections.reduce((sum, day) => sum + day.dailyExpense, 0);
  const grandTotalNetReceiving = grandTotalReceived - grandTotalExpense;
  const grandTotalNetProfit = totalProfit !== null ? totalProfit - grandTotalExpense : null;

  const selectedAccountName = accounts.find((a) => a.acc_id === (localAccountId ? parseInt(localAccountId) : null))?.account_nam || "Unknown Account";

  const accountOptions = accounts.map((a) => ({
    value: a.acc_id,
    label: a.account_nam,
  }));

  const handleExport = () => {
    if (!dateSections.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Date",
      "Purchaser",
      "Weight",
      "Rate",
      "Amount",
      "Previous Balance",
      "Received",
      "Net Balance",
    ];

    const rows = [];
    dateSections.forEach((day) => {
      // Add source details if available
      if (day.sourceEntries && day.sourceEntries.length > 0) {
        rows.push([day.date, "--- Source Purchase Details ---", "", "", "", "", "", ""]);
        day.sourceEntries.forEach(entry => {
          rows.push([day.date, "Source Entry", entry.weight.toFixed(2), entry.rate.toFixed(2), entry.total.toFixed(2), "", "", ""]);
        });
        rows.push([day.date, "Total Source Purchase", day.sourceWeight.toFixed(2), "", day.purchaseCost.toFixed(2), "", "", ""]);
        rows.push(["", "", "", "", "", "", "", ""]);
      }

      day.purchaserRows.forEach((row) => rows.push([
        day.date,
        row.account?.account_nam || "-",
        row.totalWeight.toFixed(2),
        row.totalWeight > 0 ? (row.totalAmount / row.totalWeight).toFixed(2) : "0.00",
        row.totalAmount.toFixed(2),
        row.totalPreviousBalance.toFixed(2),
        row.totalReceived.toFixed(2),
        row.totalNetBalance.toFixed(2),
      ]));
      rows.push([day.date, "Daily Total", day.totalWeight.toFixed(2), "", day.totalAmount.toFixed(2), day.totalPreviousBalance.toFixed(2), day.totalReceived.toFixed(2), day.totalNetBalance.toFixed(2)]);

      rows.push([day.date, "Net Receiving", "", "", day.netReceiving.toFixed(2), "", "", ""]);
      rows.push([day.date, "Weight Loss", day.weightDifference.toFixed(2), "", "", "", "", ""]);
      rows.push([day.date, "Profit", "", "", day.profit === null ? "Unavailable" : day.profit.toFixed(2), "", "", ""]);
      rows.push([day.date, "Net Profit", "", "", day.netProfit === null ? "Unavailable" : day.netProfit.toFixed(2), "", "", ""]);
      rows.push(["", "", "", "", "", "", "", ""]);
    });

    rows.push(["", "--- Grand Totals ---", "", "", "", "", "", ""]);
    rows.push(["", "Grand Total", grandTotalWeight.toFixed(2), "", grandTotalAmount.toFixed(2), grandTotalPreviousBalance.toFixed(2), grandTotalReceived.toFixed(2), grandTotalNetBalance.toFixed(2)]);
    rows.push(["", "Grand Net Receiving", "", "", grandTotalNetReceiving.toFixed(2), "", "", ""]);
    rows.push(["", "Grand Weight Loss", grandTotalWeightDifference.toFixed(2), "", "", "", "", ""]);
    rows.push(["", "Grand Profit", "", "", totalProfit === null ? "Unavailable" : totalProfit.toFixed(2), "", "", ""]);
    rows.push(["", "Grand Net Profit", "", "", grandTotalNetProfit === null ? "Unavailable" : grandTotalNetProfit.toFixed(2), "", "", ""]);

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
                  {new Date(startDate).toLocaleDateString("en-GB").replace(/\//g, "-")} –{" "}
                  {new Date(endDate).toLocaleDateString("en-GB").replace(/\//g, "-")}
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
              {dateSections.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500 border border-gray-300 rounded">
                  No records found for this period
                </div>
              ) : (
                <>
                  {dateSections.map((day) => (
                    <section key={day.date} className="mb-8">
                      <h2 className="mb-2 text-lg font-bold">Date: {day.date}</h2>

                      {/* Source details box */}
                      {day.sourceEntries && day.sourceEntries.length > 0 ? (
                        <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm w-full">
                          <div>
                            <div className="flex w-full justify-center divide-x divide-gray-400 border-b border-gray-200 pb-2 mb-2 leading-relaxed text-md">
                              {day.sourceEntries.map((entry, idx) => (
                                <div key={idx} className="flex-1 text-center px-2">
                                  <span>Weight: {fmt(entry.weight, 0)}</span>{" "}
                                  <span>Rate: {fmt(entry.rate)}</span>{" "}
                                  <span className="font-medium text-gray-900">Total: {fmt(entry.total)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-center gap-6 font-bold text-gray-800">
                              <span>Total Weight: {fmt(day.sourceWeight, 0)}</span>
                              <span>Total Purchase Cost: {fmt(day.purchaseCost)}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 text-sm italic text-gray-500">
                          No source purchase data available for this date.
                        </div>
                      )}

                      <table className="w-full border-collapse text-sm border border-gray-400">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left border border-gray-400">Purchaser</th>
                            <th className="px-3 py-2 text-right border border-gray-400">Weight</th>
                            <th className="px-3 py-2 text-right border border-gray-400">Rate</th>
                            <th className="px-3 py-2 text-right border border-gray-400">Amount</th>
                            <th className="px-3 py-2 text-right border border-gray-400">Prev. Balance</th>
                            <th className="px-3 py-2 text-right border border-gray-400">Received</th>
                            <th className="px-3 py-2 text-right border border-gray-400">Net Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.purchaserRows.map((row) => (
                            <tr key={row.purchaser_account}>
                              <td className="px-3 py-2 border border-black">{row.account?.account_nam || "-"}</td>
                              <td className="px-3 py-2 text-right border border-black">{fmt(row.totalWeight, 0)}</td>
                              <td className="px-3 py-2 text-right border border-black">{fmt(row.totalWeight ? row.totalAmount / row.totalWeight : 0)}</td>
                              <td className="px-3 py-2 text-right border border-black">{fmt(row.totalAmount)}</td>
                              <td className="px-3 py-2 text-right border border-black">{fmt(row.totalPreviousBalance)}</td>
                              <td className="px-3 py-2 text-right border border-black">{fmt(row.totalReceived)}</td>
                              <td className="px-3 py-2 text-right border border-black">{fmt(row.totalNetBalance)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-800 text-white font-bold">
                            <td className="px-3 py-3 border border-black">Daily Total</td>
                            <td className="px-3 py-3 text-right border border-black">{fmt(day.totalWeight, 0)}</td>
                            <td className="px-3 py-3 border border-black" />
                            <td className="px-3 py-3 text-right border border-black">{fmt(day.totalAmount)}</td>
                            <td className="px-3 py-3 text-right border border-black">{fmt(day.totalPreviousBalance)}</td>
                            <td className="px-3 py-3 text-right border border-black">{fmt(day.totalReceived)}</td>
                            <td className="px-3 py-3 text-right border border-black">{fmt(day.totalNetBalance)}</td>
                          </tr>
                        </tfoot>
                      </table>
                      <div className="mt-4 grid grid-cols-4 gap-4 text-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div>
                          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Net Receiving (Received - Expense)</p>
                          <p className="text-gray-900 font-semibold text-sm">{fmt(day.totalReceived)} - {fmt(day.dailyExpense)} = {fmt(day.netReceiving)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Weight Loss</p>
                          <p className="text-gray-900 font-semibold text-sm">{fmt(day.sourceWeight, 0)} - {fmt(day.totalWeight, 0)} = {fmt(day.weightDifference, 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Profit (Sale Amount -Purchase Cost)</p>
                          <p className="text-gray-900 font-semibold text-sm">{day.profit === null ? "Unavailable" : `${fmt(day.totalAmount)} - ${fmt(day.purchaseCost)} = ${fmt(day.profit)}`}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Net Profit (Profit - Expense)</p>
                          <p className="text-gray-900 font-semibold text-sm">{day.netProfit === null ? "Unavailable" : `${fmt(day.profit)} - ${fmt(day.dailyExpense)} = ${fmt(day.netProfit)}`}</p>
                        </div>
                      </div>
                    </section>
                  ))}
                  <div className="mt-8 grid grid-cols-4 gap-4 text-center bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <div>
                      <p className="text-purple-600 text-xs font-bold uppercase tracking-wider mb-1">Grand Net Receiving</p>
                      <p className="text-gray-900 font-bold text-sm">{fmt(grandTotalReceived)} - {fmt(grandTotalExpense)} = {fmt(grandTotalNetReceiving)}</p>
                    </div>
                    <div>
                      <p className="text-purple-600 text-xs font-bold uppercase tracking-wider mb-1">Grand Weight Loss</p>
                      <p className="text-gray-900 font-bold text-sm">{fmt(grandTotalSourceWeight, 0)} - {fmt(grandTotalWeight, 0)} = {fmt(grandTotalWeightDifference, 0)}</p>
                    </div>
                    <div>
                      <p className="text-purple-600 text-xs font-bold uppercase tracking-wider mb-1">Grand Profit</p>
                      <p className="text-gray-900 font-bold text-sm">{totalProfit === null ? "Unavailable" : `${fmt(grandTotalAmount)} - ${fmt(totalPurchaseCost)} = ${fmt(totalProfit)}`}</p>
                    </div>
                    <div>
                      <p className="text-purple-600 text-xs font-bold uppercase tracking-wider mb-1">Grand Net Profit</p>
                      <p className="text-gray-900 font-bold text-sm">{grandTotalNetProfit === null ? "Unavailable" : `${fmt(totalProfit)} - ${fmt(grandTotalExpense)} = ${fmt(grandTotalNetProfit)}`}</p>
                    </div>
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
