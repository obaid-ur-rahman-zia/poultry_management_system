"use client";

import Link from "next/link";
import {
  Wallet,
  LayoutGrid,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const reportCategories = [
  
  {
    id: "trading-reports",
    title: "WHOLESALE REPORTS",
    description: "View wholesale and other major trading transaction reports.",
    buttonLabel: "WHOLESALE",
    href: "/reports/trading",
    icon: ShoppingCart,
  },
  {
    id: "account-reports",
    title: "LOCALSALE REPORTS",
    description:
      "View ledgers, trial balances, balance sheets, and full transaction history.",
    buttonLabel: "LOCALSALE",
    href: "/reports/accountReports",
    icon: Wallet,
  },
  {
    id: "farming-reports",
    title: "Farming Reports",
    description:
      "Access unit expense, unit income, and trading reports related to farming.",
    buttonLabel: "Farming",
    href: "/reports/farming",
    icon: LayoutGrid,
  },
];

export default function ReportsLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-10 px-4 flex flex-col items-center overflow-x-hidden">
      <div className="max-w-5xl mx-auto mb-5 text-center">
        <h1 className="text-6xl font-bold text-gray-900  tracking-tight flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-emerald-500" />
          REPORTS CENTER
        </h1>
        <p className="text-gray-500 text-sm">
          Select a category to view reports
        </p>
      </div>

      <div className="w-full max-w-4xl mx-auto flex flex-wrap justify-center gap-3">
        {reportCategories.map((category) => {
          const Icon = category.icon;

          return (
            <Button
              key={category.id}
              asChild
              size="lg"
              className="min-w-40 gap-2 border-green-900 bg-green-900 text-white hover:bg-green-800 hover:text-white p-10"
            >
              <Link href={category.href}>
                <Icon className="h-8 w-8" />
                {category.buttonLabel}
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
