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

  const groupedByDate = reportData.reduce((acc, item) => {
    const dateKey = new Date(item.local_sale_date).toLocaleDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  const dates = Object.keys(groupedByDate)
    .sort((a, b) => new Date(a) - new Date(b))
    .map((date) => {
      const sales = groupedByDate[date];
      const totalWeight = sales.reduce(
        (s, i) => s + (Number(i.purchaser_weight) || 0),
        0
      );
      const totalAmount = sales.reduce(
        (s, i) => s + (Number(i.purchaser_amount) || 0),
        0
      );
      const totalReceived = sales.reduce(
        (s, i) => s + (Number(i.received_amount) || 0),
        0
      );

      return {
        date,
        sales,
        totalWeight,
        totalAmount,
        totalReceived,
      };
    });

  const grandTotalWeight = dates.reduce((s, f) => s + f.totalWeight, 0);
  const grandTotalAmount = dates.reduce((s, f) => s + f.totalAmount, 0);
  const grandTotalReceived = dates.reduce((s, f) => s + f.totalReceived, 0);

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
      "Date",
      "Purchaser Name",
      "Purchaser Contact",
      "Rate",
      "Weight",
      "Amount",
      "Previous Balance",
      "Received Amount",
      "Net Balance",
    ];

    const rows = [];
    dates.forEach((group) => {
      group.sales.forEach((item) => {
        rows.push([
          group.date,
          item.purchaser_account_ref?.account_nam || "—",
          item.purchaser_account_ref?.account_contact || "",
          Number(item.purchaser_rate || 0).toFixed(2),
          Number(item.purchaser_weight || 0).toFixed(2),
          Number(item.purchaser_amount || 0).toFixed(2),
          Number(item.previous_balance || 0).toFixed(2),
          Number(item.received_amount || 0).toFixed(2),
          Number(item.net_balance || 0).toFixed(2),
        ]);
      });
      rows.push([
        `${group.date} - Total`,
        "",
        "",
        "",
        group.totalWeight.toFixed(2),
        group.totalAmount.toFixed(2),
        "",
        group.totalReceived.toFixed(2),
        "",
      ]);
    });

    exportToCSV(`Local_Sale_Report_${startDate}_to_${endDate}.csv`, headers, rows);
  };

  const fmt = (n, decimals = 2) =>
    Number(n).toLocaleString(undefined, { minimumFractionDigits: decimals });

  return (
    <div>
      <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-500 transition-colors duration-300">
              <FileText className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors duration-300" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Local Sale Report
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
              {dates.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500 border border-gray-300 rounded">
                  No records found for this period
                </div>
              ) : (
                <table className="w-full border-collapse text-sm border border-gray-400">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-800 border border-gray-400">
                        Purchaser
                      </th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-800 border border-gray-400">
                        Rate
                      </th>
                      <th className="px-3 py-2 text-right font-semibold text-gray-800 border border-gray-400">
                        Weight
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
                    {dates.map((group, gi) => (
                      <React.Fragment key={gi}>
                        <tr>
                          <td
                            colSpan={7}
                            className="px-3 py-2 font-bold bg-gray-50 border border-black"
                          >
                            Date: {group.date}
                          </td>
                        </tr>

                        {group.sales.map((item) => (
                          <tr
                            key={item.local_sale_id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-3 py-2 border border-black">
                              <div className="text-gray-900 font-medium">
                                {item.purchaser_account_ref?.account_nam || "—"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.purchaser_account_ref?.account_contact}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right font-mono border border-black">
                              {fmt(item.purchaser_rate || 0)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono border border-black">
                              {fmt(item.purchaser_weight || 0, 0)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono border border-black">
                              {fmt(item.purchaser_amount || 0)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono border border-black">
                              {fmt(item.previous_balance || 0)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono border border-black">
                              {fmt(item.received_amount || 0)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-semibold border border-black">
                              {fmt(item.net_balance || 0)}
                            </td>
                          </tr>
                        ))}

                        <tr className="bg-gray-100 font-semibold">
                          <td
                            colSpan={2}
                            className="px-3 py-2 text-right text-gray-700 border border-black"
                          >
                            {group.date} Totals:
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-gray-800 border border-black">
                            {fmt(group.totalWeight, 0)}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-gray-800 border border-black">
                            {fmt(group.totalAmount)}
                          </td>
                          <td className="px-3 py-2 border border-black" />
                          <td className="px-3 py-2 text-right font-mono text-gray-800 border border-black">
                            {fmt(group.totalReceived)}
                          </td>
                          <td className="px-3 py-2 border border-black" />
                        </tr>

                        {gi < dates.length - 1 && (
                          <tr>
                            <td
                              colSpan={7}
                              className="py-1 border-0 bg-white"
                            />
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>

                  <tfoot>
                    <tr className="bg-gray-800 text-white font-bold">
                      <td
                        colSpan={2}
                        className="px-3 py-3 text-right border border-black"
                      >
                        Grand Total:
                      </td>
                      <td className="px-3 py-3 text-right font-mono border border-black">
                        {fmt(grandTotalWeight, 0)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono border border-black">
                        {fmt(grandTotalAmount)}
                      </td>
                      <td className="px-3 py-3 border border-black" />
                      <td className="px-3 py-3 text-right font-mono border border-black">
                        {fmt(grandTotalReceived)}
                      </td>
                      <td className="px-3 py-3 border border-black" />
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
