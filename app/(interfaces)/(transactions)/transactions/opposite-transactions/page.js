"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { Plus, Search, Edit2, Trash2, PlusCircle, Equal } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MobileListToggle from "@/app/(interfaces)/components/MobileListToggle";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
      transaction_date: new Date().toISOString().split("T")[0],
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
  const [paidByBalance, setPaidByBalance] = useState(null);
  const [receivedByBalance, setReceivedByBalance] = useState(null);
  const [loadingPaidByBalance, setLoadingPaidByBalance] = useState(false);
  const [loadingReceivedByBalance, setLoadingReceivedByBalance] =
    useState(false);

  // Account search dialog states
  const [isAccountSearchDialogOpen, setIsAccountSearchDialogOpen] =
    useState(false);
  const [accountSearchField, setAccountSearchField] = useState("paid_by"); // Track which field opened the dialog: "paid_by" or "received_by"
  const [accountSearchType, setAccountSearchType] = useState("all");
  const [accountSearchQuery, setAccountSearchQuery] = useState("");
  const [allAccounts, setAllAccounts] = useState([]);
  const [accountSubHeads, setAccountSubHeads] = useState([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPaidBy, setFilterPaidBy] = useState("all");
  const [filterReceivedBy, setFilterReceivedBy] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const selectedPaidBy = watch("paid_by");
  const selectedReceivedBy = watch("received_by");

  useEffect(() => {
    fetchAccounts();
    fetchSubHeads();
    fetchAccountHeads();
    fetchTransactions(1, 20);
    fetchAllAccounts();
    fetchAccountSubHeads();
  }, []);

  // Fetch all accounts for search dialog (fetch all without pagination for search)
  const fetchAllAccounts = async () => {
    try {
      // Fetch all accounts without pagination using all=true parameter
      const response = await fetch("/api/account/accounts/readAll?all=true");
      const result = await response.json();
      if (result.response_status === "success") {
        const responseData = result.response_result;
        // Handle response (with or without pagination)
        if (responseData?.pagination) {
          const accountsData = responseData.data || [];
          setAllAccounts(Array.isArray(accountsData) ? accountsData : []);
        } else {
          // Non-paginated response (all accounts)
          const accountsData = responseData?.data || responseData || [];
          setAllAccounts(Array.isArray(accountsData) ? accountsData : []);
        }
      }
    } catch (error) {
      console.error("Error fetching all accounts:", error);
      setAllAccounts([]);
    }
  };

  // Fetch account sub-heads for account type dropdown
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
        const headsData =
          result.response_result?.data || result.response_result || [];
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
        const subHeadsData =
          result.response_result?.data || result.response_result || [];
        setSubHeads(subHeadsData);
      }
    } catch (error) {
      console.error("Error fetching subheads:", error);
    }
  };

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

  useEffect(() => {
    if (subHeads.length > 0 && accounts.length > 0) {
      // Filter bank accounts by subhead name containing "bank"
      const foundBankSubHead = subHeads.find((sh) =>
        sh.subhead_nam?.toLowerCase().includes("bank"),
      );
      if (foundBankSubHead) {
        setBankSubHead(foundBankSubHead);
        const bankAccs = accounts.filter(
          (acc) => acc.sub_id === foundBankSubHead.sub_id,
        );
        setBankAccounts(bankAccs);
      } else {
        setBankSubHead(null);
        setBankAccounts([]);
      }
    }
  }, [subHeads, accounts]);

  // Fetch Paid By balance
  const fetchPaidByBalance = async (accId) => {
    if (!accId) {
      setPaidByBalance(null);
      return;
    }
    setLoadingPaidByBalance(true);
    try {
      const response = await fetch(
        `/api/transaction/read/balance?acc_id=${accId}`,
      );
      const result = await response.json();
      if (result.response_status === "success" && result.response_result) {
        setPaidByBalance(result.response_result.balance || 0);
      } else {
        setPaidByBalance(null);
      }
    } catch (error) {
      console.error("Error fetching paid by balance:", error);
      setPaidByBalance(null);
    } finally {
      setLoadingPaidByBalance(false);
    }
  };

  // Fetch Received By balance
  const fetchReceivedByBalance = async (accId) => {
    if (!accId) {
      setReceivedByBalance(null);
      return;
    }
    setLoadingReceivedByBalance(true);
    try {
      const response = await fetch(
        `/api/transaction/read/balance?acc_id=${accId}`,
      );
      const result = await response.json();
      if (result.response_status === "success" && result.response_result) {
        setReceivedByBalance(result.response_result.balance || 0);
      } else {
        setReceivedByBalance(null);
      }
    } catch (error) {
      console.error("Error fetching received by balance:", error);
      setReceivedByBalance(null);
    } finally {
      setLoadingReceivedByBalance(false);
    }
  };

  useEffect(() => {
    if (selectedPaidBy) {
      fetchPaidByBalance(selectedPaidBy);
    } else {
      setPaidByBalance(null);
    }
  }, [selectedPaidBy]);

  useEffect(() => {
    if (selectedReceivedBy) {
      fetchReceivedByBalance(selectedReceivedBy);
    } else {
      setReceivedByBalance(null);
    }
  }, [selectedReceivedBy]);

  const fetchTransactions = async (
    page = currentPage,
    limit = itemsPerPage,
  ) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/oppositeTransaction/readAll?page=${page}&limit=${limit}`,
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

  const handleAddBankAccount = async () => {
    if (!newBankAccountName.trim()) {
      toast.error("Account name is required");
      return;
    }

    if (!bankSubHead) {
      toast.error(
        "Bank account type not found. Please create a bank account type (subhead) first.",
      );
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
    if (
      !data.paid_by ||
      !data.received_by ||
      !data.amount ||
      !data.transaction_date
    ) {
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
        toast.success(
          isEditMode
            ? "Transaction updated successfully"
            : "Transaction created successfully",
        );
        reset({
          transaction_date: new Date().toISOString().split("T")[0],
          paid_by: "",
          bank_account: "",
          received_by: "",
          amount: "",
          description: "",
        });
        setIsEditMode(false);
        setEditingTransactionId(null);
        fetchTransactions(currentPage, itemsPerPage);
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
      transaction_date: transaction.transaction_date
        ? new Date(transaction.transaction_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
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
      const response = await fetch(
        `/api/oppositeTransaction?transaction_id=${transactionId}`,
        {
          method: "DELETE",
        },
      );
      const result = await response.json();
      if (result.response_status === "success") {
        toast.success("Transaction deleted successfully");
        fetchTransactions(currentPage, itemsPerPage);
      } else {
        toast.error(result.response_message || "Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
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
        .find((a) => a.acc_id === transaction.paid_by)
        ?.account_nam?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      accounts
        .find((a) => a.acc_id === transaction.received_by)
        ?.account_nam?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesPaidBy =
      filterPaidBy === "all" ||
      transaction.paid_by?.toString() === filterPaidBy;

    const matchesReceivedBy =
      filterReceivedBy === "all" ||
      transaction.received_by?.toString() === filterReceivedBy;

    const matchesDate =
      filterDate === "" ||
      (transaction.transaction_date &&
        new Date(transaction.transaction_date).toISOString().split("T")[0] ===
          filterDate);

    return matchesSearch && matchesPaidBy && matchesReceivedBy && matchesDate;
  });

  // Reset to page 1 when filters change and refetch
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchTransactions(1, itemsPerPage);
    }
  }, [searchQuery, filterPaidBy, filterReceivedBy, filterDate]);

  // Fetch transactions when page or itemsPerPage changes
  useEffect(() => {
    fetchTransactions(currentPage, itemsPerPage);
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
            id="opposite-transaction-form"
          >
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
                <div className="flex items-center gap-1">
                  <Label htmlFor="paid_by">Paid By *</Label>
                  <Controller
                    name="paid_by"
                    control={control}
                    rules={{ required: "Paid by is required" }}
                    render={({ field }) => {
                      // Get selected account from allAccounts if it exists
                      const selectedAccount = allAccounts.find(
                        (acc) => acc.acc_id?.toString() === field.value,
                      );

                      // Combine accounts with selected account if it's not in accounts
                      const options = [
                        ...accounts.map((acc) => ({
                          value: acc.acc_id.toString(),
                          label: acc.account_nam,
                        })),
                        ...(selectedAccount &&
                        !accounts.find(
                          (acc) => acc.acc_id === selectedAccount.acc_id,
                        )
                          ? [
                              {
                                value: selectedAccount.acc_id.toString(),
                                label: selectedAccount.account_nam,
                              },
                            ]
                          : []),
                      ];

                      return (
                        <div className="flex-1">
                          <Combobox
                            options={options}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select account"
                            searchPlaceholder="Search accounts..."
                            emptyText="No account found."
                          />
                        </div>
                      );
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAccountSearchField("paid_by");
                      setAccountSearchType("all");
                      setAccountSearchQuery("");
                      setIsAccountSearchDialogOpen(true);
                    }}
                    className="h-8 w-8 p-0 font-bold"
                    title="Search Accounts"
                  >
                    =
                  </Button>
                </div>
                {errors.paid_by && (
                  <p className="text-sm text-destructive">
                    {errors.paid_by.message}
                  </p>
                )}
                {/* Paid By Balance Display */}
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    {loadingPaidByBalance ? (
                      <div className="text-sm text-muted-foreground">
                        Loading...
                      </div>
                    ) : (
                      <div className="text-sm">
                        Balance{" "}
                        {paidByBalance !== null
                          ? paidByBalance.toFixed(2)
                          : "0"}
                      </div>
                    )}
                  </div>
                </div>
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
                        toast.error(
                          "Bank account type not found. Please create a bank account type (subhead) first.",
                        );
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
                <div className="flex items-center gap-1">
                  <Label htmlFor="received_by">Received By *</Label>
                  <Controller
                    name="received_by"
                    control={control}
                    rules={{ required: "Received by is required" }}
                    render={({ field }) => {
                      // Get selected account from allAccounts if it exists
                      const selectedAccount = allAccounts.find(
                        (acc) => acc.acc_id?.toString() === field.value,
                      );

                      // Combine accounts with selected account if it's not in accounts
                      const options = [
                        ...accounts.map((acc) => ({
                          value: acc.acc_id.toString(),
                          label: acc.account_nam,
                        })),
                        ...(selectedAccount &&
                        !accounts.find(
                          (acc) => acc.acc_id === selectedAccount.acc_id,
                        )
                          ? [
                              {
                                value: selectedAccount.acc_id.toString(),
                                label: selectedAccount.account_nam,
                              },
                            ]
                          : []),
                      ];

                      return (
                        <div className="flex-1">
                          <Combobox
                            options={options}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select account"
                            searchPlaceholder="Search accounts..."
                            emptyText="No account found."
                          />
                        </div>
                      );
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAccountSearchField("received_by");
                      setAccountSearchType("all");
                      setAccountSearchQuery("");
                      setIsAccountSearchDialogOpen(true);
                    }}
                    className="h-8 w-8 p-0 font-bold"
                    title="Search Accounts"
                  >
                    =
                  </Button>
                </div>
                {errors.received_by && (
                  <p className="text-sm text-destructive">
                    {errors.received_by.message}
                  </p>
                )}
                {/* Received By Balance Display */}
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    {loadingReceivedByBalance ? (
                      <div className="text-sm text-muted-foreground">
                        Loading...
                      </div>
                    ) : (
                      <div className="text-sm">
                        Balance{" "}
                        {receivedByBalance !== null
                          ? receivedByBalance.toFixed(2)
                          : "0"}
                      </div>
                    )}
                  </div>
                </div>
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
                    transaction_date: new Date().toISOString().split("T")[0],
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
                {isSubmitting
                  ? "Saving..."
                  : isEditMode
                    ? "Update Transaction"
                    : "Create Transaction"}
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
                      })),
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
                      })),
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
                          {transaction.transaction_date
                            ? new Date(
                                transaction.transaction_date,
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Paid By</span>
                        <span className="text-sm font-medium">
                          {accounts.find(
                            (a) => a.acc_id === transaction.paid_by,
                          )?.account_nam || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Bank Account
                        </span>
                        <span className="text-sm font-medium">
                          {transaction.bank_account
                            ? accounts.find(
                                (a) => a.acc_id === transaction.bank_account,
                              )?.account_nam || "N/A"
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Received By
                        </span>
                        <span className="text-sm font-medium">
                          {accounts.find(
                            (a) => a.acc_id === transaction.received_by,
                          )?.account_nam || "N/A"}
                        </span>
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
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDelete(transaction.transaction_id)
                          }
                        >
                          <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                          Delete
                        </Button> */}
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
                        Paid By
                      </th>
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Bank Account
                      </th>
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Received By
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
                          {accounts.find(
                            (a) => a.acc_id === transaction.paid_by,
                          )?.account_nam || "N/A"}
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          {transaction.bank_account
                            ? accounts.find(
                                (a) => a.acc_id === transaction.bank_account,
                              )?.account_nam || "N/A"
                            : "N/A"}
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          {accounts.find(
                            (a) => a.acc_id === transaction.received_by,
                          )?.account_nam || "N/A"}
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
                            {/* <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDelete(transaction.transaction_id)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button> */}
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
                        onClick={() => {
                          const newPage = Math.max(1, currentPage - 1);
                          setCurrentPage(newPage);
                          fetchTransactions(newPage, itemsPerPage);
                        }}
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
                      // Filter by account sub-head (account type)
                      if (accountSearchType !== "all") {
                        // Filter by sub_id (account sub-head)
                        if (acc.sub_id?.toString() !== accountSearchType) {
                          return false;
                        }
                      }
                      // If "all", show all accounts (no filter)

                      // Filter by search query
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
                          // Update the field that opened the dialog
                          if (accountSearchField === "paid_by") {
                            setValue("paid_by", acc.acc_id.toString());
                          } else if (accountSearchField === "received_by") {
                            setValue("received_by", acc.acc_id.toString());
                          }
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

      {/* Add Bank Account Dialog */}
      <Dialog
        open={isBankAccountDialogOpen}
        onOpenChange={setIsBankAccountDialogOpen}
      >
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
                Account Type:{" "}
                <span className="font-medium">{bankSubHead.subhead_nam}</span>
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
