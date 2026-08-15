"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowUp,
  Calendar as CalendarIcon,
  History,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const isRoleAccount = (account, role) => {
  const subheadName = account.subhead?.subhead_nam?.toLowerCase() || "";

  if (role === "supplier") {
    return (
      account.is_supplier === 1 ||
      subheadName.includes("farmer") ||
      subheadName.includes("former") ||
      subheadName.includes("supplier")
    );
  }

  return (
    account.is_customer === 1 ||
    subheadName.includes("purchaser") ||
    subheadName.includes("purcher") ||
    subheadName.includes("customer")
  );
};

export default function SalePage() {
  const [activeTab, setActiveTab] = useState("whole-sale");

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-1">
          <TabsTrigger value="whole-sale">Whole Sale</TabsTrigger>
        </TabsList>

        <TabsContent value="whole-sale" className="space-y-4">
          <WholeSaleTab />
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAccountSearchDialogOpen, setIsAccountSearchDialogOpen] =
    useState(false);
  const [accountSearchType, setAccountSearchType] = useState("all"); // "all" or sub_id (e.g., "1", "2", "3")
  const [accountSearchQuery, setAccountSearchQuery] = useState("");
  const [allAccounts, setAllAccounts] = useState([]);
  const [accountSearchField, setAccountSearchField] = useState("former"); // Track which field opened the dialog: "former" or "purcher"
  const [accountSubHeads, setAccountSubHeads] = useState([]); // Store account sub-heads for account type dropdown
  const accountRowRefs = useRef([]);
  accountRowRefs.current = [];
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchSupplierAccounts();
    fetchCustomerAccounts();
    fetchCompanies();
    fetchWholeSales();
    fetchAllAccounts();
    fetchAccountSubHeads();
    const currentDate = new Date().toISOString().split("T")[0];
    setValue("sale_date", currentDate);
  }, []);

  // Fetch all accounts for search dialog (fetch all without pagination for search)
  const fetchAllAccounts = async () => {
    try {
      // Fetch all accounts without pagination using all=true parameter
      const response = await fetch("/api/account/accounts/readAll?all=true");
      const result = await response.json();
      if (result.success || result.response_status === "success") {
        const responseData = result.response_result;
        // Handle response (with or without pagination)
        if (responseData?.pagination) {
          const accountsData = responseData.data || [];
          setAllAccounts(Array.isArray(accountsData) ? accountsData : []);
        } else {
          // Non-paginated response (all accounts)
          const accountsData = responseData?.data || responseData || [];
          setAllAccounts(Array.isArray(accountsData) ? accountsData : []);
        }
      }
    } catch (error) {
      console.error("Error fetching all accounts:", error);
      setAllAccounts([]);
    }
  };

  // Fetch account sub-heads for account type dropdown
  const fetchAccountSubHeads = async () => {
    try {
      const response = await fetch("/api/account/accountSubHead/readAll");
      const result = await response.json();
      if (result.response_status === "success") {
        const subHeadsData =
          result.response_result?.data || result.response_result || [];
        setAccountSubHeads(subHeadsData);
      }
    } catch (error) {
      console.error("Error fetching account sub-heads:", error);
      setAccountSubHeads([]);
    }
  };

  const getDefaultAccountSearchType = (field) => {
    const matchedSubhead = accountSubHeads.find((subhead) => {
      const subheadName = subhead.subhead_nam?.toLowerCase() || "";

      if (field === "former") {
        return (
          subheadName.includes("farmer") ||
          subheadName.includes("former") ||
          subheadName.includes("supplier")
        );
      }

      return (
        subheadName.includes("purchaser") ||
        subheadName.includes("purcher") ||
        subheadName.includes("customer")
      );
    });

    return matchedSubhead ? matchedSubhead.sub_id.toString() : "all";
  };

  const focusFirstAccountRow = () => {
    const firstRow = accountRowRefs.current.find(Boolean);
    if (!firstRow) return false;
    firstRow.focus();
    return true;
  };

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
      const response = await fetch("/api/account/accounts/readAll?all=true");
      const result = await response.json();
      if (result.response_status === "success") {
        const accountsData =
          result.response_result?.data || result.response_result || [];
        setSupplierAccounts(
          Array.isArray(accountsData)
            ? accountsData.filter((account) => isRoleAccount(account, "supplier"))
            : [],
        );
      }
    } catch (error) {
      console.error("Error fetching supplier accounts:", error);
      setSupplierAccounts([]);
    }
  };

  // Fetch Customer accounts
  const fetchCustomerAccounts = async () => {
    try {
      const response = await fetch("/api/account/accounts/readAll?all=true");
      const result = await response.json();
      if (result.response_status === "success") {
        const accountsData =
          result.response_result?.data || result.response_result || [];
        setCustomerAccounts(
          Array.isArray(accountsData)
            ? accountsData.filter((account) => isRoleAccount(account, "customer"))
            : [],
        );
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
        const companiesData =
          result.response_result?.data || result.response_result || [];
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      setCompanies([]);
    }
  };

  // Handle Create Supplier
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
        toast.success("Farmer created successfully");
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
        toast.error(result.response_message || "Failed to create farmer");
      }
    } catch (error) {
      console.error("Error creating farmer:", error);
      toast.error("Failed to create farmer");
    }
  };

  // Handle Create Customer
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
        toast.success("Purchaser created successfully");
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
        toast.error(result.response_message || "Failed to create purchaser");
      }
    } catch (error) {
      console.error("Error creating purchaser:", error);
      toast.error("Failed to create purchaser");
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
  }, []);

  // Fetch Customer account balance
  const fetchCustomerBalance = useCallback(async (accId) => {
    if (!accId) {
      setCustomerBalance(null);
      return;
    }
    setLoadingCustomerBalance(true);
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
  const fetchWholeSales = async (page = currentPage, limit = itemsPerPage) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/wholeSale/readAll?page=${page}&limit=${limit}`,
      );
      const result = await response.json();
      if (result.response_status === "success") {
        const responseData = result.response_result;

        // Handle paginated response
        if (responseData?.pagination) {
          const salesData = responseData.data || [];
          setWholeSales(salesData);
          setTotalPages(responseData.pagination.totalPages || 1);
          setTotalItems(responseData.pagination.total || 0);
          setCurrentPage(responseData.pagination.page || page);
        } else {
          // Fallback for non-paginated response
          const salesData = responseData?.data || responseData || [];
          setWholeSales(salesData);
          setTotalPages(1);
          setTotalItems(salesData.length);
        }
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
        `/api/wholeSale/checkFsRate?sale_date=${saleDate.toISOString().split("T")[0]
        }`,
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
        const ratesData =
          result.response_result?.data || result.response_result || [];
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

    const selectedSaleDate = saleDate.toISOString().split("T")[0];
    const payload = {
      req_object: {
        sale_date: selectedSaleDate,
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
            : "Whole sale created successfully",
        );

        // If F.S Rate was set, update the state
        if (!fsRateSet && (data.farm_rate || data.sale_rate)) {
          setFsRateSet(true);
          setFsRateEditable(false);
        }

        reset({
          sale_date: selectedSaleDate,
          farm_rate: data.farm_rate,
          sale_rate: data.sale_rate,
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
        setSupplierBalance(null);
        setCustomerBalance(null);
        setIsEditMode(false);
        setEditingSaleId(null);
        fetchWholeSales(currentPage, itemsPerPage);
      } else {
        toast.error(result.response_message || "Failed to save whole sale");
      }
    } catch (error) {
      console.error("Error saving whole sale:", error);
      toast.error("Failed to save whole sale");
    }
  };

  const handleDeleteSale = async () => {
    if (!editingSaleId) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/wholeSale?sale_id=${editingSaleId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.response_status === "success") {
        toast.success("Whole sale deleted successfully");
        setIsDeleteDialogOpen(false);
        reset({
          sale_date: saleDate.toISOString().split("T")[0],
          farm_rate: watch("farm_rate"),
          sale_rate: watch("sale_rate"),
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
        setSupplierBalance(null);
        setCustomerBalance(null);
        setIsEditMode(false);
        setEditingSaleId(null);
        fetchWholeSales(currentPage, itemsPerPage);
      } else {
        toast.error(result.response_message || "Failed to delete whole sale");
      }
    } catch (error) {
      console.error("Error deleting whole sale:", error);
      toast.error("Failed to delete whole sale");
    } finally {
      setIsDeleting(false);
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
  const supplierNetBalance =
    (supplierBalance || 0) + (parseFloat(formerAmount) || 0);
  // Calculate Net Balance (Customer Balance + Purcher Amount)
  const customerNetBalance =
    (customerBalance || 0) + (parseFloat(purcherAmount) || 0);

  // Filter whole sales (client-side filtering on paginated data)
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

  // Reset to page 1 when filters change and refetch
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchWholeSales(1, itemsPerPage);
    }
  }, [searchQuery, filterSupplier, filterCustomer, filterDate]);

  // Fetch whole sales when page or itemsPerPage changes
  useEffect(() => {
    fetchWholeSales(currentPage, itemsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  return (
    <>
      {/* Form Section */}
      <Card className="max-w-4xl p-0! mx-auto">
        <CardContent className="p-3 sm:p-4">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            id="whole-sale-form"
          >
            {/* Date and F.S Rate Section */}
            <div className="flex flex-nowrap items-center gap-2">
              <div className="flex items-center gap-1">
                <Label className="whitespace-nowrap">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="xs"
                      className="h-8 px-2 text-l justify-start"
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {saleDate
                        ? format(saleDate, "dd MMMM yyyy")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={saleDate}
                      onSelect={(date) => {
                        if (date) {
                          setSaleDate(date);
                          setValue(
                            "sale_date",
                            date.toISOString().split("T")[0],
                          );
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                <Label className="whitespace-nowrap">F.S Rate</Label>
                <div className="flex items-center gap-1">
                  <Input
                    id="farm_rate"
                    type="number"
                    step="0.01"
                    {...register("farm_rate", {
                      required: !fsRateSet ? "Farm Rate is required" : false,
                    })}
                    placeholder="0.00"
                    disabled={!fsRateEditable}
                    className={`h-8 w-20 text-l ${!fsRateEditable ? "bg-muted" : ""}`}
                  />
                  <span className="text-l">-</span>
                  <Input
                    id="sale_rate"
                    type="number"
                    step="0.01"
                    {...register("sale_rate", {
                      required: !fsRateSet ? "Sale Rate is required" : false,
                    })}
                    placeholder="0.00"
                    disabled={!fsRateEditable}
                    className={`h-8 w-20 text-l ${!fsRateEditable ? "bg-muted" : ""}`}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleOpenFsRateHistory}
                  className="h-8 px-2 text-l"
                >
                  <History className="h-3 w-3 mr-1" />
                  ADD RATE
                </Button>
              </div>
            </div>

            {/* Former Section */}
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="flex w-full items-center gap-1">
                  <Label className="whitespace-nowrap text-l">Farmer</Label>
                  <Controller
                    name="former_account"
                    control={control}
                    rules={{ required: "Farmer account is required" }}
                    render={({ field }) => {
                      // Get selected account from allAccounts if it exists
                      const selectedAccount = allAccounts.find(
                        (acc) => acc.acc_id?.toString() === field.value,
                      );

                      // Combine supplierAccounts with selected account if it's not in supplierAccounts
                      const options = [
                        ...supplierAccounts.map((acc) => ({
                          value: acc.acc_id.toString(),
                          label: acc.account_nam,
                        })),
                        ...(selectedAccount &&
                          !supplierAccounts.find(
                            (acc) => acc.acc_id === selectedAccount.acc_id,
                          )
                          ? [
                            {
                              value: selectedAccount.acc_id.toString(),
                              label: selectedAccount.account_nam,
                            },
                          ]
                          : []),
                      ];

                      return (
                        <div className="w-60">
                          <Combobox
                            options={options}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select Farmer"
                            searchPlaceholder="Search farmer accounts..."
                            emptyText="No farmer account found."
                          />
                        </div>
                      );
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setAccountSearchField("former");
                      setAccountSearchType(getDefaultAccountSearchType("former"));
                      setAccountSearchQuery("");
                      setIsAccountSearchDialogOpen(true);
                    }}
                    className="h-8 w-8 p-0 font-bold"
                    title="Search Accounts"
                  >
                    =
                  </Button>
                  <div className="flex items-center gap-1">
                    {loadingSupplierBalance ? (
                      <span className="text-l text-muted-foreground">
                        Loading...
                      </span>
                    ) : (
                      <span className="text-l underline">
                        Balance{" "}
                        {supplierBalance !== null
                          ? supplierBalance.toFixed(2)
                          : "0"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-nowrap items-start   gap-2">
                <div className="flex flex-col justify-center gap-2">
                  <div className="flex items-center gap-1">
                    <Label className="whitespace-nowrap text-l">
                      Van Number
                    </Label>
                    <Input
                      {...register("van_number", {
                        required: "Van number is required",
                      })}
                      placeholder="Enter van number"
                      className="h-8 text-l"
                    />
                  </div>
                  <span className="text-l underline">
                    Amount {formerAmount || "0"}
                  </span>
                </div>
                <div className="flex flex-col justify-center gap-2">
                  <div className="flex items-center gap-1">
                    <Label className="whitespace-nowrap text-l">Weight</Label>
                    <Input
                      {...register("weight", {
                        required: "Weight is required",
                      })}
                      type="number"
                      step="0.01"
                      placeholder="Enter weight"
                      className="h-8 text-l"
                    />
                  </div>

                  <span className="text-l underline">
                    Net Balance {supplierNetBalance.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Label className="whitespace-nowrap text-l">Rate</Label>
                  <Input
                    {...register("former_rate", {
                      required: "Rate is required",
                    })}
                    type="number"
                    step="0.01"
                    placeholder="Enter rate"
                    className="h-8 text-l"
                  />
                </div>
              </div>
            </div>

            {/* Purcher Section */}
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-1">
                  <Label className="whitespace-nowrap text-l">Purchaser</Label>
                  <Controller
                    name="purcher_account"
                    control={control}
                    rules={{ required: "Purchaser account is required" }}
                    render={({ field }) => {
                      // Get selected account from allAccounts if it exists
                      const selectedAccount = allAccounts.find(
                        (acc) => acc.acc_id?.toString() === field.value,
                      );

                      // Combine customerAccounts with selected account if it's not in customerAccounts
                      const options = [
                        ...customerAccounts.map((acc) => ({
                          value: acc.acc_id.toString(),
                          label: acc.account_nam,
                        })),
                        ...(selectedAccount &&
                          !customerAccounts.find(
                            (acc) => acc.acc_id === selectedAccount.acc_id,
                          )
                          ? [
                            {
                              value: selectedAccount.acc_id.toString(),
                              label: selectedAccount.account_nam,
                            },
                          ]
                          : []),
                      ];

                      return (
                        <div className="w-60">
                          <Combobox
                            options={options}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Select Purchaser"
                            searchPlaceholder="Search purchaser accounts..."
                            emptyText="No purchaser account found."
                          />
                        </div>
                      );
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setAccountSearchField("purcher");
                      setAccountSearchType(getDefaultAccountSearchType("purcher"));
                      setAccountSearchQuery("");
                      setIsAccountSearchDialogOpen(true);
                    }}
                    className="h-8 w-8 p-0 font-bold"
                    title="Search Accounts"
                  >
                    =
                  </Button>
                  <div className="flex items-center gap-1">
                    {loadingCustomerBalance ? (
                      <span className="text-l text-muted-foreground">
                        Loading...
                      </span>
                    ) : (
                      <span className="text-l underline">
                        Balance{" "}
                        {customerBalance !== null
                          ? customerBalance.toFixed(2)
                          : "0"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                  <Label className="whitespace-nowrap text-l">Rate</Label>
                  <Input
                    {...register("purcher_rate", {
                      required: "Purchaser rate is required",
                    })}
                    type="number"
                    step="0.01"
                    placeholder="Enter rate"
                    className="h-8 text-l"
                  />
                </div>
                <span className="text-l underline">
                  Amount {purcherAmount || "0"}
                </span>
                <span className="text-l underline">
                  Net Balance {customerNetBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Profit Display */}
            <div className="flex items-center gap-1">
              <Label className="whitespace-nowrap text-l">Profit</Label>
              <span
                className={`text-l underline ${parseFloat(watch("profit") || 0) < 0
                    ? "text-red-600 font-semibold"
                    : ""
                  }`}
              >
                {watch("profit") || "0"}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              {!isEditMode && (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="outline"
                  size="xs"
                  className="h-8 px-3 text-l"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              )}
              {isEditMode && (
                <>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    variant="outline"
                    size="xs"
                    className="h-8 px-3 text-l"
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
                onClick={handleCreateNew}
                className="h-8 px-3 text-l"
              >
                New
              </Button>

              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => {
                  reset();
                  setIsEditMode(false);
                  setEditingSaleId(null);
                }}
                className="h-8 px-3 text-l"
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
                    <div className="space-y-4">
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
                    {/* <div className="space-y-4">
                      <Label>Former</Label>
                      <Select
                        value={filterSupplier}
                        onValueChange={setFilterSupplier}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Formers</SelectItem>
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
                    <div className="space-y-4">
                      <Label>Purcher</Label>
                      <Select
                        value={filterCustomer}
                        onValueChange={setFilterCustomer}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Purchers</SelectItem>
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
                    </div> */}
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
                          <TableHead>Farmer</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Purchaser</TableHead>
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
                              {allAccounts.find(
                                (a) => a.acc_id === sale.former_account,
                              )?.account_nam || "N/A"}
                            </TableCell>
                            <TableCell>{sale.former_rate || "N/A"}</TableCell>
                            <TableCell>{sale.former_amount || "N/A"}</TableCell>
                            <TableCell>
                              {allAccounts.find(
                                (a) => a.acc_id === sale.purcher_account,
                              )?.account_nam || "N/A"}
                            </TableCell>
                            <TableCell>{sale.purcher_rate || "N/A"}</TableCell>
                            <TableCell>
                              {sale.purcher_amount || "N/A"}
                            </TableCell>
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
                                  size="xs"
                                  onClick={() => {
                                    setIsEditMode(true);
                                    setEditingSaleId(sale.sale_id);
                                    setValue(
                                      "sale_date",
                                      sale.sale_date
                                        ? new Date(sale.sale_date)
                                          .toISOString()
                                          .split("T")[0]
                                        : new Date()
                                          .toISOString()
                                          .split("T")[0],
                                    );
                                    setSaleDate(
                                      sale.sale_date
                                        ? new Date(sale.sale_date)
                                        : new Date(),
                                    );
                                    setValue(
                                      "farm_rate",
                                      sale.farm_rate?.toString() || "",
                                    );
                                    setValue(
                                      "sale_rate",
                                      sale.sale_rate?.toString() || "",
                                    );
                                    setValue(
                                      "former_account",
                                      sale.former_account?.toString() || "",
                                    );
                                    setValue(
                                      "van_number",
                                      sale.van_number || "",
                                    );
                                    setValue(
                                      "weight",
                                      sale.weight?.toString() || "",
                                    );
                                    setValue(
                                      "former_rate",
                                      sale.former_rate?.toString() || "",
                                    );
                                    setValue(
                                      "former_amount",
                                      sale.former_amount?.toString() || "",
                                    );
                                    setValue(
                                      "purcher_account",
                                      sale.purcher_account?.toString() || "",
                                    );
                                    setValue(
                                      "purcher_rate",
                                      sale.purcher_rate?.toString() || "",
                                    );
                                    setValue(
                                      "purcher_amount",
                                      sale.purcher_amount?.toString() || "",
                                    );
                                    setValue(
                                      "profit",
                                      sale.profit?.toString() || "",
                                    );
                                    document
                                      .getElementById("whole-sale-form")
                                      ?.scrollIntoView({ behavior: "smooth" });
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                {/* <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={async () => {
                                    if (
                                      !confirm(
                                        "Are you sure you want to delete this whole sale?",
                                      )
                                    ) {
                                      return;
                                    }
                                    try {
                                      const response = await fetch(
                                        `/api/wholeSale?sale_id=${sale.sale_id}`,
                                        {
                                          method: "DELETE",
                                        },
                                      );
                                      const result = await response.json();
                                      if (
                                        result.response_status === "success"
                                      ) {
                                        toast.success(
                                          "Whole sale deleted successfully",
                                        );
                                        fetchWholeSales(
                                          currentPage,
                                          itemsPerPage,
                                        );
                                      } else {
                                        toast.error(
                                          result.response_message ||
                                            "Failed to delete whole sale",
                                        );
                                      }
                                    } catch (error) {
                                      console.error(
                                        "Error deleting whole sale:",
                                        error,
                                      );
                                      toast.error(
                                        "Failed to delete whole sale",
                                      );
                                    }
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button> */}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Pagination */}
                {totalPages >= 1 && (
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-l text-muted-foreground">
                        Items per page:
                      </Label>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                          setItemsPerPage(Number(value));
                          setCurrentPage(1);
                          fetchWholeSales(1, Number(value));
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
                              fetchWholeSales(newPage, itemsPerPage);
                            }}
                            className={
                              currentPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
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
                                    fetchWholeSales(pageNum, itemsPerPage);
                                  }}
                                  isActive={currentPage === pageNum}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          },
                        )}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => {
                              const newPage = Math.min(
                                totalPages,
                                currentPage + 1,
                              );
                              setCurrentPage(newPage);
                              fetchWholeSales(newPage, itemsPerPage);
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
                    <div className="text-l text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                      {totalItems} sales
                    </div>
                  </div>
                )}
              </>
            )}
          </MobileListToggle>
        </CardContent>
      </Card>

      {/* Account Search Dialog */}
      <Dialog
        open={isAccountSearchDialogOpen}
        onOpenChange={setIsAccountSearchDialogOpen}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Search Accounts</DialogTitle>
            <DialogDescription>
              Search and select an account to use in this sale
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-4">
              <div className="flex-1 space-y-2">
                <Label>Account Type (Head)</Label>
                <Combobox
                  options={[
                    { value: "all", label: "All Types" },
                    ...accountSubHeads
                      .filter(
                        (subhead) =>
                          subhead.subhead_nam !== "Expense Head" &&
                          subhead.parent?.subhead_nam !== "Expense Head",
                      )
                      .map((subhead) => ({
                        value: subhead.sub_id.toString(),
                        label: `${subhead.subhead_nam}${subhead.head?.head_nam &&
                            subhead.head.head_nam !== "Main Head"
                            ? ` (${subhead.head.head_nam})`
                            : ""
                          }`,
                      })),
                  ]}
                  value={accountSearchType}
                  onValueChange={setAccountSearchType}
                  placeholder="Select account type"
                  searchPlaceholder="Search account types..."
                  emptyText="No account type found."
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Search Account</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search accounts by name, cnic, contact..."
                    value={accountSearchQuery}
                    onChange={(e) => setAccountSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Tab") {
                        const moved = focusFirstAccountRow();
                        if (moved) e.preventDefault();
                      }
                    }}
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <div className="relative max-h-[400px] overflow-auto border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Sr. No</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead>Account Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allAccounts
                    .filter((acc) => {
                      if (accountSearchType !== "all") {
                        if (acc.sub_id?.toString() !== accountSearchType) {
                          return false;
                        }
                      }
                      if (accountSearchQuery) {
                        const query = accountSearchQuery.toLowerCase();
                        return (
                          acc.account_nam?.toLowerCase().includes(query) ||
                          acc.account_cnic?.toLowerCase().includes(query) ||
                          acc.account_contact?.toLowerCase().includes(query)
                        );
                      }
                      return true;
                    })
                    .map((acc, index) => (
                      <TableRow
                        key={acc.acc_id}
                        className="cursor-pointer hover:bg-muted/50"
                        tabIndex={0}
                        ref={(el) => {
                          accountRowRefs.current[index] = el;
                        }}
                        onClick={() => {
                          if (accountSearchField === "former") {
                            setValue("former_account", acc.acc_id.toString());
                          } else if (accountSearchField === "purcher") {
                            setValue("purcher_account", acc.acc_id.toString());
                          }
                          setIsAccountSearchDialogOpen(false);
                          setAccountSearchQuery("");
                          setTimeout(() => {
                            if (accountSearchField === "former") {
                              document.querySelector('[name="van_number"]')?.focus();
                            } else if (accountSearchField === "purcher") {
                              document.querySelector('[name="purcher_rate"]')?.focus();
                            }
                          }, 100);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (accountSearchField === "former") {
                              setValue("former_account", acc.acc_id.toString());
                            } else if (accountSearchField === "purcher") {
                              setValue("purcher_account", acc.acc_id.toString());
                            }
                            setIsAccountSearchDialogOpen(false);
                            setAccountSearchQuery("");
                            setTimeout(() => {
                              if (accountSearchField === "former") {
                                document.querySelector('[name="van_number"]')?.focus();
                              } else if (accountSearchField === "purcher") {
                                document.querySelector('[name="purcher_rate"]')?.focus();
                              }
                            }, 100);
                          }
                        }}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {acc.account_nam}
                        </TableCell>
                        <TableCell>
                          {accountSubHeads.find(
                            (sh) =>
                              sh.sub_id?.toString() === acc.sub_id?.toString(),
                          )?.subhead_nam || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAccountSearchDialogOpen(false);
                setAccountSearchQuery("");
              }}
            >
              Close
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
                <table className="w-full caption-bottom text-l">
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
                          }) || "0.00"}{" "}
                          /{" "}
                          {rate.sale_rate?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="xs"
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
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Whole Sale</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this whole sale?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="xs"
              onClick={handleDeleteSale}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
