import type { CalculatorInputs } from "@/lib/finance";
import {
  NumberField,
  SliderField,
  ToggleField,
  Segmented,
  Section,
} from "./Field";

interface Props {
  inputs: CalculatorInputs;
  onChange: (patch: Partial<CalculatorInputs>) => void;
}

export function InputPanel({ inputs, onChange }: Props) {
  return (
    <div className="space-y-5">
      <Section title="Loan" hint="Your home loan terms">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <NumberField
              label="Loan amount"
              value={inputs.loanAmount}
              onChange={(v) => onChange({ loanAmount: v })}
              suffix="₹"
              showIndianUnit
            />
          </div>
          <NumberField
            label="Interest rate"
            value={inputs.interestRate}
            onChange={(v) => onChange({ interestRate: v })}
            step={0.05}
            suffix="%"
          />
          <NumberField
            label="Tenure"
            value={inputs.tenureYears}
            onChange={(v) => onChange({ tenureYears: v })}
            suffix="yr"
          />
        </div>
        <Segmented
          label="Loan type"
          value={inputs.loanType}
          onChange={(v) => onChange({ loanType: v })}
          options={[
            { label: "Normal EMI", value: "normal" },
            { label: "Overdraft", value: "overdraft" },
          ]}
        />
        {inputs.loanType === "overdraft" && (
          <div className="grid grid-cols-2 gap-4 rounded-md bg-bg-2 p-3">
            <NumberField
              label="Initial OD surplus"
              value={inputs.initialOdDeposit}
              onChange={(v) => onChange({ initialOdDeposit: v })}
              suffix="₹"
              showIndianUnit
            />
            <NumberField
              label="Annual top-up"
              value={inputs.annualOdDeposit}
              onChange={(v) => onChange({ annualOdDeposit: v })}
              suffix="₹"
              showIndianUnit
            />
          </div>
        )}
      </Section>

      <Section title="Property">
        <NumberField
          label="Property value"
          value={inputs.propertyValue}
          onChange={(v) => onChange({ propertyValue: v })}
          suffix="₹"
          showIndianUnit
        />
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="Stamp duty & reg."
            value={inputs.stampDutyPct}
            onChange={(v) => onChange({ stampDutyPct: v })}
            step={0.5}
            suffix="%"
          />
          <NumberField
            label="Selling costs"
            value={inputs.sellingCostPct}
            onChange={(v) => onChange({ sellingCostPct: v })}
            step={0.5}
            suffix="%"
          />
        </div>
        <SliderField
          label="Annual appreciation"
          value={inputs.annualAppreciation}
          onChange={(v) => onChange({ annualAppreciation: v })}
          min={0}
          max={20}
          step={0.5}
        />
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="Monthly rent"
            value={inputs.monthlyRent}
            onChange={(v) => onChange({ monthlyRent: v })}
            suffix="₹"
          />
          <NumberField
            label="Annual maintenance"
            value={inputs.annualMaintenance}
            onChange={(v) => onChange({ annualMaintenance: v })}
            suffix="₹"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SliderField
            label="Rent increase / yr"
            value={inputs.annualRentIncrease}
            onChange={(v) => onChange({ annualRentIncrease: v })}
            min={0}
            max={20}
            step={0.5}
          />
          <SliderField
            label="Maintenance increase / yr"
            value={inputs.annualMaintenanceIncrease}
            onChange={(v) => onChange({ annualMaintenanceIncrease: v })}
            min={0}
            max={15}
            step={0.5}
          />
        </div>
        <ToggleField
          label="Apply LTCG tax on sale"
          value={inputs.applyPropertyLtcg}
          onChange={(v) => onChange({ applyPropertyLtcg: v })}
          hint="12.5% flat on capital gain (new regime, no indexation)"
        />
      </Section>

      <Section
        title="Alternatives"
        hint="Expected CAGR for the comparison investments"
      >
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="FD rate"
            value={inputs.fdRate}
            onChange={(v) => onChange({ fdRate: v })}
            step={0.1}
            suffix="%"
          />
          <NumberField
            label="Equity rate"
            value={inputs.equityRate}
            onChange={(v) => onChange({ equityRate: v })}
            step={0.1}
            suffix="%"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="FD tax rate"
            value={inputs.fdTaxRate}
            onChange={(v) => onChange({ fdTaxRate: v })}
            step={1}
            suffix="%"
            hint="Your slab rate"
          />
          <div className="pt-0.5">
            <ToggleField
              label="Equity LTCG"
              value={inputs.applyEquityLtcg}
              onChange={(v) => onChange({ applyEquityLtcg: v })}
              hint="12.5% flat"
            />
          </div>
        </div>
      </Section>

      <Section title="Exit" hint="When do you sell?">
        <NumberField
          label="Sell in year (0 = hold full tenure)"
          value={inputs.exitYear}
          onChange={(v) => onChange({ exitYear: v })}
          min={0}
          max={inputs.tenureYears}
          step={1}
        />
      </Section>
    </div>
  );
}
