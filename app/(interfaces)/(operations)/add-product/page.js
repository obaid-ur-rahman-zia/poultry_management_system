"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Plus, Search, Edit2, Trash2, PlusCircle, Check, ChevronsUpDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function ProductPage() {
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
      product_title: "",
      procategory_id: "",
      company_id: "",
      sale_price: "",
    },
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [units, setUnits] = useState([]);
  
  // Dialog states
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  
  // Searchable select states
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPrice, setFilterPrice] = useState("");
  const [filterName, setFilterName] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchCategories();
    fetchCompanies();
    fetchUnits();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/category/readAll");
      const result = await response.json();
      
      if (result.response_status === "success") {
        const categoriesData = result.response_result?.data || result.response_result || [];
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/company/readAll");
      const result = await response.json();
      
      if (result.response_status === "success") {
        const companiesData = result.response_result?.data || result.response_result || [];
        setCompanies(companiesData);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await fetch("/api/unit/readAll");
      const result = await response.json();
      
      if (result.response_status === "success") {
        const unitsData = result.response_result?.data || result.response_result || [];
        setUnits(unitsData);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };


  const fetchProducts = async (page = currentPage, limit = itemsPerPage) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/product/readAll?page=${page}&limit=${limit}`);
      const result = await response.json();
      
      if (result.response_status === "success") {
        const responseData = result.response_result;
        
        // Handle paginated response
        if (responseData?.pagination) {
          const productsData = responseData.products || [];
          setProducts(Array.isArray(productsData) ? productsData : []);
          setTotalPages(responseData.pagination.totalPages || 1);
          setTotalItems(responseData.pagination.total || 0);
          setCurrentPage(responseData.pagination.page || page);
        } else {
          // Fallback for non-paginated response
          const productsData = responseData?.products || responseData?.data || responseData || [];
          setProducts(Array.isArray(productsData) ? productsData : []);
          setTotalPages(1);
          setTotalItems(productsData.length);
        }
      } else {
        toast.error(result.response_message || "Failed to fetch products");
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const payload = {
        req_object: {
          procategory_nam: newCategoryName.trim(),
          insert_by: "user",
          update_by: "user",
          status: 1,
        },
      };

      const response = await fetch("/api/category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.response_status === "success") {
        toast.success("Category created successfully");
        await fetchCategories();
        // Set the newly created category as selected
        const newCategory = result.response_result;
        if (newCategory) {
          setValue("procategory_id", newCategory.procategory_id.toString());
        }
        setNewCategoryName("");
        setIsCategoryDialogOpen(false);
      } else {
        toast.error(result.response_message || "Failed to create category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to create category");
    }
  };

  const handleAddCompany = async () => {
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.response_status === "success") {
        toast.success("Company created successfully");
        await fetchCompanies();
        // Set the newly created company as selected
        const newCompany = result.response_result;
        if (newCompany) {
          setValue("company_id", newCompany.company_id.toString());
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

  const onSubmit = async (data) => {
    const payload = {
      req_object: {
        product_title: data.product_title.trim(),
        procategory_id: parseInt(data.procategory_id),
        company_id: parseInt(data.company_id),
        sale_price: parseFloat(data.sale_price) || 0,
        purchase_price: parseFloat(data.sale_price) || 0, // Using sale_price as default
        prounit_id: null, // Optional
        pgroup_id: null, // Optional
        ...(isEditMode && { product_id: editingProductId }),
      },
    };

    try {
      const url = "/api/product";
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
          isEditMode ? "Product updated successfully" : "Product created successfully"
        );
        reset({
          product_title: "",
          procategory_id: "",
          company_id: "",
          sale_price: "",
        });
        setIsEditMode(false);
        setEditingProductId(null);
        fetchProducts(currentPage, itemsPerPage);
      } else {
        toast.error(result.response_message || "Failed to save product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    }
  };

  const handleCreateNew = () => {
    setIsEditMode(false);
    setEditingProductId(null);
    reset({
      product_title: "",
      procategory_id: "",
      company_id: "",
      sale_price: "",
    });
    // Scroll to form
    document.getElementById("product-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEdit = (product) => {
    setIsEditMode(true);
    setEditingProductId(product.product_id);
    
    reset({
      product_title: product.product_title || "",
      procategory_id: product.procategory_id?.toString() || "",
      company_id: product.company_id?.toString() || "",
      sale_price: product.sale_price?.toString() || "",
    });
    // Scroll to form
    document.getElementById("product-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      // Note: You may need to implement a DELETE endpoint
      const response = await fetch(`/api/product?product_id=${productId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.response_status === "success") {
        toast.success("Product deleted successfully");
        fetchProducts(currentPage, itemsPerPage);
      } else {
        toast.error(result.response_message || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  // Filter products - ensure products is an array
  // Filter products (client-side filtering on paginated data)
  const filteredProducts = (Array.isArray(products) ? products : []).filter((product) => {
    const matchesSearch = searchQuery === "" || 
      product.product_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.types?.procategory_nam?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.companies?.company_nam?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === "all" || 
      product.procategory_id?.toString() === filterCategory;

    const matchesPrice = filterPrice === "" ||
      product.sale_price?.toString().includes(filterPrice) ||
      (filterPrice && product.sale_price && product.sale_price.toString().includes(filterPrice));

    const matchesName = filterName === "" ||
      product.product_title?.toLowerCase().includes(filterName.toLowerCase());

    return matchesSearch && matchesCategory && matchesPrice && matchesName;
  });

  // Reset to page 1 when filters change and refetch
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchProducts(1, itemsPerPage);
    }
  }, [searchQuery, filterCategory, filterPrice, filterName]);

  // Fetch products when page or itemsPerPage changes
  useEffect(() => {
    fetchProducts(currentPage, itemsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  return (
    <div className="p-6 space-y-6">

      {/* Form Section */}
      <Card className={"max-w-4xl mx-auto"}>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="product-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="product_title">Name *</Label>
                <Input
                  id="product_title"
                  {...register("product_title", {
                    required: "Product name is required",
                  })}
                  placeholder="Enter product name"
                />
                {errors.product_title && (
                  <p className="text-sm text-destructive">
                    {errors.product_title.message}
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="procategory_id">Category *</Label>
                <div className="flex gap-2">
                  <Controller
                    name="procategory_id"
                    control={control}
                    rules={{ required: "Category is required" }}
                    render={({ field }) => (
                      <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={categoryOpen}
                            className="flex-1 justify-between"
                          >
                            {field.value
                              ? categories.find(
                                  (category) => category.procategory_id.toString() === field.value
                                )?.procategory_nam || "Select category"
                              : "Select category"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search category..." />
                            <CommandList>
                              <CommandEmpty>No category found.</CommandEmpty>
                              <CommandGroup>
                                {categories.map((category) => (
                                  <CommandItem
                                    key={category.procategory_id}
                                    value={`${category.procategory_id}-${category.procategory_nam}`}
                                    onSelect={() => {
                                      field.onChange(category.procategory_id.toString());
                                      setCategoryOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === category.procategory_id.toString()
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {category.procategory_nam}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCategoryDialogOpen(true)}
                    className="shrink-0"
                    title="Add new category"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {errors.procategory_id && (
                  <p className="text-sm text-destructive">
                    {errors.procategory_id.message}
                  </p>
                )}
              </div>

              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="company_id">Company *</Label>
                <div className="flex gap-2">
                  <Controller
                    name="company_id"
                    control={control}
                    rules={{ required: "Company is required" }}
                    render={({ field }) => (
                      <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={companyOpen}
                            className="flex-1 justify-between"
                          >
                            {field.value
                              ? companies.find(
                                  (company) => company.company_id.toString() === field.value
                                )?.company_nam || "Select company"
                              : "Select company"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search company..." />
                            <CommandList>
                              <CommandEmpty>No company found.</CommandEmpty>
                              <CommandGroup>
                                {companies.map((company) => (
                                  <CommandItem
                                    key={company.company_id}
                                    value={`${company.company_id}-${company.company_nam}`}
                                    onSelect={() => {
                                      field.onChange(company.company_id.toString());
                                      setCompanyOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === company.company_id.toString()
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {company.company_nam}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCompanyDialogOpen(true)}
                    className="shrink-0"
                    title="Add new company"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {errors.company_id && (
                  <p className="text-sm text-destructive">
                    {errors.company_id.message}
                  </p>
                )}
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="sale_price">Price *</Label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  {...register("sale_price", {
                    required: "Price is required",
                    min: { value: 0, message: "Price must be greater than 0" },
                  })}
                  placeholder="0.00"
                />
                {errors.sale_price && (
                  <p className="text-sm text-destructive">
                    {errors.sale_price.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setIsEditMode(false);
                  setEditingProductId(null);
                }}
              >
                {isEditMode ? "Cancel Edit" : "Clear Form"}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditMode ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardContent>
          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.procategory_id} value={category.procategory_id.toString()}>
                        {category.procategory_nam}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  placeholder="Filter by price..."
                  type="number"
                  value={filterPrice}
                  onChange={(e) => setFilterPrice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Filter by name..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={"max-h-[500px] overflow-y-auto"}>
                  {paginatedProducts.map((product) => (
                    <TableRow key={product.product_id}>
                      <TableCell className="font-medium">
                        {product.product_title || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {product.types?.procategory_nam || 
                           categories.find(c => c.procategory_id === product.procategory_id)?.procategory_nam || 
                           "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {product.companies?.company_nam || 
                           companies.find(c => c.company_id === product.company_id)?.company_nam || 
                           "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.sale_price 
                          ? product.sale_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product.product_id)}
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
          )}

          {/* Pagination */}
          {totalItems > 0 && totalPages > 1 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Items per page:</Label>
                <Select
                  value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                        fetchProducts(1, Number(value));
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
                              fetchProducts(newPage, itemsPerPage);
                            }}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
                                  fetchProducts(pageNum, itemsPerPage);
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
                              fetchProducts(newPage, itemsPerPage);
                            }}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} products
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new product category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dialog_category_name">Category Name *</Label>
              <Input
                id="dialog_category_name"
                placeholder="Enter category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCategoryDialogOpen(false);
                setNewCategoryName("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim()}
            >
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Company Dialog */}
      <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
            <DialogDescription>
              Create a new company.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dialog_company_name">Company Name *</Label>
              <Input
                id="dialog_company_name"
                placeholder="Enter company name"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCompany();
                  }
                }}
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
            <Button
              type="button"
              onClick={handleAddCompany}
              disabled={!newCompanyName.trim()}
            >
              Add Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
