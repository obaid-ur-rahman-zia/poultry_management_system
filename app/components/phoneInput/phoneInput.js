import React from 'react';

/**
 * Reusable Phone Number Input Component
 * Handles Pakistani phone number format validation and auto-formatting
 * Supports both mobile (03XX-XXXXXXX) and landline (0XX-XXXXXXX) formats
 * 
 * @param {Object} props
 * @param {string} props.name - Field name for form registration (e.g., "customerPhone", "supplierPhone")
 * @param {string} props.label - Display label (e.g., "Customer Phone", "Supplier Phone")
 * @param {Function} props.register - React Hook Form register function
 * @param {Object} props.errors - React Hook Form errors object
 * @param {boolean} props.required - Whether field is required (default: true)
 * @param {string} props.type - Phone type: "mobile", "landline", or "both" (default: "both")
 * @param {string} props.placeholder - Input placeholder
 * @param {string} props.className - Additional container classes
 */
const PhoneInput = ({ 
  name, 
  label, 
  register, 
  errors, 
  required = true,
  type = "both", // "mobile", "landline", or "both"
  placeholder,
  className = ""
}) => {
  // Auto-format phone number as user types
  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    
    // Mobile format: 03XX-XXXXXXX (11 digits)
    if (digits.startsWith('03')) {
      if (digits.length <= 4) return digits;
      return `${digits.slice(0, 4)}-${digits.slice(4, 11)}`;
    }
    
    // Landline format: 0XX-XXXXXXX (9-11 digits)
    if (digits.startsWith('0')) {
      if (digits.length <= 3) return digits;
      return `${digits.slice(0, 3)}-${digits.slice(3, 10)}`;
    }
    
    return digits;
  };

  const handleInput = (e) => {
    const formatted = formatPhone(e.target.value);
    e.target.value = formatted;
  };

  // Get validation pattern based on type
  const getValidationPattern = () => {
    switch (type) {
      case "mobile":
        return {
          value: /^03\d{2}-\d{7}$/,
          message: "Mobile number must be in format: 03XX-XXXXXXX"
        };
      case "landline":
        return {
          value: /^0\d{2}-\d{7}$/,
          message: "Landline number must be in format: 0XX-XXXXXXX"
        };
      case "both":
      default:
        return {
          value: /^(03\d{2}-\d{7}|0\d{2}-\d{7})$/,
          message: "Phone number must be in format: 03XX-XXXXXXX (mobile) or 0XX-XXXXXXX (landline)"
        };
    }
  };

  // Get placeholder based on type
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    
    switch (type) {
      case "mobile":
        return "03XX-XXXXXXX";
      case "landline":
        return "0XX-XXXXXXX";
      case "both":
      default:
        return "03XX-XXXXXXX or 0XX-XXXXXXX";
    }
  };

  // Get max length based on type
  const getMaxLength = () => {
    switch (type) {
      case "mobile":
        return 12; // 11 digits + 1 dash
      case "landline":
        return 11; // 10 digits + 1 dash
      case "both":
      default:
        return 12;
    }
  };

  // Validation rules
  const validationRules = {
    ...(required && { required: `${label} is required` }),
    pattern: getValidationPattern(),
    validate: {
      validFormat: (value) => {
        if (!value && !required) return true;
        
        const digits = value.replace(/-/g, '');
        
        // Check if starts with 0
        if (!digits.startsWith('0')) {
          return "Phone number must start with 0";
        }
        
        // Mobile validation
        if (digits.startsWith('03')) {
          if (type === "landline") return "Only landline numbers are allowed";
          return digits.length === 11 || "Mobile number must have exactly 11 digits";
        }
        
        // Landline validation
        if (digits.startsWith('0')) {
          if (type === "mobile") return "Only mobile numbers are allowed";
          return (digits.length >= 10 && digits.length <= 11) || "Landline number must have 10-11 digits";
        }
        
        return true;
      }
    }
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
          placeholder={getPlaceholder()}
          maxLength={getMaxLength()}
          type="text"
        />
      </div>
      {errors[name] && (
        <span className="text-red-500 text-sm">
          {errors[name].message}
        </span>
      )}
    </div>
  );
};

export default PhoneInput;