"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { Plus, X, Search, Filter, Edit2, Trash2, Phone, PlusCircle } from "lucide-react";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

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
            account_no: "",
            opening_balance: "",
            balance_type: "credit",
            credit_limit: "",
            address: "",
            reference: "",
        },
    });

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingAccountId, setEditingAccountId] = useState(null);
    const [subHeads, setSubHeads] = useState([]);
    const [accountHeads, setAccountHeads] = useState([]);
    const [isAddingSubHead, setIsAddingSubHead] = useState(false);
    const [isSubHeadDialogOpen, setIsSubHeadDialogOpen] = useState(false);
    const [newSubHeadName, setNewSubHeadName] = useState("");
    const [newSubHeadHeadId, setNewSubHeadHeadId] = useState("");

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [filterAccountType, setFilterAccountType] = useState("all");
    const [filterContact, setFilterContact] = useState("");
    const [filterName, setFilterName] = useState("");

    const contactNumbers = watch("contact_numbers");

    useEffect(() => {
        fetchSubHeads();
        fetchAccountHeads();
        fetchAccounts();
    }, []);

    const fetchAccountHeads = async () => {
        try {
            const response = await fetch("/api/account/accountHead/readAll");
            const result = await response.json();

            if (result.response_status === "success") {
                const headsData = result.response_result?.data || result.response_result || [];
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
                const subHeadsData = result.response_result?.data || result.response_result || [];
                setSubHeads(subHeadsData);
            }
        } catch (error) {
            console.error("Error fetching subheads:", error);
            toast.error("Failed to fetch account types");
        }
    };

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/account/accounts/readAll");
            const result = await response.json();

            if (result.response_status === "success") {
                const accountsData = result.response_result?.data || result.response_result || [];
                // Parse contact numbers if stored as JSON string
                const formattedAccounts = accountsData.map(account => ({
                    ...account,
                    contact_numbers: account.account_contact
                        ? (account.account_contact.includes('[')
                            ? JSON.parse(account.account_contact)
                            : account.account_contact.split(',').filter(c => c.trim()))
                        : [],
                }));
                setAccounts(formattedAccounts);
            } else {
                toast.error(result.response_message || "Failed to fetch accounts");
            }
        } catch (error) {
            console.error("Error fetching accounts:", error);
            toast.error("Failed to fetch accounts");
        } finally {
            setLoading(false);
        }
    };

    const handleAddContact = () => {
        const currentContacts = watch("contact_numbers") || [""];
        setValue("contact_numbers", [...currentContacts, ""]);
    };

    const handleRemoveContact = (index) => {
        const currentContacts = watch("contact_numbers") || [""];
        if (currentContacts.length > 1) {
            const newContacts = currentContacts.filter((_, i) => i !== index);
            setValue("contact_numbers", newContacts);
        } else {
            toast.error("At least one contact number is required");
        }
    };

    const handleAddSubHead = async () => {
        if (!newSubHeadName.trim()) {
            toast.error("Subhead name is required");
            return;
        }
        // Use first head if not set
        const headIdToUse = newSubHeadHeadId || (accountHeads.length > 0 ? accountHeads[0].head_id.toString() : null);
        if (!headIdToUse) {
            toast.error("No account head available. Please add an account head first.");
            return;
        }

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
        }
    };

    const onSubmit = async (data) => {
        // Validate at least one contact number
        const validContacts = data.contact_numbers.filter(c => c.trim());
        if (validContacts.length === 0) {
            toast.error("At least one contact number is required");
            return;
        }

        if (!data.sub_id || !data.head_id) {
            toast.error("Please select an account type (subhead)");
            return;
        }

        // Calculate opening balance (negative for debit) - only for new accounts
        let finalBalance = null;
        if (!isEditMode) {
            const openingBalanceValue = parseFloat(data.opening_balance) || 0;
            finalBalance = data.balance_type === "debit"
                ? -Math.abs(openingBalanceValue)
                : Math.abs(openingBalanceValue);
        }

        const payload = {
            req_object: {
                account_nam: data.account_nam.trim(),
                account_contact: JSON.stringify(validContacts),
                account_address: data.address.trim(),
                account_reference: data.reference.trim(),
                head_id: parseInt(data.head_id),
                sub_id: parseInt(data.sub_id),
                account_no: data.account_no?.trim() || null,
                ...(finalBalance !== null && { opening_balance: finalBalance }),
                credit_limit: data.credit_limit ? parseFloat(data.credit_limit) : null,
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
                    isEditMode ? "Account updated successfully" : "Account created successfully"
                );
                reset({
                    sub_id: "",
                    head_id: "",
                    account_nam: "",
                    contact_numbers: [""],
                    account_no: "",
                    opening_balance: "",
                    balance_type: "credit",
                    credit_limit: "",
                    address: "",
                    reference: "",
                });
                setIsEditMode(false);
                setEditingAccountId(null);
                fetchAccounts();
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
            account_no: "",
            opening_balance: "",
            balance_type: "credit",
            credit_limit: "",
            address: "",
            reference: "",
        });
        // Scroll to form
        document.getElementById("account-form")?.scrollIntoView({ behavior: "smooth" });
    };

    const handleEdit = (account) => {
        setIsEditMode(true);
        setEditingAccountId(account.acc_id);

        const contacts = account.contact_numbers && account.contact_numbers.length > 0
            ? account.contact_numbers
            : [""];

        // Determine balance type from opening balance
        const openingBalance = account.opening_balance || 0;
        const balanceType = openingBalance < 0 ? "debit" : "credit";
        const balanceValue = Math.abs(openingBalance);

        reset({
            sub_id: account.sub_id?.toString() || "",
            head_id: account.head_id?.toString() || "",
            account_nam: account.account_nam || "",
            contact_numbers: contacts,
            account_no: account.account_no || "",
            opening_balance: balanceValue.toString(),
            balance_type: balanceType,
            credit_limit: account.credit_limit?.toString() || "",
            address: account.account_address || "",
            reference: account.account_reference || "",
        });
        // Scroll to form
        document.getElementById("account-form")?.scrollIntoView({ behavior: "smooth" });
    };

    const handleDelete = async (accountId) => {
        if (!confirm("Are you sure you want to delete this account?")) {
            return;
        }

        try {
            const response = await fetch(`/api/account/accounts?acc_id=${accountId}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (result.response_status === "success") {
                toast.success("Account deleted successfully");
                fetchAccounts();
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
                <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
                    {textStr.substring(index, index + searchQuery.length)}
                </mark>
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

    // Filter accounts
    const filteredAccounts = accounts.filter((account) => {
        const matchesSearch = searchQuery === "" ||
            account.account_nam?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            account.account_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            account.account_no?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesAccountType = filterAccountType === "all" ||
            account.sub_id?.toString() === filterAccountType;

        const matchesContact = filterContact === "" ||
            (account.contact_numbers && account.contact_numbers.some(c =>
                c?.toString().includes(filterContact)
            )) ||
            account.account_contact?.includes(filterContact);

        const matchesName = filterName === "" ||
            account.account_nam?.toLowerCase().includes(filterName.toLowerCase());

        return matchesSearch && matchesAccountType && matchesContact && matchesName;
    });

    return (
        <div className="p-6 space-y-6">
            {/* Form Section */}
            <Card className={"max-w-4xl mx-auto "} >
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 " id="account-form">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Account Type (Subhead) */}
                            <div className="space-y-2">
                                <Label htmlFor="sub_id">Account Type *</Label>
                                <div className="flex gap-2">
                                    <Controller
                                        name="sub_id"
                                        control={control}
                                        rules={{ required: "Account type is required" }}
                                        render={({ field }) => (
                                            <Select
                                                value={field.value}
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    // Find the selected subhead and set head_id
                                                    const selectedSubHead = subHeads.find(sh => sh.sub_id.toString() === value);
                                                    if (selectedSubHead) {
                                                        setValue("head_id", selectedSubHead.head_id.toString());
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="Select Account " />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {subHeads.map((subHead) => (
                                                        <SelectItem key={subHead.sub_id} value={subHead.sub_id.toString()}>
                                                            {subHead.subhead_nam} {subHead.head?.head_nam && subHead.head.head_nam !== "Main Head" ? `(${subHead.head.head_nam})` : ""}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
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

                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="account_nam">Name *</Label>
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


                            {/* Account No (Bank) */}
                            <div className="space-y-2">
                                <Label htmlFor="account_no">Account No (Bank)</Label>
                                <Input
                                    id="account_no"
                                    {...register("account_no")}
                                    placeholder="Enter bank account number"
                                />
                            </div>

                            {/* Opening Balance - Only show when not in edit mode */}
                            {!isEditMode && (
                                <div className="space-y-2">
                                    <Label htmlFor="opening_balance">Opening Balance</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="opening_balance"
                                            type="number"
                                            step="0.01"
                                            {...register("opening_balance")}
                                            placeholder="0.00"
                                            className="flex-1"
                                        />
                                        <Controller
                                            name="balance_type"
                                            control={control}
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-fit">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="credit">CR</SelectItem>
                                                        <SelectItem value="debit">DB</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                    {/* {watch("balance_type") === "debit" && (
                                        <p className="text-xs text-muted-foreground">
                                            Debit balance will be shown as negative
                                        </p>
                                    )} */}
                                </div>
                            )}
                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Credit Limit */}
                            <div className="space-y-2">
                                <Label htmlFor="credit_limit">Credit Limit</Label>
                                <Input
                                    id="credit_limit"
                                    type="number"
                                    step="0.01"
                                    {...register("credit_limit")}
                                    placeholder="0.00"
                                />
                            </div>


                            {/* Reference */}
                            <div className="space-y-2">
                                <Label htmlFor="reference">Reference</Label>
                                <Input
                                    id="reference"
                                    {...register("reference")}
                                    placeholder="Enter reference"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Contact Numbers - Dynamic */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label>Contact Numbers *</Label>

                                    <Button
                                        type="button"
                                        size={"sm"}
                                        variant="default"
                                        onClick={handleAddContact}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add
                                    </Button>
                                </div>
                                {contactNumbers?.map((contact, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            {...register(`contact_numbers.${index}`, {
                                                required: index === 0 ? "At least one contact number is required" : false,
                                            })}
                                            placeholder={`Contact ${index + 1}`}
                                            type="tel"
                                        />
                                        {contactNumbers.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleRemoveContact(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    {...register("address")}
                                    placeholder="Enter address"
                                    rows={3}
                                />
                            </div>
                        </div>




                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    reset();
                                    setIsEditMode(false);
                                    setEditingAccountId(null);
                                }}
                            >
                                {isEditMode ? "Cancel Edit" : "Clear Form"}
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : isEditMode ? "Update Account" : "Create Account"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Accounts List */}
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
                                        placeholder="Search accounts..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Account Type</Label>
                                <Select value={filterAccountType} onValueChange={setFilterAccountType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {subHeads.map((subHead) => (
                                            <SelectItem key={subHead.sub_id} value={subHead.sub_id.toString()}>
                                                {subHead.subhead_nam} {subHead.head?.head_nam && subHead.head.head_nam !== "Main Head" ? `(${subHead.head.head_nam})` : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Contact No</Label>
                                <Input
                                    placeholder="Filter by contact..."
                                    value={filterContact}
                                    onChange={(e) => setFilterContact(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input
                                    placeholder="Filter by name..."
                                    value={filterName}
                                    onChange={(e) => setFilterName(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : filteredAccounts.length === 0 ? (
                        <div className="text-center h-[300px] flex items-center justify-center py-8 text-muted-foreground">
                            No accounts found
                        </div>
                    ) : (
                        <div className="relative max-h-[300px] overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="sticky top-0 bg-background z-20 border-b-2">
                                    <tr className="border-b">
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Account Type</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Name</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Contact Numbers</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Account No</th>
                                        {/* <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Opening Balance</th> */}
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Credit Limit</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Address</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Reference</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAccounts.map((account) => {
                                        const contacts = account.contact_numbers ||
                                            (account.account_contact
                                                ? (account.account_contact.includes('[')
                                                    ? JSON.parse(account.account_contact)
                                                    : account.account_contact.split(','))
                                                : []);

                                        return (
                                            <tr key={account.acc_id} className="hover:bg-muted/50 border-b transition-colors">
                                                <td className="p-2 align-middle whitespace-nowrap">
                                                    <Badge variant="outline">
                                                        {account.subhead?.subhead_nam ||
                                                            subHeads.find(sh => sh.sub_id === account.sub_id)?.subhead_nam ||
                                                            "N/A"}
                                                    </Badge>
                                                </td>
                                                <td className="p-2 align-middle whitespace-nowrap font-medium">
                                                    {searchQuery || filterName 
                                                        ? highlightText(account.account_nam || "N/A", searchQuery || filterName)
                                                        : (account.account_nam || "N/A")}
                                                </td>
                                                <td className="p-2 align-middle">
                                                    <div className="flex flex-wrap gap-1">
                                                        {contacts.map((contact, idx) => (
                                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                                <Phone className="h-3 w-3 inline mr-1" />
                                                                {filterContact 
                                                                    ? highlightText(contact, filterContact)
                                                                    : contact}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-2 align-middle whitespace-nowrap">
                                                    {searchQuery 
                                                        ? highlightText(account.account_no || "N/A", searchQuery)
                                                        : (account.account_no || "N/A")}
                                                </td>
                                                {/* <td className="p-2 align-middle whitespace-nowrap">
                                                    <span className={account.opening_balance < 0 ? "text-red-600" : "text-green-600"}>
                                                        {account.opening_balance !== null && account.opening_balance !== undefined
                                                            ? account.opening_balance.toLocaleString()
                                                            : "0.00"}
                                                    </span>
                                                </td> */}
                                                <td className="p-2 align-middle whitespace-nowrap">
                                                    {account.credit_limit
                                                        ? account.credit_limit.toLocaleString()
                                                        : "N/A"}
                                                </td>
                                                <td className="p-2 align-middle max-w-xs truncate">
                                                    {account.account_address || "N/A"}
                                                </td>
                                                <td className="p-2 align-middle whitespace-nowrap">
                                                    {searchQuery 
                                                        ? highlightText(account.account_reference || "N/A", searchQuery)
                                                        : (account.account_reference || "N/A")}
                                                </td>
                                                <td className="p-2 align-middle whitespace-nowrap">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(account)}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(account.acc_id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Subhead Dialog */}
            <Dialog open={isSubHeadDialogOpen} onOpenChange={setIsSubHeadDialogOpen}>
                <DialogContent>
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
                            disabled={!newSubHeadName.trim() || !newSubHeadHeadId || accountHeads.length === 0}
                        >
                            Create Account Type
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
