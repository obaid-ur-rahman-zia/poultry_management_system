"use client";
import React, { useState, useEffect } from "react";
import { X, Save, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { set } from "zod";

function GenericEntityManager({ onClose, onSuccess, config }) {
  const [entities, setEntities] = useState([]);
  const [entityName, setEntityName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = async () => {
    try {
      setFetching(true);
      const response = await fetch(config.api.readAll);
      const result = await response.json();
      setEntities(result.response_result || []);
    } catch (err) {
      setError(`Error fetching ${config.entityNamePlural.toLowerCase()}`);
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!entityName.trim()) {
      setError(`${config.entityName} name is required`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        session_id: "some-session-id",
        user_id: "some-user-id",
        req_object: {
          [config.fields.name]: entityName.trim(),
        },
      };
      const response = await fetch(config.api.base, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setEntityName("");
        await fetchEntities();
        setCurrentPage(1);
        toast.success(`${config.entityName} created successfully`);
        onSuccess();
        setError("");
      } else {
        setError(
          result.response_message ||
            `Failed to create ${config.entityName.toLowerCase()}`
        );
      }
    } catch (err) {
      setError(`Error creating ${config.entityName.toLowerCase()}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (entity) => {
    setEditingEntity(entity[config.fields.id]);
    setEditValues({
      [config.fields.name]: entity[config.fields.name],
    });
  };

  const handleCancel = () => {
    setEditingEntity(null);
    setEditValues({});
  };

  const handleSave = async (entityId) => {
    try {
      setSavingEdit(true);
      const req_object = {
        [config.fields.id]: Number(entityId),
        [config.fields.name]: editValues[config.fields.name],
      };
      const payload = {
        session_id: "some-session-id",
        user_id: "some-user-id",
        req_object: req_object,
      };
      const response = await fetch(config.api.base, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setEntities((prev) =>
          prev.map((c) =>
            c[config.fields.id] === entityId ? { ...c, ...editValues } : c
          )
        );
        toast.success(`${config.entityName} updated successfully`);
        onSuccess();
      } else {
        toast.error(
          response.response_message ||
            `Failed to update ${config.entityName.toLowerCase()}`
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to update ${config.entityName.toLowerCase()}`);
    } finally {
      setEditingEntity(null);
      setSavingEdit(false);
    }
  };

  const renderEntityItem = (entity) => {
    return (
      <div key={entity[config.fields.id]}>
        <div
          className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors"
          style={{ marginLeft: `24px` }}
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-700 font-mono text-sm px-2 py-1 rounded">
              {entity[config.fields.id]}
            </div>

            <div className="flex-1">
              {editingEntity === entity[config.fields.id] ? (
                <input
                  type="text"
                  value={editValues[config.fields.name]}
                  onChange={(e) =>
                    setEditValues((prev) => ({
                      ...prev,
                      [config.fields.name]: e.target.value,
                    }))
                  }
                  className="border border-gray-300 rounded px-2 py-1 w-full"
                />
              ) : (
                <div className="font-medium text-gray-800">
                  {entity[config.fields.name]}
                </div>
              )}
            </div>

            {editingEntity === entity[config.fields.id] ? (
              !savingEdit ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => handleSave(entity[config.fields.id])}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-700"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <Loader2 size={18} className="animate-spin" />
              )
            ) : (
              <button
                type="button"
                className="text-blue-600 hover:text-blue-700"
                onClick={() => handleEditClick(entity)}
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Pagination calculations
  const totalPages = Math.ceil(entities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEntities = entities.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-1 rounded ${
            currentPage === i
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          } transition-colors`}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">{config.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Add New {config.entityName}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {config.entityName} Name *
                </label>
                <input
                  type="text"
                  value={entityName}
                  onChange={(e) => {
                    setEntityName(e.target.value);
                    setError("");
                  }}
                  placeholder={config.placeholder}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  disabled={loading || fetching}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || fetching || !entityName.trim()}
                className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save {config.entityName}
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Existing {config.entityNamePlural}
            </h3>

            {fetching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={32} className="animate-spin text-blue-600" />
              </div>
            ) : entities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No {config.entityNamePlural.toLowerCase()} found. Add your first
                one above.
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {currentEntities.map((entity) => renderEntityItem(entity))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to{" "}
                      {Math.min(endIndex, entities.length)} of {entities.length}{" "}
                      {config.entityNamePlural.toLowerCase()}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="p-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={20} />
                      </button>

                      <div className="flex gap-1">{renderPageNumbers()}</div>

                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="border-t p-6 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Configuration objects for each entity type
export const companyConfig = {
  title: "Product Company Management",
  entityName: "Company",
  entityNamePlural: "Companies",
  placeholder: "Enter company name",
  api: {
    base: "/api/company",
    readAll: "/api/company/readAll",
  },
  fields: {
    id: "company_id",
    name: "company_nam",
  },
};

export const productGroupConfig = {
  title: "Product Group Management",
  entityName: "Product Group",
  entityNamePlural: "Product Groups",
  placeholder: "Enter group name",
  api: {
    base: "/api/productGroup",
    readAll: "/api/productGroup/readAll",
  },
  fields: {
    id: "pgroup_id",
    name: "pgroup_nam",
  },
};

export const customerGroupConfig = {
  title: "Customer Group Management",
  entityName: "Customer Group",
  entityNamePlural: "Customer Groups",
  placeholder: "Enter group name",
  api: {
    base: "/api/customerGroup",
    readAll: "/api/customerGroup/readAll",
  },
  fields: {
    id: "cgroup_id",
    name: "cgroup_nam",
  },
};

export const unitConfig = {
  title: "Product Unit Management",
  entityName: "Unit",
  entityNamePlural: "Units",
  placeholder: "Enter unit name",
  api: {
    base: "/api/unit",
    readAll: "/api/unit/readAll",
  },
  fields: {
    id: "prounit_id",
    name: "prounit_nam",
  },
};
export const warehouseConfig = {
  title: "Warehouse Management",
  entityName: "Warehouse",
  entityNamePlural: "Warehouses",
  placeholder: "Enter warehouse name",
  api: {
    base: "/api/warehouse",
    readAll: "/api/warehouse/readAll",
  },
  fields: {
    id: "warehouse_id",
    name: "warehouse_nam",
  },
};
export const employeeDesignationConfig = {
  title: "Employee Designation Management",
  entityName: "Designation",
  entityNamePlural: "Designations",
  placeholder: "Enter designation name",
  api: {
    base: "/api/employeeDesignation",
    readAll: "/api/employeeDesignation/readAll",
  },
  fields: {
    id: "designation_id",
    name: "designation_nam",
  },
};
export const vehicleTypeConfig = {
  title: "Vehicle Type Management",
  entityName: "VType",
  entityNamePlural: "VTypes",
  placeholder: "Enter a vehicle type",
  api: {
    base: "/api/vehicleType",
    readAll: "/api/vehicleType/readAll",
  },
  fields: {
    id: "vehicle_type_id",
    name: "vehicle_type_nam",
  },
};

// Example usage:
// import GenericEntityManager, { companyConfig, productGroupConfig, unitConfig } from './GenericEntityManager';
//
// For Company: <GenericEntityManager onClose={handleClose} onSuccess={handleSuccess} config={companyConfig} />
// For Product Group: <GenericEntityManager onClose={handleClose} onSuccess={handleSuccess} config={productGroupConfig} />
// For Unit: <GenericEntityManager onClose={handleClose} onSuccess={handleSuccess} config={unitConfig} />

export default GenericEntityManager;
