"use client";

import React, { useState } from "react";
import { useAccounts, useSubHeads } from "@/app/utils/hooks";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";
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
import MobileListToggle from "@/app/(interfaces)/components/MobileListToggle";

const emptyForm = () => ({
  name: "",
  contact: "",
  opening_balance: "",
  balance_type: "debit",
});

export default function LocalCustomerTab() {
  const [form, setForm] = useState(emptyForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { accounts: rawAccounts, mutate: mutateAccounts } = useAccounts();
  const { subHeads } = useSubHeads();

  // Local purchasers are main accounts under the LOCAL PURCHASER subhead
  const purchaserAccounts = React.useMemo(() => {
    return (rawAccounts || []).filter(
      (a) =>
        a.head?.head_nam?.toLowerCase().includes("local purchaser") ||
        a.subhead?.subhead_nam?.toLowerCase().includes("local purchaser")
    );
  }, [rawAccounts]);

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = form.name.trim();
    const trimmedContact = form.contact.trim();
    const openingBalance = Number(form.opening_balance || 0);

    if (!trimmedName) {
      toast.error("Customer name is required");
      return;
    }
    if (Number.isNaN(openingBalance) || openingBalance < 0) {
      toast.error("Opening balance must be a positive number");
      return;
    }

    const duplicate = purchaserAccounts.some(
      (a) => a.account_nam?.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      toast.error("A local customer with this name already exists");
      return;
    }

    const targetSubHead = subHeads?.find(
      (s) => s.subhead_nam?.trim().toUpperCase() === "LOCAL PURCHASER"
    );
    const headId = targetSubHead?.head_id || purchaserAccounts[0]?.head_id;
    const subId = targetSubHead?.sub_id || purchaserAccounts[0]?.sub_id;

    if (!headId || !subId) {
      toast.error("LOCAL PURCHASER account type not found");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/account/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          req_object: {
            account_nam: trimmedName,
            account_contact: JSON.stringify(trimmedContact ? [trimmedContact] : []),
            account_address: "",
            account_reference: "",
            head_id: Number(headId),
            sub_id: Number(subId),
            account_no: null,
            shop_enable: 0,
            opening_balance: openingBalance,
            balance_type: form.balance_type,
            account_opening_date: new Date().toISOString().split("T")[0],
            insert_by: "user",
            update_by: "user",
            status: 1,
          },
        }),
      });
      const data = await res.json();
      if (data.response_status === "success" || data.success) {
        toast.success("Local customer account created successfully");
        setForm(emptyForm());
        await mutateAccounts();
      } else {
        toast.error(data.response_message || data.message || "Failed to create account");
      }
    } catch (error) {
      console.error("Error creating local customer account:", error);
      toast.error("Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAccounts = searchQuery
    ? purchaserAccounts.filter((a) =>
        a.account_nam?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : purchaserAccounts;

  const formatContact = (contact) => {
    if (!contact) return "-";
    try {
      const parsed = JSON.parse(contact);
      return Array.isArray(parsed) && parsed.length ? parsed.join(", ") : "-";
    } catch {
      return contact;
    }
  };

  return (
    <>
      <Card className="max-w-4xl p-0! mx-auto">
        <CardContent className="p-3 sm:p-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="local_cust_name">Customer Name *</Label>
                <Input
                  id="local_cust_name"
                  placeholder="Enter customer name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="local_cust_contact">Contact (Optional)</Label>
                <Input
                  id="local_cust_contact"
                  placeholder="e.g. 03001234567"
                  value={form.contact}
                  onChange={(e) => handleChange("contact", e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="local_cust_opening">Opening Balance</Label>
                <Input
                  id="local_cust_opening"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={form.opening_balance}
                  onChange={(e) => handleChange("opening_balance", e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Balance Type</Label>
                <Select
                  value={form.balance_type}
                  onValueChange={(v) => handleChange("balance_type", v)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">Debit (customer owes us)</SelectItem>
                    <SelectItem value="credit">Credit (we owe customer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-8 px-3 text-sm"
                disabled={isSubmitting || !form.name.trim()}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Creating..." : "Create Account"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-3 text-sm"
                onClick={() => setForm(emptyForm())}
                disabled={isSubmitting}
              >
                New
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <MobileListToggle title="Local Customers">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="relative max-h-[400px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Sr</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No local customers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAccounts.map((a, idx) => (
                      <TableRow key={a.acc_id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{a.account_nam}</TableCell>
                        <TableCell>{formatContact(a.account_contact)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </MobileListToggle>
        </CardContent>
      </Card>
    </>
  );
}
