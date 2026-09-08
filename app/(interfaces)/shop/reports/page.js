"use client";

import ShopReportsTab from "./ShopReportsTab";

export default function ShopReportsPage() {
  return (
    <div className="flex-1 w-full flex flex-col min-h-0 bg-background text-foreground  overflow-hidden">
      <div className="flex-none p-4 md:p-6 border-b">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Shop Reports</h1>
          <p className="text-sm text-muted-foreground">
            View and manage trial balance, sales details, and profit reports.
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <ShopReportsTab />
      </div>
    </div>
  );
}
