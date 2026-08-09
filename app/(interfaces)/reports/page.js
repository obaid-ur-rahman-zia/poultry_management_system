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
    id: "account-reports",
    title: "Account Reports",
    description:
      "View ledgers, trial balances, balance sheets, and full transaction history.",
    buttonLabel: "Accounting",
    href: "/reports/accountReports",
    icon: Wallet,
  },
  {
    id: "trading-reports",
    title: "Trading Reports",
    description: "View wholesale and other major trading transaction reports.",
    buttonLabel: "Trade",
    href: "/reports/trading",
    icon: ShoppingCart,
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
        <h1 className="text-4xl font-bold text-gray-900  tracking-tight flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-emerald-500" />
          Reports Center
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
