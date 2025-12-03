"use client";

export default function DecimalInput({ value, onChange, ...props }) {
  const handleChange = (e) => {
    let val = e.target.value;

    // Remove all characters except digits and dot
    val = val.replace(/[^0-9.]/g, "");

    // Ensure only one dot exists
    const parts = val.split(".");
    if (parts.length > 2) return;

    // Limit decimals to 2 places
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].slice(0, 2);
      val = parts.join(".");
    }

    onChange(val);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      {...props}
      value={value ?? ""}
      onChange={handleChange}
    />
  );
}
