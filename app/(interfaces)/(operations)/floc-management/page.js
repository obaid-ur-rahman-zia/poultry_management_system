"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { Plus, Search, Edit2, Trash2, X, AlertCircle } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function FlocManagementPage() {
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
      farm_id: "",
      starting_date: "",
      ending_date: "",
      stackholders: [{ acc_id: "", percentage: "" }],
    },
  });

  const [flocs, setFlocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingFlocId, setEditingFlocId] = useState(null);
  const [farms, setFarms] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [availableFarms, setAvailableFarms] = useState([]);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [clearDescription, setClearDescription] = useState("");
  const [flocToClear, setFlocToClear] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUnit, setFilterUnit] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const stackholders = watch("stackholders") || [{ acc_id: "", percentage: "" }];
  const selectedFarm = watch("farm_id");

  useEffect(() => {
    fetchFarms();
    fetchAccounts();
    fetchFlocs();
  }, []);

  useEffect(() => {
    updateAvailableFarms();
  }, [flocs, selectedFarm]);

  const fetchFarms = async () => {
    try {
      const response = await fetch("/api/farm/readAll");
      const result = await response.json();
      
      if (result.response_status === "success") {
        const farmsData = result.response_result?.data || result.response_result || [];
        setFarms(farmsData);
      }
    } catch (error) {
      console.error("Error fetching farms:", error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/account/accounts/readAll");
      const result = await response.json();
      
      if (result.response_status === "success") {
        const accountsData = result.response_result?.data || result.response_result || [];
        setAccounts(accountsData);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchFlocs = async () => {
    setLoading(true);
    try {
      // Note: You'll need to create this API endpoint
      const response = await fetch("/api/floc/readAll");
      const result = await response.json();
      
      if (result.response_status === "success") {
        const flocsData = result.response_result?.data || result.response_result || [];
        setFlocs(flocsData);
      } else {
        // If API doesn't exist yet, set empty array
        setFlocs([]);
      }
    } catch (error) {
      console.error("Error fetching flocs:", error);
      setFlocs([]);
    } finally {
      setLoading(false);
    }
  };

  const updateAvailableFarms = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const unavailableFarmIds = flocs
      .filter(floc => {
        // Farm is unavailable if it has an ending_date that hasn't passed yet
        if (floc.ending_date) {
          const endDate = new Date(floc.ending_date);
          endDate.setHours(0, 0, 0, 0);
          return endDate >= today;
        }
        // If no ending_date, farm is unavailable
        return true;
      })
      .map(floc => floc.farm_id);

    const available = farms.filter(farm => {
      // If editing, allow the currently selected farm
      if (isEditMode && editingFlocId && flocs.find(f => f.floc_id === editingFlocId)?.farm_id === farm.farm_id) {
        return true;
      }
      return !unavailableFarmIds.includes(farm.farm_id);
    });

    setAvailableFarms(available);
  };

  const handleAddStackholder = () => {
    const currentStackholders = watch("stackholders") || [];
    setValue("stackholders", [...currentStackholders, { acc_id: "", percentage: "" }]);
  };

  const handleRemoveStackholder = (index) => {
    const currentStackholders = watch("stackholders") || [];
    if (currentStackholders.length > 1) {
      const newStackholders = currentStackholders.filter((_, i) => i !== index);
      setValue("stackholders", newStackholders);
      // Recalculate percentages if needed
      if (newStackholders.length === 1) {
        setValue("stackholders.0.percentage", "100");
      }
    }
  };

  const handleStackholderChange = (index, field, value) => {
    const currentStackholders = [...(watch("stackholders") || [])];
    currentStackholders[index][field] = value;
    setValue("stackholders", currentStackholders);

    // If only one stackholder, set to 100%
    if (currentStackholders.length === 1 && field === "acc_id" && value) {
      setValue("stackholders.0.percentage", "100");
    }
  };

  const calculateTotalPercentage = () => {
    const percentages = stackholders
      .map(sh => parseFloat(sh.percentage) || 0)
      .filter(p => !isNaN(p));
    return percentages.reduce((sum, p) => sum + p, 0);
  };

  const handleClearEndingDate = (floc) => {
    setFlocToClear(floc);
    setIsClearDialogOpen(true);
  };

  const confirmClearEndingDate = async () => {
    if (!clearDescription.trim()) {
      toast.error("Please provide a description for clearing the ending date");
      return;
    }

    try {
      // Note: You'll need to create this API endpoint
      const response = await fetch(`/api/floc/clearEndingDate`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          req_object: {
            floc_id: flocToClear.floc_id,
            clear_description: clearDescription.trim(),
          },
        }),
      });

      const result = await response.json();

      if (result.response_status === "success") {
        toast.success("Ending date cleared successfully");
        setIsClearDialogOpen(false);
        setClearDescription("");
        setFlocToClear(null);
        fetchFlocs();
      } else {
        toast.error(result.response_message || "Failed to clear ending date");
      }
    } catch (error) {
      console.error("Error clearing ending date:", error);
      toast.error("Failed to clear ending date");
    }
  };

  const onSubmit = async (data) => {
    // Validate stackholders total percentage
    const totalPercentage = calculateTotalPercentage();
    if (totalPercentage !== 100) {
      toast.error(`Stackholders percentage must total 100%. Current total: ${totalPercentage}%`);
      return;
    }

    // Validate at least one stackholder
    const validStackholders = data.stackholders.filter(sh => sh.acc_id);
    if (validStackholders.length === 0) {
      toast.error("At least one stackholder is required");
      return;
    }

    // Validate dates
    if (data.ending_date && new Date(data.starting_date) > new Date(data.ending_date)) {
      toast.error("Ending date must be after starting date");
      return;
    }

    const payload = {
      req_object: {
        farm_id: parseInt(data.farm_id),
        starting_date: data.starting_date,
        ending_date: data.ending_date || null,
        stackholders: validStackholders.map(sh => ({
          acc_id: parseInt(sh.acc_id),
          percentage: parseFloat(sh.percentage),
        })),
        ...(isEditMode && { floc_id: editingFlocId }),
      },
    };

    try {
      // Note: You'll need to create this API endpoint
      const url = "/api/floc";
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
          isEditMode ? "Floc updated successfully" : "Floc created successfully"
        );
        reset({
          prounit_id: "",
          starting_date: "",
          ending_date: "",
          stackholders: [{ acc_id: "", percentage: "" }],
        });
        setIsEditMode(false);
        setEditingFlocId(null);
        fetchFlocs();
      } else {
        toast.error(result.response_message || "Failed to save floc");
      }
    } catch (error) {
      console.error("Error saving floc:", error);
      toast.error("Failed to save floc");
    }
  };

  const handleCreateNew = () => {
    setIsEditMode(false);
    setEditingFlocId(null);
    reset({
      farm_id: "",
      starting_date: "",
      ending_date: "",
      stackholders: [{ acc_id: "", percentage: "" }],
    });
    document.getElementById("floc-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEdit = (floc) => {
    setIsEditMode(true);
    setEditingFlocId(floc.floc_id);
    
    // Parse stackholders (assuming they're stored as JSON or array)
    const stackholdersData = floc.stackholders 
      ? (typeof floc.stackholders === 'string' 
          ? JSON.parse(floc.stackholders) 
          : floc.stackholders)
      : [{ acc_id: "", percentage: "" }];

    reset({
      farm_id: floc.farm_id?.toString() || "",
      starting_date: floc.starting_date ? new Date(floc.starting_date).toISOString().split('T')[0] : "",
      ending_date: floc.ending_date ? new Date(floc.ending_date).toISOString().split('T')[0] : "",
      stackholders: stackholdersData.length > 0 
        ? stackholdersData.map(sh => ({ 
            acc_id: sh.acc_id?.toString() || "", 
            percentage: sh.percentage?.toString() || "" 
          }))
        : [{ acc_id: "", percentage: "" }],
    });
    document.getElementById("floc-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = async (flocId) => {
    if (!confirm("Are you sure you want to delete this floc?")) {
      return;
    }

    try {
      const response = await fetch(`/api/floc?floc_id=${flocId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.response_status === "success") {
        toast.success("Floc deleted successfully");
        fetchFlocs();
      } else {
        toast.error(result.response_message || "Failed to delete floc");
      }
    } catch (error) {
      console.error("Error deleting floc:", error);
      toast.error("Failed to delete floc");
    }
  };

  // Filter flocs
  const filteredFlocs = flocs.filter((floc) => {
    const matchesSearch = searchQuery === "" || 
      floc.farm?.farm_nam?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farms.find(f => f.farm_id === floc.farm_id)?.farm_nam?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUnit = filterUnit === "all" || 
      floc.farm_id?.toString() === filterUnit;

    const matchesStartDate = filterStartDate === "" ||
      (floc.starting_date && new Date(floc.starting_date).toISOString().split('T')[0] === filterStartDate);

    const matchesEndDate = filterEndDate === "" ||
      (floc.ending_date && new Date(floc.ending_date).toISOString().split('T')[0] === filterEndDate);

    return matchesSearch && matchesUnit && matchesStartDate && matchesEndDate;
  });

  const totalPercentage = calculateTotalPercentage();
  const isPercentageValid = totalPercentage === 100;

  return (
    <div className="p-6 space-y-6">

      {/* Form Section */}
      <Card className={"max-w-4xl mx-auto"}>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="floc-form">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Farm Selection */}
              <div className="space-y-2">
                <Label htmlFor="farm_id">Farm *</Label>
                <Controller
                  name="farm_id"
                  control={control}
                  rules={{ required: "Farm is required" }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={availableFarms.length === 0 && !isEditMode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select farm" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFarms.map((farm) => (
                          <SelectItem key={farm.farm_id} value={farm.farm_id.toString()}>
                            {farm.farm_nam}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.farm_id && (
                  <p className="text-sm text-destructive">
                    {errors.farm_id.message}
                  </p>
                )}
                {availableFarms.length === 0 && !isEditMode && (
                  <p className="text-sm text-muted-foreground">
                    No available farms. All farms are currently in active flocs.
                  </p>
                )}
              </div>

              {/* Starting Date */}
              <div className="space-y-2">
                <Label htmlFor="starting_date">Starting Date *</Label>
                <Input
                  id="starting_date"
                  type="date"
                  {...register("starting_date", {
                    required: "Starting date is required",
                  })}
                />
                {errors.starting_date && (
                  <p className="text-sm text-destructive">
                    {errors.starting_date.message}
                  </p>
                )}
              </div>

              {/* Ending Date */}
              <div className="space-y-2">
                <Label htmlFor="ending_date">Ending Date</Label>
                <Input
                  id="ending_date"
                  type="date"
                  {...register("ending_date")}
                />
              </div>
            </div>

            {/* Stackholders */}
            <div className="space-y-2">
              <Label>Stackholders *</Label>
              {stackholders.map((stackholder, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Controller
                      name={`stackholders.${index}.acc_id`}
                      control={control}
                      rules={{ required: "Stackholder is required" }}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleStackholderChange(index, "acc_id", value);
                            // If only one stackholder, set to 100%
                            if (stackholders.length === 1) {
                              setValue("stackholders.0.percentage", "100");
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select stackholder" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem key={account.acc_id} value={account.acc_id.toString()}>
                                {account.account_nam}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Controller
                      name={`stackholders.${index}.percentage`}
                      control={control}
                      rules={{ 
                        required: "Percentage is required",
                        min: { value: 0, message: "Percentage must be >= 0" },
                        max: { value: 100, message: "Percentage must be <= 100" },
                      }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="%"
                          disabled={stackholders.length === 1}
                          onChange={(e) => {
                            field.onChange(e);
                            handleStackholderChange(index, "percentage", e.target.value);
                          }}
                        />
                      )}
                    />
                  </div>
                  {stackholders.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveStackholder(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={handleAddStackholder}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Stackholder
              </Button>

              {/* Percentage Total Alert */}
              <div className="mt-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Total Percentage:</span>
                  <span className={isPercentageValid ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                    {totalPercentage.toFixed(2)}%
                  </span>
                </div>
                {!isPercentageValid && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Stackholders percentage must total exactly 100%
                    </AlertDescription>
                  </Alert>
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
                  setEditingFlocId(null);
                }}
              >
                {isEditMode ? "Cancel Edit" : "Clear Form"}
              </Button>
              <Button type="submit" disabled={isSubmitting || !isPercentageValid}>
                {isSubmitting ? "Saving..." : isEditMode ? "Update Floc" : "Create Floc"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Flocs List */}
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
                    placeholder="Search flocs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Farm</Label>
                <Select value={filterUnit} onValueChange={setFilterUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Farms</SelectItem>
                    {farms.map((farm) => (
                      <SelectItem key={farm.farm_id} value={farm.farm_id.toString()}>
                        {farm.farm_nam}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredFlocs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No flocs found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farm</TableHead>
                    <TableHead>Starting Date</TableHead>
                    <TableHead>Ending Date</TableHead>
                    <TableHead>Stackholders</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={"max-h-[500px] overflow-y-auto"}>
                  {filteredFlocs.map((floc) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const endDate = floc.ending_date ? new Date(floc.ending_date) : null;
                    const isActive = !endDate || (endDate && endDate >= today);
                    
                    const stackholdersData = floc.stackholders 
                      ? (typeof floc.stackholders === 'string' 
                          ? JSON.parse(floc.stackholders) 
                          : floc.stackholders)
                      : [];

                    return (
                      <TableRow key={floc.floc_id}>
                        <TableCell className="font-medium">
                          {floc.farm?.farm_nam || farms.find(f => f.farm_id === floc.farm_id)?.farm_nam || "N/A"}
                        </TableCell>
                        <TableCell>
                          {floc.starting_date 
                            ? new Date(floc.starting_date).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {floc.ending_date 
                              ? new Date(floc.ending_date).toLocaleDateString()
                              : "Not set"}
                            {floc.ending_date && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleClearEndingDate(floc)}
                                className="h-6 px-2 text-xs"
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {stackholdersData.map((sh, idx) => {
                              const account = accounts.find(a => a.acc_id === sh.acc_id);
                              return (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {account?.account_nam || "N/A"} ({sh.percentage}%)
                                </Badge>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isActive ? "default" : "outline"}>
                            {isActive ? "Active" : "Ended"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(floc)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(floc.floc_id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clear Ending Date Dialog */}
      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Ending Date</DialogTitle>
            <DialogDescription>
              Please provide a description for clearing the ending date of this floc.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Enter reason for clearing ending date..."
                value={clearDescription}
                onChange={(e) => setClearDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsClearDialogOpen(false);
                setClearDescription("");
                setFlocToClear(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmClearEndingDate}
              disabled={!clearDescription.trim()}
            >
              Clear Ending Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

