"use client";

import Link from "next/link";
import {
  Receipt,
  TrendingUp,
  LineChart,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const reportCategories = [
  {
    id: "expense-reports",
    title: "Unit Expense Reports",
    buttonLabel: "Expense",
    href: "/reports/farming/expenseReports",
    icon: Receipt,
  },
  {
    id: "income-reports",
    title: "Unit Income Reports",
    buttonLabel: "Income",
    href: "/reports/farming/incomeReports",
    icon: TrendingUp,
  },
  {
    id: "trade-reports",
    title: "Trading Reports",
    buttonLabel: "Trade",
    href: "/reports/farming/tradeReports",
    icon: LineChart,
  },
];

export default function FarmingReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-10 px-4 flex flex-col items-center overflow-x-hidden">
      <div className="max-w-5xl w-full mx-auto mb-5 flex items-center justify-center relative">
        <Link href="/reports" className="absolute left-0">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shadow-sm bg-white hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-blue-500" />
            Farming Reports
          </h1>
          <p className="text-gray-500 text-sm">
            Select a category to view reports
          </p>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto flex flex-wrap justify-center gap-3">
        {reportCategories.map((category) => {
          const Icon = category.icon;

          return (
            <Button
              key={category.id}
              asChild
              size="lg"
              className="min-w-40 gap-2 border-green-900 bg-green-900 text-white hover:bg-green-800 hover:text-white"
            >
              <Link href={category.href}>
                <Icon className="h-5 w-5" />
                {category.buttonLabel}
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
