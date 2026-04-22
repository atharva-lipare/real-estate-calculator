// Financial math for the real-estate calculator.
// All currency values are in rupees, all rates are percentages (e.g. 7.5 = 7.5%).

export type LoanType = "normal" | "overdraft";

export interface CalculatorInputs {
  // Loan
  loanAmount: number;
  interestRate: number;
  tenureYears: number;
  loanType: LoanType;

  // Overdraft-only
  initialOdDeposit: number;
  annualOdDeposit: number;

  // Property
  propertyValue: number;
  annualAppreciation: number;
  monthlyRent: number;
  annualRentIncrease: number;
  annualMaintenance: number;
  annualMaintenanceIncrease: number;
  stampDutyPct: number;
  sellingCostPct: number;
  applyPropertyLtcg: boolean;

  // Comparison investments
  fdRate: number;
  equityRate: number;
  fdTaxRate: number;
  applyEquityLtcg: boolean;

  // Exit
  exitYear: number; // 0 = full tenure
}

export interface CashFlow {
  t: number; // years from start
  amount: number; // negative = outflow, positive = inflow
  label?: string;
}

export interface ScenarioResult {
  totalInvested: number;
  finalValue: number;
  netProfit: number;
  xirr: number; // fraction, e.g. 0.105 = 10.5%
}

export interface PropertyBreakdown {
  emi: number;
  downPayment: number;
  stampDuty: number;
  totalInterestPaid: number;
  totalRentReceived: number;
  totalMaintenance: number;
  totalOdAdditions: number;
  finalPropertyValue: number;
  sellingCost: number;
  capitalGainsTax: number;
  remainingLoan: number;
  odRecovery: number;
  monthsToPayoff: number; // may be < tenure for overdraft
}

export interface CalculationResult {
  property: ScenarioResult & PropertyBreakdown & { cashFlows: CashFlow[] };
  fd: ScenarioResult & { tax: number };
  equity: ScenarioResult & { tax: number };
  effectiveYears: number;
  yearlyNetCashFlow: number[]; // one per year, 1..effectiveYears
  comparisonCashFlows: {
    property: CashFlow[];
    fd: CashFlow[];
    equity: CashFlow[];
  };
}

// ---------- Core formulas ----------

export function calculateEMI(
  principal: number,
  annualRate: number,
  years: number
): number {
  if (years <= 0 || principal <= 0) return 0;
  const r = annualRate / 12 / 100;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// NPV of a set of cash flows at a given annual rate.
function npv(flows: CashFlow[], annualRate: number): number {
  let total = 0;
  for (const cf of flows) {
    total += cf.amount / Math.pow(1 + annualRate, cf.t);
  }
  return total;
}

// XIRR: solve for annual rate r such that NPV(flows, r) = 0.
// Uses Newton-Raphson with bisection fallback.
export function xirr(flows: CashFlow[], guess = 0.1): number {
  if (flows.length < 2) return NaN;
  const hasNeg = flows.some((f) => f.amount < 0);
  const hasPos = flows.some((f) => f.amount > 0);
  if (!hasNeg || !hasPos) return NaN;

  // Newton-Raphson
  let rate = guess;
  for (let i = 0; i < 50; i++) {
    let val = 0;
    let deriv = 0;
    for (const cf of flows) {
      const denom = Math.pow(1 + rate, cf.t);
      val += cf.amount / denom;
      deriv -= (cf.t * cf.amount) / (denom * (1 + rate));
    }
    if (Math.abs(val) < 1e-4) return rate;
    if (Math.abs(deriv) < 1e-14) break;
    const newRate = rate - val / deriv;
    if (!isFinite(newRate) || newRate < -0.999) break;
    if (Math.abs(newRate - rate) < 1e-10) return newRate;
    rate = newRate;
  }

  // Bisection fallback
  let lo = -0.9999;
  let hi = 10;
  let fLo = npv(flows, lo);
  let fHi = npv(flows, hi);
  if (fLo * fHi > 0) return NaN;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(flows, mid);
    if (Math.abs(fMid) < 1e-4 || (hi - lo) < 1e-10) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

// Future value of a series of outflows, compounded at `annualRate` (CAGR) until `terminalT`.
// We use effective annual compounding so the headline rate matches the XIRR users expect
// — i.e. "12% equity" → XIRR of 12%, not 12.68%.
function futureValueOfOutflows(
  outflows: CashFlow[],
  annualRate: number,
  terminalT: number
): number {
  const r = annualRate / 100;
  let fv = 0;
  for (const cf of outflows) {
    const yearsRemaining = Math.max(0, terminalT - cf.t);
    fv += -cf.amount * Math.pow(1 + r, yearsRemaining);
  }
  return fv;
}

// ---------- Main calculator ----------

export function calculate(inputs: CalculatorInputs): CalculationResult {
  const {
    loanAmount,
    interestRate,
    tenureYears,
    loanType,
    initialOdDeposit,
    annualOdDeposit,
    propertyValue,
    annualAppreciation,
    monthlyRent,
    annualRentIncrease,
    annualMaintenance,
    annualMaintenanceIncrease,
    stampDutyPct,
    sellingCostPct,
    applyPropertyLtcg,
    fdRate,
    equityRate,
    fdTaxRate,
    applyEquityLtcg,
    exitYear,
  } = inputs;

  const emi = calculateEMI(loanAmount, interestRate, tenureYears);
  const downPayment = Math.max(0, propertyValue - loanAmount);
  const stampDuty = propertyValue * (stampDutyPct / 100);
  const monthlyRateLoan = interestRate / 12 / 100;

  const wantYears = exitYear && exitYear > 0 ? exitYear : tenureYears;
  const effectiveYears = Math.min(wantYears, tenureYears);
  const effectiveMonths = effectiveYears * 12;

  // --- Run amortization month-by-month ---
  let balance = loanAmount;
  let surplus = loanType === "overdraft" ? initialOdDeposit : 0;
  let totalInterestPaid = 0;
  let totalMaintenance = 0;
  let totalRentReceived = 0;
  let totalOdAdditions = loanType === "overdraft" ? initialOdDeposit : 0;
  let monthsToPayoff = effectiveMonths;

  let currentMonthlyRent = monthlyRent;
  let currentAnnualMaintenance = annualMaintenance;

  const outflows: CashFlow[] = [];
  const inflows: CashFlow[] = [];
  const monthlyNet: number[] = []; // net cash flow per month (for yearly chart)

  // Upfront
  const upfront =
    downPayment +
    stampDuty +
    (loanType === "overdraft" ? initialOdDeposit : 0);
  outflows.push({ t: 0, amount: -upfront, label: "Upfront" });

  for (let m = 1; m <= effectiveMonths; m++) {
    // Start-of-year adjustments (not month 1 — first year uses base values)
    if (m > 1 && m % 12 === 1) {
      currentMonthlyRent *= 1 + annualRentIncrease / 100;
      currentAnnualMaintenance *= 1 + annualMaintenanceIncrease / 100;
      if (loanType === "overdraft" && annualOdDeposit > 0) {
        surplus += annualOdDeposit;
        totalOdAdditions += annualOdDeposit;
        outflows.push({
          t: (m - 1) / 12,
          amount: -annualOdDeposit,
          label: "OD top-up",
        });
      }
    }

    // Interest this month
    let interestM = 0;
    let principalM = 0;
    let emiPaid = 0;
    if (balance > 0) {
      const effectiveBalance =
        loanType === "overdraft" ? Math.max(0, balance - surplus) : balance;
      interestM = effectiveBalance * monthlyRateLoan;
      totalInterestPaid += interestM;

      // Principal portion of EMI (if full EMI < interest, whole EMI is interest)
      principalM = Math.max(0, emi - interestM);
      if (principalM > balance) principalM = balance;
      balance -= principalM;
      emiPaid = interestM + principalM;

      if (balance <= 1e-6 && monthsToPayoff === effectiveMonths) {
        monthsToPayoff = m;
      }
    }

    const maintM = currentAnnualMaintenance / 12;
    totalMaintenance += maintM;
    totalRentReceived += currentMonthlyRent;

    const monthT = m / 12;
    const monthOut = emiPaid + maintM;
    if (monthOut > 0) {
      outflows.push({ t: monthT, amount: -monthOut });
    }
    if (currentMonthlyRent > 0) {
      inflows.push({ t: monthT, amount: currentMonthlyRent });
    }

    monthlyNet.push(currentMonthlyRent - monthOut);
  }

  // --- Terminal: sale ---
  const finalPropertyValue =
    propertyValue * Math.pow(1 + annualAppreciation / 100, effectiveYears);
  const sellingCost = finalPropertyValue * (sellingCostPct / 100);
  const netSalePrice = finalPropertyValue - sellingCost;
  const acquisitionCost = propertyValue + stampDuty;
  const capitalGain = Math.max(0, netSalePrice - acquisitionCost);
  const capitalGainsTax = applyPropertyLtcg ? capitalGain * 0.125 : 0;
  const remainingLoan = balance;
  const odRecovery = loanType === "overdraft" ? surplus : 0;
  const terminalInflow =
    netSalePrice - remainingLoan - capitalGainsTax + odRecovery;

  const terminalT = effectiveMonths / 12;
  inflows.push({ t: terminalT, amount: terminalInflow, label: "Sale" });

  const propertyCashFlows: CashFlow[] = [...outflows, ...inflows].sort(
    (a, b) => a.t - b.t
  );

  const totalInvestedProperty = outflows.reduce(
    (s, cf) => s + -cf.amount,
    0
  );
  const totalReceivedProperty = inflows.reduce((s, cf) => s + cf.amount, 0);
  const netProfitProperty = totalReceivedProperty - totalInvestedProperty;
  const xirrProperty = xirr(propertyCashFlows);

  // --- FD / Equity: invest same outflows, grow at respective rate ---
  const fdGross = futureValueOfOutflows(outflows, fdRate, terminalT);
  const fdGain = Math.max(0, fdGross - totalInvestedProperty);
  const fdTax = fdGain * (fdTaxRate / 100);
  const fdFinalValue = fdGross - fdTax;

  const eqGross = futureValueOfOutflows(outflows, equityRate, terminalT);
  const eqGain = Math.max(0, eqGross - totalInvestedProperty);
  const eqTax = applyEquityLtcg ? eqGain * 0.125 : 0;
  const eqFinalValue = eqGross - eqTax;

  const fdCashFlows: CashFlow[] = [
    ...outflows,
    { t: terminalT, amount: fdFinalValue, label: "FD exit" },
  ];
  const eqCashFlows: CashFlow[] = [
    ...outflows,
    { t: terminalT, amount: eqFinalValue, label: "Equity exit" },
  ];

  const xirrFd = xirr(fdCashFlows);
  const xirrEq = xirr(eqCashFlows);

  // Yearly net cash flow (for line chart) — property's net each year
  const yearlyNetCashFlow: number[] = [];
  for (let y = 1; y <= effectiveYears; y++) {
    let sum = 0;
    for (let mo = (y - 1) * 12; mo < y * 12; mo++) {
      sum += monthlyNet[mo] ?? 0;
    }
    // Include terminal inflow in last year
    if (y === effectiveYears) sum += terminalInflow;
    // Include initial outflow in year 1? No — keep yearly cashflow purely operational
    yearlyNetCashFlow.push(sum);
  }

  return {
    property: {
      emi,
      downPayment,
      stampDuty,
      totalInterestPaid,
      totalRentReceived,
      totalMaintenance,
      totalOdAdditions,
      finalPropertyValue,
      sellingCost,
      capitalGainsTax,
      remainingLoan,
      odRecovery,
      monthsToPayoff,
      totalInvested: totalInvestedProperty,
      finalValue: totalReceivedProperty,
      netProfit: netProfitProperty,
      xirr: xirrProperty,
      cashFlows: propertyCashFlows,
    },
    fd: {
      totalInvested: totalInvestedProperty,
      finalValue: fdFinalValue,
      netProfit: fdFinalValue - totalInvestedProperty,
      xirr: xirrFd,
      tax: fdTax,
    },
    equity: {
      totalInvested: totalInvestedProperty,
      finalValue: eqFinalValue,
      netProfit: eqFinalValue - totalInvestedProperty,
      xirr: xirrEq,
      tax: eqTax,
    },
    effectiveYears,
    yearlyNetCashFlow,
    comparisonCashFlows: {
      property: propertyCashFlows,
      fd: fdCashFlows,
      equity: eqCashFlows,
    },
  };
}

export const DEFAULT_INPUTS: CalculatorInputs = {
  loanAmount: 8000000,
  interestRate: 8.5,
  tenureYears: 20,
  loanType: "normal",
  initialOdDeposit: 1000000,
  annualOdDeposit: 200000,
  propertyValue: 10000000,
  annualAppreciation: 7,
  monthlyRent: 30000,
  annualRentIncrease: 7,
  annualMaintenance: 35000,
  annualMaintenanceIncrease: 5,
  stampDutyPct: 6,
  sellingCostPct: 2,
  applyPropertyLtcg: false,
  fdRate: 7.25,
  equityRate: 12,
  fdTaxRate: 30,
  applyEquityLtcg: false,
  exitYear: 0,
};
