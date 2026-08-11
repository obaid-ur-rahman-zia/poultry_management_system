"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { toast } from "react-toastify";
import Select from "react-select";
import { Controller, useForm } from "react-hook-form";
import { exportToCSV } from "@/app/utils/exportToCsv";

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

export default function ProfitLossModal() {
  const { control, setValue, watch } = useForm();
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [groupBy, setGroupBy] = useState("date");
  const [reportData, setReportData] = useState([]);
  const [grandTotalPurchase, setGrandTotalPurchase] = useState(0);
  const [grandTotalSale, setGrandTotalSale] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [floc, setFloc] = useState([]);
  const [unit, setUnit] = useState([]);
  const selectedFloc = watch("floc");
  const selectedUnit = watch("unit");
  const rowsPerPage = 15;

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    if (selectedUnit) {
      fetchFlocsByUnit(selectedUnit);
    } else {
      setFloc([]);
      setValue("floc_id", "");
    }
  }, [selectedUnit]);

  const fetchUnits = async () => {
    try {
      const response = await fetch("/api/unit/readAll");
      const result = await response.json();
      if (result.response_status === "success") {
        const unitsData =
          result.response_result?.data || result.response_result || [];
        setUnit(Array.isArray(unitsData) ? unitsData : []);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
      setUnit([]);
    }
  };

  const unitOptions = unit.map((u) => ({
    value: u.prounit_id.toString(),
    label: u.prounit_nam,
  }));

  const flocOptions = floc.map((f) => ({
    value: f.floc_id.toString(),
    label: `Floc #${f.floc_id} - ${new Date(
      f.starting_date,
    ).toLocaleDateString()}`,
  }));

  const fetchFlocsByUnit = async (prounitId) => {
    try {
      const response = await fetch(
        `/api/floc/readByFarmId?farm_id=${prounitId}`,
      );
      const result = await response.json();
      if (result.response_status === "success") {
        const flocsData =
          result.response_result?.data || result.response_result || [];
        setFloc(Array.isArray(flocsData) ? flocsData : []);
      }
    } catch (error) {
      console.error("Error fetching flocs:", error);
      setFloc([]);
    }
  };

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
    if (!selectedFloc) {
      toast.error("Please select Floc");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    let start_dat = startDate;
    let end_dat = endDate;

    if (groupBy === "month") {
      // startDate is YYYY-MM
      start_dat = `${startDate}-01`;
      // Calculate last day of end month
      const [year, month] = endDate.split("-");
      const lastDay = new Date(year, month, 0).getDate();
      end_dat = `${endDate}-${lastDay}`;
    } else if (groupBy === "year") {
      // startDate is YYYY
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
        `/api/unitSale/read/readProfitReport?start_dat=${start_dat}&end_dat=${end_dat}&group_by=${groupBy}&floc_id=${selectedFloc}`,
      );
      const data = await res.json();
      console.log("Profit/Loss Data", data);

        setReportData(data.response_result.results);
        setGrandTotalPurchase(data.response_result.grandTotalPurchase);
        setGrandTotalSale(data.response_result.grandTotalSale);
        setNetProfit(data.response_result.netProfit);
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
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = reportData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(reportData.length / rowsPerPage);

  // Get column header based on groupBy
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
        profit.toFixed(2),
        loss.toFixed(2),
      ];
    });

    // Append grand total row
    rows.push([
      "Grand Total",
      grandTotalPurchase.toFixed(2),
      grandTotalSale.toFixed(2),
      netProfit > 0 ? netProfit.toFixed(2) : "0.00",
      netProfit < 0 ? Math.abs(netProfit).toFixed(2) : "0.00",
    ]);

    exportToCSV(
      `Profit_Loss_Report_${groupBy}_${startDate}_to_${endDate}.csv`,
      headers,
      rows,
    );
  };

  // Helper to render date input based on groupBy
  const renderDateInput = (value, onChange) => {
    if (groupBy === "date") {
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
        />
      );
    } else if (groupBy === "month") {
      return (
        <input
          type="month"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
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
            Profit / Loss Report
          </h3>

          <h1 className="text-sm font-bold text-gray-900 mb-4">FLoc Wise</h1>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Unit
            </label>
            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={unitOptions}
                  placeholder="Select Unit..."
                  value={
                    selectedUnit
                      ? unitOptions.find((o) => o.value === selectedUnit)
                      : null
                  }
                  isSearchable
                  styles={selectStyles}
                  className="w-full text-sm"
                  onChange={(opt) => {
                    field.onChange(opt.value);
                  }}
                />
              )}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Floc
            </label>
            <Controller
              name="floc"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={flocOptions}
                  placeholder="Select Floc..."
                  value={
                    selectedFloc
                      ? flocOptions.find((o) => o.value === selectedFloc)
                      : null
                  }
                  isSearchable
                  styles={selectStyles}
                  className="w-full text-sm"
                  onChange={(opt) => {
                    field.onChange(opt.value);
                  }}
                />
              )}
            />
          </div>
          {/* Filters */}
          <div className="space-y-3 mb-4">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
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

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setGroupBy("date");
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
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[100vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-end p-1 border-b">
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
            <div className="flex-1 overflow-auto p-4">
              {/* Report Header */}
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Profit & Loss Report
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
                  {" | "}
                  <span className="font-semibold">
                    Grouped by:{" "}
                    {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
                  </span>
                </p>
              </div>

              {/* Table */}
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
                        <td className="px-4 py-2 text-right font-semibold border border-gray-300">
                          {row.profit_loss > 0 ? row.profit_loss.toFixed(2) : 0}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold border border-gray-300">
                          {row.profit_loss < 0 ? row.profit_loss.toFixed(2) : 0}
                        </td>
                      </tr>
                    ))}

                    {/* Grand Total Row */}
                    {reportData.length > 0 && (
                      <tr className="bg-indigo-50 border-t-2 border-gray-400 font-bold">
                        <td className="px-4 py-3 border border-gray-300">Grand Total:</td>
                        <td className="px-4 py-3 text-right border border-gray-300">
                          {grandTotalPurchase.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right border border-gray-300">
                          {grandTotalSale.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right border border-gray-300">
                          {netProfit.toFixed(2) > 0 ? netProfit.toFixed(2) : 0}
                        </td>
                        <td className="px-4 py-3 text-right border border-gray-300">
                          {netProfit.toFixed(2) < 0 ? netProfit.toFixed(2) : 0}
                        </td>
                      </tr>
                    )}

                    {/* Net Profit Row */}
                    {reportData.length > 0 && (
                      <tr className="bg-gray-100 border-t border-gray-300 font-bold">
                        <td colSpan="3" className="px-4 py-3 text-right border border-gray-300">
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

            {/* Footer with Pagination */}
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
                  <div className="px-4 py-1 bg-indigo-500 text-white rounded-lg font-medium">
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
