"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
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

export default function SaleDetailReport() {
  const [isOpen, setIsOpen] = useState(false);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  const itemsPerPage = 80;

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

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/shop/reports/sale-detail?shop_acc_id=${selectedShop}&start_dat=${startDate}&end_dat=${endDate}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await res.json();
      if (data.response_status === "success") {
        setReportData(data.response_result || []);
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

  // Compute Grand Totals
  const grandTotalQty = reportData.reduce(
    (s, d) => s + (d.dateTotals?.qty || 0),
    0
  );
  const grandTotalAmount = reportData.reduce(
    (s, d) => s + (d.dateTotals?.amount || 0),
    0
  );
  const grandTotalReceived = reportData.reduce(
    (s, d) => s + (d.dateTotals?.received || 0),
    0
  );

  const flatItems = useMemo(() => {
    if (!reportData || reportData.length === 0) return [];
    const items = [];

    reportData.forEach((dateGroup, di) => {
      // 1. Date Header + Stock Summary
      items.push({
        type: "DATE_HEADER",
        dateStr: dateGroup.dateStr,
        stockSummary: dateGroup.stockSummary,
      });

      // 2. Sales
      if (dateGroup.sales && dateGroup.sales.length > 0) {
        dateGroup.sales.forEach((sale, si) => {
          items.push({
            type: "SALE_ROW",
            ...sale,
            rowIndex: si + 1,
          });
        });

        // 3. Date Totals
        items.push({
          type: "DATE_SUBTOTAL",
          dateStr: dateGroup.dateStr,
          ...dateGroup.dateTotals,
        });
      }

      // 3.5 Financial Summary
      items.push({
        type: "DATE_FINANCIAL_SUMMARY",
        dateStr: dateGroup.dateStr,
        stockSummary: dateGroup.stockSummary,
        financialSummary: dateGroup.financialSummary,
        dateTotals: dateGroup.dateTotals,
      });

      if (di < reportData.length - 1) {
        items.push({ type: "SPACER" });
      }
    });

    // 4. Grand Totals
    items.push({
      type: "GRAND_TOTAL",
      grandTotalQty,
      grandTotalAmount,
      grandTotalReceived,
    });

    return items.map((item, index) => ({ ...item, flatIndex: index }));
  }, [reportData, grandTotalQty, grandTotalAmount, grandTotalReceived]);

  const totalPages = Math.ceil(flatItems.length / itemsPerPage) || 1;
  const currentItems = flatItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToMatch = (flatIndex) => {
    const targetPage = Math.floor(flatIndex / itemsPerPage) + 1;
    setCurrentPage(targetPage);

    setTimeout(() => {
      const el = document.getElementById(`item-${flatIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleFind = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const results = [];
    flatItems.forEach((item) => {
      if (item.type === "SALE_ROW") {
        const custMatch = item.customer_name?.toLowerCase().includes(query);
        if (custMatch) {
          results.push(item.flatIndex);
        }
      } else if (
        item.type === "DATE_HEADER" &&
        item.dateStr?.toLowerCase().includes(query)
      ) {
        results.push(item.flatIndex);
      }
    });

    setSearchResults(results);
    if (results.length > 0) {
      setCurrentSearchIndex(0);
      goToMatch(results[0]);
    } else {
      toast.info("No matches found");
    }
  };

  const handleFindNext = () => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    goToMatch(searchResults[nextIndex]);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    document.getElementById("report-scroll-area")?.scrollTo(0, 0);
  };

  const handleExport = () => {
    if (!reportData.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Sr.No.",
      "Customer",
      "Qty",
      "Rate",
      "Amount",
      "Received",
      "", // padding
      "Stock Type",
      "Stock Value",
    ];

    const rows = [];
    reportData.forEach((dateGroup) => {
      const s = dateGroup.stockSummary;

      // Stock Summary Header
      rows.push([
        `Date: ${dateGroup.dateStr}`,
        "",
        "",
        "",
        "",
        "",
        "",
        "Opening Stock",
        s.openingStock,
      ]);
      rows.push(["", "", "", "", "", "", "", "Purchase", s.purchaseStock]);
      rows.push(["", "", "", "", "", "", "", "Total Stock", s.totalStock]);
      rows.push([
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "Closing Stock",
        s.closingStock !== null ? s.closingStock : "Not Set",
      ]);
      rows.push(["", "", "", "", "", "", "", "Sold", s.saledStock]);

      // Sales Data
      if (dateGroup.sales && dateGroup.sales.length > 0) {
        rows.push(["Sr.No.", "Customer", "Qty", "Rate", "Amount", "Received"]);
        dateGroup.sales.forEach((item, index) => {
          rows.push([
            index + 1,
            item.customer_name,
            item.qty,
            Number(item.rate).toFixed(2),
            Number(item.amount).toFixed(2),
            Number(item.received).toFixed(2),
          ]);
        });

        // Date Total
        const t = dateGroup.dateTotals;
        rows.push([
          "",
          `Date Total (${dateGroup.dateStr})`,
          t.qty,
          "",
          t.amount.toFixed(2),
          t.received.toFixed(2),
        ]);

        // Financial Summary
        const f = dateGroup.financialSummary;
        const rate = f.localSaleRate;
        const totalStockAmt = s.totalStock * rate;
        const saleStockAmt = s.saledStock * rate;
        const closingStockAmt = s.closingStock !== null ? s.closingStock * rate : "N/A";
        const netSale = f.localSaleNetReceived;
        const dueSale = t.amount;
        const recovery = t.received;
        const saleAmount = (netSale + dueSale) - recovery;
        const profit = saleAmount - saleStockAmt;

        rows.push([]);
        rows.push(["", "Financial Summary", "Total Stock Amt", totalStockAmt.toFixed(2)]);
        rows.push(["", "", "Sale Stock Amt", saleStockAmt.toFixed(2)]);
        rows.push(["", "", "Closing Stock Amt", closingStockAmt !== "N/A" ? closingStockAmt.toFixed(2) : "N/A"]);
        rows.push(["", "", "Net Sale", netSale.toFixed(2)]);
        rows.push(["", "", "Due Sale", dueSale.toFixed(2)]);
        rows.push(["", "", "Recovery", recovery.toFixed(2)]);
        rows.push(["", "", "Sale Amount", saleAmount.toFixed(2)]);
        rows.push(["", "", "Profit", profit.toFixed(2)]);
      }

      rows.push([]); // Spacer
    });

    // Grand Total
    rows.push([
      "",
      "Grand Total:",
      grandTotalQty,
      "",
      grandTotalAmount.toFixed(2),
      grandTotalReceived.toFixed(2),
    ]);

    const shopName =
      shops.find((s) => s.acc_id.toString() === selectedShop)?.account_nam ||
      "Shop";

    exportToCSV(
      `Shop_Sale_Report_${shopName}_${startDate}_to_${endDate}.csv`,
      headers,
      rows
    );
  };

  const fmt = (n, decimals = 2) =>
    Number(n).toLocaleString(undefined, { minimumFractionDigits: decimals });

  return (
    <div>
      {/* Trigger Card */}
      <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative p-6">
          <h3 className="text-lg mb-5 font-semibold text-gray-900">
            SHOP SALE DETAIL REPORT
          </h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Shop Account
              </label>
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
              >
                {shops.map((shop) => (
                  <option key={shop.acc_id} value={shop.acc_id}>
                    {shop.account_nam}
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
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
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
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
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
              disabled={isLoading || !selectedShop}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              View Report
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[95vh] overflow-hidden flex flex-col">
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

                {/* Find */}
                <div className="flex items-center gap-1 bg-white border rounded-md p-1 shadow-sm">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleFind()}
                      placeholder="Find customer..."
                      className="h-8 w-40 pl-7 text-xs border-none shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleFind}
                  >
                    Find
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleFindNext}
                    disabled={searchResults.length === 0}
                  >
                    Next
                  </Button>
                  {searchResults.length > 0 && (
                    <span className="text-xs text-gray-500 px-2 font-medium whitespace-nowrap">
                      {currentSearchIndex + 1} / {searchResults.length}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700 text-white h-9"
                  onClick={handleExport}
                >
                  <FileDown className="mr-2 h-4 w-4" /> Export CSV
                </Button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors ml-2"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div
              className="flex-1 overflow-auto p-4 bg-white"
              id="report-scroll-area"
            >
              <div className="mb-4 text-center">
                <h1 className="text-3xl font-bold text-gray-900 ">
                  {shops.find((s) => s.acc_id.toString() === selectedShop)
                    ?.account_nam || "Shop"}
                </h1>
                <h2 className="text-xl font-bold text-gray-900 uppercase mt-1">
                  Sale Detail Report
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {new Date(startDate)
                    .toLocaleDateString("en-GB")
                    .replace(/\//g, "-")}{" "}
                  –{" "}
                  {new Date(endDate)
                    .toLocaleDateString("en-GB")
                    .replace(/\//g, "-")}
                </p>
              </div>

              {reportData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500 border border-gray-300 rounded">
                  No records found for this period
                </div>
              ) : (
                <table className="w-full border-collapse text-sm border border-gray-400">
                  <thead className="bg-gray-100 sticky top-0 z-10 border-b-2 border-gray-400">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold text-gray-800 border-r border-gray-300 w-16">
                        Sr
                      </th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-800 border-r border-gray-300">
                        Customer Name
                      </th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-800 border-r border-gray-300 w-24">
                        Qty
                      </th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-800 border-r border-gray-300 w-24">
                        Rate
                      </th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-800 border-r border-gray-300 w-32">
                        Amount
                      </th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-800 w-32">
                        Received
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentItems.map((item) => {
                      const isMatch =
                        searchResults[currentSearchIndex] === item.flatIndex;
                      const matchClass = isMatch ? "bg-yellow-200" : "";

                      if (item.type === "DATE_HEADER") {
                        const s = item.stockSummary;
                        const dStr = new Date(item.dateStr)
                          .toLocaleDateString("en-GB")
                          .replace(/\//g, "-");
                        return (
                          <tr
                            key={`item-${item.flatIndex}`}
                            id={`item-${item.flatIndex}`}
                          >
                            <td
                              colSpan={6}
                              className={`p-0 border border-gray-400 ${matchClass}`}
                            >
                              <div className="flex flex-col bg-slate-100">
                                <div className="px-3 py-2 font-bold text-lg border-b border-gray-300 ">
                                  Date: {dStr}
                                </div>
                                <div className="flex flex-wrap gap-4 px-3 py-2 text-lg font-medium bg-slate-50">
                                  <div className="flex items-center gap-1">
                                    <span className="uppercase text-[10px] tracking-wider ">
                                      Opening Stock
                                    </span>
                                    <span className=" font-bold">
                                      {fmt(s.openingStock, 0)}
                                    </span>
                                  </div>
                                  <span className="text-slate-300">|</span>
                                  <div className="flex items-center gap-1">
                                    <span className="uppercase text-[10px] tracking-wider ">
                                      Purchase Stock
                                    </span>
                                    <span className="font-bold">
                                      {fmt(s.purchaseStock, 0)}
                                    </span>
                                  </div>
                                  <span className="text-slate-300">|</span>
                                  <div className="flex items-center gap-1">
                                    <span className="uppercase text-[10px] tracking-wider ">
                                      Total Stock
                                    </span>
                                    <span className="font-bold">
                                      {fmt(s.totalStock, 0)}
                                    </span>
                                  </div>
                                  <span className="text-slate-300">|</span>
                                  <div className="flex items-center gap-1">
                                    <span className="uppercase text-[10px] tracking-wider ">
                                      Closing Stock
                                    </span>
                                    <span className="font-bold">
                                      {s.closingStock !== null
                                        ? fmt(s.closingStock, 0)
                                        : "Not Set"}
                                    </span>
                                  </div>
                                  <span className="text-slate-300">|</span>
                                  <div className="flex items-center gap-1">
                                    <span className="uppercase text-[10px] tracking-wider ">
                                      Sale Stock
                                    </span>
                                    <span className="font-bold">
                                      {fmt(s.saledStock, 0)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      if (item.type === "SALE_ROW") {
                        return (
                          <tr
                            key={`item-${item.flatIndex}`}
                            id={`item-${item.flatIndex}`}
                            className={`border-b border-gray-200 transition-colors ${isMatch ? "bg-yellow-200" : "hover:bg-gray-50"
                              }`}
                          >
                            <td className="px-2 py-2 border-r border-gray-200 text-center">
                              {item.rowIndex}
                            </td>
                            <td className="px-2 py-2 border-r border-gray-200">
                              {item.customer_name}
                            </td>
                            <td className="px-2 py-2 text-right border-r border-gray-200">
                              {fmt(item.qty, 0)}
                            </td>
                            <td className="px-2 py-2 text-right border-r border-gray-200">
                              {fmt(item.rate)}
                            </td>
                            <td className="px-2 py-2 text-right border-r border-gray-200">
                              {fmt(item.amount)}
                            </td>
                            <td className="px-2 py-2 text-right ">
                              {fmt(item.received)}
                            </td>
                          </tr>
                        );
                      }

                      if (item.type === "DATE_SUBTOTAL") {
                        return (
                          <tr
                            key={`item-${item.flatIndex}`}
                            id={`item-${item.flatIndex}`}
                            className="bg-gray-50 font-semibold border-b-2 border-gray-400"
                          >
                            <td
                              colSpan={2}
                              className="px-2 py-2 text-right text-gray-700 border-r border-gray-300"
                            >
                              Total :
                            </td>
                            <td className="px-2 py-2 text-right text-gray-900 border-r border-gray-300">
                              {fmt(item.qty, 0)}
                            </td>
                            <td className="px-2 py-2 border-r border-gray-300" />
                            <td className="px-2 py-2 text-right text-gray-900 border-r border-gray-300">
                              {fmt(item.amount)}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {fmt(item.received)}
                            </td>
                          </tr>
                        );
                      }

                      if (item.type === "DATE_FINANCIAL_SUMMARY") {
                        const s = item.stockSummary;
                        const f = item.financialSummary;
                        const t = item.dateTotals;

                        const rate = f.localSaleRate;
                        const totalStockAmt = s.totalStock * rate;
                        const saleStockAmt = s.saledStock * rate;
                        const closingStockAmt = s.closingStock !== null ? s.closingStock * rate : "N/A";

                        const netSale = f.localSaleNetReceived;
                        const dueSale = t.amount;
                        const recovery = t.received;
                        const saleAmount = (netSale + dueSale) - recovery;
                        const profit = saleAmount - saleStockAmt;

                        return (
                          <tr
                            key={`item-${item.flatIndex}`}
                            id={`item-${item.flatIndex}`}
                          >
                            <td
                              colSpan={6}
                              className="p-0 border-b-2 border-gray-400"
                            >
                              <div className="flex flex-col bg-blue-50">
                                <div className="flex flex-wrap gap-4 px-3 py-2 text-lg font-medium">
                                  <div className="flex items-center gap-1">
                                    <span className="uppercase text-[10px] tracking-wider">
                                      Total Stock Amt:
                                    </span>
                                    <span className="font-bold">
                                      {fmt(totalStockAmt)}
                                    </span>
                                  </div>
                                  <span className="text-slate-300">|</span>
                                  <div className="flex items-center gap-1">
                                    <span className="uppercase text-[10px] tracking-wider">
                                      Sale Stock Amt:
                                    </span>
                                    <span className="font-bold">
                                      {fmt(saleStockAmt)}
                                    </span>
                                  </div>
                                  <span className="text-slate-300">|</span>
                                  <div className="flex items-center gap-1">
                                    <span className="uppercase text-[10px] tracking-wider">
                                      Closing Stock Amt:
                                    </span>
                                    <span className=" font-bold">
                                      {closingStockAmt === "N/A" ? "N/A" : fmt(closingStockAmt)}
                                    </span>
                                  </div>
                                  <span className="text-slate-300">|</span>
                                  <div className="flex items-center gap-1">
                                    <span className="uppercase text-[10px] tracking-wider">
                                      Net Sale:
                                    </span>
                                    <span className="font-bold">
                                      {fmt(netSale)}
                                    </span>
                                  </div>
                                  <span className="text-slate-300">|</span>
                                  <div className="flex items-center gap-1">
                                    <span className="uppercase text-[10px] tracking-wider">
                                      Due Sale:
                                    </span>
                                    <span className="font-bold">
                                      {fmt(dueSale)}
                                    </span>
                                  </div>
                                  <span className="text-slate-300">|</span>
                                  <div className="flex items-center gap-1">
                                    <span className="uppercase text-[10px] tracking-wider">
                                      Recovery:
                                    </span>
                                    <span className=" font-bold">
                                      {fmt(recovery)}
                                    </span>
                                  </div>
                                  <span className="text-slate-300">|</span>
                                  <div className="flex items-center gap-1">
                                    <span className="uppercase text-[10px] tracking-wider">
                                      Sale Amount:
                                    </span>
                                    <span className="font-bold">
                                      {fmt(saleAmount)}
                                    </span>
                                  </div>
                                  <span className="text-slate-300">|</span>
                                  <div className="flex items-center gap-1">
                                    <span className="uppercase text-[10px] tracking-wider ">
                                      Profit:
                                    </span>
                                    <span className={`font-bold `}>
                                      {fmt(profit)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      if (item.type === "SPACER") {
                        return (
                          <tr
                            key={`item-${item.flatIndex}`}
                            id={`item-${item.flatIndex}`}
                          >
                            <td colSpan={6} className="h-6 bg-white border-0" />
                          </tr>
                        );
                      }

                      if (item.type === "GRAND_TOTAL") {
                        return (
                          <tr
                            key={`item-${item.flatIndex}`}
                            id={`item-${item.flatIndex}`}
                            className="bg-gray-800 text-white font-bold"
                          >
                            <td
                              colSpan={2}
                              className="px-2 py-3 text-right border-r border-gray-600"
                            >
                              Grand Total:
                            </td>
                            <td className="px-2 py-3 text-right border-r border-gray-600">
                              {fmt(item.grandTotalQty, 0)}
                            </td>
                            <td className="px-2 py-3 border-r border-gray-600" />
                            <td className="px-2 py-3 text-right border-r border-gray-600">
                              {fmt(item.grandTotalAmount)}
                            </td>
                            <td className="px-2 py-3 text-right">
                              {fmt(item.grandTotalReceived)}
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
