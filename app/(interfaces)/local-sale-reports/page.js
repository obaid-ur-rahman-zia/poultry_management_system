"use client";
import React, { useState, useEffect } from "react";
import LocalSaleReport from "./localSaleDetailReport/page"
import LocalSaleProfit from "./localSaleProfit/page"
import AccountLedgerModal from "../reports/accountReports/accountLedger/page"
import BalanceSheetReport from "../reports/trading/balanceSheet/page"
import LocalPurchaserTrialBalanceModal from "./localPurchaserTrialBalance/page"
import LocalSaleExpenseReport from "./localSaleExpenseReport/page"

export default function ReportPage() {
    const [initialAccounts, setInitialAccounts] = useState(null);
    const [initialSubHeads, setInitialSubHeads] = useState(null);

    useEffect(() => {
        // Fetch accounts
        fetch("/api/account/accounts/readAll?all=true")
            .then(res => res.json())
            .then(result => {
                if (result.response_status === "success" || result.response_code === 200) {
                    setInitialAccounts(result.response_result?.data || result.response_result || []);
                }
            })
            .catch(err => console.error("Failed to fetch accounts in ReportPage:", err));

        // Fetch account subheads
        fetch("/api/account/accountSubHead/readAll")
            .then(res => res.json())
            .then(result => {
                if (result.response_status === "success" || result.response_code === 200) {
                    setInitialSubHeads(result.response_result?.data || result.response_result || []);
                }
            })
            .catch(err => console.error("Failed to fetch account subheads in ReportPage:", err));
    }, []);

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <LocalSaleReport initialAccounts={initialAccounts} />
                    <LocalSaleProfit initialAccounts={initialAccounts} />
                    <AccountLedgerModal initialAccounts={initialAccounts} initialSubHeads={initialSubHeads} />
                    <LocalPurchaserTrialBalanceModal />
                    <BalanceSheetReport initialAccounts={initialAccounts} />
                    <LocalSaleExpenseReport />
                </div>
            </div>
        </main>
    );
}
