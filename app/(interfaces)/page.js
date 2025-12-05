"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const cardHoverVariants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -4,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    }
  },
};

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
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="h-8 w-8 text-primary" />
          </motion.div>
          <div className="text-lg font-medium">Loading dashboard...</div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkles className="h-8 w-8 text-blue-600" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            size="sm"
            className="gap-2 shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </motion.div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <MetricCard
          title="Total Debit"
          value={totalDebit}
          icon={TrendingUp}
          iconColor="text-green-600"
          valueColor="text-green-600"
          subtitle={`${transactions.filter((t) => t.debit > 0).length} transactions`}
          index={0}
        />
        <MetricCard
          title="Total Credit"
          value={totalCredit}
          icon={TrendingDown}
          iconColor="text-red-600"
          valueColor="text-red-600"
          subtitle={`${transactions.filter((t) => t.credit > 0).length} transactions`}
          index={1}
        />
        <MetricCard
          title="Net Balance"
          value={Math.abs(netBalance)}
          icon={DollarSign}
          iconColor="text-blue-600"
          valueColor={netBalance >= 0 ? "text-blue-600" : "text-orange-600"}
          subtitle={netBalance >= 0 ? "Surplus" : "Deficit"}
          index={2}
        />
        <MetricCard
          title="Trading Profit"
          value={Math.abs(tradingProfit)}
          icon={Activity}
          iconColor="text-purple-600"
          valueColor={tradingProfit >= 0 ? "text-green-600" : "text-red-600"}
          subtitle={`${trades.length} trades`}
          index={3}
        />
      </motion.div>

      {/* Secondary Metrics */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <MetricCard
          title="Unit Sales"
          value={totalUnitSales}
          icon={ArrowUpRight}
          iconColor="text-green-600"
          valueColor="text-green-600"
          subtitle={`${unitSales.length} sales records`}
          index={4}
        />
        <MetricCard
          title="Unit Expenses"
          value={totalUnitExpenses}
          icon={ArrowDownRight}
          iconColor="text-red-600"
          valueColor="text-red-600"
          subtitle={`${unitExpenses.length} expense records`}
          index={5}
        />
        <MetricCard
          title="Unit Net Profit"
          value={Math.abs(unitNetProfit)}
          icon={DollarSign}
          iconColor="text-blue-600"
          valueColor={unitNetProfit >= 0 ? "text-green-600" : "text-red-600"}
          subtitle="Net from units"
          index={6}
        />
        <MetricCard
          title="Active Flocs"
          value={`${activeFlocs} / ${flocs.length}`}
          icon={Activity}
          iconColor="text-blue-600"
          valueColor="text-blue-600"
          subtitle="Active floc operations"
          index={7}
          isString={true}
        />
      </motion.div>

      {/* Charts Row */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-lg font-semibold text-gray-800">
                Transaction Types
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
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
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-lg font-semibold text-gray-800">
                Monthly Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
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
        </motion.div>
      </motion.div>

      {/* Trading and Unit Performance */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="text-lg font-semibold text-gray-800">
                Monthly Trading Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
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
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-amber-50">
              <CardTitle className="text-lg font-semibold text-gray-800">System Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <SystemOverviewItem
                  icon={Users}
                  title="Accounts"
                  active={activeAccounts}
                  total={totalAccounts}
                  color="blue"
                />
                <SystemOverviewItem
                  icon={Package}
                  title="Units"
                  active={activeUnits}
                  total={totalUnits}
                  color="green"
                />
                <SystemOverviewItem
                  icon={Package}
                  title="Products"
                  active={products.length}
                  total={products.length}
                  color="purple"
                />
                <SystemOverviewItem
                  icon={Activity}
                  title="Flocs"
                  active={activeFlocs}
                  total={flocs.length}
                  color="orange"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function MetricCard({ title, value, icon: Icon, iconColor, valueColor, subtitle, index, isString = false }) {
  return (
    <motion.div
      variants={itemVariants}
      custom={index}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={cardHoverVariants}
        initial="rest"
        whileHover="hover"
        className="h-full"
      >
        <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {title}
            </CardTitle>
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </motion.div>
          </CardHeader>
          <CardContent>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              className={`text-2xl font-bold ${valueColor}`}
            >
              {isString ? value : `Rs. ${value.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </motion.div>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function SystemOverviewItem({ icon: Icon, title, active, total, color }) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    purple: "text-purple-600 bg-purple-50",
    orange: "text-orange-600 bg-orange-50",
  };

  const percentage = total > 0 ? Math.round((active / total) * 100) : 0;

  return (
    <motion.div
      whileHover={{ x: 4 }}
      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <div className="text-xs text-gray-500">
            {active} active / {total} total
          </div>
        </div>
      </div>
      <Badge variant="outline" className="font-semibold">
        {percentage}%
      </Badge>
    </motion.div>
  );
}

// Helper function to generate monthly transaction data
function generateMonthlyData(transactions) {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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

    return { month, debit, credit };
  });
}

// Helper function to generate monthly trading data
function generateMonthlyTradingData(trades) {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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

    return { month, buy, sale };
  });
}
