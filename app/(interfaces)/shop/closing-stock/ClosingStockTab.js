"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MobileListToggle from "@/app/(interfaces)/components/MobileListToggle";
import StockInfoBar, { todayStr, fmtNum, fmtDate } from "../components/StockInfoBar";

export default function ClosingStockTab() {
  const emptyForm = () => ({
    closing_date: todayStr(),
    shop_acc_id: "",
    closing_weight: "",
  });

  const [form, setForm] = useState(emptyForm());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [shops, setShops] = useState([]);
  const [closingStocks, setClosingStocks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [stock, setStock] = useState({
    today_purchase: 0,
    previous_stock: 0,
    total_stock: 0,
    today_closing: null,
  });
  const [loadingStock, setLoadingStock] = useState(false);

  const [filterShop, setFilterShop] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const weightRef = useRef(null);

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

  const fetchStock = useCallback(async (shopId, date) => {
    if (!shopId || !date) {
      setStock({ today_purchase: 0, previous_stock: 0, total_stock: 0, today_closing: null });
      return;
    }
    setLoadingStock(true);
    try {
      const res = await fetch(
        `/api/shop/stock?shop_acc_id=${shopId}&date=${date}`
      );
      const data = await res.json();
      if (data.response_status === "success") {
        const result = data.response_result;
        setStock(result);
        // Pre-fill closing weight if an entry already exists for this shop+date
        if (result?.today_closing?.closing_weight !== undefined) {
          setForm((prev) => ({
            ...prev,
            closing_weight: result.today_closing.closing_weight.toString(),
          }));
        } else {
          setForm((prev) => ({ ...prev, closing_weight: "" }));
        }
      }
    } catch (e) {
      console.error("fetchStock:", e);
    } finally {
      setLoadingStock(false);
    }
  }, []);

  const fetchClosingStocks = useCallback(async (shopId) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (shopId) params.append("shop_acc_id", shopId);
      const res = await fetch(`/api/shop/closing-stock?${params}`);
      const data = await res.json();
      if (data.response_status === "success") {
        setClosingStocks(
          Array.isArray(data.response_result?.data)
            ? data.response_result.data
            : []
        );
      }
    } catch (e) {
      console.error("fetchClosingStocks:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Effects ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  useEffect(() => {
    fetchStock(form.shop_acc_id, form.closing_date);
  }, [form.shop_acc_id, form.closing_date, fetchStock]);

  useEffect(() => {
    fetchClosingStocks(filterShop);
  }, [filterShop, fetchClosingStocks]);

  // ── Handlers ────────────────────────────────────────────────────────
  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleClear = () => {
    const savedShop = form.shop_acc_id;
    setForm({ ...emptyForm(), shop_acc_id: savedShop });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!form.shop_acc_id || !form.closing_date || form.closing_weight === "") {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/shop/closing-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          req_object: {
            shop_acc_id: Number(form.shop_acc_id),
            closing_date: form.closing_date,
            closing_weight: Number(form.closing_weight),
          },
        }),
      });
      const data = await res.json();
      if (data.response_status === "success") {
        toast.success("Closing stock saved successfully");
        fetchClosingStocks(filterShop);
        fetchStock(form.shop_acc_id, form.closing_date);
        setTimeout(() => weightRef.current?.focus(), 100);
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

  // Click row to load into form
  const handleRowClick = (rec) => {
    setForm({
      closing_date: rec.closing_date
        ? new Date(rec.closing_date).toISOString().split("T")[0]
        : todayStr(),
      shop_acc_id: rec.shop_acc_id?.toString() || "",
      closing_weight: rec.closing_weight?.toString() || "",
    });
    document
      .getElementById("closing-stock-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredStocks = searchQuery
    ? closingStocks.filter((s) =>
        s.shop_account?.account_nam
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : closingStocks;

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Form Card ── */}
      <Card className="max-w-4xl p-0! mx-auto">
        <CardContent className="p-3 sm:p-4">
          <form
            className="space-y-4"
            id="closing-stock-form"
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
                  value={form.closing_date}
                  onChange={(e) =>
                    handleChange("closing_date", e.target.value)
                  }
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
              </div>
            </div>

            {/* Row 2: Closing Weight */}
            <div className="flex items-center gap-3 pt-1 border-t border-muted/50">
              <Label className="whitespace-nowrap text-sm">
                Closing Stock
              </Label>
              <Input
                ref={weightRef}
                type="number"
                step="any"
                placeholder="0.00"
                value={form.closing_weight}
                onChange={(e) =>
                  handleChange("closing_weight", e.target.value)
                }
                className="h-8 w-28 text-sm"
                required
              />
              {stock.today_closing && (
                <span className="text-xs text-muted-foreground">
                  (Previously saved: {fmtNum(stock.today_closing.closing_weight)})
                </span>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-8 px-3 text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
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

      {/* ── Closing Stock List ── */}
      <Card>
        <CardContent>
          <MobileListToggle title="Closing Stock History">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search shop..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
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
                    <TableHead>Date</TableHead>
                    <TableHead>Shop</TableHead>
                    <TableHead>Closing Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredStocks.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No closing stock records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStocks.map((rec, idx) => (
                      <TableRow
                        key={rec.closing_id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(rec)}
                      >
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{fmtDate(rec.closing_date)}</TableCell>
                        <TableCell>
                          {rec.shop_account?.account_nam || "N/A"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {fmtNum(rec.closing_weight)}
                        </TableCell>
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
