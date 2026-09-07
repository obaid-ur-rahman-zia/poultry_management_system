"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  TableFooter,
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
  const [dateSources, setDateSources] = useState([]);
  const [sourceDisplayMode, setSourceDisplayMode] = useState("date");

  // Balances
  const [purchaserBalance, setPurchaserBalance] = useState(null);
  const [localBalance, setLocalBalance] = useState(null);
  const [loadingLocalBalance, setLoadingLocalBalance] = useState(false);
  const [loadingPurchaserBalance, setLoadingPurchaserBalance] = useState(false);

  // Filter & Pagination & list
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState(
    new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0]
  );

  // Modal state
  const [isGetDataModalOpen, setIsGetDataModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState("");

  // Mobile list toggle state
  const [isMobile, setIsMobile] = useState(false);

  // Delete dialog
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const weightInputRef = useRef(null);

  // ─── computed: stock rows (read-only) ────────────────────────────────
  const stockRows = [0, 1, 2].map((index) => ({
    weight: dateSources[index]?.weight ?? "",
    rate: dateSources[index]?.rate ?? "",
  }));

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
            a.account_nam?.toLowerCase() === "bhagtanwala" &&
            a.subhead?.subhead_nam?.toLowerCase() === "purchaser"
        );
        const purchasers = list.filter(
          (a) =>
            a.head?.head_nam?.toLowerCase().includes("local purchaser") ||
            a.subhead?.subhead_nam?.toLowerCase().includes("local purchaser")
        );
        setLocalAccounts(locals);
        setPurchaserAccounts(purchasers);
        if (locals.length > 0) {
          setForm((prev) => ({
            ...prev,
            local_account: locals[0].acc_id.toString(),
          }));
        }
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

  const fetchDateSources = useCallback(async (date) => {
    if (!date) {
      setDateSources([]);
      return;
    }
    try {
      const res = await fetch(`/api/localSale/read/sources?date=${date}`);
      const data = await res.json();
      setDateSources(data.response_status === "success" ? data.response_result || [] : []);
    } catch (error) {
      console.error("Error fetching Bhagtanwala sources:", error);
      setDateSources([]);
    }
  }, []);

  const fetchSales = useCallback(
    async (dateOverride = null) => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          all: "true",
          filterDate: dateOverride || filterDate,
        });
        const res = await fetch(`/api/localSale/readAll?${queryParams.toString()}`);
        const data = await res.json();
        if (data.response_status === "success") {
          const result = data.response_result;
          const list = result?.data || result || [];
          setSales(Array.isArray(list) ? list : []);
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
    [filterDate]
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
    if (sourceDisplayMode === "snapshot" || !form.local_account) {
      if (!form.local_account) setDateSources([]);
      return;
    }
    fetchDateSources(form.local_sale_date);
  }, [form.local_sale_date, form.local_account, fetchDateSources, sourceDisplayMode]);

  useEffect(() => {
    fetchSales();
  }, [filterDate, fetchSales]);

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
    if (field === "local_sale_date") setSourceDisplayMode("date");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    setForm(emptyForm());
    setIsEditMode(false);
    setEditingId(null);
    setLocalAccountDetail(null);
    setDateSources([]);
    setSourceDisplayMode("date");
    setLocalBalance(null);
    setPurchaserBalance(null);
    document.getElementById("local-sale-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleGetData = () => {
    setModalSearchQuery("");
    setIsGetDataModalOpen(true);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
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

    // Check for duplicate entry for shop-enabled purchaser
    const purchaserObj = allAccounts.find(a => a.acc_id === Number(purchaser_account));
    const isShopPurchaser = purchaserObj && purchaserObj.shop_enable === 1;

    if (isShopPurchaser) {
      let duplicate = null;
      if (filterDate === local_sale_date) {
        duplicate = sales.find(s => 
          s.purchaser_account === Number(purchaser_account) &&
          new Date(s.local_sale_date).toISOString().split('T')[0] === local_sale_date &&
          (!isEditMode || s.local_sale_id !== editingId)
        );
      } else {
        try {
          setIsSubmitting(true);
          const checkRes = await fetch(`/api/localSale/readAll?filterDate=${local_sale_date}&all=true`);
          const checkData = await checkRes.json();
          const dateSales = checkData.response_result?.data || checkData.response_result || [];
          duplicate = dateSales.find(s => 
            s.purchaser_account === Number(purchaser_account) &&
            new Date(s.local_sale_date).toISOString().split('T')[0] === local_sale_date &&
            (!isEditMode || s.local_sale_id !== editingId)
          );
        } catch (e) {
          console.error("Failed to verify duplicate entry:", e);
        } finally {
          setIsSubmitting(false);
        }
      }

      if (duplicate) {
        toast.error("Only one local sale allowed per day for shop accounts.");
        return;
      }
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

    setIsSubmitting(true);
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
        const savedPurchaser = form.purchaser_account;
        handleClear();
        setForm(prev => ({ ...prev, purchaser_account: savedPurchaser }));
        await fetchAccounts();
        fetchSales();
        
        setTimeout(() => {
          weightInputRef.current?.focus();
        }, 100);
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
    const snapshots = sale.source_snapshots?.map((snapshot) => ({
      weight: snapshot.weight,
      rate: snapshot.rate,
    })) || [];
    setDateSources(snapshots);
    setSourceDisplayMode(snapshots.length ? "snapshot" : "date");
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
        fetchSales();
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

  // Calculate Totals for Main List
  const totalListWeight = sales.reduce((sum, sale) => sum + (parseFloat(sale.purchaser_weight) || 0), 0);
  const totalListAmount = sales.reduce((sum, sale) => sum + (parseFloat(sale.purchaser_amount) || 0), 0);
  const totalListReceived = sales.reduce((sum, sale) => sum + (parseFloat(sale.received_amount) || 0), 0);
  const totalListNetBalance = totalListAmount - totalListReceived;

  // Filter for Modal
  const modalFilteredSales = sales.filter((sale) => {
    if (!modalSearchQuery) return true;
    const query = modalSearchQuery.toLowerCase();
    const purchaserName = sale.purchaser_account_ref?.account_nam?.toLowerCase() || "";
    return (
      purchaserName.includes(query) ||
      sale.purchaser_weight?.toString().includes(query) ||
      sale.purchaser_rate?.toString().includes(query) ||
      sale.purchaser_amount?.toString().includes(query) ||
      sale.received_amount?.toString().includes(query)
    );
  });

  const modalTotalWeight = modalFilteredSales.reduce((sum, sale) => sum + (parseFloat(sale.purchaser_weight) || 0), 0);
  const modalTotalAmount = modalFilteredSales.reduce((sum, sale) => sum + (parseFloat(sale.purchaser_amount) || 0), 0);
  const modalTotalReceived = modalFilteredSales.reduce((sum, sale) => sum + (parseFloat(sale.received_amount) || 0), 0);
  const modalTotalNetBalance = modalTotalAmount - modalTotalReceived;


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
                    options={localAccounts.filter((a) => a.account_nam?.toLowerCase() === "bhagtanwala").map((a) => ({
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
                    <span className="text-xs text-muted-foreground">#(W/R)-{i + 1}</span>
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
                      ref={weightInputRef}
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

              {!isEditMode && (
                <Button
                  type="submit"
                  variant="outline"
                  size="xs"
                  className="h-8 px-3 text-l"
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
                    size="xs"
                    className="h-8 px-3 text-l"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : "Update"}
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
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={handleClear}
                className="h-8 px-3 text-l"
              >
                New
              </Button>
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
                      ) : sales.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No local sales found</TableCell>
                        </TableRow>
                      ) : (
                        sales.map((sale, index) => {
                          const rowAmount = Number(sale.purchaser_amount || 0);
                          const rowNet = rowAmount - Number(sale.received_amount || 0);

                          return (
                            <TableRow key={sale.local_sale_id}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{sale.purchaser_account_ref?.account_nam || "N/A"}</TableCell>
                              <TableCell>{sale.purchaser_weight || "0"}</TableCell>
                              <TableCell>{sale.purchaser_rate || "0"}</TableCell>
                              <TableCell>{sale.purchaser_amount || "0"}</TableCell>
                              <TableCell className="text-green-600">{sale.received_amount || "0"}</TableCell>
                              <TableCell className={rowNet < 0 ? "text-green-600 font-semibold" : rowNet > 0 ? "text-red-600 font-semibold" : ""}>{rowNet}</TableCell>
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
                        <TableCell colSpan={2} className="text-right pr-4 py-1">Grand Total:</TableCell>
                        <TableCell className="py-1">{totalListWeight.toFixed(2)}</TableCell>
                        <TableCell className="py-1"></TableCell>
                        <TableCell className="py-1">{totalListAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-green-600 py-1">{totalListReceived.toFixed(2)}</TableCell>
                        <TableCell className={`py-1 ${totalListNetBalance < 0 ? "text-green-600" : totalListNetBalance > 0 ? "text-red-600" : ""}`}>{totalListNetBalance.toFixed(2)}</TableCell>
                        <TableCell className="py-1"></TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
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

      {/* Get Data Modal */}
      <Dialog open={isGetDataModalOpen} onOpenChange={setIsGetDataModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[100vh] overflow-hidden flex flex-col p-4">
          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
              <div className="space-y-2">
                <Label>Search Everything</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by purchaser, amounts, rates..."
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

            <div className="flex-1 overflow-auto border rounded-md [&_[data-slot=table-container]]:overflow-visible">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Sir</TableHead>
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
                  {modalFilteredSales.map((sale, index) => {
                    const rowAmount = Number(sale.purchaser_amount || 0);
                    const rowNet = rowAmount - Number(sale.received_amount || 0);
                    return (
                      <TableRow key={sale.local_sale_id || index}>
                        <TableCell className="py-1">{index + 1}</TableCell>
                        <TableCell className="py-1">{sale.purchaser_account_ref?.account_nam || "N/A"}</TableCell>
                        <TableCell className="py-1">{sale.purchaser_weight || "0"}</TableCell>
                        <TableCell className="py-1">{sale.purchaser_rate || "0"}</TableCell>
                        <TableCell className="py-1">{sale.purchaser_amount || "0"}</TableCell>
                        <TableCell className="text-green-600 py-1">{sale.received_amount || "0"}</TableCell>
                        <TableCell className={`py-1 ${rowNet < 0 ? "text-green-600 font-semibold" : rowNet > 0 ? "text-red-600 font-semibold" : ""}`}>{rowNet}</TableCell>
                        <TableCell className="py-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => {
                              handleEdit(sale);
                              setIsGetDataModalOpen(false);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter className="sticky bottom-0 bg-gray-200 dark:bg-gray-800 z-10 font-bold border-t-2">
                  <TableRow className="hover:bg-gray-200 dark:hover:bg-gray-800 text-base">
                    <TableCell colSpan={2} className="text-right pr-4 py-1">Grand Total:</TableCell>
                    <TableCell className="py-1">{modalTotalWeight.toFixed(2)}</TableCell>
                    <TableCell className="py-1"></TableCell>
                    <TableCell className="py-1">{modalTotalAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600 py-1">{modalTotalReceived.toFixed(2)}</TableCell>
                    <TableCell className={`py-1 ${modalTotalNetBalance < 0 ? "text-green-600" : modalTotalNetBalance > 0 ? "text-red-600" : ""}`}>{modalTotalNetBalance.toFixed(2)}</TableCell>
                    <TableCell className="py-1"></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
          <DialogFooter className="shrink-0 mt-4">
            <Button variant="outline" onClick={() => setIsGetDataModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
