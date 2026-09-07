"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/app/utils/exportToCsv";
import { Button } from "@/components/ui/button";

export default function TrialBalanceReport() {
  const [isOpen, setIsOpen] = useState(false);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState("");
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
    if (!selectedShop || !endDate) {
      toast.error("Please select a shop and end date");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/shop/reports/trial-balance?shop_acc_id=${selectedShop}&end_dat=${endDate}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await res.json();
      if (data.response_status === "success") {
        setReportData(data.response_result || []);
        setIsOpen(true);
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

  const handleExport = () => {
    if (!reportData.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Sr.No.",
      "Customer Name",
      "Total Qty",
      "Total Amount",
      "Total Received",
      "Balance",
    ];

    const rows = reportData.map((item, idx) => [
      idx + 1,
      item.customer_nam || "N/A",
      Number(item.total_qty || 0).toFixed(2),
      Number(item.total_amount || 0).toFixed(2),
      Number(item.total_received || 0).toFixed(2),
      Number(item.balance || 0).toFixed(2),
    ]);

    // Calculate grand totals
    const grandQty = reportData.reduce((sum, item) => sum + Number(item.total_qty || 0), 0);
    const grandAmount = reportData.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
    const grandReceived = reportData.reduce((sum, item) => sum + Number(item.total_received || 0), 0);
    const grandBalance = reportData.reduce((sum, item) => sum + Number(item.balance || 0), 0);

    rows.push([
      "",
      "Grand Total",
      grandQty.toFixed(2),
      grandAmount.toFixed(2),
      grandReceived.toFixed(2),
      grandBalance.toFixed(2),
    ]);

    const shopName = shops.find((s) => s.acc_id.toString() === selectedShop)?.account_nam || "Shop";

    exportToCSV(`Trial_Balance_${shopName}_upto_${endDate}.csv`, headers, rows);
  };

  const fmt = (n, decimals = 2) =>
    Number(n).toLocaleString(undefined, { minimumFractionDigits: decimals });

  // Compute Grand Totals for UI
  const grandQty = reportData.reduce((sum, item) => sum + Number(item.total_qty || 0), 0);
  const grandAmount = reportData.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
  const grandReceived = reportData.reduce((sum, item) => sum + Number(item.total_received || 0), 0);
  const grandBalance = reportData.reduce((sum, item) => sum + Number(item.balance || 0), 0);

  return (
    <div>
      {/* Trigger Card */}
      <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative p-6">
          <h3 className="text-lg mb-5 font-semibold text-gray-900">
            TRIAL BALANCE SHEET
          </h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Shop Account
              </label>
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                {shops.map((shop) => (
                  <option key={shop.acc_id} value={shop.acc_id}>
                    {shop.account_nam}
                  </option>
                ))}
              </select>
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

          <div className="flex gap-2">
            <button
              onClick={() => {
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              View Report
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">
                Trial Balance Sheet
              </h2>
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
            <div className="flex-1 overflow-auto p-4 bg-white">
              <div className="mb-4 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  {shops.find((s) => s.acc_id.toString() === selectedShop)?.account_nam || "Shop"}
                </h1>
                <h2 className="text-xl font-bold text-gray-900 uppercase">
                  Trial Balance
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Up to: {new Date(endDate).toLocaleDateString("en-GB").replace(/\//g, "-")}
                </p>
              </div>

              {reportData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-500 border border-gray-300 rounded">
                  No records found for this period
                </div>
              ) : (
                <div className="border border-gray-400">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-gray-100 sticky top-0 z-10 border-b-2 border-gray-400">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-800 border-r border-gray-300 w-16">
                          Sr
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-800 border-r border-gray-300">
                          Customer Name
                        </th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-800 border-r border-gray-300 w-32">
                          Total Qty
                        </th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-800 border-r border-gray-300 w-32">
                          Total Amount
                        </th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-800 border-r border-gray-300 w-32">
                          Total Received
                        </th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-800 w-32">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((item, idx) => (
                        <tr
                          key={item.customer_id}
                          className="border-b border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-3 py-2 border-r border-gray-200 text-center">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2 border-r border-gray-200 font-medium text-gray-900">
                            {item.customer_nam}
                          </td>
                          <td className="px-3 py-2 text-right border-r border-gray-200 text-gray-700">
                            {fmt(item.total_qty, 0)}
                          </td>
                          <td className="px-3 py-2 text-right border-r border-gray-200 text-gray-700">
                            {fmt(item.total_amount)}
                          </td>
                          <td className="px-3 py-2 text-right border-r border-gray-200 text-green-700">
                            {fmt(item.total_received)}
                          </td>
                          <td
                            className={`px-3 py-2 text-right font-semibold ${
                              item.balance > 0
                                ? "text-red-600"
                                : item.balance < 0
                                ? "text-green-600"
                                : "text-gray-700"
                            }`}
                          >
                            {fmt(item.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-800 sticky bottom-0 text-white font-bold">
                      <tr>
                        <td
                          colSpan={2}
                          className="px-3 py-3 text-right border-r border-gray-600"
                        >
                          Grand Total:
                        </td>
                        <td className="px-3 py-3 text-right border-r border-gray-600">
                          {fmt(grandQty, 0)}
                        </td>
                        <td className="px-3 py-3 text-right border-r border-gray-600">
                          {fmt(grandAmount)}
                        </td>
                        <td className="px-3 py-3 text-right border-r border-gray-600">
                          {fmt(grandReceived)}
                        </td>
                        <td
                          className={`px-3 py-3 text-right ${
                            grandBalance > 0
                              ? "text-red-400"
                              : grandBalance < 0
                              ? "text-green-400"
                              : ""
                          }`}
                        >
                          {fmt(grandBalance)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
