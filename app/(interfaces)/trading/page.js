"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import MobileListToggle from "@/app/(interfaces)/components/MobileListToggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
      trading_date: new Date().toISOString().split("T")[0],
      // Buy From section
      buy_from_account: "",
      do_number: "",
      product_id: "",
      buy_quantity: "",
      buy_price: "",
      buy_tax_type: "flat",
      buy_tax_value: "",
      buy_tax_percentage: false,
      buy_further_tax_value: "",
      buy_further_tax_percentage: false,
      buy_discount_value: "",
      buy_other_discount_value: "",
      buy_detail: "",
      // Sale To section
      sale_to_account: "",
      sale_price: "",
      sale_quantity: "",
      sale_tax_type: "flat",
      sale_tax_value: "",
      sale_tax_percentage: false,
      sale_further_tax_value: "",
      sale_further_tax_percentage: false,
      sale_discount_value: "",
      sale_other_discount_value: "",
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Watch form values
  const buyQuantity = watch("buy_quantity");
  const buyPrice = watch("buy_price");
  const buyTaxType = watch("buy_tax_type");
  const buyTaxValue = watch("buy_tax_value");
  const buyTaxPercentage = watch("buy_tax_percentage");
  const buyFurtherTaxValue = watch("buy_further_tax_value");
  const buyFurtherTaxPercentage = watch("buy_further_tax_percentage");
  const buyDiscountValue = watch("buy_discount_value");
  const buyOtherDiscountValue = watch("buy_other_discount_value");

  const saleQuantity = watch("sale_quantity");
  const salePrice = watch("sale_price");
  const saleTaxType = watch("sale_tax_type");
  const saleTaxValue = watch("sale_tax_value");
  const saleTaxPercentage = watch("sale_tax_percentage");
  const saleFurtherTaxValue = watch("sale_further_tax_value");
  const saleFurtherTaxPercentage = watch("sale_further_tax_percentage");
  const saleDiscountValue = watch("sale_discount_value");
  const saleOtherDiscountValue = watch("sale_other_discount_value");

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

  // Sync sale discount values with buy discount values (only when buy values are set)
  useEffect(() => {
    const buyDiscountStr = buyDiscountValue?.toString().trim();
    if (buyDiscountStr && buyDiscountStr !== "") {
      setValue("sale_discount_value", buyDiscountValue);
    }
  }, [buyDiscountValue, setValue]);

  useEffect(() => {
    const buyOtherDiscountStr = buyOtherDiscountValue?.toString().trim();
    if (buyOtherDiscountStr && buyOtherDiscountStr !== "") {
      setValue("sale_other_discount_value", buyOtherDiscountValue);
    }
  }, [buyOtherDiscountValue, setValue]);

  // Sync sale tax values with buy tax values (only when buy values are set)
  useEffect(() => {
    const buyTaxStr = buyTaxValue?.toString().trim();
    if (buyTaxStr && buyTaxStr !== "") {
      setValue("sale_tax_value", buyTaxValue);
    }
  }, [buyTaxValue, setValue]);

  useEffect(() => {
    if (buyTaxPercentage !== undefined && buyTaxPercentage !== null) {
      setValue("sale_tax_percentage", buyTaxPercentage);
      setValue("sale_tax_type", buyTaxPercentage ? "percentage" : "flat");
    }
  }, [buyTaxPercentage, setValue]);

  useEffect(() => {
    const buyFurtherTaxStr = buyFurtherTaxValue?.toString().trim();
    if (buyFurtherTaxStr && buyFurtherTaxStr !== "") {
      setValue("sale_further_tax_value", buyFurtherTaxValue);
    }
  }, [buyFurtherTaxValue, setValue]);

  useEffect(() => {
    if (
      buyFurtherTaxPercentage !== undefined &&
      buyFurtherTaxPercentage !== null
    ) {
      setValue("sale_further_tax_percentage", buyFurtherTaxPercentage);
    }
  }, [buyFurtherTaxPercentage, setValue]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/account/accounts/readAll?all=true");
      const result = await response.json();
      if (result.response_status === "success") {
        const accountsData =
          result.response_result?.data || result.response_result || [];
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
        const productsData =
          result.response_result?.products ||
          result.response_result?.data ||
          result.response_result ||
          [];
        // Ensure productsData is an array
        if (Array.isArray(productsData)) {
          setProducts(productsData);
        } else if (
          productsData &&
          typeof productsData === "object" &&
          productsData.products
        ) {
          // Handle case where response_result is the cached object directly
          setProducts(
            Array.isArray(productsData.products) ? productsData.products : [],
          );
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

  const fetchTrades = async (page = currentPage, limit = itemsPerPage) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/trading/readAll?page=${page}&limit=${limit}`,
      );
      const result = await response.json();
      if (result.response_status === "success") {
        const responseData = result.response_result;

        // Handle paginated response
        if (responseData?.pagination) {
          const tradesData = responseData.data || [];
          setTrades(Array.isArray(tradesData) ? tradesData : []);
          setTotalPages(responseData.pagination.totalPages || 1);
          setTotalItems(responseData.pagination.total || 0);
          setCurrentPage(responseData.pagination.page || page);
        } else {
          // Fallback for non-paginated response
          const tradesData = responseData?.data || responseData || [];
          setTrades(Array.isArray(tradesData) ? tradesData : []);
          setTotalPages(1);
          setTotalItems(tradesData.length);
        }
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

  const calculateBuyDiscountAmount = () => {
    const priceValue = parseFloat(buyPrice) || 0;
    let totalDiscount = 0;

    // Percentage discount
    if (buyDiscountValue) {
      totalDiscount += (priceValue * parseFloat(buyDiscountValue)) / 100;
    }

    // Flat discount
    if (buyOtherDiscountValue) {
      totalDiscount += parseFloat(buyOtherDiscountValue);
    }

    return totalDiscount;
  };

  const calculateBuyTaxAmount = () => {
    const priceValue = parseFloat(buyPrice) || 0;
    const discountAmount = calculateBuyDiscountAmount();
    const priceAfterDiscount = Math.max(0, priceValue - discountAmount);

    let totalTax = 0;

    // Calculate main tax
    if (buyTaxValue) {
      totalTax += buyTaxPercentage
        ? (priceAfterDiscount * parseFloat(buyTaxValue)) / 100
        : parseFloat(buyTaxValue);
    }

    // Calculate further tax (applied on price after discount)
    if (buyFurtherTaxValue) {
      totalTax += buyFurtherTaxPercentage
        ? (priceAfterDiscount * parseFloat(buyFurtherTaxValue)) / 100
        : parseFloat(buyFurtherTaxValue);
    }

    return totalTax;
  };

  const calculateBuyTotal = () => {
    const priceValue = parseFloat(buyPrice) || 0;
    const quantityValue = parseFloat(buyQuantity) || 0;

    let discountedPrice = priceValue;

    // Calculate total discount (percentage + flat)
    let totalDiscount = 0;
    if (buyDiscountValue) {
      totalDiscount += (priceValue * parseFloat(buyDiscountValue)) / 100;
    }
    if (buyOtherDiscountValue) {
      totalDiscount += parseFloat(buyOtherDiscountValue);
    }
    discountedPrice = Math.max(0, priceValue - totalDiscount);

    let finalUnitPrice = discountedPrice;
    const taxAmount = calculateBuyTaxAmount();
    if (taxAmount > 0) {
      finalUnitPrice = Math.max(0, discountedPrice + taxAmount);
    }

    const subtotal = finalUnitPrice * quantityValue;
    return Math.max(0, subtotal);
  };

  const calculateSaleDiscountAmount = () => {
    const priceValue = parseFloat(salePrice) || 0;
    let totalDiscount = 0;

    // Percentage discount
    if (saleDiscountValue) {
      totalDiscount += (priceValue * parseFloat(saleDiscountValue)) / 100;
    }

    // Flat discount
    if (saleOtherDiscountValue) {
      totalDiscount += parseFloat(saleOtherDiscountValue);
    }

    return totalDiscount;
  };

  const calculateSaleTaxAmount = () => {
    const priceValue = parseFloat(salePrice) || 0;
    const discountAmount = calculateSaleDiscountAmount();
    const priceAfterDiscount = Math.max(0, priceValue - discountAmount);

    let totalTax = 0;

    // Calculate main tax
    if (saleTaxValue) {
      totalTax += saleTaxPercentage
        ? (priceAfterDiscount * parseFloat(saleTaxValue)) / 100
        : parseFloat(saleTaxValue);
    }

    // Calculate further tax (applied on price after discount)
    if (saleFurtherTaxValue) {
      totalTax += saleFurtherTaxPercentage
        ? (priceAfterDiscount * parseFloat(saleFurtherTaxValue)) / 100
        : parseFloat(saleFurtherTaxValue);
    }

    return totalTax;
  };

  const calculateSaleTotal = () => {
    const priceValue = parseFloat(salePrice) || 0;
    const quantityValue = parseFloat(saleQuantity) || 0;

    let discountedPrice = priceValue;

    // Calculate total discount (percentage + flat)
    let totalDiscount = 0;
    if (saleDiscountValue) {
      totalDiscount += (priceValue * parseFloat(saleDiscountValue)) / 100;
    }
    if (saleOtherDiscountValue) {
      totalDiscount += parseFloat(saleOtherDiscountValue);
    }
    discountedPrice = Math.max(0, priceValue - totalDiscount);

    let finalUnitPrice = discountedPrice;
    const taxAmount = calculateSaleTaxAmount();
    if (taxAmount > 0) {
      finalUnitPrice = Math.max(0, discountedPrice + taxAmount);
    }

    const subtotal = finalUnitPrice * quantityValue;
    return Math.max(0, subtotal);
  };

  const onSubmit = async (data) => {
    if (
      !data.buy_from_account ||
      !data.product_id ||
      !data.buy_price ||
      !data.buy_quantity ||
      !data.sale_to_account
    ) {
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
        product_nam: products.find(
          (product) => product.product_id === parseInt(data.product_id),
        )?.product_title,
        buy_quantity: parseFloat(data.buy_quantity),
        buy_price: parseFloat(data.buy_price),
        buy_tax_type: data.buy_tax_type,
        buy_tax_value: data.buy_tax_value ? parseFloat(data.buy_tax_value) : 0,
        buy_discount_type: "percentage", // Always percentage for buy_discount_value
        buy_discount_value: data.buy_discount_value
          ? parseFloat(data.buy_discount_value)
          : 0,
        buy_total: buyTotal,
        buy_detail: data.buy_detail?.trim() || "",
        sale_to_account: parseInt(data.sale_to_account),
        sale_price: parseFloat(data.sale_price),
        sale_quantity: parseFloat(data.sale_quantity),
        sale_tax_type: data.sale_tax_type,
        sale_tax_value: data.sale_tax_value
          ? parseFloat(data.sale_tax_value)
          : 0,
        sale_discount_type: "percentage", // Always percentage for sale_discount_value
        sale_discount_value: data.sale_discount_value
          ? parseFloat(data.sale_discount_value)
          : 0,
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
        toast.success(
          isEditMode
            ? "Trade updated successfully"
            : "Trade created successfully",
        );
        reset({
          trading_date: new Date().toISOString().split("T")[0],
          buy_from_account: "",
          do_number: "",
          product_id: "",
          buy_quantity: "",
          buy_price: "",
          buy_tax_type: "flat",
          buy_tax_value: "",
          buy_tax_percentage: false,
          buy_further_tax_value: "",
          buy_further_tax_percentage: false,
          buy_discount_value: "",
          buy_other_discount_value: "",
          buy_detail: "",
          sale_to_account: "",
          sale_price: "",
          sale_quantity: "",
          sale_tax_type: "flat",
          sale_tax_value: "",
          sale_tax_percentage: false,
          sale_further_tax_value: "",
          sale_further_tax_percentage: false,
          sale_discount_value: "",
          sale_other_discount_value: "",
          sale_detail: "",
        });
        setIsEditMode(false);
        setEditingTradeId(null);
        fetchTrades(currentPage, itemsPerPage);
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

    // If discount_type was "flat", move the value to other_discount_value
    // If discount_type was "percentage", keep it in discount_value
    const buyDiscountValue =
      trade.buy_discount_type === "flat"
        ? ""
        : trade.buy_discount_value?.toString() || "";
    const buyOtherDiscountValue =
      trade.buy_discount_type === "flat"
        ? trade.buy_discount_value?.toString() || ""
        : "";

    const saleDiscountValue =
      trade.sale_discount_type === "flat"
        ? ""
        : trade.sale_discount_value?.toString() || "";
    const saleOtherDiscountValue =
      trade.sale_discount_type === "flat"
        ? trade.sale_discount_value?.toString() || ""
        : "";

    reset({
      trading_date: trade.trading_date
        ? new Date(trade.trading_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      buy_from_account: trade.buy_from_account?.toString() || "",
      do_number: trade.do_number || "",
      product_id: trade.product_id?.toString() || "",
      buy_quantity: trade.buy_quantity?.toString() || "",
      buy_price: trade.buy_price?.toString() || "",
      buy_tax_type: trade.buy_tax_type || "flat",
      buy_tax_value: trade.buy_tax_value?.toString() || "",
      buy_tax_percentage: trade.buy_tax_type === "percentage" || false,
      buy_further_tax_value: trade.buy_further_tax_value?.toString() || "",
      buy_further_tax_percentage:
        trade.buy_further_tax_type === "percentage" || false,
      buy_discount_value: buyDiscountValue,
      buy_other_discount_value: buyOtherDiscountValue,
      buy_detail: trade.buy_detail || "",
      sale_to_account: trade.sale_to_account?.toString() || "",
      sale_price: trade.sale_price?.toString() || "",
      sale_quantity: trade.sale_quantity?.toString() || "",
      sale_tax_type: trade.sale_tax_type || "flat",
      sale_tax_value: trade.sale_tax_value?.toString() || "",
      sale_tax_percentage: trade.sale_tax_type === "percentage" || false,
      sale_further_tax_value: trade.sale_further_tax_value?.toString() || "",
      sale_further_tax_percentage:
        trade.sale_further_tax_type === "percentage" || false,
      sale_discount_value: saleDiscountValue,
      sale_other_discount_value: saleOtherDiscountValue,
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
        fetchTrades(currentPage, itemsPerPage);
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
      trading_date: new Date().toISOString().split("T")[0],
      buy_from_account: "",
      do_number: "",
      product_id: "",
      buy_quantity: "",
      buy_price: "",
      buy_tax_type: "flat",
      buy_tax_value: "",
      buy_tax_percentage: false,
      buy_further_tax_value: "",
      buy_further_tax_percentage: false,
      buy_discount_value: "",
      buy_other_discount_value: "",
      buy_detail: "",
      sale_to_account: "",
      sale_price: "",
      sale_quantity: "",
      sale_tax_type: "flat",
      sale_tax_value: "",
      sale_tax_percentage: false,
      sale_further_tax_value: "",
      sale_further_tax_percentage: false,
      sale_discount_value: "",
      sale_other_discount_value: "",
      sale_detail: "",
    });
    setIsEditMode(false);
    setEditingTradeId(null);
  };

  // Filter trades (client-side filtering on paginated data)
  const filteredTrades = trades.filter((trade) => {
    const matchesSearch =
      searchQuery === "" ||
      trade.do_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.buy_detail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.sale_detail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(accounts) &&
        accounts
          .find((a) => a.acc_id === trade.buy_from_account)
          ?.account_nam?.toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (Array.isArray(accounts) &&
        accounts
          .find((a) => a.acc_id === trade.sale_to_account)
          ?.account_nam?.toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (Array.isArray(products) &&
        products
          .find((p) => p.product_id === trade.product_id)
          ?.product_title?.toLowerCase()
          .includes(searchQuery.toLowerCase()));

    const matchesBuyAccount =
      filterBuyAccount === "all" ||
      trade.buy_from_account?.toString() === filterBuyAccount;

    const matchesSaleAccount =
      filterSaleAccount === "all" ||
      trade.sale_to_account?.toString() === filterSaleAccount;

    const matchesDate =
      filterDate === "" ||
      (trade.trading_date &&
        new Date(trade.trading_date).toISOString().split("T")[0] ===
          filterDate);

    return (
      matchesSearch && matchesBuyAccount && matchesSaleAccount && matchesDate
    );
  });

  // Reset to page 1 when filters change and refetch
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchTrades(1, itemsPerPage);
    }
  }, [searchQuery, filterBuyAccount, filterSaleAccount, filterDate]);

  // Fetch trades when page or itemsPerPage changes
  useEffect(() => {
    fetchTrades(currentPage, itemsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  return (
    <div className="container mx-auto sm:p-0 md:p-6 space-y-4 md:space-y-6">
      {/* Trading Form */}
      <Card className="max-w-7xl mx-auto">
        {/* <CardHeader className="p-4 pb-0 sm:p-0 sm:pl-4 mb-0!">
          <CardTitle className="text-lg sm:text-xl mb-0!">{isEditMode ? "Edit Trade" : "Create New Trade"}</CardTitle>
        </CardHeader> */}
        <CardContent className="p-4 pt-0 sm:p-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Buy From Section */}
              <Card className="space-y-4">
                <CardTitle className="text-base sm:text-lg  sm:pl-4 font-semibold">
                  Buy From
                </CardTitle>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 mb-4 gap-4">
                    {/* Date */}
                    <div className="space-y-2">
                      <Label htmlFor="trading_date">Date *</Label>
                      <Input
                        id="trading_date"
                        type="date"
                        {...register("trading_date", {
                          required: "Date is required",
                        })}
                      />
                      {errors.trading_date && (
                        <p className="text-sm text-destructive">
                          {errors.trading_date.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buy_from_account">Account *</Label>
                      <Controller
                        name="buy_from_account"
                        control={control}
                        rules={{ required: "Buy from account is required" }}
                        render={({ field }) => (
                          <Combobox
                            options={
                              Array.isArray(accounts)
                                ? accounts.map((account) => ({
                                    value: account.acc_id.toString(),
                                    label: account.account_nam,
                                  }))
                                : []
                            }
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select account"
                            searchPlaceholder="Search accounts..."
                            emptyText="No account found."
                          />
                        )}
                      />
                      {errors.buy_from_account && (
                        <p className="text-sm text-destructive">
                          {errors.buy_from_account.message}
                        </p>
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
                          <Combobox
                            options={
                              Array.isArray(products)
                                ? products.map((product) => ({
                                    value: product.product_id.toString(),
                                    label: product.product_title,
                                  }))
                                : []
                            }
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select product"
                            searchPlaceholder="Search products..."
                            emptyText="No product found."
                          />
                        )}
                      />
                      {errors.product_id && (
                        <p className="text-sm text-destructive">
                          {errors.product_id.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* First Row: Price, Discount Type, Discount Value, Discounted Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 mb-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buy_price">Price *</Label>
                      <Input
                        id="buy_price"
                        type="number"
                        step="0.01"
                        {...register("buy_price", {
                          required: "Price is required",
                          min: 0,
                        })}
                        placeholder="0.00"
                      />
                      {errors.buy_price && (
                        <p className="text-sm text-destructive">
                          {errors.buy_price.message}
                        </p>
                      )}
                    </div>

                    {/* <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <Controller
                      name="buy_discount_type"
                      control={control}
                      render={({ field }) => (
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex flex-col gap-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="percentage" id="buy-discount-percentage" />
                            <Label htmlFor="buy-discount-percentage" className="font-normal cursor-pointer">Percentage</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="flat" id="buy-discount-flat" />
                            <Label htmlFor="buy-discount-flat" className="font-normal cursor-pointer">Flat</Label>
                          </div>
                        </RadioGroup>
                      )}
                    />
                  </div> */}

                    <div className="space-y-2">
                      <Label htmlFor="buy_discount_value">
                        Discount Value ( % )
                      </Label>
                      <Input
                        id="buy_discount_value"
                        type="number"
                        step="0.01"
                        {...register("buy_discount_value", { min: 0 })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buy_other_discount_value">
                        Other Discount Value ( flat )
                      </Label>
                      <Input
                        id="buy_other_discount_value"
                        type="number"
                        step="0.01"
                        {...register("buy_other_discount_value", { min: 0 })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Discounted Amount</Label>
                      <div className="p-2 bg-muted/50 rounded-md border border-muted min-h-[2.5rem] flex items-center">
                        <p className="text-sm font-semibold">
                          {buyDiscountValue || buyOtherDiscountValue
                            ? calculateBuyDiscountAmount().toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )
                            : "0.00"}
                        </p>
                      </div>
                    </div>
                    {/* </div> */}

                    {/* Second Row: Quantity, Tax Type, Tax Value, Tax Applied Amount */}
                    {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 mb-4 gap-4"> */}
                    <div className="space-y-2">
                      <Label htmlFor="buy_quantity">Quantity *</Label>
                      <Input
                        id="buy_quantity"
                        type="number"
                        step="0.01"
                        {...register("buy_quantity", {
                          required: "Quantity is required",
                          min: 0,
                        })}
                        placeholder="0.00"
                      />
                      {errors.buy_quantity && (
                        <p className="text-sm text-destructive">
                          {errors.buy_quantity.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="buy_tax_value">Tax Value</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Flat
                          </span>
                          <Switch
                            id="buy_tax_percentage"
                            checked={buyTaxPercentage}
                            onCheckedChange={(checked) => {
                              setValue("buy_tax_percentage", checked);
                              setValue(
                                "buy_tax_type",
                                checked ? "percentage" : "flat",
                              );
                            }}
                          />
                          <span className="text-xs text-muted-foreground">
                            %
                          </span>
                        </div>
                      </div>
                      <Input
                        id="buy_tax_value"
                        type="number"
                        step="0.01"
                        {...register("buy_tax_value", { min: 0 })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="buy_further_tax_value">
                          Further Tax Value
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Flat
                          </span>
                          <Switch
                            id="buy_further_tax_percentage"
                            checked={buyFurtherTaxPercentage}
                            onCheckedChange={(checked) =>
                              setValue("buy_further_tax_percentage", checked)
                            }
                          />
                          <span className="text-xs text-muted-foreground">
                            %
                          </span>
                        </div>
                      </div>
                      <Input
                        id="buy_further_tax_value"
                        type="number"
                        step="0.01"
                        {...register("buy_further_tax_value", { min: 0 })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Tax Applied Amount{" "}
                        {buyTaxValue || buyFurtherTaxValue ? `(Total)` : ""}
                      </Label>
                      <div className="p-2 bg-muted/50 rounded-md border border-muted min-h-[2.5rem] flex items-center">
                        <p className="text-sm font-semibold">
                          {buyTaxValue || buyFurtherTaxValue
                            ? calculateBuyTaxAmount().toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                },
                              )
                            : "0.00"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Third Row: Total, Description */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Buy Total</Label>
                      <div className="p-2 bg-muted rounded-md">
                        <p className="text-lg font-semibold">
                          {calculateBuyTotal().toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
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
                  </div>
                </CardContent>
              </Card>

              {/* Sale To Section */}
              <div className="border rounded-lg p-3 sm:p-4 space-y-4">
                <h3 className="text-base sm:text-lg font-semibold">Sale To</h3>

                <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sale_to_account">Account *</Label>
                    <Controller
                      name="sale_to_account"
                      control={control}
                      rules={{ required: "Sale to account is required" }}
                      render={({ field }) => (
                        <Combobox
                          options={
                            Array.isArray(accounts)
                              ? accounts.map((account) => ({
                                  value: account.acc_id.toString(),
                                  label: account.account_nam,
                                }))
                              : []
                          }
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select account"
                          searchPlaceholder="Search accounts..."
                          emptyText="No account found."
                        />
                      )}
                    />
                    {errors.sale_to_account && (
                      <p className="text-sm text-destructive">
                        {errors.sale_to_account.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* First Row: Price, Discount Type, Discount Value, Discounted Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 mb-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sale_price">Price *</Label>
                    <Input
                      id="sale_price"
                      type="number"
                      step="0.01"
                      {...register("sale_price", {
                        required: "Price is required",
                        min: 0,
                      })}
                      placeholder="0.00"
                    />
                    {errors.sale_price && (
                      <p className="text-sm text-destructive">
                        {errors.sale_price.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sale_discount_value">
                      Discount Value ( % )
                    </Label>
                    <Input
                      id="sale_discount_value"
                      type="number"
                      step="0.01"
                      {...register("sale_discount_value", { min: 0 })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sale_other_discount_value">
                      Other Discount Value ( flat )
                    </Label>
                    <Input
                      id="sale_other_discount_value"
                      type="number"
                      step="0.01"
                      {...register("sale_other_discount_value", { min: 0 })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Discounted Amount</Label>
                    <div className="p-2 bg-muted/50 rounded-md border border-muted min-h-[2.5rem] flex items-center">
                      <p className="text-sm font-semibold">
                        {saleDiscountValue || saleOtherDiscountValue
                          ? calculateSaleDiscountAmount().toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )
                          : "0.00"}
                      </p>
                    </div>
                  </div>
                  {/* </div> */}

                  {/* Second Row: Quantity, Tax Type, Tax Value, Tax Applied Amount */}
                  {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 mb-4 gap-4"> */}
                  <div className="space-y-2">
                    <Label htmlFor="sale_quantity">Quantity *</Label>
                    <Input
                      id="sale_quantity"
                      type="number"
                      step="0.01"
                      {...register("sale_quantity", {
                        required: "Quantity is required",
                        min: 0,
                      })}
                      placeholder="0.00"
                    />
                    {errors.sale_quantity && (
                      <p className="text-sm text-destructive">
                        {errors.sale_quantity.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="sale_tax_value">Tax Value</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Flat
                        </span>
                        <Switch
                          id="sale_tax_percentage"
                          checked={saleTaxPercentage}
                          onCheckedChange={(checked) => {
                            setValue("sale_tax_percentage", checked);
                            setValue(
                              "sale_tax_type",
                              checked ? "percentage" : "flat",
                            );
                          }}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                    <Input
                      id="sale_tax_value"
                      type="number"
                      step="0.01"
                      {...register("sale_tax_value", { min: 0 })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="sale_further_tax_value">
                        Further Tax Value
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Flat
                        </span>
                        <Switch
                          id="sale_further_tax_percentage"
                          checked={saleFurtherTaxPercentage}
                          onCheckedChange={(checked) =>
                            setValue("sale_further_tax_percentage", checked)
                          }
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                    <Input
                      id="sale_further_tax_value"
                      type="number"
                      step="0.01"
                      {...register("sale_further_tax_value", { min: 0 })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Tax Applied Amount{" "}
                      {saleTaxValue || saleFurtherTaxValue ? `(Total)` : ""}
                    </Label>
                    <div className="p-2 bg-muted/50 rounded-md border border-muted min-h-[2.5rem] flex items-center">
                      <p className="text-sm font-semibold">
                        {saleTaxValue || saleFurtherTaxValue
                          ? calculateSaleTaxAmount().toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "0.00"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Third Row: Total, Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sale Total</Label>
                    <div className="p-2 bg-muted rounded-md">
                      <p className="text-lg font-semibold">
                        {calculateSaleTotal().toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
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
            </div>

            {/* Form Actions */}
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={handleClear}>
                {isEditMode ? "Cancel Edit" : "Clear Form"}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : isEditMode
                    ? "Update Trade"
                    : "Create Trade"}
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
                    <Combobox
                      options={[
                        { value: "all", label: "All Accounts" },
                        ...(Array.isArray(accounts)
                          ? accounts.map((account) => ({
                              value: account.acc_id.toString(),
                              label: account.account_nam,
                            }))
                          : []),
                      ]}
                      value={filterBuyAccount}
                      onValueChange={setFilterBuyAccount}
                      placeholder="All Accounts"
                      searchPlaceholder="Search accounts..."
                      emptyText="No account found."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sale To Account</Label>
                    <Combobox
                      options={[
                        { value: "all", label: "All Accounts" },
                        ...(Array.isArray(accounts)
                          ? accounts.map((account) => ({
                              value: account.acc_id.toString(),
                              label: account.account_nam,
                            }))
                          : []),
                      ]}
                      value={filterSaleAccount}
                      onValueChange={setFilterSaleAccount}
                      placeholder="All Accounts"
                      searchPlaceholder="Search accounts..."
                      emptyText="No account found."
                    />
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
                  <Combobox
                    options={[
                      { value: "all", label: "All Accounts" },
                      ...(Array.isArray(accounts)
                        ? accounts.map((account) => ({
                            value: account.acc_id.toString(),
                            label: account.account_nam,
                          }))
                        : []),
                    ]}
                    value={filterBuyAccount}
                    onValueChange={setFilterBuyAccount}
                    placeholder="All Accounts"
                    searchPlaceholder="Search accounts..."
                    emptyText="No account found."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sale To Account</Label>
                  <Combobox
                    options={[
                      { value: "all", label: "All Accounts" },
                      ...(Array.isArray(accounts)
                        ? accounts.map((account) => ({
                            value: account.acc_id.toString(),
                            label: account.account_nam,
                          }))
                        : []),
                    ]}
                    value={filterSaleAccount}
                    onValueChange={setFilterSaleAccount}
                    placeholder="All Accounts"
                    searchPlaceholder="Search accounts..."
                    emptyText="No account found."
                  />
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
              <div className="text-center py-8 text-muted-foreground">
                No trades found
              </div>
            ) : isMobile ? (
              <div className="space-y-3">
                {filteredTrades.map((trade) => (
                  <Card key={trade.trading_id} className="border">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Date</span>
                        <span className="text-sm font-medium">
                          {trade.trading_date
                            ? new Date(trade.trading_date).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          D.O Number
                        </span>
                        <span className="text-sm">
                          {trade.do_number || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Product</span>
                        <span className="text-sm font-medium">
                          {(Array.isArray(products) &&
                            products.find(
                              (p) => p.product_id === trade.product_id,
                            )?.product_title) ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Buy From</span>
                        <span className="text-sm font-medium">
                          {(Array.isArray(accounts) &&
                            accounts.find(
                              (a) => a.acc_id === trade.buy_from_account,
                            )?.account_nam) ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Buy Qty</span>
                        <span className="text-sm">
                          {trade.buy_quantity?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Buy Price</span>
                        <span className="text-sm">
                          {trade.buy_price?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Buy Total</span>
                        <span className="text-sm font-medium">
                          {trade.buy_total?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Sale To</span>
                        <span className="text-sm font-medium">
                          {(Array.isArray(accounts) &&
                            accounts.find(
                              (a) => a.acc_id === trade.sale_to_account,
                            )?.account_nam) ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Sale Qty</span>
                        <span className="text-sm">
                          {trade.sale_quantity?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Sale Price
                        </span>
                        <span className="text-sm">
                          {trade.sale_price?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Sale Total
                        </span>
                        <span className="text-sm font-medium">
                          {trade.sale_total?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </span>
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
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(trade.trading_id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                          Delete
                        </Button> */}
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
                        <TableHead className="bg-background hidden md:table-cell">
                          D.O Number
                        </TableHead>
                        <TableHead className="bg-background">Product</TableHead>
                        <TableHead className="bg-background hidden lg:table-cell">
                          Buy From
                        </TableHead>
                        <TableHead className="bg-background hidden lg:table-cell">
                          Buy Qty
                        </TableHead>
                        <TableHead className="bg-background hidden xl:table-cell">
                          Buy Price
                        </TableHead>
                        <TableHead className="bg-background hidden xl:table-cell">
                          Buy Total
                        </TableHead>
                        <TableHead className="bg-background hidden lg:table-cell">
                          Sale To
                        </TableHead>
                        <TableHead className="bg-background hidden lg:table-cell">
                          Sale Qty
                        </TableHead>
                        <TableHead className="bg-background hidden xl:table-cell">
                          Sale Price
                        </TableHead>
                        <TableHead className="bg-background hidden xl:table-cell">
                          Sale Total
                        </TableHead>
                        <TableHead className="bg-background">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTrades.map((trade) => (
                        <TableRow key={trade.trading_id}>
                          <TableCell>
                            {trade.trading_date
                              ? new Date(
                                  trade.trading_date,
                                ).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {trade.do_number || "N/A"}
                          </TableCell>
                          <TableCell>
                            {(Array.isArray(products) &&
                              products.find(
                                (p) => p.product_id === trade.product_id,
                              )?.product_title) ||
                              "N/A"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {(Array.isArray(accounts) &&
                              accounts.find(
                                (a) => a.acc_id === trade.buy_from_account,
                              )?.account_nam) ||
                              "N/A"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {trade.buy_quantity?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {trade.buy_price?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {trade.buy_total?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {(Array.isArray(accounts) &&
                              accounts.find(
                                (a) => a.acc_id === trade.sale_to_account,
                              )?.account_nam) ||
                              "N/A"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {trade.sale_quantity?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {trade.sale_price?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {trade.sale_total?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}
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
                              {/* <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(trade.trading_id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button> */}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages >= 1 && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">
                    Items per page:
                  </Label>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                      fetchTrades(1, Number(value));
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => {
                          const newPage = Math.max(1, currentPage - 1);
                          setCurrentPage(newPage);
                          fetchTrades(newPage, itemsPerPage);
                        }}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => {
                              setCurrentPage(pageNum);
                              fetchTrades(pageNum, itemsPerPage);
                            }}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => {
                          const newPage = Math.min(totalPages, currentPage + 1);
                          setCurrentPage(newPage);
                          fetchTrades(newPage, itemsPerPage);
                        }}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                  {totalItems} trades
                </div>
              </div>
            )}
          </MobileListToggle>
        </CardContent>
      </Card>
    </div>
  );
}
