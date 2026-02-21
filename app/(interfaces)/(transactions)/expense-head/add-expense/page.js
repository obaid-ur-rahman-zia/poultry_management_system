"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

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
    fetchExpenseTransactions();
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

  const fetchExpenseTransactions = async (
    page = currentPage,
    limit = itemsPerPage,
  ) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/expenseTransaction/readAll?page=${page}&limit=${limit}`,
      );
      const result = await response.json();
      if (result.response_status === "success") {
        const responseData = result.response_result;

        // Handle paginated response
        if (responseData?.pagination) {
          const transactionsData = responseData.data || [];
          setTransactions(transactionsData);
          setTotalPages(responseData.pagination.totalPages || 1);
          setTotalItems(responseData.pagination.total || 0);
          setCurrentPage(responseData.pagination.page || page);
        } else {
          // Fallback for non-paginated response
          const transactionsData = responseData?.data || responseData || [];
          setTransactions(transactionsData);
          setTotalPages(1);
          setTotalItems(transactionsData.length);
        }
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
          sub_id: data.sub_id,
          account_id: "",
          amount: "",
          description: "",
        });
        setCurrentBalance(null);
        setIsEditMode(false);
        setEditingTransactionId(null);
        fetchExpenseTransactions(currentPage, itemsPerPage);
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
        fetchExpenseTransactions(currentPage, itemsPerPage);
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

  // Filter transactions (client-side filtering on paginated data)
  const filteredTransactions = transactions.filter((transaction) => {
    const accountName = transaction.account?.account_nam || "";
    const expenseHeadName =
      transaction.account?.subhead?.parent?.subhead_nam ||
      transaction.account?.subhead?.subhead_nam ||
      "";

    const matchesSearch =
      searchQuery === "" ||
      transaction.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expenseHeadName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAccount =
      filterAccount === "all" ||
      transaction.account_id?.toString() === filterAccount;

    const matchesDate =
      filterDate === "" ||
      (transaction.expense_t_date &&
        new Date(transaction.expense_t_date).toISOString().split("T")[0] ===
          filterDate);

    return matchesSearch && matchesAccount && matchesDate;
  });

  // Reset to page 1 when filters change and refetch
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchExpenseTransactions(1, itemsPerPage);
    }
  }, [searchQuery, filterAccount, filterDate]);

  // Fetch transactions when page or itemsPerPage changes
  useEffect(() => {
    fetchExpenseTransactions(currentPage, itemsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

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
              <Input
                id="transaction_date"
                type="date"
                className="w-full"
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

            {/* Transaction Mode */}
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
                          label: `${subHead.subhead_nam}${
                            subHead.head?.head_nam &&
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
            {/* Filters */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by account, head, description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Account</Label>
                  <Combobox
                    options={[
                      { value: "all", label: "All Accounts" },
                      ...accounts.map((account) => ({
                        value: account.acc_id.toString(),
                        label: account.account_nam,
                      })),
                    ]}
                    value={filterAccount}
                    onValueChange={setFilterAccount}
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
                              ).toLocaleDateString()
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
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          {transaction.expense_t_date
                            ? new Date(
                                transaction.expense_t_date,
                              ).toLocaleDateString()
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
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages >= 1 && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">
                    Items per page:
                  </Label>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                      fetchExpenseTransactions(1, Number(value));
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => {
                              setCurrentPage(pageNum);
                              fetchExpenseTransactions(pageNum, itemsPerPage);
                            }}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => {
                          const newPage = Math.min(totalPages, currentPage + 1);
                          setCurrentPage(newPage);
                          fetchExpenseTransactions(newPage, itemsPerPage);
                        }}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                  {totalItems} expense transactions
                </div>
              </div>
            )}
          </MobileListToggle>
        </CardContent>
      </Card>

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
