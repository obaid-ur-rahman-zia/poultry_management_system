import React from "react";

/**
 * Reusable CNIC Input Component
 * Handles Pakistani CNIC format validation and auto-formatting
 *
 * @param {Object} props
 * @param {string} props.name - Field name for form registration (e.g., "customerCNIC", "supplierCNIC")
 * @param {string} props.label - Display label (e.g., "Customer CNIC", "Supplier CNIC")
 * @param {Function} props.register - React Hook Form register function
 * @param {Object} props.errors - React Hook Form errors object
 * @param {boolean} props.required - Whether field is required (default: true)
 * @param {string} props.placeholder - Input placeholder (default: "XXXXX-XXXXXXX-X")
 * @param {string} props.className - Additional container classes
 */
const CNICInput = ({
  name,
  label,
  register,
  errors,
  required = true,
  placeholder = "XXXXX-XXXXXXX-X",
  className = "space-y-2",
}) => {
  // Auto-format CNIC as user types
  const formatCNIC = (value) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(
      12,
      13
    )}`;
  };

  const handleInput = (e) => {
    const formatted = formatCNIC(e.target.value);
    e.target.value = formatted;
  };

  // Validation rules
  const validationRules = {
    ...(required && { required: `${label} is required` }),
    pattern: {
      value: /^\d{5}-\d{7}-\d{1}$/,
      message: "CNIC must be in format: XXXXX-XXXXXXX-X",
    },
    validate: {
      validLength: (value) => {
        if (!value && !required) return true;
        const digits = value.replace(/-/g, "");
        return digits.length === 13 || "CNIC must have exactly 13 digits";
      },
    },
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          {...register(name, validationRules)}
          onInput={handleInput}
          className="w-full h-9 pl-4 pr-4 border-2 border-gray-200 rounded-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all duration-200"
          placeholder={placeholder}
          maxLength={15}
          type="text"
        />
      </div>
      {errors[name] && (
        <span className="text-red-500 text-sm">{errors[name].message}</span>
      )}
    </div>
  );
};

export default CNICInput;
