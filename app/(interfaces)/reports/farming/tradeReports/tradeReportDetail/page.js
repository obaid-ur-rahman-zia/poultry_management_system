"use client";
import React, { useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  FileText,
} from "lucide-react";
import { toast } from "react-toastify";
import { exportToCSV } from "@/app/utils/exportToCsv";

export default function TradingReportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [tradingData, setTradingData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const tradesPerPage = 10;

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date must be before end date");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/trading/read/readReportDetail?start_dat=${startDate}&end_dat=${endDate}`
      );
      const data = await res.json();
      console.log("Trading Data", data);
      setTradingData(data.response_result);
      setIsOpen(true);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch report");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate subtotal (before tax and discount)
  const calculateSubtotal = (quantity, price) => {
    return quantity * price;
  };

  // Pagination logic
  const indexOfLastTrade = currentPage * tradesPerPage;
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
  const currentTrades = tradingData.slice(indexOfFirstTrade, indexOfLastTrade);
  const totalPages = Math.ceil(tradingData.length / tradesPerPage);

  // Calculate grand totals
  const grandTotals = tradingData.reduce(
    (acc, trade) => ({
      totalBuy: acc.totalBuy + trade.buy_total,
      totalSale: acc.totalSale + trade.sale_total,
      totalProfit: acc.totalProfit + (trade.sale_total - trade.buy_total),
    }),
    { totalBuy: 0, totalSale: 0, totalProfit: 0 }
  );

  const handleExport = () => {
    if (!tradingData.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Trade ID",
      "Date",
      "Product",
      "Type",
      "Account",
      "Quantity",
      "Price",
      "Discount",
      "Tax",
      "Total",
    ];

    const rows = tradingData.flatMap((trade) => {
      const date = new Date(trade.trading_date).toLocaleDateString();

      return [
        [
          trade.trading_id,
          date,
          trade.product.product_title,
          "BUY",
          trade.buy_from_account_ref.account_nam,
          trade.buy_quantity,
          trade.buy_price,
          trade.buy_discount_value,
          trade.buy_tax_value,
          trade.buy_total,
        ],
        [
          trade.trading_id,
          date,
          trade.product.product_title,
          "SALE",
          trade.sale_to_account_ref.account_nam,
          trade.sale_quantity,
          trade.sale_price,
          trade.sale_discount_value,
          trade.sale_tax_value,
          trade.sale_total,
        ],
        ["Total Profit/Loss", `${trade.sale_total - trade.buy_total}`],
      ];
    });

    exportToCSV(`Trading_Report_${startDate}_to_${endDate}.csv`, headers, rows);
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
            Trade Detail Report
          </h3>

          {/* Date Range */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex flex-row justify-between w-full gap-2">
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              disabled={isLoading}
              className="mt-6 px-6 py-2 border-2 border-solid border-[#e7ebee] rounded-lg font-medium hover:shadow-lg"
            >
              Clear
            </button>
            <button
              onClick={fetchReport}
              disabled={isLoading}
              className="mt-6 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "View Report"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[100vh] overflow-hidden flex flex-col">
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
                  Trading Report
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
                </p>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        T. ID
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        DO#
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        Product
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        Type
                      </th>
                      <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-300">
                        Account
                      </th>
                      <th className="px-3 py-2 text-right font-bold text-gray-700 border border-gray-300">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-right font-bold text-gray-700 border border-gray-300">
                        Price
                      </th>
                      <th className="px-3 py-2 text-right font-bold text-gray-700 border border-gray-300">
                        Disc
                      </th>
                      <th className="px-3 py-2 text-right font-bold text-gray-700 border border-gray-300">
                        Tax
                      </th>
                      <th className="px-3 py-2 text-right font-bold text-gray-700 border border-gray-300">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTrades.map((trade, index) => {
                      const profit = trade.sale_total - trade.buy_total;

                      return (
                        <React.Fragment key={trade.trading_id}>
                          {/* Buy Row */}
                          <tr className="border-b border-gray-200 hover:bg-blue-50">
                            <td className="px-3 py-2 text-center font-semibold border border-gray-300">
                              {trade.trading_id}
                            </td>
                            <td className="px-3 py-2 border border-gray-300">
                              {new Date(
                                trade.trading_date
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2 border border-gray-300">
                              {trade.do_number || "-"}
                            </td>
                            <td className="px-3 py-2 font-medium border border-gray-300">
                              {trade.product.product_title}
                            </td>
                            <td className="px-3 py-2 border border-gray-300">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                BUY
                              </span>
                            </td>
                            <td className="px-3 py-2 border border-gray-300">
                              <div className="font-medium">
                                {trade.buy_from_account_ref.account_nam}
                              </div>
                              <div className="text-xs text-gray-600">
                                (
                                {trade.buy_from_account_ref.account_contact ||
                                  "N/A"}
                                )
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right border border-gray-300">
                              {trade.buy_quantity}
                            </td>
                            <td className="px-3 py-2 text-right border border-gray-300">
                              {trade.buy_price.toFixed(2)}
                            </td>

                            <td className="px-3 py-2 text-right border border-gray-300">
                              {trade.buy_discount_type === "percentage"
                                ? `${trade.buy_discount_value}%`
                                : trade.buy_discount_value.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right border border-gray-300">
                              {trade.buy_tax_type === "percentage"
                                ? `${trade.buy_tax_value}%`
                                : trade.buy_tax_value.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold border border-gray-300">
                              {trade.buy_total.toFixed(2)}
                            </td>
                          </tr>

                          {/* Sale Row */}
                          <tr className="border-b border-gray-200 hover:bg-green-50">
                            <td className="px-3 py-2 text-center text-gray-400 border border-gray-300">
                              -
                            </td>
                            <td className="px-3 py-2 text-gray-400 border border-gray-300">-</td>
                            <td className="px-3 py-2 text-gray-400 border border-gray-300">-</td>
                            <td className="px-3 py-2 text-gray-400 border border-gray-300">-</td>
                            <td className="px-3 py-2 border border-gray-300">
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                SALE
                              </span>
                            </td>
                            <td className="px-3 py-2 border border-gray-300">
                              <div className="font-medium">
                                {trade.sale_to_account_ref.account_nam}
                              </div>
                              <div className="text-xs text-gray-600">
                                (
                                {trade.sale_to_account_ref.account_contact ||
                                  "N/A"}
                                )
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right border border-gray-300">
                              {trade.sale_quantity}
                            </td>
                            <td className="px-3 py-2 text-right border border-gray-300">
                              {trade.sale_price.toFixed(2)}
                            </td>

                            <td className="px-3 py-2 text-right border border-gray-300">
                              {trade.sale_discount_type === "percentage"
                                ? `${trade.sale_discount_value}%`
                                : trade.sale_discount_value.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right border border-gray-300">
                              {trade.sale_tax_type === "percentage"
                                ? `${trade.sale_tax_value}%`
                                : trade.sale_tax_value.toFixed(2)}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold border border-gray-300">
                              {trade.sale_total.toFixed(2)}
                            </td>
                          </tr>

                          {/* Profit Row */}
                          <tr className="bg-gray-50 border-b-2 border-gray-300">
                            <td
                              colSpan="10"
                              className="px-3 py-2 text-right font-semibold border border-gray-300"
                            >
                              Profit/Loss for Trade #{trade.trading_id}:
                            </td>
                            <td className="px-3 py-2 text-right font-bold border border-gray-300">
                              <span
                                className={
                                  profit >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {profit >= 0 ? "+" : ""}
                                {profit.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}

                    {/* Grand Total Rows */}
                    {tradingData.length > 0 && (
                      <>
                        <tr className="bg-cyan-50 font-bold">
                          <td colSpan="6" className="px-3 py-3 text-right border border-gray-300">
                            Grand Total Buy Amount:
                          </td>
                          <td className="px-3 py-3 text-right text-blue-700 border border-gray-300">
                            {grandTotals.totalBuy.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-right border border-gray-300">
                            Grand Total Sale Amount:
                          </td>
                          <td className="px-3 py-3 text-right text-green-700 border border-gray-300">
                            {grandTotals.totalSale.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-right text-lg border border-gray-300">
                            Net Profit:
                          </td>
                          <td className="px-3 py-3 text-right text-lg border border-gray-300">
                            <span
                              className={
                                grandTotals.totalProfit >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {grandTotals.totalProfit >= 0 ? "+" : ""}
                              {grandTotals.totalProfit.toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>

                {tradingData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No trading data found for the selected period
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-6 border-t">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstTrade + 1} to{" "}
                  {Math.min(indexOfLastTrade, tradingData.length)} of{" "}
                  {tradingData.length} trades
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
                  <div className="px-4 py-1 bg-cyan-500 text-white rounded-lg font-medium">
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
