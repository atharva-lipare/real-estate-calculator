import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { CalculationResult } from "@/lib/finance";
import { formatCompactINR } from "@/lib/format";

interface Props {
  result: CalculationResult;
}

export function CashflowChart({ result }: Props) {
  const data = result.yearlyNetCashFlow.map((v, i) => ({
    year: i + 1,
    net: v,
  }));

  return (
    <div className="h-[280px]">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgb(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="year"
            stroke="rgb(var(--fg-2))"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "rgb(var(--border))" }}
            label={{
              value: "Year",
              position: "insideBottom",
              offset: -2,
              fill: "rgb(var(--fg-2))",
              fontSize: 11,
            }}
          />
          <YAxis
            stroke="rgb(var(--fg-2))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCompactINR(v)}
            width={80}
          />
          <ReferenceLine y={0} stroke="rgb(var(--fg-2))" strokeDasharray="2 2" />
          <Tooltip
            contentStyle={{
              background: "rgb(var(--bg-2))",
              border: "1px solid rgb(var(--border))",
              borderRadius: 6,
              fontSize: 12,
            }}
            cursor={{ stroke: "rgb(var(--fg-2))", strokeWidth: 1 }}
            formatter={(v: number) => formatCompactINR(v)}
            labelFormatter={(v) => `Year ${v}`}
          />
          <Line
            type="monotone"
            dataKey="net"
            stroke="rgb(var(--brand))"
            strokeWidth={2}
            dot={{ fill: "rgb(var(--brand))", r: 3 }}
            activeDot={{ r: 5 }}
            name="Net cash flow"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
