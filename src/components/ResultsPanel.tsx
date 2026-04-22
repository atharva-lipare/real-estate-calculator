import type { CalculationResult } from "@/lib/finance";
import { formatCompactINR, formatPct, formatINR } from "@/lib/format";
import { ComparisonChart } from "./ComparisonChart";
import { CashflowChart } from "./CashflowChart";

interface Props {
  result: CalculationResult;
}

interface HeroCardProps {
  name: string;
  xirr: number;
  profit: number;
  invested: number;
  finalValue: number;
  color: string;
  winner?: boolean;
}

function HeroCard({
  name,
  xirr,
  profit,
  invested,
  finalValue,
  color,
  winner,
}: HeroCardProps) {
  const profitColor = profit >= 0 ? "text-positive" : "text-negative";
  return (
    <div
      className={`relative rounded-lg border p-5 transition ${
        winner
          ? "border-brand bg-brand/5"
          : "border-border bg-bg-1 hover:border-border/60"
      }`}
    >
      {winner && (
        <span className="absolute -top-2 right-3 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          Winner
        </span>
      )}
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: color }}
          aria-hidden
        />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-fg-1">
          {name}
        </h3>
      </div>
      <div className="mt-4">
        <div className="font-mono text-3xl font-semibold tabular-nums text-fg-0">
          {formatPct(xirr, 2)}
        </div>
        <div className="text-[11px] uppercase tracking-wider text-fg-2">
          Annualized (XIRR)
        </div>
      </div>
      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <dt className="text-fg-2">Invested</dt>
          <dd className="font-mono tabular-nums text-fg-1">
            {formatCompactINR(invested)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-fg-2">Final value</dt>
          <dd className="font-mono tabular-nums text-fg-1">
            {formatCompactINR(finalValue)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-border pt-1.5">
          <dt className="text-fg-1">Net profit</dt>
          <dd className={`font-mono font-semibold tabular-nums ${profitColor}`}>
            {formatCompactINR(profit)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/60 py-2 text-sm last:border-b-0">
      <span className="text-fg-2">{label}</span>
      <span className="font-mono tabular-nums text-fg-1">{value}</span>
    </div>
  );
}

export function ResultsPanel({ result }: Props) {
  const { property, fd, equity, effectiveYears } = result;
  const winner =
    property.xirr >= fd.xirr && property.xirr >= equity.xirr
      ? "property"
      : equity.xirr >= fd.xirr
      ? "equity"
      : "fd";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <HeroCard
          name="Real estate"
          xirr={property.xirr}
          profit={property.netProfit}
          invested={property.totalInvested}
          finalValue={property.finalValue}
          color="rgb(56 178 172)"
          winner={winner === "property"}
        />
        <HeroCard
          name="Fixed deposit"
          xirr={fd.xirr}
          profit={fd.netProfit}
          invested={fd.totalInvested}
          finalValue={fd.finalValue}
          color="rgb(147 197 253)"
          winner={winner === "fd"}
        />
        <HeroCard
          name="Equity (SIP)"
          xirr={equity.xirr}
          profit={equity.netProfit}
          invested={equity.totalInvested}
          finalValue={equity.finalValue}
          color="rgb(251 146 60)"
          winner={winner === "equity"}
        />
      </div>

      <div className="rounded-lg border border-border bg-bg-1 p-5">
        <h3 className="mb-4 text-sm font-semibold text-fg-0">
          Final values after {effectiveYears} years
        </h3>
        <ComparisonChart result={result} />
      </div>

      <div className="rounded-lg border border-border bg-bg-1 p-5">
        <h3 className="mb-1 text-sm font-semibold text-fg-0">
          Property yearly net cash flow
        </h3>
        <p className="mb-4 text-xs text-fg-2">
          Rent minus EMI, maintenance, OD top-ups. Final year includes sale
          proceeds.
        </p>
        <CashflowChart result={result} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-bg-1 p-5">
          <h3 className="mb-3 text-sm font-semibold text-fg-0">
            Property breakdown
          </h3>
          <StatRow
            label="Monthly EMI"
            value={formatINR(property.emi, { maxFrac: 0 })}
          />
          <StatRow
            label="Down payment"
            value={formatCompactINR(property.downPayment)}
          />
          <StatRow
            label="Stamp duty & registration"
            value={formatCompactINR(property.stampDuty)}
          />
          <StatRow
            label="Total interest paid"
            value={formatCompactINR(property.totalInterestPaid)}
          />
          <StatRow
            label="Total rent received"
            value={formatCompactINR(property.totalRentReceived)}
          />
          <StatRow
            label="Total maintenance"
            value={formatCompactINR(property.totalMaintenance)}
          />
          {property.totalOdAdditions > 0 && (
            <StatRow
              label="Total OD parked"
              value={formatCompactINR(property.totalOdAdditions)}
            />
          )}
          <StatRow
            label="Final property value"
            value={formatCompactINR(property.finalPropertyValue)}
          />
          <StatRow
            label="Selling costs"
            value={formatCompactINR(property.sellingCost)}
          />
          {property.capitalGainsTax > 0 && (
            <StatRow
              label="Capital gains tax"
              value={formatCompactINR(property.capitalGainsTax)}
            />
          )}
          {property.remainingLoan > 1 && (
            <StatRow
              label="Remaining loan at exit"
              value={formatCompactINR(property.remainingLoan)}
            />
          )}
          {property.monthsToPayoff < effectiveYears * 12 &&
            property.monthsToPayoff > 0 && (
              <StatRow
                label="Loan paid off in"
                value={`${(property.monthsToPayoff / 12).toFixed(1)} yrs`}
              />
            )}
        </div>

        <div className="rounded-lg border border-border bg-bg-1 p-5">
          <h3 className="mb-3 text-sm font-semibold text-fg-0">
            Taxes considered
          </h3>
          <StatRow
            label="Property LTCG"
            value={formatCompactINR(property.capitalGainsTax)}
          />
          <StatRow label="FD tax" value={formatCompactINR(fd.tax)} />
          <StatRow label="Equity LTCG" value={formatCompactINR(equity.tax)} />
          <div className="mt-4 rounded-md bg-bg-2 p-3 text-xs text-fg-2">
            <p className="mb-1 font-medium text-fg-1">How FD / Equity is modeled</p>
            <p>
              At each time you'd spend cash on the property (down payment,
              stamp duty, EMI + maintenance monthly, OD top-ups), the same
              amount is invested in FD / equity instead. Final value is
              compounded at the CAGR you entered.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
