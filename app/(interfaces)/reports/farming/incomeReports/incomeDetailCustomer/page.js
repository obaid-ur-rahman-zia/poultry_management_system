"use client";
import React, { useState, useEffect } from "react";
import { Printer, X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import Select from "react-select";
import { Controller, useForm } from "react-hook-form";
import { exportToCSV } from "@/app/utils/exportToCsv";

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
  menu: (provided) => ({
    ...provided,
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    border: "1px solid #E5E7EB",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#9CA3AF",
  }),
};

export default function PurchaseReportModal() {
  const { control, setValue, watch } = useForm();
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [purchaseData, setPurchaseData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [customer, setCustomer] = useState([]);
  const [product, setProduct] = useState([]);
  const selectedCustomer = watch("customer");
  const selectedProduct = watch("product");

  const purchasesPerPage = 10;

  useEffect(() => {
    fetchSupplier();
    fetchProduct();
  }, []);

  async function fetchProduct() {
    const data = await fetch("/api/product/readAll");
    const resData = await data.json();
    const { response_result } = resData;

    setProduct(response_result.products);
  }

  async function fetchSupplier() {
    const data = await fetch("/api/customer/readAll");
    const resData = await data.json();
    const { response_result } = resData;
    const customerResult = response_result.customer_data;
    setCustomer(customerResult);
  }

  const customerOptions = customer.map((c) => ({
    value: c.acc_id,
    label: c.account_nam,
  }));

  const productOptions = product.map((p) => ({
    value: p.product_id,
    label: p.product_title,
  }));

  const fetchReport = async () => {
    if (!selectedCustomer && !selectedProduct) {
      toast.error("Please select Customer or Product");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    setIsLoading(true);
    try {
      let res;
      if (selectedCustomer && !selectedProduct) {
        res = await fetch(
          `/api/unitSale/read/readReportDetail?start_dat=${startDate}&end_dat=${endDate}&customer_id=${selectedCustomer}`
        );
      } else if (!selectedCustomer && selectedProduct) {
        res = await fetch(
          `/api/unitSale/read/readReportDetail?start_dat=${startDate}&end_dat=${endDate}&product_id=${selectedProduct}`
        );
      } else {
        res = await fetch(
          `/api/unitSale/read/readReportDetail?start_dat=${startDate}&end_dat=${endDate}&customer_id=${selectedCustomer}&product_id=${selectedProduct}`
        );
      }
      const data = await res.json();
      setPurchaseData(data.response_result);
      setIsOpen(true);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to fetch report");
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastPurchase = currentPage * purchasesPerPage;
  const indexOfFirstPurchase = indexOfLastPurchase - purchasesPerPage;
  const currentPurchases = purchaseData.slice(
    indexOfFirstPurchase,
    indexOfLastPurchase
  );
  const totalPages = Math.ceil(purchaseData.length / purchasesPerPage);

  const handleExport = () => {
    if (!currentPurchases.length) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Income ID",
      "Floc ID",
      "Income Date",
      "Customer Name",
      "Customer Contact",
      "Product",
      "Price",
      "Farm Rate",
      "Sale Rate",
      "Quantity",
      "Discount",
      "Tax",
      "Line Total",
    ];

    const rows = currentPurchases.map((purchase) => [
      purchase.sale_id,
      purchase.floc_id,
      new Date(purchase.sale_date).toLocaleDateString(),
      purchase.customer.account_nam,
      purchase.customer.account_contact || "N/A",
      purchase.product.product_title,
      Number(purchase.price).toFixed(2),
      Number(purchase.farm_rate).toFixed(2),
      Number(purchase.sale_rate).toFixed(2),
      purchase.quantity,
      `${Number(purchase.discount_value || 0).toFixed(2)} ${
        purchase.discount_type || ""
      }`,
      `${Number(purchase.tax_value || 0).toFixed(2)} ${
        purchase.tax_type || ""
      }`,
      Number(purchase.total).toFixed(2),
    ]);

    exportToCSV(
      `Unit_Income_Report_${startDate}_to_${endDate}.csv`,
      headers,
      rows
    );
  };

  return (
    <div>
      {/* Card to trigger report */}
      <div className="group relative bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-500 transition-colors duration-300">
              <FileText className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 ">
            Unit Income Report
          </h3>

          <h1 className="text-sm font-bold text-gray-900 mb-4">
            Customer/Product Wise
          </h1>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Customer
              </label>
              <Controller
                name="customer"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={customerOptions}
                    placeholder="Select Customer..."
                    value={
                      selectedCustomer
                        ? customerOptions.find(
                            (o) => o.value === selectedCustomer
                          )
                        : null
                    }
                    isSearchable
                    styles={selectStyles}
                    className="w-full text-sm"
                    onChange={(opt) => {
                      field.onChange(opt.value);
                    }}
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Product
              </label>
              <Controller
                name="product"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={productOptions}
                    placeholder="Select Product..."
                    value={
                      selectedProduct
                        ? productOptions.find(
                            (o) => o.value === selectedProduct
                          )
                        : null
                    }
                    isSearchable
                    styles={selectStyles}
                    className="w-full text-sm"
                    onChange={(opt) => {
                      field.onChange(opt.value);
                    }}
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setValue("customer", "");
                setValue("product", "");
              }}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
            <button
              onClick={fetchReport}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "View Report"}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[100vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-end p-1 border-b">
              <div className="flex gap-1">
                <button
                  onClick={handleExport}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  title="Export CSV"
                >
                  Export
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {/* Report Header */}
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Unit Income Report
                </h1>
                <p className="text-gray-600 text-sm">
                  From:{" "}
                  <span className="font-semibold">
                    {new Date(startDate).toLocaleDateString()}
                  </span>{" "}
                  To:{" "}
                  <span className="font-semibold">
                    {new Date(endDate).toLocaleDateString()}
                  </span>
                </p>
              </div>

              {/* Purchase Tables */}
              {currentPurchases.map((purchase) => {
                return (
                  <div
                    key={purchase.sale_id}
                    className="mb-8 border border-gray-300 rounded-lg p-4"
                  >
                    {/* Purchase Info */}
                    <div className="mb-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <div>
                          <span className="font-semibold">Income ID: </span>
                          <span>{purchase.sale_id}</span>
                          <span className="ml-6 font-semibold">Floc ID: </span>
                          <span>{purchase.floc_id}</span>
                        </div>
                        <div>
                          <span className="font-semibold">Income Date: </span>
                          <span>
                            {new Date(purchase.sale_date).toLocaleDateString()}
                          </span>
                          <span className="ml-6 font-semibold">Customer: </span>
                          <span>{purchase.customer.account_nam}</span>
                          <span>
                            {" "}
                            ({purchase.customer.account_contact || "N/A"})
                          </span>
                        </div>
                      </div>
                      <div className="text-sm"></div>
                    </div>

                    {/* Products Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <th className="px-2 py-2 text-left font-bold text-gray-700 border border-gray-300">
                              Product Name
                            </th>
                            <th className="px-2 py-2 text-right font-bold text-gray-700 border border-gray-300">
                              Price
                            </th>
                            <th className="px-2 py-2 text-right font-bold text-gray-700 border border-gray-300">
                              Farm Rate
                            </th>
                            <th className="px-2 py-2 text-right font-bold text-gray-700 border border-gray-300">
                              Sale Rate
                            </th>
                            <th className="px-2 py-2 text-right font-bold text-gray-700 border border-gray-300">
                              Qty
                            </th>
                            <th className="px-2 py-2 text-right font-bold text-gray-700 border border-gray-300">
                              Disc
                            </th>
                            <th className="px-2 py-2 text-right font-bold text-gray-700 border border-gray-300">
                              Tax
                            </th>
                            <th className="px-2 py-2 text-right font-bold text-gray-700 border border-gray-300">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            key={purchase.sale_id}
                            className="border-b border-gray-200 hover:bg-gray-50"
                          >
                            <td className="px-2 py-2 border border-gray-300">
                              {purchase.product.product_title}
                            </td>
                            <td className="px-2 py-2 text-right border border-gray-300">
                              {Number(purchase.price).toFixed(2)}
                            </td>

                            <td className="px-2 py-2 text-right border border-gray-300">
                              {Number(purchase.farm_rate).toFixed(2)}
                            </td>

                            <td className="px-2 py-2 text-right border border-gray-300">
                              {Number(purchase.sale_rate).toFixed(2)}
                            </td>
                            <td className="px-2 py-2 text-right border border-gray-300">
                              {purchase.quantity}
                            </td>
                            <td className="px-2 py-2 text-right border border-gray-300">
                              {Number(purchase.discount_value || 0).toFixed(2) +
                                " " +
                                purchase.discount_type}
                            </td>
                            <td className="px-2 py-2 text-right border border-gray-300">
                              {Number(purchase.tax_value || 0).toFixed(2) +
                                " " +
                                purchase.tax_type}
                            </td>
                            <td className="px-2 py-2 text-right font-medium border border-gray-300">
                              {Number(purchase.total).toFixed(2)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer with Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-6 border-t">
                <div className="text-sm text-gray-600">
                  Showing {indexOfFirstPurchase + 1} to{" "}
                  {Math.min(indexOfLastPurchase, purchaseData.length)} of{" "}
                  {purchaseData.length} purchases
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="px-4 py-1 bg-orange-500 text-white rounded-lg font-medium">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
