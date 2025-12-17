"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function SelfTransactionPage() {
    const { data: session } = useSession();
    const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            transaction_date: new Date().toISOString().split('T')[0],
            is_bank: false,
            account_id: "",
            transaction_type: "receive", // receive or pay
            amount: "",
            description: "",
        },
    });

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingTransactionId, setEditingTransactionId] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [currentBalance, setCurrentBalance] = useState(null);
    const [balanceLoading, setBalanceLoading] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [filterAccount, setFilterAccount] = useState("all");
    const [filterDate, setFilterDate] = useState("");
    const [filterType, setFilterType] = useState("all");

    const selectedAccount = watch("account_id");
    const isBank = watch("is_bank");
    const transactionType = watch("transaction_type");
    const amount = watch("amount");
    const userCashInHandAccountId = session?.user?.cashInHandAccountId?.toString();
    const selectableAccounts = userCashInHandAccountId
        ? accounts.filter((account) => account.acc_id?.toString() !== userCashInHandAccountId)
        : accounts;

    useEffect(() => {
        fetchAccounts();
        fetchTransactions();
    }, []);

    useEffect(() => {
        if (selectedAccount) {
            fetchAccountBalance(selectedAccount);
        } else {
            setCurrentBalance(null);
        }
    }, [selectedAccount]);

    const fetchAccounts = async () => {
        try {
            const response = await fetch("/api/account/accounts/readAll");
            const result = await response.json();
            if (result.response_status === "success") {
                const accountsData = result.response_result?.data || result.response_result || [];
                setAccounts(accountsData);
            }
        } catch (error) {
            console.error("Error fetching accounts:", error);
        }
    };

    const fetchAccountBalance = async (accId) => {
        if (!accId) return;
        setBalanceLoading(true);
        try {
            const response = await fetch(`/api/transaction/read/balance?acc_id=${accId}`);
            const result = await response.json();
            if (result.response_status === "success") {
                const balanceData = result.response_result;
                setCurrentBalance(balanceData);
            } else {
                setCurrentBalance(null);
            }
        } catch (error) {
            console.error("Error fetching balance:", error);
            setCurrentBalance(null);
        } finally {
            setBalanceLoading(false);
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/selfTransaction/readAll");
            const result = await response.json();
            if (result.response_status === "success") {
                const transactionsData = result.response_result?.data || result.response_result || [];
                setTransactions(transactionsData);
            } else {
                toast.error(result.response_message || "Failed to fetch transactions");
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast.error("Failed to fetch transactions");
        } finally {
            setLoading(false);
        }
    };

    const calculateNetBalance = () => {
        if (!currentBalance || !amount) return null;
        const balance = currentBalance.balance || 0;
        const amountValue = parseFloat(amount) || 0;

        if (transactionType === "receive") {
            return balance - amountValue;
        } else {
            return balance + amountValue;
        }
    };

    const onSubmit = async (data) => {
        if (!data.account_id || !data.amount || !data.transaction_date) {
            toast.error("Please fill all required fields");
            return;
        }

        const payload = {
            req_object: {
                transaction_date: data.transaction_date,
                is_bank: data.is_bank ? 1 : 0,
                account_id: parseInt(data.account_id),
                transaction_type: data.transaction_type,
                amount: parseFloat(data.amount),
                description: data.description?.trim() || "",
                ...(isEditMode && { transaction_id: editingTransactionId }),
            },
        };

        try {
            const url = "/api/selfTransaction";
            const method = isEditMode ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (result.response_status === "success") {
                toast.success(isEditMode ? "Transaction updated successfully" : "Transaction created successfully");
                reset({
                    transaction_date: new Date().toISOString().split('T')[0],
                    is_bank: false,
                    account_id: "",
                    transaction_type: "receive",
                    amount: "",
                    description: "",
                });
                setCurrentBalance(null);
                setIsEditMode(false);
                setEditingTransactionId(null);
                fetchTransactions();
            } else {
                // Show backend error message
                toast.error(result.response_message || "Failed to save transaction");
            }
        } catch (error) {
            console.error("Error saving transaction:", error);
            toast.error("Failed to save transaction");
        }
    };

    const handleEdit = (transaction) => {
        setIsEditMode(true);
        setEditingTransactionId(transaction.transaction_id);
        reset({
            transaction_date: transaction.transaction_date ? new Date(transaction.transaction_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            is_bank: transaction.is_bank === 1,
            account_id: transaction.account_id?.toString() || "",
            transaction_type: transaction.transaction_type || "receive",
            amount: transaction.amount?.toString() || "",
            description: transaction.description || "",
        });
    };

    const handleDelete = async (transactionId) => {
        if (!confirm("Are you sure you want to delete this transaction?")) {
            return;
        }

        try {
            const response = await fetch(`/api/selfTransaction?transaction_id=${transactionId}`, {
                method: "DELETE",
            });
            const result = await response.json();
            if (result.response_status === "success") {
                toast.success("Transaction deleted successfully");
                fetchTransactions();
            } else {
                toast.error(result.response_message || "Failed to delete transaction");
            }
        } catch (error) {
            console.error("Error deleting transaction:", error);
            toast.error("Failed to delete transaction");
        }
    };

    // Filter transactions
    const filteredTransactions = transactions.filter((transaction) => {
        const matchesSearch = searchQuery === "" ||
            transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            accounts.find(a => a.acc_id === transaction.account_id)?.account_nam?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesAccount = filterAccount === "all" ||
            transaction.account_id?.toString() === filterAccount;

        const matchesDate = filterDate === "" ||
            (transaction.transaction_date && new Date(transaction.transaction_date).toISOString().split('T')[0] === filterDate);

        const matchesType = filterType === "all" ||
            transaction.transaction_type === filterType;

        return matchesSearch && matchesAccount && matchesDate && matchesType;
    });

    const netBalance = calculateNetBalance();

    return (
        <div className="p-6 space-y-6">
            {/* Form Section */}
            <Card className={"max-w-4xl mx-auto"}>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="self-transaction-form">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Date */}
                            <div className="space-y-2">
                                <Label htmlFor="transaction_date">Date *</Label>
                                <Input
                                    id="transaction_date"
                                    type="date"
                                    {...register("transaction_date", {
                                        required: "Date is required",
                                    })}
                                />
                                {errors.transaction_date && (
                                    <p className="text-sm text-destructive">
                                        {errors.transaction_date.message}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Cash or Bank Radio */}
                                <div className="space-y-4">
                                    <Label>Transaction Mode</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                id="cash"
                                                name="transaction_mode"
                                                checked={!isBank}
                                                onChange={() => setValue("is_bank", false)}
                                                className="w-4 h-4"
                                            />
                                            <Label htmlFor="cash" className="cursor-pointer">Cash</Label>
                                        </div>
                                        {/* <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                id="bank"
                                                name="transaction_mode"
                                                checked={isBank}
                                                onChange={() => setValue("is_bank", true)}
                                                className="w-4 h-4"
                                            />
                                            <Label htmlFor="bank" className="cursor-pointer">Bank</Label>
                                        </div> */}
                                    </div>


                                </div>
                                    {/* Receive or Pay */}
                                    <div className="space-y-4">
                                        <Label>Transaction Action</Label>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    id="receive"
                                                    value="receive"
                                                    checked={transactionType === "receive"}
                                                    onChange={(e) => setValue("transaction_type", e.target.value)}
                                                    className="w-4 h-4"
                                                />
                                                <Label htmlFor="receive" className="cursor-pointer">Receive</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    id="pay"
                                                    value="pay"
                                                    checked={transactionType === "pay"}
                                                    onChange={(e) => setValue("transaction_type", e.target.value)}
                                                    className="w-4 h-4"
                                                />
                                                <Label htmlFor="pay" className="cursor-pointer">Pay</Label>
                                            </div>
                                        </div>
                                    </div>
                            </div>

                            {/* Account Selection */}
                            <div className="flex items-center flex-wrap justify-between gap-2">
                                <div className="space-y-2">
                                    <Label htmlFor="account_id">Account *</Label>
                                    <Controller
                                        name="account_id"
                                        control={control}
                                        rules={{ required: "Account is required" }}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {selectableAccounts.map((account) => (
                                                        <SelectItem key={account.acc_id} value={account.acc_id.toString()}>
                                                            {account.account_nam}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>
                                {errors.account_id && (
                                    <p className="text-sm text-destructive">
                                        {errors.account_id.message}
                                    </p>
                                )}
                                {/* Current Balance */}
                                {selectedAccount && (
                                    <div className="space-y-2 flex items-center gap-2">
                                        <Label>Current Balance</Label>
                                        {balanceLoading ? (
                                            <p className="text-sm text-muted-foreground">Loading...</p>
                                        ) : currentBalance ? (
                                            <div className="p-2 bg-muted rounded-md">
                                                <p className={`text-lg font-semibold ${currentBalance.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                    {currentBalance.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                                </p>
                                                {/* <p className="text-xs text-muted-foreground">
                                                Debit: {currentBalance.totalDebit?.toLocaleString() || "0.00"} | 
                                                Credit: {currentBalance.totalCredit?.toLocaleString() || "0.00"}
                                            </p> */}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No balance data</p>
                                        )}
                                    </div>
                                )}
                            </div>



                            {/* Amount */}
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    {...register("amount", {
                                        required: "Amount is required",
                                        min: { value: 0.01, message: "Amount must be greater than 0" },
                                    })}
                                    placeholder="0.00"
                                />
                                {errors.amount && (
                                    <p className="text-sm text-destructive">
                                        {errors.amount.message}
                                    </p>
                                )}
                            </div>

                            {/* Net Balance */}
                            {selectedAccount && amount && netBalance !== null && (
                                <div className="space-y-2">
                                    <Label>Net Balance</Label>
                                    <div className="p-2 bg-muted rounded-md">
                                        <p className={`text-lg font-semibold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                                            {netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {transactionType === "receive" ? "After receiving" : "After paying"} {parseFloat(amount || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                {...register("description")}
                                placeholder="Enter description"
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    reset({
                                        transaction_date: new Date().toISOString().split('T')[0],
                                        is_bank: false,
                                        account_id: "",
                                        transaction_type: "receive",
                                        amount: "",
                                        description: "",
                                    });
                                    setCurrentBalance(null);
                                    setIsEditMode(false);
                                    setEditingTransactionId(null);
                                }}
                            >
                                {isEditMode ? "Cancel Edit" : "Clear Form"}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : isEditMode ? "Update Transaction" : "Create Transaction"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Transactions List */}
            <Card>
                <CardContent>
                    {/* Filters */}
                    <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search transactions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Account</Label>
                                <Select value={filterAccount} onValueChange={setFilterAccount}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Accounts</SelectItem>
                                        {selectableAccounts.map((account) => (
                                            <SelectItem key={account.acc_id} value={account.acc_id.toString()}>
                                                {account.account_nam}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="receive">Receive</SelectItem>
                                        <SelectItem value="pay">Pay</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No transactions found
                        </div>
                    ) : (
                        <div className="relative max-h-[600px] overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="sticky top-0 bg-background z-20 border-b-2">
                                    <tr className="border-b">
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Date</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Type</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Account</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Action</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Amount</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Description</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.map((transaction) => (
                                        <tr key={transaction.transaction_id} className="hover:bg-muted/50 border-b transition-colors">
                                            <td className="p-2 align-middle whitespace-nowrap">
                                                {transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString() : "N/A"}
                                            </td>
                                            <td className="p-2 align-middle whitespace-nowrap">
                                                <Badge variant={transaction.is_bank === 1 ? "default" : "secondary"}>
                                                    {transaction.is_bank === 1 ? "Bank" : "Cash"}
                                                </Badge>
                                            </td>
                                            <td className="p-2 align-middle whitespace-nowrap">
                                                {accounts.find(a => a.acc_id === transaction.account_id)?.account_nam || "N/A"}
                                            </td>
                                            <td className="p-2 align-middle whitespace-nowrap">
                                                <Badge variant={transaction.transaction_type === "receive" ? "default" : "destructive"}>
                                                    {transaction.transaction_type === "receive" ? "Receive" : "Pay"}
                                                </Badge>
                                            </td>
                                            <td className="p-2 align-middle whitespace-nowrap font-medium">
                                                {transaction.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                            </td>
                                            <td className="p-2 align-middle">
                                                {transaction.description || "N/A"}
                                            </td>
                                            <td className="p-2 align-middle whitespace-nowrap">
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(transaction)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(transaction.transaction_id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

