"use client";
import React, { useState, useMemo } from "react";
import {
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  FileDown,
  Printer
} from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/app/utils/exportToCsv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function WholeSaleReport() {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  const itemsPerPage = 80;

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/wholeSale/read/readReportDetail?start_dat=${startDate}&end_dat=${endDate}`,
      );

      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await res.json();
      setReportData(data.response_result || []);
      setIsOpen(true);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch report");
    } finally {
      setIsLoading(false);
    }
  };

  // Group sales by Date then by Former
  const groupedByDate = reportData.reduce((acc, item) => {
    const dateStr = new Date(item.sale_date).toLocaleDateString("en-GB").replace(/\//g, "-");

    if (!acc[dateStr]) {
      acc[dateStr] = {
        dateStr,
        formers: {},
      };
    }

    const formerKey =
      item.former_account_ref?.account_id ||
      item.former_account_ref?.account_nam ||
      "Unknown";
    const formerName = item.former_account_ref?.account_nam || "Unknown";

    if (!acc[dateStr].formers[formerKey]) {
      acc[dateStr].formers[formerKey] = {
        formerName,
        formerContact: item.former_account_ref?.account_contact || "",
        sales: [],
      };
    }

    acc[dateStr].formers[formerKey].sales.push(item);
    return acc;
  }, {});

  // Compute per-former and per-date totals
  const dates = Object.values(groupedByDate).map((dateGroup) => {
    const formers = Object.values(dateGroup.formers).map((group) => {
      const totalWeight = group.sales.reduce((s, i) => s + (Number(i.weight) || 0), 0);
      const totalFormerAmount = group.sales.reduce((s, i) => s + (Number(i.former_amount) || 0), 0);
      const totalPurchaserAmount = group.sales.reduce((s, i) => s + (Number(i.purcher_amount) || 0), 0);
      const totalProfit = group.sales.reduce((s, i) => s + (Number(i.profit) || 0), 0);
      return {
        ...group,
        totalWeight,
        totalFormerAmount,
        totalPurchaserAmount,
        totalProfit,
      };
    });

    const dateTotalWeight = formers.reduce((s, f) => s + f.totalWeight, 0);
    const dateTotalFormerAmount = formers.reduce((s, f) => s + f.totalFormerAmount, 0);
    const dateTotalPurchaserAmount = formers.reduce((s, f) => s + f.totalPurchaserAmount, 0);
    const dateTotalProfit = formers.reduce((s, f) => s + f.totalProfit, 0);

    return {
      dateStr: dateGroup.dateStr,
      formers,
      dateTotalWeight,
      dateTotalFormerAmount,
      dateTotalPurchaserAmount,
      dateTotalProfit,
    };
  });

  // Grand totals
  const grandTotalWeight = dates.reduce((s, d) => s + d.dateTotalWeight, 0);
  const grandTotalFormerAmount = dates.reduce((s, d) => s + d.dateTotalFormerAmount, 0);
  const grandTotalPurchaserAmount = dates.reduce((s, d) => s + d.dateTotalPurchaserAmount, 0);
  const grandTotalProfit = dates.reduce((s, d) => s + d.dateTotalProfit, 0);

  const flatItems = useMemo(() => {
    if (!dates || dates.length === 0) return [];
    const items = [];
    dates.forEach((dateGroup, di) => {
      items.push({ type: "DATE_HEADER", dateStr: dateGroup.dateStr });

      let srNo = 1;

      dateGroup.formers.forEach((group, gi) => {
        items.push({ type: "FORMER_HEADER", formerName: group.formerName });

        group.sales.forEach((item, si) => {
          items.push({ type: "SALE_ROW", ...item, rowIndex: srNo++, formerName: group.formerName });
        });

        items.push({
          type: "FORMER_SUBTOTAL",
          ...group,
        });
      });

      items.push({
        type: "DATE_SUBTOTAL",
        ...dateGroup,
      });

      if (di < dates.length - 1) {
        items.push({ type: "SPACER" });
      }
    });

    items.push({
      type: "GRAND_TOTAL",
      grandTotalWeight,
      grandTotalFormerAmount,
      grandTotalPurchaserAmount,
      grandTotalProfit,
    });

    return items.map((item, index) => ({ ...item, flatIndex: index }));
  }, [dates, grandTotalWeight, grandTotalFormerAmount, grandTotalPurchaserAmount, grandTotalProfit]);

  const totalPages = Math.ceil(flatItems.length / itemsPerPage) || 1;
  const currentItems = flatItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
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
        const vanMatch = item.van_number && item.van_number.toString().toLowerCase().includes(query);
        const purcherMatch = item.purcher_account_ref?.account_nam?.toLowerCase().includes(query);
        if (vanMatch || purcherMatch) {
          results.push(item.flatIndex);
        }
      } else if (item.type === "FORMER_HEADER" && item.formerName?.toLowerCase().includes(query)) {
        results.push(item.flatIndex);
      } else if (item.type === "DATE_HEADER" && item.dateStr?.toLowerCase().includes(query)) {
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
      "Former",
      "Sale ID",
      "Van Number",
      "Weight",
      "Former Rate",
      "Former Amount",
      "Purchaser Name",
      "Purchaser Rate",
      "Purchaser Amount",
      "Profit",
    ];

    const rows = [];
    dates.forEach((dateGroup) => {
      rows.push([`Date: ${dateGroup.dateStr}`, "", "", "", "", "", "", "", "", "", ""]);

      let srNo = 1;

      dateGroup.formers.forEach((group) => {
        group.sales.forEach((item, index) => {
          rows.push([
            srNo++,
            group.formerName,
            item.sale_id,
            item.van_number,
            item.weight,
            Number(item.former_rate).toFixed(2),
            Number(item.former_amount).toFixed(2),
            item.purcher_account_ref?.account_nam || "N/A",
            Number(item.purcher_rate || 0).toFixed(2),
            Number(item.purcher_amount).toFixed(2),
            Number(item.profit).toFixed(2),
          ]);
        });
        rows.push([
          "",
          `${group.formerName} - Total`,
          "",
          "",
          group.totalWeight,
          "",
          group.totalFormerAmount.toFixed(2),
          "",
          "",
          group.totalPurchaserAmount.toFixed(2),
          group.totalProfit.toFixed(2),
        ]);
      });
      rows.push([
        "",
        `Date Total (${dateGroup.dateStr})`,
        "",
        "",
        dateGroup.dateTotalWeight,
        "",
        dateGroup.dateTotalFormerAmount.toFixed(2),
        "",
        "",
        dateGroup.dateTotalPurchaserAmount.toFixed(2),
        dateGroup.dateTotalProfit.toFixed(2),
      ]);
    });

    exportToCSV(
      `Whole_Sale_Report_${startDate}_to_${endDate}.csv`,
      headers,
      rows,
    );
  };

  const handleDownloadPDF = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/wholeSale/read/downloadReportDetail?start_dat=${startDate}&end_dat=${endDate}`,
      );

      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Whole_Sale_Report_${startDate}_to_${endDate}.pdf`;
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

  const fmt = (n, decimals = 2) =>
    Number(n).toLocaleString(undefined, { minimumFractionDigits: decimals });

  return (
    <div>
      {/* Card to trigger report */}
      <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative p-6">

          <h3 className="text-lg mb-15 font-semibold text-gray-900">
            WHOLESALE DAILY REPORT
          </h3>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-1 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
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
                className="w-full px-1 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
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
            <div className="flex flex-col md:flex-row items-center justify-between p-2 border-b bg-gray-50 gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Pagination */}
                <div className="flex items-center gap-1 bg-white border rounded-md p-1 shadow-sm">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handlePageChange(1)} disabled={currentPage === 1} title="First Page">
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} title="Previous Page">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-2 text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} title="Next Page">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} title="Last Page">
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
                      onKeyDown={(e) => e.key === 'Enter' && handleFind()}
                      placeholder="Find..."
                      className="h-8 w-40 pl-7 text-xs border-none shadow-none focus-visible:ring-0"
                    />
                  </div>
                  <Button variant="secondary" size="sm" className="h-8 text-xs" onClick={handleFind}>
                    Find
                  </Button>
                  <Button variant="secondary" size="sm" className="h-8 text-xs" onClick={handleFindNext} disabled={searchResults.length === 0}>
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
                <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white h-9" onClick={handleExport}>
                  <FileDown className="mr-2 h-4 w-4" /> Export CSV
                </Button>
                <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white h-9" onClick={handleDownloadPDF} disabled={isLoading}>
                  <Printer className="mr-2 h-4 w-4" /> {isLoading ? "Loading..." : "Download PDF"}
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
            <div className="flex-1 overflow-auto p-4 bg-white" id="report-scroll-area">
              <div className="mb-2 text-center">
                <h1 className="text-3xl font-bold text-gray-900 ">
                  BHAGTANWALA POULTRY NETWORK
                </h1>
                <h1 className="text-xl font-bold text-gray-900 uppercase">
                  Whole Sale Report
                </h1>
                <p className="text-gray-600 text-sm">
                  {new Date(startDate).toLocaleDateString("en-GB").replace(/\//g, "-")} –{" "}
                  {new Date(endDate).toLocaleDateString("en-GB").replace(/\//g, "-")}
                </p>
              </div>

              {dates.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500 border border-gray-300 rounded">
                  No records found for this period
                </div>
              ) : (
                <table className="w-full border-collapse text-xs border border-gray-400">
                  {/* Column Headers */}
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-1 py-1 text-left font-semibold text-gray-800 border border-gray-400 w-15">
                        Sr.No.
                      </th>
                      <th className="px-1 py-1 text-left font-semibold text-gray-800 border border-gray-400 w-25">
                        Van #
                      </th>
                      <th className="px-2 py-1 text-right font-semibold text-gray-800 border border-gray-400">
                        Weight
                      </th>
                      <th className=" py-1 text-right font-semibold text-gray-800 border border-gray-400 w-18">
                        Former Rate
                      </th>
                      <th className="px-1 py-1 text-right font-semibold text-gray-800 border border-gray-400">
                        Former Amt
                      </th>
                      <th className="px-1 py-1 text-left font-semibold text-gray-800 border border-gray-400">
                        Purchaser
                      </th>
                      <th className="w-18 py-1 text-right font-semibold text-gray-800 border border-gray-400">
                        Purcher Rate
                      </th>
                      <th className="px-1 py-1 text-right font-semibold text-gray-800 border border-gray-400">
                        Purcher Amt
                      </th>
                      <th className="px-1 py-1 text-right font-semibold text-gray-800 border border-gray-400">
                        Profit
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentItems.map((item) => {
                      const isMatch = searchResults[currentSearchIndex] === item.flatIndex;
                      const matchClass = isMatch ? "bg-yellow-200" : "";

                      if (item.type === "DATE_HEADER") {
                        return (
                          <tr key={`item-${item.flatIndex}`} id={`item-${item.flatIndex}`}>
                            <td
                              colSpan={9}
                              className={`px-1 py-1 font-bold text-center border border-black text-lg bg-gray-200 ${matchClass}`}
                            >
                              Date: {item.dateStr}
                            </td>
                          </tr>
                        );
                      }

                      if (item.type === "FORMER_HEADER") {
                        return (
                          <tr key={`item-${item.flatIndex}`} id={`item-${item.flatIndex}`}>
                            <td
                              colSpan={9}
                              className={`px-1 py-1 font-bold bg-gray-50 border border-black text-lg ${matchClass}`}
                            >
                              {item.formerName}
                            </td>
                          </tr>
                        );
                      }

                      if (item.type === "SALE_ROW") {
                        return (
                          <tr
                            key={`item-${item.flatIndex}`}
                            id={`item-${item.flatIndex}`}
                            className={`transition-colors ${isMatch ? "bg-yellow-200" : "hover:bg-gray-100"} text-sm`}
                          >
                            <td className="px-1 py-1 border border-black text-center">
                              {item.rowIndex}
                            </td>
                            <td className="px-1 py-1 border border-black">
                              {item.van_number}
                            </td>
                            <td className="px-1 py-1 text-right font-mono border border-black">
                              {fmt(item.weight, 0)}
                            </td>
                            <td className="px-1 py-1 text-right font-mono border border-black">
                              {fmt(item.former_rate)}
                            </td>
                            <td className="px-1 py-1 text-right font-mono border border-black">
                              {fmt(item.former_amount)}
                            </td>
                            <td className="px-1 py-1 border border-black">
                              <div className="text-gray-900">
                                {item.purcher_account_ref?.account_nam || "—"}
                              </div>
                            </td>
                            <td className="px-1 py-1 text-right font-mono border border-black">
                              {fmt(item.purcher_rate || 0)}
                            </td>
                            <td className="px-1 py-1 text-right font-mono border border-black">
                              {fmt(item.purcher_amount)}
                            </td>
                            <td className="px-1 py-1 text-right font-mono font-semibold border border-black">
                              {fmt(item.profit)}
                            </td>
                          </tr>
                        );
                      }

                      if (item.type === "FORMER_SUBTOTAL") {
                        return (
                          <tr key={`item-${item.flatIndex}`} id={`item-${item.flatIndex}`} className="bg-gray-100 font-semibold">
                            <td
                              colSpan={2}
                              className="px-1 py-1 text-right text-gray-700 border border-black"
                            >
                              Total:
                            </td>
                            <td className="px-1 py-1 text-right font-mono text-gray-800 border border-black">
                              {fmt(item.totalWeight, 0)}
                            </td>
                            <td className="px-1 py-1 border border-black" />
                            <td className="px-1 py-1 text-right font-mono text-gray-800 border border-black">
                              {fmt(item.totalFormerAmount)}
                            </td>
                            <td className="px-1 py-1 border border-black" />
                            <td className="px-1 py-1 border border-black" />
                            <td className="px-1 py-1 text-right font-mono text-gray-800 border border-black">
                              {fmt(item.totalPurchaserAmount)}
                            </td>
                            <td className="px-1 py-1 text-right font-mono font-bold text-gray-900 border border-black">
                              {fmt(item.totalProfit)}
                            </td>
                          </tr>
                        );
                      }

                      if (item.type === "DATE_SUBTOTAL") {
                        return (
                          <tr key={`item-${item.flatIndex}`} id={`item-${item.flatIndex}`} className="font-bold">
                            <td
                              colSpan={2}
                              className="px-1 py-1 text-right border border-black"
                            >
                              Date Total ({item.dateStr}):
                            </td>
                            <td className="px-1 py-1 text-right font-mono border border-black">
                              {fmt(item.dateTotalWeight, 0)}
                            </td>
                            <td className="px-1 py-1 border border-black" />
                            <td className="px-1 py-1 text-right font-mono border border-black">
                              {fmt(item.dateTotalFormerAmount)}
                            </td>
                            <td className="px-1 py-1 border border-black" />
                            <td className="px-1 py-1 border border-black" />
                            <td className="px-1 py-1 text-right font-mono border border-black">
                              {fmt(item.dateTotalPurchaserAmount)}
                            </td>
                            <td className="px-1 py-1 text-right font-mono border border-black">
                              {fmt(item.dateTotalProfit)}
                            </td>
                          </tr>
                        );
                      }

                      if (item.type === "SPACER") {
                        return (
                          <tr key={`item-${item.flatIndex}`} id={`item-${item.flatIndex}`}>
                            <td
                              colSpan={9}
                              className="py-2 border-0 bg-white"
                            />
                          </tr>
                        );
                      }

                      if (item.type === "GRAND_TOTAL") {
                        return (
                          <tr key={`item-${item.flatIndex}`} id={`item-${item.flatIndex}`} className="bg-gray-800 text-white font-bold">
                            <td
                              colSpan={2}
                              className="px-1 py-1 text-right border border-black"
                            >
                              Grand Total:
                            </td>
                            <td className="px-1 py-1 text-right font-mono border border-black">
                              {fmt(item.grandTotalWeight, 0)}
                            </td>
                            <td className="px-1 py-1 border border-black" />
                            <td className="px-1 py-1 text-right font-mono border border-black">
                              {fmt(item.grandTotalFormerAmount)}
                            </td>
                            <td className="px-1 py-1 border border-black" />
                            <td className="px-1 py-1 border border-black" />
                            <td className="px-1 py-1 text-right font-mono border border-black">
                              {fmt(item.grandTotalPurchaserAmount)}
                            </td>
                            <td className="px-1 py-1 text-right font-mono border border-black">
                              {fmt(item.grandTotalProfit)}
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
