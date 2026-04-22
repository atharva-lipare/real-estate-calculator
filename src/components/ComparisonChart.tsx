import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CalculationResult } from "@/lib/finance";
import { formatCompactINR } from "@/lib/format";

interface Props {
  result: CalculationResult;
}

const COLORS = {
  property: "rgb(56 178 172)",
  fd: "rgb(147 197 253)",
  equity: "rgb(251 146 60)",
};

export function ComparisonChart({ result }: Props) {
  const data = [
    {
      name: "Real estate",
      invested: result.property.totalInvested,
      profit: Math.max(0, result.property.netProfit),
      color: COLORS.property,
    },
    {
      name: "Fixed deposit",
      invested: result.fd.totalInvested,
      profit: Math.max(0, result.fd.netProfit),
      color: COLORS.fd,
    },
    {
      name: "Equity",
      invested: result.equity.totalInvested,
      profit: Math.max(0, result.equity.netProfit),
      color: COLORS.equity,
    },
  ];

  return (
    <div className="h-[320px]">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgb(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            stroke="rgb(var(--fg-2))"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "rgb(var(--border))" }}
          />
          <YAxis
            stroke="rgb(var(--fg-2))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCompactINR(v)}
            width={80}
          />
          <Tooltip
            contentStyle={{
              background: "rgb(var(--bg-2))",
              border: "1px solid rgb(var(--border))",
              borderRadius: 6,
              fontSize: 12,
            }}
            cursor={{ fill: "rgb(var(--bg-2) / 0.4)" }}
            formatter={(v: number) => formatCompactINR(v)}
          />
          <Bar dataKey="invested" stackId="a" name="Invested" fill="rgb(var(--bg-2))">
            {data.map((_, idx) => (
              <Cell key={idx} fill="rgb(var(--bg-2))" />
            ))}
          </Bar>
          <Bar dataKey="profit" stackId="a" name="Profit" radius={[4, 4, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
