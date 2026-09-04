"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  PlusCircle,
  Equal,
  Loader2,
} from "lucide-react";
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
import {
  TableFooter,
} from "@/components/ui/table";
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
  const [isCreatingBankAccount, setIsCreatingBankAccount] = useState(false);
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
  const accountRowRefs = useRef([]);
  accountRowRefs.current = [];

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPaidBy, setFilterPaidBy] = useState("all");
  const [filterReceivedBy, setFilterReceivedBy] = useState("all");
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [isMobile, setIsMobile] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState(null);

  // Modal states
  const [isGetDataModalOpen, setIsGetDataModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState("");

  const selectedPaidBy = watch("paid_by");
  const selectedReceivedBy = watch("received_by");

  useEffect(() => {
    fetchSubHeads();
    fetchAccountHeads();
    fetchTransactions(filterDate);
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
        let accountsData = [];
        if (responseData?.pagination) {
          accountsData = responseData.data || [];
        } else {
          // Non-paginated response (all accounts)
          accountsData = responseData?.data || responseData || [];
        }

        let filteredAccounts = Array.isArray(accountsData) ? accountsData.filter((a) => a.acc_id !== 1) : [];

        setAllAccounts(filteredAccounts);
        setAccounts(filteredAccounts);
      }
    } catch (error) {
      console.error("Error fetching all accounts:", error);
      setAllAccounts([]);
      setAccounts([]);
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

  const getDefaultAccountSearchType = (field) => {
    const matchedSubhead = accountSubHeads.find((subhead) => {
      const subheadName = subhead.subhead_nam?.toLowerCase() || "";

      if (field === "paid_by") {
        return (
          subheadName.includes("purchaser") ||
          subheadName.includes("purcher") ||
          subheadName.includes("customer")
        );
      }

      return (
        subheadName.includes("farmer") ||
        subheadName.includes("former") ||
        subheadName.includes("supplier")
      );
    });

    return matchedSubhead ? matchedSubhead.sub_id.toString() : "all";
  };

  const focusFirstAccountRow = () => {
    const firstRow = accountRowRefs.current.find(Boolean);
    if (!firstRow) return false;
    firstRow.focus();
    return true;
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
    dateFilter = filterDate
  ) => {
    setLoading(true);
    try {
      let url = `/api/oppositeTransaction/readAll?all=true`;
      if (dateFilter) {
        url += `&date=${dateFilter}`;
      }
      const response = await fetch(url);
      const result = await response.json();
      if (result.response_status === "success") {
        const responseData = result.response_result;
        const transactionsData = responseData?.data || responseData || [];
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
      toast.error(
        "Bank account type not found. Please create a bank account type (subhead) first.",
      );
      return;
    }

    setIsCreatingBankAccount(true);
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
    } finally {
      setIsCreatingBankAccount(false);
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
          transaction_date: data.transaction_date,
          paid_by: "",
          bank_account: "",
          received_by: "",
          amount: "",
          description: "",
        });
        setIsEditMode(false);
        setEditingTransactionId(null);
        fetchTransactions(filterDate);
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

  const handleDelete = (transactionId) => {
    setDeletingTransactionId(transactionId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTransactionId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/oppositeTransaction?transaction_id=${deletingTransactionId}`,
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
            paid_by: "",
            bank_account: "",
            received_by: "",
            amount: "",
            description: "",
          });
          setIsEditMode(false);
          setEditingTransactionId(null);
        }
        fetchTransactions(filterDate);
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
  // Filter transactions (client-side filtering for main view)
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

    return matchesSearch && matchesPaidBy && matchesReceivedBy;
  });

  // Filter for modal (universal search)
  const modalFilteredTransactions = transactions.filter((transaction) => {
    if (!modalSearchQuery) return true;

    const query = modalSearchQuery.toLowerCase();
    const paidByName = accounts.find((a) => a.acc_id === transaction.paid_by)?.account_nam?.toLowerCase() || "";
    const receivedByName = accounts.find((a) => a.acc_id === transaction.received_by)?.account_nam?.toLowerCase() || "";
    const bankName = transaction.bank_account ? accounts.find((a) => a.acc_id === transaction.bank_account)?.account_nam?.toLowerCase() || "" : "";

    return (
      paidByName.includes(query) ||
      receivedByName.includes(query) ||
      bankName.includes(query) ||
      transaction.amount?.toString().includes(query) ||
      (transaction.description && transaction.description.toLowerCase().includes(query))
    );
  });

  const totalAmount = filteredTransactions.reduce((sum, transaction) => sum + (parseFloat(transaction.amount) || 0), 0);
  const modalTotalAmount = modalFilteredTransactions.reduce((sum, transaction) => sum + (parseFloat(transaction.amount) || 0), 0);

  // Refetch when filterDate changes
  useEffect(() => {
    fetchTransactions(filterDate);
  }, [filterDate]);

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
                <div className="flex gap-2">
                  <Input
                    id="transaction_date"
                    type="date"
                    {...register("transaction_date", {
                      required: "Date is required",
                    })}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      setModalSearchQuery("");
                      setIsGetDataModalOpen(true);
                    }}
                    className="whitespace-nowrap"
                    variant="default"
                  >
                    Get Data
                  </Button>
                </div>
                {errors.transaction_date && (
                  <p className="text-sm text-destructive">
                    {errors.transaction_date.message}
                  </p>
                )}
              </div>

              {/* Paid By */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="paid_by" className="w-32 shrink-0">Paid By *</Label>
                  <Controller
                    name="paid_by"
                    control={control}
                    rules={{ required: "Paid by is required" }}
                    render={({ field }) => {
                      // Filter accounts for paid_by (purchasers)
                      const defaultAccounts = accounts.filter(acc => {
                        const subhead = accountSubHeads.find(sh => sh.sub_id === acc.sub_id);
                        if (!subhead) return false;
                        const shName = subhead.subhead_nam?.toLowerCase() || "";
                        return shName.includes("purchaser") || shName.includes("purcher") || shName.includes("customer");
                      });

                      // Get selected account from allAccounts if it exists
                      const selectedAccount = allAccounts.find(
                        (acc) => acc.acc_id?.toString() === field.value,
                      );

                      // Combine defaultAccounts with selected account if it's not in defaultAccounts
                      const options = [
                        ...defaultAccounts.map((acc) => ({
                          value: acc.acc_id.toString(),
                          label: acc.account_nam,
                        })),
                        ...(selectedAccount &&
                          !defaultAccounts.find(
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
                    size="icon"
                    onClick={() => {
                      setAccountSearchField("paid_by");
                      setAccountSearchType(
                        getDefaultAccountSearchType("paid_by"),
                      );
                      setAccountSearchQuery("");
                      setIsAccountSearchDialogOpen(true);
                    }}
                    className="font-bold shrink-0"
                    title="Search Accounts"
                  >
                    =
                  </Button>
                  {/* Paid By Balance Display */}
                  <div className="w-10  text-right">
                    {session?.user?.role !== "USER" && (
                      loadingPaidByBalance ? (
                        <div className="text-sm text-muted-foreground">
                          Loading...
                        </div>
                      ) : (
                        <div className="text-lg font-semibold">
                          {paidByBalance !== null
                            ? paidByBalance.toFixed(2)
                            : "0"}
                        </div>
                      )
                    )}
                  </div>
                </div>
                {errors.paid_by && (
                  <p className="text-sm text-destructive pl-[136px]">
                    {errors.paid_by.message}
                  </p>
                )}
              </div>

              {/* Bank Account */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="bank_account" className="w-32 shrink-0">Bank Account</Label>
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
                    className="shrink-0"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                  <div className="w-10 shrink-0"></div>
                </div>
              </div>

              {/* Received By */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label htmlFor="received_by" className="w-32 shrink-0">Received By *</Label>
                  <Controller
                    name="received_by"
                    control={control}
                    rules={{ required: "Received by is required" }}
                    render={({ field }) => {
                      // Filter accounts for received_by (farmers)
                      const defaultAccounts = accounts.filter(acc => {
                        const subhead = accountSubHeads.find(sh => sh.sub_id === acc.sub_id);
                        if (!subhead) return false;
                        const shName = subhead.subhead_nam?.toLowerCase() || "";
                        if (session?.user?.role === "USER") {
                          return shName.includes("purchaser") || shName.includes("purcher") || shName.includes("customer") || shName.includes("farmer") || shName.includes("former") || shName.includes("supplier");
                        }
                        return shName.includes("farmer") || shName.includes("former") || shName.includes("supplier");
                      });

                      // Get selected account from allAccounts if it exists
                      const selectedAccount = allAccounts.find(
                        (acc) => acc.acc_id?.toString() === field.value,
                      );

                      // Combine defaultAccounts with selected account if it's not in defaultAccounts
                      const options = [
                        ...defaultAccounts.map((acc) => ({
                          value: acc.acc_id.toString(),
                          label: acc.account_nam,
                        })),
                        ...(selectedAccount &&
                          !defaultAccounts.find(
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
                    size="icon"
                    onClick={() => {
                      setAccountSearchField("received_by");
                      setAccountSearchType(
                        getDefaultAccountSearchType("received_by"),
                      );
                      setAccountSearchQuery("");
                      setIsAccountSearchDialogOpen(true);
                    }}
                    className="font-bold shrink-0"
                    title="Search Accounts"
                  >
                    =
                  </Button>
                  {/* Received By Balance Display */}
                  <div className="w-10 shrink-0 text-right">
                    {session?.user?.role !== "USER" && (
                      loadingReceivedByBalance ? (
                        <div className="text-sm text-muted-foreground">
                          Loading...
                        </div>
                      ) : (
                        <div className="text-lg font-semibold">
                          {receivedByBalance !== null
                            ? receivedByBalance.toFixed(2)
                            : "0"}
                        </div>
                      )
                    )}
                  </div>
                </div>
                {errors.received_by && (
                  <p className="text-sm text-destructive pl-[136px]">
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

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : isEditMode
                    ? "Update Transaction"
                    : "Create Transaction"}
              </Button>
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
                </div> */}

                <div className="space-y-2">
                  <Label>Date</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                  </div>
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
                            ).toLocaleDateString("en-GB").replace(/\//g, "-")
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="relative max-h-[600px] overflow-auto [&_[data-slot=table-container]]:overflow-visible">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-20 border-b-2">
                    <TableRow className="border-b">
                      <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Date
                      </TableHead>
                      <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Paid By
                      </TableHead>
                      <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Bank Account
                      </TableHead>
                      <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Received By
                      </TableHead>
                      <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Amount
                      </TableHead>
                      <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Description
                      </TableHead>
                      <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow
                        key={transaction.transaction_id}
                        className="hover:bg-muted/50 border-b transition-colors"
                      >
                        <TableCell className="p-2 align-middle whitespace-nowrap">
                          {transaction.transaction_date
                            ? new Date(
                              transaction.transaction_date,
                            ).toLocaleDateString("en-GB").replace(/\//g, "-")
                            : "N/A"}
                        </TableCell>
                        <TableCell className="p-2 align-middle whitespace-nowrap">
                          {accounts.find(
                            (a) => a.acc_id === transaction.paid_by,
                          )?.account_nam || "N/A"}
                        </TableCell>
                        <TableCell className="p-2 align-middle whitespace-nowrap">
                          {transaction.bank_account
                            ? accounts.find(
                              (a) => a.acc_id === transaction.bank_account,
                            )?.account_nam || "N/A"
                            : "N/A"}
                        </TableCell>
                        <TableCell className="p-2 align-middle whitespace-nowrap">
                          {accounts.find(
                            (a) => a.acc_id === transaction.received_by,
                          )?.account_nam || "N/A"}
                        </TableCell>
                        <TableCell className="p-2 align-middle whitespace-nowrap font-medium">
                          {transaction.amount?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </TableCell>
                        <TableCell className="p-2 align-middle">
                          {transaction.description || "N/A"}
                        </TableCell>
                        <TableCell className="p-2 align-middle whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="sticky bottom-0 bg-gray-200 dark:bg-gray-800 z-10 font-bold border-t-2">
                    <TableRow className="hover:bg-gray-200 dark:hover:bg-gray-800 text-base">
                      <TableCell colSpan={4} className="text-right pr-4 text-foreground">Grand Total:</TableCell>
                      <TableCell className="text-foreground">{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}


          </MobileListToggle>
        </CardContent>
      </Card>

      {/* Get Data Modal */}
      <Dialog
        open={isGetDataModalOpen}
        onOpenChange={setIsGetDataModalOpen}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[100vh] overflow-hidden flex flex-col p-4">
          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
              <div className="space-y-2">
                <Label>Search Everything</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search everywhere..."
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
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
            </div>
            <div className="relative flex-1 overflow-auto [&_[data-slot=table-container]]:overflow-visible min-h-0 border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-20 border-b-2 shadow-sm">
                  <TableRow>
                    <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Date</TableHead>
                    <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Paid By</TableHead>
                    <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Bank Account</TableHead>
                    <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Received By</TableHead>
                    <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Amount</TableHead>
                    <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Description</TableHead>
                    <TableHead className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modalFilteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No data found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    modalFilteredTransactions.map((transaction, index) => (
                      <TableRow key={transaction.transaction_id || index} className="py-1">
                        <TableCell className="py-1 px-3 whitespace-nowrap">
                          {transaction.transaction_date
                            ? new Date(transaction.transaction_date).toLocaleDateString("en-GB").replace(/\//g, "-")
                            : "N/A"}
                        </TableCell>
                        <TableCell className="py-1 px-3 whitespace-nowrap">
                          {accounts.find(
                            (a) => a.acc_id === transaction.paid_by,
                          )?.account_nam || "N/A"}
                        </TableCell>
                        <TableCell className="py-1 px-3 whitespace-nowrap">
                          {transaction.bank_account
                            ? accounts.find(
                              (a) => a.acc_id === transaction.bank_account,
                            )?.account_nam || "N/A"
                            : "N/A"}
                        </TableCell>
                        <TableCell className="py-1 px-3 whitespace-nowrap">
                          {accounts.find(
                            (a) => a.acc_id === transaction.received_by,
                          )?.account_nam || "N/A"}
                        </TableCell>
                        <TableCell className="py-1 px-3 whitespace-nowrap font-medium">
                          {transaction.amount?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </TableCell>
                        <TableCell className="py-1 px-3">
                          {transaction.description || "N/A"}
                        </TableCell>
                        <TableCell className="py-1 px-3 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              handleEdit(transaction);
                              setIsGetDataModalOpen(false);
                              document
                                .getElementById("opposite-transaction-form")
                                ?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                <TableFooter className="sticky bottom-0 bg-gray-200 dark:bg-gray-800 z-10 font-bold border-t-2">
                  <TableRow className="hover:bg-gray-200 dark:hover:bg-gray-800 text-base">
                    <TableCell colSpan={4} className="text-right pr-4 text-foreground py-2">Grand Total:</TableCell>
                    <TableCell className="text-foreground py-2">{modalTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell colSpan={2} className="py-2"></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Account Search Dialog */}
      <Dialog
        open={isAccountSearchDialogOpen}
        onOpenChange={setIsAccountSearchDialogOpen}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Search Accounts</DialogTitle>
            <DialogDescription>
              Search and select an account for this transaction
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-4">
              <div className="flex-1 space-y-2">
                <Label>Search Account</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search accounts by name, cnic, contact..."
                    value={accountSearchQuery}
                    onChange={(e) => setAccountSearchQuery(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>
              <div 
                className="flex-1 space-y-2"
                onKeyDown={(e) => {
                  if (e.key === "Tab" && !e.shiftKey) {
                    const moved = focusFirstAccountRow();
                    if (moved) e.preventDefault();
                  }
                }}
              >
                <Label>Account Type (Head)</Label>
                <Combobox
                  options={[
                    { value: "all", label: "All Types" },
                    ...accountSubHeads
                      .filter(
                        (subhead) =>
                          subhead.subhead_nam !== "Expense Head" &&
                          subhead.parent?.subhead_nam !== "Expense Head",
                      )
                      .map((subhead) => ({
                        value: subhead.sub_id.toString(),
                        label: `${subhead.subhead_nam}${subhead.head?.head_nam &&
                          subhead.head.head_nam !== "Main Head"
                          ? ` (${subhead.head.head_nam})`
                          : ""
                          }`,
                      })),
                  ]}
                  value={accountSearchType}
                  onValueChange={setAccountSearchType}
                  placeholder="Select account type"
                  searchPlaceholder="Search account types..."
                  emptyText="No account type found."
                />
              </div>
            </div>
            <div className="relative max-h-[400px] overflow-auto border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Sr. No</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Account Type</TableHead>
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
                        tabIndex={0}
                        ref={(el) => {
                          accountRowRefs.current[index] = el;
                        }}
                        onClick={() => {
                          if (accountSearchField === "paid_by") {
                            setValue("paid_by", acc.acc_id.toString());
                          } else if (accountSearchField === "received_by") {
                            setValue("received_by", acc.acc_id.toString());
                          }
                          setIsAccountSearchDialogOpen(false);
                          setAccountSearchQuery("");
                          setTimeout(() => {
                            if (accountSearchField === "paid_by") {
                              const searchBtns = document.querySelectorAll('button[title="Search Accounts"]');
                              if (searchBtns.length > 1) searchBtns[1].focus();
                            } else if (accountSearchField === "received_by") {
                              document.getElementById("amount")?.focus();
                            }
                          }, 100);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (accountSearchField === "paid_by") {
                              setValue("paid_by", acc.acc_id.toString());
                            } else if (accountSearchField === "received_by") {
                              setValue("received_by", acc.acc_id.toString());
                            }
                            setIsAccountSearchDialogOpen(false);
                            setAccountSearchQuery("");
                            setTimeout(() => {
                              if (accountSearchField === "paid_by") {
                                const searchBtns = document.querySelectorAll('button[title="Search Accounts"]');
                                if (searchBtns.length > 1) searchBtns[1].focus();
                              } else if (accountSearchField === "received_by") {
                                document.getElementById("amount")?.focus();
                              }
                            }, 100);
                          }
                        }}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {acc.account_nam}
                        </TableCell>
                        <TableCell>
                          {accountSubHeads.find(
                            (sh) =>
                              sh.sub_id?.toString() === acc.sub_id?.toString(),
                          )?.subhead_nam || "N/A"}
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
              disabled={
                isCreatingBankAccount ||
                !newBankAccountName.trim() ||
                !bankSubHead
              }
            >
              {isCreatingBankAccount && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isCreatingBankAccount ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
