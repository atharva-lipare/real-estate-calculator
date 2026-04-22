// Indian number formatting utilities.

const CRORE = 1_00_00_000;
const LAKH = 1_00_000;

export function formatINR(value: number, opts: { maxFrac?: number } = {}): string {
  const { maxFrac = 0 } = opts;
  const rounded = Math.round(value);
  return "₹" + rounded.toLocaleString("en-IN", { maximumFractionDigits: maxFrac });
}

// Compact: 1.25 Cr, 45.3 L, 8,500
export function formatCompactINR(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= CRORE) {
    return `${sign}₹${(abs / CRORE).toFixed(2)} Cr`;
  }
  if (abs >= LAKH) {
    return `${sign}₹${(abs / LAKH).toFixed(2)} L`;
  }
  return `${sign}₹${Math.round(abs).toLocaleString("en-IN")}`;
}

export function formatPct(fraction: number, digits = 2): string {
  if (!isFinite(fraction)) return "—";
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function unitOf(value: number): string {
  const abs = Math.abs(value);
  if (abs >= CRORE) return `${(abs / CRORE).toFixed(2)} Cr`;
  if (abs >= LAKH) return `${(abs / LAKH).toFixed(2)} L`;
  return "";
}
