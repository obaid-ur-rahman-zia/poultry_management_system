
// import AccountLedger from "./accountLedger/page";
import LocalSaleReport from "../trading/localSaleDetailReport/page"
// import TrialBalance from "./trialBalance/page";

export default function ReportPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LocalSaleReport />
          {/* <AccountLedger /> */}
          {/* <TrialBalance /> */}
        </div>
      </div>
    </main>
  );
}
