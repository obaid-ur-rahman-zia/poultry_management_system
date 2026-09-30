import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import React from 'react'
import { ReceiptText, FolderPlus } from 'lucide-react'
import AddSubHeadPage from './add-subhead/page'
import AddExpensePage from './add-expense/page'


const ExpenseHeader = () => {
    return (
        <div>
            <Tabs defaultValue="opposite">
                <TabsList className="sticky top-16 z-50 border-b flex justify-center h-auto w-full shadow-sm bg-background/95 backdrop-blur-md">
                    {/* Flip Toggle Switch Container */}
                    <div className="relative bg-slate-200/80 dark:bg-slate-900 p-1.5 rounded-full flex shadow-[inset_0px_2px_5px_rgba(0,0,0,0.1)] border border-slate-300/50 dark:border-slate-800 w-[95%] sm:w-[600px] overflow-x-auto">
                        <TabsTrigger
                            value="opposite"
                            className="flex-1 relative z-10 flex items-center justify-center gap-2 rounded-full py-3 text-sm sm:text-base font-bold transition-all duration-300 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-[0px_4px_12px_rgba(37,99,235,0.4)] data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-500 hover:data-[state=inactive]:text-slate-700 dark:data-[state=inactive]:text-slate-400 whitespace-nowrap px-4"
                        >
                            <ReceiptText className="size-4 shrink-0" />
                            Add Expense
                        </TabsTrigger>
                        <TabsTrigger
                            value="self"
                            className="flex-1 relative z-10 flex items-center justify-center gap-2 rounded-full py-3 text-sm sm:text-base font-bold transition-all duration-300 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-[0px_4px_12px_rgba(37,99,235,0.4)] data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-500 hover:data-[state=inactive]:text-slate-700 dark:data-[state=inactive]:text-slate-400 whitespace-nowrap px-4"
                        >
                            <FolderPlus className="size-4 shrink-0" />
                            Add Expense Head/Account
                        </TabsTrigger>
                    </div>
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