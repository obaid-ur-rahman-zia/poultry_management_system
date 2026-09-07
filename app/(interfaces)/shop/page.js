"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShopSaleTab from "./shop-sale/ShopSaleTab";
import ClosingStockTab from "./closing-stock/ClosingStockTab";
import ShopReportsTab from "./reports/ShopReportsTab";

export default function ShopPage() {
  const [activeTab, setActiveTab] = useState("shop-sale");

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="sticky top-16 z-50 bg-background backdrop-blur border-b">
          <TabsTrigger value="shop-sale">Shop Sale</TabsTrigger>
          <TabsTrigger value="closing-stock">Enter Closing Stock</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="shop-sale" className="p-3 sm:p-4 md:p-6 space-y-4">
          <ShopSaleTab />
        </TabsContent>

        <TabsContent
          value="closing-stock"
          className="p-3 sm:p-4 md:p-6 space-y-4"
        >
          <ClosingStockTab />
        </TabsContent>

        <TabsContent value="reports" className="p-3 sm:p-4 md:p-6 space-y-4">
          <ShopReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
