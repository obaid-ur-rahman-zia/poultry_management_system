"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/app/utils/exportToCsv";
import { Button } from "@/components/ui/button";

export default function ShopSaleProfitReport() {
  const [isOpen, setIsOpen] = useState(false);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [groupBy, setGroupBy] = useState("date");

  const [reportData, setReportData] = useState([]);
  const [grandTotals, setGrandTotals] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Fetch shops
  const fetchShops = useCallback(async () => {
    try {
      const res = await fetch("/api/account/accounts/readAll?all=true");
      const data = await res.json();
      if (data.response_status === "success") {
        const list = data.response_result?.data || data.response_result || [];
        const shopList = Array.isArray(list)
          ? list.filter((a) => a.shop_enable === 1)
          : [];
        setShops(shopList);
        if (shopList.length > 0) {
          setSelectedShop(shopList[0].acc_id.toString());
        }
      }
    } catch (e) {
      console.error("fetchShops:", e);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const fetchReport = async () => {
    if (!selectedShop || !startDate || !endDate) {
      toast.error("Please select a shop and date range");
      return;
    }

    let start_dat = startDate;
    let end_dat = endDate;

    if (groupBy === "month") {
      const parsedStart = startDate.substring(0, 7);
      const parsedEnd = endDate.substring(0, 7);
      start_dat = `${parsedStart}-01`;
      const [year, month] = parsedEnd.split("-");
      const lastDay = new Date(year, month, 0).getDate();
      end_dat = `${parsedEnd}-${lastDay}`;
    } else if (groupBy === "year") {
      const parsedStart = startDate.substring(0, 4);
      const parsedEnd = endDate.substring(0, 4);
      start_dat = `${parsedStart}-01-01`;
      end_dat = `${parsedEnd}-12-31`;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/shop/reports/shop-sale-profit?shop_acc_id=${selectedShop}&start_dat=${start_dat}&end_dat=${end_dat}&group_by=${groupBy}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await res.json();
      if (data.response_status === "success") {
        setReportData(data.response_result?.results || []);
        setGrandTotals(data.response_result?.grandTotals || null);
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

  const fmt = (n, decimals = 2) =>
    Number(n).toLocaleString(undefined, { minimumFractionDigits: decimals });

  const formatPeriod = (period, groupType) => {
    if (groupType === "date") {
      const date = new Date(period);
      return date.toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).replace(/ /g, "-");
    } else if (groupType === "month") {
      const [year, month] = period.split("-");
      const date = new Date(year, parseInt(month) - 1);
      return date.toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      });
    }
    return period; // year
  };

  const totalPages = Math.ceil(reportData.length / itemsPerPage) || 1;
  const currentItems = reportData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    document.getElementById("profit-scroll-area")?.scrollTo(0, 0);
  };

  const handleExport = () => {
    if (!reportData.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Date",
      "Purchased Amount",
      "Sale Amount",
      "Recovery",
      "Profit / Loss",
    ];

    const rows = reportData.map((t) => [
      formatPeriod(t.period, groupBy),
      t.purchase_amount > 0 ? fmt(t.purchase_amount) : "-",
      t.sale_amount > 0 ? fmt(t.sale_amount) : "-",
      t.recovery > 0 ? fmt(t.recovery) : "-",
      fmt(t.profit),
    ]);

    if (grandTotals) {
      rows.push([]);
      rows.push([
        "Grand Total",
        fmt(grandTotals.purchase_amount),
        fmt(grandTotals.sale_amount),
        fmt(grandTotals.recovery),
        fmt(grandTotals.profit),
      ]);
    }

    const shopName =
      shops.find((c) => c.acc_id.toString() === selectedShop)?.account_nam ||
      "Shop";

    exportToCSV(
      `Shop_Sale_Profit_${shopName}_${startDate}_to_${endDate}.csv`,
      headers,
      rows
    );
  };

  const renderDateInput = (value, onChange) => {
    if (groupBy === "date") {
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
      );
    } else if (groupBy === "month") {
      return (
        <input
          type="month"
          value={value.substring(0, 7)} // ensures YYYY-MM format
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
          value={value.substring(0, 4)} // ensures YYYY format
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
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
      {/* Trigger Card */}
      <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative p-6">
          <h3 className="text-lg mb-5 font-semibold text-gray-900">
            SHOP SALE PROFIT
          </h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Shop Account
              </label>
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
              >
                {shops.map((c) => (
                  <option key={c.acc_id} value={c.acc_id}>
                    {c.account_nam}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Group By
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
              >
                <option value="date">Date</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
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
              onClick={fetchReport}
              disabled={isLoading || !selectedShop}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              View Profit
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between p-2 border-b bg-gray-50 gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Pagination */}
                <div className="flex items-center gap-1 bg-white border rounded-md p-1 shadow-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-2 text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50"
                  onClick={handleExport}
                >
                  <FileDown className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Content area */}
            <div
              id="profit-scroll-area"
              className="flex-1 overflow-auto p-4 bg-gray-100/50 relative"
            >
              {!reportData || reportData.length === 0 ? (
                <div className="flex justify-center items-center h-64 text-gray-500">
                  No data available.
                </div>
              ) : (
                <table className="w-full border-collapse text-sm border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-4 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        Date
                      </th>
                      <th className="px-4 py-2 text-right font-bold text-gray-700 border border-gray-300 w-32">
                        Purchased Amount
                      </th>
                      <th className="px-4 py-2 text-right font-bold text-gray-700 border border-gray-300 w-32">
                        Sale Amount
                      </th>
                      <th className="px-4 py-2 text-right font-bold text-gray-700 border border-gray-300 w-32">
                        Recovery
                      </th>
                      <th className="px-4 py-2 text-right font-bold text-gray-700 border border-gray-300 w-36">
                        Profit / Loss
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentItems.map((item, idx) => {
                      return (
                        <tr
                          key={`row-${idx}`}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-4 py-2 font-medium border border-gray-300">
                            {formatPeriod(item.period, groupBy)}
                          </td>
                          <td className="px-4 py-2 text-right border border-gray-300">
                            {item.purchase_amount > 0 ? fmt(item.purchase_amount) : "-"}
                          </td>
                          <td className="px-4 py-2 text-right border border-gray-300">
                            {item.sale_amount > 0 ? fmt(item.sale_amount) : "-"}
                          </td>
                          <td className="px-4 py-2 text-right text-blue-700 font-semibold border border-gray-300">
                            {item.recovery > 0 ? fmt(item.recovery) : "-"}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold border border-gray-300">
                            {fmt(item.profit)}
                          </td>
                        </tr>
                      );
                    })}

                    {grandTotals && currentPage === totalPages && (
                      <tr className="bg-gray-100 border-t border-gray-300 font-bold">
                        <td className="px-4 py-3 text-right border border-gray-300">
                          Grand Totals:
                        </td>
                        <td className="px-4 py-3 text-right border border-gray-300">
                          {fmt(grandTotals.purchase_amount)}
                        </td>
                        <td className="px-4 py-3 text-right border border-gray-300">
                          {fmt(grandTotals.sale_amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-blue-700 border border-gray-300">
                          {fmt(grandTotals.recovery)}
                        </td>
                        <td className="px-4 py-3 text-right border border-gray-300">
                          {fmt(grandTotals.profit)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
