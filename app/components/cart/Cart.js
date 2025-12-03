// components/Cart.js
import React, { useState } from "react";
import DeleteIcon from "@/assets/salesman/delete.png";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Cart = ({ cartItems, onRemove, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredCart = cartItems.filter((c) =>
    c?.product_nam?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // Only these fields are editable
  const editableFields = ["quantity", "bonus", "unit_price"];
  const calculateAmounts = (item, updatedField, newValue) => {
    // Create updated item with new value
    const updatedItem = { ...item };
    updatedItem[updatedField] = newValue;

    // Parse all necessary values - NOW IN UNITS
    const quantity = Number(updatedItem.quantity) || 0; // units, not packings
    const bonus = Number(updatedItem.bonus) || 0; // units, not packings
    const packing = Number(updatedItem.packing) || 1; // reference only
    const unitPrice = Number(updatedItem.unit_price) || 0; // editable unit price

    // Get configuration flags
    const isTaxApplied = updatedItem.isTaxApplied;
    const isDiscountApplied = updatedItem.isDiscountApplied;
    const isTaxPercentage = updatedItem.isTaxPercentage;
    const isDiscountedPercentage = updatedItem.isDiscountedPercentage;
    const isTaxAppliedCondition = updatedItem.isTaxAppliedCondition;

    // Get per-unit tax and discount values
    const discountValue = Number(updatedItem.discount_amount) || 0;
    const taxValue = Number(updatedItem.tax_amount) || 0;

    // Calculate total units (quantity + bonus are already in units)
    const totalUnits = quantity + bonus;
    updatedItem.total_unit = totalUnits;

    // Base amount = Unit Price × Quantity (in units)
    const baseAmount = unitPrice * quantity;
    updatedItem.prod_subtotal_amount = baseAmount;
    let netAmount = baseAmount;
    let totalDiscountAmount = 0;
    let totalTaxAmount = 0;

    // Calculate discount per unit, then multiply by quantity
    if (isDiscountApplied === 1 || discountValue > 0) {
      if (isDiscountedPercentage === 1) {
        // Discount is percentage of unit price
        totalDiscountAmount = ((unitPrice * discountValue) / 100) * quantity;
      } else {
        // Discount is fixed amount per unit
        totalDiscountAmount = discountValue * quantity;
      }
      netAmount -= totalDiscountAmount;
    }

    // Calculate tax based on condition
    if (isTaxApplied === 1 || taxValue > 0) {
      if (isTaxAppliedCondition === 1) {
        // Tax applied AFTER discount (on discounted unit price)
        const unitPriceAfterDiscount =
          isDiscountApplied === 1
            ? unitPrice -
              (isDiscountedPercentage === 1
                ? (unitPrice * discountValue) / 100
                : discountValue)
            : unitPrice;

        if (isTaxPercentage === 1) {
          // Tax is percentage of discounted unit price
          totalTaxAmount =
            ((unitPriceAfterDiscount * taxValue) / 100) * quantity;
        } else {
          // Tax is fixed amount per unit
          totalTaxAmount = taxValue * quantity;
        }
      } else {
        // Tax applied BEFORE discount (on original unit price)
        if (isTaxPercentage === 1) {
          // Tax is percentage of original unit price
          totalTaxAmount = ((unitPrice * taxValue) / 100) * quantity;
        } else {
          // Tax is fixed amount per unit
          totalTaxAmount = taxValue * quantity;
        }
      }
      netAmount += totalTaxAmount; // Tax is added to amount
    }

    // Update all calculated fields
    updatedItem.total_discount_amount = parseFloat(
      totalDiscountAmount.toFixed(2)
    );
    updatedItem.total_tax_amount = parseFloat(totalTaxAmount.toFixed(2));
    updatedItem.net_amount = parseFloat(netAmount.toFixed(2));

    return updatedItem;
  };

  const handleDoubleClick = (productId, field, currentValue) => {
    // Only allow editing of specified fields
    if (!editableFields.includes(field)) {
      return;
    }

    setEditingCell({ productId, field });
    setEditValue(currentValue);
  };

  const handleBlur = () => {
    if (editingCell && onUpdate) {
      const item = cartItems.find(
        (i) => i.product_id === editingCell.productId
      );

      if (item) {
        // Recalculate all dependent values
        const updatedItem = calculateAmounts(
          item,
          editingCell.field,
          editValue
        );
        onUpdate(editingCell.productId, updatedItem);
      }
    }

    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    }
  };

  const handleDeleteClick = (productId) => {
    setDeleteTarget(productId); // ✅ open confirmation dialog for this item
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      onRemove(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const isEditing = (productId, field) => {
    return editingCell?.productId === productId && editingCell?.field === field;
  };

  const renderCell = (item, field, value) => {
    const isEditable = editableFields.includes(field);

    if (isEditing(item.product_id, field)) {
      return (
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full p-1 border border-blue-500 rounded text-center"
          step={field === "sale_price" ? "0.01" : "1"}
          min="0"
        />
      );
    }
    return (
      <span
        onDoubleClick={() => handleDoubleClick(item.product_id, field, value)}
        className={`block p-1 rounded ${
          isEditable
            ? "cursor-pointer hover:bg-blue-50 hover:border hover:border-blue-200"
            : "bg-gray-50 text-gray-600"
        }`}
        title={isEditable ? "Double-click to edit" : "Calculated field"}
      >
        {value}
      </span>
    );
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search cart..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border rounded p-2 mb-4 w-full border-[#c5c0c0] text-[#a0a0a0] focus:border-[#c5c0c0] focus:outline-none focus:ring-0"
      />
      <div className="h-80 overflow-y-auto border-b-4 border-b-[#b1aaaa] mb-10">
        <table className="w-full border-collapse mt-2">
          <thead>
            <tr className="bg-[#F9FAFC] text-muted-foreground shadow-sm sticky top-0">
              <th className="p-2 ">#</th>
              <th className="p-2 ">Qty</th>
              <th className="p-2 ">Bonus</th>
              <th className="p-2 ">Item Name</th>
              <th className="p-2 ">Unit Price</th>
              <th className="p-2 ">T Units</th>
              <th className="p-2 ">Sub Total</th>
              <th className="p-2 ">T Disc</th>
              <th className="p-2 ">T Tax</th>
              <th className="p-2 ">Net Total</th>
              <th className="p-2 ">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCart.map((item, index) => (
              <tr
                key={item.product_id}
                className="border-1 border-white border-b-[#F4F4F4] h-15"
              >
                <td className="p-2 text-center">{index + 1}</td>
                <td className="p-2 text-center">
                  {renderCell(item, "quantity", item.quantity)}
                </td>
                <td className="p-2 text-center">
                  {renderCell(item, "bonus", item.bonus)}
                </td>
                <td className="p-2 text-center">{item.product_nam}</td>
                <td className="p-2 text-center">
                  {renderCell(item, "unit_price", item.unit_price)}
                </td>
                <td className="p-2 text-center">
                  {renderCell(item, "total_unit", item.total_unit)}
                </td>
                <td className="p-2 text-center">
                  {renderCell(
                    item,
                    "subtotal_amount",
                    item.prod_subtotal_amount
                  )}
                </td>
                <td className="p-2 text-center">
                  {" "}
                  {renderCell(
                    item,
                    "total_discount_amount",
                    item.total_discount_amount
                  )}
                </td>
                <td className="p-2 text-center">
                  {renderCell(item, "total_tax_amount", item.total_tax_amount)}
                </td>

                <td className="p-2 text-center">
                  {renderCell(item, "net_amount", item.net_amount)}
                </td>
                <td className="p-2 text-center">
                  <button
                    className="cursor-pointer"
                    type="button"
                    onClick={() => handleDeleteClick(item.product_id)}
                  >
                    <Image src={DeleteIcon} height={20} alt="delete" />
                  </button>
                </td>
              </tr>
            ))}

            {filteredCart.length === 0 && (
              <tr>
                <td
                  colSpan="9"
                  className="text-center p-2 items-center flex justify-center h-full w-full text-gray-500"
                >
                  Cart is empty
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* ✅ Shared AlertDialog for delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this item from your cart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Cart;
