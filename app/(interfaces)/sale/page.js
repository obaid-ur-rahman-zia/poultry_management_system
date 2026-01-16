"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowUp,
  Calendar as CalendarIcon,
  Equal,
  History,
  PlusCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Combobox } from "@/components/ui/combobox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import MobileListToggle from "@/app/(interfaces)/components/MobileListToggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SalePage() {
  const [activeTab, setActiveTab] = useState("whole-sale");

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="whole-sale">Whole Sale</TabsTrigger>
          <TabsTrigger value="local-sale">Local Sale</TabsTrigger>
          <TabsTrigger value="feed-supply">Feed Supply</TabsTrigger>
        </TabsList>

        <TabsContent value="whole-sale" className="space-y-4">
          <WholeSaleTab />
        </TabsContent>

        <TabsContent value="local-sale" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            Local Sale - Coming Soon
          </div>
        </TabsContent>

        <TabsContent value="feed-supply" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            Feed Supply - Coming Soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WholeSaleTab() {
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
      farm_rate: "",
      sale_rate: "",
      former_account: "",
      van_number: "",
      weight: "",
      former_rate: "",
      former_amount: "",
      purcher_account: "",
      purcher_rate: "",
      purcher_amount: "",
      profit: "",
    },
  });

  const [wholeSales, setWholeSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [supplierAccounts, setSupplierAccounts] = useState([]);
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [supplierBalance, setSupplierBalance] = useState(null);
  const [customerBalance, setCustomerBalance] = useState(null);
  const [loadingSupplierBalance, setLoadingSupplierBalance] = useState(false);
  const [loadingCustomerBalance, setLoadingCustomerBalance] = useState(false);
  const [saleDate, setSaleDate] = useState(new Date());
  const [fsRateSet, setFsRateSet] = useState(false);
  const [fsRateEditable, setFsRateEditable] = useState(true);
  const [previousFsRates, setPreviousFsRates] = useState([]);
  const [isFsRateHistoryOpen, setIsFsRateHistoryOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState({
    supplier_name: "",
    supplier_cnic: "",
    supplier_address: "",
    supplier_contact: "",
    supplier_company_id: "",
  });
  const [customerFormData, setCustomerFormData] = useState({
    customer_name: "",
    customer_cnic: "",
    customer_address: "",
    customer_contact: "",
  });
  const [companies, setCompanies] = useState([]);

  const selectedSupplier = watch("former_account");
  const selectedCustomer = watch("purcher_account");
  const weight = watch("weight");
  const formerRate = watch("former_rate");
  const purcherRate = watch("purcher_rate");
  const purcherAmount = watch("purcher_amount");
  const formerAmount = watch("former_amount");

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    fetchSupplierAccounts();
    fetchCustomerAccounts();
    fetchCompanies();
    fetchWholeSales();
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

  // Fetch Supplier accounts
  const fetchSupplierAccounts = async () => {
    try {
      const response = await fetch("/api/supplier/readAll");
      const result = await response.json();
      if (result.response_status === "success") {
        const supplierData = result.response_result?.supplier_data || result.response_result?.data || [];
        setSupplierAccounts(supplierData);
      }
    } catch (error) {
      console.error("Error fetching supplier accounts:", error);
      setSupplierAccounts([]);
    }
  };

  // Fetch Customer accounts
  const fetchCustomerAccounts = async () => {
    try {
      const response = await fetch("/api/customer/readAll");
      const result = await response.json();
      if (result.response_status === "success") {
        const customerData = result.response_result?.customer_data || result.response_result?.data || [];
        setCustomerAccounts(customerData);
      }
    } catch (error) {
      console.error("Error fetching customer accounts:", error);
      setCustomerAccounts([]);
    }
  };

  // Fetch Companies for supplier
  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/company/readAll");
      const result = await response.json();
      if (result.response_status === "success") {
        const companiesData = result.response_result?.data || result.response_result || [];
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      setCompanies([]);
    }
  };

  // Handle Create Supplier
  const handleCreateSupplier = async () => {
    if (!supplierFormData.supplier_name || !supplierFormData.supplier_cnic || !supplierFormData.supplier_address || !supplierFormData.supplier_contact) {
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
          supplier_company_id: supplierFormData.supplier_company_id ? parseInt(supplierFormData.supplier_company_id) : null,
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
        toast.success("Supplier created successfully");
        const accId = result.response_result?.acc_id;
        if (accId) {
          setValue("former_account", accId.toString());
        }
        setIsSupplierDialogOpen(false);
        setSupplierFormData({
          supplier_name: "",
          supplier_cnic: "",
          supplier_address: "",
          supplier_contact: "",
          supplier_company_id: "",
        });
        await fetchSupplierAccounts();
      } else {
        toast.error(result.response_message || "Failed to create supplier");
      }
    } catch (error) {
      console.error("Error creating supplier:", error);
      toast.error("Failed to create supplier");
    }
  };

  // Handle Create Customer
  const handleCreateCustomer = async () => {
    if (!customerFormData.customer_name || !customerFormData.customer_cnic || !customerFormData.customer_address || !customerFormData.customer_contact) {
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
        toast.success("Customer created successfully");
        const accId = result.response_result?.acc_id;
        if (accId) {
          setValue("purcher_account", accId.toString());
        }
        setIsCustomerDialogOpen(false);
        setCustomerFormData({
          customer_name: "",
          customer_cnic: "",
          customer_address: "",
          customer_contact: "",
        });
        await fetchCustomerAccounts();
      } else {
        toast.error(result.response_message || "Failed to create customer");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("Failed to create customer");
    }
  };

  // Fetch Supplier account balance
  const fetchSupplierBalance = useCallback(async (accId) => {
    if (!accId) {
      setSupplierBalance(null);
      return;
    }
    setLoadingSupplierBalance(true);
    try {
      const response = await fetch(`/api/transaction/read/balance?acc_id=${accId}`);
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
  }, []);

  // Fetch Customer account balance
  const fetchCustomerBalance = useCallback(async (accId) => {
    if (!accId) {
      setCustomerBalance(null);
      return;
    }
    setLoadingCustomerBalance(true);
    try {
      const response = await fetch(`/api/transaction/read/balance?acc_id=${accId}`);
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
      setLoadingCustomerBalance(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSupplier) {
      fetchSupplierBalance(selectedSupplier);
    } else {
      setSupplierBalance(null);
    }
  }, [selectedSupplier, fetchSupplierBalance]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerBalance(selectedCustomer);
    } else {
      setCustomerBalance(null);
    }
  }, [selectedCustomer, fetchCustomerBalance]);

  // Calculate Former Amount (Weight * Former Rate)
  useEffect(() => {
    if (weight && formerRate) {
      const amount = parseFloat(weight) * parseFloat(formerRate);
      setValue("former_amount", isNaN(amount) ? "" : amount.toFixed(2));
    } else {
      setValue("former_amount", "");
    }
  }, [weight, formerRate, setValue]);

  // Calculate Purcher Amount (Purcher Rate * Weight)
  useEffect(() => {
    if (purcherRate && weight) {
      const amount = parseFloat(purcherRate) * parseFloat(weight);
      setValue("purcher_amount", isNaN(amount) ? "" : amount.toFixed(2));
    } else {
      setValue("purcher_amount", "");
    }
  }, [purcherRate, weight, setValue]);

  // Calculate Profit (Purcher Amount - Former Amount, negative is profit)
  useEffect(() => {
    const formerAmt = parseFloat(formerAmount) || 0;
    const purcherAmt = parseFloat(purcherAmount) || 0;
    const profit = purcherAmt - formerAmt;
    // Negative profit means profit (as per requirement: "jo minus ho ga wo profit")
    setValue("profit", isNaN(profit) ? "" : profit.toFixed(2));
  }, [formerAmount, purcherAmount, setValue]);

  // Fetch whole sales
  const fetchWholeSales = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/wholeSale/readAll");
      const result = await response.json();
      if (result.response_status === "success") {
        const salesData = result.response_result?.data || result.response_result || [];
        setWholeSales(salesData);
      } else {
        toast.error(result.response_message || "Failed to fetch whole sales");
      }
    } catch (error) {
      console.error("Error fetching whole sales:", error);
      toast.error("Failed to fetch whole sales");
    } finally {
      setLoading(false);
    }
  };

  const handleGetData = () => {
    // Scroll to transactions list
    const listElement = document.getElementById("whole-sale-list");
    if (listElement) {
      listElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Check if F.S Rate is already set for today
  const checkFsRateForToday = useCallback(async () => {
    if (!saleDate) return;
    try {
      const response = await fetch(
        `/api/wholeSale/checkFsRate?sale_date=${saleDate.toISOString().split("T")[0]}`
      );
      const result = await response.json();
      if (result.response_status === "success") {
        const data = result.response_result;
        if (data.exists) {
          setFsRateSet(true);
          setFsRateEditable(false);
          setValue("farm_rate", data.farm_rate?.toString() || "");
          setValue("sale_rate", data.sale_rate?.toString() || "");
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
  }, [saleDate, setValue]);

  // Fetch previous F.S Rates
  const fetchPreviousFsRates = async () => {
    try {
      const response = await fetch("/api/wholeSale/previousFsRates");
      const result = await response.json();
      if (result.response_status === "success") {
        const ratesData = result.response_result?.data || result.response_result || [];
        setPreviousFsRates(ratesData);
      }
    } catch (error) {
      console.error("Error fetching previous F.S Rates:", error);
    }
  };

  const handleOpenFsRateHistory = () => {
    fetchPreviousFsRates();
    setIsFsRateHistoryOpen(true);
  };

  const handleSelectPreviousFsRate = (rate) => {
    setValue("farm_rate", rate.farm_rate?.toString() || "");
    setValue("sale_rate", rate.sale_rate?.toString() || "");
    setIsFsRateHistoryOpen(false);
  };

  useEffect(() => {
    // Check if F.S Rate is already set for selected date
    if (saleDate) {
      checkFsRateForToday();
    } else {
      setFsRateSet(false);
      setFsRateEditable(true);
    }
  }, [saleDate, checkFsRateForToday]);

  const onSubmit = async (data) => {
    if (
      !data.former_account ||
      !data.purcher_account ||
      !data.van_number ||
      !data.weight ||
      !data.former_rate
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload = {
      req_object: {
        sale_date: data.sale_date,
        farm_rate: data.farm_rate || null,
        sale_rate: data.sale_rate || null,
        former_account: parseInt(data.former_account),
        van_number: data.van_number.trim(),
        weight: parseFloat(data.weight),
        former_rate: parseFloat(data.former_rate),
        former_amount: parseFloat(data.former_amount) || 0,
        purcher_account: parseInt(data.purcher_account),
        purcher_rate: data.purcher_rate ? parseFloat(data.purcher_rate) : null,
        purcher_amount: parseFloat(data.purcher_amount) || 0,
        profit: parseFloat(data.profit) || 0,
        set_fs_rate: !fsRateSet, // Flag to set F.S Rate if not already set
        ...(isEditMode && { sale_id: editingSaleId }),
      },
    };

    try {
      const url = "/api/wholeSale";
      const method = isEditMode ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.response_status === "success") {
        toast.success(
          isEditMode
            ? "Whole sale updated successfully"
            : "Whole sale created successfully"
        );
        
        // If F.S Rate was set, update the state
        if (!fsRateSet && (data.farm_rate || data.sale_rate)) {
          setFsRateSet(true);
          setFsRateEditable(false);
        }
        
        reset({
          sale_date: new Date().toISOString().split("T")[0],
          farm_rate: "",
          sale_rate: "",
          former_account: "",
          van_number: "",
          weight: "",
          former_rate: "",
          former_amount: "",
          purcher_account: "",
          purcher_rate: "",
          purcher_amount: "",
          profit: "",
        });
        setSaleDate(new Date());
        setSupplierBalance(null);
        setCustomerBalance(null);
        setIsEditMode(false);
        setEditingSaleId(null);
        fetchWholeSales();
      } else {
        toast.error(result.response_message || "Failed to save whole sale");
      }
    } catch (error) {
      console.error("Error saving whole sale:", error);
      toast.error("Failed to save whole sale");
    }
  };

  const handleCreateNew = () => {
    setIsEditMode(false);
    setEditingSaleId(null);
    reset({
      sale_date: new Date().toISOString().split("T")[0],
      farm_rate: "",
      sale_rate: "",
      former_account: "",
      van_number: "",
      weight: "",
      former_rate: "",
      former_amount: "",
      purcher_account: "",
      purcher_rate: "",
      purcher_amount: "",
      profit: "",
    });
    const newDate = new Date();
    setSaleDate(newDate);
    setFsRateSet(false);
    setFsRateEditable(true);
    setSupplierBalance(null);
    setCustomerBalance(null);
    document
      .getElementById("whole-sale-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // Calculate Net Balance (Supplier Balance + Former Amount)
  const supplierNetBalance = (supplierBalance || 0) + (parseFloat(formerAmount) || 0);
  // Calculate Net Balance (Customer Balance + Purcher Amount)
  const customerNetBalance = (customerBalance || 0) + (parseFloat(purcherAmount) || 0);

  // Filter whole sales
  const filteredWholeSales = wholeSales.filter((sale) => {
    const matchesSearch =
      searchQuery === "" ||
      sale.van_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSupplier =
      filterSupplier === "all" ||
      sale.former_account?.toString() === filterSupplier;
    const matchesCustomer =
      filterCustomer === "all" ||
      sale.purcher_account?.toString() === filterCustomer;
    const matchesDate =
      filterDate === "" ||
      (sale.sale_date &&
        new Date(sale.sale_date).toISOString().split("T")[0] === filterDate);
    return matchesSearch && matchesSupplier && matchesCustomer && matchesDate;
  });

  return (
    <>
      {/* Form Section */}
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-4 sm:p-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            id="whole-sale-form"
          >
            {/* Date and F.S Rate Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {saleDate ? format(saleDate, "dd MMMM yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={saleDate}
                      onSelect={(date) => {
                        if (date) {
                          setSaleDate(date);
                          setValue("sale_date", date.toISOString().split("T")[0]);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex gap-2 items-end">
                <Button
                  type="button"
                  variant="default"
                  onClick={handleGetData}
                  className="rounded-full px-4"
                >
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Get Data
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>F.S Rate *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenFsRateHistory}
                  >
                    <History className="h-4 w-4 mr-1" />
                    Previous
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
                </div>
                {(errors.farm_rate || errors.sale_rate) && (
                  <p className="text-sm text-destructive">
                    {errors.farm_rate?.message || errors.sale_rate?.message}
                  </p>
                )}
              </div>
            </div>

            {/* Supplier Section */}
            <div className="space-y-4 border p-4 rounded-lg">
              <div className="font-semibold">Supplier</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <div className="flex gap-2">
                    <Controller
                      name="former_account"
                      control={control}
                      rules={{ required: "Supplier account is required" }}
                      render={({ field }) => (
                        <div className="flex-1">
                          <Combobox
                            options={supplierAccounts.map((acc) => ({
                              value: acc.acc_id.toString(),
                              label: acc.account_nam,
                            }))}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select Supplier"
                            searchPlaceholder="Search supplier accounts..."
                            emptyText="No supplier account found."
                          />
                        </div>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsSupplierDialogOpen(true)}
                      title="Add New Supplier"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.former_account && (
                    <p className="text-sm text-destructive">
                      {errors.former_account.message}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled
                  >
                    <Equal className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    {loadingSupplierBalance ? (
                      <div className="text-sm text-muted-foreground">Loading...</div>
                    ) : (
                      <div className="text-sm">
                        Balance {supplierBalance !== null ? supplierBalance.toFixed(2) : "0"}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Van Number</Label>
                  <Input
                    {...register("van_number", {
                      required: "Van number is required",
                    })}
                    placeholder="Enter van number"
                  />
                  {errors.van_number && (
                    <p className="text-sm text-destructive">
                      {errors.van_number.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    {...register("weight", {
                      required: "Weight is required",
                    })}
                    type="number"
                    step="0.01"
                    placeholder="Enter weight in kg"
                  />
                  {errors.weight && (
                    <p className="text-sm text-destructive">
                      {errors.weight.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Rate</Label>
                  <Input
                    {...register("former_rate", {
                      required: "Rate is required",
                    })}
                    type="number"
                    step="0.01"
                    placeholder="Enter rate"
                  />
                  {errors.former_rate && (
                    <p className="text-sm text-destructive">
                      {errors.former_rate.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    {...register("former_amount")}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="text-sm">
                Net Balance {supplierNetBalance.toFixed(2)}
              </div>
            </div>

            {/* Customer Section */}
            <div className="space-y-4 border p-4 rounded-lg">
              <div className="font-semibold">Customer</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <div className="flex gap-2">
                    <Controller
                      name="purcher_account"
                      control={control}
                      rules={{ required: "Customer account is required" }}
                      render={({ field }) => (
                        <div className="flex-1">
                          <Combobox
                            options={customerAccounts.map((acc) => ({
                              value: acc.acc_id.toString(),
                              label: acc.account_nam,
                            }))}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select Customer"
                            searchPlaceholder="Search customer accounts..."
                            emptyText="No customer account found."
                          />
                        </div>
                      )}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsCustomerDialogOpen(true)}
                      title="Add New Customer"
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.purcher_account && (
                    <p className="text-sm text-destructive">
                      {errors.purcher_account.message}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled
                  >
                    <Equal className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    {loadingCustomerBalance ? (
                      <div className="text-sm text-muted-foreground">Loading...</div>
                    ) : (
                      <div className="text-sm">
                        Balance {customerBalance !== null ? customerBalance.toFixed(2) : "0"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Rate</Label>
                  <Input
                    {...register("purcher_rate", {
                      required: "Customer rate is required",
                    })}
                    type="number"
                    step="0.01"
                    placeholder="Enter rate"
                  />
                  {errors.purcher_rate && (
                    <p className="text-sm text-destructive">
                      {errors.purcher_rate.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    {...register("purcher_amount")}
                    readOnly
                    className="bg-muted"
                    placeholder="Auto calculated"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Net Balance</Label>
                  <Input
                    value={customerNetBalance.toFixed(2)}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>

            {/* Profit Display */}
            <div className="space-y-2">
              <Label>Profit</Label>
              <Input
                {...register("profit")}
                readOnly
                className={`bg-muted ${
                  parseFloat(watch("profit") || 0) < 0 ? "text-red-600 font-semibold" : ""
                }`}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCreateNew}
              >
                New
              </Button>
              {!isEditMode && (
                <Button type="submit" disabled={isSubmitting} variant="outline">
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              )}
              {isEditMode && (
                <Button type="submit" disabled={isSubmitting} variant="outline">
                  {isSubmitting ? "Updating..." : "Update"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setIsEditMode(false);
                  setEditingSaleId(null);
                }}
              >
                Close
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card id="whole-sale-list">
        <CardContent>
          <MobileListToggle title="Whole Sales">
            {isMobile ? (
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  Mobile view coming soon
                </div>
              </div>
            ) : (
              <>
                {/* Filters */}
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Search</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by van number..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Supplier</Label>
                      <Select
                        value={filterSupplier}
                        onValueChange={setFilterSupplier}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Suppliers</SelectItem>
                          {supplierAccounts.map((acc) => (
                            <SelectItem
                              key={acc.acc_id}
                              value={acc.acc_id.toString()}
                            >
                              {acc.account_nam}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Customer</Label>
                      <Select
                        value={filterCustomer}
                        onValueChange={setFilterCustomer}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Customers</SelectItem>
                          {customerAccounts.map((acc) => (
                            <SelectItem
                              key={acc.acc_id}
                              value={acc.acc_id.toString()}
                            >
                              {acc.account_nam}
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

                {/* Table */}
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : filteredWholeSales.length === 0 ? (
                  <div className="text-center h-[300px] flex items-center justify-center py-8 text-muted-foreground">
                    No whole sales found
                  </div>
                ) : (
                  <div className="relative max-h-[300px] overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                          <TableHead>Sir</TableHead>
                          <TableHead>Van</TableHead>
                          <TableHead>Weight</TableHead>
                          <TableHead>Supplier</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Profit</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWholeSales.map((sale, index) => (
                          <TableRow key={sale.sale_id || index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{sale.van_number || "N/A"}</TableCell>
                            <TableCell>{sale.weight || "N/A"}</TableCell>
                            <TableCell>
                              {supplierAccounts.find(
                                (a) => a.acc_id === sale.former_account
                              )?.account_nam || "N/A"}
                            </TableCell>
                            <TableCell>{sale.former_rate || "N/A"}</TableCell>
                            <TableCell>{sale.former_amount || "N/A"}</TableCell>
                            <TableCell>
                              {customerAccounts.find(
                                (a) => a.acc_id === sale.purcher_account
                              )?.account_nam || "N/A"}
                            </TableCell>
                            <TableCell>{sale.purcher_rate || "N/A"}</TableCell>
                            <TableCell>{sale.purcher_amount || "N/A"}</TableCell>
                            <TableCell
                              className={
                                parseFloat(sale.profit || 0) < 0
                                  ? "text-red-600 font-semibold"
                                  : ""
                              }
                            >
                              {sale.profit || "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setIsEditMode(true);
                                    setEditingSaleId(sale.sale_id);
                                    setValue("sale_date", sale.sale_date ? new Date(sale.sale_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
                                    setSaleDate(sale.sale_date ? new Date(sale.sale_date) : new Date());
                                    setValue("farm_rate", sale.farm_rate?.toString() || "");
                                    setValue("sale_rate", sale.sale_rate?.toString() || "");
                                    setValue("former_account", sale.former_account?.toString() || "");
                                    setValue("van_number", sale.van_number || "");
                                    setValue("weight", sale.weight?.toString() || "");
                                    setValue("former_rate", sale.former_rate?.toString() || "");
                                    setValue("former_amount", sale.former_amount?.toString() || "");
                                    setValue("purcher_account", sale.purcher_account?.toString() || "");
                                    setValue("purcher_rate", sale.purcher_rate?.toString() || "");
                                    setValue("purcher_amount", sale.purcher_amount?.toString() || "");
                                    setValue("profit", sale.profit?.toString() || "");
                                    document
                                      .getElementById("whole-sale-form")
                                      ?.scrollIntoView({ behavior: "smooth" });
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    if (!confirm("Are you sure you want to delete this whole sale?")) {
                                      return;
                                    }
                                    try {
                                      const response = await fetch(`/api/wholeSale?sale_id=${sale.sale_id}`, {
                                        method: "DELETE",
                                      });
                                      const result = await response.json();
                                      if (result.response_status === "success") {
                                        toast.success("Whole sale deleted successfully");
                                        fetchWholeSales();
                                      } else {
                                        toast.error(result.response_message || "Failed to delete whole sale");
                                      }
                                    } catch (error) {
                                      console.error("Error deleting whole sale:", error);
                                      toast.error("Failed to delete whole sale");
                                    }
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </MobileListToggle>
        </CardContent>
      </Card>

      {/* Create Supplier Dialog */}
      <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Supplier</DialogTitle>
            <DialogDescription>
              Create a new supplier account. The supplier will be created with is_supplier flag set to true.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_name">Supplier Name *</Label>
              <Input
                id="supplier_name"
                value={supplierFormData.supplier_name}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, supplier_name: e.target.value })}
                placeholder="Enter supplier name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_cnic">CNIC *</Label>
              <Input
                id="supplier_cnic"
                value={supplierFormData.supplier_cnic}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, supplier_cnic: e.target.value })}
                placeholder="XXXXX-XXXXXXX-X"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_address">Address *</Label>
              <Input
                id="supplier_address"
                value={supplierFormData.supplier_address}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, supplier_address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_contact">Contact *</Label>
              <Input
                id="supplier_contact"
                value={supplierFormData.supplier_contact}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, supplier_contact: e.target.value })}
                placeholder="Enter contact number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier_company_id">Company</Label>
              <Select
                value={supplierFormData.supplier_company_id || undefined}
                onValueChange={(value) => {
                  // Convert "none" to empty string, otherwise use the value
                  const finalValue = value === "none" ? "" : value;
                  setSupplierFormData({ ...supplierFormData, supplier_company_id: finalValue });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {Array.isArray(companies) && companies.map((company) => (
                    <SelectItem key={company.company_id} value={company.company_id.toString()}>
                      {company.company_nam}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              Create Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Customer Dialog */}
      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer account. The customer will be created with is_customer flag set to true.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                id="customer_name"
                value={customerFormData.customer_name}
                onChange={(e) => setCustomerFormData({ ...customerFormData, customer_name: e.target.value })}
                placeholder="Enter customer name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_cnic">CNIC *</Label>
              <Input
                id="customer_cnic"
                value={customerFormData.customer_cnic}
                onChange={(e) => setCustomerFormData({ ...customerFormData, customer_cnic: e.target.value })}
                placeholder="XXXXX-XXXXXXX-X"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_address">Address *</Label>
              <Input
                id="customer_address"
                value={customerFormData.customer_address}
                onChange={(e) => setCustomerFormData({ ...customerFormData, customer_address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_contact">Contact *</Label>
              <Input
                id="customer_contact"
                value={customerFormData.customer_contact}
                onChange={(e) => setCustomerFormData({ ...customerFormData, customer_contact: e.target.value })}
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
              Create Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* F.S Rate History Dialog */}
      <Dialog open={isFsRateHistoryOpen} onOpenChange={setIsFsRateHistoryOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Previous F.S Rates</DialogTitle>
            <DialogDescription>
              Select a previous F.S Rate to use
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
                            : rate.sale_date
                            ? new Date(rate.sale_date).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          {rate.farm_rate?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"} /{" "}
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
    </>
  );
}
