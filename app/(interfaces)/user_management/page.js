"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PlusIcon, Eye, Edit2, Search, X, Filter, RefreshCw, Trash2, UserPlus, ShieldAlert } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoadingIndicator from "@/app/components/loadingIndicator/loadingIndicator";
import Spinner from "@/app/components/Spinner/loadSpinner";
import Select from "react-select";
import useUnsavedWarning from "@/app/components/hooks/useUnsavedWarning";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

// Custom Select Styles
const selectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#6366F1" : "#E5E7EB",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(99, 102, 241, 0.1)" : "none",
    borderWidth: "2px",
    minHeight: "30px",
    "&:hover": {
      borderColor: "#6366F1",
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#6366F1"
      : state.isFocused
      ? "#F0F9FF"
      : "white",
    color: state.isSelected ? "white" : "#374151",
  }),
};

const roleOptions = [
  { value: "ADMIN", label: "Admin" },
  { value: "USER", label: "User" },
];

export default function UserManagement() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      user_nam: "",
      email: "",
      password: "",
      role: "USER",
      phone: "",
      address: "",
    },
  });

  const [isDirty, setIsDirty] = useState(false);
  useUnsavedWarning(isDirty);
  
  // State Management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showPassword, setShowPassword] = useState(false);
  const [companyEmailDomain, setCompanyEmailDomain] = useState("");

  // Check if user is SUPER_ADMIN
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const isUser = session?.user?.role === "USER";
  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    const subscription = watch(() => {
      setIsDirty(true);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    // Wait for session to load
    if (sessionStatus === "loading") return;
    
    // If USER role, redirect to unauthorized page
    if (sessionStatus === "authenticated" && isUser) {
      router.push("/unauthorized");
      return;
    }
    
    // Fetch users if user is SUPER_ADMIN or ADMIN
    if (sessionStatus === "authenticated" && (isSuperAdmin || isAdmin)) {
      fetchUsers();
    }
  }, [sessionStatus, isSuperAdmin, isAdmin, isUser, router, session]);

  useEffect(() => {
    fetchCompanyEmailDomain();
  }, []);

  const fetchCompanyEmailDomain = async () => {
    try {
      const response = await fetch("/api/config/companyEmailDomain");
      const result = await response.json();
      if (result.domain) {
        setCompanyEmailDomain(result.domain);
      }
    } catch (error) {
      console.error("Error fetching company email domain:", error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get current role from session
      const currentRole = session?.user?.role;
      
      // Pass excludeSuperAdmin parameter if user is ADMIN (not SUPER_ADMIN)
      const shouldExcludeSuperAdmin = currentRole === "ADMIN";
      const url = shouldExcludeSuperAdmin 
        ? "/api/user/readAll?excludeSuperAdmin=true" 
        : "/api/user/readAll";
      
      console.log("Fetching users with role:", currentRole, "URL:", url); // Debug log
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log("API Response:", result); // Debug log
      console.log("Users received:", result.response_result?.users); // Debug log
      
      if (result.response_status === "success") {
        const fetchedUsers = result.response_result?.users || [];
        // Additional client-side filter to ensure SUPER_ADMIN is not shown to ADMIN
        const filteredUsers = currentRole === "ADMIN" 
          ? fetchedUsers.filter(user => user.role !== "SUPER_ADMIN")
          : fetchedUsers;
        
        console.log("Filtered users:", filteredUsers); // Debug log
        setUsers(filteredUsers);
      } else {
        toast.error(result.response_message || "Failed to fetch users");
        console.error("API Error:", result);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsEditMode(false);
    setEditingUserId(null);
    reset({
      user_nam: "",
      email: "",
      password: "",
      role: "USER",
      phone: "",
      address: "",
    });
    setIsDialogOpen(true);
    setIsDirty(false);
  };

  const handleEdit = (user) => {
    setIsEditMode(true);
    setEditingUserId(user.user_id);
    
    // Extract username from email if company domain is set
    let emailUsername = user.email || "";
    if (companyEmailDomain && emailUsername.includes(`@${companyEmailDomain}`)) {
      emailUsername = emailUsername.replace(`@${companyEmailDomain}`, "");
    } else if (emailUsername.includes("@")) {
      // If it has a different domain, extract just the username part
      emailUsername = emailUsername.split("@")[0];
    }
    
    reset({
      user_nam: user.user_nam || "",
      email: emailUsername,
      password: "", // Don't pre-fill password
      role: user.role || "USER",
      phone: user.phone || "",
      address: user.address || "",
    });
    setIsDialogOpen(true);
    setIsDirty(false);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditMode(false);
    setEditingUserId(null);
    reset();
    setIsDirty(false);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Validation
      if (!data.user_nam || !data.email) {
        toast.error("Name and email are required");
        return;
      }

      if (!isEditMode && !data.password) {
        toast.error("Password is required for new users");
        return;
      }

      if (data.password && data.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }

      // Combine username with company domain
      const emailUsername = data.email.trim();
      if (!emailUsername) {
        toast.error("Email username is required");
        return;
      }

      // Build full email with domain
      const fullEmail = companyEmailDomain 
        ? `${emailUsername}@${companyEmailDomain}`
        : emailUsername; // Fallback if no domain is set

      const url = "/api/user";
      const method = isEditMode ? "PUT" : "POST";
      
      const payload = {
        req_object: {
          ...data,
          email: fullEmail, // Use the full email with domain
          ...(isEditMode && { user_id: editingUserId }),
          // Only include password if it's provided (for updates) or it's a new user
          ...(isEditMode && !data.password ? {} : { password: data.password }),
        },
      };

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
            ? "User updated successfully"
            : "User created successfully"
        );
        handleCloseDialog();
        fetchUsers();
        setIsDirty(false);
      } else {
        toast.error(result.response_message || "Operation failed");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    // Only SUPER_ADMIN can toggle user status
    if (!isSuperAdmin) {
      toast.error("Only SUPER_ADMIN can change user status");
      return;
    }

    try {
      const newStatus = user.status === 1 ? 0 : 1;
      const response = await fetch("/api/user/updateStatus", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          req_object: {
            user_id: user.user_id,
            status: newStatus,
          },
        }),
      });

      const result = await response.json();

      if (result.response_status === "success") {
        toast.success(
          `User ${newStatus === 1 ? "activated" : "deactivated"} successfully`
        );
        fetchUsers();
      } else {
        toast.error(result.response_message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update user status");
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.user_nam?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-500";
      case "ADMIN":
        return "bg-blue-500";
      case "USER":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // Show loading while checking session
  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  // Show unauthorized message if USER role
  if (sessionStatus === "authenticated" && isUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-4">
          You don't have permission to access this page.
        </p>
        <p className="text-sm text-gray-500">
          Only SUPER_ADMIN and ADMIN users can manage users.
        </p>
      </div>
    );
  }

  // If not authenticated, middleware will handle redirect
  if (sessionStatus === "unauthenticated") {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage system users and their roles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchUsers}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          {isSuperAdmin && (
            <Button
              onClick={handleCreateNew}
              className="flex items-center gap-2 "
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search users by name, email, or role..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">Items per page:</Label>
          <Select
            value={{ value: itemsPerPage, label: itemsPerPage.toString() }}
            onChange={(option) => {
              setItemsPerPage(option.value);
              setCurrentPage(1);
            }}
            options={[5, 10, 20, 50].map((num) => ({
              value: num,
              label: num.toString(),
            }))}
            styles={selectStyles}
            className="w-24"
          />
        </div>
      </div>

      {/* Users Table */}
      {loading && !users.length ? (
        <div className="flex justify-center items-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user, index) => {
                  // Calculate serial number based on current page and items per page
                  const serialNumber = startIndex + index + 1;
                  
                  return (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-medium">{serialNumber}</TableCell>
                      <TableCell>{user.user_nam}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                    <TableCell>
                      {/* Only SUPER_ADMIN can toggle status */}
                      {isSuperAdmin ? (
                        <Switch
                          checked={user.status === 1}
                          onCheckedChange={() => handleToggleStatus(user)}
                        />
                      ) : (
                        <Badge variant={user.status === 1 ? "default" : "secondary"}>
                          {user.status === 1 ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Only SUPER_ADMIN can edit users */}
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(user)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of{" "}
            {filteredUsers.length} users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-5xl min-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit User" : "Create New User"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update user information. Leave password empty to keep current password."
                : "Fill in the details to create a new user account."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user_nam">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="user_nam"
                  {...register("user_nam", { required: "Name is required" })}
                  placeholder="Enter full name"
                />
                {errors.user_nam && (
                  <p className="text-sm text-red-500">
                    {errors.user_nam.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-0">
                  <Input
                    id="email"
                    type="text"
                    {...register("email", {
                      required: "Email is required",
                      validate: (value) => {
                        const emailValue = value.trim();
                        if (!emailValue) {
                          return "Email username is required";
                        }
                        // Validate username format (no @ symbol allowed)
                        const usernamePattern = /^[A-Z0-9._%+-]+$/i;
                        if (!usernamePattern.test(emailValue)) {
                          return "Invalid username format";
                        }
                        return true;
                      },
                    })}
                    placeholder="username"
                    className="rounded-r-none border-r-0"
                  />
                  {companyEmailDomain && (
                    <Input
                      type="text"
                      value={`@${companyEmailDomain}`}
                      disabled
                      readOnly
                      className="rounded-l-none bg-gray-100 text-gray-600 cursor-not-allowed flex-shrink-0 border-l-0"
                      style={{ 
                        minWidth: `${Math.max(companyEmailDomain.length + 3, 10)}ch`,
                        maxWidth: `${companyEmailDomain.length + 3}ch`
                      }}
                    />
                  )}
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {!isEditMode && <span className="text-red-500">*</span>}
                  {isEditMode && (
                    <span className="text-gray-500 text-xs ml-2">
                      (Leave empty to keep current)
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                      required: !isEditMode ? "Password is required" : false,
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    placeholder={isEditMode ? "Enter new password" : "Enter password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">
                  Role <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="role"
                  control={control}
                  rules={{ required: "Role is required" }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      options={roleOptions}
                      value={roleOptions.find((opt) => opt.value === field.value)}
                      onChange={(option) => field.onChange(option.value)}
                      styles={selectStyles}
                      placeholder="Select role"
                    />
                  )}
                />
                {errors.role && (
                  <p className="text-sm text-red-500">{errors.role.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  {...register("address")}
                  placeholder="Enter address"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2" />
                    {isEditMode ? "Updating..." : "Creating..."}
                  </>
                ) : isEditMode ? (
                  "Update User"
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

