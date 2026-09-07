"use client";

import { useState } from "react";
import TrialBalanceReport from "./TrialBalanceReport";
import SaleDetailReport from "./SaleDetailReport";
import CustomerLedgerReport from "./CustomerLedgerReport";
import ShopProfitReport from "./shopSaleProfitReport"

export default function ShopReportsTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 lg:gap-6 p-4">
      {/* Trial Balance Report Card & Modal */}
      <div className="h-full">
        <TrialBalanceReport />
      </div>

      {/* Sale Detail Report Card & Modal */}
      <div className="h-full">
        <SaleDetailReport />
      </div>

      {/* Customer Ledger Report Card & Modal */}
      <div className="h-full">
        <CustomerLedgerReport />
      </div>

      {/* Shop Sale Profit Report Card & Modal */}
      <div className="h-full">
        <ShopProfitReport />
      </div>
    </div>
  );
}
