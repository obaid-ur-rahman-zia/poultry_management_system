import SubheadTrialBalance from "./subheadTrialBalance/page";
import ExpenseHeadTrialBalance from "./expenseHeadTrialBalance/page";
import BalanceSheet from "./balanceSheet/page";
import WholeSaleReport from "./wholeSaleDetailReport/page";
import WholeSaleProfit from "./wholeSaleProfit/page";
import LocalSaleReport from "./localSaleDetailReport/page";
import LocalSaleProfit from "./localSaleProfit/page";
import AccountLedger from "../accountReports/accountLedger/page"
import Link from "next/link";
import { FileText } from "lucide-react";

export default function ReportPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <WholeSaleReport />
          <WholeSaleProfit />
          <LocalSaleReport />
          <LocalSaleProfit />
          <BalanceSheet />
          <AccountLedger />

          <SubheadTrialBalance />
          <ExpenseHeadTrialBalance />
          <Link href="/reports/accountReports/transactions">
            <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>

                <h3 className="text-3xl font-semibold text-gray-900 mb-2">
                  Transaction History
                </h3>
                <p className="text-xl text-gray-600 leading-relaxed">
                  View all sales, purchases, and voucher transactions
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
