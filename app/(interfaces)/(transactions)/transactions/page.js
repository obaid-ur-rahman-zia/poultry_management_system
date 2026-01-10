import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import React from 'react'
import OppositeTransactionsPage from './opposite-transactions/page'
import SelfTransactionPage from './self-transactions/page'


const TransactionHeader = () => {
  return (
    <div>
        <Tabs defaultValue="opposite">
        <TabsList className="sticky top-16 z-50 bg-background backdrop-blur border-b">
                <TabsTrigger value="opposite" >Opposite Transactions</TabsTrigger>
                <TabsTrigger value="self">Self Transactions</TabsTrigger>
            </TabsList>
            <TabsContent value="opposite">
                <OppositeTransactionsPage />
            </TabsContent>
            <TabsContent value="self">
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