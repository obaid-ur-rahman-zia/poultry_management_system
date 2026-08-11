"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import {
  Plus,
  X,
  Search,
  Filter,
  Edit2,
  Trash2,
  Phone,
  PlusCircle,
  ArrowUp,
  Calendar as CalendarIcon,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
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

export default function AccountPage() {
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
      sub_id: "",
      head_id: "",
      account_nam: "",
      contact_numbers: [""],
      bank_account_numbers: [""],
      address: "",
      account_opening_date: new Date(),
      opening_balance: "",
      balance_type: "credit",
      reference: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [subHeads, setSubHeads] = useState([]);
  const [accountHeads, setAccountHeads] = useState([]);
  const [isAddingSubHead, setIsAddingSubHead] = useState(false);
  const [isSubHeadDialogOpen, setIsSubHeadDialogOpen] = useState(false);
  const [newSubHeadName, setNewSubHeadName] = useState("");
  const [newSubHeadHeadId, setNewSubHeadHeadId] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [accountOpeningDate, setAccountOpeningDate] = useState(new Date());

  // Account Search Modal states
  const [isAccountSearchDialogOpen, setIsAccountSearchDialogOpen] = useState(false);
  const [accountSearchType, setAccountSearchType] = useState("all");
  const [accountSearchQuery, setAccountSearchQuery] = useState("");
  const [allAccounts, setAllAccounts] = useState([]);

  const contactNumbers = watch("contact_numbers") || [""];
  const bankAccountNumbers = watch("bank_account_numbers") || [""];

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handleResize = () => setIsMobile(mq.matches);
    handleResize();
    mq.addEventListener("change", handleResize);

    fetchSubHeads();
    fetchAccountHeads();
    fetchAllAccounts();

    return () => mq.removeEventListener("change", handleResize);
  }, []);

  const fetchAllAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/account/accounts/readAll?all=true");
      const result = await response.json();

      if (result.success || result.response_status === "success") {
        const responseData = result.response_result;
        if (responseData?.pagination) {
          const accountsData = responseData.data || [];
          setAllAccounts(Array.isArray(accountsData) ? accountsData : []);
        } else {
          const accountsData = responseData?.data || responseData || [];
          setAllAccounts(Array.isArray(accountsData) ? accountsData : []);
        }
      } else {
        toast.error(result.response_message || "Failed to fetch accounts");
      }
    } catch (error) {
      console.error("Error fetching all accounts:", error);
      toast.error("Failed to fetch accounts");
      setAllAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountHeads = async () => {
    try {
      const response = await fetch("/api/account/accountHead/readAll");
      const result = await response.json();

      if (result.response_status === "success") {
        const headsData =
          result.response_result?.data || result.response_result || [];
        setAccountHeads(headsData);
        // Set the first account head as default for new subhead
        if (headsData.length > 0 && !newSubHeadHeadId) {
          setNewSubHeadHeadId(headsData[0].head_id.toString());
        }
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
      toast.error("Failed to fetch account types");
    }
  };

  const handleGetData = async () => {
    // Default to the first subhead (which is Farmer), otherwise 'all'
    setAccountSearchType(subHeads.length > 0 ? subHeads[0].sub_id.toString() : "all");
    setAccountSearchQuery("");
    setIsAccountSearchDialogOpen(true);
  };

  const handleAddContactNumber = () => {
    const currentContacts = watch("contact_numbers") || [""];
    setValue("contact_numbers", [...currentContacts, ""]);
  };

  const handleRemoveContactNumber = (index) => {
    const currentContacts = watch("contact_numbers") || [""];
    if (currentContacts.length > 1) {
      const newContacts = currentContacts.filter((_, i) => i !== index);
      setValue("contact_numbers", newContacts);
    } else {
      toast.error("At least one contact number field is required");
    }
  };

  const handleAddBankAccount = () => {
    const currentBankAccounts = watch("bank_account_numbers") || [""];
    setValue("bank_account_numbers", [...currentBankAccounts, ""]);
  };

  const handleRemoveBankAccount = (index) => {
    const currentBankAccounts = watch("bank_account_numbers") || [""];
    if (currentBankAccounts.length > 1) {
      const newBankAccounts = currentBankAccounts.filter((_, i) => i !== index);
      setValue("bank_account_numbers", newBankAccounts);
    } else {
      toast.error("At least one bank account field is required");
    }
  };

  const handleAddSubHead = async () => {
    if (!newSubHeadName.trim()) {
      toast.error("Subhead name is required");
      return;
    }
    // Use first head if not set
    const headIdToUse =
      newSubHeadHeadId ||
      (accountHeads.length > 0 ? accountHeads[0].head_id.toString() : null);
    if (!headIdToUse) {
      toast.error(
        "No account head available. Please add an account head first.",
      );
      return;
    }

    setIsAddingSubHead(true);
    try {
      const payload = {
        req_object: {
          head_id: parseInt(headIdToUse),
          subhead_nam: newSubHeadName.trim(),
          insert_by: "user",
          update_by: "user",
          status: 1,
        },
      };

      const response = await fetch("/api/account/accountSubHead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.response_status === "success") {
        toast.success("Subhead created successfully");
        await fetchSubHeads();
        // Set the newly created subhead as selected
        const newSubHead = result.response_result;
        if (newSubHead && newSubHead.sub_id) {
          setValue("sub_id", newSubHead.sub_id.toString());
          // Use the head_id we already have since controller doesn't return it
          setValue("head_id", headIdToUse);
        }
        setNewSubHeadName("");
        setNewSubHeadHeadId("");
        setIsAddingSubHead(false);
        setIsSubHeadDialogOpen(false);
      } else {
        toast.error(result.response_message || "Failed to create subhead");
      }
    } catch (error) {
      console.error("Error creating subhead:", error);
      toast.error("Failed to create subhead");
    } finally {
      setIsAddingSubHead(false);
    }
  };

  const onSubmit = async (data) => {
    // Validate at least one contact number
    const validContacts = (data.contact_numbers || [])
      .map((c) => c?.trim())
      .filter((c) => c && c.trim());

    if (validContacts.length === 0) {
      toast.error("At least one contact number is required");
      return;
    }

    if (!data.sub_id || !data.head_id) {
      toast.error("Please select an account type (subhead)");
      return;
    }

    // Calculate opening balance (negative for debit)
    let finalBalance = null;
    const openingBalanceValue = parseFloat(data.opening_balance) || 0;
    finalBalance =
      data.balance_type === "credit"
        ? -Math.abs(openingBalanceValue)
        : Math.abs(openingBalanceValue);

    // Combine bank account numbers
    const bankAccounts = (data.bank_account_numbers || [])
      .map((acc) => acc?.trim())
      .filter((acc) => acc && acc.trim());
    const accountNo = bankAccounts.length > 0 ? bankAccounts.join(", ") : null;

    const payload = {
      req_object: {
        account_nam: data.account_nam.trim(),
        account_contact: JSON.stringify(validContacts),
        account_address: data.address.trim(),
        account_reference: data.reference.trim(),
        head_id: parseInt(data.head_id),
        sub_id: parseInt(data.sub_id),
        account_no: accountNo,
        ...(finalBalance !== null && { opening_balance: finalBalance }),
        insert_by: "user",
        update_by: "user",
        status: 1,
        ...(isEditMode && { acc_id: editingAccountId }),
      },
    };

    try {
      const url = isEditMode
        ? "/api/account/accounts"
        : "/api/account/accounts";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log({ payload });
      const result = await response.json();
      console.log({ result });

      if (result.response_status === "success") {
        toast.success(
          isEditMode
            ? "Account updated successfully"
            : "Account created successfully",
        );
        reset({
          sub_id: data.sub_id,
          head_id: data.head_id,
          account_nam: "",
          contact_numbers: [""],
          bank_account_numbers: [""],
          address: "",
          account_opening_date: new Date(),
          opening_balance: "",
          balance_type: "credit",
          reference: "",
        });
        setAccountOpeningDate(new Date());
        setIsEditMode(false);
        setEditingAccountId(null);
        fetchAllAccounts();
      } else {
        toast.error(result.response_message || "Failed to save account");
      }
    } catch (error) {
      console.error("Error saving account:", error);
      toast.error("Failed to save account");
    }
  };

  const handleCreateNew = () => {
    setIsEditMode(false);
    setEditingAccountId(null);
    reset({
      sub_id: "",
      head_id: "",
      account_nam: "",
      contact_numbers: [""],
      bank_account_numbers: [""],
      address: "",
      account_opening_date: new Date(),
      opening_balance: "",
      balance_type: "credit",
      reference: "",
    });
    setAccountOpeningDate(new Date());
    // Scroll to form
    document
      .getElementById("account-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEdit = (account) => {
    setIsEditMode(true);
    setEditingAccountId(account.acc_id);

    const contacts =
      account.contact_numbers && account.contact_numbers.length > 0
        ? account.contact_numbers
        : account.account_contact
          ? account.account_contact.includes("[")
            ? JSON.parse(account.account_contact)
            : account.account_contact.split(",").map((c) => c.trim())
          : [];

    // Ensure at least one empty contact field
    const contactNumbers = contacts.length > 0 ? contacts : [""];

    // Parse bank account numbers if stored as comma-separated
    const bankAccounts = account.account_no
      ? account.account_no.split(",").map((acc) => acc.trim())
      : [];

    // Ensure at least one empty bank account field
    const bankAccountNumbers = bankAccounts.length > 0 ? bankAccounts : [""];

    // Determine balance type from opening balance
    const openingBalance = account.opening_balance || 0;
    const balanceType = openingBalance < 0 ? "debit" : "credit";
    const balanceValue = Math.abs(openingBalance);

    // Set account opening date or use current date
    const openingDate = account.account_opening_date
      ? new Date(account.account_opening_date)
      : new Date();

    reset({
      sub_id: account.sub_id?.toString() || "",
      head_id: account.head_id?.toString() || "",
      account_nam: account.account_nam || "",
      contact_numbers: contactNumbers,
      bank_account_numbers: bankAccountNumbers,
      address: account.account_address || "",
      account_opening_date: openingDate,
      opening_balance: balanceValue.toString(),
      balance_type: balanceType,
      reference: account.account_reference || "",
    });
    setAccountOpeningDate(openingDate);
    // Scroll to form
    document
      .getElementById("account-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = async (accountId) => {
    if (!confirm("Are you sure you want to delete this account?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/account/accounts?acc_id=${accountId}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (result.response_status === "success") {
        toast.success("Account deleted successfully");
        fetchAllAccounts();
      } else {
        toast.error(result.response_message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    }
  };

  // Function to highlight matching text
  const highlightText = (text, searchQuery) => {
    if (!searchQuery || !text) return text;

    const searchLower = searchQuery.toLowerCase();
    const textStr = String(text);
    const textLower = textStr.toLowerCase();

    if (!textLower.includes(searchLower)) return textStr;

    const parts = [];
    let lastIndex = 0;
    let index = textLower.indexOf(searchLower);

    while (index !== -1) {
      // Add text before match
      if (index > lastIndex) {
        parts.push(textStr.substring(lastIndex, index));
      }
      // Add highlighted match
      parts.push(
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded"
        >
          {textStr.substring(index, index + searchQuery.length)}
        </mark>,
      );
      lastIndex = index + searchQuery.length;
      index = textLower.indexOf(searchLower, lastIndex);
    }

    // Add remaining text
    if (lastIndex < textStr.length) {
      parts.push(textStr.substring(lastIndex));
    }

    return parts.length > 0 ? parts : textStr;
  };

  // Removed client-side filtering on paginated data

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4">
      {/* Form Section */}
      <Card className={"max-w-2xl p-0! mx-auto"}>
        <CardContent className="p-4 sm:p-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-2"
            id="account-form"
          >
            {/* Account Type with Get Data Button */}
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <Label htmlFor="sub_id">Account Type</Label>
                <Controller
                  name="sub_id"
                  control={control}
                  rules={{ required: "Account type is required" }}
                  render={({ field }) => (
                    <div className="flex-1">
                      <Combobox
                        options={subHeads
                          .filter(
                            (subHead) =>
                              subHead.subhead_nam !== "Expense Head" &&
                              subHead.parent?.subhead_nam !== "Expense Head"
                          )
                          .map((subHead) => ({
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
                        placeholder="Select Account Type"
                        searchPlaceholder="Search account types..."
                        emptyText="No account type found."
                      />
                    </div>
                  )}
                />
                <Button
                  type="button"
                  variant="default"
                  onClick={handleGetData}
                  className="rounded-full px-4"
                >
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Get Data
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    // Set default head if not set
                    if (!newSubHeadHeadId && accountHeads.length > 0) {
                      setNewSubHeadHeadId(accountHeads[0].head_id.toString());
                    }
                    setIsSubHeadDialogOpen(true);
                  }}
                  title="Add Account Type (Subhead)"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              {errors.sub_id && (
                <p className="text-sm text-destructive">
                  {errors.sub_id.message}
                </p>
              )}
            </div>

            {/* Name - Full Width */}
            <div className="space-y-2 flex gap-2">
              <Label htmlFor="account_nam">Name</Label>
              <Input
                id="account_nam"
                {...register("account_nam", {
                  required: "Name is required",
                })}
                placeholder="Enter account name"
              />
              {errors.account_nam && (
                <p className="text-sm text-destructive">
                  {errors.account_nam.message}
                </p>
              )}
            </div>

            {/* Dynamic Contact Numbers - Two Column Grid */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label>Contact Numbers</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddContactNumber}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contactNumbers.map((contact, index) => (
                  <div key={index} className="space-y-2">
                    {/* <Label htmlFor={`contact_numbers.${index}`}>
                      {index === 0 ? "Mobile" : "Contact No"}
                    </Label> */}
                    <div className="flex gap-2">
                      <Input
                        id={`contact_numbers.${index}`}
                        {...register(`contact_numbers.${index}`, {
                          required:
                            index === 0
                              ? "At least one contact number is required"
                              : false,
                        })}
                        placeholder={
                          index === 0
                            ? "Enter mobile number"
                            : "Enter contact number"
                        }
                        type="tel"
                        className={
                          errors.contact_numbers?.[index]
                            ? "border-destructive flex-1"
                            : "flex-1"
                        }
                      />
                      {contactNumbers.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveContactNumber(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {errors.contact_numbers?.[index] && (
                      <p className="text-sm text-destructive">
                        {errors.contact_numbers[index].message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Bank Account Numbers */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label>Bank Account Numbers</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddBankAccount}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bank Account
                </Button>
              </div>
              <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                {bankAccountNumbers.map((bankAccount, index) => (
                  <div key={index} className="space-y-2">
                    {/* <Label htmlFor={`bank_account_numbers.${index}`}>
                      {index === bankAccountNumbers.length - 1 && index > 0
                        ? "Bank Account No."
                        : "Bank Account No"}
                    </Label> */}
                    <div className="flex gap-2">
                      <Input
                        id={`bank_account_numbers.${index}`}
                        {...register(`bank_account_numbers.${index}`)}
                        placeholder="Enter bank account number"
                        className="flex-1"
                      />
                      {bankAccountNumbers.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveBankAccount(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Address - Full Width */}
            <div className="space-y-2 flex gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="Enter address"
              />
            </div>

            {/* Account Opening Date */}
            <div className="space-y-2 flex gap-2">
              <Label>Account Opening Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w- justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {accountOpeningDate ? (
                      format(accountOpeningDate, "dd MMMM yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={accountOpeningDate}
                    onSelect={(date) => {
                      if (date) {
                        setAccountOpeningDate(date);
                        setValue("account_opening_date", date);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Opening Balance with Radio Buttons */}
            <div className="space-y-2">
              <div className="flex gap-4 items-center">
                <Label htmlFor="opening_balance">Opening Balance</Label>
                <Input
                  id="opening_balance"
                  type="number"
                  step="0.01"
                  {...register("opening_balance")}
                  placeholder="0"
                  className="w-32"
                />
                <Controller
                  name="balance_type"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="credit" id="credit" />
                        <Label htmlFor="credit" className="cursor-pointer">
                          Credit
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="debit" id="debit" />
                        <Label htmlFor="debit" className="cursor-pointer">
                          Debit
                        </Label>
                      </div>
                    </RadioGroup>
                  )}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCreateNew}>
                New
              </Button>
              {!isEditMode && (
                <Button type="submit" disabled={isSubmitting} variant="outline">
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              )}
              {isEditMode && (
                <Button type="submit" disabled={isSubmitting} variant="outline">
                  {isSubmitting ? "Updating..." : "Update"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setIsEditMode(false);
                  setEditingAccountId(null);
                  setAccountOpeningDate(new Date());
                }}
              >
                Reset
              </Button>
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
              Search and select an account to edit
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
              <div className="flex-1 space-y-2">
                <Label>Account Type (Head)</Label>
                <Combobox
                  options={[
                    { value: "all", label: "All Types" },
                    ...subHeads.map((subhead) => ({
                      value: subhead.sub_id.toString(),
                      label: subhead.subhead_nam,
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
                          acc.account_contact?.toLowerCase().includes(query) ||
                          acc.account_no?.toLowerCase().includes(query)
                        );
                      }
                      return true;
                    })
                    .map((acc, index) => (
                      <TableRow
                        key={acc.acc_id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          handleEdit(acc);
                          setIsAccountSearchDialogOpen(false);
                          setAccountSearchQuery("");
                        }}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {acc.account_nam}
                        </TableCell>
                        <TableCell>
                          {subHeads.find((sh) => sh.sub_id === acc.sub_id)?.subhead_nam || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  {allAccounts.length === 0 || allAccounts.filter((acc) => {
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
                          acc.account_contact?.toLowerCase().includes(query) ||
                          acc.account_no?.toLowerCase().includes(query)
                        );
                      }
                      return true;
                    }).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                          No accounts found.
                        </TableCell>
                      </TableRow>
                    ) : null}
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

      {/* Add Subhead Dialog */}
      <Dialog open={isSubHeadDialogOpen} onOpenChange={setIsSubHeadDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Account Type</DialogTitle>
            <DialogDescription>
              Create a new account type for the selected account head.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dialog_subhead_name">Account Type Name *</Label>
              <Input
                id="dialog_subhead_name"
                placeholder="Enter account type name"
                value={newSubHeadName}
                onChange={(e) => setNewSubHeadName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubHead();
                  }
                }}
              />
            </div>
            {/* {accountHeads.length > 0 && newSubHeadHeadId && (
                            <div className="text-sm text-muted-foreground">
                                Account Head: <span className="font-medium">{accountHeads.find(h => h.head_id.toString() === newSubHeadHeadId)?.head_nam || "N/A"}</span>
                            </div>
                        )} */}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsSubHeadDialogOpen(false);
                setNewSubHeadName("");
                setNewSubHeadHeadId("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddSubHead}
              disabled={
                isAddingSubHead ||
                !newSubHeadName.trim() ||
                !newSubHeadHeadId ||
                accountHeads.length === 0
              }
            >
              {isAddingSubHead && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isAddingSubHead ? "Creating..." : "Create Account Type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
