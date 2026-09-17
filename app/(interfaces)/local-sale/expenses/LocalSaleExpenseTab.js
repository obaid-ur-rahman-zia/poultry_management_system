"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LocalSaleAddExpense from "./LocalSaleAddExpense";
import LocalSaleAddExpenseHead from "./LocalSaleAddExpenseHead";

export default function LocalSaleExpenseTab() {
    return (
        <div className="p-2">
            <Tabs defaultValue="add-expense">
                <TabsList className="mb-4">
                    <TabsTrigger value="add-expense">Add Expense</TabsTrigger>
                    <TabsTrigger value="add-subhead">Add Expense Head/Account</TabsTrigger>
                </TabsList>
                <TabsContent value="add-expense">
                    <LocalSaleAddExpense />
                </TabsContent>
                <TabsContent value="add-subhead">
                    <LocalSaleAddExpenseHead />
                </TabsContent>
            </Tabs>
        </div>
    );
}
