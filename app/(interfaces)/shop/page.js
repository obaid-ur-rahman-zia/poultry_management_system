"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShopSaleTab from "./shop-sale/ShopSaleTab";
import ClosingStockTab from "./closing-stock/ClosingStockTab";
import ShopExpenseTab from "./expenses/ShopExpenseTab";

export default function ShopPage() {
  const [activeTab, setActiveTab] = useState("shop-sale");

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="sticky top-16 z-50 bg-background backdrop-blur border-b">
          <TabsTrigger value="shop-sale">Shop Sale</TabsTrigger>
          <TabsTrigger value="closing-stock">Enter Closing Stock</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="shop-sale" forceMount className="p-3 sm:p-4 md:p-6 space-y-4 data-[state=inactive]:hidden">
          <ShopSaleTab />
        </TabsContent>

        <TabsContent
          value="closing-stock"
          forceMount 
          className="p-3 sm:p-4 md:p-6 space-y-4 data-[state=inactive]:hidden"
        >
          <ClosingStockTab />
        </TabsContent>

        <TabsContent value="expenses" forceMount className="p-3 sm:p-4 md:p-6 space-y-4 data-[state=inactive]:hidden">
          <ShopExpenseTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
