import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import React from 'react'
import { ArrowLeftRight, UserCheck } from 'lucide-react'
import OppositeTransactionsPage from './opposite-transactions/page'
import SelfTransactionPage from './self-transactions/page'


const TransactionHeader = () => {
  return (
    <div>
      <Tabs defaultValue="opposite">
        <TabsList className="sticky top-16 z-50 border-b flex justify-center  h-auto w-full shadow-sm">
          {/* Flip Toggle Switch Container */}
          <div className="relative bg-slate-200/80 dark:bg-slate-900 p-1.5 rounded-full flex shadow-[inset_0px_2px_5px_rgba(0,0,0,0.1)] border border-slate-300/50 dark:border-slate-800 w-[90%] sm:w-[400px]">
            <TabsTrigger
              value="opposite"
              className="flex-1 relative z-10 flex items-center justify-center gap-2 rounded-full py-3 text-sm sm:text-base font-bold transition-all duration-300 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-[0px_4px_12px_rgba(37,99,235,0.4)] data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-500 hover:data-[state=inactive]:text-slate-700 dark:data-[state=inactive]:text-slate-400"
            >
              <ArrowLeftRight className="size-4" />
              Opposite
            </TabsTrigger>
            <TabsTrigger
              value="self"
              className="flex-1 relative z-10 flex items-center justify-center gap-2 rounded-full py-3 text-sm sm:text-base font-bold transition-all duration-300 data-[state=active]:!bg-blue-600 data-[state=active]:!text-white data-[state=active]:shadow-[0px_4px_12px_rgba(37,99,235,0.4)] data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-500 hover:data-[state=inactive]:text-slate-700 dark:data-[state=inactive]:text-slate-400"
            >
              <UserCheck className="size-4" />
              Self
            </TabsTrigger>
          </div>
        </TabsList>
        <TabsContent value="opposite" forceMount className="data-[state=inactive]:hidden">
          <OppositeTransactionsPage />
        </TabsContent>
        <TabsContent value="self" forceMount className="data-[state=inactive]:hidden">
          <SelfTransactionPage />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const TransactionLayout = ({ children }) => {
  return (
    <div>
      <TransactionHeader />
    </div>
  )
}

export default TransactionLayout