"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
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
import MobileListToggle from "@/app/(interfaces)/components/MobileListToggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TradingPage() {
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
      trading_date: new Date().toISOString().split('T')[0],
      // Buy From section
      buy_from_account: "",
      do_number: "",
      product_id: "",
      buy_quantity: "",
      buy_price: "",
      buy_tax_type: "flat",
      buy_tax_value: "",
      buy_discount_type: "percentage",
      buy_discount_value: "",
      buy_detail: "",
      // Sale To section
      sale_to_account: "",
      sale_price: "",
      sale_quantity: "",
      sale_tax_type: "flat",
      sale_tax_value: "",
      sale_discount_type: "percentage",
      sale_discount_value: "",
      sale_detail: "",
    },
  });

  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTradeId, setEditingTradeId] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [products, setProducts] = useState([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBuyAccount, setFilterBuyAccount] = useState("all");
  const [filterSaleAccount, setFilterSaleAccount] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Watch form values
  const buyQuantity = watch("buy_quantity");
  const buyPrice = watch("buy_price");
  const buyTaxType = watch("buy_tax_type");
  const buyTaxValue = watch("buy_tax_value");
  const buyDiscountType = watch("buy_discount_type");
  const buyDiscountValue = watch("buy_discount_value");

  const saleQuantity = watch("sale_quantity");
  const salePrice = watch("sale_price");
  const saleTaxType = watch("sale_tax_type");
  const saleTaxValue = watch("sale_tax_value");
  const saleDiscountType = watch("sale_discount_type");
  const saleDiscountValue = watch("sale_discount_value");

  useEffect(() => {
    fetchAccounts();
    fetchProducts();
    fetchTrades();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync sale quantity and price with buy values
  useEffect(() => {
    if (buyQuantity) {
      setValue("sale_quantity", buyQuantity);
    }
  }, [buyQuantity, setValue]);

  useEffect(() => {
    if (buyPrice) {
      setValue("sale_price", buyPrice);
    }
  }, [buyPrice, setValue]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/account/accounts/readAll");
      const result = await response.json();
      if (result.response_status === "success") {
        const accountsData = result.response_result?.data || result.response_result || [];
        setAccounts(Array.isArray(accountsData) ? accountsData : []);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setAccounts([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/product/readAll");
      const result = await response.json();
      if (result.response_status === "success") {
        // API returns { products, nextId }, so we need to extract products
        const productsData = result.response_result?.products || result.response_result?.data || result.response_result || [];
        // Ensure productsData is an array
        if (Array.isArray(productsData)) {
          setProducts(productsData);
        } else if (productsData && typeof productsData === 'object' && productsData.products) {
          // Handle case where response_result is the cached object directly
          setProducts(Array.isArray(productsData.products) ? productsData.products : []);
        } else {
          setProducts([]);
        }
      } else {
        setProducts([]); // Set empty array on error
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]); // Set empty array on error
    }
  };

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/trading/readAll");
      const result = await response.json();
      if (result.response_status === "success") {
        const tradesData = result.response_result?.data || result.response_result || [];
        setTrades(Array.isArray(tradesData) ? tradesData : []);
      } else {
        toast.error(result.response_message || "Failed to fetch trades");
      }
    } catch (error) {
      console.error("Error fetching trades:", error);
      toast.error("Failed to fetch trades");
    } finally {
      setLoading(false);
    }
  };

  const calculateBuyTotal = () => {
    const priceValue = parseFloat(buyPrice) || 0;
    const quantityValue = parseFloat(buyQuantity) || 0;

    let discountedPrice = priceValue;
    if (buyDiscountValue) {
      const discountAmount = buyDiscountType === "percentage"
        ? (priceValue * parseFloat(buyDiscountValue)) / 100
        : parseFloat(buyDiscountValue);
      discountedPrice = Math.max(0, priceValue - discountAmount);
    }

    let finalUnitPrice = discountedPrice;
    if (buyTaxValue) {
      const taxAmount = buyTaxType === "percentage"
        ? (discountedPrice * parseFloat(buyTaxValue)) / 100
        : parseFloat(buyTaxValue);
      finalUnitPrice = Math.max(0, discountedPrice + taxAmount);
    }

    const subtotal = finalUnitPrice * quantityValue;
    return Math.max(0, subtotal);
  };

  const calculateSaleTotal = () => {
    const priceValue = parseFloat(salePrice) || 0;
    const quantityValue = parseFloat(saleQuantity) || 0;

    let discountedPrice = priceValue;
    if (saleDiscountValue) {
      const discountAmount = saleDiscountType === "percentage"
        ? (priceValue * parseFloat(saleDiscountValue)) / 100
        : parseFloat(saleDiscountValue);
      discountedPrice = Math.max(0, priceValue - discountAmount);
    }

    let finalUnitPrice = discountedPrice;
    if (saleTaxValue) {
      const taxAmount = saleTaxType === "percentage"
        ? (discountedPrice * parseFloat(saleTaxValue)) / 100
        : parseFloat(saleTaxValue);
      finalUnitPrice = Math.max(0, discountedPrice + taxAmount);
    }

    const subtotal = finalUnitPrice * quantityValue;
    return Math.max(0, subtotal);
  };

  const onSubmit = async (data) => {
    if (!data.buy_from_account || !data.product_id || !data.buy_price || !data.buy_quantity || !data.sale_to_account) {
      toast.error("Please fill all required fields");
      return;
    }

    const buyTotal = calculateBuyTotal();
    const saleTotal = calculateSaleTotal();

    const payload = {
      req_object: {
        trading_date: data.trading_date,
        buy_from_account: parseInt(data.buy_from_account),
        do_number: data.do_number?.trim() || null,
        product_id: parseInt(data.product_id),
        buy_quantity: parseFloat(data.buy_quantity),
        buy_price: parseFloat(data.buy_price),
        buy_tax_type: data.buy_tax_type,
        buy_tax_value: data.buy_tax_value ? parseFloat(data.buy_tax_value) : 0,
        buy_discount_type: data.buy_discount_type,
        buy_discount_value: data.buy_discount_value ? parseFloat(data.buy_discount_value) : 0,
        buy_total: buyTotal,
        buy_detail: data.buy_detail?.trim() || "",
        sale_to_account: parseInt(data.sale_to_account),
        sale_price: parseFloat(data.sale_price),
        sale_quantity: parseFloat(data.sale_quantity),
        sale_tax_type: data.sale_tax_type,
        sale_tax_value: data.sale_tax_value ? parseFloat(data.sale_tax_value) : 0,
        sale_discount_type: data.sale_discount_type,
        sale_discount_value: data.sale_discount_value ? parseFloat(data.sale_discount_value) : 0,
        sale_total: saleTotal,
        sale_detail: data.sale_detail?.trim() || "",
        ...(isEditMode && { trading_id: editingTradeId }),
      },
    };

    try {
      const url = "/api/trading";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.response_status === "success") {
        toast.success(isEditMode ? "Trade updated successfully" : "Trade created successfully");
        reset({
          trading_date: new Date().toISOString().split('T')[0],
          buy_from_account: "",
          do_number: "",
          product_id: "",
          buy_quantity: "",
          buy_price: "",
          buy_tax_type: "flat",
          buy_tax_value: "",
          buy_discount_type: "percentage",
          buy_discount_value: "",
          buy_detail: "",
          sale_to_account: "",
          sale_price: "",
          sale_quantity: "",
          sale_tax_type: "flat",
          sale_tax_value: "",
          sale_discount_type: "percentage",
          sale_discount_value: "",
          sale_detail: "",
        });
        setIsEditMode(false);
        setEditingTradeId(null);
        fetchTrades();
      } else {
        toast.error(result.response_message || "Failed to save trade");
      }
    } catch (error) {
      console.error("Error saving trade:", error);
      toast.error("Failed to save trade");
    }
  };

  const handleEdit = (trade) => {
    setIsEditMode(true);
    setEditingTradeId(trade.trading_id);
    reset({
      trading_date: trade.trading_date ? new Date(trade.trading_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      buy_from_account: trade.buy_from_account?.toString() || "",
      do_number: trade.do_number || "",
      product_id: trade.product_id?.toString() || "",
      buy_quantity: trade.buy_quantity?.toString() || "",
      buy_price: trade.buy_price?.toString() || "",
      buy_tax_type: trade.buy_tax_type || "flat",
      buy_tax_value: trade.buy_tax_value?.toString() || "",
      buy_discount_type: trade.buy_discount_type || "percentage",
      buy_discount_value: trade.buy_discount_value?.toString() || "",
      buy_detail: trade.buy_detail || "",
      sale_to_account: trade.sale_to_account?.toString() || "",
      sale_price: trade.sale_price?.toString() || "",
      sale_quantity: trade.sale_quantity?.toString() || "",
      sale_tax_type: trade.sale_tax_type || "flat",
      sale_tax_value: trade.sale_tax_value?.toString() || "",
      sale_discount_type: trade.sale_discount_type || "percentage",
      sale_discount_value: trade.sale_discount_value?.toString() || "",
      sale_detail: trade.sale_detail || "",
    });
  };

  const handleDelete = async (tradeId) => {
    if (!confirm("Are you sure you want to delete this trade?")) {
      return;
    }

    try {
      const response = await fetch(`/api/trading?trading_id=${tradeId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.response_status === "success") {
        toast.success("Trade deleted successfully");
        fetchTrades();
      } else {
        toast.error(result.response_message || "Failed to delete trade");
      }
    } catch (error) {
      console.error("Error deleting trade:", error);
      toast.error("Failed to delete trade");
    }
  };

  const handleClear = () => {
    reset({
      trading_date: new Date().toISOString().split('T')[0],
      buy_from_account: "",
      do_number: "",
      product_id: "",
      buy_quantity: "",
      buy_price: "",
      buy_tax_type: "flat",
      buy_tax_value: "",
      buy_discount_type: "percentage",
      buy_discount_value: "",
      buy_detail: "",
      sale_to_account: "",
      sale_price: "",
      sale_quantity: "",
      sale_tax_type: "flat",
      sale_tax_value: "",
      sale_discount_type: "percentage",
      sale_discount_value: "",
      sale_detail: "",
    });
    setIsEditMode(false);
    setEditingTradeId(null);
  };

  // Filter trades
  const filteredTrades = trades.filter((trade) => {
    const matchesSearch = searchQuery === "" ||
      trade.do_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.buy_detail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.sale_detail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(accounts) && accounts.find(a => a.acc_id === trade.buy_from_account)?.account_nam?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (Array.isArray(accounts) && accounts.find(a => a.acc_id === trade.sale_to_account)?.account_nam?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (Array.isArray(products) && products.find(p => p.product_id === trade.product_id)?.product_title?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBuyAccount = filterBuyAccount === "all" ||
      trade.buy_from_account?.toString() === filterBuyAccount;

    const matchesSaleAccount = filterSaleAccount === "all" ||
      trade.sale_to_account?.toString() === filterSaleAccount;

    const matchesDate = filterDate === "" ||
      (trade.trading_date && new Date(trade.trading_date).toISOString().split('T')[0] === filterDate);

    return matchesSearch && matchesBuyAccount && matchesSaleAccount && matchesDate;
  });

  return (
    <div className="container mx-auto sm:p-0 md:p-6 space-y-4 md:space-y-6">
      {/* Trading Form */}
      <Card className="max-w-6xl mx-auto">
        <CardHeader className="p-4 pb-0 sm:p-0">
          <CardTitle className="text-lg sm:text-xl">{isEditMode ? "Edit Trade" : "Create New Trade"}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Buy From Section */}
              <Card className="space-y-4">
                <CardTitle className="text-base sm:text-lg font-semibold">Buy From</CardTitle>
                <CardContent className="">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="trading_date">Date *</Label>
                    <Input
                      id="trading_date"
                      type="date"
                      {...register("trading_date", { required: "Date is required" })}
                    />
                    {errors.trading_date && (
                      <p className="text-sm text-destructive">{errors.trading_date.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buy_from_account">Account *</Label>
                    <Controller
                      name="buy_from_account"
                      control={control}
                      rules={{ required: "Buy from account is required" }}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(accounts) && accounts.map((account) => (
                              <SelectItem key={account.acc_id} value={account.acc_id.toString()}>
                                {account.account_nam}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.buy_from_account && (
                      <p className="text-sm text-destructive">{errors.buy_from_account.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="do_number">D.O Number</Label>
                    <Input
                      id="do_number"
                      {...register("do_number")}
                      placeholder="Enter D.O number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product_id">Product *</Label>
                    <Controller
                      name="product_id"
                      control={control}
                      rules={{ required: "Product is required" }}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(products) && products.map((product) => (
                              <SelectItem key={product.product_id} value={product.product_id.toString()}>
                                {product.product_title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.product_id && (
                      <p className="text-sm text-destructive">{errors.product_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buy_quantity">Quantity *</Label>
                    <Input
                      id="buy_quantity"
                      type="number"
                      step="0.01"
                      {...register("buy_quantity", { required: "Quantity is required", min: 0 })}
                      placeholder="0.00"
                    />
                    {errors.buy_quantity && (
                      <p className="text-sm text-destructive">{errors.buy_quantity.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buy_price">Price *</Label>
                    <Input
                      id="buy_price"
                      type="number"
                      step="0.01"
                      {...register("buy_price", { required: "Price is required", min: 0 })}
                      placeholder="0.00"
                    />
                    {errors.buy_price && (
                      <p className="text-sm text-destructive">{errors.buy_price.message}</p>
                    )}
                  </div>

                </div>

                {/* Tax and Discount for Buy */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Buy Total</Label>
                    <Input
                      value={calculateBuyTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buy_tax_type">Tax Type</Label>
                    <Controller
                      name="buy_tax_type"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flat">Flat</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buy_tax_value">Tax on Price</Label>
                    <Input
                      id="buy_tax_value"
                      type="number"
                      step="0.01"
                      {...register("buy_tax_value", { min: 0 })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buy_discount_type">Discount Type</Label>
                    <Controller
                      name="buy_discount_type"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flat">Flat</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buy_discount_value">Discount on Price</Label>
                    <Input
                      id="buy_discount_value"
                      type="number"
                      step="0.01"
                      {...register("buy_discount_value", { min: 0 })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buy_detail">Detail</Label>
                  <Textarea
                    id="buy_detail"
                    {...register("buy_detail")}
                    placeholder="Enter buy details"
                    rows={3}
                  />
                </div>
                </CardContent>
              </Card>

              {/* Sale To Section */}
              <div className="border rounded-lg p-3 sm:p-4 space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Sale To</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sale_to_account">Account *</Label>
                    <Controller
                      name="sale_to_account"
                      control={control}
                      rules={{ required: "Sale to account is required" }}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(accounts) && accounts.map((account) => (
                              <SelectItem key={account.acc_id} value={account.acc_id.toString()}>
                                {account.account_nam}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.sale_to_account && (
                      <p className="text-sm text-destructive">{errors.sale_to_account.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sale_price">Price *</Label>
                    <Input
                      id="sale_price"
                      type="number"
                      step="0.01"
                      {...register("sale_price", { required: "Price is required", min: 0 })}
                      placeholder="0.00"
                    />
                    {errors.sale_price && (
                      <p className="text-sm text-destructive">{errors.sale_price.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sale_quantity">Quantity *</Label>
                    <Input
                      id="sale_quantity"
                      type="number"
                      step="0.01"
                      {...register("sale_quantity", { required: "Quantity is required", min: 0 })}
                      placeholder="0.00"
                    />
                    {errors.sale_quantity && (
                      <p className="text-sm text-destructive">{errors.sale_quantity.message}</p>
                    )}
                  </div>

                </div>

                {/* Tax and Discount for Sale */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Sale Total</Label>
                    <Input
                      value={calculateSaleTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sale_tax_type">Tax Type</Label>
                    <Controller
                      name="sale_tax_type"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flat">Flat</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sale_tax_value">Tax on Price</Label>
                    <Input
                      id="sale_tax_value"
                      type="number"
                      step="0.01"
                      {...register("sale_tax_value", { min: 0 })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sale_discount_type">Discount Type</Label>
                    <Controller
                      name="sale_discount_type"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flat">Flat</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sale_discount_value">Discount on Price</Label>
                    <Input
                      id="sale_discount_value"
                      type="number"
                      step="0.01"
                      {...register("sale_discount_value", { min: 0 })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sale_detail">Detail</Label>
                  <Textarea
                    id="sale_detail"
                    {...register("sale_detail")}
                    placeholder="Enter sale details"
                    rows={3}
                    className={"h-36"}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
              >
                {isEditMode ? "Cancel Edit" : "Clear Form"}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditMode ? "Update Trade" : "Create Trade"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Trades List */}
      <Card>
        <CardHeader>
          <CardTitle>Trades List</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          {isMobile ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full mb-4">
                  <Search className="h-4 w-4 mr-2" />
                  Search & Filters
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Search & Filters</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search trades..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Buy From Account</Label>
                    <Select value={filterBuyAccount} onValueChange={setFilterBuyAccount}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Accounts</SelectItem>
                        {Array.isArray(accounts) && accounts.map((account) => (
                          <SelectItem key={account.acc_id} value={account.acc_id.toString()}>
                            {account.account_nam}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sale To Account</Label>
                    <Select value={filterSaleAccount} onValueChange={setFilterSaleAccount}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Accounts</SelectItem>
                        {Array.isArray(accounts) && accounts.map((account) => (
                          <SelectItem key={account.acc_id} value={account.acc_id.toString()}>
                            {account.account_nam}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search trades..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Buy From Account</Label>
                  <Select value={filterBuyAccount} onValueChange={setFilterBuyAccount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      {Array.isArray(accounts) && accounts.map((account) => (
                        <SelectItem key={account.acc_id} value={account.acc_id.toString()}>
                          {account.account_nam}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sale To Account</Label>
                  <Select value={filterSaleAccount} onValueChange={setFilterSaleAccount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      {Array.isArray(accounts) && accounts.map((account) => (
                        <SelectItem key={account.acc_id} value={account.acc_id.toString()}>
                          {account.account_nam}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <MobileListToggle title="Trades List">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredTrades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No trades found</div>
            ) : isMobile ? (
              <div className="space-y-3">
                {filteredTrades.map((trade) => (
                  <Card key={trade.trading_id} className="border">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Date</span>
                        <span className="text-sm font-medium">
                          {trade.trading_date ? new Date(trade.trading_date).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">D.O Number</span>
                        <span className="text-sm">{trade.do_number || "N/A"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Product</span>
                        <span className="text-sm font-medium">
                          {Array.isArray(products) && products.find(p => p.product_id === trade.product_id)?.product_title || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Buy From</span>
                        <span className="text-sm font-medium">
                          {Array.isArray(accounts) && accounts.find(a => a.acc_id === trade.buy_from_account)?.account_nam || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Buy Qty</span>
                        <span className="text-sm">{trade.buy_quantity?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Buy Price</span>
                        <span className="text-sm">{trade.buy_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Buy Total</span>
                        <span className="text-sm font-medium">{trade.buy_total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Sale To</span>
                        <span className="text-sm font-medium">
                          {Array.isArray(accounts) && accounts.find(a => a.acc_id === trade.sale_to_account)?.account_nam || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Sale Qty</span>
                        <span className="text-sm">{trade.sale_quantity?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Sale Price</span>
                        <span className="text-sm">{trade.sale_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Sale Total</span>
                        <span className="text-sm font-medium">{trade.sale_total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}</span>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(trade)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(trade.trading_id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                  <Table className="min-w-[1000px]">
                    <TableHeader className="sticky top-0 bg-background z-20">
                      <TableRow>
                        <TableHead className="bg-background">Date</TableHead>
                        <TableHead className="bg-background hidden md:table-cell">D.O Number</TableHead>
                        <TableHead className="bg-background">Product</TableHead>
                        <TableHead className="bg-background hidden lg:table-cell">Buy From</TableHead>
                        <TableHead className="bg-background hidden lg:table-cell">Buy Qty</TableHead>
                        <TableHead className="bg-background hidden xl:table-cell">Buy Price</TableHead>
                        <TableHead className="bg-background hidden xl:table-cell">Buy Total</TableHead>
                        <TableHead className="bg-background hidden lg:table-cell">Sale To</TableHead>
                        <TableHead className="bg-background hidden lg:table-cell">Sale Qty</TableHead>
                        <TableHead className="bg-background hidden xl:table-cell">Sale Price</TableHead>
                        <TableHead className="bg-background hidden xl:table-cell">Sale Total</TableHead>
                        <TableHead className="bg-background">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTrades.map((trade) => (
                        <TableRow key={trade.trading_id}>
                          <TableCell>
                            {trade.trading_date ? new Date(trade.trading_date).toLocaleDateString() : "N/A"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {trade.do_number || "N/A"}
                          </TableCell>
                          <TableCell>
                            {Array.isArray(products) && products.find(p => p.product_id === trade.product_id)?.product_title || "N/A"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {Array.isArray(accounts) && accounts.find(a => a.acc_id === trade.buy_from_account)?.account_nam || "N/A"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {trade.buy_quantity?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {trade.buy_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {trade.buy_total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {Array.isArray(accounts) && accounts.find(a => a.acc_id === trade.sale_to_account)?.account_nam || "N/A"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {trade.sale_quantity?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {trade.sale_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {trade.sale_total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(trade)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(trade.trading_id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </MobileListToggle>
        </CardContent>
      </Card>
    </div>
  );
}
