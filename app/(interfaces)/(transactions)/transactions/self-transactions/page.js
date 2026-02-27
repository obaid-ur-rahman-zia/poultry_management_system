"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import MobileListToggle from "@/app/(interfaces)/components/MobileListToggle";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
      transaction_date: new Date().toISOString().split("T")[0],
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

  // Account search dialog states
  const [isAccountSearchDialogOpen, setIsAccountSearchDialogOpen] =
    useState(false);
  const [accountSearchType, setAccountSearchType] = useState("all");
  const [accountSearchQuery, setAccountSearchQuery] = useState("");
  const [allAccounts, setAllAccounts] = useState([]);
  const [accountSubHeads, setAccountSubHeads] = useState([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState("all");
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
  const isBank = watch("is_bank");
  const transactionType = watch("transaction_type");
  const amount = watch("amount");
  const userCashInHandAccountId =
    session?.user?.cashInHandAccountId?.toString();
  const selectableAccounts = userCashInHandAccountId
    ? accounts.filter(
        (account) => account.acc_id?.toString() !== userCashInHandAccountId,
      )
    : accounts;

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
    fetchAllAccounts();
    fetchAccountSubHeads();
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

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/account/accounts/readAll?all=true");
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

  // Fetch all accounts for search dialog
  const fetchAllAccounts = async () => {
    try {
      const response = await fetch("/api/account/accounts/readAll?all=true");
      const result = await response.json();
      if (result.response_status === "success") {
        const responseData = result.response_result;
        if (responseData?.pagination) {
          const accountsData = responseData.data || [];
          setAllAccounts(Array.isArray(accountsData) ? accountsData : []);
        } else {
          const accountsData = responseData?.data || responseData || [];
          setAllAccounts(Array.isArray(accountsData) ? accountsData : []);
        }
      }
    } catch (error) {
      console.error("Error fetching all accounts:", error);
      setAllAccounts([]);
    }
  };

  // Fetch account sub-heads for the account type dropdown
  const fetchAccountSubHeads = async () => {
    try {
      const response = await fetch("/api/account/accountSubHead/readAll");
      const result = await response.json();
      if (result.response_status === "success") {
        const subHeadsData =
          result.response_result?.data || result.response_result || [];
        setAccountSubHeads(Array.isArray(subHeadsData) ? subHeadsData : []);
      }
    } catch (error) {
      console.error("Error fetching account sub-heads:", error);
      setAccountSubHeads([]);
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

  const fetchTransactions = async (
    page = currentPage,
    limit = itemsPerPage,
  ) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/selfTransaction/readAll?page=${page}&limit=${limit}`,
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
        toast.success(
          isEditMode
            ? "Transaction updated successfully"
            : "Transaction created successfully",
        );
        reset({
          transaction_date: data.transaction_date,
          is_bank: false,
          account_id: "",
          transaction_type: "receive",
          amount: "",
          description: "",
        });
        setCurrentBalance(null);
        setIsEditMode(false);
        setEditingTransactionId(null);
        fetchTransactions(currentPage, itemsPerPage);
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
      transaction_date: transaction.transaction_date
        ? new Date(transaction.transaction_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      is_bank: transaction.is_bank === 1,
      account_id: transaction.account_id?.toString() || "",
      transaction_type: transaction.transaction_type || "receive",
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
        `/api/selfTransaction?transaction_id=${deletingTransactionId}`,
        { method: "DELETE" },
      );
      const result = await response.json();
      if (result.response_status === "success") {
        toast.success("Transaction deleted successfully");
        setIsDeleteDialogOpen(false);
        setDeletingTransactionId(null);
        if (editingTransactionId === deletingTransactionId) {
          reset({
            transaction_date: new Date().toISOString().split("T")[0],
            is_bank: false,
            account_id: "",
            transaction_type: "receive",
            amount: "",
            description: "",
          });
          setCurrentBalance(null);
          setIsEditMode(false);
          setEditingTransactionId(null);
        }
        fetchTransactions(currentPage, itemsPerPage);
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
    const matchesSearch =
      searchQuery === "" ||
      transaction.description
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      accounts
        .find((a) => a.acc_id === transaction.account_id)
        ?.account_nam?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesAccount =
      filterAccount === "all" ||
      transaction.account_id?.toString() === filterAccount;

    const matchesDate =
      filterDate === "" ||
      (transaction.transaction_date &&
        new Date(transaction.transaction_date).toISOString().split("T")[0] ===
          filterDate);

    const matchesType =
      filterType === "all" || transaction.transaction_type === filterType;

    return matchesSearch && matchesAccount && matchesDate && matchesType;
  });

  // Reset to page 1 when filters change and refetch
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchTransactions(1, itemsPerPage);
    }
  }, [searchQuery, filterAccount, filterDate, filterType]);

  // Fetch transactions when page or itemsPerPage changes
  useEffect(() => {
    fetchTransactions(currentPage, itemsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  const netBalance = calculateNetBalance();

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

            {/* Account Selection with Balance */}
            <div className="space-y-2 w-full">
              <div className="flex items-center gap-1">
                <Label htmlFor="account_id">Account *</Label>
              </div>
              <div className="flex items-start gap-2 w-full">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-1">
                    <div className="flex-1">
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
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const purcherSubHead = accountSubHeads.find(
                          (sh) => sh.subhead_nam?.toLowerCase() === "purcher",
                        );
                        setAccountSearchType(
                          purcherSubHead
                            ? purcherSubHead.sub_id.toString()
                            : "all",
                        );
                        setAccountSearchQuery("");
                        setIsAccountSearchDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0 font-bold"
                      title="Search Accounts"
                    >
                      =
                    </Button>
                  </div>
                  {errors.account_id && (
                    <p className="text-sm text-destructive">
                      {errors.account_id.message}
                    </p>
                  )}
                </div>
                {/* Current Balance */}
                {selectedAccount && (
                  <div className="space-y-2 flex items-center gap-2">
                    {balanceLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Loading...
                      </p>
                    ) : currentBalance ? (
                      <div className="p-2 bg-muted rounded-md">
                        <p
                          className={`text-lg font-semibold ${currentBalance.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {currentBalance.balance?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No balance data
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Action */}
            <div className="space-y-2 w-full">
              <Label>Transaction Action</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="receive"
                    value="receive"
                    checked={transactionType === "receive"}
                    onChange={(e) =>
                      setValue("transaction_type", e.target.value)
                    }
                    className="w-4 h-4"
                  />
                  <Label htmlFor="receive" className="cursor-pointer">
                    Receive
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="pay"
                    value="pay"
                    checked={transactionType === "pay"}
                    onChange={(e) =>
                      setValue("transaction_type", e.target.value)
                    }
                    className="w-4 h-4"
                  />
                  <Label htmlFor="pay" className="cursor-pointer">
                    Pay
                  </Label>
                </div>
              </div>
            </div>

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

            {/* Net Balance */}
            {selectedAccount && amount && netBalance !== null && (
              <div className="space-y-2 w-full">
                <Label>Net Balance</Label>
                <div className="p-2 bg-muted rounded-md">
                  <p
                    className={`text-lg font-semibold ${netBalance >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {netBalance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {transactionType === "receive"
                      ? "After receiving"
                      : "After paying"}{" "}
                    {parseFloat(amount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

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
                {isSubmitting
                  ? "Saving..."
                  : isEditMode
                    ? "Update Transaction"
                    : "Create Transaction"}
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

      {/* Account Search Dialog */}
      <Dialog
        open={isAccountSearchDialogOpen}
        onOpenChange={setIsAccountSearchDialogOpen}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Search Accounts</DialogTitle>
            <DialogDescription>
              Search and select an account from all available accounts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label>Account Type</Label>
                <Select
                  value={accountSearchType}
                  onValueChange={setAccountSearchType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {accountSubHeads.map((subhead) => (
                      <SelectItem
                        key={subhead.sub_id}
                        value={subhead.sub_id.toString()}
                      >
                        {subhead.subhead_nam}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search accounts..."
                    value={accountSearchQuery}
                    onChange={(e) => setAccountSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
            <div className="relative max-h-[400px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Sr. No</TableHead>
                    <TableHead>Account Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allAccounts
                    .filter((acc) => {
                      if (accountSearchType !== "all") {
                        if (acc.sub_id?.toString() !== accountSearchType) {
                          return false;
                        }
                      }
                      if (accountSearchQuery) {
                        const query = accountSearchQuery.toLowerCase();
                        return (
                          acc.account_nam?.toLowerCase().includes(query) ||
                          acc.account_cnic?.toLowerCase().includes(query) ||
                          acc.account_contact?.toLowerCase().includes(query)
                        );
                      }
                      return true;
                    })
                    .map((acc, index) => (
                      <TableRow
                        key={acc.acc_id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setValue("account_id", acc.acc_id.toString());
                          setIsAccountSearchDialogOpen(false);
                          setAccountSearchQuery("");
                        }}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {acc.account_nam}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAccountSearchDialogOpen(false);
                setAccountSearchQuery("");
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

                {/* <div className="space-y-2">
                  <Label>Account</Label>
                  <Combobox
                    options={[
                      { value: "all", label: "All Accounts" },
                      ...selectableAccounts.map((account) => ({
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
                </div> */}

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>

                {/* <div className="space-y-2">
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
                </div> */}
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
                          {transaction.transaction_date
                            ? new Date(
                                transaction.transaction_date,
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Type</span>
                        <Badge
                          variant={
                            transaction.is_bank === 1 ? "default" : "secondary"
                          }
                        >
                          {transaction.is_bank === 1 ? "Bank" : "Cash"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Account</span>
                        <span className="text-sm font-medium">
                          {accounts.find(
                            (a) => a.acc_id === transaction.account_id,
                          )?.account_nam || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Action</span>
                        <Badge
                          variant={
                            transaction.transaction_type === "receive"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {transaction.transaction_type === "receive"
                            ? "Receive"
                            : "Pay"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Amount</span>
                        <span className="text-sm font-medium">
                          {transaction.amount?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Description
                        </span>
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
                        Date
                      </th>
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Type
                      </th>
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Account
                      </th>
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Action
                      </th>
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Amount
                      </th>
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Description
                      </th>
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => (
                      <tr
                        key={transaction.transaction_id}
                        className="hover:bg-muted/50 border-b transition-colors"
                      >
                        <td className="p-2 align-middle whitespace-nowrap">
                          {transaction.transaction_date
                            ? new Date(
                                transaction.transaction_date,
                              ).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          <Badge
                            variant={
                              transaction.is_bank === 1
                                ? "default"
                                : "secondary"
                            }
                          >
                            {transaction.is_bank === 1 ? "Bank" : "Cash"}
                          </Badge>
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          {accounts.find(
                            (a) => a.acc_id === transaction.account_id,
                          )?.account_nam || "N/A"}
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          <Badge
                            variant={
                              transaction.transaction_type === "receive"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {transaction.transaction_type === "receive"
                              ? "Receive"
                              : "Pay"}
                          </Badge>
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap font-medium">
                          {transaction.amount?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
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
                      fetchTransactions(1, Number(value));
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
                              fetchTransactions(pageNum, itemsPerPage);
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
                          fetchTransactions(newPage, itemsPerPage);
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
                  {totalItems} transactions
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
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction?
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
