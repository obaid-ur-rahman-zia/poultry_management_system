"use client";

export default function IntegerOnlyInput({ value, onChange, ...props }) {
  const handleChange = (e) => {
    let val = e.target.value;

    // Remove negative sign and non-integers
    val = val.replace(/[^0-9]/g, "");

    onChange(val === "" ? "" : Number(val));
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      {...props}
      value={value ?? ""}
      onChange={handleChange}
      
    />
  );
}
