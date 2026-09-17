"use client";
import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { exportToCSV } from "@/app/utils/exportToCsv";

export default function ShopExpenseReport() {
    const [isOpen, setIsOpen] = useState(false);
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [reportData, setReportData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchReport = async () => {
        if (!startDate || !endDate) {
            toast.error("Please select start date and end date");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`/api/shopExpense/readAll?all=true&start_dat=${startDate}&end_dat=${endDate}`);

            if (!res.ok) {
                throw new Error("Failed to fetch data");
            }

            const result = await res.json();
            const data = result.response_result?.data || result.response_result || result.data || [];

            setReportData(Array.isArray(data) ? data : []);
            setIsOpen(true);
        } catch (error) {
            console.error("Error fetching report:", error);
            toast.error("Failed to fetch report");
        } finally {
            setIsLoading(false);
        }
    };

    const groupedByDate = reportData.reduce((groups, expense) => {
        const date = new Date(expense.shop_expense_date).toISOString().slice(0, 10);
        (groups[date] ||= []).push(expense);
        return groups;
    }, {});

    const dateSections = Object.keys(groupedByDate).sort().map((date) => {
        const expenses = groupedByDate[date];
        const totalAmount = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        return {
            date,
            expenses,
            totalAmount
        };
    });

    const grandTotalAmount = dateSections.reduce((sum, day) => sum + day.totalAmount, 0);

    const handleExport = () => {
        if (!dateSections.length) {
            toast.error("No data to export");
            return;
        }

        const headers = ["Date", "Expense Head", "Account", "Description", "Amount"];
        const rows = [];

        dateSections.forEach((day) => {
            day.expenses.forEach((expense) => {
                rows.push([
                    day.date,
                    expense.account?.subhead?.subhead_nam || "-",
                    expense.account?.account_nam || "-",
                    expense.description || "-",
                    (parseFloat(expense.amount) || 0).toFixed(2)
                ]);
            });
            rows.push([day.date, "Daily Total", "", "", day.totalAmount.toFixed(2)]);
        });

        rows.push(["", "Grand Total", "", "", grandTotalAmount.toFixed(2)]);
        exportToCSV(`Shop_Expense_Report_${startDate}_to_${endDate}.csv`, headers, rows);
    };

    const fmt = (n, decimals = 2) => Number(n).toLocaleString(undefined, { minimumFractionDigits: decimals });

    return (
        <div>
            <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-10">SHOP EXPENSES REPORT</h3>

                    <div className="space-y-3 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
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
                            onClick={() => { setStartDate(""); setEndDate(""); }}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Clear
                        </button>
                        <button
                            onClick={fetchReport}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? "Loading..." : "View"}
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-300">
                            <div>
                                <h1 className="text-xl font-bold">Shop Expenses Report</h1>
                                <p className="text-sm text-gray-600">
                                    {new Date(startDate).toLocaleDateString("en-GB").replace(/\//g, "-")} – {new Date(endDate).toLocaleDateString("en-GB").replace(/\//g, "-")}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleExport}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                    Export CSV
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto p-4">
                            {dateSections.length === 0 ? (
                                <div className="flex items-center justify-center h-40 text-gray-500 border border-gray-300 rounded">
                                    No records found for this period
                                </div>
                            ) : (
                                <>
                                    {dateSections.map((day) => (
                                        <section key={day.date} className="mb-8">
                                            <h2 className="mb-2 text-lg font-bold">Date: {day.date}</h2>
                                            <table className="w-full border-collapse text-sm border border-gray-400">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left border border-gray-400">Expense Head</th>
                                                        <th className="px-3 py-2 text-left border border-gray-400">Account</th>
                                                        <th className="px-3 py-2 text-left border border-gray-400">Description</th>
                                                        <th className="px-3 py-2 text-right border border-gray-400">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {day.expenses.map((expense) => (
                                                        <tr key={expense.shop_expense_id}>
                                                            <td className="px-3 py-2 border border-black">{expense.account?.subhead?.subhead_nam || "-"}</td>
                                                            <td className="px-3 py-2 border border-black">{expense.account?.account_nam || "-"}</td>
                                                            <td className="px-3 py-2 border border-black">{expense.description || "-"}</td>
                                                            <td className="px-3 py-2 text-right border border-black">{fmt(expense.amount)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="bg-gray-800 text-white font-bold">
                                                        <td colSpan={3} className="px-3 py-3 border border-black text-right">Daily Total</td>
                                                        <td className="px-3 py-3 text-right border border-black">{fmt(day.totalAmount)}</td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </section>
                                    ))}
                                    <div className="mt-8 space-y-2 text-center font-bold text-xl">
                                        <p>Grand Total Expenses: {fmt(grandTotalAmount)}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
