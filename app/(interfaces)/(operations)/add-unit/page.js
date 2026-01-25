"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function UnitPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      prounit_nam: "",
      capacity: "",
      address: "",
    },
  });

  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCapacity, setFilterCapacity] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterAddress, setFilterAddress] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async (page = currentPage, limit = itemsPerPage) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/unit/readAll?page=${page}&limit=${limit}`);
      const result = await response.json();
      
      if (result.response_status === "success") {
        const responseData = result.response_result;
        
        // Handle paginated response
        if (responseData?.pagination) {
          const unitsData = responseData.data || [];
          setUnits(unitsData);
          setTotalPages(responseData.pagination.totalPages || 1);
          setTotalItems(responseData.pagination.total || 0);
          setCurrentPage(responseData.pagination.page || page);
        } else {
          // Fallback for non-paginated response
          const unitsData = responseData?.data || responseData || [];
          setUnits(unitsData);
          setTotalPages(1);
          setTotalItems(unitsData.length);
        }
      } else {
        toast.error(result.response_message || "Failed to fetch units");
      }
    } catch (error) {
      console.error("Error fetching units:", error);
      toast.error("Failed to fetch units");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    const payload = {
      req_object: {
        prounit_nam: data.prounit_nam.trim(),
        capacity: data.capacity ? parseFloat(data.capacity) : null,
        address: data.address.trim() || null,
        ...(isEditMode && { prounit_id: editingUnitId }),
      },
    };

    try {
      const url = "/api/unit";
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
          isEditMode ? "Unit updated successfully" : "Unit created successfully"
        );
        reset({
          prounit_nam: "",
          capacity: "",
          address: "",
        });
        setIsEditMode(false);
        setEditingUnitId(null);
        fetchUnits(currentPage, itemsPerPage);
      } else {
        toast.error(result.response_message || "Failed to save unit");
      }
    } catch (error) {
      console.error("Error saving unit:", error);
      toast.error("Failed to save unit");
    }
  };

  const handleCreateNew = () => {
    setIsEditMode(false);
    setEditingUnitId(null);
    reset({
      prounit_nam: "",
      capacity: "",
      address: "",
    });
    // Scroll to form
    document.getElementById("unit-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEdit = (unit) => {
    setIsEditMode(true);
    setEditingUnitId(unit.prounit_id);
    
    reset({
      prounit_nam: unit.prounit_nam || "",
      capacity: unit.capacity?.toString() || "",
      address: unit.address || "",
    });
    // Scroll to form
    document.getElementById("unit-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = async (unitId) => {
    if (!confirm("Are you sure you want to delete this unit?")) {
      return;
    }

    try {
      // Note: You may need to implement a DELETE endpoint
      const response = await fetch(`/api/unit?prounit_id=${unitId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.response_status === "success") {
        toast.success("Unit deleted successfully");
        fetchUnits(currentPage, itemsPerPage);
      } else {
        toast.error(result.response_message || "Failed to delete unit");
      }
    } catch (error) {
      console.error("Error deleting unit:", error);
      toast.error("Failed to delete unit");
    }
  };

  // Filter units (client-side filtering on paginated data)
  const filteredUnits = units.filter((unit) => {
    const matchesSearch = searchQuery === "" || 
      unit.prounit_nam?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.capacity?.toString().includes(searchQuery);

    const matchesCapacity = filterCapacity === "" ||
      unit.capacity?.toString().includes(filterCapacity);

    const matchesName = filterName === "" ||
      unit.prounit_nam?.toLowerCase().includes(filterName.toLowerCase());

    const matchesAddress = filterAddress === "" ||
      unit.address?.toLowerCase().includes(filterAddress.toLowerCase());

    return matchesSearch && matchesCapacity && matchesName && matchesAddress;
  });

  // Reset to page 1 when filters change and refetch
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchUnits(1, itemsPerPage);
    }
  }, [searchQuery, filterCapacity, filterName, filterAddress]);

  // Fetch units when page or itemsPerPage changes
  useEffect(() => {
    fetchUnits(currentPage, itemsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  return (
    <div className="p-6 space-y-6">

      {/* Form Section */}
      <Card className={"max-w-4xl mx-auto"}>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="unit-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="prounit_nam">Name *</Label>
                <Input
                  id="prounit_nam"
                  {...register("prounit_nam", {
                    required: "Unit name is required",
                  })}
                  placeholder="Enter unit name"
                />
                {errors.prounit_nam && (
                  <p className="text-sm text-destructive">
                    {errors.prounit_nam.message}
                  </p>
                )}
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  step="0.01"
                  {...register("capacity", {
                    min: { value: 0, message: "Capacity must be greater than or equal to 0" },
                  })}
                  placeholder="Enter capacity"
                />
                {errors.capacity && (
                  <p className="text-sm text-destructive">
                    {errors.capacity.message}
                  </p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                {...register("address")}
                placeholder="Enter address"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setIsEditMode(false);
                  setEditingUnitId(null);
                }}
              >
                {isEditMode ? "Cancel Edit" : "Clear Form"}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditMode ? "Update Unit" : "Create Unit"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Units List */}
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
                    placeholder="Search units..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Filter by name..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  placeholder="Filter by capacity..."
                  type="number"
                  value={filterCapacity}
                  onChange={(e) => setFilterCapacity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  placeholder="Filter by address..."
                  value={filterAddress}
                  onChange={(e) => setFilterAddress(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredUnits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No units found
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={"max-h-[500px] overflow-y-auto"}>
                  {filteredUnits.map((unit) => (
                    <TableRow key={unit.prounit_id}>
                      <TableCell className="font-medium">
                        {unit.prounit_nam || "N/A"}
                      </TableCell>
                      <TableCell>
                        {unit.capacity !== null && unit.capacity !== undefined
                          ? unit.capacity.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                          : "N/A"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {unit.address || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(unit)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(unit.prounit_id)}
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
                        fetchUnits(1, Number(value));
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
                        fetchUnits(newPage, itemsPerPage);
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
                                  fetchUnits(pageNum, itemsPerPage);
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
                              fetchUnits(newPage, itemsPerPage);
                            }}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} units
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

