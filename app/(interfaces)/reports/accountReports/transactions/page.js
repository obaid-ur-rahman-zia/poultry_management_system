"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Search,
  RefreshCw,
  X,
  Eye,
} from "lucide-react";
import MobileListToggle from "@/app/(interfaces)/components/MobileListToggle";

export default function AccountingReports() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [accounts, setAccounts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    voucherType: "all",
    accountSearch: "",
    financialYear: "all",
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/account/accounts/readAll");
      const data = await response.json();

      if (data.response_code === 200 && Array.isArray(data.response_result)) {
        const accountMap = {};
        data.response_result.forEach((account) => {
          accountMap[account.acc_id] = {
            id: account.account_id,
            name: account.account_nam,
            headName: account.head?.head_nam || "",
            subheadName: account.subhead?.subhead_nam || "",
          };
        });
        setAccounts(accountMap);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/transaction/readAll");
      const data = await response.json();

      if (data.response_code === 200) {
        const transactionData = Array.isArray(data.response_result?.data)
          ? data.response_result.data
          : [];
        setTransactions(transactionData);
        setFilteredTransactions(transactionData);
      } else {
        console.error("Failed to fetch transactions:", data.response_message);
        setTransactions([]);
        setFilteredTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      alert("Failed to load transactions");
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!Array.isArray(transactions)) {
      setFilteredTransactions([]);
      return;
    }

    let filtered = [...transactions];

    if (filters.startDate) {
      filtered = filtered.filter(
        (t) => new Date(t.transaction_dat) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(
        (t) => new Date(t.transaction_dat) <= new Date(filters.endDate)
      );
    }

    if (filters.voucherType !== "all") {
      filtered = filtered.filter((t) => t.voucher_type === filters.voucherType);
    }

    if (filters.financialYear !== "all") {
      filtered = filtered.filter(
        (t) => t.financial_year === filters.financialYear
      );
    }

    if (filters.accountSearch) {
      filtered = filtered.filter((t) => {
        const accountName = accounts[t.acc_id]?.name || "";
        return (
          accountName
            .toLowerCase()
            .includes(filters.accountSearch.toLowerCase()) ||
          t.remarks?.toLowerCase().includes(filters.accountSearch.toLowerCase())
        );
      });
    }

    setFilteredTransactions(filtered);
  }, [filters, transactions, accounts]);

  const getAccountName = (accountId) => {
    return accounts[accountId]?.name || "Unknown Account";
  };

  const getAccountDetails = (accountId) => {
    return accounts[accountId] || { headName: "", subheadName: "", name: "" };
  };

  const calculateSummary = () => {
    if (!Array.isArray(filteredTransactions)) {
      return { totalDebit: 0, totalCredit: 0, netBalance: 0 };
    }

    const totalDebit = filteredTransactions.reduce(
      (sum, t) => sum + (Number(t.debit) || 0),
      0
    );
    const totalCredit = filteredTransactions.reduce(
      (sum, t) => sum + (Number(t.credit) || 0),
      0
    );
    const netBalance = totalDebit - totalCredit;
    const NetBalance = netBalance.toFixed(2);
    return { totalDebit, totalCredit, NetBalance };
  };

  const getFinancialYears = () => {
    if (!Array.isArray(transactions)) {
      return [];
    }
    const years = [...new Set(transactions.map((t) => t.financial_year))];
    return years.sort();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return amount
      ? amount.toLocaleString("en-PK", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "0.00";
  };

  const getVoucherLabel = (type) => {
    const labels = {
      CR: "Cash Receipt",
      CP: "Cash Payment",
      BR: "Bank Receipt",
      BP: "Bank Payment",
      JV: "Journal Voucher",
    };
    return labels[type] || type;
  };

  const resetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      voucherType: "all",
      accountSearch: "",
      financialYear: "all",
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.voucherType !== "all") count++;
    if (filters.accountSearch) count++;
    if (filters.financialYear !== "all") count++;
    return count;
  };

  const exportToCSV = () => {
    if (
      !Array.isArray(filteredTransactions) ||
      filteredTransactions.length === 0
    ) {
      alert("No transactions to export");
      return;
    }

    const headers = [
      "Date",
      "Voucher Type",
      "Account Head",
      "Account",
      "Reference",
      "Debit",
      "Credit",
      "Balance",
      "Remarks",
      "Financial Year",
    ];

    let runningBalance = 0;
    const rows = filteredTransactions.map((t) => {
      runningBalance += (t.debit || 0) - (t.credit || 0);
      return [
        formatDate(t.transaction_dat),
        t.voucher_type,
        getAccountDetails(t.acc_id).headName,
        getAccountName(t.acc_id),
        t.reference || "",
        t.debit || 0,
        t.credit || 0,
        runningBalance,
        t.remarks || "",
        t.financial_year,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setIsSheetOpen(true);
  };

  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;

    const parts = text.toString().split(new RegExp(`(${searchTerm})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const summary = calculateSummary();
  const activeFilterCount = getActiveFilterCount();

  return (
    <TooltipProvider>
      <div className="w-full p-3 sm:p-6 space-y-3 bg-gray-50 min-h-screen">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Accounting Reports
            </h1>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {!isMobile && (
              <div className="w-full sm:w-92">
                <div className="relative">
                  <Input
                    placeholder="Search by account name or remarks..."
                    value={filters.accountSearch}
                    onChange={(e) =>
                      setFilters({ ...filters, accountSearch: e.target.value })
                    }
                  />
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            )}

            {isMobile && (
              <Dialog
                open={isFilterDialogOpen}
                onOpenChange={setIsFilterDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Search className="h-4 w-4 mr-2" />
                    Search & Filters
                    {activeFilterCount > 0 && (
                      <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Search & Filters</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label className="text-sm font-semibold">Search</Label>
                      <div className="relative mt-1">
                        <Input
                          placeholder="Search by account name or remarks..."
                          value={filters.accountSearch}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              accountSearch: e.target.value,
                            })
                          }
                        />
                        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label className="text-sm font-semibold">
                          Start Date
                        </Label>
                        <Input
                          type="date"
                          value={filters.startDate}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              startDate: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">
                          End Date
                        </Label>
                        <Input
                          type="date"
                          value={filters.endDate}
                          onChange={(e) =>
                            setFilters({ ...filters, endDate: e.target.value })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">
                          Voucher Type
                        </Label>
                        <Select
                          value={filters.voucherType}
                          onValueChange={(value) =>
                            setFilters({ ...filters, voucherType: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="CR">Cash Receipt</SelectItem>
                            <SelectItem value="CP">Cash Payment</SelectItem>
                            <SelectItem value="BR">Bank Receipt</SelectItem>
                            <SelectItem value="BP">Bank Payment</SelectItem>
                            <SelectItem value="JV">Journal Voucher</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">
                          Financial Year
                        </Label>
                        <Select
                          value={filters.financialYear}
                          onValueChange={(value) =>
                            setFilters({ ...filters, financialYear: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            {getFinancialYears().map((year) => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={resetFilters}
                        variant="outline"
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reset All
                      </Button>
                      <Button
                        onClick={() => setIsFilterDialogOpen(false)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="relative">
                      <Filter className="h-4 w-4" />
                      {activeFilterCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Filter Transactions{" "}
                    {activeFilterCount > 0 && `(${activeFilterCount} active)`}
                  </p>
                </TooltipContent>
              </Tooltip>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Filter Transactions</DialogTitle>
                  <DialogDescription>
                    Apply filters to narrow down your transaction view
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div>
                    <Label className="text-sm font-semibold">Start Date</Label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) =>
                        setFilters({ ...filters, startDate: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">End Date</Label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) =>
                        setFilters({ ...filters, endDate: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">
                      Voucher Type
                    </Label>
                    <Select
                      value={filters.voucherType}
                      onValueChange={(value) =>
                        setFilters({ ...filters, voucherType: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="CR">Cash Receipt</SelectItem>
                        <SelectItem value="CP">Cash Payment</SelectItem>
                        <SelectItem value="BR">Bank Receipt</SelectItem>
                        <SelectItem value="BP">Bank Payment</SelectItem>
                        <SelectItem value="JV">Journal Voucher</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">
                      Financial Year
                    </Label>
                    <Select
                      value={filters.financialYear}
                      onValueChange={(value) =>
                        setFilters({ ...filters, financialYear: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {getFinancialYears().map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-between gap-2">
                  <Button onClick={resetFilters} variant="outline">
                    <X className="h-4 w-4 mr-2" />
                    Reset All
                  </Button>
                  <Button
                    onClick={() => setIsFilterOpen(false)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Apply Filters
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={fetchTransactions}
                  variant="outline"
                  size="icon"
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh Data</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={exportToCSV}
                  size="icon"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export to CSV</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Debit
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                Rs. {formatCurrency(summary.totalDebit)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Array.isArray(filteredTransactions)
                  ? filteredTransactions.filter((t) => t.debit > 0).length
                  : 0}{" "}
                transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Credit
              </CardTitle>
              <TrendingDown className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                Rs. {formatCurrency(summary.totalCredit)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Array.isArray(filteredTransactions)
                  ? filteredTransactions.filter((t) => t.credit > 0).length
                  : 0}{" "}
                transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Net Balance
              </CardTitle>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  summary.netBalance >= 0 ? "text-blue-600" : "text-orange-600"
                }`}
              >
                Rs. {formatCurrency(Math.abs(summary.netBalance))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {summary.netBalance >= 0 ? "Surplus" : "Deficit"}
              </p>
            </CardContent>
          </Card>
        </div>

        {activeFilterCount > 0 && (
          <Card className="bg-blue-50 p-1 border-blue-200">
            <CardContent className="py-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Filter className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}{" "}
                    applied
                  </span>
                  <span className="text-blue-700">
                    • Showing{" "}
                    {Array.isArray(filteredTransactions)
                      ? filteredTransactions.length
                      : 0}{" "}
                    of {Array.isArray(transactions) ? transactions.length : 0}{" "}
                    transactions
                  </span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={resetFilters}
                      variant="ghost"
                      size="sm"
                      className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Remove all active filters</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="ledger" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ledger">General Ledger</TabsTrigger>
            <TabsTrigger value="trial">Trial Balance</TabsTrigger>
            <TabsTrigger value="daybook">Day Book</TabsTrigger>
          </TabsList>

          <TabsContent value="ledger">
            <Card>
              <CardHeader>
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  {Array.isArray(filteredTransactions)
                    ? filteredTransactions.length
                    : 0}{" "}
                  transactions
                </p>
              </CardHeader>
              <CardContent>
                <MobileListToggle title="General Ledger">
                  {isMobile ? (
                    <div className="space-y-3">
                      {isLoading ? (
                        <div className="text-center py-8 text-gray-500">
                          Loading transactions...
                        </div>
                      ) : !Array.isArray(filteredTransactions) ||
                        filteredTransactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No transactions found
                        </div>
                      ) : (
                        filteredTransactions.map((transaction) => (
                          <Card
                            key={transaction.transaction_id}
                            className="border"
                          >
                            <CardContent className="p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  Date
                                </span>
                                <span className="text-sm font-medium">
                                  {formatDate(transaction.transaction_dat)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  Type
                                </span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                  {transaction.voucher_type}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  Head
                                </span>
                                <span className="text-sm font-medium">
                                  {
                                    getAccountDetails(transaction.acc_id)
                                      .headName
                                  }
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  Account
                                </span>
                                <span className="text-sm font-medium">
                                  {getAccountName(transaction.acc_id)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  Reference
                                </span>
                                <span className="text-sm">
                                  {transaction.reference || "-"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  Debit
                                </span>
                                <span className="text-sm font-medium text-green-700">
                                  {transaction.debit >= 0
                                    ? formatCurrency(transaction.debit)
                                    : "-"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  Credit
                                </span>
                                <span className="text-sm font-medium text-red-700">
                                  {transaction.credit >= 0
                                    ? formatCurrency(transaction.credit)
                                    : "-"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  Remarks
                                </span>
                                <span className="text-sm text-gray-600 truncate max-w-[60%]">
                                  {transaction.remarks || "-"}
                                </span>
                              </div>
                              <div className="flex justify-end pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleViewTransaction(transaction)
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="max-h-[600px] overflow-auto">
                        <table className="w-full">
                          <thead className="bg-blue-50 sticky top-0">
                            <tr className="border-b">
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                Type
                              </th>

                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                Head
                              </th>

                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                Account
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                Reference
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                Debit
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                Credit
                              </th>
                              {/* <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                            Balance
                          </th> */}
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                Remarks
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {isLoading ? (
                              <tr>
                                <td
                                  colSpan={9}
                                  className="text-center py-8 text-gray-500"
                                >
                                  Loading transactions...
                                </td>
                              </tr>
                            ) : !Array.isArray(filteredTransactions) ||
                              filteredTransactions.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={9}
                                  className="text-center py-8 text-gray-500"
                                >
                                  No transactions found
                                </td>
                              </tr>
                            ) : (
                              (() => {
                                let runningBalance = 0;
                                return filteredTransactions.map(
                                  (transaction) => {
                                    runningBalance +=
                                      (transaction.debit || 0) -
                                      (transaction.credit || 0);
                                    return (
                                      <tr
                                        key={transaction.transaction_id}
                                        className="border-b hover:bg-gray-50"
                                      >
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                          {formatDate(
                                            transaction.transaction_dat
                                          )}
                                        </td>
                                        <td className="px-4 py-3">
                                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                            {transaction.voucher_type}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-sm">
                                          {highlightText(
                                            getAccountDetails(
                                              transaction.acc_id
                                            ).headName
                                          )}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-sm">
                                          {highlightText(
                                            getAccountName(transaction.acc_id),
                                            filters.accountSearch
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                          {transaction.reference || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-green-700 text-sm">
                                          {transaction.debit >= 0
                                            ? formatCurrency(transaction.debit)
                                            : "-"}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-red-700 text-sm">
                                          {transaction.credit >= 0
                                            ? formatCurrency(transaction.credit)
                                            : "-"}
                                        </td>
                                        {/* <td
                                    className={`px-4 py-3 text-right font-bold text-sm ${
                                      runningBalance >= 0
                                        ? "text-blue-700"
                                        : "text-orange-700"
                                    }`}
                                  >
                                    {formatCurrency(Math.abs(runningBalance))}{" "}
                                    {runningBalance < 0 ? "Cr" : "Dr"}
                                  </td> */}
                                        <td className="px-4 py-3 text-sm text-gray-600  truncate">
                                          {highlightText(
                                            transaction.remarks || "-",
                                            filters.accountSearch
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 truncate">
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() =>
                                              handleViewTransaction(transaction)
                                            }
                                          >
                                            <Eye className="h-4 w-4" />
                                          </Button>
                                        </td>
                                      </tr>
                                    );
                                  }
                                );
                              })()
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {Array.isArray(filteredTransactions) &&
                    filteredTransactions.length > 0 && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Total Debit:</span>
                            <span className="font-bold text-green-700 ml-2">
                              Rs. {formatCurrency(summary.totalDebit)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Total Credit:</span>
                            <span className="font-bold text-red-700 ml-2">
                              Rs. {formatCurrency(summary.totalCredit)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Net Balance:</span>
                            <span
                              className={`font-bold ml-2 ${
                                summary.netBalance >= 0
                                  ? "text-blue-700"
                                  : "text-orange-700"
                              }`}
                            >
                              Rs. {formatCurrency(Math.abs(summary.netBalance))}{" "}
                              {summary.netBalance < 0 ? "Cr" : "Dr"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                </MobileListToggle>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trial">
            <Card>
              <CardHeader>
                <p className="text-sm text-gray-500">Summary by account</p>
              </CardHeader>
              <CardContent>
                <MobileListToggle title="Trial Balance">
                  {isMobile ? (
                    <div className="space-y-3">
                      {(() => {
                        if (
                          !Array.isArray(filteredTransactions) ||
                          filteredTransactions.length === 0
                        ) {
                          return (
                            <div className="text-center py-8 text-gray-500">
                              No data available
                            </div>
                          );
                        }

                        const accountSummary = {};
                        filteredTransactions.forEach((t) => {
                          const accountName = getAccountName(t.acc_id);
                          if (!accountSummary[accountName]) {
                            accountSummary[accountName] = {
                              debit: 0,
                              credit: 0,
                            };
                          }
                          accountSummary[accountName].debit += t.debit || 0;
                          accountSummary[accountName].credit += t.credit || 0;
                        });

                        return (
                          <>
                            {Object.entries(accountSummary).map(
                              ([account, amounts]) => (
                                <Card key={account} className="border">
                                  <CardContent className="p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500">
                                        Account
                                      </span>
                                      <span className="text-sm font-medium">
                                        {account}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500">
                                        Debit
                                      </span>
                                      <span className="text-sm font-medium text-green-700">
                                        {formatCurrency(amounts.debit)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500">
                                        Credit
                                      </span>
                                      <span className="text-sm font-medium text-red-700">
                                        {formatCurrency(amounts.credit)}
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            )}
                            <Card className="border-2 border-blue-200 bg-blue-50">
                              <CardContent className="p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold">
                                    TOTAL
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">
                                    Total Debit
                                  </span>
                                  <span className="text-sm font-bold text-green-700">
                                    {formatCurrency(summary.totalDebit)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-600">
                                    Total Credit
                                  </span>
                                  <span className="text-sm font-bold text-red-700">
                                    {formatCurrency(summary.totalCredit)}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="max-h-[600px] overflow-auto">
                        <table className="w-full">
                          <thead className="bg-blue-50 sticky top-0">
                            <tr className="border-b">
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                Account Name
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                Debit
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                Credit
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {(() => {
                              if (
                                !Array.isArray(filteredTransactions) ||
                                filteredTransactions.length === 0
                              ) {
                                return (
                                  <tr>
                                    <td
                                      colSpan={3}
                                      className="text-center py-8 text-gray-500"
                                    >
                                      No data available
                                    </td>
                                  </tr>
                                );
                              }

                              const accountSummary = {};
                              filteredTransactions.forEach((t) => {
                                const accountName = getAccountName(t.acc_id);
                                if (!accountSummary[accountName]) {
                                  accountSummary[accountName] = {
                                    debit: 0,
                                    credit: 0,
                                  };
                                }
                                accountSummary[accountName].debit +=
                                  t.debit || 0;
                                accountSummary[accountName].credit +=
                                  t.credit || 0;
                              });

                              return (
                                <>
                                  {Object.entries(accountSummary).map(
                                    ([account, amounts]) => (
                                      <tr
                                        key={account}
                                        className="border-b hover:bg-gray-50"
                                      >
                                        <td className="px-4 py-3 font-medium text-sm">
                                          {highlightText(
                                            account,
                                            filters.accountSearch
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-green-700 text-sm">
                                          {formatCurrency(amounts.debit)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-red-700 text-sm">
                                          {formatCurrency(amounts.credit)}
                                        </td>
                                      </tr>
                                    )
                                  )}
                                  <tr className="bg-blue-50 font-bold border-t-2">
                                    <td className="px-4 py-3 text-sm">TOTAL</td>
                                    <td className="px-4 py-3 text-right text-green-700 text-sm">
                                      {formatCurrency(summary.totalDebit)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-red-700 text-sm">
                                      {formatCurrency(summary.totalCredit)}
                                    </td>
                                  </tr>
                                </>
                              );
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </MobileListToggle>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="daybook">
            <Card>
              <CardHeader>
                <p className="text-sm text-gray-500">
                  Daily transaction summary
                </p>
              </CardHeader>
              <CardContent>
                <MobileListToggle title="Day Book">
                  {isMobile ? (
                    <div className="space-y-3">
                      {!Array.isArray(filteredTransactions) ||
                      filteredTransactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No transactions found
                        </div>
                      ) : (
                        filteredTransactions.map((transaction) => (
                          <Card
                            key={transaction.transaction_id}
                            className="border"
                          >
                            <CardContent className="p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  Date
                                </span>
                                <span className="text-sm font-medium">
                                  {formatDate(transaction.transaction_dat)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  Voucher
                                </span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                  {transaction.voucher_type}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  Account
                                </span>
                                <span className="text-sm font-medium">
                                  {getAccountName(transaction.acc_id)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  Remarks
                                </span>
                                <span className="text-xs text-gray-500 truncate max-w-[60%]">
                                  {transaction.remarks || "-"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  Amount
                                </span>
                                <span className="text-sm font-medium">
                                  {formatCurrency(
                                    transaction.debit || transaction.credit || 0
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  Type
                                </span>
                                {transaction.debit ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                    Debit
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                    Credit
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="max-h-[600px] overflow-auto">
                        <table className="w-full">
                          <thead className="bg-blue-50 sticky top-0">
                            <tr className="border-b">
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                Voucher
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                Particulars
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                Amount
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                Type
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {!Array.isArray(filteredTransactions) ||
                            filteredTransactions.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="text-center py-8 text-gray-500"
                                >
                                  No transactions found
                                </td>
                              </tr>
                            ) : (
                              filteredTransactions.map((transaction) => (
                                <tr
                                  key={transaction.transaction_id}
                                  className="border-b hover:bg-gray-50"
                                >
                                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {formatDate(transaction.transaction_dat)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                      {transaction.voucher_type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-sm">
                                      {highlightText(
                                        getAccountName(transaction.acc_id),
                                        filters.accountSearch
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {highlightText(
                                        transaction.remarks || "",
                                        filters.accountSearch
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right font-medium text-sm">
                                    {formatCurrency(
                                      transaction.debit ||
                                        transaction.credit ||
                                        0
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {transaction.debit ? (
                                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                        Debit
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                        Credit
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </MobileListToggle>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-[500px] sm:max-w-[500px] max-h-[85vh] overflow-y-auto px-3 py-2">
            <SheetHeader className="pb-2">
              <SheetTitle className="text-lg font-bold flex items-center justify-between w-full">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-gray-600">Txn ID</p>
                    <p className="text-base font-bold text-gray-900">
                      #{selectedTransaction?.t_id}
                    </p>
                  </div>
                  <div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-md text-[10px] font-semibold">
                      {getVoucherLabel(selectedTransaction?.voucher_type)}
                    </span>
                  </div>
                </div>
              </SheetTitle>
            </SheetHeader>

            {selectedTransaction && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Card className="p-2 flex-row items-center ">
                    <CardHeader className="pt-1">
                      <CardTitle className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Date
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatDate(selectedTransaction.transaction_dat)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="p-2 flex-row items-center ">
                    <CardHeader className="pt-1">
                      <CardTitle className="text-xs text-gray-500 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Year
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="">
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedTransaction.financial_year}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="px-0 py-4 gap-0">
                  <CardContent className="space-y-1 text-sm">
                    <div>
                      <p className="text-xs flex items-center justify-between text-gray-500">
                        Name
                        <span className="font-semibold text-gray-900">
                          {getAccountName(selectedTransaction.acc_id)}
                        </span>
                      </p>
                    </div>
                    {getAccountDetails(selectedTransaction.acc_id) && (
                      <>
                        {getAccountDetails(selectedTransaction.acc_id)
                          .headName && (
                          <div>
                            <p className="text-xs flex items-center justify-between text-gray-500">
                              Head
                              <span className="text-gray-700">
                                {
                                  getAccountDetails(selectedTransaction.acc_id)
                                    .headName
                                }
                              </span>
                            </p>
                          </div>
                        )}
                        {getAccountDetails(selectedTransaction.acc_id)
                          .subheadName && (
                          <div>
                            <p className="text-xs flex items-center justify-between text-gray-500">
                              Subhead
                              <span className="text-gray-700">
                                {
                                  getAccountDetails(selectedTransaction.acc_id)
                                    .subheadName
                                }
                              </span>
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    <div>
                      <p className="text-xs flex items-center justify-between text-gray-500">
                        Account ID
                        <span className="text-gray-700">
                          {selectedTransaction.acc_id}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-2">
                  <Card className="px-0 py-2 flex-row items-center justify-between border-green-100 bg-green-50">
                    <CardHeader className="">
                      <CardTitle className="text-xs font-semibold text-green-800 flex items-center gap-1">
                        <TrendingUp className="h-5 w-5" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm font-bold text-green-700">
                        {selectedTransaction.debit
                          ? `Rs. ${formatCurrency(selectedTransaction.debit)}`
                          : "Rs. 0.00"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="px-0 py-2 flex-row items-center justify-between border-red-100 bg-red-50">
                    <CardHeader className="">
                      <CardTitle className="text-xs font-semibold text-red-800 flex items-center gap-1">
                        <TrendingDown className="h-5 w-5" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm font-bold text-red-700">
                        {selectedTransaction.credit
                          ? `Rs. ${formatCurrency(selectedTransaction.credit)}`
                          : "Rs. 0.00"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {selectedTransaction.reference && (
                  <Card className="px-0 py-2 flex-row items-center justify-between">
                    <CardHeader className="pb-0">
                      <CardTitle className="text-xs text-gray-600">
                        Reference
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-900">
                        {selectedTransaction.reference}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {selectedTransaction.remarks && (
                  <Card className="px-0 py-2 flex-row items-center justify-between">
                    <CardHeader className="pb-0">
                      <CardTitle className="text-xs  text-gray-600">
                        Remarks
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-700">
                        {selectedTransaction.remarks}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card className="px-0 py-2 gap-0 bg-gray-50">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs font-semibold text-gray-600">
                      Additional Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Voucher:</span>
                      <span className="font-semibold text-gray-900">
                        {getVoucherLabel(selectedTransaction.voucher_type)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span
                        className={`font-semibold ${
                          selectedTransaction.debit
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {selectedTransaction.debit ? "Debit" : "Credit"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Net:</span>
                      <span className="font-bold text-gray-900">
                        Rs.{" "}
                        {formatCurrency(
                          (selectedTransaction.debit || 0) -
                            (selectedTransaction.credit || 0)
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}
