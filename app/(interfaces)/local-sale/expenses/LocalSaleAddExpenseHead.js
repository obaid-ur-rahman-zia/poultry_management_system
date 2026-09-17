"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { Edit2, PlusCircle, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import MobileListToggle from "@/app/(interfaces)/components/MobileListToggle";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";

export default function LocalSaleAddExpenseHead() {
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
            ls_subhead_id: "",
            account_nam: "",
        },
    });

    const [accounts, setAccounts] = useState([]);
    const [subHeads, setSubHeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingAccountId, setEditingAccountId] = useState(null);

    const [isAddingSubHead, setIsAddingSubHead] = useState(false);
    const [isSubHeadDialogOpen, setIsSubHeadDialogOpen] = useState(false);
    const [newSubHeadName, setNewSubHeadName] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 768px)");
        const handleResize = () => setIsMobile(mq.matches);
        handleResize();
        mq.addEventListener("change", handleResize);

        fetchSubHeads();
        fetchAccounts();

        return () => mq.removeEventListener("change", handleResize);
    }, []);

    const fetchSubHeads = async () => {
        try {
            const response = await fetch("/api/localSaleExpense/subHeads");
            const result = await response.json();
            if (result.response_status === "success") {
                setSubHeads(result.response_result || []);
            }
        } catch (error) {
            console.error("Error fetching subheads:", error);
            toast.error("Failed to fetch expense heads");
        }
    };

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/localSaleExpense/accounts");
            const result = await response.json();
            if (result.response_status === "success") {
                setAccounts(result.response_result || []);
            }
        } catch (error) {
            console.error("Error fetching accounts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubHead = async () => {
        if (!newSubHeadName.trim()) {
            toast.error("Expense Head name is required");
            return;
        }

        setIsAddingSubHead(true);
        try {
            const response = await fetch("/api/localSaleExpense/subHeads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    req_object: { subhead_nam: newSubHeadName.trim() },
                }),
            });

            const result = await response.json();
            if (result.response_status === "success") {
                toast.success("Expense Head created successfully");
                await fetchSubHeads();
                const newSubHead = result.response_result;
                if (newSubHead && newSubHead.ls_subhead_id) {
                    setValue("ls_subhead_id", newSubHead.ls_subhead_id.toString());
                }
                setNewSubHeadName("");
                setIsSubHeadDialogOpen(false);
            } else {
                toast.error(result.response_message || "Failed to create Expense Head");
            }
        } catch (error) {
            console.error("Error creating Expense Head:", error);
            toast.error("Failed to create Expense Head");
        } finally {
            setIsAddingSubHead(false);
        }
    };

    const onSubmit = async (data) => {
        const payload = {
            req_object: {
                account_nam: data.account_nam.trim(),
                ls_subhead_id: parseInt(data.ls_subhead_id),
                ...(isEditMode && { ls_account_id: editingAccountId }),
            },
        };

        try {
            const url = "/api/localSaleExpense/accounts";
            const method = isEditMode ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.response_status === "success") {
                toast.success(isEditMode ? "Account updated successfully" : "Account created successfully");
                reset({ ls_subhead_id: data.ls_subhead_id, account_nam: "" });
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

    const handleEdit = (account) => {
        setIsEditMode(true);
        setEditingAccountId(account.ls_account_id);
        reset({
            ls_subhead_id: account.ls_subhead_id?.toString() || "",
            account_nam: account.account_nam || "",
        });
        document.getElementById("ls-account-form")?.scrollIntoView({ behavior: "smooth" });
    };

    const filteredAccounts = accounts.filter((account) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            account.account_nam?.toLowerCase().includes(query) ||
            account.subhead?.subhead_nam?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="p-3 sm:p-4 md:p-6 space-y-4">
            <Card className="max-w-2xl p-0! mx-auto">
                <CardContent className="p-4 sm:p-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="ls-account-form">
                        <div className="space-y-2">
                            <div className="flex gap-2 items-center">
                                <Label htmlFor="ls_subhead_id">Expense Head *</Label>
                                <Controller
                                    name="ls_subhead_id"
                                    control={control}
                                    rules={{ required: "Expense head is required" }}
                                    render={({ field }) => (
                                        <div className="flex-1">
                                            <Combobox
                                                options={subHeads.map((sh) => ({
                                                    value: sh.ls_subhead_id.toString(),
                                                    label: sh.subhead_nam,
                                                }))}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                placeholder="Select Expense Head"
                                                searchPlaceholder="Search expense heads..."
                                                emptyText="No expense head found."
                                            />
                                        </div>
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setIsSubHeadDialogOpen(true)}
                                    title="Add Expense Head"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                </Button>
                            </div>
                            {errors.ls_subhead_id && (
                                <p className="text-sm text-destructive">{errors.ls_subhead_id.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="account_nam">Account Name *</Label>
                            <Input
                                id="account_nam"
                                {...register("account_nam", { required: "Name is required" })}
                                placeholder="Enter account name"
                            />
                            {errors.account_nam && (
                                <p className="text-sm text-destructive">{errors.account_nam.message}</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : isEditMode ? "Update" : "Save"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    reset();
                                    setIsEditMode(false);
                                    setEditingAccountId(null);
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <MobileListToggle title="Accounts">
                        <div className="flex flex-wrap items-center gap-3 mb-4 mt-2">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search account, head..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-8 text-sm"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : filteredAccounts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No accounts found</div>
                        ) : isMobile ? (
                            <div className="space-y-3">
                                {filteredAccounts.map((account) => (
                                    <Card key={account.ls_account_id} className="border shadow-sm">
                                        <CardContent className="p-3 space-y-2">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold">{account.account_nam}</p>
                                                    <p className="text-xs text-muted-foreground">{account.subhead?.subhead_nam}</p>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(account)}>
                                                    <Edit2 className="h-4 w-4" />
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
                                            <th className="h-10 px-2 text-left align-middle font-medium">Sr</th>
                                            <th className="h-10 px-2 text-left align-middle font-medium">Expense Head</th>
                                            <th className="h-10 px-2 text-left align-middle font-medium">Account Name</th>
                                            <th className="h-10 px-2 text-right align-middle font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAccounts.map((account, idx) => (
                                            <tr key={account.ls_account_id} className="hover:bg-muted/50 border-b">
                                                <td className="p-2 align-middle text-muted-foreground">{idx + 1}</td>
                                                <td className="p-2 align-middle">{account.subhead?.subhead_nam}</td>
                                                <td className="p-2 align-middle">{account.account_nam}</td>
                                                <td className="p-2 align-middle text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(account)}>
                                                        <Edit2 className="h-4 w-4 mr-1" /> Edit
                                                    </Button>
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

            <Dialog open={isSubHeadDialogOpen} onOpenChange={setIsSubHeadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Expense Head</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new_subhead_name">Expense Head Name</Label>
                            <Input
                                id="new_subhead_name"
                                placeholder="Enter expense head name"
                                value={newSubHeadName}
                                onChange={(e) => setNewSubHeadName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSubHeadDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddSubHead} disabled={isAddingSubHead}>
                            {isAddingSubHead ? "Adding..." : "Add Expense Head"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
