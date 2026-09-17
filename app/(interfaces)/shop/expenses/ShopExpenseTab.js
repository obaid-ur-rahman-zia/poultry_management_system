"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShopAddExpense from "./ShopAddExpense";
import ShopAddExpenseHead from "./ShopAddExpenseHead";

export default function ShopExpenseTab() {
    return (
        <div className="p-2">
            <Tabs defaultValue="add-expense">
                <TabsList className="mb-4">
                    <TabsTrigger value="add-expense">Add Expense</TabsTrigger>
                    <TabsTrigger value="add-subhead">Add Expense Head/Account</TabsTrigger>
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
