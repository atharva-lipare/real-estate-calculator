import { useId, type ReactNode } from "react";
import { unitOf } from "@/lib/format";

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  hint?: string;
  step?: number;
  min?: number;
  max?: number;
  showIndianUnit?: boolean;
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  hint,
  step,
  min,
  max,
  showIndianUnit = false,
}: NumberFieldProps) {
  const id = useId();
  const unit = showIndianUnit ? unitOf(value) : "";
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="flex items-center justify-between text-xs font-medium tracking-wide text-fg-1"
      >
        <span>{label}</span>
        {unit && <span className="font-mono text-fg-2">{unit}</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          value={Number.isFinite(value) ? value : ""}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-md border border-border bg-bg-2 px-3 py-2 text-sm text-fg-0 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-fg-2">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-[11px] text-fg-2">{hint}</p>}
    </div>
  );
}

interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}

export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
  suffix = "%",
}: SliderFieldProps) {
  const id = useId();
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="flex items-center justify-between text-xs font-medium tracking-wide text-fg-1"
      >
        <span>{label}</span>
        <span className="font-mono text-fg-0">
          {value.toFixed(step < 1 ? 1 : 0)}
          {suffix}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

interface ToggleFieldProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}

export function ToggleField({ label, value, onChange, hint }: ToggleFieldProps) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-md border border-border bg-bg-2 px-3 py-2.5 transition hover:border-border/80">
      <div className="flex-1">
        <div className="text-xs font-medium tracking-wide text-fg-1">
          {label}
        </div>
        {hint && <div className="mt-0.5 text-[11px] text-fg-2">{hint}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition ${
          value ? "bg-brand" : "bg-bg-0 border border-border"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { label: string; value: T }[];
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: SegmentedProps<T>) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium tracking-wide text-fg-1">{label}</div>
      <div className="inline-flex rounded-md border border-border bg-bg-2 p-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded px-3 py-1.5 text-xs font-medium transition ${
              value === opt.value
                ? "bg-brand text-white shadow"
                : "text-fg-1 hover:text-fg-0"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: ReactNode;
  hint?: string;
}

export function Section({ title, children, hint }: SectionProps) {
  return (
    <section className="space-y-4 rounded-lg border border-border bg-bg-1 p-5">
      <header>
        <h2 className="text-sm font-semibold tracking-tight text-fg-0">
          {title}
        </h2>
        {hint && <p className="mt-0.5 text-xs text-fg-2">{hint}</p>}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
