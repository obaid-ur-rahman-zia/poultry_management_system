"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Printer, Search } from "lucide-react";
import { toast } from "react-toastify";
import { exportToCSV } from "@/app/utils/exportToCsv";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function WholeSaleProfitFormer() {
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [groupBy, setGroupBy] = useState("date");
  const [isOpen, setIsOpen] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [grandTotalWeight, setGrandTotalWeight] = useState(0);
  const [grandTotalPurchase, setGrandTotalPurchase] = useState(0);
  const [grandTotalSale, setGrandTotalSale] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const rowsPerPage = 15;

  // Account selection state
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedAccountName, setSelectedAccountName] = useState("");
  const [accountComboValue, setAccountComboValue] = useState("");

  // Account search modal state
  const [isAccountSearchDialogOpen, setIsAccountSearchDialogOpen] = useState(false);
  const [accountSearchQuery, setAccountSearchQuery] = useState("");
  const [accountSearchType, setAccountSearchType] = useState("all");
  const [allAccounts, setAllAccounts] = useState([]);
  const [accountSubHeads, setAccountSubHeads] = useState([]);
  const accountRowRefs = useRef([]);
  accountRowRefs.current = [];

  const getDefaultAccountSearchType = () => {
    const matchedSubhead = accountSubHeads.find((subhead) => {
      const subheadName = subhead.subhead_nam?.toLowerCase() || "";
      return (
        subheadName.includes("farmer") ||
        subheadName.includes("former") ||
        subheadName.includes("supplier")
      );
    });
    return matchedSubhead ? matchedSubhead.sub_id.toString() : "all";
  };

  const focusFirstAccountRow = () => {
    const firstRow = accountRowRefs.current.find(Boolean);
    if (firstRow) {
      firstRow.focus();
      return true;
    }
    return false;
  };

  useEffect(() => {
    fetchAllAccounts();
    fetchAccountSubHeads();
  }, []);

  const fetchAllAccounts = async () => {
    try {
      const res = await fetch("/api/account/accounts/readAll?all=true");
      const data = await res.json();
      if (data.success || data.response_status === "success") {
        const raw = data.response_result;
        let list = raw?.pagination ? raw.data || [] : raw?.data || raw || [];
        setAllAccounts(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error(e);
      setAllAccounts([]);
    }
  };

  const fetchAccountSubHeads = async () => {
    try {
      const res = await fetch("/api/account/accountSubHead/readAll");
      const data = await res.json();
      if (data.response_status === "success") {
        setAccountSubHeads(data.response_result?.data || data.response_result || []);
      }
    } catch (e) {
      setAccountSubHeads([]);
    }
  };


  const filteredAccounts = allAccounts.filter((acc) => {
    if (accountSearchType !== "all" && acc.sub_id?.toString() !== accountSearchType) return false;
    if (accountSearchQuery) {
      const q = accountSearchQuery.toLowerCase();
      return (
        acc.account_nam?.toLowerCase().includes(q) ||
        acc.account_cnic?.toLowerCase().includes(q) ||
        acc.account_contact?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatPeriod = (period, groupType) => {
    if (groupType === "date") {
      return new Date(period).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
    } else if (groupType === "month") {
      const [year, month] = period.split("-");
      return new Date(year, parseInt(month) - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    } else if (groupType === "year") return period;
    return period;
  };

  const getPeriodHeader = () => {
    if (groupBy === "date") return "Date";
    if (groupBy === "month") return "Month";
    if (groupBy === "year") return "Year";
    return "Period";
  };

  const buildDates = () => {
    let start_dat = startDate;
    let end_dat = endDate;
    if (groupBy === "month") {
      start_dat = `${startDate}-01`;
      const [y, m] = endDate.split("-");
      end_dat = `${endDate}-${new Date(y, m, 0).getDate()}`;
    } else if (groupBy === "year") {
      start_dat = `${startDate}-01-01`;
      end_dat = `${endDate}-12-31`;
    }
    return { start_dat, end_dat };
  };

  const fetchReport = async () => {
    if (!startDate || !endDate) { toast.error("Please select both start and end dates"); return; }
    if (!selectedAccount) { toast.error("Please select an account"); return; }
    const { start_dat, end_dat } = buildDates();
    if (new Date(start_dat) > new Date(end_dat)) { toast.error("Start date must be before end date"); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/wholeSale/read/readAccountReport?acc_id=${selectedAccount}&start_dat=${start_dat}&end_dat=${end_dat}&group_by=${groupBy}`);
      const data = await res.json();
      if (data.response_code === 200) {
        setReportData(data.response_result.results);
        setGrandTotalWeight(data.response_result.grandTotalWeight);
        setGrandTotalPurchase(data.response_result.grandTotalPurchase);
        setGrandTotalSale(data.response_result.grandTotalSale);
        setNetProfit(data.response_result.netProfit);
        setIsOpen(true);
        setCurrentPage(1);
      } else {
        toast.error(data.response_message || "Failed to fetch report");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData.length) { toast.error("No data to export"); return; }
    const headers = [getPeriodHeader(), "Weight", "Whole Sale Purchase", "Whole Sale Amount", "Profit", "Loss"];
    const rows = reportData.map((row) => {
      const profit = row.profit_loss > 0 ? row.profit_loss : 0;
      const loss = row.profit_loss < 0 ? Math.abs(row.profit_loss) : 0;
      return [formatPeriod(row.period, groupBy), (row.weight || 0).toFixed(2), row.purchase_amount.toFixed(2), row.sale_amount.toFixed(2), profit.toFixed(2), loss.toFixed(2)];
    });
    rows.push(["Grand Total", grandTotalWeight.toFixed(2), grandTotalPurchase.toFixed(2), grandTotalSale.toFixed(2), netProfit > 0 ? netProfit.toFixed(2) : "0.00", netProfit < 0 ? Math.abs(netProfit).toFixed(2) : "0.00"]);
    exportToCSV(`Account_WS_Report_${selectedAccountName}_${groupBy}.csv`, headers, rows);
  };

  const handleDownloadPDF = async () => {
    if (!startDate || !endDate || !selectedAccount) { toast.error("Please select account and dates"); return; }
    const { start_dat, end_dat } = buildDates();
    setIsLoading(true);
    try {
      const res = await fetch(`/api/wholeSale/read/downloadAccountReport?acc_id=${selectedAccount}&start_dat=${start_dat}&end_dat=${end_dat}&group_by=${groupBy}&account_name=${encodeURIComponent(selectedAccountName)}`);
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Account_WS_Report_${selectedAccountName}_${groupBy}_${startDate}_to_${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF downloaded successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to download PDF");
    } finally {
      setIsLoading(false);
    }
  };

  const renderDateInput = (value, onChange) => {
    if (groupBy === "date") return (
      <input type="date" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" />
    );
    if (groupBy === "month") return (
      <input type="month" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" />
    );
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 16 }, (_, i) => currentYear - 10 + i);
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all">
        <option value="">Select Year</option>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    );
  };

  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = reportData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(reportData.length / rowsPerPage);

  return (
    <div>
      {/* Card */}
      <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative p-6">
          <h3 className="text-lg text-center  font-semibold text-gray-900">ACCOUNTWISE</h3>
          <h3 className="text-lg text-center  font-semibold text-gray-900">PROFIT/LOSS REPORT</h3>

          <div className="space-y-3 mb-4">
            {/* Account Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Account *</label>
              <div className="flex gap-2">
                <select
                  value={selectedAccount}
                  onChange={(e) => {
                    const acc = allAccounts.find((a) => a.acc_id.toString() === e.target.value);
                    setSelectedAccount(e.target.value);
                    setSelectedAccountName(acc?.account_nam || "");
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                >
                  <option value="">Select account...</option>
                  {allAccounts.map((acc) => (
                    <option key={acc.acc_id} value={acc.acc_id.toString()}>{acc.account_nam}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={accountSubHeads.length === 0 || allAccounts.length === 0}
                  onClick={() => { setAccountSearchQuery(""); setAccountSearchType(getDefaultAccountSearchType()); setIsAccountSearchDialogOpen(true); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                  title="Search Accounts"
                >=</button>
              </div>
            </div>

            {/* Group By */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Group By</label>
              <select value={groupBy} onChange={(e) => { setGroupBy(e.target.value); setStartDate(""); setEndDate(""); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all">
                <option value="date">Date</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              {renderDateInput(startDate, setStartDate)}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              {renderDateInput(endDate, setEndDate)}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setStartDate(""); setEndDate(""); setGroupBy("date"); setSelectedAccount(""); setSelectedAccountName(""); }}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >Clear</button>
            <button onClick={fetchReport} disabled={isLoading}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50">
              {isLoading ? "Loading..." : "View Report"}
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[100vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-end p-1 border-b">
              <div className="flex gap-1">
                <button onClick={handleExport}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors" title="Export CSV">
                  Export
                </button>
                <button onClick={handleDownloadPDF} disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50" title="Download PDF">
                  <Printer className="w-4 h-4" />
                  {isLoading ? "Loading..." : "Download PDF"}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Close">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              <div className="text-center mb-4">
                <h1 className="text-3xl font-bold text-gray-900">BHAGTANWALA POULTRY NETWORK</h1>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">ACCOUNT WHOLESALE REPORT</h1>
                <p className="text-gray-800 font-semibold">{selectedAccountName}</p>
                <p className="text-gray-600 text-sm">
                  From: <span className="font-semibold">{new Date(startDate).toLocaleDateString("en-GB").replace(/\//g, "-")}</span>{" "}
                  To: <span className="font-semibold">{new Date(endDate).toLocaleDateString("en-GB").replace(/\//g, "-")}</span>
                  {" | "}<span className="font-semibold">Grouped by: {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}</span>
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-4 py-2 text-center font-bold text-gray-700 border border-gray-300">{getPeriodHeader()}</th>
                      <th className="px-4 py-2 text-center font-bold text-gray-700 border border-gray-300">WEIGHT</th>
                      <th className="px-4 py-2 text-center font-bold text-gray-700 border border-gray-300">WHOLE SALE PURCHASE</th>
                      <th className="px-4 py-2 text-center font-bold text-gray-700 border border-gray-300">WHOLE SALE AMOUNT</th>
                      <th className="px-4 py-2 text-center font-bold text-gray-700 border border-gray-300">PROFIT</th>
                      <th className="px-4 py-2 text-center font-bold text-gray-700 border border-gray-300">LOSS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((row, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium border border-gray-300">{formatPeriod(row.period, groupBy)}</td>
                        <td className="px-4 py-2 text-right border border-gray-300">{(row.weight || 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right border border-gray-300">{row.purchase_amount.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right border border-gray-300">{row.sale_amount.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-semibold border border-gray-300">{row.profit_loss > 0 ? row.profit_loss.toFixed(2) : 0}</td>
                        <td className="px-4 py-2 text-right font-semibold border border-gray-300">{row.profit_loss < 0 ? Math.abs(row.profit_loss).toFixed(2) : 0}</td>
                      </tr>
                    ))}

                    {reportData.length > 0 && (
                      <tr className="bg-indigo-50 border-t-2 border-gray-400 font-bold">
                        <td className="px-4 py-3 border border-gray-300">Grand Total:</td>
                        <td className="px-4 py-3 text-right border border-gray-300">{grandTotalWeight.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right border border-gray-300">{grandTotalPurchase.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right border border-gray-300">{grandTotalSale.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right border border-gray-300">{netProfit > 0 ? netProfit.toFixed(2) : 0}</td>
                        <td className="px-4 py-3 text-right border border-gray-300">{netProfit < 0 ? Math.abs(netProfit).toFixed(2) : 0}</td>
                      </tr>
                    )}
                    {reportData.length > 0 && (
                      <tr className="bg-gray-100 border-t border-gray-300 font-bold">
                        <td colSpan="4" className="px-4 py-3 text-right border border-gray-300">Net Profit:</td>
                        <td className="px-4 py-3 text-right text-lg border border-gray-300">
                          <span className={netProfit >= 0 ? "text-green-600" : "text-red-600"}>{netProfit.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3 border border-gray-300"></td>
                      </tr>
                    )}
                    {reportData.length === 0 && (
                      <tr><td colSpan="6" className="text-center py-8 text-gray-500">No data found for the selected period</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-6 border-t">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, reportData.length)} of {reportData.length} records
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="px-4 py-1 bg-indigo-500 text-white rounded-lg font-medium">{currentPage} / {totalPages}</div>
                  <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Search Dialog */}
      <Dialog
        open={isAccountSearchDialogOpen}
        onOpenChange={setIsAccountSearchDialogOpen}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-4">
              <div className="flex-1 space-y-2">
                <Label>Search Account</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search accounts by name, cnic, contact..."
                    value={accountSearchQuery}
                    onChange={(e) => setAccountSearchQuery(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>
              <div
                className="flex-1 space-y-2"
                onKeyDown={(e) => {
                  if (e.key === "Tab" && !e.shiftKey) {
                    const moved = focusFirstAccountRow();
                    if (moved) e.preventDefault();
                  }
                }}
              >
                <Label>Account Type (Head)</Label>
                <Combobox
                  options={[
                    { value: "all", label: "All Types" },
                    ...accountSubHeads
                      .filter(
                        (subhead) =>
                          subhead.subhead_nam !== "Expense Head" &&
                          subhead.parent?.subhead_nam !== "Expense Head",
                      )
                      .map((subhead) => ({
                        value: subhead.sub_id.toString(),
                        label: `${subhead.subhead_nam}${subhead.head?.head_nam &&
                          subhead.head.head_nam !== "Main Head"
                          ? ` (${subhead.head.head_nam})`
                          : ""
                          }`,
                      })),
                  ]}
                  value={accountSearchType}
                  onValueChange={setAccountSearchType}
                  placeholder="Select account type"
                  searchPlaceholder="Search account types..."
                  emptyText="No account type found."
                />
              </div>
            </div>
            <div className="relative max-h-[400px] overflow-auto border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Sr. No</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Account Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((acc, index) => (
                    <TableRow
                      key={acc.acc_id}
                      className="cursor-pointer hover:bg-muted/50"
                      tabIndex={0}
                      ref={(el) => {
                        accountRowRefs.current[index] = el;
                      }}
                      onClick={() => {
                        setSelectedAccount(acc.acc_id.toString());
                        setSelectedAccountName(acc.account_nam);
                        setIsAccountSearchDialogOpen(false);
                        setAccountSearchQuery("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedAccount(acc.acc_id.toString());
                          setSelectedAccountName(acc.account_nam);
                          setIsAccountSearchDialogOpen(false);
                          setAccountSearchQuery("");
                        }
                      }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {acc.account_nam}
                      </TableCell>
                      <TableCell>
                        {accountSubHeads.find(
                          (sh) =>
                            sh.sub_id?.toString() === acc.sub_id?.toString(),
                        )?.subhead_nam || "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAccounts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        No accounts found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
