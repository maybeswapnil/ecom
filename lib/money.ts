export function formatPaise(paise: number): string {
  const rupees = Math.round(paise) / 100;
  return "₹" + rupees.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
