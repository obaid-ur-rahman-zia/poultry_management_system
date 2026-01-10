"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { Plus, Search, Edit2, Trash2, PlusCircle } from "lucide-react";
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
import { Combobox } from "@/components/ui/combobox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import MobileListToggle from "@/app/(interfaces)/components/MobileListToggle";

export default function OppositeTransactionsPage() {
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
            paid_by: "",
            bank_account: "",
            received_by: "",
            amount: "",
            description: "",
        },
    });

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingTransactionId, setEditingTransactionId] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [subHeads, setSubHeads] = useState([]);
    const [accountHeads, setAccountHeads] = useState([]);
    const [isBankAccountDialogOpen, setIsBankAccountDialogOpen] = useState(false);
    const [newBankAccountName, setNewBankAccountName] = useState("");
    const [newBankAccountNo, setNewBankAccountNo] = useState("");
    const [bankSubHead, setBankSubHead] = useState(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [filterPaidBy, setFilterPaidBy] = useState("all");
    const [filterReceivedBy, setFilterReceivedBy] = useState("all");
    const [filterDate, setFilterDate] = useState("");
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        fetchAccounts();
        fetchSubHeads();
        fetchAccountHeads();
        fetchTransactions();
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.matchMedia("(max-width: 768px)").matches);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const fetchAccountHeads = async () => {
        try {
            const response = await fetch("/api/account/accountHead/readAll");
            const result = await response.json();
            if (result.response_status === "success") {
                const headsData = result.response_result?.data || result.response_result || [];
                setAccountHeads(headsData);
            }
        } catch (error) {
            console.error("Error fetching account heads:", error);
        }
    };

    const fetchSubHeads = async () => {
        try {
            const response = await fetch("/api/account/accountSubHead/readAll");
            const result = await response.json();
            if (result.response_status === "success") {
                const subHeadsData = result.response_result?.data || result.response_result || [];
                setSubHeads(subHeadsData);
            }
        } catch (error) {
            console.error("Error fetching subheads:", error);
        }
    };

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

    useEffect(() => {
        if (subHeads.length > 0 && accounts.length > 0) {
            // Filter bank accounts by subhead name containing "bank"
            const foundBankSubHead = subHeads.find(sh => 
                sh.subhead_nam?.toLowerCase().includes("bank")
            );
            if (foundBankSubHead) {
                setBankSubHead(foundBankSubHead);
                const bankAccs = accounts.filter(acc => acc.sub_id === foundBankSubHead.sub_id);
                setBankAccounts(bankAccs);
            } else {
                setBankSubHead(null);
                setBankAccounts([]);
            }
        }
    }, [subHeads, accounts]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/oppositeTransaction/readAll");
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

    const handleAddBankAccount = async () => {
        if (!newBankAccountName.trim()) {
            toast.error("Account name is required");
            return;
        }

        if (!bankSubHead) {
            toast.error("Bank account type not found. Please create a bank account type (subhead) first.");
            return;
        }

        try {
            const payload = {
                req_object: {
                    head_id: bankSubHead.head_id,
                    sub_id: bankSubHead.sub_id,
                    account_nam: newBankAccountName.trim(),
                    account_no: newBankAccountNo?.trim() || null,
                    account_contact: JSON.stringify([""]),
                    account_address: null,
                    account_reference: null,
                    insert_by: "user",
                    update_by: "user",
                    status: 1,
                },
            };

            const response = await fetch("/api/account/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (result.response_status === "success") {
                toast.success("Bank account created successfully");
                await fetchAccounts();
                const newAccount = result.response_result;
                if (newAccount && newAccount.acc_id) {
                    setValue("bank_account", newAccount.acc_id.toString());
                }
                setNewBankAccountName("");
                setNewBankAccountNo("");
                setIsBankAccountDialogOpen(false);
            } else {
                toast.error(result.response_message || "Failed to create bank account");
            }
        } catch (error) {
            console.error("Error creating bank account:", error);
            toast.error("Failed to create bank account");
        }
    };

    const onSubmit = async (data) => {
        if (!data.paid_by || !data.received_by || !data.amount || !data.transaction_date) {
            toast.error("Please fill all required fields");
            return;
        }

        const payload = {
            req_object: {
                transaction_date: data.transaction_date,
                paid_by: parseInt(data.paid_by),
                bank_account: data.bank_account ? parseInt(data.bank_account) : null,
                received_by: parseInt(data.received_by),
                amount: parseFloat(data.amount),
                description: data.description?.trim() || "",
                ...(isEditMode && { transaction_id: editingTransactionId }),
            },
        };

        try {
            const url = "/api/oppositeTransaction";
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
                    paid_by: "",
                    bank_account: "",
                    received_by: "",
                    amount: "",
                    description: "",
                });
                setIsEditMode(false);
                setEditingTransactionId(null);
                fetchTransactions();
            } else {
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
            paid_by: transaction.paid_by?.toString() || "",
            bank_account: transaction.bank_account?.toString() || "",
            received_by: transaction.received_by?.toString() || "",
            amount: transaction.amount?.toString() || "",
            description: transaction.description || "",
        });
    };

    const handleDelete = async (transactionId) => {
        if (!confirm("Are you sure you want to delete this transaction?")) {
            return;
        }

        try {
            const response = await fetch(`/api/oppositeTransaction?transaction_id=${transactionId}`, {
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
            accounts.find(a => a.acc_id === transaction.paid_by)?.account_nam?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            accounts.find(a => a.acc_id === transaction.received_by)?.account_nam?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesPaidBy = filterPaidBy === "all" ||
            transaction.paid_by?.toString() === filterPaidBy;

        const matchesReceivedBy = filterReceivedBy === "all" ||
            transaction.received_by?.toString() === filterReceivedBy;

        const matchesDate = filterDate === "" ||
            (transaction.transaction_date && new Date(transaction.transaction_date).toISOString().split('T')[0] === filterDate);

        return matchesSearch && matchesPaidBy && matchesReceivedBy && matchesDate;
    });

  return (
        <div className="p-6 space-y-6">
            {/* Form Section */}
            <Card className={"max-w-xl mx-auto"}>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="opposite-transaction-form">
                        <div className="grid grid-cols-1  gap-4">
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

                            {/* Paid By */}
                            <div className="space-y-2">
                                <Label htmlFor="paid_by">Paid By *</Label>
                                <Controller
                                    name="paid_by"
                                    control={control}
                                    rules={{ required: "Paid by is required" }}
                                    render={({ field }) => (
                                        <Combobox
                                            options={accounts.map((account) => ({
                                                value: account.acc_id.toString(),
                                                label: account.account_nam,
                                            }))}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="Select account"
                                            searchPlaceholder="Search accounts..."
                                            emptyText="No account found."
                                        />
                                    )}
                                />
                                {errors.paid_by && (
                                    <p className="text-sm text-destructive">
                                        {errors.paid_by.message}
                                    </p>
                                )}
                            </div>

                            {/* Bank Account */}
                            <div className="space-y-2">
                                <Label htmlFor="bank_account">Bank Account</Label>
                                <div className="flex gap-2">
                                    <Controller
                                        name="bank_account"
                                        control={control}
                                        render={({ field }) => (
                                            <div className="flex-1">
                                                <Combobox
                                                    options={bankAccounts.map((account) => ({
                                                        value: account.acc_id.toString(),
                                                        label: account.account_nam,
                                                    }))}
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    placeholder="Select bank"
                                                    searchPlaceholder="Search banks..."
                                                    emptyText="No bank found."
                                                />
                                            </div>
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                            if (!bankSubHead) {
                                                toast.error("Bank account type not found. Please create a bank account type (subhead) first.");
                                                return;
                                            }
                                            setIsBankAccountDialogOpen(true);
                                        }}
                                        title="Add Bank Account"
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Received By */}
                            <div className="space-y-2">
                                <Label htmlFor="received_by">Received By *</Label>
                                <Controller
                                    name="received_by"
                                    control={control}
                                    rules={{ required: "Received by is required" }}
                                    render={({ field }) => (
                                        <Combobox
                                            options={accounts.map((account) => ({
                                                value: account.acc_id.toString(),
                                                label: account.account_nam,
                                            }))}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="Select account"
                                            searchPlaceholder="Search accounts..."
                                            emptyText="No account found."
                                        />
                                    )}
                                />
                                {errors.received_by && (
                                    <p className="text-sm text-destructive">
                                        {errors.received_by.message}
                                    </p>
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
                                        paid_by: "",
                                        bank_account: "",
                                        received_by: "",
                                        amount: "",
                                        description: "",
                                    });
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
                    <MobileListToggle title="Transactions">
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
                                    <Label>Paid By</Label>
                                    <Combobox
                                        options={[
                                            { value: "all", label: "All Accounts" },
                                            ...accounts.map((account) => ({
                                                value: account.acc_id.toString(),
                                                label: account.account_nam,
                                            }))
                                        ]}
                                        value={filterPaidBy}
                                        onValueChange={setFilterPaidBy}
                                        placeholder="All Accounts"
                                        searchPlaceholder="Search accounts..."
                                        emptyText="No account found."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Received By</Label>
                                    <Combobox
                                        options={[
                                            { value: "all", label: "All Accounts" },
                                            ...accounts.map((account) => ({
                                                value: account.acc_id.toString(),
                                                label: account.account_nam,
                                            }))
                                        ]}
                                        value={filterReceivedBy}
                                        onValueChange={setFilterReceivedBy}
                                        placeholder="All Accounts"
                                        searchPlaceholder="Search accounts..."
                                        emptyText="No account found."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        value={filterDate}
                                        onChange={(e) => setFilterDate(e.target.value)}
                                    />
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
                        ) : isMobile ? (
                            <div className="space-y-3">
                                {filteredTransactions.map((transaction) => (
                                    <Card key={transaction.transaction_id} className="border">
                                        <CardContent className="p-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Date</span>
                                                <span className="text-sm font-medium">
                                                    {transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString() : "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Paid By</span>
                                                <span className="text-sm font-medium">
                                                    {accounts.find(a => a.acc_id === transaction.paid_by)?.account_nam || "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Bank Account</span>
                                                <span className="text-sm font-medium">
                                                    {transaction.bank_account ? (accounts.find(a => a.acc_id === transaction.bank_account)?.account_nam || "N/A") : "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Received By</span>
                                                <span className="text-sm font-medium">
                                                    {accounts.find(a => a.acc_id === transaction.received_by)?.account_nam || "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Amount</span>
                                                <span className="text-sm font-medium">
                                                    {transaction.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Description</span>
                                                <span className="text-sm text-gray-600 truncate max-w-[60%]">
                                                    {transaction.description || "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(transaction)}
                                                >
                                                    <Edit2 className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(transaction.transaction_id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="relative max-h-[600px] overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="sticky top-0 bg-background z-20 border-b-2">
                                        <tr className="border-b">
                                            <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Date</th>
                                            <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Paid By</th>
                                            <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Bank Account</th>
                                            <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Received By</th>
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
                                                    {accounts.find(a => a.acc_id === transaction.paid_by)?.account_nam || "N/A"}
                                                </td>
                                                <td className="p-2 align-middle whitespace-nowrap">
                                                    {transaction.bank_account ? (accounts.find(a => a.acc_id === transaction.bank_account)?.account_nam || "N/A") : "N/A"}
                                                </td>
                                                <td className="p-2 align-middle whitespace-nowrap">
                                                    {accounts.find(a => a.acc_id === transaction.received_by)?.account_nam || "N/A"}
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
                    </MobileListToggle>
                </CardContent>
            </Card>

            {/* Add Bank Account Dialog */}
            <Dialog open={isBankAccountDialogOpen} onOpenChange={setIsBankAccountDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Bank Account</DialogTitle>
                        <DialogDescription>
                            Create a new bank account under the bank account type.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="dialog_account_name">Account Name *</Label>
                            <Input
                                id="dialog_account_name"
                                placeholder="Enter bank account name"
                                value={newBankAccountName}
                                onChange={(e) => setNewBankAccountName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddBankAccount();
                                    }
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dialog_account_no">Account Number</Label>
                            <Input
                                id="dialog_account_no"
                                placeholder="Enter bank account number (optional)"
                                value={newBankAccountNo}
                                onChange={(e) => setNewBankAccountNo(e.target.value)}
                            />
                        </div>
                        {bankSubHead && (
                            <div className="text-sm text-muted-foreground">
                                Account Type: <span className="font-medium">{bankSubHead.subhead_nam}</span>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsBankAccountDialogOpen(false);
                                setNewBankAccountName("");
                                setNewBankAccountNo("");
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleAddBankAccount}
                            disabled={!newBankAccountName.trim() || !bankSubHead}
                        >
                            Create Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
