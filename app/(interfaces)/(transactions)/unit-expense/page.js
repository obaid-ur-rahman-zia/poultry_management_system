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
            expense_date: new Date().toISOString().split('T')[0],
            prounit_id: "",
            floc_id: "",
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

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [filterUnit, setFilterUnit] = useState("all");
    const [filterFloc, setFilterFloc] = useState("all");
    const [filterDate, setFilterDate] = useState("");

    const selectedUnit = watch("prounit_id");
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
    }, []);

    useEffect(() => {
        if (selectedUnit) {
            fetchFlocsByUnit(selectedUnit);
        } else {
            setAvailableFlocs([]);
            setValue("floc_id", "");
        }
    }, [selectedUnit]);

    const fetchUnits = async () => {
        try {
            const response = await fetch("/api/unit/readAll");
            const result = await response.json();
            if (result.response_status === "success") {
                const unitsData = result.response_result?.data || result.response_result || [];
                setUnits(Array.isArray(unitsData) ? unitsData : []);
            }
        } catch (error) {
            console.error("Error fetching units:", error);
            setUnits([]);
        }
    };

    const fetchFlocsByUnit = async (prounitId) => {
        try {
            const response = await fetch(`/api/floc/readByFarmId?farm_id=${prounitId}`);
            const result = await response.json();
            if (result.response_status === "success") {
                const flocsData = result.response_result?.data || result.response_result || [];
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

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/unitExpense/readAll");
            const result = await response.json();
            if (result.response_status === "success") {
                const expensesData = result.response_result?.data || result.response_result || [];
                setExpenses(expensesData);
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

    const calculateTotal = () => {
        const priceValue = parseFloat(price) || 0;
        const quantityValue = parseFloat(quantity) || 0;
        let subtotal = priceValue * quantityValue;

        // Apply discount
        if (discountValue) {
            const discountAmount = discountType === "percentage"
                ? (subtotal * parseFloat(discountValue)) / 100
                : parseFloat(discountValue);
            subtotal -= discountAmount;
        }

        // Apply tax
        if (taxValue) {
            const taxAmount = taxType === "percentage"
                ? (subtotal * parseFloat(taxValue)) / 100
                : parseFloat(taxValue);
            subtotal += taxAmount;
        }

        return Math.max(0, subtotal);
    };

    const onSubmit = async (data) => {
        if (!data.prounit_id || !data.floc_id || !data.product_id || !data.price || !data.quantity) {
            toast.error("Please fill all required fields");
            return;
        }

        const total = calculateTotal();

        const payload = {
            req_object: {
                expense_date: data.expense_date,
                prounit_id: parseInt(data.prounit_id),
                floc_id: parseInt(data.floc_id),
                product_id: parseInt(data.product_id),
                price: parseFloat(data.price),
                quantity: parseFloat(data.quantity),
                tax_type: data.tax_type,
                tax_value: data.tax_value ? parseFloat(data.tax_value) : 0,
                discount_type: data.discount_type,
                discount_value: data.discount_value ? parseFloat(data.discount_value) : 0,
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
                toast.success(isEditMode ? "Expense updated successfully" : "Expense created successfully");
                reset({
                    expense_date: new Date().toISOString().split('T')[0],
                    prounit_id: "",
                    floc_id: "",
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
                fetchExpenses();
            } else {
                toast.error(result.response_message || "Failed to save expense");
            }
        } catch (error) {
            console.error("Error saving expense:", error);
            toast.error("Failed to save expense");
        }
    };

    const handleEdit = (expense) => {
        setIsEditMode(true);
        setEditingExpenseId(expense.expense_id);
        const prounitId = (expense.prounit_id || expense.farm_id || expense.unit?.prounit_id)?.toString() || "";
        reset({
            expense_date: expense.expense_date ? new Date(expense.expense_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            prounit_id: prounitId,
            floc_id: expense.floc_id?.toString() || "",
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

    const handleDelete = async (expenseId) => {
        if (!confirm("Are you sure you want to delete this expense?")) {
            return;
        }

        try {
            const response = await fetch(`/api/unitExpense?expense_id=${expenseId}`, {
                method: "DELETE",
            });
            const result = await response.json();
            if (result.response_status === "success") {
                toast.success("Expense deleted successfully");
                fetchExpenses();
            } else {
                toast.error(result.response_message || "Failed to delete expense");
            }
        } catch (error) {
            console.error("Error deleting expense:", error);
            toast.error("Failed to delete expense");
        }
    };

    // Filter expenses
    const filteredExpenses = expenses.filter((expense) => {
        const prounitId = expense.prounit_id || expense.farm_id || expense.unit?.prounit_id;
        const unitName = expense.unit?.prounit_nam || (Array.isArray(units) && units.find(u => u.prounit_id === prounitId)?.prounit_nam);
        
        const matchesSearch = searchQuery === "" ||
            expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            unitName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (Array.isArray(products) && products.find(p => p.product_id === expense.product_id)?.product_title?.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesUnit = filterUnit === "all" ||
            prounitId?.toString() === filterUnit;

        const matchesFloc = filterFloc === "all" ||
            expense.floc_id?.toString() === filterFloc;

        const matchesDate = filterDate === "" ||
            (expense.expense_date && new Date(expense.expense_date).toISOString().split('T')[0] === filterDate);

        return matchesSearch && matchesUnit && matchesFloc && matchesDate;
    });

    const totalAmount = calculateTotal();

    return (
        <div className="p-6 space-y-6">
            {/* Form Section */}
            <Card className={"max-w-5xl mx-auto"}>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="unit-expense-form">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.isArray(units) && units.map((unit) => (
                                                    <SelectItem key={unit.prounit_id} value={unit.prounit_id.toString()}>
                                                        {unit.prounit_nam}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
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
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={!selectedUnit || availableFlocs.length === 0}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select floc" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableFlocs.map((floc) => (
                                                    <SelectItem key={floc.floc_id} value={floc.floc_id.toString()}>
                                                        Floc #{floc.floc_id} - {new Date(floc.starting_date).toLocaleDateString()}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.floc_id && (
                                    <p className="text-sm text-destructive">
                                        {errors.floc_id.message}
                                    </p>
                                )}
                                {!selectedUnit && (
                                    <p className="text-xs text-muted-foreground">Please select a unit first</p>
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
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
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
                                    <p className="text-sm text-destructive">
                                        {errors.product_id.message}
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
                                        min: { value: 0, message: "Price must be greater than or equal to 0" },
                                    })}
                                    placeholder="0.00"
                                />
                                {errors.price && (
                                    <p className="text-sm text-destructive">
                                        {errors.price.message}
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
                                        min: { value: 0.01, message: "Quantity must be greater than 0" },
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
                                <Label htmlFor="tax_type">Tax Type</Label>
                                <Controller
                                    name="tax_type"
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

                            {/* Tax Value */}
                            <div className="space-y-2">
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
                            </div>

                            {/* Discount Type */}
                            <div className="space-y-2">
                                <Label htmlFor="discount_type">Discount Type</Label>
                                <Controller
                                    name="discount_type"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="percentage">Percentage</SelectItem>
                                                <SelectItem value="flat">Flat</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                                        min: { value: 0, message: "Discount value must be greater than or equal to 0" },
                                    })}
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Total */}
                            <div className="space-y-2">
                                <Label>Total Amount</Label>
                                <div className="p-2 bg-muted rounded-md">
                                    <p className="text-lg font-semibold">
                                        {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>
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

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    reset({
                                        expense_date: new Date().toISOString().split('T')[0],
                                        prounit_id: "",
                                        floc_id: "",
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
                                {isSubmitting ? "Saving..." : isEditMode ? "Update Expense" : "Create Expense"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Expenses List */}
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
                                        placeholder="Search expenses..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Unit</Label>
                                <Select value={filterUnit} onValueChange={setFilterUnit}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Units</SelectItem>
                                        {Array.isArray(units) && units.map((unit) => (
                                            <SelectItem key={unit.prounit_id} value={unit.prounit_id.toString()}>
                                                {unit.prounit_nam}
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
                    ) : filteredExpenses.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No expenses found
                        </div>
                    ) : (
                        <div className="relative max-h-[600px] overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="sticky top-0 bg-background z-20 border-b-2">
                                    <tr className="border-b">
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Date</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Unit</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Floc</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Product</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Price</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Quantity</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Total</th>
                                        <th className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap bg-background">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.map((expense) => (
                                        <tr key={expense.expense_id} className="hover:bg-muted/50 border-b transition-colors">
                                            <td className="p-2 align-middle whitespace-nowrap">
                                                {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : "N/A"}
                                            </td>
                                            <td className="p-2 align-middle whitespace-nowrap">
                                                {expense.unit?.prounit_nam || (Array.isArray(units) && units.find(u => u.prounit_id === (expense.prounit_id || expense.farm_id))?.prounit_nam) || "N/A"}
                                            </td>
                                            <td className="p-2 align-middle whitespace-nowrap">
                                                Floc #{expense.floc_id}
                                            </td>
                                            <td className="p-2 align-middle whitespace-nowrap">
                                                {Array.isArray(products) && products.find(p => p.product_id === expense.product_id)?.product_title || "N/A"}
                                            </td>
                                            <td className="p-2 align-middle whitespace-nowrap">
                                                {expense.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                            </td>
                                            <td className="p-2 align-middle whitespace-nowrap">
                                                {expense.quantity?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                            </td>
                                            <td className="p-2 align-middle whitespace-nowrap font-medium">
                                                {expense.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                            </td>
                                            <td className="p-2 align-middle whitespace-nowrap">
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(expense)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(expense.expense_id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

