"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { Plus, Search, Edit2, Trash2, X, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
      stackholders: [{ stackholder_id: "", percentage: "" }],
    },
  });

  const [flocs, setFlocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingFlocId, setEditingFlocId] = useState(null);
  const [farms, setFarms] = useState([]);
  const [stackholders, setStackholders] = useState([]);
  const [availableFarms, setAvailableFarms] = useState([]);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [clearDescription, setClearDescription] = useState("");
  const [flocToClear, setFlocToClear] = useState(null);
  const [shouldClearEndingDate, setShouldClearEndingDate] = useState(false);
  const [activeFlocForSelectedFarm, setActiveFlocForSelectedFarm] = useState(null);
  const [isCreateStackholderOpen, setIsCreateStackholderOpen] = useState(false);
  const [creatingIndex, setCreatingIndex] = useState(null);
  const [isCreatingStackholder, setIsCreatingStackholder] = useState(false);
  const [newStackholder, setNewStackholder] = useState({
    stackholder_nam: "",
    stackholder_cnic: "",
    stackholder_contact: "",
    stackholder_address: "",
  });
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUnit, setFilterUnit] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const formStackholders = watch("stackholders") || [{ stackholder_id: "", percentage: "" }];
  const selectedFarm = watch("farm_id");

  useEffect(() => {
    fetchFarms();
    fetchStackholders();
    fetchFlocs();
  }, []);

  useEffect(() => {
    updateAvailableFarms();
  }, [flocs, selectedFarm, isEditMode, editingFlocId]);

  // Check if selected farm has an active floc
  useEffect(() => {
    if (selectedFarm) {
      const farmId = parseInt(selectedFarm);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const activeFloc = flocs.find(floc => {
        const flocProunitId = floc.prounit_id || floc.farm_id;
        if (flocProunitId !== farmId) return false;
        
        // Check if floc is active (no ending_date or ending_date is in the future, not today or past)
        if (!floc.ending_date) return true;
        const endDate = new Date(floc.ending_date);
        endDate.setHours(0, 0, 0, 0);
        // Floc is active if ending_date is in the future (after today)
        return endDate > today;
      });
      
      setActiveFlocForSelectedFarm(activeFloc || null);
      if (!activeFloc) {
        setShouldClearEndingDate(false);
        setClearDescription("");
      }
    } else {
      setActiveFlocForSelectedFarm(null);
      setShouldClearEndingDate(false);
      setClearDescription("");
    }
  }, [selectedFarm, flocs]);

  const fetchFarms = async () => {
    try {
      const response = await fetch("/api/unit/readAll");
      const result = await response.json();
      
      if (result.response_status === "success") {
        const farmsData = result.response_result?.data || result.response_result || [];
        setFarms(farmsData);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  const fetchStackholders = async () => {
    try {
      const response = await fetch("/api/stackholder");
      const result = await response.json();
      
      if (result.response_status === "success") {
        const stackholdersData = result.response_result?.data || result.response_result || [];
        setStackholders(stackholdersData);
      }
    } catch (error) {
      console.error("Error fetching stackholders:", error);
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
        // Farm is unavailable if it has an ending_date that is in the future (after today)
        // If ending_date is today or in the past, the farm is available
        if (floc.ending_date) {
          const endDate = new Date(floc.ending_date);
          endDate.setHours(0, 0, 0, 0);
          // Farm is unavailable only if ending_date is in the future (after today)
          return endDate > today;
        }
        // If no ending_date, farm is unavailable (active floc)
        return true;
      })
      .map(floc => floc.prounit_id || floc.farm_id);

    const available = farms.filter(farm => {
      const farmId = farm.prounit_id || farm.farm_id;
      // If editing, allow the currently selected farm
      if (isEditMode && editingFlocId && (flocs.find(f => f.floc_id === editingFlocId)?.prounit_id || flocs.find(f => f.floc_id === editingFlocId)?.farm_id) === farmId) {
        return true;
      }
      return !unavailableFarmIds.includes(farmId);
    });

    setAvailableFarms(available);
  };

  const handleAddStackholder = () => {
    const currentStackholders = watch("stackholders") || [];
    setValue("stackholders", [...currentStackholders, { stackholder_id: "", percentage: "" }]);
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
    if (currentStackholders.length === 1 && field === "stackholder_id" && value) {
      setValue("stackholders.0.percentage", "100");
    }
  };

  const openCreateStackholder = (index) => {
    setCreatingIndex(index);
    setIsCreateStackholderOpen(true);
  };

  const submitCreateStackholder = async () => {
    if (!newStackholder.stackholder_nam.trim()) {
      toast.error("Stackholder name is required");
      return;
    }
    setIsCreatingStackholder(true);
    try {
      const response = await fetch("/api/stackholder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ req_object: newStackholder }),
      });
      const result = await response.json();
      if (result.response_status === "success") {
        const created = result.response_result || {};
        const createdId = created.stackholder_id?.toString();
        setIsCreateStackholderOpen(false);
        setNewStackholder({
          stackholder_nam: "",
          stackholder_cnic: "",
          stackholder_contact: "",
          stackholder_address: "",
        });
        await fetchStackholders();
        if (creatingIndex !== null && createdId) {
          setValue(`stackholders.${creatingIndex}.stackholder_id`, createdId);
          const rows = watch("stackholders") || [];
          if (rows.length === 1) {
            setValue("stackholders.0.percentage", "100");
          }
        }
        toast.success("Stackholder created successfully");
      } else {
        toast.error(result.response_message || "Failed to create stackholder");
      }
    } catch (error) {
      console.error("Error creating stackholder:", error);
      toast.error("Failed to create stackholder");
    } finally {
      setIsCreatingStackholder(false);
    }
  };

  const calculateTotalPercentage = () => {
    const percentages = formStackholders
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

  const handleConfirmClear = async () => {
    if (!clearDescription.trim()) {
      toast.error("Please provide a description for clearing the ending date");
      return;
    }

    if (!activeFlocForSelectedFarm) {
      toast.error("No active floc found to clear");
      return;
    }

    try {
      const response = await fetch(`/api/floc/clearEndingDate`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          req_object: {
            floc_id: activeFlocForSelectedFarm.floc_id,
            clear_description: clearDescription.trim(),
          },
        }),
      });

      const result = await response.json();

      if (result.response_status === "success") {
        toast.success("Ending date cleared successfully. Farm is now available for a new floc.");
        await fetchFlocs();
        setClearDescription("");
        setShouldClearEndingDate(false);
        setActiveFlocForSelectedFarm(null);
        // Refresh available farms - the cleared farm should now be available
        setTimeout(() => {
          updateAvailableFarms();
        }, 100);
      } else {
        toast.error(result.response_message || "Failed to clear ending date");
      }
    } catch (error) {
      console.error("Error clearing ending date:", error);
      toast.error("Failed to clear ending date");
    }
  };

  const onSubmit = async (data) => {
    // If clearing ending date is enabled but not yet confirmed, prevent form submission
    if (shouldClearEndingDate && activeFlocForSelectedFarm) {
      toast.error("Please confirm clearing the ending date first");
      return;
    }

    // Validate stackholders total percentage
    const totalPercentage = calculateTotalPercentage();
    if (totalPercentage !== 100) {
      toast.error(`Stackholders percentage must total 100%. Current total: ${totalPercentage}%`);
      return;
    }

    // Validate at least one stackholder
    const validStackholders = data.stackholders.filter(sh => sh.stackholder_id);
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
        prounit_id: parseInt(data.farm_id), // farm_id from form maps to prounit_id
        starting_date: data.starting_date,
        ending_date: data.ending_date || null,
        stackholders: validStackholders.map(sh => ({
          stackholder_id: parseInt(sh.stackholder_id),
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
          farm_id: "",
          starting_date: "",
          ending_date: "",
          stackholders: [{ stackholder_id: "", percentage: "" }],
        });
        setIsEditMode(false);
        setEditingFlocId(null);
        setShouldClearEndingDate(false);
        setClearDescription("");
        setActiveFlocForSelectedFarm(null);
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
    setShouldClearEndingDate(false);
    setClearDescription("");
    setActiveFlocForSelectedFarm(null);
    reset({
      farm_id: "",
      starting_date: "",
      ending_date: "",
      stackholders: [{ stackholder_id: "", percentage: "" }],
    });
    document.getElementById("floc-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEdit = (floc) => {
    setIsEditMode(true);
    setEditingFlocId(floc.floc_id);
    
    // Get stackholders from floc_stackholders relation
    const stackholdersData = floc.floc_stackholders && Array.isArray(floc.floc_stackholders)
      ? floc.floc_stackholders.map(fs => ({
          stackholder_id: fs.stackholder?.stackholder_id?.toString() || "",
          percentage: fs.percentage?.toString() || ""
        }))
      : [{ stackholder_id: "", percentage: "" }];

    const prounitId = (floc.prounit_id || floc.farm_id)?.toString() || "";

    reset({
      farm_id: prounitId,
      starting_date: floc.starting_date ? new Date(floc.starting_date).toISOString().split('T')[0] : "",
      ending_date: floc.ending_date ? new Date(floc.ending_date).toISOString().split('T')[0] : "",
      stackholders: stackholdersData.length > 0 
        ? stackholdersData
        : [{ stackholder_id: "", percentage: "" }],
    });
    
    // Update available farms after setting edit mode to ensure current unit is included
    setTimeout(() => {
      updateAvailableFarms();
    }, 0);
    
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
    const flocProunitId = floc.prounit_id || floc.farm_id;
    const matchesSearch = searchQuery === "" || 
      floc.unit?.prounit_nam?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farms.find(f => (f.prounit_id || f.farm_id) === flocProunitId)?.prounit_nam?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farms.find(f => (f.prounit_id || f.farm_id) === flocProunitId)?.farm_nam?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUnit = filterUnit === "all" || 
      (floc.prounit_id || floc.farm_id)?.toString() === filterUnit;

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
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Trigger useEffect to check for active floc
                        const farmId = parseInt(value);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const activeFloc = flocs.find(floc => {
                          const flocProunitId = floc.prounit_id || floc.farm_id;
                          if (flocProunitId !== farmId) return false;
                          if (!floc.ending_date) return true;
                          const endDate = new Date(floc.ending_date);
                          endDate.setHours(0, 0, 0, 0);
                          return endDate >= today;
                        });
                        if (activeFloc) {
                          setActiveFlocForSelectedFarm(activeFloc);
                        } else {
                          setActiveFlocForSelectedFarm(null);
                          setShouldClearEndingDate(false);
                          setClearDescription("");
                        }
                      }}
                      disabled={availableFarms.length === 0 && !isEditMode && farms.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select farm" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFarms.map((farm) => (
                          <SelectItem key={farm.prounit_id || farm.farm_id} value={(farm.prounit_id || farm.farm_id).toString()}>
                            {farm.prounit_nam || farm.farm_nam}
                          </SelectItem>
                        ))}
                        {/* Show unavailable farms (with active flocs) when no available farms */}
                        {availableFarms.length === 0 && !isEditMode && farms.length > 0 && farms.map((farm) => {
                          const farmId = farm.prounit_id || farm.farm_id;
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const activeFloc = flocs.find(floc => {
                            const flocProunitId = floc.prounit_id || floc.farm_id;
                            if (flocProunitId !== farmId) return false;
                            if (!floc.ending_date) return true;
                            const endDate = new Date(floc.ending_date);
                            endDate.setHours(0, 0, 0, 0);
                            // Floc is active if ending_date is in the future (after today)
                            return endDate > today;
                          });
                          if (activeFloc) {
                            return (
                              <SelectItem key={farmId} value={farmId.toString()}>
                                {farm.prounit_nam || farm.farm_nam} (Active - can clear)
                              </SelectItem>
                            );
                          }
                          return null;
                        })}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.farm_id && (
                  <p className="text-sm text-destructive">
                    {errors.farm_id.message}
                  </p>
                )}
                {availableFarms.length === 0 && !isEditMode && farms.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      No available farms. All farms are currently in active flocs.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Select a farm from the list below to clear its ending date and make it available.
                    </p>
                    <Select
                      value={selectedFarm}
                      onValueChange={(value) => {
                        setValue("farm_id", value);
                        const farmId = parseInt(value);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const activeFloc = flocs.find(floc => {
                          const flocProunitId = floc.prounit_id || floc.farm_id;
                          if (flocProunitId !== farmId) return false;
                          if (!floc.ending_date) return true;
                          const endDate = new Date(floc.ending_date);
                          endDate.setHours(0, 0, 0, 0);
                          return endDate >= today;
                        });
                        if (activeFloc) {
                          setActiveFlocForSelectedFarm(activeFloc);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select farm to clear ending date" />
                      </SelectTrigger>
                      <SelectContent>
                        {farms.map((farm) => (
                          <SelectItem key={farm.prounit_id || farm.farm_id} value={(farm.prounit_id || farm.farm_id).toString()}>
                            {farm.prounit_nam || farm.farm_nam}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                  disabled={shouldClearEndingDate}
                />
                {activeFlocForSelectedFarm && !isEditMode && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      id="clear-ending-date"
                      checked={shouldClearEndingDate}
                      onCheckedChange={setShouldClearEndingDate}
                    />
                    <Label htmlFor="clear-ending-date" className="text-sm cursor-pointer">
                      Clear ending date of active floc (will set to today)
                    </Label>
                  </div>
                )}
                {shouldClearEndingDate && (
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="clear_description">Clear Description *</Label>
                    <Textarea
                      id="clear_description"
                      placeholder="Enter reason for clearing ending date"
                      value={clearDescription}
                      onChange={(e) => setClearDescription(e.target.value)}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="default"
                        onClick={handleConfirmClear}
                        disabled={!clearDescription.trim()}
                      >
                        Confirm Clear
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShouldClearEndingDate(false);
                          setClearDescription("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stackholders */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
              <Label>Stackholders *</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddStackholder}
                  className=""
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              {formStackholders.map((_, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Controller
                      name={`stackholders.${index}.stackholder_id`}
                      control={control}
                      rules={{ required: "Stackholder is required" }}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            if (value !== "__create__" && (formStackholders || []).some((sh, i) => i !== index && sh.stackholder_id === value)) {
                              toast.error("This stackholder is already selected");
                              return;
                            }
                            if (value === "__create__") {
                              openCreateStackholder(index);
                              return;
                            }
                            field.onChange(value);
                            handleStackholderChange(index, "stackholder_id", value);
                            if (formStackholders.length === 1) {
                              setValue("stackholders.0.percentage", "100");
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select stackholder" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__create__">
                              Add New Stackholder
                            </SelectItem>
                            {stackholders.map((holder) => (
                              <SelectItem
                                key={holder.stackholder_id}
                                value={holder.stackholder_id.toString()}
                                disabled={(formStackholders || [])
                                  .map((sh) => sh.stackholder_id)
                                  .filter(Boolean)
                                  .includes(holder.stackholder_id?.toString()) && field.value !== holder.stackholder_id?.toString()}
                              >
                                {holder.stackholder_nam}
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
                          disabled={formStackholders.length === 1}
                          onChange={(e) => {
                            field.onChange(e);
                            handleStackholderChange(index, "percentage", e.target.value);
                          }}
                        />
                      )}
                    />
                  </div>
                  {formStackholders.length > 1 && (
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
              
              {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddStackholder}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stackholder
                </Button> */}
                {/* <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreatingIndex(null);
                    setIsCreateStackholderOpen(true);
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Stackholder
                </Button> */}
              {/* </div> */}

              {/* Percentage Total Alert */}
              <div className="mt-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Total Percentage:</span>
                  <span className={isPercentageValid ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                    {totalPercentage.toFixed(2)}%
                  </span>
                </div>
                {/* {!isPercentageValid && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Stackholders percentage must total exactly 100%
                    </AlertDescription>
                  </Alert>
                )} */}
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
                  setShouldClearEndingDate(false);
                  setClearDescription("");
                  setActiveFlocForSelectedFarm(null);
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
                      <SelectItem key={farm.prounit_id || farm.farm_id} value={(farm.prounit_id || farm.farm_id).toString()}>
                        {farm.prounit_nam || farm.farm_nam}
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
                    
                    const stackholdersData = floc.floc_stackholders && Array.isArray(floc.floc_stackholders)
                      ? floc.floc_stackholders
                      : [];

                    return (
                      <TableRow key={floc.floc_id}>
                        <TableCell className="font-medium">
                          {floc.unit?.prounit_nam || farms.find(f => (f.prounit_id || f.farm_id) === floc.prounit_id)?.prounit_nam || farms.find(f => (f.prounit_id || f.farm_id) === floc.prounit_id)?.farm_nam || "N/A"}
                        </TableCell>
                        <TableCell>
                          {floc.starting_date 
                            ? new Date(floc.starting_date).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {floc.ending_date 
                                ? new Date(floc.ending_date).toLocaleDateString()
                                : "Not set"}
                              {floc.ending_date && !floc.clear_description && (
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
                            {floc.clear_description && (
                              <p className="text-xs text-muted-foreground italic">
                                Cleared: {floc.clear_description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {stackholdersData.map((fs, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {fs.stackholder?.stackholder_nam || "N/A"} ({fs.percentage}%)
                              </Badge>
                            ))}
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

      <Dialog open={isCreateStackholderOpen} onOpenChange={setIsCreateStackholderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Stackholder</DialogTitle>
            <DialogDescription>
              Enter stackholder details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newStackholder.stackholder_nam}
                onChange={(e) => setNewStackholder({ ...newStackholder, stackholder_nam: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>CNIC</Label>
              <Input
                value={newStackholder.stackholder_cnic}
                onChange={(e) => setNewStackholder({ ...newStackholder, stackholder_cnic: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact</Label>
              <Input
                value={newStackholder.stackholder_contact}
                onChange={(e) => setNewStackholder({ ...newStackholder, stackholder_contact: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={newStackholder.stackholder_address}
                onChange={(e) => setNewStackholder({ ...newStackholder, stackholder_address: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateStackholderOpen(false);
                setNewStackholder({
                  stackholder_nam: "",
                  stackholder_cnic: "",
                  stackholder_contact: "",
                  stackholder_address: "",
                });
                setCreatingIndex(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={submitCreateStackholder} disabled={isCreatingStackholder || !newStackholder.stackholder_nam.trim()}>
              {isCreatingStackholder ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
