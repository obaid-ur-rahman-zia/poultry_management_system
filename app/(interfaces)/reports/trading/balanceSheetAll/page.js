"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Printer, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/app/utils/exportToCsv";
import { useSession } from "next-auth/react";
import Select from "react-select";

const selectStyles = {
    control: (provided, state) => ({
        ...provided,
        borderColor: state.isFocused ? "#3B82F6" : "#E5E7EB",
        boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
        borderWidth: "2px",
        minHeight: "30px",
        "&:hover": { borderColor: "#3B82F6" },
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? "#3B82F6" : state.isFocused ? "#EFF6FF" : "white",
        color: state.isSelected ? "white" : "#374151",
    }),
};

export default function BalanceSheetAllReport() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [rawTransactions, setRawTransactions] = useState([]);
    const [globalOpeningBalance, setGlobalOpeningBalance] = useState(0);
    const [globalClosingBalance, setGlobalClosingBalance] = useState(0);
    const [cashAccIds, setCashAccIds] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const fetchBalanceSheet = async () => {
        if (!startDate || !endDate) {
            toast.error("Please select both start and end dates");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/account/accounts/read/balanceSheetAll?start_date=${startDate}&end_date=${endDate}`,
            );
            const data = await response.json();

            if (data.response_result) {
                setGlobalOpeningBalance(data.response_result.openingBalance || 0);
                setGlobalClosingBalance(data.response_result.closingBalance || 0);
                setRawTransactions(data.response_result.transactions || []);
                setCashAccIds(data.response_result.cashAccIds || []);
                setIsOpen(true);
                setCurrentPage(1);
            }
        } catch (error) {
            console.error("Error fetching balance sheet:", error);
            toast.error("Failed to fetch balance sheet");
        } finally {
            setIsLoading(false);
        }
    };

    // Process and group transactions
    const processedDays = useMemo(() => {
        if (!rawTransactions.length) return [];

        const grouped = {};
        rawTransactions.forEach((trans) => {
            const dateVal = trans.type === 'local_sale' ? trans.local_sale_date : trans.transaction_date;
            const dateStr = new Date(dateVal).toISOString().split("T")[0];
            if (!grouped[dateStr]) grouped[dateStr] = [];
            grouped[dateStr].push(trans);
        });

        const days = [];
        let currentBalance = globalOpeningBalance;
        let globalSrNo = 1;

        Object.keys(grouped)
            .sort()
            .forEach((dateStr) => {
                const dayTransactions = grouped[dateStr];
                const dayOpeningBalance = currentBalance;

                let selfReceiveTransactions = [];
                let selfPayTransactions = [];
                let localSales = [];
                let oppositeTransactions = [];

                dayTransactions.forEach((trans) => {
                    if (trans.type === "self") {
                        if (trans.transaction_type === "receive") selfReceiveTransactions.push(trans);
                        else if (trans.transaction_type === "pay") selfPayTransactions.push(trans);
                    } else if (trans.type === "local_sale") {
                        localSales.push(trans);
                    } else if (trans.type === "opposite") {
                        oppositeTransactions.push(trans);
                    }
                });

                const dayProcessedTransactions = [];
                let dayTotalReceived = 0;
                let dayTotalPaid = 0;

                // 1. Self Transactions (Receive)
                selfReceiveTransactions.forEach((trans) => {
                    currentBalance += trans.amount;
                    dayTotalReceived += trans.amount;
                    dayProcessedTransactions.push({
                        ...trans,
                        srNo: globalSrNo++,
                        runningBalance: currentBalance,
                    });
                });

                // 2. Local Sales (Consolidated)
                if (localSales.length > 0) {
                    const totalLocalSaleAmount = localSales.reduce(
                        (sum, ls) => sum + ls.received_amount,
                        0
                    );
                    currentBalance += totalLocalSaleAmount;
                    dayTotalReceived += totalLocalSaleAmount;

                    dayProcessedTransactions.push({
                        type: "local_sale_consolidated",
                        transaction_date: dateStr,
                        received_amount: totalLocalSaleAmount,
                        runningBalance: currentBalance,
                        description: `Local Sale`,
                        srNo: globalSrNo++,
                    });
                }

                // 3. Self Transactions (Pay)
                selfPayTransactions.forEach((trans) => {
                    currentBalance -= trans.amount;
                    dayTotalPaid += trans.amount;
                    dayProcessedTransactions.push({
                        ...trans,
                        srNo: globalSrNo++,
                        runningBalance: currentBalance,
                    });
                });

                // 4. Opposite Transactions
                oppositeTransactions.forEach((trans) => {
                    if (cashAccIds.includes(trans.received_by)) {
                        currentBalance += trans.amount;
                        dayTotalReceived += trans.amount;
                    } else if (cashAccIds.includes(trans.paid_by)) {
                        currentBalance -= trans.amount;
                        dayTotalPaid += trans.amount;
                    } else {
                        dayTotalReceived += trans.amount;
                        dayTotalPaid += trans.amount;
                    }

                    dayProcessedTransactions.push({
                        ...trans,
                        srNo: globalSrNo++,
                        runningBalance: currentBalance,
                    });
                });

                days.push({
                    date: dateStr,
                    displayDate: new Date(dateStr)
                        .toLocaleDateString("en-GB")
                        .replace(/\//g, "-"),
                    openingBalance: dayOpeningBalance,
                    closingBalance: currentBalance,
                    transactions: dayProcessedTransactions,
                    totalReceived: dayTotalReceived,
                    totalPaid: dayTotalPaid,
                });
            });

        return days;
    }, [rawTransactions, globalOpeningBalance, cashAccIds]);

    // Pagination Logic (Chunking days into pages of approx 60 rows to simulate 200vh height)
    const paginatedPages = useMemo(() => {
        const pages = [];
        let currentPageDays = [];
        let currentRowCount = 0;
        const targetRowsPerPage = 60;

        processedDays.forEach(day => {
            currentPageDays.push(day);
            currentRowCount += day.transactions.length + 2; // +2 for header and footer rows

            if (currentRowCount >= targetRowsPerPage) {
                pages.push(currentPageDays);
                currentPageDays = [];
                currentRowCount = 0;
            }
        });

        if (currentPageDays.length > 0) {
            pages.push(currentPageDays);
        }

        return pages;
    }, [processedDays]);

    const totalPages = paginatedPages.length;
    const currentPagesDays = paginatedPages[currentPage - 1] || [];

    const handleExport = () => {
        if (!processedDays.length) {
            toast.error("No data to export");
            return;
        }

        const headers = [
            "Sr No",
            "Name",
            "Received",
            "Name",
            "Paid",
            "Description",
            "Balance",
        ];

        const rows = [];

        // Overall Opening Balance
        rows.push(["", "", "", "", "", "Overall Opening Balance:", globalOpeningBalance.toFixed(2)]);
        rows.push(["", "", "", "", "", "", ""]);

        processedDays.forEach(day => {
            // Day Header
            rows.push(["", `Date: ${day.displayDate}`, "", "", "", "Opening Balance:", day.openingBalance.toFixed(2)]);

            day.transactions.forEach(trans => {
                let colReceivedBy = "-";
                let colReceivedAmount = "";
                let colPaidBy = "-";
                let colPaidAmount = "";
                let description = trans.description || "-";

                if (trans.type === "opposite") {
                    colReceivedBy = trans.paid_by_account?.account_nam || "-";
                    colReceivedAmount = trans.amount.toFixed(2);
                    colPaidBy = trans.received_by_account?.account_nam || "-";
                    colPaidAmount = trans.amount.toFixed(2);
                } else if (trans.type === "self") {
                    if (trans.transaction_type === "receive") {
                        colReceivedBy = trans.account?.account_nam || "-";
                        colReceivedAmount = trans.amount.toFixed(2);
                    } else {
                        colPaidBy = trans.account?.account_nam || "-";
                        colPaidAmount = trans.amount.toFixed(2);
                    }
                } else if (trans.type === "local_sale_consolidated") {
                    colReceivedBy = "Local Sales";
                    colReceivedAmount = trans.received_amount.toFixed(2);
                }

                rows.push([
                    trans.srNo,
                    colReceivedBy,
                    colReceivedAmount,
                    colPaidBy,
                    colPaidAmount,
                    description,
                    trans.runningBalance.toFixed(2)
                ]);
            });

            // Day Footer
            rows.push(["", "Day Total", day.totalReceived.toFixed(2), "", day.totalPaid.toFixed(2), "Closing Balance:", day.closingBalance.toFixed(2)]);
            rows.push(["", "", "", "", "", "", ""]);
        });

        // Overall Closing Balance
        rows.push(["", "", "", "", "", "Overall Closing Balance:", globalClosingBalance.toFixed(2)]);

        exportToCSV(`Balance_Sheet_${startDate}_to_${endDate}.csv`, headers, rows);
    };

    const handleDownloadPDF = async () => {
        if (!startDate || !endDate) {
            toast.error("Please select both start and end dates");
            return;
        }

        try {
            setIsLoading(true);
            const res = await fetch(
                `/api/account/accounts/read/downloadBalanceSheetAll?start_date=${startDate}&end_date=${endDate}`
            );

            if (!res.ok) throw new Error("Failed to generate PDF");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Balance_Sheet_All_Cash_${startDate}_to_${endDate}.pdf`;
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

    return (
        <div>
            {/* Card to trigger balance sheet */}
            <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            CONSOLIDATED BALANCE SHEET / ALL CASH
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
              onClick={fetchBalanceSheet}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "View Report"}
            </button>
          </div>
        </div>
            </div>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center print:bg-white print:relative print:p-0">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[100vh] overflow-hidden flex flex-col print:max-h-none print:shadow-none">
                        {/* Header */}
                        <div className="flex items-center justify-end p-1 border-b print:hidden">
                            <div className="flex gap-1">
                                <button
                                    onClick={handleExport}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    title="Export CSV"
                                >
                                    Export
                                </button>
                                <button
                                    onClick={handleDownloadPDF}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    title="Download PDF"
                                >
                                    <Printer className="w-4 h-4" />
                                    {isLoading ? "Loading..." : "Download PDF"}
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
                        <div className="flex-1 overflow-auto px-4 py-1">
                            {/* Report Header */}
                            <div className="text-center mb-4">
                                <h1 className="text-3xl font-bold text-gray-900 ">
                                    BHAGTANWALA POULTRY NETWORK
                                </h1>
                                <h1 className="text-xl font-bold text-gray-900">
                                    CONSOLIDATED BALANCE SHEET / ALL CASH IN HAND
                                </h1>
                                <p className="text-gray-600 text-sm">
                                    From:{" "}
                                    <span className="font-semibold">
                                        {new Date(startDate).toLocaleDateString("en-GB").replace(/\//g, "-")}
                                    </span>{" "}
                                    To:{" "}
                                    <span className="font-semibold">
                                        {new Date(endDate).toLocaleDateString("en-GB").replace(/\//g, "-")}
                                    </span>
                                </p>
                            </div>

                            {/* Tables per Day */}
                            <div className="pb-8">
                                {currentPagesDays.length === 0 ? (
                                    <div className="px-3 py-8 text-center text-gray-500 border border-gray-300 rounded-lg">
                                        No transactions found for the selected period.
                                    </div>
                                ) : (
                                    currentPagesDays.map((day) => (
                                        <div key={day.date} className="mb-8 overflow-x-auto">
                                            {/* Day Header (Outside Table) */}
                                            <div className="flex justify-start gap-8 items-center mb-2 px-1">
                                                <span className="font-bold text-gray-800 text-base">
                                                    {day.displayDate}
                                                </span>
                                                <span className="font-bold text-gray-800 text-base">
                                                    Opening Balance:{" "}
                                                    <span
                                                        className={
                                                            day.openingBalance < 0
                                                                ? "text-red-600"
                                                                : "text-green-600"
                                                        }
                                                    >
                                                        {day.openingBalance.toFixed(2)}
                                                    </span>
                                                </span>
                                            </div>

                                            <table className="w-full border-collapse text-sm border border-gray-300 table-fixed">
                                                <thead>
                                                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                                                        <th className="px-3 py-2 text-center font-bold text-gray-700 border border-gray-300 w-16">
                                                            Sr. No
                                                        </th>
                                                        <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-300 w-[20%]">
                                                            Name
                                                        </th>
                                                        <th className="px-3 py-2 text-right font-bold text-gray-700 border border-gray-300 w-28">
                                                            Receive
                                                        </th>
                                                        <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-300 w-[20%]">
                                                            Name
                                                        </th>
                                                        <th className="px-3 py-2 text-right font-bold text-gray-700 border border-gray-300 w-28">
                                                            Paid
                                                        </th>
                                                        <th className="px-3 py-2 text-left font-bold text-gray-700 border border-gray-300">
                                                            Description
                                                        </th>
                                                        <th className="px-3 py-2 text-right font-bold text-gray-700 border border-gray-300 w-32">
                                                            Balance
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {/* Day Transactions */}
                                                    {day.transactions.map((trans) => {
                                                        let colReceivedBy = "-";
                                                        let colReceivedAmount = "";
                                                        let colPaidBy = "-";
                                                        let colPaidAmount = "";
                                                        let description = trans.description || "-";

                                                        if (trans.type === "opposite") {
                                                            colReceivedBy = trans.paid_by_account?.account_nam || "-";
                                                            colReceivedAmount = trans.amount.toFixed(2);
                                                            colPaidBy = trans.received_by_account?.account_nam || "-";
                                                            colPaidAmount = trans.amount.toFixed(2);
                                                        } else if (trans.type === "self") {
                                                            if (trans.transaction_type === "receive") {
                                                                colReceivedBy = trans.account?.account_nam || "-";
                                                                colReceivedAmount = trans.amount.toFixed(2);
                                                            } else {
                                                                colPaidBy = trans.account?.account_nam || "-";
                                                                colPaidAmount = trans.amount.toFixed(2);
                                                            }
                                                        } else if (trans.type === "local_sale_consolidated") {
                                                            colReceivedBy = "Local Sales";
                                                            colReceivedAmount = trans.received_amount.toFixed(2);
                                                        }

                                                        return (
                                                            <tr
                                                                key={`${trans.type}-${trans.transaction_id || trans.srNo}`}
                                                                className="border-b border-gray-200 hover:bg-gray-50"
                                                            >
                                                                <td className="px-3 py-2 border border-gray-300 text-center">{trans.srNo}</td>
                                                                <td className="px-3 py-2 border border-gray-300">{colReceivedBy}</td>
                                                                <td className="px-3 py-2 border border-gray-300 text-right">{colReceivedAmount}</td>
                                                                <td className="px-3 py-2 border border-gray-300">{colPaidBy}</td>
                                                                <td className="px-3 py-2 border border-gray-300 text-right">{colPaidAmount}</td>
                                                                <td className="px-3 py-2 border border-gray-300">{description}</td>
                                                                <td className="px-3 py-2 border border-gray-300 font-medium text-right">
                                                                    <span
                                                                        className={
                                                                            trans.runningBalance < 0
                                                                                ? "text-red-600"
                                                                                : "text-green-600"
                                                                        }
                                                                    >
                                                                        {trans.runningBalance.toFixed(2)}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}

                                                    {/* Day Footer */}
                                                    <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                                                        <td colSpan="2" className="px-3 py-2 border border-gray-300 text-right text-gray-700">
                                                            Day Total:
                                                        </td>
                                                        <td className="px-3 py-2 border border-gray-300 text-right text-green-700">
                                                            {day.totalReceived.toFixed(2)}
                                                        </td>
                                                        <td className="px-3 py-2 border border-gray-300 text-right"></td>
                                                        <td className="px-3 py-2 border border-gray-300 text-right text-red-700">
                                                            {day.totalPaid.toFixed(2)}
                                                        </td>
                                                        <td className="px-3 py-2 border border-gray-300 text-right text-gray-700">
                                                            Closing Balance:
                                                        </td>
                                                        <td className="px-3 py-2 border border-gray-300 text-right">
                                                            <span
                                                                className={
                                                                    day.closingBalance < 0
                                                                        ? "text-red-600"
                                                                        : "text-green-600"
                                                                }
                                                            >
                                                                {day.closingBalance.toFixed(2)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Footer with Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between p-6 border-t print:hidden bg-gray-50 mt-auto">
                                <div className="text-sm text-gray-600 font-medium">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <div className="px-4 py-1 bg-blue-600 text-white rounded-lg font-medium shadow-sm flex items-center justify-center min-w-[3rem]">
                                        {currentPage}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
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
