"use client";
import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
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

export default function LocalSaleProfitModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [groupBy, setGroupBy] = useState("date");
  const [localAccountId, setLocalAccountId] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [reportData, setReportData] = useState([]);
  
  const [grandTotalPurchase, setGrandTotalPurchase] = useState(0);
  const [grandTotalSale, setGrandTotalSale] = useState(0);
  const [grandTotalReceived, setGrandTotalReceived] = useState(0);
  const [grandTotalWeightLoss, setGrandTotalWeightLoss] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const rowsPerPage = 15;

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

  const accountOptions = accounts.map((a) => ({
    value: a.acc_id,
    label: a.account_nam,
  }));
  
  const selectedAccountName = accounts.find((a) => a.acc_id === (localAccountId ? parseInt(localAccountId) : null))?.account_nam || "Unknown Account";

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
    if (!startDate || !endDate || !localAccountId) {
      toast.error("Please select start date, end date, and local account");
      return;
    }

    let start_dat = startDate;
    let end_dat = endDate;

    if (groupBy === "month") {
      start_dat = `${startDate}-01`;
      const [year, month] = endDate.split("-");
      const lastDay = new Date(year, month, 0).getDate();
      end_dat = `${endDate}-${lastDay}`;
    } else if (groupBy === "year") {
      start_dat = `${startDate}-01-01`;
      end_dat = `${endDate}-12-31`;
    }

    if (new Date(start_dat) > new Date(end_dat)) {
      toast.error("Start date must be before end date");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/localSale/read/readProfitReport?start_dat=${start_dat}&end_dat=${end_dat}&group_by=${groupBy}&local_account=${localAccountId}`,
      );
      const data = await res.json();

      if (data.response_status === "success" || data.response_code === 200) {
        const result = data.response_result || data.data;
        setReportData(result.results || []);
        setGrandTotalPurchase(result.grandTotalPurchase || 0);
        setGrandTotalSale(result.grandTotalSale || 0);
        setGrandTotalReceived(result.grandTotalReceived || 0);
        setGrandTotalWeightLoss(result.grandTotalWeightLoss || 0);
        setNetProfit(result.netProfit || 0);
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

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = reportData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(reportData.length / rowsPerPage);

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
      "Purchase Amount",
      "Sale Amount",
      "Received",
      "Weight Loss",
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
        (row.received_amount || 0).toFixed(2),
        (row.weight_loss || 0).toFixed(2),
        profit.toFixed(2),
        loss.toFixed(2),
      ];
    });

    rows.push([
      "Grand Total",
      grandTotalPurchase.toFixed(2),
      grandTotalSale.toFixed(2),
      grandTotalReceived.toFixed(2),
      grandTotalWeightLoss.toFixed(2),
      netProfit > 0 ? netProfit.toFixed(2) : "0.00",
      netProfit < 0 ? Math.abs(netProfit).toFixed(2) : "0.00",
    ]);

    exportToCSV(
      `Local_Sale_Profit_Loss_Report_${groupBy}_${startDate}_to_${endDate}.csv`,
      headers,
      rows,
    );
  };

  const renderDateInput = (value, onChange) => {
    if (groupBy === "date") {
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
      );
    } else if (groupBy === "month") {
      return (
        <input
          type="month"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
      <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            LOCAL SALE PROFIT/LOSS REPORT
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
                Group By
              </label>
              <select
                value={groupBy}
                onChange={(e) => {
                  setGroupBy(e.target.value);
                  setStartDate("");
                  setEndDate("");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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

          <div className="flex gap-2">
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setGroupBy("date");
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
              {isLoading ? "Loading..." : "View Report"}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[100vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-2 border-b border-gray-300">
              <div>
                <h1 className="text-xl font-bold">Local Sale Profit Report</h1>
                <p className="text-sm font-semibold text-gray-800 uppercase">
                  {selectedAccountName}
                </p>
                <p className="text-sm text-gray-600">
                  From: {new Date(startDate).toLocaleDateString()} To:{" "}
                  {new Date(endDate).toLocaleDateString()} | Grouped by:{" "}
                  {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
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
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-4 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        {getPeriodHeader()}
                      </th>
                      <th className="px-4 py-2 text-right font-bold text-gray-700 border border-gray-300">
                        Purchase Amount
                      </th>
                      <th className="px-4 py-2 text-right font-bold text-gray-700 border border-gray-300">
                        Sale Amount
                      </th>
                      <th className="px-4 py-2 text-right font-bold text-gray-700 border border-gray-300">
                        Received
                      </th>
                      <th className="px-4 py-2 text-right font-bold text-gray-700 border border-gray-300">
                        Weight Loss
                      </th>
                      <th className="px-4 py-2 text-right font-bold text-gray-700 border border-gray-300">
                        Profit
                      </th>
                      <th className="px-4 py-2 text-right font-bold text-gray-700 border border-gray-300">
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
                        <td className="px-4 py-2 font-medium border border-gray-300">
                          {formatPeriod(row.period, groupBy)}
                        </td>
                        <td className="px-4 py-2 text-right border border-gray-300">
                          {row.purchase_amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right border border-gray-300">
                          {row.sale_amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right text-blue-700 font-semibold border border-gray-300">
                          {(row.received_amount || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold border border-gray-300">
                          {(row.weight_loss || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold border border-gray-300">
                          {row.profit_loss > 0 ? row.profit_loss.toFixed(2) : 0}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold border border-gray-300">
                          {row.profit_loss < 0
                            ? Math.abs(row.profit_loss).toFixed(2)
                            : 0}
                        </td>
                      </tr>
                    ))}

                    {reportData.length > 0 && (
                      <tr className="bg-purple-50 border-t-2 border-gray-400 font-bold">
                        <td className="px-4 py-3 border border-gray-300">Grand Total:</td>
                        <td className="px-4 py-3 text-right border border-gray-300">
                          {grandTotalPurchase.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right border border-gray-300">
                          {grandTotalSale.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-blue-700 border border-gray-300">
                          {grandTotalReceived.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right border border-gray-300">
                          {grandTotalWeightLoss.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right border border-gray-300">
                          {netProfit > 0 ? netProfit.toFixed(2) : 0}
                        </td>
                        <td className="px-4 py-3 text-right border border-gray-300">
                          {netProfit < 0 ? Math.abs(netProfit).toFixed(2) : 0}
                        </td>
                      </tr>
                    )}

                    {reportData.length > 0 && (
                      <tr className="bg-gray-100 border-t border-gray-300 font-bold">
                        <td colSpan="5" className="px-4 py-3 text-right border border-gray-300">
                          Net Profit:
                        </td>
                        <td className="px-4 py-3 text-right text-lg border border-gray-300">
                          <span
                            className={
                              netProfit >= 0 ? "text-green-600" : "text-red-600"
                            }
                          >
                            {netProfit.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold border border-gray-300"></td>
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
                  <div className="px-4 py-1 bg-purple-600 text-white rounded-lg font-medium">
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
