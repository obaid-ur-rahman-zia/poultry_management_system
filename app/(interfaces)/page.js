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
  Activity,
  RefreshCw,
  Sparkles,
  Scale,
  Package,
  ShoppingCart,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedDays, setSelectedDays] = useState(1);
  const [loading, setLoading] = useState(true);

  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    fetchDashboardData(selectedDays);
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData(selectedDays);
    }, 300000);
    return () => clearInterval(interval);
  }, [selectedDays]);

  const fetchDashboardData = async (days = selectedDays) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?days=${days}`);
      const result = await response.json();
      if (result.response_status !== "success") {
        throw new Error(result.response_message || "Failed to fetch analytics");
      }
      setDashboardData(result.response_result);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const wholesale = dashboardData?.metrics?.wholesale || {};
  const localSale = dashboardData?.metrics?.localSale || {};
  const counts = dashboardData?.counts || {};
  const dailyData = dashboardData?.dailyData || [];

  if (loading || !dashboardData) {
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
      className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap items-center justify-between gap-3"
      >
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
        <motion.div className="flex items-center gap-2">
          <div className="flex rounded-md border bg-white p-1" role="group" aria-label="Analytics date range">
            {[1, 7, 30].map((days) => (
              <Button
                key={days}
                type="button"
                variant={selectedDays === days ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedDays(days)}
                disabled={loading}
              >
                {days}d
              </Button>
            ))}
          </div>
          <Button
            onClick={() => fetchDashboardData(selectedDays)}
            variant="outline"
            size="sm"
            className="gap-2 shadow-sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </motion.div>
      </motion.div>

      {/* Wholesale Stats */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <MetricCard
          title="Total Purchase"
          value={wholesale.totalPurchase || 0}
          icon={ShoppingCart}
          iconColor="text-orange-600"
          valueColor="text-orange-600"
          subtitle={`${counts.wholeSales || 0} wholesale records`}
          index={0}
        />
        <MetricCard
          title="Total Sale"
          value={wholesale.totalSale || 0}
          icon={TrendingUp}
          iconColor="text-green-600"
          valueColor="text-green-600"
          subtitle={`Wholesale generated`}
          index={1}
        />
        <MetricCard
          title="Total Weight"
          value={wholesale.totalWeight || 0}
          icon={Scale}
          iconColor="text-blue-600"
          valueColor="text-blue-600"
          subtitle="Wholesale weight"
          prefix=""
          suffix=" kg"
          index={2}
        />
        <MetricCard
          title="Total Profit"
          value={wholesale.totalProfit || 0}
          icon={DollarSign}
          iconColor="text-purple-600"
          valueColor={wholesale.totalProfit >= 0 ? "text-green-600" : "text-red-600"}
          subtitle="Wholesale profit"
          index={3}
        />
      </motion.div>

      {/* Local Sale Stats */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6"
      >
        <MetricCard
          title="Total Weight (Local)"
          value={localSale.totalWeight || 0}
          icon={Scale}
          iconColor="text-blue-500"
          valueColor="text-blue-500"
          subtitle={`${counts.localSales || 0} local sale records`}
          prefix=""
          suffix=" kg"
          index={4}
        />
        <MetricCard
          title="Total Amount (Local)"
          value={localSale.totalAmount || 0}
          icon={Package}
          iconColor="text-indigo-600"
          valueColor="text-indigo-600"
          subtitle="Local sale total"
          index={5}
        />
        <MetricCard
          title="Total Received (Local)"
          value={localSale.totalReceived || 0}
          icon={TrendingDown}
          iconColor="text-teal-600"
          valueColor="text-teal-600"
          subtitle="Locally received"
          index={6}
        />
      </motion.div>

      {/* Charts */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Scale className="h-5 w-5 text-blue-600" />
                Wholesale vs Local Sale Volume
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-64">
                <ChartContainer
                  config={{
                    wholesaleWeight: { label: "Wholesale Wt", color: "#3b82f6" },
                    localSaleWeight: { label: "Local Sale Wt", color: "#8b5cf6" },
                  }}
                  className="h-full w-full"
                >
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="wholesaleWeight" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="localSaleWeight" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Daily Sales Amount Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-64">
                <ChartContainer
                  config={{
                    wholesaleAmount: { label: "Wholesale Amt", color: "#10b981" },
                    localSaleAmount: { label: "Local Sale Amt", color: "#06b6d4" },
                  }}
                  className="h-full w-full"
                >
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="wholesaleAmount" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="localSaleAmount" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-red-50">
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-orange-600" />
                Recovery / Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-64">
                <ChartContainer
                  config={{
                    selfTransactions: { label: "Self Transactions", color: "#f97316" },
                    oppositeTransactions: { label: "Opposite Transactions", color: "#ef4444" },
                  }}
                  className="h-full w-full"
                >
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="selfTransactions" fill="#f97316" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="oppositeTransactions" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function MetricCard({ title, value, icon: Icon, iconColor, valueColor, subtitle, index, isString = false, prefix = "Rs. ", suffix = "" }) {
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
        <Card className="border-0 p-4 shadow-md hover:shadow-xl transition-all duration-300 h-full bg-white">
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
              {isString ? value : `${prefix}${value.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`}
            </motion.div>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
