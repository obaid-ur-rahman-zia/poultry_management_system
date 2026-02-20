import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import React from 'react'
import AddSubHeadPage from './add-subhead/page'
import AddExpensePage from './add-expense/page'


const ExpenseHeader = () => {
    return (
        <div>
            <Tabs defaultValue="opposite">
                <TabsList className="sticky top-16 z-50 bg-background backdrop-blur border-b">
                    <TabsTrigger value="opposite" >Add Expense</TabsTrigger>
                    <TabsTrigger value="self">Add Expense Head/Account</TabsTrigger>
                </TabsList>
                <TabsContent value="opposite">
                    <AddExpensePage />
                </TabsContent>
                <TabsContent value="self">
                    <AddSubHeadPage />
                </TabsContent>
            </Tabs>
        </div>
    )
}

const ExpenseLayout = ({ children }) => {
    return (
        <div>
            <ExpenseHeader />
        </div>
    )
}

export default ExpenseLayout