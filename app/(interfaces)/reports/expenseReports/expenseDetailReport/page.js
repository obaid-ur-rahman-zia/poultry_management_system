"use client";
import React, { useState } from "react";
import { Printer, X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { FileText } from "lucide-react";

export default function PurchaseReportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [purchaseData, setPurchaseData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const purchasesPerPage = 10;

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/unitExpense/read/readReportDetail?start_dat=${startDate}&end_dat=${endDate}`
      );
      const data = await res.json();
      setPurchaseData(data.response_result);
      setIsOpen(true);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch report");
    } finally {
      setIsLoading(false);
    }
  };

  //   const handleDownloadPDF = async () => {
  //     try {
  //       setIsLoading(true);
  //       const res = await fetch(
  //         `/api/purchase/read/downloadPurchaseReport?start_dat=${startDate}&end_dat=${endDate}`
  //       );

  //       if (!res.ok) throw new Error("Failed to generate PDF");

  //       const blob = await res.blob();
  //       const url = window.URL.createObjectURL(blob);
  //       const a = document.createElement("a");
  //       a.href = url;
  //       a.download = `Purchase_Detail_Report_${startDate}_to_${endDate}.pdf`;
  //       document.body.appendChild(a);
  //       a.click();
  //       window.URL.revokeObjectURL(url);
  //       document.body.removeChild(a);

  //       toast.success("PDF downloaded successfully!");
  //     } catch (error) {
  //       console.error("Download error:", error);
  //       toast.error("Failed to download PDF");
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  // Pagination logic
  const indexOfLastPurchase = currentPage * purchasesPerPage;
  const indexOfFirstPurchase = indexOfLastPurchase - purchasesPerPage;
  const currentPurchases = purchaseData.slice(
    indexOfFirstPurchase,
    indexOfLastPurchase
  );
  const totalPages = Math.ceil(purchaseData.length / purchasesPerPage);

  // Calculate serial numbers with continuous counting
  let serialCounter =
    indexOfFirstPurchase > 0
      ? purchaseData
          .slice(0, indexOfFirstPurchase)
          .reduce((acc, purchase) => acc + purchase.products.length, 0) + 1
      : 1;

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

          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Unit Expense Report
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
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[100vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-end p-1 border-b">
              <div className="flex gap-1">
                {/* <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  disabled={isLoading}
                >
                  <Printer className="w-4 h-4" />
                  {isLoading ? "Loading..." : "Download PDF"}
                </button> */}
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
                <h1 className="text-2xl font-bold text-gray-900">
                  Unit Expense Report
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

              {/* Purchase Tables */}
              {currentPurchases.map((purchase) => {
                return (
                  <div
                    key={purchase.expense_id}
                    className="mb-8 border border-gray-300 rounded-lg p-4"
                  >
                    {/* Purchase Info */}
                    <div className="mb-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <div>
                          <span className="font-semibold">Expense ID: </span>
                          <span>{purchase.expense_id}</span>
                          <span className="ml-6 font-semibold">Floc ID: </span>
                          <span>{purchase.floc_id}</span>
                        </div>
                        <div>
                          <span className="font-semibold">Expense Date: </span>
                          <span>
                            {new Date(
                              purchase.expense_date
                            ).toLocaleDateString()}
                          </span>

                          <span className="ml-6 font-semibold">Supplier: </span>
                          <span>{purchase.supplier.account_nam}</span>
                          <span>
                            {" "}
                            ({purchase.supplier.account_contact || "N/A"})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Products Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <th className="px-2 py-2 text-left font-bold text-gray-700">
                              Product Name
                            </th>
                            <th className="px-2 py-2 text-right font-bold text-gray-700">
                              Price
                            </th>
                            <th className="px-2 py-2 text-right font-bold text-gray-700">
                              Qty
                            </th>
                            <th className="px-2 py-2 text-right font-bold text-gray-700">
                              Disc
                            </th>
                            <th className="px-2 py-2 text-right font-bold text-gray-700">
                              Tax
                            </th>
                            <th className="px-2 py-2 text-right font-bold text-gray-700">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            key={purchase.expense_id}
                            className="border-b border-gray-200 hover:bg-gray-50"
                          >
                            <td className="px-2 py-2">
                              {purchase.product.product_title}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {Number(purchase.price).toFixed(2)}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {purchase.quantity}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {Number(purchase.discount_value || 0).toFixed(2) +
                                " " +
                                purchase.discount_type}
                            </td>
                            <td className="px-2 py-2 text-right">
                              {Number(purchase.tax_value || 0).toFixed(2) +
                                " " +
                                purchase.tax_type}
                            </td>
                            <td className="px-2 py-2 text-right font-medium">
                              {Number(purchase.total).toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer with Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-6 border-t">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstPurchase + 1} to{" "}
                  {Math.min(indexOfLastPurchase, purchaseData.length)} of{" "}
                  {purchaseData.length} purchases
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
                  <div className="px-4 py-1 bg-orange-500 text-white rounded-lg font-medium">
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
