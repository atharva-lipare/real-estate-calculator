import type { CalculatorInputs } from "./finance";
import { DEFAULT_INPUTS } from "./finance";

// Compact URL encoding: each key mapped to a 1-3 char shortcode.
const KEY_MAP: Record<keyof CalculatorInputs, string> = {
  loanAmount: "la",
  interestRate: "ir",
  tenureYears: "ty",
  loanType: "lt",
  initialOdDeposit: "iod",
  annualOdDeposit: "aod",
  propertyValue: "pv",
  annualAppreciation: "ap",
  monthlyRent: "mr",
  annualRentIncrease: "ri",
  annualMaintenance: "am",
  annualMaintenanceIncrease: "mi",
  stampDutyPct: "sd",
  sellingCostPct: "sc",
  applyPropertyLtcg: "plt",
  fdRate: "fr",
  equityRate: "er",
  fdTaxRate: "ft",
  applyEquityLtcg: "elt",
  exitYear: "ex",
};

const REVERSE_MAP = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k as keyof CalculatorInputs])
);

export function encodeToQuery(inputs: CalculatorInputs): string {
  const params = new URLSearchParams();
  for (const [key, short] of Object.entries(KEY_MAP) as [
    keyof CalculatorInputs,
    string
  ][]) {
    const v = inputs[key];
    if (v === DEFAULT_INPUTS[key]) continue; // omit defaults
    if (typeof v === "boolean") params.set(short, v ? "1" : "0");
    else params.set(short, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function decodeFromQuery(search: string): CalculatorInputs {
  const params = new URLSearchParams(search);
  const result: CalculatorInputs = { ...DEFAULT_INPUTS };
  params.forEach((value, short) => {
    const key = REVERSE_MAP[short];
    if (!key) return;
    const defaultVal = DEFAULT_INPUTS[key];
    if (typeof defaultVal === "boolean") {
      (result as unknown as Record<string, unknown>)[key] = value === "1";
    } else if (typeof defaultVal === "number") {
      const n = Number(value);
      if (isFinite(n)) (result as unknown as Record<string, unknown>)[key] = n;
    } else {
      (result as unknown as Record<string, unknown>)[key] = value;
    }
  });
  return result;
}
