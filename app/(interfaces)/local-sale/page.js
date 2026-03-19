"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Trash2, ArrowUp, Calendar as CalendarIcon, Edit2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MobileListToggle from "@/app/(interfaces)/components/MobileListToggle";

const fmtDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const today = () => new Date().toISOString().split("T")[0];

const emptyForm = () => ({
  local_sale_date: today(),
  local_account: "",
  purchaser_account: "",
  purchaser_weight: "",
  purchaser_rate: "",
  purchaser_amount: "",
  previous_balance: "",
  received_amount: "",
});

export default function LocalSalePageWrapper() {
  const [activeTab, setActiveTab] = useState("local-sale");

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-1">
          <TabsTrigger value="local-sale">Local Sale</TabsTrigger>
        </TabsList>

        <TabsContent value="local-sale" className="space-y-4">
          <LocalSaleTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LocalSaleTab() {
  // ─── state ───────────────────────────────────────────────────────────
  const [form, setForm] = useState(emptyForm());
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [allAccounts, setAllAccounts] = useState([]);
  const [localAccounts, setLocalAccounts] = useState([]);
  const [purchaserAccounts, setPurchaserAccounts] = useState([]);

  // FS Rate for today
  const [fsRate, setFsRate] = useState({ farm_rate: null, sale_rate: null });

  // Selected local account details (stock rows)
  const [localAccountDetail, setLocalAccountDetail] = useState(null);
  
  // Balances
  const [purchaserBalance, setPurchaserBalance] = useState(null);
  const [localBalance, setLocalBalance] = useState(null);
  const [loadingLocalBalance, setLoadingLocalBalance] = useState(false);
  const [loadingPurchaserBalance, setLoadingPurchaserBalance] = useState(false);

  // Filter & Pagination & list
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  // Mobile list toggle state
  const [isMobile, setIsMobile] = useState(false);

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // ─── computed: stock rows (read-only) ────────────────────────────────
  const stockRows = [
    {
      weight: localAccountDetail?.weight_one ?? "",
      rate: localAccountDetail?.rate_one ?? "",
    },
    {
      weight: localAccountDetail?.weight_two ?? "",
      rate: localAccountDetail?.rate_two ?? "",
    },
    {
      weight: localAccountDetail?.weight_three ?? "",
      rate: localAccountDetail?.rate_three ?? "",
    },
  ];

  const stockAmounts = stockRows.map((r) =>
    r.weight !== "" && r.rate !== ""
      ? Number(r.weight) * Number(r.rate)
      : ""
  );

  const totalStockAmount = stockAmounts.reduce(
    (s, a) => s + (typeof a === "number" ? a : 0),
    0
  );

  // ─── computed: purchaser side ─────────────────────────────────────────
  const purchaserAmount =
    form.purchaser_weight !== "" && form.purchaser_rate !== ""
      ? Number(form.purchaser_weight) * Number(form.purchaser_rate)
      : 0;

  const previousBalance = purchaserBalance !== null ? purchaserBalance : 0;
  
  const netBalance =
    previousBalance + purchaserAmount - Number(form.received_amount || 0);

  // ─── fetch helpers ────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/account/accounts/readAll?all=true");
      const data = await res.json();
      if (data.response_status === "success") {
        const list = data.response_result?.data || data.response_result || [];
        setAllAccounts(Array.isArray(list) ? list : []);

        const locals = list.filter(
          (a) =>
            a.head?.head_nam?.toLowerCase().includes("local sale") ||
            a.subhead?.subhead_nam?.toLowerCase().includes("local sale")
        );
        const purchasers = list.filter(
          (a) =>
            a.head?.head_nam?.toLowerCase().includes("local purchaser") ||
            a.subhead?.subhead_nam?.toLowerCase().includes("local purchaser")
        );
        setLocalAccounts(locals);
        setPurchaserAccounts(purchasers);
      }
    } catch (e) {
      console.error("Error fetching accounts:", e);
    }
  }, []);

  const fetchFsRate = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/wholeSale/checkFsRate?sale_date=${form.local_sale_date}`
      );
      const data = await res.json();
      if (data.response_status === "success" && data.response_result?.exists) {
        setFsRate({
          farm_rate: data.response_result.farm_rate,
          sale_rate: data.response_result.sale_rate,
        });
      } else {
        setFsRate({ farm_rate: null, sale_rate: null });
      }
    } catch (e) {
      console.error("Error fetching FS rate:", e);
    }
  }, [form.local_sale_date]);

  const fetchSales = useCallback(
    async (page = currentPage) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/localSale/readAll?page=${page}&limit=${itemsPerPage}`
        );
        const data = await res.json();
        if (data.response_status === "success") {
          const result = data.response_result;
          if (result?.pagination) {
            setSales(result.data || []);
            setTotalPages(result.pagination.totalPages || 1);
            setTotalItems(result.pagination.total || 0);
            setCurrentPage(result.pagination.page || page);
          } else {
            const list = result?.data || result || [];
            setSales(Array.isArray(list) ? list : []);
            setTotalPages(1);
            setTotalItems(list.length);
          }
        } else {
          toast.error(data.response_message || "Failed to fetch local sales");
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to fetch local sales");
      } finally {
        setLoading(false);
      }
    },
    [currentPage]
  );

  // ─── balance fetch ────────────────────────────────────────────────────
  const fetchBalance = async (accId, setter, loadingSetter) => {
    if (!accId) { setter(null); return; }
    loadingSetter(true);
    try {
      const res = await fetch(`/api/transaction/read/balance?acc_id=${accId}`);
      const data = await res.json();
      if (data.response_status === "success") {
        const result = data.response_result;
        setter(typeof result?.balance === "number" ? result.balance : null);
      } else {
        setter(null);
      }
    } catch {
      setter(null);
    } finally {
      loadingSetter(false);
    }
  };

  // ─── effects ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    fetchFsRate();
  }, [fetchFsRate]);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchSales(1);
    }
  }, [searchQuery, filterDate]); // When filters change, reset to page 1

  useEffect(() => {
    fetchSales(currentPage);
  }, [currentPage, fetchSales]);

  // When local account changes → load its detail & balance
  useEffect(() => {
    if (!form.local_account) {
      setLocalAccountDetail(null);
      setLocalBalance(null);
      return;
    }
    const acc = allAccounts.find(
      (a) => a.acc_id === Number(form.local_account)
    );
    setLocalAccountDetail(acc || null);
    fetchBalance(form.local_account, setLocalBalance, setLoadingLocalBalance);
  }, [form.local_account, allAccounts]);

  // When purchaser account changes → load balance
  useEffect(() => {
    if (!form.purchaser_account) { setPurchaserBalance(null); return; }
    fetchBalance(form.purchaser_account, setPurchaserBalance, setLoadingPurchaserBalance);
  }, [form.purchaser_account]);

  // Keep purchaser_amount in sync (readonly but stored in form for submit)
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      purchaser_amount: purchaserAmount.toString(),
      previous_balance: previousBalance.toString(),
    }));
  }, [purchaserAmount, previousBalance]);

  // ─── handlers ────────────────────────────────────────────────────────
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    setForm(emptyForm());
    setIsEditMode(false);
    setEditingId(null);
    setLocalAccountDetail(null);
    setLocalBalance(null);
    setPurchaserBalance(null);
    document.getElementById("local-sale-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleGetData = () => {
    document.getElementById("local-sale-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const {
      local_sale_date,
      local_account,
      purchaser_account,
      purchaser_weight,
      purchaser_rate,
      received_amount,
    } = form;

    if (
      !local_sale_date ||
      !local_account ||
      !purchaser_account ||
      purchaser_weight === "" ||
      purchaser_rate === ""
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      req_object: {
        local_sale_date,
        local_account: Number(local_account),
        purchaser_account: Number(purchaser_account),
        purchaser_weight: Number(purchaser_weight),
        purchaser_rate: Number(purchaser_rate),
        purchaser_amount: purchaserAmount,
        previous_balance: previousBalance,
        received_amount: Number(received_amount || 0),
        net_balance: netBalance,
        ...(isEditMode && { local_sale_id: editingId }),
      },
    };

    try {
      const method = isEditMode ? "PUT" : "POST";
      const res = await fetch("/api/localSale", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.response_status === "success") {
        toast.success(
          isEditMode
            ? "Local sale updated successfully"
            : "Local sale saved successfully"
        );
        handleClear();
        fetchSales(currentPage);
      } else {
        toast.error(data.response_message || "Operation failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Operation failed");
    }
  };

  const handleEdit = (sale) => {
    setIsEditMode(true);
    setEditingId(sale.local_sale_id);
    setForm({
      local_sale_date: sale.local_sale_date
        ? new Date(sale.local_sale_date).toISOString().split("T")[0]
        : today(),
      local_account: sale.local_account?.toString() || "",
      purchaser_account: sale.purchaser_account?.toString() || "",
      purchaser_weight: sale.purchaser_weight?.toString() || "",
      purchaser_rate: sale.purchaser_rate?.toString() || "",
      purchaser_amount: sale.purchaser_amount?.toString() || "",
      previous_balance: sale.previous_balance?.toString() || "",
      received_amount: sale.received_amount?.toString() || "",
    });
    document.getElementById("local-sale-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = (id) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/localSale?local_sale_id=${deletingId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.response_status === "success") {
        toast.success("Local sale deleted successfully");
        setIsDeleteDialogOpen(false);
        setDeletingId(null);
        if (editingId === deletingId) handleClear();
        fetchSales(currentPage);
      } else {
        toast.error(data.response_message || "Delete failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter local sales client-side
  const filteredSales = sales.filter((sale) => {
    const purchaserName = sale.purchaser_account_ref?.account_nam?.toLowerCase() || "";
    const matchesSearch =
      searchQuery === "" || purchaserName.includes(searchQuery.toLowerCase());
    const matchesDate =
      filterDate === "" ||
      (sale.local_sale_date &&
        new Date(sale.local_sale_date).toISOString().split("T")[0] === filterDate);
    return matchesSearch && matchesDate;
  });

  return (
    <>
      <Card className="max-w-4xl p-0! mx-auto">
        <CardContent className="p-3 sm:p-4">
          <form className="space-y-4" id="local-sale-form" onSubmit={handleSubmit}>
            {/* ── First Row: Date & FS Rate (matching Whole Sale) ── */}
            <div className="flex flex-nowrap items-center gap-2">
              <div className="flex items-center gap-1">
                <Label className="whitespace-nowrap text-l">Date</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={form.local_sale_date}
                    onChange={(e) => handleChange("local_sale_date", e.target.value)}
                    className="h-8 w-[140px] text-l inline-flex"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="default"
                size="xs"
                onClick={handleGetData}
                className="h-8 px-3 text-xs"
              >
                <ArrowUp className="h-3 w-3 mr-1" />
                Get Data
              </Button>
              <div className="flex items-center gap-1">
                <Label className="whitespace-nowrap text-l">F.S Rate</Label>
                <div className="flex items-center gap-1">
                  <Input
                    readOnly
                    type="number"
                    value={fsRate.farm_rate || ""}
                    placeholder="0.00"
                    disabled
                    className="h-8 w-20 text-l bg-muted"
                  />
                  <span className="text-l">-</span>
                  <Input
                    readOnly
                    type="number"
                    value={fsRate.sale_rate || ""}
                    placeholder="0.00"
                    disabled
                    className="h-8 w-20 text-l bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* ── Local Account (Stock Section) ── */}
            <div className="space-y-4 pt-4 border-t border-muted/50">
              <div className="flex w-full items-center gap-1">
                <Label className="whitespace-nowrap text-l">Local Account</Label>
                <div className="w-60">
                  <Combobox
                    options={localAccounts.map((a) => ({
                      value: a.acc_id.toString(),
                      label: a.account_nam,
                    }))}
                    value={form.local_account}
                    onValueChange={(v) => handleChange("local_account", v)}
                    placeholder="Select Local Account"
                    searchPlaceholder="Search accounts..."
                    emptyText="No local account found."
                  />
                </div>
                <div className="flex items-center gap-1">
                  {loadingLocalBalance ? (
                    <span className="text-l text-muted-foreground">Loading...</span>
                  ) : (
                    <span className="text-l underline">
                      Balance {localBalance !== null ? localBalance.toFixed(2) : "0"}
                    </span>
                  )}
                </div>
              </div>

              {/* 3 Weight / Rate Stock Rows displayed inline matching the form constraints */}
              <div className="flex flex-wrap gap-4 pl-[90px]">
                {stockRows.map((row, i) => (
                  <div key={i} className="flex items-center gap-2 bg-muted/20 px-2 py-1 rounded">
                    <span className="text-xs text-muted-foreground">#(W/R)-{i+1}</span>
                    <Input readOnly value={row.weight} className="h-8 w-16 text-l bg-muted" />
                    <Input readOnly value={row.rate} className="h-8 w-16 text-l bg-muted" />
                    <span className="text-l text-muted-foreground underline w-16 px-1">
                      {stockAmounts[i] !== "" ? stockAmounts[i].toFixed(2) : "0"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pr-4">
                 <span className="text-l underline font-semibold">
                   Total Stock Amount {totalStockAmount.toFixed(2)}
                 </span>
              </div>
            </div>

            {/* ── Purchaser Section ── */}
            <div className="space-y-4 pt-4 border-t border-muted/50">
              <div className="flex w-full items-center gap-1">
                <Label className="whitespace-nowrap text-l">Purchaser</Label>
                <div className="w-60">
                  <Combobox
                    options={purchaserAccounts.map((a) => ({
                      value: a.acc_id.toString(),
                      label: a.account_nam,
                    }))}
                    value={form.purchaser_account}
                    onValueChange={(v) => handleChange("purchaser_account", v)}
                    placeholder="Select Purchaser"
                    searchPlaceholder="Search purchasers..."
                    emptyText="No purchaser found."
                  />
                </div>
                <div className="flex items-center gap-1">
                  {loadingPurchaserBalance ? (
                    <span className="text-l text-muted-foreground">Loading...</span>
                  ) : (
                    <span className="text-l underline">
                      Balance {purchaserBalance !== null ? purchaserBalance.toFixed(2) : "0"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-nowrap items-start gap-3">
                <div className="flex flex-col justify-center gap-2">
                  <div className="flex items-center gap-1">
                    <Label className="whitespace-nowrap text-l">Weight</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={form.purchaser_weight}
                      onChange={(e) => handleChange("purchaser_weight", e.target.value)}
                      className="h-8 w-24 text-l"
                      required
                    />
                  </div>
                  <span className="text-l underline">Amount {purchaserAmount.toFixed(2)}</span>
                </div>

                <div className="flex flex-col justify-center gap-2">
                  <div className="flex items-center gap-1">
                    <Label className="whitespace-nowrap text-l">Rate</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={form.purchaser_rate}
                      onChange={(e) => handleChange("purchaser_rate", e.target.value)}
                      className="h-8 w-24 text-l"
                      required
                    />
                  </div>
                  {!isEditMode && <span className="text-l underline">Net Balance {netBalance.toFixed(2)}</span>}
                </div>

                <div className="flex flex-col justify-center gap-2">
                  <div className="flex items-center gap-1">
                    <Label className="whitespace-nowrap text-l">Received</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={form.received_amount}
                      onChange={(e) => handleChange("received_amount", e.target.value)}
                      className="h-8 w-24 text-l"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleClear}
                className="h-8 px-3 text-l"
              >
                New
              </Button>
              {!isEditMode && (
                <Button
                  type="submit"
                  variant="outline"
                  size="xs"
                  className="h-8 px-3 text-l"
                >
                  Save
                </Button>
              )}
              {isEditMode && (
                 <>
                  <Button
                    type="submit"
                    variant="outline"
                    size="xs"
                    className="h-8 px-3 text-l"
                  >
                    Update
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="xs"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="h-8 px-3 text-l"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Transactions List ── */}
      <Card id="local-sale-list">
        <CardContent>
          <MobileListToggle title="Local Sales">
            {isMobile ? (
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">Mobile view coming soon</div>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="space-y-4">
                      <Label>Search</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search purchaser..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="relative max-h-[300px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Sir</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Purchaser</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>Net Balance</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">Loading...</TableCell>
                        </TableRow>
                      ) : filteredSales.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No local sales found</TableCell>
                        </TableRow>
                      ) : (
                        filteredSales.map((sale, index) => {
                          const rowAmount =
                            Number(sale.purchaser_weight || 0) *
                            Number(sale.purchaser_rate || 0);
                          const rowNet = rowAmount - Number(sale.received_amount || 0);
                          
                          return (
                            <TableRow key={sale.local_sale_id}>
                              <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                              <TableCell>{fmtDate(sale.local_sale_date)}</TableCell>
                              <TableCell>{sale.purchaser_account_ref?.account_nam || "N/A"}</TableCell>
                              <TableCell>{sale.purchaser_weight || "0"}</TableCell>
                              <TableCell>{sale.purchaser_rate || "0"}</TableCell>
                              <TableCell>{sale.purchaser_amount || "0"}</TableCell>
                              <TableCell className="text-green-600">{sale.received_amount || "0"}</TableCell>
                              <TableCell className={rowNet < 0 ? "text-green-600 font-semibold" : rowNet > 0 ? "text-red-600 font-semibold" : ""}>{sale.net_balance !== null ? sale.net_balance : (rowNet || "0")}</TableCell>
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
                  </Table>
                </div>
                
                {totalPages > 1 && (
                  <div className="mt-4 flex justify-between items-center">
                     <p className="text-sm text-muted-foreground">
                       Showing page {currentPage} of {totalPages} ({totalItems} records)
                     </p>
                     <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              currentPage > 1 && fetchSales(currentPage - 1)
                            }
                            className={
                              currentPage <= 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let page;
                          if (totalPages <= 5) page = i + 1;
                          else if (currentPage <= 3) page = i + 1;
                          else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                          else page = currentPage - 2 + i;
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                isActive={page === currentPage}
                                onClick={() => fetchSales(page)}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              currentPage < totalPages &&
                              fetchSales(currentPage + 1)
                            }
                            className={
                              currentPage >= totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </MobileListToggle>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Local Sale</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction completely?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
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
    </>
  );
}
