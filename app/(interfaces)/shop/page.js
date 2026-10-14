"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, PackageSearch, ReceiptText, UserPlus } from "lucide-react";
import ShopSaleTab from "./shop-sale/ShopSaleTab";
import ClosingStockTab from "./closing-stock/ClosingStockTab";
import ShopExpenseTab from "./expenses/ShopExpenseTab";
import ShopCustomerTab from "./customers/ShopCustomerTab";

export default function ShopPage() {
  const [activeTab, setActiveTab] = useState("shop-sale");
  // Bumped when a customer is added so the Shop Sale tab reloads its customer list
  const [customersVersion, setCustomersVersion] = useState(0);

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="sticky top-16 z-50 border-b flex justify-center  h-auto w-full shadow-sm bg-background/95 backdrop-blur-md">
          {/* Flip Toggle Switch Container */}
          <div className="relative bg-slate-200/80 dark:bg-slate-900 rounded-full flex shadow-[inset_0px_2px_5px_rgba(0,0,0,0.1)] border border-slate-300/50 dark:border-slate-800 w-[95%] sm:w-[900px] overflow-x-auto">
            <TabsTrigger
              value="shop-sale"
              className="flex-1 relative z-10 flex items-center justify-center gap-2 rounded-full py-3 text-sm sm:text-base font-bold transition-all duration-300 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-[0px_4px_12px_rgba(37,99,235,0.4)] data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-500 hover:data-[state=inactive]:text-slate-700 dark:data-[state=inactive]:text-slate-400 whitespace-nowrap px-4"
            >
              <Store className="size-4 shrink-0" />
              Shop Sale
            </TabsTrigger>
            <TabsTrigger
              value="closing-stock"
              className="flex-1 relative z-10 flex items-center justify-center gap-2 rounded-full py-3 text-sm sm:text-base font-bold transition-all duration-300 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-[0px_4px_12px_rgba(37,99,235,0.4)] data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-500 hover:data-[state=inactive]:text-slate-700 dark:data-[state=inactive]:text-slate-400 whitespace-nowrap px-4"
            >
              <PackageSearch className="size-4 shrink-0" />
              Enter Closing Stock
            </TabsTrigger>
            <TabsTrigger
              value="expenses"
              className="flex-1 relative z-10 flex items-center justify-center gap-2 rounded-full py-3 text-sm sm:text-base font-bold transition-all duration-300 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-[0px_4px_12px_rgba(37,99,235,0.4)] data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-500 hover:data-[state=inactive]:text-slate-700 dark:data-[state=inactive]:text-slate-400 whitespace-nowrap px-4"
            >
              <ReceiptText className="size-4 shrink-0" />
              Expenses
            </TabsTrigger>
            <TabsTrigger
              value="add-customer"
              className="flex-1 relative z-10 flex items-center justify-center gap-2 rounded-full py-3 text-sm sm:text-base font-bold transition-all duration-300 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-[0px_4px_12px_rgba(37,99,235,0.4)] data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-500 hover:data-[state=inactive]:text-slate-700 dark:data-[state=inactive]:text-slate-400 whitespace-nowrap px-4"
            >
              <UserPlus className="size-4 shrink-0" />
              Customer Addition
            </TabsTrigger>
          </div>
        </TabsList>

        <TabsContent value="shop-sale" forceMount className="data-[state=inactive]:hidden">
          <ShopSaleTab customersVersion={customersVersion} />
        </TabsContent>

        <TabsContent
          value="closing-stock"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <ClosingStockTab />
        </TabsContent>

        <TabsContent value="expenses" forceMount className="data-[state=inactive]:hidden">
          <ShopExpenseTab />
        </TabsContent>

        <TabsContent value="add-customer" forceMount className="data-[state=inactive]:hidden">
          <ShopCustomerTab onCustomerAdded={() => setCustomersVersion((v) => v + 1)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
