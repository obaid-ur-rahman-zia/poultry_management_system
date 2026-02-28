"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { Plus, Search, Edit2, Trash2, PlusCircle, Equal } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function UnitExpensePage() {
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
      expense_date: new Date().toISOString().split("T")[0],
      prounit_id: "",
      floc_id: "",
      supplier_id: "",
      product_id: "",
      price: "",
      quantity: "",
      tax_type: "flat",
      tax_value: "",
      discount_type: "percentage",
      discount_value: "",
      description: "",
    },
  });

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [units, setUnits] = useState([]);
  const [flocs, setFlocs] = useState([]);
  const [products, setProducts] = useState([]);
  const [availableFlocs, setAvailableFlocs] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState({
    supplier_name: "",
    supplier_cnic: "",
    supplier_address: "",
    supplier_contact: "",
    supplier_company_id: "",
  });
  const [companies, setCompanies] = useState([]);
  const [supplierBalance, setSupplierBalance] = useState(null);
  const [loadingSupplierBalance, setLoadingSupplierBalance] = useState(false);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUnit, setFilterUnit] = useState("all");
  const [filterFloc, setFilterFloc] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const selectedUnit = watch("prounit_id");
  const selectedSupplier = watch("supplier_id");
  const price = watch("price");
  const quantity = watch("quantity");
  const taxType = watch("tax_type");
  const taxValue = watch("tax_value");
  const discountType = watch("discount_type");
  const discountValue = watch("discount_value");

  useEffect(() => {
    fetchUnits();
    fetchProducts();
    fetchExpenses();
    fetchSuppliers();
    fetchCompanies();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (selectedUnit) {
      fetchFlocsByUnit(selectedUnit);
    } else {
      setAvailableFlocs([]);
      setValue("floc_id", "");
    }
  }, [selectedUnit]);

  // Fetch Supplier balance when supplier is selected
  useEffect(() => {
    if (selectedSupplier) {
      fetchSupplierBalance(selectedSupplier);
    } else {
      setSupplierBalance(null);
    }
  }, [selectedSupplier]);

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

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/supplier/readAll");
      const result = await response.json();
      if (result.response_status === "success") {
        // Supplier API returns { supplier_data, nextId }
        const suppliersData =
          result.response_result?.supplier_data ||
          result.response_result?.data ||
          result.response_result ||
          [];
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setSuppliers([]);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/company/readAll");
      const result = await response.json();
      if (result.response_status === "success") {
        const companiesData =
          result.response_result?.data || result.response_result || [];
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      setCompanies([]);
    }
  };

  // Fetch Supplier balance
  const fetchSupplierBalance = async (accId) => {
    if (!accId) {
      setSupplierBalance(null);
      return;
    }
    setLoadingSupplierBalance(true);
    try {
      const response = await fetch(
        `/api/transaction/read/balance?acc_id=${accId}`,
      );
      const result = await response.json();
      if (result.response_status === "success" && result.response_result) {
        setSupplierBalance(result.response_result.balance || 0);
      } else {
        setSupplierBalance(null);
      }
    } catch (error) {
      console.error("Error fetching supplier balance:", error);
      setSupplierBalance(null);
    } finally {
      setLoadingSupplierBalance(false);
    }
  };

  // Handle Create Company
  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    try {
      const payload = {
        req_object: {
          company_nam: newCompanyName.trim(),
          insert_by: "user",
          update_by: "user",
          status: 1,
        },
      };

      const response = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.response_status === "success") {
        toast.success("Company created successfully");
        await fetchCompanies();
        const newCompany = result.response_result;
        if (newCompany && newCompany.company_id) {
          setSupplierFormData({
            ...supplierFormData,
            supplier_company_id: newCompany.company_id.toString(),
          });
        }
        setNewCompanyName("");
        setIsCompanyDialogOpen(false);
      } else {
        toast.error(result.response_message || "Failed to create company");
      }
    } catch (error) {
      console.error("Error creating company:", error);
      toast.error("Failed to create company");
    }
  };

  const handleCreateSupplier = async () => {
    if (
      !supplierFormData.supplier_name ||
      !supplierFormData.supplier_cnic ||
      !supplierFormData.supplier_address ||
      !supplierFormData.supplier_contact
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const payload = {
        req_object: {
          supplier_name: supplierFormData.supplier_name.trim(),
          supplier_cnic: supplierFormData.supplier_cnic.trim(),
          supplier_address: supplierFormData.supplier_address.trim(),
          supplier_contact: supplierFormData.supplier_contact.trim(),
          supplier_company_id: supplierFormData.supplier_company_id
            ? parseInt(supplierFormData.supplier_company_id)
            : null,
          supplier_alternate_name: "",
          supplier_reference: "",
        },
      };

      const response = await fetch("/api/supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.response_status === "success") {
        toast.success("Former created successfully");
        // Clear cache and refresh suppliers list
        await fetchSuppliers();
        // Get acc_id from response - could be in result.response_result or result.response_result.acc_id
        const accId =
          result.response_result?.acc_id ||
          result.response_result?.supplier?.acc_id;
        if (accId) {
          setValue("supplier_id", accId.toString());
        }
        setIsSupplierDialogOpen(false);
        setSupplierFormData({
          supplier_name: "",
          supplier_cnic: "",
          supplier_address: "",
          supplier_contact: "",
          supplier_company_id: "",
        });
      } else {
        toast.error(result.response_message || "Failed to create farmer");
      }
    } catch (error) {
      console.error("Error creating farmer:", error);
      toast.error("Failed to create farmer");
    }
  };

  const fetchExpenses = async (page = currentPage, limit = itemsPerPage) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/unitExpense/readAll?page=${page}&limit=${limit}`,
      );
      const result = await response.json();
      if (result.response_status === "success") {
        const responseData = result.response_result;

        // Handle paginated response
        if (responseData?.pagination) {
          const expensesData = responseData.data || [];
          setExpenses(expensesData);
          setTotalPages(responseData.pagination.totalPages || 1);
          setTotalItems(responseData.pagination.total || 0);
          setCurrentPage(responseData.pagination.page || page);
        } else {
          // Fallback for non-paginated response
          const expensesData = responseData?.data || responseData || [];
          setExpenses(expensesData);
          setTotalPages(1);
          setTotalItems(expensesData.length);
        }
      } else {
        toast.error(result.response_message || "Failed to fetch expenses");
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
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
      !data.supplier_id ||
      !data.product_id ||
      !data.price ||
      !data.quantity
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    const total = calculateTotal();

    const payload = {
      req_object: {
        expense_date: data.expense_date,
        prounit_id: parseInt(data.prounit_id),
        floc_id: parseInt(data.floc_id),
        supplier_id: parseInt(data.supplier_id),
        product_id: parseInt(data.product_id),
        product_nam: products.find(
          (product) => product.product_id === parseInt(data.product_id),
        )?.product_title,
        price: parseFloat(data.price),
        quantity: parseFloat(data.quantity),
        tax_type: data.tax_type,
        tax_value: data.tax_value ? parseFloat(data.tax_value) : 0,
        discount_type: data.discount_type,
        discount_value: data.discount_value
          ? parseFloat(data.discount_value)
          : 0,
        total: total,
        description: data.description?.trim() || "",
        ...(isEditMode && { expense_id: editingExpenseId }),
      },
    };

    try {
      const url = "/api/unitExpense";
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
            ? "Expense updated successfully"
            : "Expense created successfully",
        );
        fetchExpenses(currentPage, itemsPerPage);
        // Preserve date, unit, and floc — only reset transaction-specific fields
        reset({
          expense_date: data.expense_date,
          prounit_id: data.prounit_id,
          floc_id: data.floc_id,
          supplier_id: "",
          product_id: "",
          price: "",
          quantity: "",
          tax_type: "flat",
          tax_value: "",
          discount_type: "percentage",
          discount_value: "",
          description: "",
        });
        setIsEditMode(false);
        setEditingExpenseId(null);
      } else {
        const errorMessage =
          result.response_message ||
          result.response_result?.message ||
          "Failed to save expense";
        console.error("Error response:", result);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error(error.message || "Failed to save expense");
    }
  };

  const handleEdit = (expense) => {
    setIsEditMode(true);
    setEditingExpenseId(expense.expense_id);
    const prounitId =
      (
        expense.prounit_id ||
        expense.farm_id ||
        expense.unit?.prounit_id
      )?.toString() || "";
    reset({
      expense_date: expense.expense_date
        ? new Date(expense.expense_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      prounit_id: prounitId,
      floc_id: expense.floc_id?.toString() || "",
      supplier_id: expense.supplier_id?.toString() || "",
      product_id: expense.product_id?.toString() || "",
      price: expense.price?.toString() || "",
      quantity: expense.quantity?.toString() || "",
      tax_type: expense.tax_type || "flat",
      tax_value: expense.tax_value?.toString() || "",
      discount_type: expense.discount_type || "percentage",
      discount_value: expense.discount_value?.toString() || "",
      description: expense.description || "",
    });
    // Fetch flocs for the selected unit
    if (prounitId) {
      fetchFlocsByUnit(prounitId);
    }
  };

  const handleDelete = (expenseId) => {
    setDeletingExpenseId(expenseId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingExpenseId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/unitExpense?expense_id=${deletingExpenseId}`,
        { method: "DELETE" },
      );
      const result = await response.json();
      if (result.response_status === "success") {
        toast.success("Expense deleted successfully");
        setIsDeleteDialogOpen(false);
        setDeletingExpenseId(null);
        // If the deleted expense is currently loaded in edit mode, clear the form
        if (editingExpenseId === deletingExpenseId) {
          reset({
            expense_date: new Date().toISOString().split("T")[0],
            prounit_id: "",
            floc_id: "",
            supplier_id: "",
            product_id: "",
            price: "",
            quantity: "",
            tax_type: "flat",
            tax_value: "",
            discount_type: "percentage",
            discount_value: "",
            description: "",
          });
          setIsEditMode(false);
          setEditingExpenseId(null);
        }
        fetchExpenses(currentPage, itemsPerPage);
      } else {
        toast.error(result.response_message || "Failed to delete expense");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter expenses (client-side filtering on paginated data)
  const filteredExpenses = expenses.filter((expense) => {
    const prounitId =
      expense.prounit_id || expense.farm_id || expense.unit?.prounit_id;
    const unitName =
      expense.unit?.prounit_nam ||
      (Array.isArray(units) &&
        units.find((u) => u.prounit_id === prounitId)?.prounit_nam);

    const matchesSearch =
      searchQuery === "" ||
      expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unitName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(products) &&
        products
          .find((p) => p.product_id === expense.product_id)
          ?.product_title?.toLowerCase()
          .includes(searchQuery.toLowerCase()));

    const matchesUnit =
      filterUnit === "all" || prounitId?.toString() === filterUnit;

    const matchesFloc =
      filterFloc === "all" || expense.floc_id?.toString() === filterFloc;

    const matchesDate =
      filterDate === "" ||
      (expense.expense_date &&
        new Date(expense.expense_date).toISOString().split("T")[0] ===
          filterDate);

    return matchesSearch && matchesUnit && matchesFloc && matchesDate;
  });

  // Reset to page 1 when filters change and refetch
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchExpenses(1, itemsPerPage);
    }
  }, [searchQuery, filterUnit, filterFloc, filterDate]);

  // Fetch expenses when page or itemsPerPage changes
  useEffect(() => {
    fetchExpenses(currentPage, itemsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  const totalAmount = calculateTotal();

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Form Section */}
      <Card className={"max-w-5xl mx-auto"}>
        <CardContent className="p-4 sm:p-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            id="unit-expense-form"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="expense_date">Date *</Label>
                <Input
                  id="expense_date"
                  type="date"
                  {...register("expense_date", {
                    required: "Date is required",
                  })}
                />
                {errors.expense_date && (
                  <p className="text-sm text-destructive">
                    {errors.expense_date.message}
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

              {/* Former Selection */}
              <div className="space-y-2">
                <Label htmlFor="supplier_id">Former *</Label>
                <div className="flex gap-2">
                  <Controller
                    name="supplier_id"
                    control={control}
                    rules={{ required: "Former is required" }}
                    render={({ field }) => (
                      <div className="flex-1">
                        <Combobox
                          options={
                            Array.isArray(suppliers)
                              ? suppliers.map((supplier) => ({
                                  value: supplier.acc_id.toString(),
                                  label: supplier.account_nam,
                                }))
                              : []
                          }
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select farmer"
                          searchPlaceholder="Search farmers..."
                          emptyText="No farmer found."
                        />
                      </div>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsSupplierDialogOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                {errors.supplier_id && (
                  <p className="text-sm text-destructive">
                    {errors.supplier_id.message}
                  </p>
                )}
                {/* Former Balance Display */}
                <div className="flex gap-2 items-center">
                  <Button type="button" variant="outline" size="icon" disabled>
                    <Equal className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    {loadingSupplierBalance ? (
                      <div className="text-sm text-muted-foreground">
                        Loading...
                      </div>
                    ) : (
                      <div className="text-sm">
                        Balance{" "}
                        {supplierBalance !== null
                          ? supplierBalance.toFixed(2)
                          : "0"}
                      </div>
                    )}
                  </div>
                </div>
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

            {/* First Row: Price, Discount Type, Discount Value, Discounted Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              {/* Discount Type */}
              <div className="space-y-2">
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
                        <RadioGroupItem
                          value="percentage"
                          id="discount-percentage"
                        />
                        <Label
                          htmlFor="discount-percentage"
                          className="font-normal cursor-pointer"
                        >
                          Percentage
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="flat" id="discount-flat" />
                        <Label
                          htmlFor="discount-flat"
                          className="font-normal cursor-pointer"
                        >
                          Flat
                        </Label>
                      </div>
                    </RadioGroup>
                  )}
                />
              </div>

              {/* Discount Value */}
              <div className="space-y-2">
                <Label htmlFor="discount_value">Discount Value</Label>
                <Input
                  id="discount_value"
                  type="number"
                  step="0.01"
                  {...register("discount_value", {
                    min: {
                      value: 0,
                      message:
                        "Discount value must be greater than or equal to 0",
                    },
                  })}
                  placeholder="0.00"
                />
              </div>

              {/* Discounted Amount */}
              <div className="space-y-2">
                <Label>Discounted Amount</Label>
                <div className="p-2 bg-muted/50 rounded-md border border-muted min-h-[2.5rem] flex items-center">
                  <p className="text-sm font-semibold">
                    {discountValue
                      ? calculateDiscountAmount().toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : "0.00"}
                  </p>
                </div>
              </div>
            </div>

            {/* Second Row: Quantity, Tax Type, Tax Value, Tax Applied Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              {/* Tax Type */}
              <div className="space-y-2">
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
                        <Label
                          htmlFor="tax-flat"
                          className="font-normal cursor-pointer"
                        >
                          Flat
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="percentage"
                          id="tax-percentage"
                        />
                        <Label
                          htmlFor="tax-percentage"
                          className="font-normal cursor-pointer"
                        >
                          Percentage
                        </Label>
                      </div>
                    </RadioGroup>
                  )}
                />
              </div>

              {/* Tax Value */}
              <div className="space-y-2">
                <Label htmlFor="tax_value">Tax Value</Label>
                <Input
                  id="tax_value"
                  type="number"
                  step="0.01"
                  {...register("tax_value", {
                    min: {
                      value: 0,
                      message: "Tax value must be greater than or equal to 0",
                    },
                  })}
                  placeholder="0.00"
                />
              </div>

              {/* Tax Applied Amount */}
              <div className="space-y-2">
                <Label>Tax Applied Amount</Label>
                <div className="p-2 bg-muted/50 rounded-md border border-muted min-h-[2.5rem] flex items-center">
                  <p className="text-sm font-semibold">
                    {taxValue
                      ? calculateTaxAmount().toLocaleString(undefined, {
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

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset({
                    expense_date: new Date().toISOString().split("T")[0],
                    prounit_id: "",
                    floc_id: "",
                    supplier_id: "",
                    product_id: "",
                    price: "",
                    quantity: "",
                    tax_type: "flat",
                    tax_value: "",
                    discount_type: "percentage",
                    discount_value: "",
                    description: "",
                  });
                  setIsEditMode(false);
                  setEditingExpenseId(null);
                }}
              >
                {isEditMode ? "Cancel Edit" : "Clear Form"}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : isEditMode
                    ? "Update Expense"
                    : "Create Expense"}
              </Button>
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={() => handleDelete(editingExpenseId)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <MobileListToggle title="Expenses">
            {/* Filters */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search expenses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* <div className="space-y-2">
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
                </div> */}

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

            {/* Table */}
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No expenses found
              </div>
            ) : isMobile ? (
              <div className="space-y-3">
                {filteredExpenses.map((expense) => (
                  <Card key={expense.expense_id} className="border">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Date</span>
                        <span className="text-sm font-medium">
                          {expense.expense_date
                            ? new Date(
                                expense.expense_date,
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Unit</span>
                        <span className="text-sm font-medium">
                          {expense.unit?.prounit_nam ||
                            (Array.isArray(units) &&
                              units.find(
                                (u) =>
                                  u.prounit_id ===
                                  (expense.prounit_id || expense.farm_id),
                              )?.prounit_nam) ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Floc</span>
                        <span className="text-sm">Floc #{expense.floc_id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Supplier</span>
                        <span className="text-sm font-medium">
                          {(Array.isArray(suppliers) &&
                            expense.supplier_id &&
                            suppliers.find(
                              (s) => s.acc_id === expense.supplier_id,
                            )?.account_nam) ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Product</span>
                        <span className="text-sm font-medium">
                          {(Array.isArray(products) &&
                            products.find(
                              (p) => p.product_id === expense.product_id,
                            )?.product_title) ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Price</span>
                        <span className="text-sm">
                          {expense.price?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Quantity</span>
                        <span className="text-sm">
                          {expense.quantity?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Total</span>
                        <span className="text-sm font-medium">
                          {expense.total?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </span>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(expense)}
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
                          Supplier
                        </th>
                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">
                          Product
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
                      {filteredExpenses.map((expense) => (
                        <tr
                          key={expense.expense_id}
                          className="hover:bg-muted/50 border-b transition-colors"
                        >
                          <td className="p-2 align-middle whitespace-nowrap">
                            {expense.expense_date
                              ? new Date(
                                  expense.expense_date,
                                ).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap">
                            {expense.unit?.prounit_nam ||
                              (Array.isArray(units) &&
                                units.find(
                                  (u) =>
                                    u.prounit_id ===
                                    (expense.prounit_id || expense.farm_id),
                                )?.prounit_nam) ||
                              "N/A"}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap hidden md:table-cell">
                            Floc #{expense.floc_id}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap hidden lg:table-cell">
                            {(Array.isArray(suppliers) &&
                              expense.supplier_id &&
                              suppliers.find(
                                (s) => s.acc_id === expense.supplier_id,
                              )?.account_nam) ||
                              "N/A"}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap">
                            {(Array.isArray(products) &&
                              products.find(
                                (p) => p.product_id === expense.product_id,
                              )?.product_title) ||
                              "N/A"}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap hidden xl:table-cell">
                            {expense.price?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap hidden xl:table-cell">
                            {expense.quantity?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap font-medium">
                            {expense.total?.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }) || "0.00"}
                          </td>
                          <td className="p-2 align-middle whitespace-nowrap">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(expense)}
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
                          fetchExpenses(newPage, itemsPerPage);
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
                            onClick={() => setCurrentPage(pageNum)}
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
                          fetchExpenses(newPage, itemsPerPage);
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
                  {totalItems} expenses
                </div>
              </div>
            )}
          </MobileListToggle>
        </CardContent>
      </Card>

      {/* Create Former Dialog */}
      <Dialog
        open={isSupplierDialogOpen}
        onOpenChange={setIsSupplierDialogOpen}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Former</DialogTitle>
            <DialogDescription>
              Create a new farmer account. The farmer will be created with
              is_supplier flag set to true.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_name">Former Name *</Label>
              <Input
                id="supplier_name"
                value={supplierFormData.supplier_name}
                onChange={(e) =>
                  setSupplierFormData({
                    ...supplierFormData,
                    supplier_name: e.target.value,
                  })
                }
                placeholder="Enter farmer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_cnic">CNIC *</Label>
              <Input
                id="supplier_cnic"
                value={supplierFormData.supplier_cnic}
                onChange={(e) =>
                  setSupplierFormData({
                    ...supplierFormData,
                    supplier_cnic: e.target.value,
                  })
                }
                placeholder="XXXXX-XXXXXXX-X"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_address">Address *</Label>
              <Input
                id="supplier_address"
                value={supplierFormData.supplier_address}
                onChange={(e) =>
                  setSupplierFormData({
                    ...supplierFormData,
                    supplier_address: e.target.value,
                  })
                }
                placeholder="Enter address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_contact">Contact *</Label>
              <Input
                id="supplier_contact"
                value={supplierFormData.supplier_contact}
                onChange={(e) =>
                  setSupplierFormData({
                    ...supplierFormData,
                    supplier_contact: e.target.value,
                  })
                }
                placeholder="Enter contact number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_company_id">Company</Label>
              <div className="flex gap-2">
                <Select
                  value={supplierFormData.supplier_company_id || undefined}
                  onValueChange={(value) => {
                    // Convert "none" to empty string, otherwise use the value
                    const finalValue = value === "none" ? "" : value;
                    setSupplierFormData({
                      ...supplierFormData,
                      supplier_company_id: finalValue,
                    });
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select company (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {Array.isArray(companies) &&
                      companies.map((company) => (
                        <SelectItem
                          key={company.company_id}
                          value={company.company_id.toString()}
                        >
                          {company.company_nam}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCompanyDialogOpen(true)}
                  title="Add New Company"
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsSupplierDialogOpen(false);
                setSupplierFormData({
                  supplier_name: "",
                  supplier_cnic: "",
                  supplier_address: "",
                  supplier_contact: "",
                  supplier_company_id: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateSupplier}>
              Create Former
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Company Dialog */}
      <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
            <DialogDescription>
              Create a new company. This company will be available for selection
              when creating suppliers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Enter company name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCompanyDialogOpen(false);
                setNewCompanyName("");
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateCompany}>
              Create Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this unit expense?
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
