"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { Plus, Search, Edit2, Trash2, History, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Combobox } from "@/components/ui/combobox";
import MobileListToggle from "@/app/(interfaces)/components/MobileListToggle";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function UnitSalePage() {
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
      sale_date: new Date().toISOString().split("T")[0],
      prounit_id: "",
      floc_id: "",
      customer_id: "",
      farm_rate: "",
      sale_rate: "",
      product_id: "",
      price: "",
      quantity: "",
      van_number: "",
      tax_type: "flat",
      tax_value: "",
      discount_type: "flat",
      discount_value: "",
      description: "",
    },
  });

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [units, setUnits] = useState([]);
  const [flocs, setFlocs] = useState([]);
  const [products, setProducts] = useState([]);
  const [availableFlocs, setAvailableFlocs] = useState([]);
  const [fsRateSet, setFsRateSet] = useState(false);
  const [fsRateEditable, setFsRateEditable] = useState(true);
  const [previousFsRates, setPreviousFsRates] = useState([]);
  const [isFsRateHistoryOpen, setIsFsRateHistoryOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({
    customer_name: "",
    customer_cnic: "",
    customer_address: "",
    customer_contact: "",
  });
  const [customerBalance, setCustomerBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUnit, setFilterUnit] = useState("all");
  const [filterFloc, setFilterFloc] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingSaleId, setDeletingSaleId] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const selectedUnit = watch("prounit_id");
  const selectedFloc = watch("floc_id");
  const saleDate = watch("sale_date");
  const farmRate = watch("farm_rate");
  const saleRate = watch("sale_rate");
  const selectedProduct = watch("product_id");
  const selectedCustomer = watch("customer_id");
  const price = watch("price");
  const quantity = watch("quantity");
  const taxType = watch("tax_type");
  const taxValue = watch("tax_value");
  const discountType = watch("discount_type");
  const discountValue = watch("discount_value");

  useEffect(() => {
    fetchUnits();
    fetchProducts();
    fetchSales();
    fetchCustomers();
    // Set current date if not already set
    const currentDate = new Date().toISOString().split("T")[0];
    setValue("sale_date", currentDate);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchUnits = async () => {
    try {
      const response = await fetch("/api/unit/readAll");
      const result = await response.json();
      if (result.response_status === "success") {
        const unitsData =
          result.response_result?.data || result.response_result || [];
        setUnits(Array.isArray(unitsData) ? unitsData : []);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
      setUnits([]);
    }
  };

  const fetchFlocsByUnit = async (prounitId) => {
    try {
      const response = await fetch(
        `/api/floc/readByFarmId?farm_id=${prounitId}`,
      );
      const result = await response.json();
      if (result.response_status === "success") {
        const flocsData =
          result.response_result?.data || result.response_result || [];
        setAvailableFlocs(Array.isArray(flocsData) ? flocsData : []);
      }
    } catch (error) {
      console.error("Error fetching flocs:", error);
      setAvailableFlocs([]);
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

  const checkFsRateForToday = useCallback(async () => {
    if (!selectedUnit || !selectedFloc || !saleDate) return;
    try {
      const response = await fetch(
        `/api/unitSale/checkFsRate?prounit_id=${selectedUnit}&floc_id=${selectedFloc}&sale_date=${saleDate}`,
      );
      const result = await response.json();
      if (result.response_status === "success") {
        const data = result.response_result;
        if (data.exists) {
          setFsRateSet(true);
          setFsRateEditable(false);
          const farmRateValue = data.farm_rate?.toString() || "";
          setValue("farm_rate", farmRateValue);
          setValue("sale_rate", data.sale_rate?.toString() || "");
          // Set farm_rate as price when F.S rate is loaded, but keep price editable
          if (farmRateValue) {
            setValue("price", farmRateValue);
          }
        } else {
          setFsRateSet(false);
          setFsRateEditable(true);
        }
      }
    } catch (error) {
      console.error("Error checking F.S Rate:", error);
      setFsRateSet(false);
      setFsRateEditable(true);
    }
  }, [selectedUnit, selectedFloc, saleDate, setValue]);

  const fetchCustomerBalance = useCallback(async (accId) => {
    if (!accId) {
      setCustomerBalance(null);
      return;
    }
    setLoadingBalance(true);
    try {
      const response = await fetch(
        `/api/transaction/read/balance?acc_id=${accId}`,
      );
      const result = await response.json();
      if (result.response_status === "success" && result.response_result) {
        setCustomerBalance(result.response_result.balance || 0);
      } else {
        setCustomerBalance(null);
      }
    } catch (error) {
      console.error("Error fetching customer balance:", error);
      setCustomerBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUnit) {
      fetchFlocsByUnit(selectedUnit);
    } else {
      setAvailableFlocs([]);
      setValue("floc_id", "");
    }
  }, [selectedUnit]);

  useEffect(() => {
    // Check if F.S Rate is already set for today
    if (selectedUnit && selectedFloc && saleDate) {
      checkFsRateForToday();
    } else {
      setFsRateSet(false);
      setFsRateEditable(true);
    }
  }, [selectedUnit, selectedFloc, saleDate, checkFsRateForToday]);

  useEffect(() => {
    // If product is "chick", apply farm rate as price
    if (selectedProduct && farmRate && Array.isArray(products)) {
      const product = products.find(
        (p) => p.product_id === parseInt(selectedProduct),
      );
      if (product && product.product_title?.toLowerCase().includes("chick")) {
        setValue("price", farmRate);
      }
    }
  }, [selectedProduct, farmRate, products, setValue]);

  useEffect(() => {
    // Fetch customer balance when customer is selected
    if (selectedCustomer) {
      fetchCustomerBalance(selectedCustomer);
    } else {
      setCustomerBalance(null);
    }
  }, [selectedCustomer, fetchCustomerBalance]);

  const fetchPreviousFsRates = async () => {
    try {
      const response = await fetch(
        `/api/unitSale/previousFsRates?prounit_id=${selectedUnit}&floc_id=${selectedFloc}`,
      );
      const result = await response.json();
      if (result.response_status === "success") {
        const ratesData =
          result.response_result?.data || result.response_result || [];
        setPreviousFsRates(ratesData);
      }
    } catch (error) {
      console.error("Error fetching previous F.S Rates:", error);
    }
  };

  const fetchSales = async (page = currentPage, limit = itemsPerPage) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/unitSale/readAll?page=${page}&limit=${limit}`,
      );
      const result = await response.json();
      if (result.response_status === "success") {
        const responseData = result.response_result;

        // Handle paginated response
        if (responseData?.pagination) {
          const salesData = responseData.data || [];
          setSales(salesData);
          setTotalPages(responseData.pagination.totalPages || 1);
          setTotalItems(responseData.pagination.total || 0);
          setCurrentPage(responseData.pagination.page || page);
        } else {
          // Fallback for non-paginated response
          const salesData = responseData?.data || responseData || [];
          setSales(salesData);
          setTotalPages(1);
          setTotalItems(salesData.length);
        }
      } else {
        toast.error(result.response_message || "Failed to fetch sales");
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to fetch sales");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      // Add cache-busting parameter to ensure fresh data
      const response = await fetch(`/api/customer/readAll?t=${Date.now()}`);
      const result = await response.json();
      console.log("Customer API Response:", result);
      if (result.response_status === "success") {
        // Customer API returns { customer_data, nextId }
        // Handle both cached (already parsed) and fresh responses
        let customersData = null;

        if (result.response_result) {
          // Check if response_result is the object with customer_data
          if (result.response_result.customer_data) {
            customersData = result.response_result.customer_data;
          }
          // Check if response_result is directly an array (fallback)
          else if (Array.isArray(result.response_result)) {
            customersData = result.response_result;
          }
          // Check if response_result has a data property
          else if (
            result.response_result.data &&
            Array.isArray(result.response_result.data)
          ) {
            customersData = result.response_result.data;
          }
        }

        const customersArray = Array.isArray(customersData)
          ? customersData
          : [];
        console.log(
          "Setting customers:",
          customersArray.length,
          customersArray,
        );
        setCustomers(customersArray);
      } else {
        console.error("Failed to fetch customers:", result.response_message);
        setCustomers([]);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      setCustomers([]);
    }
  };

  const handleCreateCustomer = async () => {
    if (
      !customerFormData.customer_name ||
      !customerFormData.customer_cnic ||
      !customerFormData.customer_address ||
      !customerFormData.customer_contact
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const payload = {
        req_object: {
          customer_name: customerFormData.customer_name.trim(),
          customer_cnic: customerFormData.customer_cnic.trim(),
          customer_address: customerFormData.customer_address.trim(),
          customer_contact: customerFormData.customer_contact.trim(),
        },
      };

      const response = await fetch("/api/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.response_status === "success") {
        toast.success("Purcher created successfully");
        // Get acc_id and customer name from response
        const accId = result.response_result?.acc_id;
        const customerName = customerFormData.customer_name.trim();

        // Close dialog first
        setIsCustomerDialogOpen(false);

        // Add the new customer to the list immediately (optimistic update)
        if (accId && customerName) {
          setCustomers((prev) => {
            // Check if customer already exists to avoid duplicates
            const exists = prev.some((c) => c.acc_id === accId);
            if (exists) return prev;
            return [
              ...prev,
              {
                acc_id: accId,
                account_nam: customerName,
              },
            ].sort((a, b) => a.acc_id - b.acc_id);
          });

          // Set the customer_id value
          setValue("customer_id", accId.toString());
        }

        // Then refresh the full list from server to ensure consistency
        await fetchCustomers();
        setCustomerFormData({
          customer_name: "",
          customer_cnic: "",
          customer_address: "",
          customer_contact: "",
        });
      } else {
        toast.error(result.response_message || "Failed to create purcher");
      }
    } catch (error) {
      console.error("Error creating purcher:", error);
      toast.error("Failed to create purcher");
    }
  };

  const handleOpenFsRateHistory = () => {
    if (selectedUnit && selectedFloc) {
      fetchPreviousFsRates();
      setIsFsRateHistoryOpen(true);
    } else {
      toast.error("Please select unit and floc first");
    }
  };

  const handleSelectPreviousFsRate = (rate) => {
    setValue("farm_rate", rate.farm_rate?.toString() || "");
    setValue("sale_rate", rate.sale_rate?.toString() || "");
    setIsFsRateHistoryOpen(false);
  };

  const calculateDiscountAmount = () => {
    const priceValue = parseFloat(price) || 0;
    if (!discountValue) return 0;

    return discountType === "percentage"
      ? (priceValue * parseFloat(discountValue)) / 100
      : parseFloat(discountValue);
  };

  const calculatePriceAfterDiscount = () => {
    const priceValue = parseFloat(price) || 0;
    const discountAmount = calculateDiscountAmount();
    return Math.max(0, priceValue - discountAmount);
  };

  const calculateTaxAmount = () => {
    const priceAfterDiscount = calculatePriceAfterDiscount();
    if (!taxValue) return 0;

    return taxType === "percentage"
      ? (priceAfterDiscount * parseFloat(taxValue)) / 100
      : parseFloat(taxValue);
  };

  const calculateAmountAfterTax = () => {
    const priceAfterDiscount = calculatePriceAfterDiscount();
    const taxAmount = calculateTaxAmount();
    return Math.max(0, priceAfterDiscount + taxAmount);
  };

  const calculateTotal = () => {
    const priceValue = parseFloat(price) || 0;
    const quantityValue = parseFloat(quantity) || 0;

    // Start with price per unit
    let unitPrice = priceValue;

    // Apply discount on price (per unit)
    if (discountValue) {
      const discountAmount =
        discountType === "percentage"
          ? (unitPrice * parseFloat(discountValue)) / 100
          : parseFloat(discountValue);
      unitPrice -= discountAmount;
    }

    // Apply tax on price (per unit, after discount)
    if (taxValue) {
      const taxAmount =
        taxType === "percentage"
          ? (unitPrice * parseFloat(taxValue)) / 100
          : parseFloat(taxValue);
      unitPrice += taxAmount;
    }

    // Multiply by quantity to get total
    const total = unitPrice * quantityValue;
    return Math.max(0, total);
  };

  const onSubmit = async (data) => {
    if (
      !data.prounit_id ||
      !data.floc_id ||
      !data.customer_id ||
      !data.product_id ||
      !data.price ||
      !data.quantity ||
      !data.van_number
    ) {
      toast.error("Please fill all required fields including Van Number");
      return;
    }

    // Validate F.S Rate if not set
    if (!fsRateSet && (!data.farm_rate || !data.sale_rate)) {
      toast.error("F.S Rate (Farm Rate and Sale Rate) is required");
      return;
    }

    const total = calculateTotal();

    const payload = {
      req_object: {
        sale_date: data.sale_date,
        prounit_id: parseInt(data.prounit_id),
        floc_id: parseInt(data.floc_id),
        customer_id: parseInt(data.customer_id),
        farm_rate: data.farm_rate ? parseFloat(data.farm_rate) : null,
        sale_rate: data.sale_rate ? parseFloat(data.sale_rate) : null,
        product_id: parseInt(data.product_id),
        product_nam: products.find(
          (product) => product.product_id === parseInt(data.product_id),
        )?.product_title,
        price: parseFloat(data.price),
        quantity: parseFloat(data.quantity),
        van_number: data.van_number?.trim() || null,
        tax_type: data.tax_type,
        tax_value: data.tax_value ? parseFloat(data.tax_value) : 0,
        discount_type: data.discount_type,
        discount_value: data.discount_value
          ? parseFloat(data.discount_value)
          : 0,
        total: total,
        description: data.description?.trim() || "",
        set_fs_rate: !fsRateSet, // Flag to set F.S Rate if not already set
        ...(isEditMode && { sale_id: editingSaleId }),
      },
    };

    try {
      const url = "/api/unitSale";
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
            ? "Sale updated successfully"
            : "Sale created successfully",
        );
        // After first sale, F.S Rate becomes non-editable
        if (!fsRateSet) {
          setFsRateSet(true);
          setFsRateEditable(false);
        }
        // Preserve date, unit, floc and F.S Rate — only reset sale-specific fields
        reset({
          sale_date: data.sale_date,
          prounit_id: data.prounit_id,
          floc_id: data.floc_id,
          customer_id: "",
          farm_rate: data.farm_rate,
          sale_rate: data.sale_rate,
          product_id: "",
          price: "",
          quantity: "",
          van_number: "",
          tax_type: "flat",
          tax_value: "",
          discount_type: "percentage",
          discount_value: "",
          description: "",
        });
        setCustomerBalance(null);
        setIsEditMode(false);
        setEditingSaleId(null);
        fetchSales();
      } else {
        toast.error(result.response_message || "Failed to save sale");
      }
    } catch (error) {
      console.error("Error saving sale:", error);
      toast.error("Failed to save sale");
    }
  };

  const handleEdit = (sale) => {
    setIsEditMode(true);
    setEditingSaleId(sale.sale_id);
    const prounitId =
      (sale.prounit_id || sale.farm_id || sale.unit?.prounit_id)?.toString() ||
      "";
    reset({
      sale_date: sale.sale_date
        ? new Date(sale.sale_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      prounit_id: prounitId,
      floc_id: sale.floc_id?.toString() || "",
      customer_id: sale.customer_id?.toString() || "",
      farm_rate: sale.farm_rate?.toString() || "",
      sale_rate: sale.sale_rate?.toString() || "",
      product_id: sale.product_id?.toString() || "",
      price: sale.price?.toString() || "",
      quantity: sale.quantity?.toString() || "",
      van_number: sale.van_number || "",
      tax_type: sale.tax_type || "flat",
      tax_value: sale.tax_value?.toString() || "",
      discount_type: sale.discount_type || "percentage",
      discount_value: sale.discount_value?.toString() || "",
      description: sale.description || "",
    });
    setFsRateSet(true);
    setFsRateEditable(false);
    // Fetch customer balance if customer is selected
    if (sale.customer_id) {
      fetchCustomerBalance(sale.customer_id.toString());
    }
    // Fetch flocs for the selected unit
    if (prounitId) {
      fetchFlocsByUnit(prounitId);
    }
  };

  const handleDelete = (saleId) => {
    setDeletingSaleId(saleId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSaleId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/unitSale?sale_id=${deletingSaleId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.response_status === "success") {
        toast.success("Sale deleted successfully");
        setIsDeleteDialogOpen(false);
        setDeletingSaleId(null);
        // If the deleted sale is currently loaded in edit mode, clear the form
        if (editingSaleId === deletingSaleId) {
          reset({
            sale_date: new Date().toISOString().split("T")[0],
            prounit_id: "",
            floc_id: "",
            customer_id: "",
            farm_rate: "",
            sale_rate: "",
            product_id: "",
            price: "",
            quantity: "",
            van_number: "",
            tax_type: "flat",
            tax_value: "",
            discount_type: "percentage",
            discount_value: "",
            description: "",
          });
          setCustomerBalance(null);
          setFsRateSet(false);
          setFsRateEditable(true);
          setIsEditMode(false);
          setEditingSaleId(null);
        }
        fetchSales(currentPage, itemsPerPage);
      } else {
        toast.error(result.response_message || "Failed to delete sale");
      }
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast.error("Failed to delete sale");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter sales (client-side filtering on paginated data)
  const filteredSales = sales.filter((sale) => {
    const prounitId = sale.prounit_id || sale.farm_id || sale.unit?.prounit_id;
    const unitName =
      sale.unit?.prounit_nam ||
      (Array.isArray(units) &&
        units.find((u) => u.prounit_id === prounitId)?.prounit_nam);

    const matchesSearch =
      searchQuery === "" ||
      sale.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unitName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(products) &&
        products
          .find((p) => p.product_id === sale.product_id)
          ?.product_title?.toLowerCase()
          .includes(searchQuery.toLowerCase()));

    const matchesUnit =
      filterUnit === "all" || prounitId?.toString() === filterUnit;

    const matchesFloc =
      filterFloc === "all" || sale.floc_id?.toString() === filterFloc;

    const matchesDate =
      filterDate === "" ||
      (sale.sale_date &&
        new Date(sale.sale_date).toISOString().split("T")[0] === filterDate);

    return matchesSearch && matchesUnit && matchesFloc && matchesDate;
  });

  // Reset to page 1 when filters change and refetch
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchSales(1, itemsPerPage);
    }
  }, [searchQuery, filterUnit, filterFloc, filterDate]);

  // Fetch sales when page or itemsPerPage changes
  useEffect(() => {
    fetchSales(currentPage, itemsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  const totalAmount = calculateTotal();

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Form Section */}
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader className="p-4 md:hidden pb-0 sm:p-6 sm:pb-0">
          <CardTitle className="text-lg sm:text-xl">
            {isEditMode ? "Edit Sale" : "Create New Sale"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-0">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            id="unit-sale-form"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* F.S Rate (Combined Farm Rate and Sale Rate) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>F.S Rate *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenFsRateHistory}
                    disabled={!selectedUnit || !selectedFloc}
                  >
                    <History className="h-4 w-4 mr-1" />
                    {/* Previous */}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      id="farm_rate"
                      type="number"
                      step="0.01"
                      {...register("farm_rate", {
                        required: !fsRateSet ? "Farm Rate is required" : false,
                      })}
                      placeholder="0.00"
                      disabled={!fsRateEditable}
                      className={!fsRateEditable ? "bg-muted" : ""}
                    />
                  </div>
                  <span className="text-muted-foreground font-medium">/</span>
                  <div className="flex-1">
                    <Input
                      id="sale_rate"
                      type="number"
                      step="0.01"
                      {...register("sale_rate", {
                        required: !fsRateSet ? "Sale Rate is required" : false,
                      })}
                      placeholder="0.00"
                      disabled={!fsRateEditable}
                      className={!fsRateEditable ? "bg-muted" : ""}
                    />
                  </div>
                  {/* <span className="text-muted-foreground font-medium text-sm">, F.S</span> */}
                </div>
                {(errors.farm_rate || errors.sale_rate) && (
                  <p className="text-sm text-destructive">
                    {errors.farm_rate?.message || errors.sale_rate?.message}
                  </p>
                )}
                {/* {!fsRateEditable && (
                                    <p className="text-xs text-muted-foreground">F.S Rate is set for today and cannot be edited</p>
                                )} */}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="sale_date">Date *</Label>
                <Input
                  id="sale_date"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  {...register("sale_date", {
                    required: "Date is required",
                  })}
                />
                {errors.sale_date && (
                  <p className="text-sm text-destructive">
                    {errors.sale_date.message}
                  </p>
                )}
              </div>

              {/* Unit Selection */}
              <div className="space-y-2">
                <Label htmlFor="prounit_id">Unit *</Label>
                <Controller
                  name="prounit_id"
                  control={control}
                  rules={{ required: "Unit is required" }}
                  render={({ field }) => (
                    <Combobox
                      options={
                        Array.isArray(units)
                          ? units.map((unit) => ({
                              value: unit.prounit_id.toString(),
                              label: unit.prounit_nam,
                            }))
                          : []
                      }
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select unit"
                      searchPlaceholder="Search units..."
                      emptyText="No unit found."
                    />
                  )}
                />
                {errors.prounit_id && (
                  <p className="text-sm text-destructive">
                    {errors.prounit_id.message}
                  </p>
                )}
              </div>

              {/* Floc Selection */}
              <div className="space-y-2">
                <Label htmlFor="floc_id">Floc *</Label>
                <Controller
                  name="floc_id"
                  control={control}
                  rules={{ required: "Floc is required" }}
                  render={({ field }) => (
                    <Combobox
                      options={availableFlocs.map((floc) => ({
                        value: floc.floc_id.toString(),
                        label: `Floc #${floc.floc_id} - ${new Date(floc.starting_date).toLocaleDateString()}`,
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select floc"
                      searchPlaceholder="Search flocs..."
                      emptyText="No floc found."
                      disabled={!selectedUnit || availableFlocs.length === 0}
                    />
                  )}
                />
                {errors.floc_id && (
                  <p className="text-sm text-destructive">
                    {errors.floc_id.message}
                  </p>
                )}
                {!selectedUnit && (
                  <p className="text-xs text-muted-foreground">
                    Please select a unit first
                  </p>
                )}
              </div>

              {/* Purcher Selection */}
              <div className="space-y-2">
                <Label htmlFor="customer_id">Purcher *</Label>
                <div className="flex gap-2">
                  <Controller
                    name="customer_id"
                    control={control}
                    rules={{ required: "Purcher is required" }}
                    render={({ field }) => (
                      <div className="flex-1">
                        <Combobox
                          options={
                            Array.isArray(customers) && customers.length > 0
                              ? customers.map((customer) => ({
                                  value: customer.acc_id.toString(),
                                  label: customer.account_nam,
                                }))
                              : []
                          }
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value) {
                              fetchCustomerBalance(value);
                            } else {
                              setCustomerBalance(null);
                            }
                          }}
                          placeholder={
                            customers.length > 0
                              ? "Select purcher"
                              : "No purchers"
                          }
                          searchPlaceholder="Search purchers..."
                          emptyText="No purcher found."
                        />
                      </div>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCustomerDialogOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                {errors.customer_id && (
                  <p className="text-sm text-destructive">
                    {errors.customer_id.message}
                  </p>
                )}
                {customerBalance !== null && (
                  <div className="mt-1">
                    <p className="text-xs text-muted-foreground">
                      Balance:{" "}
                      <span
                        className={`font-semibold ${customerBalance >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {customerBalance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      {loadingBalance && (
                        <span className="ml-2 text-xs">Loading...</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Product Selection */}
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

            {/* First Row: Van Number, Quantity, Price, Total */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Van Number */}
              <div className="space-y-2">
                <Label htmlFor="van_number">Van Number *</Label>
                <Input
                  id="van_number"
                  type="text"
                  {...register("van_number", {
                    required: "Van Number is required",
                  })}
                  placeholder="Enter van number"
                />
                {errors.van_number && (
                  <p className="text-sm text-destructive">
                    {errors.van_number.message}
                  </p>
                )}
              </div>
              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  {...register("quantity", {
                    required: "Quantity is required",
                    min: {
                      value: 0.01,
                      message: "Quantity must be greater than 0",
                    },
                  })}
                  placeholder="0.00"
                />
                {errors.quantity && (
                  <p className="text-sm text-destructive">
                    {errors.quantity.message}
                  </p>
                )}
              </div>
              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  {...register("price", {
                    required: "Price is required",
                    min: {
                      value: 0,
                      message: "Price must be greater than or equal to 0",
                    },
                  })}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-sm text-destructive">
                    {errors.price.message}
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <div className="p-2 bg-muted rounded-md">
                  <p className="text-lg font-semibold">
                    {totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              {/* Discount Type */}
              {/* <div className="space-y-2">
                                <Label>Discount Type</Label>
                                <Controller
                                    name="discount_type"
                                    control={control}
                                    render={({ field }) => (
                                        <RadioGroup
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            className="flex flex-row gap-4"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="percentage" id="discount-percentage" />
                                                <Label htmlFor="discount-percentage" className="font-normal cursor-pointer">Percentage</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="flat" id="discount-flat" />
                                                <Label htmlFor="discount-flat" className="font-normal cursor-pointer">Flat</Label>
                                            </div>
                                        </RadioGroup>
                                    )}
                                />
                            </div> */}

              {/* Discount Value */}
              {/* <div className="space-y-2">
                                <Label htmlFor="discount_value">Discount Value</Label>
                                <Input
                                    id="discount_value"
                                    type="number"
                                    step="0.01"
                                    {...register("discount_value", {
                                        min: { value: 0, message: "Discount value must be greater than or equal to 0" },
                                    })}
                                    placeholder="0.00"
                                />
                            </div> */}

              {/* Discounted Amount */}
              {/* <div className="space-y-2">
                                <Label>Discounted Amount</Label>
                                <div className="p-2 bg-muted/50 rounded-md border border-muted min-h-[2.5rem] flex items-center">
                                    <p className="text-sm font-semibold">
                                        {discountValue ? calculateDiscountAmount().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                                    </p>
                                </div>
                            </div> */}
            </div>

            {/* Second Row: Quantity, Tax Type, Tax Value, Tax Applied Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tax Type */}
              {/* <div className="space-y-2">
                                <Label>Tax Type</Label>
                                <Controller
                                    name="tax_type"
                                    control={control}
                                    render={({ field }) => (
                                        <RadioGroup
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            className="flex flex-row gap-4"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="flat" id="tax-flat" />
                                                <Label htmlFor="tax-flat" className="font-normal cursor-pointer">Flat</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="percentage" id="tax-percentage" />
                                                <Label htmlFor="tax-percentage" className="font-normal cursor-pointer">Percentage</Label>
                                            </div>
                                        </RadioGroup>
                                    )}
                                />
                            </div> */}

              {/* Tax Value */}
              {/* <div className="space-y-2">
                                <Label htmlFor="tax_value">Tax Value</Label>
                                <Input
                                    id="tax_value"
                                    type="number"
                                    step="0.01"
                                    {...register("tax_value", {
                                        min: { value: 0, message: "Tax value must be greater than or equal to 0" },
                                    })}
                                    placeholder="0.00"
                                />
                            </div> */}

              {/* Tax Applied Amount */}
              {/* <div className="space-y-2">
                                <Label>Tax Applied Amount</Label>
                                <div className="p-2 bg-muted/50 rounded-md border border-muted min-h-[2.5rem] flex items-center">
                                    <p className="text-sm font-semibold">
                                        {taxValue ? calculateTaxAmount().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                                    </p>
                                </div>
                            </div> */}
            </div>

            {/* Third Row: Total, Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="Enter description"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset({
                    sale_date: new Date().toISOString().split("T")[0],
                    prounit_id: "",
                    floc_id: "",
                    customer_id: "",
                    farm_rate: "",
                    sale_rate: "",
                    product_id: "",
                    price: "",
                    quantity: "",
                    van_number: "",
                    tax_type: "flat",
                    tax_value: "",
                    discount_type: "percentage",
                    discount_value: "",
                    description: "",
                  });
                  setCustomerBalance(null);
                  setFsRateSet(false);
                  setFsRateEditable(true);
                  setIsEditMode(false);
                  setEditingSaleId(null);
                }}
                className="w-full sm:w-auto"
              >
                {isEditMode ? "Cancel Edit" : "Clear Form"}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditMode
                    ? "Update Sale"
                    : "Create Sale"}
              </Button>
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={() => handleDelete(editingSaleId)}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sales List */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <MobileListToggle title="Sales">
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
                          placeholder="Search sales..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Combobox
                        options={[
                          { value: "all", label: "All Units" },
                          ...(Array.isArray(units)
                            ? units.map((unit) => ({
                                value: unit.prounit_id.toString(),
                                label: unit.prounit_nam,
                              }))
                            : []),
                        ]}
                        value={filterUnit}
                        onValueChange={setFilterUnit}
                        placeholder="All Units"
                        searchPlaceholder="Search units..."
                        emptyText="No unit found."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Floc</Label>
                      <Combobox
                        options={[
                          { value: "all", label: "All Flocs" },
                          ...(Array.isArray(flocs)
                            ? flocs.map((floc) => ({
                                value: floc.floc_id.toString(),
                                label: `Floc #${floc.floc_id}`,
                              }))
                            : []),
                        ]}
                        value={filterFloc}
                        onValueChange={setFilterFloc}
                        placeholder="All Flocs"
                        searchPlaceholder="Search flocs..."
                        emptyText="No floc found."
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search sales..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Combobox
                      options={[
                        { value: "all", label: "All Units" },
                        ...(Array.isArray(units)
                          ? units.map((unit) => ({
                              value: unit.prounit_id.toString(),
                              label: unit.prounit_nam,
                            }))
                          : []),
                      ]}
                      value={filterUnit}
                      onValueChange={setFilterUnit}
                      placeholder="All Units"
                      searchPlaceholder="Search units..."
                      emptyText="No unit found."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Floc</Label>
                    <Combobox
                      options={[
                        { value: "all", label: "All Flocs" },
                        ...(Array.isArray(flocs)
                          ? flocs.map((floc) => ({
                              value: floc.floc_id.toString(),
                              label: `Floc #${floc.floc_id}`,
                            }))
                          : []),
                      ]}
                      value={filterFloc}
                      onValueChange={setFilterFloc}
                      placeholder="All Flocs"
                      searchPlaceholder="Search flocs..."
                      emptyText="No floc found."
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
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sales found
              </div>
            ) : isMobile ? (
              <div className="space-y-3">
                {filteredSales.map((sale) => (
                  <Card key={sale.sale_id} className="border">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Date</span>
                        <span className="text-sm font-medium">
                          {sale.sale_date
                            ? new Date(sale.sale_date).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Unit</span>
                        <span className="text-sm font-medium">
                          {sale.unit?.prounit_nam ||
                            (Array.isArray(units) &&
                              units.find(
                                (u) =>
                                  u.prounit_id ===
                                  (sale.prounit_id || sale.farm_id),
                              )?.prounit_nam) ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Floc</span>
                        <span className="text-sm">Floc #{sale.floc_id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Customer</span>
                        <span className="text-sm font-medium">
                          {(Array.isArray(customers) &&
                            sale.customer_id &&
                            customers.find((c) => c.acc_id === sale.customer_id)
                              ?.account_nam) ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Product</span>
                        <span className="text-sm font-medium">
                          {(Array.isArray(products) &&
                            products.find(
                              (p) => p.product_id === sale.product_id,
                            )?.product_title) ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Van Number
                        </span>
                        <span className="text-sm font-medium">
                          {sale.van_number || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">F.S Rate</span>
                        <span className="text-sm">
                          {sale.farm_rate && sale.sale_rate
                            ? `${sale.farm_rate} / ${sale.sale_rate}`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Price</span>
                        <span className="text-sm">
                          {sale.price?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Quantity</span>
                        <span className="text-sm">
                          {sale.quantity?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Total</span>
                        <span className="text-sm font-medium">
                          {sale.total?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </span>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(sale)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="relative max-h-[600px] overflow-auto -mx-4 sm:mx-0">
                <div className="overflow-x-auto">
                  <table className="w-full caption-bottom text-sm min-w-[800px]">
                    <thead className="sticky top-0 bg-background z-20 border-b-2">
                      <tr className="border-b">
                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                          Date
                        </th>
                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                          Unit
                        </th>
                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background hidden md:table-cell">
                          Floc
                        </th>
                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background hidden lg:table-cell">
                          Customer
                        </th>
                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                          Product
                        </th>
                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background hidden md:table-cell">
                          Van Number
                        </th>
                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background hidden xl:table-cell">
                          F.S Rate
                        </th>
                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background hidden xl:table-cell">
                          Price
                        </th>
                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background hidden xl:table-cell">
                          Quantity
                        </th>
                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                          Total
                        </th>
                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.map((sale) => (
                        <tr
                          key={sale.sale_id}
                          className="hover:bg-muted/50 border-b transition-colors"
                        >
                          <td className="p-2 align-middle whitespace-nowrap">
                            {sale.sale_date
                              ? new Date(sale.sale_date).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap">
                            {sale.unit?.prounit_nam ||
                              (Array.isArray(units) &&
                                units.find(
                                  (u) =>
                                    u.prounit_id ===
                                    (sale.prounit_id || sale.farm_id),
                                )?.prounit_nam) ||
                              "N/A"}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap hidden md:table-cell">
                            Floc #{sale.floc_id}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap hidden lg:table-cell">
                            {(Array.isArray(customers) &&
                              sale.customer_id &&
                              customers.find(
                                (c) => c.acc_id === sale.customer_id,
                              )?.account_nam) ||
                              "N/A"}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap">
                            {(Array.isArray(products) &&
                              products.find(
                                (p) => p.product_id === sale.product_id,
                              )?.product_title) ||
                              "N/A"}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap hidden md:table-cell">
                            {sale.van_number || "N/A"}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap hidden xl:table-cell">
                            {sale.farm_rate && sale.sale_rate
                              ? `${sale.farm_rate} / ${sale.sale_rate}`
                              : "N/A"}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap hidden xl:table-cell">
                            {sale.price?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap hidden xl:table-cell">
                            {sale.quantity?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap font-medium">
                            {sale.total?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(sale)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                      fetchSales(1, Number(value));
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
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
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
                              fetchSales(pageNum, itemsPerPage);
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
                          fetchSales(newPage, itemsPerPage);
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
                  {totalItems} sales
                </div>
              </div>
            )}
          </MobileListToggle>
        </CardContent>
      </Card>

      {/* F.S Rate History Dialog */}
      <Dialog open={isFsRateHistoryOpen} onOpenChange={setIsFsRateHistoryOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Previous F.S Rates</DialogTitle>
            <DialogDescription>
              Select a previous F.S Rate to use for today
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {previousFsRates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No previous F.S Rates found
              </div>
            ) : (
              <div className="relative max-h-[400px] overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="sticky top-0 bg-background z-20 border-b-2">
                    <tr className="border-b">
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Date
                      </th>
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Farm Rate
                      </th>
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Sale Rate
                      </th>
                      <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previousFsRates.map((rate, index) => (
                      <tr
                        key={index}
                        className="hover:bg-muted/50 border-b transition-colors"
                      >
                        <td className="p-2 align-middle whitespace-nowrap">
                          {rate.date
                            ? new Date(rate.date).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          {rate.farm_rate?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          {rate.sale_rate?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectPreviousFsRate(rate)}
                          >
                            Select
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFsRateHistoryOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Purcher Dialog */}
      <Dialog
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Purcher</DialogTitle>
            <DialogDescription>
              Create a new purcher account. The purcher will be created with
              is_customer flag set to true.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Purcher Name *</Label>
              <Input
                id="customer_name"
                value={customerFormData.customer_name}
                onChange={(e) =>
                  setCustomerFormData({
                    ...customerFormData,
                    customer_name: e.target.value,
                  })
                }
                placeholder="Enter purcher name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_cnic">CNIC *</Label>
              <Input
                id="customer_cnic"
                value={customerFormData.customer_cnic}
                onChange={(e) =>
                  setCustomerFormData({
                    ...customerFormData,
                    customer_cnic: e.target.value,
                  })
                }
                placeholder="XXXXX-XXXXXXX-X"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_address">Address *</Label>
              <Input
                id="customer_address"
                value={customerFormData.customer_address}
                onChange={(e) =>
                  setCustomerFormData({
                    ...customerFormData,
                    customer_address: e.target.value,
                  })
                }
                placeholder="Enter address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_contact">Contact *</Label>
              <Input
                id="customer_contact"
                value={customerFormData.customer_contact}
                onChange={(e) =>
                  setCustomerFormData({
                    ...customerFormData,
                    customer_contact: e.target.value,
                  })
                }
                placeholder="Enter contact number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCustomerDialogOpen(false);
                setCustomerFormData({
                  customer_name: "",
                  customer_cnic: "",
                  customer_address: "",
                  customer_contact: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateCustomer}>
              Create Purcher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Sale</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this unit income?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
