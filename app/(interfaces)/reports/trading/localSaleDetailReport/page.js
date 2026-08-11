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
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
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
    const purchaseCost = source && totalWeight > 0
      ? (totalWeight / source.totalWeight) * source.totalCost
      : null;
    const averagePurchaseRate = purchaseCost !== null && totalWeight > 0
      ? purchaseCost / totalWeight
      : null;
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
      profit: purchaseCost !== null ? totalAmount - purchaseCost : null,
      weightDifference: (source?.totalWeight || 0) - totalWeight,
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
      rows.push([day.date, "Purchase Cost", "", "", day.purchaseCost === null ? "Unavailable" : day.purchaseCost.toFixed(2), "", "", ""]);
      rows.push([day.date, "Profit", "", "", day.profit === null ? "Unavailable" : `${day.totalAmount.toFixed(2)} - ${day.purchaseCost.toFixed(2)} = ${day.profit.toFixed(2)}`, "", "", ""]);
      rows.push([day.date, "Weight Difference", `${day.sourceWeight.toFixed(2)} - ${day.totalWeight.toFixed(2)} = ${day.weightDifference.toFixed(2)}`, "", "", "", "", ""]);
    });
    rows.push(["", "Grand Total", grandTotalWeight.toFixed(2), "", grandTotalAmount.toFixed(2), grandTotalPreviousBalance.toFixed(2), grandTotalReceived.toFixed(2), grandTotalNetBalance.toFixed(2)]);
    rows.push(["", "Grand Weight Loss", `${grandTotalSourceWeight.toFixed(2)} - ${grandTotalWeight.toFixed(2)} = ${grandTotalWeightDifference.toFixed(2)}`, "", "", "", "", ""]);

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
              {dateSections.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500 border border-gray-300 rounded">
                  No records found for this period
                </div>
              ) : (
                <>
                  {dateSections.map((day) => (
                    <section key={day.date} className="mb-8">
                      <h2 className="mb-2 text-lg font-bold">Date: {day.date}</h2>
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
                      <div className="mt-4 space-y-2 text-center font-semibold">
                        <p>Purchase Cost: {day.purchaseCost === null ? "Unavailable" : fmt(day.purchaseCost)}</p>
                        <p>Profit: {fmt(day.totalAmount)} - {day.purchaseCost === null ? "Unavailable" : fmt(day.purchaseCost)} = {day.profit === null ? "Unavailable" : fmt(day.profit)}</p>
                        <p>Weight Loss: {fmt(day.sourceWeight, 0)} - {fmt(day.totalWeight, 0)} = {fmt(day.weightDifference, 0)}</p>
                      </div>
                    </section>
                  ))}
                  <div className="mt-8 space-y-2 text-center font-bold">
                    <p>Grand Total Weight: {fmt(grandTotalWeight, 0)}</p>
                    <p>Grand Total Amount: {fmt(grandTotalAmount)}</p>
                    <p>Grand Total Profit: {totalProfit === null ? "Unavailable" : fmt(totalProfit)}</p>
                    <p>Grand Weight Loss: {fmt(grandTotalSourceWeight, 0)} - {fmt(grandTotalWeight, 0)} = {fmt(grandTotalWeightDifference, 0)}</p>
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
