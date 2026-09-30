"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReceiptText, FolderPlus } from "lucide-react";
import ShopAddExpense from "./ShopAddExpense";
import ShopAddExpenseHead from "./ShopAddExpenseHead";

export default function ShopExpenseTab() {
    return (
        <div >
            <Tabs defaultValue="add-expense">
                <TabsList className="flex justify-center h-auto w-full bg-transparent shadow-none">
                    {/* Flip Toggle Switch Container */}
                    <div className="relative bg-slate-200/80 dark:bg-slate-900 rounded-full flex shadow-[inset_0px_2px_5px_rgba(0,0,0,0.1)] border border-slate-300/50 dark:border-slate-800 w-full sm:w-[600px] overflow-x-auto">
                        <TabsTrigger
                            value="add-expense"
                            className="flex-1 relative z-10 flex items-center justify-center gap-2 rounded-full py-3 text-sm sm:text-base font-bold transition-all duration-300 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-[0px_4px_12px_rgba(37,99,235,0.4)] data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-500 hover:data-[state=inactive]:text-slate-700 dark:data-[state=inactive]:text-slate-400 whitespace-nowrap px-4"
                        >
                            <ReceiptText className="size-4 shrink-0" />
                            Add Expense
                        </TabsTrigger>
                        <TabsTrigger
                            value="add-subhead"
                            className="flex-1 relative z-10 flex items-center justify-center gap-2 rounded-full py-3 text-sm sm:text-base font-bold transition-all duration-300 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-[0px_4px_12px_rgba(37,99,235,0.4)] data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-500 hover:data-[state=inactive]:text-slate-700 dark:data-[state=inactive]:text-slate-400 whitespace-nowrap px-4"
                        >
                            <FolderPlus className="size-4 shrink-0" />
                            Add Expense Head/Account
                        </TabsTrigger>
                    </div>
                </TabsList>
                <TabsContent value="add-expense">
                    <ShopAddExpense />
                </TabsContent>
                <TabsContent value="add-subhead">
                    <ShopAddExpenseHead />
                </TabsContent>
            </Tabs>
        </div>
    );
}
