"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  FileDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/app/utils/exportToCsv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CustomerLedgerReport() {
  const [isOpen, setIsOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/shop/customers");
      const data = await res.json();
      if (data.response_status === "success") {
        const list = Array.isArray(data.response_result) ? data.response_result : [];
        setCustomers(list);
        if (list.length > 0) {
          setSelectedCustomer(list[0].customer_id.toString());
        }
      }
    } catch (e) {
      console.error("fetchCustomers:", e);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const fetchReport = async () => {
    if (!selectedCustomer || !startDate || !endDate) {
      toast.error("Please select a customer and date range");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/shop/reports/customer-ledger?customer_id=${selectedCustomer}&start_dat=${startDate}&end_dat=${endDate}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await res.json();
      if (data.response_status === "success") {
        setReportData(data.response_result || null);
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

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-GB").replace(/\//g, "-");
  };

  const flatItems = useMemo(() => {
    if (!reportData) return [];

    const items = [];

    // Opening balance row
    items.push({
      type: "OPENING_BALANCE",
      balance: reportData.openingBalance,
    });

    // Transactions
    if (reportData.transactions && reportData.transactions.length > 0) {
      reportData.transactions.forEach(t => {
        items.push({
          type: "TRANSACTION",
          ...t,
        });
      });
    }

    return items;
  }, [reportData]);

  const totalPages = Math.ceil(flatItems.length / itemsPerPage) || 1;
  const currentItems = flatItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    document.getElementById("ledger-scroll-area")?.scrollTo(0, 0);
  };

  const handleExport = () => {
    if (!reportData) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Date(Fs Rate)",
      "Qty",
      "Rate",
      "Amount (Debit)",
      "Received (Credit)",
      "Balance",
    ];

    const rows = [];

    const startStr = formatDate(startDate);
    rows.push([
      startStr,
      "",
      "Opening Balance",
      "",
      "",
      fmt(reportData.openingBalance),
    ]);

    if (reportData.transactions && reportData.transactions.length > 0) {
      reportData.transactions.forEach((t) => {
        const fsRateStr = t.fs_rate && t.fs_rate !== "-" ? ` (${t.fs_rate})` : "";
        rows.push([
          formatDate(t.sale_date) + fsRateStr,
          t.qty > 0 ? fmt(t.qty, 0) : "",
          t.rate > 0 ? fmt(t.rate) : "",
          t.amount > 0 ? fmt(t.amount) : "",
          t.received_amount > 0 ? fmt(t.received_amount) : "",
          fmt(t.balance),
        ]);
      });
    }

    const customerName =
      customers.find((c) => c.customer_id.toString() === selectedCustomer)?.customer_nam ||
      "Customer";

    exportToCSV(
      `Shop_Customer_Ledger_${customerName}_${startDate}_to_${endDate}.csv`,
      headers,
      rows
    );
  };

  return (
    <div>
      {/* Trigger Card */}
      <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative p-6">
          <h3 className="text-lg mb-5 font-semibold text-gray-900">
            SHOP CUSTOMER LEDGER
          </h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Customer
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                {customers.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.customer_nam}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
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
              disabled={isLoading || !selectedCustomer}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              View Ledger
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
              id="ledger-scroll-area"
              className="flex-1 overflow-auto p-4 bg-gray-100/50 relative"
            >
              {!reportData ? (
                <div className="flex justify-center items-center h-64 text-gray-500">
                  No data available.
                </div>
              ) : (
                <table className="w-full border-collapse bg-white text-sm shadow-sm rounded-lg overflow-hidden">
                  <thead className=" sticky top-0 z-10 shadow">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold border-r border-blue-500 w-32">
                        Date(Fs Rate)
                      </th>
                      <th className="px-3 py-2 text-right font-semibold border-r border-blue-500 w-24">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-right font-semibold border-r border-blue-500 w-24">
                        Rate
                      </th>
                      <th className="px-3 py-2 text-right font-semibold border-r border-blue-500 w-32">
                        Amount (Debit)
                      </th>
                      <th className="px-3 py-2 text-right font-semibold border-r border-blue-500 w-32">
                        Received (Credit)
                      </th>
                      <th className="px-3 py-2 text-right font-semibold w-32">
                        Balance
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentItems.map((item, idx) => {
                      if (item.type === "OPENING_BALANCE") {
                        return (
                          <tr key="opening_balance" className="bg-blue-50 border-b  font-semibold">
                            <td className="px-3 py-3 border-r border-gray-200 ">
                              {formatDate(startDate)}
                            </td>
                            <td colSpan={2} className="px-3 py-3 text-center  border-r border-gray-200">
                              Opening Balance
                            </td>
                            <td className="px-3 py-3 border-r border-gray-200" />
                            <td className="px-3 py-3 border-r border-gray-200" />
                            <td className="px-3 py-3 text-right ">
                              {fmt(item.balance)}
                            </td>
                          </tr>
                        );
                      }

                      if (item.type === "TRANSACTION") {
                        return (
                          <tr
                            key={`tx-${item.shop_sale_id}-${idx}`}
                            className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-3 py-2 border-r border-gray-200 text-left ">
                              {formatDate(item.sale_date)}
                              {item.fs_rate && item.fs_rate !== "-" && (
                                <span className="text-xs text-gray-500 ml-1">
                                  ({item.fs_rate})
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 border-r border-gray-200 text-right ">
                              {item.qty > 0 ? fmt(item.qty, 0) : "-"}
                            </td>
                            <td className="px-3 py-2 border-r border-gray-200 text-right ">
                              {item.rate > 0 ? fmt(item.rate) : "-"}
                            </td>
                            <td className="px-3 py-2 text-right border-r border-gray-200  font-medium">
                              {item.amount > 0 ? fmt(item.amount) : "-"}
                            </td>
                            <td className="px-3 py-2 text-right border-r border-gray-200  font-medium">
                              {item.received_amount > 0 ? fmt(item.received_amount) : "-"}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-gray-900">
                              {fmt(item.balance)}
                            </td>
                          </tr>
                        );
                      }

                      return null;
                    })}
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
