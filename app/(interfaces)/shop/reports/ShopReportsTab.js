"use client";

import { useState, useEffect } from "react";
import TrialBalanceReport from "./TrialBalanceReport";
import SaleDetailReport from "./SaleDetailReport";
import CustomerLedgerReport from "./CustomerLedgerReport";
import ShopProfitReport from "./shopSaleProfitReport"
import ShopExpenseReport from "./shopExpenseReport"

export default function ShopReportsTab() {
  const [initialAccounts, setInitialAccounts] = useState(null);

  useEffect(() => {
    // Fetch accounts
    fetch("/api/account/accounts/readAll?all=true")
      .then(res => res.json())
      .then(result => {
        if (result.response_status === "success" || result.response_code === 200 || result.success) {
          let accountsData = [];
          if (result.response_result?.data) accountsData = result.response_result.data;
          else if (result.response_result) accountsData = result.response_result;
          else if (result.data) accountsData = result.data;

          if (!Array.isArray(accountsData)) accountsData = [];
          setInitialAccounts(accountsData);
        }
      })
      .catch(err => console.error("Failed to fetch accounts in ShopReportsTab:", err));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 lg:gap-6 p-4">
      {/* Trial Balance Report Card & Modal */}
      <div className="h-full">
        <TrialBalanceReport initialAccounts={initialAccounts} />
      </div>

      {/* Sale Detail Report Card & Modal */}
      <div className="h-full">
        <SaleDetailReport initialAccounts={initialAccounts} />
      </div>

      {/* Customer Ledger Report Card & Modal */}
      <div className="h-full">
        <CustomerLedgerReport />
      </div>

      {/* Shop Sale Profit Report Card & Modal */}
      <div className="h-full">
        <ShopProfitReport initialAccounts={initialAccounts} />
      </div>

      {/* Shop Expense Report Card & Modal */}
      <div className="h-full">
        <ShopExpenseReport />
      </div>
    </div>
  );
}
