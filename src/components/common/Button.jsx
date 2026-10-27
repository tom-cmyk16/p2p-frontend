export default function Button({ children, onClick, type = "button", disabled, variant = "primary", className = "" }) {
  const base = "inline-flex items-center justify-center px-4 py-2 rounded-md text-center font-medium disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-[#013638] text-white hover:bg-[#01494b]",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}
