"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MobileListToggle from "@/app/(interfaces)/components/MobileListToggle";

// Shop customers live in their own table (/api/shop/customers), not in main accounts
export default function ShopCustomerTab({ onCustomerAdded }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shop/customers");
      const data = await res.json();
      if (data.response_status === "success") {
        setCustomers(
          Array.isArray(data.response_result) ? data.response_result : []
        );
      }
    } catch (e) {
      console.error("fetchCustomers:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleClear = () => {
    setName("");
    setContact("");
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Customer name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/shop/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          req_object: {
            customer_nam: trimmedName,
            customer_contact: contact.trim() || null,
          },
        }),
      });
      const data = await res.json();
      if (data.response_status === "success") {
        toast.success("Customer added successfully");
        handleClear();
        fetchCustomers();
        onCustomerAdded?.();
      } else {
        toast.error(data.response_message || "Failed to add customer");
      }
    } catch {
      toast.error("Failed to add customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = searchQuery
    ? customers.filter((c) =>
        c.customer_nam?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : customers;

  return (
    <>
      <Card className="max-w-4xl p-0! mx-auto">
        <CardContent className="p-3 sm:p-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shop_cust_name">Name *</Label>
                <Input
                  id="shop_cust_name"
                  placeholder="Enter customer name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop_cust_contact">Contact (Optional)</Label>
                <Input
                  id="shop_cust_contact"
                  placeholder="Enter contact number"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-8 px-3 text-sm"
                disabled={isSubmitting || !name.trim()}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Adding..." : "Add Customer"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-3 text-sm"
                onClick={handleClear}
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
          <MobileListToggle title="Shop Customers">
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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No customers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((c, idx) => (
                      <TableRow key={c.customer_id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{c.customer_nam}</TableCell>
                        <TableCell>{c.customer_contact || "-"}</TableCell>
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
