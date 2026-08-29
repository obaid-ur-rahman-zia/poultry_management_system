"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { Plus, Search, Edit2, Trash2, ArrowUp, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import MobileListToggle from "@/app/(interfaces)/components/MobileListToggle";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function ExpenseHeadPage() {
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
      transaction_date: new Date().toISOString().split("T")[0],
      is_bank: false,
      sub_id: "",
      account_id: "",
      transaction_type: "pay",
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
  const [currentBalance, setCurrentBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState(null);

  // Date filter — default to today
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);

  // Get Data modal
  const [isGetDataModalOpen, setIsGetDataModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [modalFilterDate, setModalFilterDate] = useState("");
  const [allTransactions, setAllTransactions] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalCalendarOpen, setModalCalendarOpen] = useState(false);
  const [modalSelectedDate, setModalSelectedDate] = useState(null);

  const selectedAccount = watch("account_id");
  const selectedSubId = watch("sub_id");
  const isBank = watch("is_bank");
  const transactionType = watch("transaction_type");
  const amount = watch("amount");
  const userCashInHandAccountId =
    session?.user?.cashInHandAccountId?.toString();

  // Filter accounts by selected subhead, then exclude cash-in-hand account
  const accountsForSubHead = selectedSubId
    ? accounts.filter((account) => account.sub_id?.toString() === selectedSubId)
    : [];
  const selectableAccounts = userCashInHandAccountId
    ? accountsForSubHead.filter(
      (account) => account.acc_id?.toString() !== userCashInHandAccountId,
    )
    : accountsForSubHead;

  useEffect(() => {
    fetchAccounts();
    fetchSubHeads();
    fetchExpenseTransactions(filterDate);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchAccountBalance(selectedAccount);
    } else {
      setCurrentBalance(null);
    }
  }, [selectedAccount]);

  // Refetch when filterDate changes
  useEffect(() => {
    fetchExpenseTransactions(filterDate);
  }, [filterDate]);

  const fetchSubHeads = async () => {
    try {
      const response = await fetch(
        "/api/account/accountSubHead/read/expenseHeads",
      );
      const result = await response.json();

      if (result.response_status === "success") {
        const subHeadsData = result.response_result || [];
        setSubHeads(subHeadsData);
      }
    } catch (error) {
      console.error("Error fetching subheads:", error);
      toast.error("Failed to fetch account types");
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch(
        "/api/account/accounts/read/expenseAccounts",
      );
      const result = await response.json();
      if (result.response_status === "success") {
        const accountsData =
          result.response_result?.data || result.response_result || [];
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
      const response = await fetch(
        `/api/transaction/read/balance?acc_id=${accId}`,
      );
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

  const fetchExpenseTransactions = async (date = filterDate) => {
    setLoading(true);
    try {
      const url = date
        ? `/api/expenseTransaction/readAll?all=true&date=${date}`
        : `/api/expenseTransaction/readAll?all=true`;
      const response = await fetch(url);
      const result = await response.json();
      if (result.response_status === "success") {
        const responseData = result.response_result;
        const transactionsData = responseData?.data || responseData || [];
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
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

  // Fetch ALL transactions for the Get Data modal
  const fetchAllTransactionsForModal = async () => {
    setModalLoading(true);
    try {
      const response = await fetch(`/api/expenseTransaction/readAll?all=true`);
      const result = await response.json();
      if (result.response_status === "success") {
        const responseData = result.response_result;
        const transactionsData = responseData?.data || responseData || [];
        setAllTransactions(Array.isArray(transactionsData) ? transactionsData : []);
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
    setModalSelectedDate(null);
    fetchAllTransactionsForModal();
    setIsGetDataModalOpen(true);
  };

  const onSubmit = async (data) => {
    if (!data.account_id || !data.amount || !data.transaction_date) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload = {
      req_object: {
        transaction_date: data.transaction_date,
        account_id: parseInt(data.account_id),
        amount: parseFloat(data.amount),
        description: data.description?.trim() || "",
        ...(isEditMode && { expense_t_id: editingTransactionId }),
      },
    };

    try {
      const url = "/api/expenseTransaction";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.response_status === "success") {
        toast.success(
          isEditMode
            ? "Transaction updated successfully"
            : "Transaction created successfully",
        );
        // Preserve date and expense head — only reset account-specific fields
        reset({
          transaction_date: data.transaction_date,
          is_bank: false,
          sub_id: data.sub_id,
          account_id: "",
          transaction_type: "pay",
          amount: "",
          description: "",
        });
        setCurrentBalance(null);
        setIsEditMode(false);
        setEditingTransactionId(null);
        fetchExpenseTransactions(filterDate);
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
    setEditingTransactionId(transaction.expense_t_id);
    reset({
      transaction_date: transaction.expense_t_date
        ? new Date(transaction.expense_t_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      sub_id: transaction.account?.sub_id?.toString() || "",
      account_id: transaction.account_id?.toString() || "",
      amount: transaction.amount?.toString() || "",
      description: transaction.description || "",
    });
  };

  const handleDelete = (transactionId) => {
    setDeletingTransactionId(transactionId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTransactionId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/expenseTransaction?expense_t_id=${deletingTransactionId}`,
        { method: "DELETE" },
      );
      const result = await response.json();
      if (result.response_status === "success") {
        toast.success("Transaction deleted successfully");
        setIsDeleteDialogOpen(false);
        setDeletingTransactionId(null);
        // If the deleted transaction is currently loaded in edit mode, clear the form
        if (editingTransactionId === deletingTransactionId) {
          reset({
            transaction_date: new Date().toISOString().split("T")[0],
            is_bank: false,
            sub_id: "",
            account_id: "",
            transaction_type: "pay",
            amount: "",
            description: "",
          });
          setCurrentBalance(null);
          setIsEditMode(false);
          setEditingTransactionId(null);
        }
        fetchExpenseTransactions(filterDate);
      } else {
        toast.error(result.response_message || "Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
    } finally {
      setIsDeleting(false);
    }
  };

  // Client-side search filter on the date-fetched list
  const filteredTransactions = transactions.filter((transaction) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const accountName = transaction.account?.account_nam || "";
    const expenseHeadName =
      transaction.account?.subhead?.subhead_nam || "";
    return (
      transaction.description?.toLowerCase().includes(query) ||
      accountName.toLowerCase().includes(query) ||
      expenseHeadName.toLowerCase().includes(query) ||
      transaction.amount?.toString().includes(query)
    );
  });

  // Grand total of displayed transactions
  const grandTotal = filteredTransactions.reduce(
    (sum, t) => sum + (parseFloat(t.amount) || 0),
    0,
  );

  // Modal filter — date + search
  const modalFilteredTransactions = allTransactions.filter((transaction) => {
    const accountName = transaction.account?.account_nam || "";
    const expenseHeadName = transaction.account?.subhead?.subhead_nam || "";

    const matchesSearch =
      !modalSearchQuery ||
      transaction.description?.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
      accountName.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
      expenseHeadName.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
      transaction.amount?.toString().includes(modalSearchQuery);

    const matchesDate =
      !modalFilterDate ||
      (transaction.expense_t_date &&
        new Date(transaction.expense_t_date).toISOString().split("T")[0] === modalFilterDate);

    return matchesSearch && matchesDate;
  });

  const modalGrandTotal = modalFilteredTransactions.reduce(
    (sum, t) => sum + (parseFloat(t.amount) || 0),
    0,
  );

  return (
    <div className="p-6 space-y-6">
      {/* Form Section */}
      <Card className={"max-w-xl mx-auto"}>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            id="self-transaction-form"
          >
            {/* Date */}
            <div className="space-y-2 w-full">
              <Label htmlFor="transaction_date">Date *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="transaction_date"
                  type="date"
                  className="w-full"
                  {...register("transaction_date", {
                    required: "Date is required",
                  })}
                />
                <Button
                  type="button"
                  variant="default"
                  onClick={handleGetData}
                  className="whitespace-nowrap"
                >
                  <ArrowUp className="h-4 w-4 mr-1" />
                  Get Data
                </Button>
              </div>
              {errors.transaction_date && (
                <p className="text-sm text-destructive">
                  {errors.transaction_date.message}
                </p>
              )}
            </div>

            {/* Transaction Mode (hidden) */}
            <div className="space-y-2 w-full hidden">
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
                  <Label htmlFor="cash" className="cursor-pointer">
                    Cash
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <Label htmlFor="sub_id">Expense Head</Label>
                <Controller
                  name="sub_id"
                  control={control}
                  rules={{ required: "Expense head is required" }}
                  render={({ field }) => (
                    <div className="flex-1">
                      <Combobox
                        options={subHeads.map((subHead) => ({
                          value: subHead.sub_id.toString(),
                          label: `${subHead.subhead_nam}${subHead.head?.head_nam &&
                            subHead.head.head_nam !== "Main Head"
                            ? ` (${subHead.head.head_nam})`
                            : ""
                            }`,
                        }))}
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Clear account selection when subhead changes
                          setValue("account_id", "");
                          setCurrentBalance(null);
                          // Find the selected subhead and set head_id
                          const selectedSubHead = subHeads.find(
                            (sh) => sh.sub_id.toString() === value,
                          );
                          if (selectedSubHead) {
                            setValue(
                              "head_id",
                              selectedSubHead.head_id.toString(),
                            );
                          }
                        }}
                        placeholder="Select Expense Head"
                        searchPlaceholder="Search expense heads..."
                        emptyText="No expense head found."
                      />
                    </div>
                  )}
                />
              </div>
              {errors.sub_id && (
                <p className="text-sm text-destructive">
                  {errors.sub_id.message}
                </p>
              )}
            </div>
            {/* Account Selection with Balance */}
            <div className="space-y-2 w-full">
              <Label htmlFor="account_id">Account *</Label>
              <div className="flex items-start gap-4 w-full">
                <div className="flex-1 space-y-2">
                  <Controller
                    name="account_id"
                    control={control}
                    rules={{ required: "Account is required" }}
                    render={({ field }) => (
                      <Combobox
                        options={selectableAccounts.map((account) => ({
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
                  {errors.account_id && (
                    <p className="text-sm text-destructive">
                      {errors.account_id.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Transaction type is always "pay" on this expense page */}
            <input
              type="hidden"
              {...register("transaction_type")}
              value="pay"
            />

            {/* Amount */}
            <div className="space-y-2 w-full">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                className="w-full"
                {...register("amount", {
                  required: "Amount is required",
                  min: {
                    value: 0.01,
                    message: "Amount must be greater than 0",
                  },
                })}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-sm text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>
            {/* Description */}
            <div className="space-y-2 w-full">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                className="w-full"
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
                    transaction_date: new Date().toISOString().split("T")[0],
                    is_bank: false,
                    sub_id: "",
                    account_id: "",
                    transaction_type: "pay",
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
                {isSubmitting
                  ? "Saving..."
                  : isEditMode
                    ? "Update Expense"
                    : "Create Expense"}
              </Button>
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={() => handleDelete(editingTransactionId)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardContent>
          <MobileListToggle title="Expense Transactions">
            {/* Top bar: date filter */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap text-sm">Date</Label>
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="h-8 w-40 text-sm"
                />
              </div>
              {/* Inline search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search account, head, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
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
                {filteredTransactions.map((transaction, idx) => (
                  <Card key={transaction.expense_t_id} className="border">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Sr</span>
                        <span className="text-sm font-medium">{idx + 1}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Date</span>
                        <span className="text-sm font-medium">
                          {transaction.expense_t_date
                            ? new Date(
                              transaction.expense_t_date,
                            ).toLocaleDateString("en-GB").replace(/\//g, "-")
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Expense Head
                        </span>
                        <span className="text-sm font-medium">
                          {transaction.account?.subhead?.subhead_nam || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Account</span>
                        <span className="text-sm font-medium">
                          {transaction.account?.account_nam || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Description
                        </span>
                        <span className="text-sm text-gray-600 truncate max-w-[60%]">
                          {transaction.description || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Amount</span>
                        <span className="text-sm font-semibold">
                          {transaction.amount?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {/* Mobile grand total */}
                <div className="flex items-center justify-between border-t pt-3 font-semibold text-sm">
                  <span>Grand Total</span>
                  <span>
                    {grandTotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative max-h-[600px] overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="sticky top-0 bg-background z-20 border-b-2">
                    <tr className="border-b">
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Sr
                      </th>
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Date
                      </th>
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Expense Head
                      </th>
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Account
                      </th>
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Description
                      </th>
                      <th className="text-foreground h-10 px-2 text-right align-middle font-medium whitespace-nowrap bg-background">
                        Amount
                      </th>
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction, idx) => (
                      <tr
                        key={transaction.expense_t_id}
                        className="hover:bg-muted/50 border-b transition-colors"
                      >
                        <td className="p-2 align-middle text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          {transaction.expense_t_date
                            ? new Date(
                              transaction.expense_t_date,
                            ).toLocaleDateString("en-GB").replace(/\//g, "-")
                            : "N/A"}
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          {transaction.account?.subhead?.subhead_nam || "N/A"}
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          {transaction.account?.account_nam || "N/A"}
                        </td>
                        <td className="p-2 align-middle max-w-[200px] truncate">
                          {transaction.description || "—"}
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap font-medium text-right">
                          {transaction.amount?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Grand Total row */}
                  <tfoot className="sticky bottom-0 bg-gray-200 dark:bg-gray-800 z-10 font-bold border-t-2">
                    <tr className="hover:bg-gray-200 dark:hover:bg-gray-800 text-base">
                      <td colSpan={5} className="p-2 text-right align-middle pr-4">
                        Grand Total:
                      </td>
                      <td className="p-2 align-middle text-right whitespace-nowrap">
                        {grandTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </MobileListToggle>
        </CardContent>
      </Card>

      {/* Get Data Modal */}
      <Dialog open={isGetDataModalOpen} onOpenChange={setIsGetDataModalOpen}>
        <DialogContent className="min-w-4xl max-h-[100vh] flex flex-col">

          {/* Modal Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0 mb-4 mt-2">
            <div className="space-y-2">
              <Label>Search Everything</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search account, head, description..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date Filter</Label>
              <Input
                type="date"
                value={modalFilterDate}
                onChange={(e) => setModalFilterDate(e.target.value)}
              />
            </div>
          </div>

          {/* Modal Table */}
          <div className="flex-1 overflow-auto border rounded-md">
            {modalLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
            ) : modalFilteredTransactions.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No transactions found
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background z-10 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Sr</th>
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Date</th>
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Expense Head</th>
                    <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Account</th>
                    <th className="px-3 py-2 text-left font-medium">Description</th>
                    <th className="px-3 py-2 text-right font-medium whitespace-nowrap">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {modalFilteredTransactions.map((transaction, idx) => (
                    <tr
                      key={transaction.expense_t_id}
                      className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => {
                        handleEdit(transaction);
                        // Also update the date filter to show this transaction's date
                        const txDate = transaction.expense_t_date
                          ? new Date(transaction.expense_t_date).toISOString().split("T")[0]
                          : null;
                        if (txDate) setFilterDate(txDate);
                        setIsGetDataModalOpen(false);
                      }}
                    >
                      <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {transaction.expense_t_date
                          ? new Date(transaction.expense_t_date).toLocaleDateString("en-GB").replace(/\//g, "-")
                          : "N/A"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {transaction.account?.subhead?.subhead_nam || "N/A"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {transaction.account?.account_nam || "N/A"}
                      </td>
                      <td className="px-3 py-2 max-w-[200px] truncate">
                        {transaction.description || "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-medium whitespace-nowrap">
                        {transaction.amount?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) || "0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 bg-gray-200 dark:bg-gray-800 z-10 font-bold border-t-2">
                  <tr className="hover:bg-gray-200 dark:hover:bg-gray-800 text-base">
                    <td colSpan={5} className="px-3 py-2 text-right pr-4">
                      Grand Total:
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {modalGrandTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGetDataModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Expense Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this expense transaction?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
