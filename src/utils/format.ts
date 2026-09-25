export const currency = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
export const multiplierColor = (value: number) =>
  value >= 10 ? "pink" : value >= 2 ? "purple" : "blue";
