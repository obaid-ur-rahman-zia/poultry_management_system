"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { Search, Edit2, Trash2, ArrowUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import MobileListToggle from "@/app/(interfaces)/components/MobileListToggle";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";

export default function ShopAddExpense() {
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
            shop_expense_date: new Date().toISOString().split("T")[0],
            shop_subhead_id: "",
            shop_account_id: "",
            amount: "",
            description: "",
        },
    });

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingTransactionId, setEditingTransactionId] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [subHeads, setSubHeads] = useState([]);

    const [searchQuery, setSearchQuery] = useState("");
    const [isMobile, setIsMobile] = useState(false);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingTransactionId, setDeletingTransactionId] = useState(null);

    const [isGetDataModalOpen, setIsGetDataModalOpen] = useState(false);
    const [allTransactions, setAllTransactions] = useState([]);
    const [modalSearchQuery, setModalSearchQuery] = useState("");
    const [modalFilterDate, setModalFilterDate] = useState("");
    const [modalLoading, setModalLoading] = useState(false);

    const selectedSubId = watch("shop_subhead_id");

    const accountsForSubHead = selectedSubId
        ? accounts.filter((account) => account.shop_subhead_id?.toString() === selectedSubId)
        : [];

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 768px)");
        const handleResize = () => setIsMobile(mq.matches);
        handleResize();
        mq.addEventListener("change", handleResize);

        fetchAccounts();
        fetchSubHeads();
        fetchExpenseTransactions(filterDate);

        return () => mq.removeEventListener("change", handleResize);
    }, []);

    useEffect(() => {
        fetchExpenseTransactions(filterDate);
    }, [filterDate]);

    const fetchSubHeads = async () => {
        try {
            const response = await fetch("/api/shopExpense/subHeads");
            const result = await response.json();
            if (result.response_status === "success") {
                setSubHeads(result.response_result || []);
            }
        } catch (error) {
            console.error("Error fetching subheads:", error);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await fetch("/api/shopExpense/accounts");
            const result = await response.json();
            if (result.response_status === "success") {
                setAccounts(result.response_result || []);
            }
        } catch (error) {
            console.error("Error fetching accounts:", error);
        }
    };

    const fetchExpenseTransactions = async (date) => {
        setLoading(true);
        try {
            const url = date ? `/api/shopExpense/readAll?all=true&date=${date}` : `/api/shopExpense/readAll?all=true`;
            const response = await fetch(url);
            const result = await response.json();
            if (result.response_status === "success") {
                const data = result.response_result?.data || result.response_result || [];
                setTransactions(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllTransactionsForModal = async () => {
        setModalLoading(true);
        try {
            const response = await fetch(`/api/shopExpense/readAll?all=true`);
            const result = await response.json();
            if (result.response_status === "success") {
                const data = result.response_result?.data || result.response_result || [];
                setAllTransactions(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching all transactions:", error);
        } finally {
            setModalLoading(false);
        }
    };

    const handleGetData = () => {
        setModalSearchQuery("");
        setModalFilterDate("");
        fetchAllTransactionsForModal();
        setIsGetDataModalOpen(true);
    };

    const onSubmit = async (data) => {
        const payload = {
            req_object: {
                shop_expense_date: data.shop_expense_date,
                shop_account_id: parseInt(data.shop_account_id),
                amount: parseFloat(data.amount),
                description: data.description?.trim() || "",
                ...(isEditMode && { shop_expense_id: editingTransactionId }),
            },
        };

        try {
            const url = "/api/shopExpense";
            const method = isEditMode ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (result.response_status === "success") {
                toast.success(isEditMode ? "Expense updated successfully" : "Expense created successfully");
                reset({
                    shop_expense_date: data.shop_expense_date,
                    shop_subhead_id: data.shop_subhead_id,
                    shop_account_id: "",
                    amount: "",
                    description: "",
                });
                setIsEditMode(false);
                setEditingTransactionId(null);
                fetchExpenseTransactions(filterDate);
            } else {
                toast.error(result.response_message || "Failed to save expense");
            }
        } catch (error) {
            console.error("Error saving expense:", error);
            toast.error("Failed to save expense");
        }
    };

    const handleEdit = (transaction) => {
        setIsEditMode(true);
        setEditingTransactionId(transaction.shop_expense_id);
        reset({
            shop_expense_date: transaction.shop_expense_date
                ? new Date(transaction.shop_expense_date).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
            shop_subhead_id: transaction.account?.shop_subhead_id?.toString() || "",
            shop_account_id: transaction.shop_account_id?.toString() || "",
            amount: transaction.amount?.toString() || "",
            description: transaction.description || "",
        });
        setIsGetDataModalOpen(false);
    };

    const handleDelete = (transactionId) => {
        setDeletingTransactionId(transactionId);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingTransactionId) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/shopExpense?shop_expense_id=${deletingTransactionId}`, { method: "DELETE" });
            const result = await response.json();
            if (result.response_status === "success") {
                toast.success("Expense deleted successfully");
                setIsDeleteDialogOpen(false);
                setDeletingTransactionId(null);
                if (editingTransactionId === deletingTransactionId) {
                    reset({
                        shop_expense_date: new Date().toISOString().split("T")[0],
                        shop_subhead_id: "",
                        shop_account_id: "",
                        amount: "",
                        description: "",
                    });
                    setIsEditMode(false);
                    setEditingTransactionId(null);
                }
                fetchExpenseTransactions(filterDate);
            } else {
                toast.error(result.response_message || "Failed to delete expense");
            }
        } catch (error) {
            console.error("Error deleting expense:", error);
            toast.error("Failed to delete expense");
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredTransactions = transactions.filter((t) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            t.description?.toLowerCase().includes(query) ||
            t.account?.account_nam?.toLowerCase().includes(query) ||
            t.account?.subhead?.subhead_nam?.toLowerCase().includes(query) ||
            t.amount?.toString().includes(query)
        );
    });

    const grandTotal = filteredTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const modalFilteredTransactions = allTransactions.filter((t) => {
        const matchesSearch = !modalSearchQuery || (
            t.description?.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
            t.account?.account_nam?.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
            t.account?.subhead?.subhead_nam?.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
            t.amount?.toString().includes(modalSearchQuery)
        );
        const matchesDate = !modalFilterDate || (t.shop_expense_date && new Date(t.shop_expense_date).toISOString().split("T")[0] === modalFilterDate);
        return matchesSearch && matchesDate;
    });

    return (
        <div className="p-3 sm:p-4 md:p-6 space-y-4">
            <Card className="max-w-xl mx-auto">
                <CardContent className="p-4 sm:p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="shop-expense-form">
                        <div className="space-y-2 w-full">
                            <Label htmlFor="shop_expense_date">Date *</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="shop_expense_date"
                                    type="date"
                                    className="w-full"
                                    {...register("shop_expense_date", { required: "Date is required" })}
                                />
                                <Button type="button" variant="default" onClick={handleGetData} className="whitespace-nowrap">
                                    <ArrowUp className="h-4 w-4 mr-1" /> Get Data
                                </Button>
                            </div>
                            {errors.shop_expense_date && <p className="text-sm text-destructive">{errors.shop_expense_date.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="shop_subhead_id">Expense Head *</Label>
                            <Controller
                                name="shop_subhead_id"
                                control={control}
                                rules={{ required: "Expense head is required" }}
                                render={({ field }) => (
                                    <Combobox
                                        options={subHeads.map((sh) => ({ value: sh.shop_subhead_id.toString(), label: sh.subhead_nam }))}
                                        value={field.value}
                                        onValueChange={(val) => {
                                            field.onChange(val);
                                            setValue("shop_account_id", "");
                                        }}
                                        placeholder="Select Expense Head"
                                        searchPlaceholder="Search..."
                                        emptyText="No expense head found."
                                    />
                                )}
                            />
                            {errors.shop_subhead_id && <p className="text-sm text-destructive">{errors.shop_subhead_id.message}</p>}
                        </div>

                        <div className="space-y-2 w-full">
                            <Label htmlFor="shop_account_id">Account *</Label>
                            <Controller
                                name="shop_account_id"
                                control={control}
                                rules={{ required: "Account is required" }}
                                render={({ field }) => (
                                    <Combobox
                                        options={accountsForSubHead.map((acc) => ({ value: acc.shop_account_id.toString(), label: acc.account_nam }))}
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        placeholder="Select account"
                                        searchPlaceholder="Search..."
                                        emptyText="No account found."
                                    />
                                )}
                            />
                            {errors.shop_account_id && <p className="text-sm text-destructive">{errors.shop_account_id.message}</p>}
                        </div>

                        <div className="space-y-2 w-full">
                            <Label htmlFor="amount">Amount *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                className="w-full"
                                {...register("amount", { required: "Amount is required", min: { value: 0.01, message: "Must be > 0" } })}
                                placeholder="0.00"
                            />
                            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
                        </div>

                        <div className="space-y-2 w-full">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" className="w-full" {...register("description")} placeholder="Enter description" rows={3} />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : isEditMode ? "Update Expense" : "Create Expense"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => {
                                reset({
                                    shop_expense_date: new Date().toISOString().split("T")[0],
                                    shop_subhead_id: "",
                                    shop_account_id: "",
                                    amount: "",
                                    description: "",
                                });
                                setIsEditMode(false);
                                setEditingTransactionId(null);
                            }}>
                                {isEditMode ? "Cancel Edit" : "Clear"}
                            </Button>
                            {isEditMode && (
                                <Button type="button" variant="destructive" disabled={isDeleting} onClick={() => handleDelete(editingTransactionId)}>
                                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <MobileListToggle title="Shop Expenses">
                        <div className="flex flex-wrap items-center gap-3 mb-4 mt-2">
                            <div className="flex items-center gap-2">
                                <Label className="whitespace-nowrap text-sm">Date</Label>
                                <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="h-8 w-40 text-sm" />
                            </div>
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm" />
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No expenses found</div>
                        ) : isMobile ? (
                            <div className="space-y-3">
                                {filteredTransactions.map((t, idx) => (
                                    <Card key={t.shop_expense_id} className="border shadow-sm">
                                        <CardContent className="p-3 space-y-2">
                                            <div className="flex justify-between"><span className="text-xs text-gray-500">Date</span><span className="text-sm">{new Date(t.shop_expense_date).toLocaleDateString()}</span></div>
                                            <div className="flex justify-between"><span className="text-xs text-gray-500">Head</span><span className="text-sm">{t.account?.subhead?.subhead_nam}</span></div>
                                            <div className="flex justify-between"><span className="text-xs text-gray-500">Account</span><span className="text-sm font-semibold">{t.account?.account_nam}</span></div>
                                            <div className="flex justify-between"><span className="text-xs text-gray-500">Amount</span><span className="text-sm font-semibold">{t.amount?.toFixed(2)}</span></div>
                                            <div className="flex justify-end mt-2">
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}><Edit2 className="h-4 w-4 mr-1"/> Edit</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                <div className="flex justify-between border-t pt-2 text-sm font-bold"><span>Total</span><span>{grandTotal.toFixed(2)}</span></div>
                            </div>
                        ) : (
                            <div className="relative max-h-[600px] overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="sticky top-0 bg-background z-20 border-b-2">
                                        <tr className="border-b">
                                            <th className="h-10 px-2 text-left font-medium">Sr</th>
                                            <th className="h-10 px-2 text-left font-medium">Date</th>
                                            <th className="h-10 px-2 text-left font-medium">Head</th>
                                            <th className="h-10 px-2 text-left font-medium">Account</th>
                                            <th className="h-10 px-2 text-left font-medium">Description</th>
                                            <th className="h-10 px-2 text-right font-medium">Amount</th>
                                            <th className="h-10 px-2 text-center font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTransactions.map((t, idx) => (
                                            <tr key={t.shop_expense_id} className="hover:bg-muted/50 border-b">
                                                <td className="p-2">{idx + 1}</td>
                                                <td className="p-2 whitespace-nowrap">{new Date(t.shop_expense_date).toLocaleDateString()}</td>
                                                <td className="p-2">{t.account?.subhead?.subhead_nam}</td>
                                                <td className="p-2">{t.account?.account_nam}</td>
                                                <td className="p-2 max-w-[200px] truncate">{t.description}</td>
                                                <td className="p-2 text-right font-medium">{t.amount?.toFixed(2)}</td>
                                                <td className="p-2 text-center">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}><Edit2 className="h-4 w-4 mr-1"/> Edit</Button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="font-bold border-t-2">
                                            <td colSpan={5} className="p-2 text-right">Grand Total</td>
                                            <td className="p-2 text-right">{grandTotal.toFixed(2)}</td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </MobileListToggle>
                </CardContent>
            </Card>

            <Dialog open={isGetDataModalOpen} onOpenChange={setIsGetDataModalOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Select Expense to Edit</DialogTitle></DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex flex-wrap gap-4">
                            <Input type="date" value={modalFilterDate} onChange={(e) => setModalFilterDate(e.target.value)} className="w-48" />
                            <Input placeholder="Search..." value={modalSearchQuery} onChange={(e) => setModalSearchQuery(e.target.value)} className="flex-1" />
                        </div>
                        {modalLoading ? (
                            <div className="text-center py-4">Loading...</div>
                        ) : (
                            <div className="border rounded-md max-h-[50vh] overflow-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-background border-b shadow-sm">
                                        <tr>
                                            <th className="p-2 text-left">Date</th>
                                            <th className="p-2 text-left">Account</th>
                                            <th className="p-2 text-right">Amount</th>
                                            <th className="p-2 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modalFilteredTransactions.map((t) => (
                                            <tr key={t.shop_expense_id} className="border-b hover:bg-muted">
                                                <td className="p-2">{new Date(t.shop_expense_date).toLocaleDateString()}</td>
                                                <td className="p-2">{t.account?.account_nam}</td>
                                                <td className="p-2 text-right">{t.amount?.toFixed(2)}</td>
                                                <td className="p-2 text-center">
                                                    <Button variant="outline" size="sm" onClick={() => handleEdit(t)}>Select</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
                    <p className="py-4">Are you sure you want to delete this expense?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>{isDeleting ? "Deleting..." : "Delete"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
