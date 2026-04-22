import { useEffect, useMemo, useState } from "react";
import { calculate, DEFAULT_INPUTS, type CalculatorInputs } from "./lib/finance";
import { encodeToQuery, decodeFromQuery } from "./lib/url-state";
import { InputPanel } from "./components/InputPanel";
import { ResultsPanel } from "./components/ResultsPanel";

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  });
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);
  return [theme, setTheme] as const;
}

export function App() {
  const [inputs, setInputs] = useState<CalculatorInputs>(() => {
    if (typeof window === "undefined") return DEFAULT_INPUTS;
    const q = window.location.search;
    return q ? decodeFromQuery(q) : DEFAULT_INPUTS;
  });
  const [theme, setTheme] = useTheme();
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => calculate(inputs), [inputs]);

  // Debounced URL sync (so typing doesn't spam history)
  useEffect(() => {
    const id = setTimeout(() => {
      const query = encodeToQuery(inputs);
      const url = `${window.location.pathname}${query}`;
      window.history.replaceState({}, "", url);
    }, 300);
    return () => clearTimeout(id);
  }, [inputs]);

  const update = (patch: Partial<CalculatorInputs>) =>
    setInputs((p) => ({ ...p, ...patch }));

  const copyShareLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen bg-bg-0 text-fg-0">
      <header className="sticky top-0 z-10 border-b border-border bg-bg-0/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <h1 className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <span
                className="inline-block h-2 w-2 rounded-full bg-brand"
                aria-hidden
              />
              Real Estate vs FD vs Equity
            </h1>
            <p className="text-xs text-fg-2">
              Compare investments with honest math — EMI, rent, taxes, XIRR
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyShareLink}
              className="rounded-md border border-border bg-bg-1 px-3 py-1.5 text-xs font-medium text-fg-1 transition hover:border-border/60 hover:text-fg-0"
            >
              {copied ? "Copied!" : "Share"}
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-md border border-border bg-bg-1 px-2 py-1.5 text-xs text-fg-1 transition hover:text-fg-0"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
            <button
              onClick={() => setInputs(DEFAULT_INPUTS)}
              className="rounded-md border border-border bg-bg-1 px-3 py-1.5 text-xs font-medium text-fg-1 transition hover:border-border/60 hover:text-fg-0"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr] lg:gap-8">
          <aside>
            <InputPanel inputs={inputs} onChange={update} />
          </aside>
          <section>
            <ResultsPanel result={result} />
          </section>
        </div>
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-8 text-xs text-fg-2 sm:px-6">
        <p>
          All calculations happen in your browser — nothing is sent anywhere.
          Assumes monthly EMI schedule for loans, effective annual CAGR for FD
          and equity. LTCG toggles use 12.5% flat (new regime, no indexation).
        </p>
      </footer>
    </div>
  );
}
