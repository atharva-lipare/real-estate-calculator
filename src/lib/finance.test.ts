import { describe, it, expect } from "vitest";
import {
  calculateEMI,
  xirr,
  calculate,
  DEFAULT_INPUTS,
  type CalculatorInputs,
} from "./finance";

describe("calculateEMI", () => {
  it("matches standard EMI formula", () => {
    // ₹10L @ 10% for 10 years → EMI ≈ ₹13,215
    const emi = calculateEMI(1000000, 10, 10);
    expect(emi).toBeCloseTo(13215, 0);
  });

  it("handles zero interest", () => {
    const emi = calculateEMI(1200000, 0, 10);
    expect(emi).toBeCloseTo(10000, 1); // 12L / 120 months
  });

  it("returns 0 for zero principal or tenure", () => {
    expect(calculateEMI(0, 10, 10)).toBe(0);
    expect(calculateEMI(100000, 10, 0)).toBe(0);
  });
});

describe("xirr", () => {
  it("returns ~10% for a simple 10% annual return", () => {
    const flows = [
      { t: 0, amount: -1000 },
      { t: 1, amount: 1100 },
    ];
    expect(xirr(flows)).toBeCloseTo(0.1, 3);
  });

  it("handles multi-period cash flows", () => {
    // -100 now, +50 at year 1, +70 at year 2 → IRR ≈ 11.04%
    const flows = [
      { t: 0, amount: -100 },
      { t: 1, amount: 50 },
      { t: 2, amount: 70 },
    ];
    const rate = xirr(flows);
    // -100 + 50/(1+r) + 70/(1+r)^2 = 0 → r ≈ 12.36%
    expect(rate).toBeCloseTo(0.1236, 3);
  });

  it("returns NaN when only outflows", () => {
    const flows = [
      { t: 0, amount: -100 },
      { t: 1, amount: -50 },
    ];
    expect(xirr(flows)).toBeNaN();
  });
});

describe("calculate — sanity checks", () => {
  it("matches analytical final property value", () => {
    const r = calculate(DEFAULT_INPUTS);
    const expected =
      DEFAULT_INPUTS.propertyValue *
      Math.pow(1 + DEFAULT_INPUTS.annualAppreciation / 100, r.effectiveYears);
    expect(r.property.finalPropertyValue).toBeCloseTo(expected, 0);
  });

  it("normal loan fully amortizes by tenure end", () => {
    const r = calculate(DEFAULT_INPUTS);
    expect(r.property.remainingLoan).toBeLessThan(1); // ~0 after full tenure
  });

  it("overdraft with heavy surplus pays off faster", () => {
    const od: CalculatorInputs = {
      ...DEFAULT_INPUTS,
      loanType: "overdraft",
      initialOdDeposit: 5000000, // half the loan parked upfront
      annualOdDeposit: 1000000,
    };
    const r = calculate(od);
    expect(r.property.monthsToPayoff).toBeLessThan(
      DEFAULT_INPUTS.tenureYears * 12
    );
    // Total interest should be less than normal loan
    const normal = calculate(DEFAULT_INPUTS);
    expect(r.property.totalInterestPaid).toBeLessThan(
      normal.property.totalInterestPaid
    );
  });

  it("early sell gives lower final value than full tenure", () => {
    const early: CalculatorInputs = { ...DEFAULT_INPUTS, exitYear: 5 };
    const full = calculate(DEFAULT_INPUTS);
    const earlyR = calculate(early);
    expect(earlyR.property.finalPropertyValue).toBeLessThan(
      full.property.finalPropertyValue
    );
  });

  it("higher appreciation → higher property XIRR", () => {
    const low = calculate({ ...DEFAULT_INPUTS, annualAppreciation: 3 });
    const high = calculate({ ...DEFAULT_INPUTS, annualAppreciation: 12 });
    expect(high.property.xirr).toBeGreaterThan(low.property.xirr);
  });

  it("FD XIRR matches FD rate when tax is 0", () => {
    const r = calculate({ ...DEFAULT_INPUTS, fdTaxRate: 0 });
    expect(r.fd.xirr).toBeCloseTo(DEFAULT_INPUTS.fdRate / 100, 2);
  });

  it("FD XIRR matches post-tax rate when tax > 0", () => {
    const r = calculate(DEFAULT_INPUTS);
    const expected =
      (DEFAULT_INPUTS.fdRate * (1 - DEFAULT_INPUTS.fdTaxRate / 100)) / 100;
    expect(r.fd.xirr).toBeCloseTo(expected, 3);
  });

  it("FD tax is zero when slab is zero", () => {
    const r = calculate({ ...DEFAULT_INPUTS, fdTaxRate: 0 });
    expect(r.fd.tax).toBeCloseTo(0, 2);
  });

  it("equity XIRR matches equity rate without LTCG", () => {
    const r = calculate({ ...DEFAULT_INPUTS, applyEquityLtcg: false });
    expect(r.equity.xirr).toBeCloseTo(DEFAULT_INPUTS.equityRate / 100, 2);
  });

  it("FD and equity share the same total invested as property", () => {
    const r = calculate(DEFAULT_INPUTS);
    expect(r.fd.totalInvested).toBeCloseTo(r.property.totalInvested, 0);
    expect(r.equity.totalInvested).toBeCloseTo(r.property.totalInvested, 0);
  });

  it("applying LTCG reduces property profit", () => {
    const without = calculate({ ...DEFAULT_INPUTS, applyPropertyLtcg: false });
    const withLtcg = calculate({ ...DEFAULT_INPUTS, applyPropertyLtcg: true });
    expect(withLtcg.property.netProfit).toBeLessThan(without.property.netProfit);
  });

  it("total interest paid is positive and less than total EMI paid", () => {
    const r = calculate(DEFAULT_INPUTS);
    const totalEmiPaid = r.property.emi * DEFAULT_INPUTS.tenureYears * 12;
    expect(r.property.totalInterestPaid).toBeGreaterThan(0);
    expect(r.property.totalInterestPaid).toBeLessThan(totalEmiPaid);
  });

  it("EMI matches standard formula for ₹80L @ 8.5% for 20y", () => {
    // Bank EMI tables: 80L at 8.5% for 240 months ≈ ₹69,425
    const r = calculate(DEFAULT_INPUTS);
    expect(r.property.emi).toBeGreaterThan(69000);
    expect(r.property.emi).toBeLessThan(70000);
  });

  it("stamp duty and selling cost show up in breakdown", () => {
    const r = calculate(DEFAULT_INPUTS);
    expect(r.property.stampDuty).toBeCloseTo(
      (DEFAULT_INPUTS.propertyValue * DEFAULT_INPUTS.stampDutyPct) / 100,
      0
    );
    expect(r.property.sellingCost).toBeGreaterThan(0);
  });

  it("OD top-ups stop after loan pays off early", () => {
    // Massive surplus kills the loan fast; top-ups after that should not count.
    const r = calculate({
      ...DEFAULT_INPUTS,
      loanType: "overdraft",
      initialOdDeposit: 7000000,
      annualOdDeposit: 500000,
    });
    // Loan paid off well before tenure end
    expect(r.property.monthsToPayoff).toBeLessThan(
      DEFAULT_INPUTS.tenureYears * 12
    );
    // Number of top-ups capped at years-to-payoff (not 20)
    const yearsToPayoff = Math.ceil(r.property.monthsToPayoff / 12);
    const maxPossibleTopups = Math.max(0, yearsToPayoff - 1);
    expect(r.property.totalOdAdditions).toBeLessThanOrEqual(
      DEFAULT_INPUTS.initialOdDeposit
        ? 7000000 + 500000 * maxPossibleTopups + 1
        : Infinity
    );
  });

  it("zero loan means no EMI and no interest paid", () => {
    const r = calculate({
      ...DEFAULT_INPUTS,
      loanAmount: 0,
      propertyValue: 5000000,
    });
    expect(r.property.emi).toBe(0);
    expect(r.property.totalInterestPaid).toBe(0);
  });

  it("property without rent or appreciation still loses money due to costs", () => {
    const r = calculate({
      ...DEFAULT_INPUTS,
      monthlyRent: 0,
      annualAppreciation: 0,
      annualMaintenance: 0,
    });
    // No rent, no appreciation → net profit must be negative (just interest + stamp duty eaten)
    expect(r.property.netProfit).toBeLessThan(0);
  });

  it("XIRR for property is bounded between -50% and +50% in realistic inputs", () => {
    const r = calculate(DEFAULT_INPUTS);
    expect(r.property.xirr).toBeGreaterThan(-0.5);
    expect(r.property.xirr).toBeLessThan(0.5);
  });
});
