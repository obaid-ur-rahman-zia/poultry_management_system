"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState({
    transactions: [],
    accounts: [],
    units: [],
    products: [],
    trades: [],
    unitSales: [],
    unitExpenses: [],
    flocs: [],
    loading: true,
  });

  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        transactionsRes,
        accountsRes,
        unitsRes,
        productsRes,
        tradesRes,
        unitSalesRes,
        unitExpensesRes,
        flocsRes,
      ] = await Promise.all([
        fetch("/api/transaction/readAll"),
        fetch("/api/account/accounts/readAll"),
        fetch("/api/unit/readAll"),
        fetch("/api/product/readAll"),
        fetch("/api/trading/readAll"),
        fetch("/api/unitSale/readAll"),
        fetch("/api/unitExpense/readAll"),
        fetch("/api/floc/readAll"),
      ]);

      const transactionsData = await transactionsRes.json();
      const accountsData = await accountsRes.json();
      const unitsData = await unitsRes.json();
      const productsData = await productsRes.json();
      const tradesData = await tradesRes.json();
      const unitSalesData = await unitSalesRes.json();
      const unitExpensesData = await unitExpensesRes.json();
      const flocsData = await flocsRes.json();

      setDashboardData({
        transactions:
          transactionsData?.response_result?.data ||
          transactionsData?.response_result ||
          [],
        accounts:
          accountsData?.response_result?.data ||
          accountsData?.response_result ||
          [],
        units:
          unitsData?.response_result?.data ||
          unitsData?.response_result ||
          [],
        products:
          productsData?.response_result?.products ||
          productsData?.response_result?.data ||
          productsData?.response_result ||
          [],
        trades:
          tradesData?.response_result?.data ||
          tradesData?.response_result ||
          [],
        unitSales:
          unitSalesData?.response_result?.data ||
          unitSalesData?.response_result ||
          [],
        unitExpenses:
          unitExpensesData?.response_result?.data ||
          unitExpensesData?.response_result ||
          [],
        flocs:
          flocsData?.response_result?.data ||
          flocsData?.response_result ||
          [],
        loading: false,
      });
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setDashboardData((prev) => ({ ...prev, loading: false }));
    }
  };

  // Calculate statistics
  const transactions = dashboardData.transactions || [];
  const accounts = dashboardData.accounts || [];
  const units = dashboardData.units || [];
  const products = dashboardData.products || [];
  const trades = dashboardData.trades || [];
  const unitSales = dashboardData.unitSales || [];
  const unitExpenses = dashboardData.unitExpenses || [];
  const flocs = dashboardData.flocs || [];

  // Transaction statistics
  const totalDebit = transactions.reduce(
    (sum, t) => sum + (Number(t.debit) || 0),
    0
  );
  const totalCredit = transactions.reduce(
    (sum, t) => sum + (Number(t.credit) || 0),
    0
  );
  const netBalance = totalDebit - totalCredit;

  // Trading statistics
  const totalBuyAmount = trades.reduce(
    (sum, t) => sum + (Number(t.buy_total) || 0),
    0
  );
  const totalSaleAmount = trades.reduce(
    (sum, t) => sum + (Number(t.sale_total) || 0),
    0
  );
  const tradingProfit = totalSaleAmount - totalBuyAmount;

  // Unit Sales statistics
  const totalUnitSales = unitSales.reduce(
    (sum, s) => sum + (Number(s.total) || 0),
    0
  );
  const totalUnitExpenses = unitExpenses.reduce(
    (sum, e) => sum + (Number(e.total) || 0),
    0
  );
  const unitNetProfit = totalUnitSales - totalUnitExpenses;

  // Active accounts
  const activeAccounts = accounts.filter((a) => a.status === 1).length;
  const totalAccounts = accounts.length;

  // Active units
  const activeUnits = units.filter((u) => u.status === 1).length;
  const totalUnits = units.length;

  // Active flocs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeFlocs = flocs.filter((f) => {
    if (!f.ending_date) return true;
    const endDate = new Date(f.ending_date);
    endDate.setHours(0, 0, 0, 0);
    return endDate > today;
  }).length;

  // Monthly transaction data
  const monthlyTransactionData = generateMonthlyData(transactions);
  const monthlyTradingData = generateMonthlyTradingData(trades);

  // Transaction type breakdown
  const transactionTypeData = [
    {
      name: "Cash Receipt",
      value: transactions.filter((t) => t.voucher_type === "CR").length,
      color: "#10b981",
    },
    {
      name: "Cash Payment",
      value: transactions.filter((t) => t.voucher_type === "CP").length,
      color: "#ef4444",
    },
    {
      name: "Bank Receipt",
      value: transactions.filter((t) => t.voucher_type === "BR").length,
      color: "#3b82f6",
    },
    {
      name: "Bank Payment",
      value: transactions.filter((t) => t.voucher_type === "BP").length,
      color: "#f59e0b",
    },
    {
      name: "Journal Voucher",
      value: transactions.filter((t) => t.voucher_type === "JV").length,
      color: "#8b5cf6",
    },
  ].filter((item) => item.value > 0);

  if (dashboardData.loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <Button
          onClick={fetchDashboardData}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Debit
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rs. {totalDebit.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {transactions.filter((t) => t.debit > 0).length} transactions
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
              Rs. {totalCredit.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {transactions.filter((t) => t.credit > 0).length} transactions
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
                netBalance >= 0 ? "text-blue-600" : "text-orange-600"
              }`}
            >
              Rs. {Math.abs(netBalance).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {netBalance >= 0 ? "Surplus" : "Deficit"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Trading Profit
            </CardTitle>
            <Activity className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                tradingProfit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              Rs. {Math.abs(tradingProfit).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {trades.length} trades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Unit Sales
            </CardTitle>
            <ArrowUpRight className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rs. {totalUnitSales.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {unitSales.length} sales records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Unit Expenses
            </CardTitle>
            <ArrowDownRight className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              Rs. {totalUnitExpenses.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {unitExpenses.length} expense records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Unit Net Profit
            </CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                unitNetProfit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              Rs. {Math.abs(unitNetProfit).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Net from units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Flocs
            </CardTitle>
            <Activity className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {activeFlocs} / {flocs.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Active floc operations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Transaction Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactionTypeData.length > 0 ? (
              <div className="h-64">
                <ChartContainer
                  config={transactionTypeData.reduce((acc, item) => {
                    acc[item.name.toLowerCase().replace(/\s+/g, "")] = {
                      label: item.name,
                      color: item.color,
                    };
                    return acc;
                  }, {})}
                  className="h-full w-full"
                >
                  <PieChart>
                    <Pie
                      data={transactionTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {transactionTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                No transaction data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Monthly Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ChartContainer
                config={{
                  debit: { label: "Debit", color: "#10b981" },
                  credit: { label: "Credit", color: "#ef4444" },
                }}
                className="h-full w-full"
              >
                <BarChart data={monthlyTransactionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="debit" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="credit" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trading and Unit Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trading */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Monthly Trading Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ChartContainer
                config={{
                  buy: { label: "Buy Amount", color: "#ef4444" },
                  sale: { label: "Sale Amount", color: "#10b981" },
                }}
                className="h-full w-full"
              >
                <LineChart data={monthlyTradingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="buy"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sale"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-semibold">Accounts</div>
                    <div className="text-xs text-gray-500">
                      {activeAccounts} active / {totalAccounts} total
                    </div>
                  </div>
                </div>
                <Badge variant="outline">
                  {totalAccounts > 0
                    ? Math.round((activeAccounts / totalAccounts) * 100)
                    : 0}%
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-sm font-semibold">Units</div>
                    <div className="text-xs text-gray-500">
                      {activeUnits} active / {totalUnits} total
                    </div>
                  </div>
                </div>
                <Badge variant="outline">
                  {totalUnits > 0
                    ? Math.round((activeUnits / totalUnits) * 100)
                    : 0}%
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-sm font-semibold">Products</div>
                    <div className="text-xs text-gray-500">
                      {products.length} products available
                    </div>
                  </div>
                </div>
                <Badge variant="outline">{products.length}</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-sm font-semibold">Flocs</div>
                    <div className="text-xs text-gray-500">
                      {activeFlocs} active / {flocs.length} total
                    </div>
                  </div>
                </div>
                <Badge variant="outline">
                  {flocs.length > 0
                    ? Math.round((activeFlocs / flocs.length) * 100)
                    : 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to generate monthly transaction data
function generateMonthlyData(transactions) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return months.map((month, idx) => {
    const monthIndex = idx;
    const monthTransactions = transactions.filter((t) => {
      if (!t.transaction_dat) return false;
      const transDate = new Date(t.transaction_dat);
      return transDate.getMonth() === monthIndex;
    });

    const debit = monthTransactions.reduce(
      (sum, t) => sum + (Number(t.debit) || 0),
      0
    );
    const credit = monthTransactions.reduce(
      (sum, t) => sum + (Number(t.credit) || 0),
      0
    );

    return {
      month,
      debit,
      credit,
    };
  });
}

// Helper function to generate monthly trading data
function generateMonthlyTradingData(trades) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return months.map((month, idx) => {
    const monthIndex = idx;
    const monthTrades = trades.filter((t) => {
      if (!t.trading_date) return false;
      const tradeDate = new Date(t.trading_date);
      return tradeDate.getMonth() === monthIndex;
    });

    const buy = monthTrades.reduce(
      (sum, t) => sum + (Number(t.buy_total) || 0),
      0
    );
    const sale = monthTrades.reduce(
      (sum, t) => sum + (Number(t.sale_total) || 0),
      0
    );

    return {
      month,
      buy,
      sale,
    };
  });
}
