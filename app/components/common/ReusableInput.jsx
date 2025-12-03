import React from 'react';

const ReusableInput = ({
  value,
  onClick,
  onChange,
  placeholder = "",
  readOnly = false,
  disabled = false,
  className = "",
  variant = "default",
  size = "small",
  type = "text",
  ...props
}) => {
  // Base styles
  const baseStyles = "px-4 border-2 rounded-md cursor-pointer transition-all duration-200 focus:outline-none";
  
  // Size variants
  const sizeStyles = {
    small: "h-10 text-xs",
    medium: "h-12 text-lg", 
    large: "h-14 text-xl"
  };
  
  // Style variants
  const variants = {
    default: "bg-white border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50",
    minimal: "bg-gradient-to-r from-gray-50 font-mono text-center to-gray-100 border-gray-200 hover:from-blue-50 hover:to-indigo-50",
    primary: "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200",
    success: "bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-200",
    warning: "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 hover:from-yellow-100 hover:to-yellow-200",
    error: "bg-gradient-to-r from-red-50 to-red-100 border-red-200 hover:from-red-100 hover:to-red-200"
  };
  
  // Combine all styles
  const combinedClassName = `
    w-full 
    ${baseStyles} 
    ${sizeStyles[size]} 
    ${variants[variant]}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <input
      value={value}
      onClick={onClick}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      disabled={disabled}
      className={combinedClassName}
      type={type}
      {...props}
    />
  );
};


export default ReusableInput;