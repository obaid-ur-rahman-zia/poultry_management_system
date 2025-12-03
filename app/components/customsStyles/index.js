// Custom styles for react-select
export const customSelectStyles = (hasError = false) => ({
  control: (provided, state) => ({
    ...provided,
    height: "40px",
    minHeight: "30px",
    border: state.isFocused ? "2px solid #3b82f6" : "2px solid #94a3b8",
    borderRadius: "5px",
    backgroundColor: "white",
    boxShadow: state.isFocused ? "0 0 0 4px rgba(59, 130, 246, 0.1)" : "none",
    "&:hover": {
      borderColor: state.isFocused ? "#3b82f6" : "#94a3b8",
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#94a3b8",
    fontSize: "12px",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#1e293b",
    fontSize: "12px",
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "5px",
    border: "1px solid #e2e8f0",
    boxShadow:
      "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    overflowY: "auto",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
      ? "#f1f5f9"
      : "white",
    color: state.isSelected ? "white" : "#1e293b",
    padding: "12px 16px",
  }),
});
