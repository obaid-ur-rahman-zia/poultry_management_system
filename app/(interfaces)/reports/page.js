"use client";

import Link from "next/link";
import {
  Wallet,
  Receipt,
  TrendingUp,
  ShoppingCart,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";

const reportCategories = [
  {
    id: "account-reports",
    title: "Account Reports",
    description:
      "View ledgers, trial balances, balance sheets, and full transaction history.",
    href: "/reports/accountReports",
    icon: Wallet,
    gradient: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    hoverBorder: "hover:border-emerald-400",
    hoverShadow: "hover:shadow-emerald-100",
  },
  {
    id: "expense-reports",
    title: "Unit Expense Reports",
    description:
      "Analyze expenses by detail, supplier, or flock across all units.",
    href: "/reports/expenseReports",
    icon: Receipt,
    gradient: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    hoverBorder: "hover:border-emerald-400",
    hoverShadow: "hover:shadow-emerald-100",
  },
  {
    id: "income-reports",
    title: "Unit Income Reports",
    description:
      "Track income details by customer, flock, and monthly profit summaries.",
    href: "/reports/incomeReports",
    icon: TrendingUp,
    gradient: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    hoverBorder: "hover:border-emerald-400",
    hoverShadow: "hover:shadow-emerald-100",
  },
  {
    id: "trade-reports",
    title: "Trade Reports",
    description: "Review trading activity and detailed trade records.",
    href: "/reports/tradeReports",
    icon: ShoppingCart,
    gradient: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    hoverBorder: "hover:border-emerald-400",
    hoverShadow: "hover:shadow-emerald-100",
  },
  {
    id: "wholesale-reports",
    title: "Wholesale Reports",
    description:
      "Examine wholesale transactions, detailed reports, and profit analysis.",
    href: "/reports/wholeSaleReports",
    icon: ShoppingBag,
    gradient: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    hoverBorder: "hover:border-emerald-400",
    hoverShadow: "hover:shadow-emerald-100",
  },
];

export default function ReportsLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-5 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="max-w-5xl mx-auto mb-5 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
          Reports Center
        </h1>
      </div>

      {/* Report Category Cards */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {reportCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.id}
              href={category.href}
              className="group block"
            >
              <div
                className={`relative h-full bg-white rounded-2xl border border-gray-200 ${category.hoverBorder} ${category.hoverShadow} hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer`}
              >
                {/* Top gradient bar */}
                <div
                  className={`h-1.5 w-full bg-gradient-to-r ${category.gradient}`}
                />

                <div className="p-6 flex flex-col h-full">
                  {/* Icon + Badge row */}
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className={`p-3 ${category.lightBg} rounded-xl group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className={`w-7 h-7 ${category.iconColor}`} />
                    </div>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${category.badgeColor}`}
                    >
                      {category.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                    {category.title}
                  </h2>

                  {/* Description */}
                  {/* <p className="text-sm text-gray-500 leading-relaxed flex-1">
                    {category.description}
                  </p> */}

                  {/* CTA row */}
                  <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-gray-400 group-hover:text-gray-700 transition-colors">
                    <span>Open Reports</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
