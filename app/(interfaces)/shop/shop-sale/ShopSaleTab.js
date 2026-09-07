"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Plus, Search, Edit2, Trash2, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MobileListToggle from "@/app/(interfaces)/components/MobileListToggle";
import StockInfoBar, { todayStr, fmtNum } from "../components/StockInfoBar";

export default function ShopSaleTab() {
  const emptyForm = () => ({
    sale_date: todayStr(),
    shop_acc_id: "",
    customer_id: "",
    qty: "",
    rate: "",
    received_amount: "",
  });

  const [form, setForm] = useState(emptyForm());
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Master lists
  const [shops, setShops] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);

  // Stock summary
  const [stock, setStock] = useState({
    today_purchase: 0,
    previous_stock: 0,
    total_stock: 0,
  });
  const [loadingStock, setLoadingStock] = useState(false);

  // Shop account balance (from transaction table)
  const [shopBalance, setShopBalance] = useState(null);
  const [loadingShopBal, setLoadingShopBal] = useState(false);

  // Shop customer previous balance
  const [custPrevBalance, setCustPrevBalance] = useState(0);
  const [loadingCustBal, setLoadingCustBal] = useState(false);

  // Add customer dialog
  const [isAddCustOpen, setIsAddCustOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustContact, setNewCustContact] = useState("");
  const [isAddingCust, setIsAddingCust] = useState(false);

  // Delete dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // List filters
  const [filterDate, setFilterDate] = useState(todayStr());
  const [filterShop, setFilterShop] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const qtyRef = useRef(null);

  // Computed
  const amount =
    form.qty !== "" && form.rate !== ""
      ? Number(form.qty) * Number(form.rate)
      : 0;
  const netBalance =
    custPrevBalance + amount - Number(form.received_amount || 0);

  // ── Fetchers ────────────────────────────────────────────────────────
  const fetchShops = useCallback(async () => {
    try {
      const res = await fetch("/api/account/accounts/readAll?all=true");
      const data = await res.json();
      if (data.response_status === "success") {
        const list =
          data.response_result?.data || data.response_result || [];
        const shopList = Array.isArray(list)
          ? list.filter((a) => a.shop_enable === 1)
          : [];
        setShops(shopList);
        if (shopList.length > 0) {
          const firstId = shopList[0].acc_id.toString();
          setForm((prev) =>
            prev.shop_acc_id ? prev : { ...prev, shop_acc_id: firstId }
          );
          setFilterShop((prev) => prev || firstId);
        }
      }
    } catch (e) {
      console.error("fetchShops:", e);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
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
    }
  }, []);

  const fetchStock = useCallback(async (shopId, date) => {
    if (!shopId || !date) {
      setStock({ today_purchase: 0, previous_stock: 0, total_stock: 0 });
      return;
    }
    setLoadingStock(true);
    try {
      const res = await fetch(
        `/api/shop/stock?shop_acc_id=${shopId}&date=${date}`
      );
      const data = await res.json();
      if (data.response_status === "success") {
        setStock(data.response_result);
      }
    } catch (e) {
      console.error("fetchStock:", e);
    } finally {
      setLoadingStock(false);
    }
  }, []);

  const fetchShopBalance = useCallback(async (accId) => {
    if (!accId) { setShopBalance(null); return; }
    setLoadingShopBal(true);
    try {
      const res = await fetch(
        `/api/transaction/read/balance?acc_id=${accId}`
      );
      const data = await res.json();
      setShopBalance(
        data.response_status === "success"
          ? (data.response_result?.balance ?? null)
          : null
      );
    } catch {
      setShopBalance(null);
    } finally {
      setLoadingShopBal(false);
    }
  }, []);

  const fetchCustBalance = useCallback(async (customerId) => {
    if (!customerId) { setCustPrevBalance(0); return; }
    setLoadingCustBal(true);
    try {
      const res = await fetch(
        `/api/shop/customers/balance?customer_id=${customerId}`
      );
      const data = await res.json();
      setCustPrevBalance(
        data.response_status === "success"
          ? (data.response_result?.balance ?? 0)
          : 0
      );
    } catch {
      setCustPrevBalance(0);
    } finally {
      setLoadingCustBal(false);
    }
  }, []);

  const fetchSales = useCallback(
    async (shopId, date) => {
      const shop = shopId ?? filterShop;
      const d = date ?? filterDate;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (shop) params.append("shop_acc_id", shop);
        if (d) params.append("date", d);
        const res = await fetch(`/api/shop/sale/readAll?${params}`);
        const data = await res.json();
        if (data.response_status === "success") {
          setSales(
            Array.isArray(data.response_result?.data)
              ? data.response_result.data
              : []
          );
        }
      } catch (e) {
        console.error("fetchSales:", e);
      } finally {
        setLoading(false);
      }
    },
    [filterShop, filterDate]
  );

  // ── Effects ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchShops();
    fetchCustomers();
  }, [fetchShops, fetchCustomers]);

  useEffect(() => {
    fetchStock(form.shop_acc_id, form.sale_date);
  }, [form.shop_acc_id, form.sale_date, fetchStock]);

  useEffect(() => {
    fetchShopBalance(form.shop_acc_id);
  }, [form.shop_acc_id, fetchShopBalance]);

  useEffect(() => {
    if (form.customer_id) fetchCustBalance(form.customer_id);
    else setCustPrevBalance(0);
  }, [form.customer_id, fetchCustBalance]);

  useEffect(() => {
    fetchSales(filterShop, filterDate);
  }, [filterShop, filterDate, fetchSales]);

  // ── Handlers ────────────────────────────────────────────────────────
  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleClear = () => {
    const savedShop = form.shop_acc_id;
    setForm({ ...emptyForm(), shop_acc_id: savedShop });
    setIsEditMode(false);
    setEditingId(null);
    setCustPrevBalance(0);
    document
      .getElementById("shop-sale-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const { sale_date, shop_acc_id, customer_id, qty, rate } = form;
    if (!sale_date || !shop_acc_id || !customer_id || qty === "" || rate === "") {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      req_object: {
        sale_date,
        shop_acc_id: Number(shop_acc_id),
        customer_id: Number(customer_id),
        qty: Number(qty),
        rate: Number(rate),
        amount,
        previous_balance: custPrevBalance,
        received_amount: Number(form.received_amount || 0),
        net_balance: netBalance,
        ...(isEditMode && { shop_sale_id: editingId }),
      },
    };

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/shop/sale", {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.response_status === "success") {
        toast.success(
          isEditMode ? "Sale updated successfully" : "Sale saved successfully"
        );
        const savedShop = form.shop_acc_id;
        const savedCust = form.customer_id;
        setForm({ ...emptyForm(), shop_acc_id: savedShop, customer_id: savedCust });
        setIsEditMode(false);
        setEditingId(null);
        fetchCustBalance(savedCust);
        fetchSales(savedShop, filterDate);
        fetchStock(savedShop, form.sale_date);
        setTimeout(() => qtyRef.current?.focus(), 100);
      } else {
        toast.error(data.response_message || "Operation failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (sale) => {
    setIsEditMode(true);
    setEditingId(sale.shop_sale_id);
    // Use the stored previous_balance snapshot from the sale record
    setCustPrevBalance(Number(sale.previous_balance || 0));
    setForm({
      sale_date: sale.sale_date
        ? new Date(sale.sale_date).toISOString().split("T")[0]
        : todayStr(),
      shop_acc_id: sale.shop_acc_id?.toString() || "",
      customer_id: sale.customer_id?.toString() || "",
      qty: sale.qty?.toString() || "",
      rate: sale.rate?.toString() || "",
      received_amount: sale.received_amount?.toString() || "",
    });
    document
      .getElementById("shop-sale-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = (id) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/shop/sale?shop_sale_id=${deletingId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.response_status === "success") {
        toast.success("Sale deleted successfully");
        setIsDeleteOpen(false);
        setDeletingId(null);
        if (editingId === deletingId) handleClear();
        fetchSales(filterShop, filterDate);
      } else {
        toast.error(data.response_message || "Delete failed");
      }
    } catch {
      toast.error("Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    setIsAddingCust(true);
    try {
      const res = await fetch("/api/shop/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          req_object: {
            customer_nam: newCustName.trim(),
            customer_contact: newCustContact.trim() || null,
          },
        }),
      });
      const data = await res.json();
      if (data.response_status === "success") {
        toast.success("Customer added successfully");
        await fetchCustomers();
        const newId = data.response_result?.customer_id?.toString() || "";
        setForm((prev) => ({ ...prev, customer_id: newId }));
        setNewCustName("");
        setNewCustContact("");
        setIsAddCustOpen(false);
      } else {
        toast.error(data.response_message || "Failed to add customer");
      }
    } catch {
      toast.error("Failed to add customer");
    } finally {
      setIsAddingCust(false);
    }
  };

  // List computations
  const filteredSales = searchQuery
    ? sales.filter((s) =>
        s.customer?.customer_nam
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : sales;

  const totQty = filteredSales.reduce((s, r) => s + Number(r.qty || 0), 0);
  const totAmount = filteredSales.reduce((s, r) => s + Number(r.amount || 0), 0);
  const totReceived = filteredSales.reduce(
    (s, r) => s + Number(r.received_amount || 0),
    0
  );
  const totNet = totAmount - totReceived;

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Form Card ── */}
      <Card className="max-w-4xl p-0! mx-auto">
        <CardContent className="p-3 sm:p-4">
          <form
            className="space-y-4"
            id="shop-sale-form"
            onSubmit={handleSubmit}
          >
            {/* Stock Info Bar */}
            <StockInfoBar stock={stock} loading={loadingStock} />

            {/* Row 1: Date + Shop */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <Label className="whitespace-nowrap text-sm">Date</Label>
                <Input
                  type="date"
                  value={form.sale_date}
                  onChange={(e) => handleChange("sale_date", e.target.value)}
                  className="h-8 w-[140px] text-sm"
                />
              </div>

              <div className="flex items-center gap-1">
                <Label className="whitespace-nowrap text-sm">Shop</Label>
                <div className="w-52">
                  <Combobox
                    options={shops.map((s) => ({
                      value: s.acc_id.toString(),
                      label: s.account_nam,
                    }))}
                    value={form.shop_acc_id}
                    onValueChange={(v) => handleChange("shop_acc_id", v)}
                    placeholder="Select Shop"
                    searchPlaceholder="Search shops..."
                    emptyText="No shop found."
                  />
                </div>
                {form.shop_acc_id && (
                  <span className="text-sm underline whitespace-nowrap">
                    Balance{" "}
                    {loadingShopBal
                      ? "..."
                      : shopBalance !== null
                      ? fmtNum(shopBalance)
                      : "0.00"}
                  </span>
                )}
              </div>
            </div>

            {/* Row 2: Customer + Prev Balance */}
            <div className="flex flex-wrap items-center gap-2">
              <Label className="whitespace-nowrap text-sm">Customer</Label>
              <div className="w-52">
                <Combobox
                  options={customers.map((c) => ({
                    value: c.customer_id.toString(),
                    label: c.customer_nam,
                  }))}
                  value={form.customer_id}
                  onValueChange={(v) => handleChange("customer_id", v)}
                  placeholder="Select Customer"
                  searchPlaceholder="Search customers..."
                  emptyText="No customer found."
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setIsAddCustOpen(true)}
                title="Add new customer"
              >
                <Plus className="h-4 w-4" />
              </Button>
              {form.customer_id && (
                <span className="text-sm underline whitespace-nowrap">
                  Prev Balance{" "}
                  {loadingCustBal ? "..." : fmtNum(custPrevBalance)}
                </span>
              )}
            </div>

            {/* Row 3: Qty / Rate / Received */}
            <div className="flex flex-wrap items-start gap-4 pt-1 border-t border-muted/50">
              {/* Qty */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <Label className="whitespace-nowrap text-sm">Qty</Label>
                  <Input
                    ref={qtyRef}
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={form.qty}
                    onChange={(e) => handleChange("qty", e.target.value)}
                    className="h-8 w-24 text-sm"
                    required
                  />
                </div>
                <span className="text-sm underline">
                  Amount {fmtNum(amount)}
                </span>
              </div>

              {/* Rate */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <Label className="whitespace-nowrap text-sm">Rate</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={form.rate}
                    onChange={(e) => handleChange("rate", e.target.value)}
                    className="h-8 w-24 text-sm"
                    required
                  />
                </div>
                {!isEditMode && (
                  <span className="text-sm underline">
                    Net Balance {fmtNum(netBalance)}
                  </span>
                )}
              </div>

              {/* Received */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <Label className="whitespace-nowrap text-sm">Received</Label>
                  <Input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={form.received_amount}
                    onChange={(e) =>
                      handleChange("received_amount", e.target.value)
                    }
                    className="h-8 w-24 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              {!isEditMode && (
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              )}
              {isEditMode && (
                <>
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : "Update"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-8 px-3 text-sm"
                    onClick={() => handleDelete(editingId)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-3 text-sm"
                onClick={handleClear}
              >
                New
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Sales List ── */}
      <Card>
        <CardContent>
          <MobileListToggle title="Shop Sales">
            {/* Filters */}
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
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Shop</Label>
                <Combobox
                  options={[
                    { value: "", label: "All Shops" },
                    ...shops.map((s) => ({
                      value: s.acc_id.toString(),
                      label: s.account_nam,
                    })),
                  ]}
                  value={filterShop}
                  onValueChange={setFilterShop}
                  placeholder="All Shops"
                  searchPlaceholder="Search shops..."
                  emptyText="No shop found."
                />
              </div>
            </div>

            {/* Table */}
            <div className="relative max-h-[300px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Sr</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredSales.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No sales found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSales.map((sale, idx) => {
                      const rowNet =
                        Number(sale.amount || 0) -
                        Number(sale.received_amount || 0);
                      return (
                        <TableRow key={sale.shop_sale_id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            {sale.customer?.customer_nam || "N/A"}
                          </TableCell>
                          <TableCell>{sale.qty}</TableCell>
                          <TableCell>{sale.rate}</TableCell>
                          <TableCell>{sale.amount}</TableCell>
                          <TableCell className="text-green-600">
                            {sale.received_amount}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleEdit(sale)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
                <TableFooter className="sticky bottom-0 bg-gray-200 dark:bg-gray-800 z-10 font-bold border-t-2">
                  <TableRow className="hover:bg-gray-200 dark:hover:bg-gray-800 text-base">
                    <TableCell colSpan={2} className="text-right pr-4 py-1">
                      Grand Total:
                    </TableCell>
                    <TableCell className="py-1">{fmtNum(totQty)}</TableCell>
                    <TableCell className="py-1" />
                    <TableCell className="py-1">{fmtNum(totAmount)}</TableCell>
                    <TableCell className="text-green-600 py-1">
                      {fmtNum(totReceived)}
                    </TableCell>
                    <TableCell className="py-1" />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </MobileListToggle>
        </CardContent>
      </Card>

      {/* ── Delete Dialog ── */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shop Sale</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this sale record?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Customer Dialog ── */}
      <Dialog open={isAddCustOpen} onOpenChange={setIsAddCustOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Create a new shop customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new_cust_name">Name *</Label>
              <Input
                id="new_cust_name"
                placeholder="Enter customer name"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomer();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_cust_contact">Contact (Optional)</Label>
              <Input
                id="new_cust_contact"
                placeholder="Enter contact number"
                value={newCustContact}
                onChange={(e) => setNewCustContact(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddCustOpen(false);
                setNewCustName("");
                setNewCustContact("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCustomer}
              disabled={isAddingCust || !newCustName.trim()}
            >
              {isAddingCust && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isAddingCust ? "Adding..." : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
