import UnitSaleDetail from "./incomeDetailReport/page";
import UnitSaleFloc from "./incomeDetailFloc/page";
import UnitSaleCustomer from "./incomeDetailCustomer/page";
import MonthlyIncomeProfit from "./monthlyIncomeProfit/page";
import MonthlyIncomeProfitFloc from "./monthlyIncomeProfitFloc/page";
import WholeSaleReport from "./wholeSaleDetailReport/page";
export default function ReportPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UnitSaleDetail />
          <UnitSaleCustomer />
          <UnitSaleFloc />
          <MonthlyIncomeProfit />
          <MonthlyIncomeProfitFloc />
          <WholeSaleReport />
        </div>
      </div>
    </main>
  );
}
