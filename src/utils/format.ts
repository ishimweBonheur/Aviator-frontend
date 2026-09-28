export const currency = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
export const multiplierColor = (value: number) =>
  value >= 10
    ? "bg-[#382132] text-[#f15a89]"
    : value >= 2
      ? "bg-[#2b223d] text-[#bb87f3]"
      : "bg-[#202737] text-[#76adee]";
