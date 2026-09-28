export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`flex h-[15px] w-[26px] shrink-0 items-center rounded-[20px] p-0.5 max-[600px]:h-[18px] max-[600px]:w-[31px] ${checked ? "bg-[#f4456577]" : "bg-[#3b3944]"}`}
      onClick={onChange}
    >
      <span
        className={`block h-[11px] w-[11px] rounded-full transition-transform duration-200 max-[600px]:h-3.5 max-[600px]:w-3.5 ${checked ? "translate-x-[11px] bg-[#ff6d89] max-[600px]:translate-x-[13px]" : "bg-[#a9a3b1]"}`}
      />
    </button>
  );
}
