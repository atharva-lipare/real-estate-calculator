# Real Estate vs FD vs Equity — Investment Calculator

A calculator to compare returning from buying real estate on a loan against
investing the equivalent cash in fixed deposits or equity. Models EMI,
overdraft loans, rent income, maintenance, stamp duty, selling costs, LTCG
taxes, and early sale — and reports XIRR alongside absolute profit.

All calculations run in the browser. No backend, no tracking, nothing sent
anywhere. Share a scenario by copying the URL.

## Tech

- Vite + React 18 + TypeScript
- Tailwind CSS (dark / light)
- Recharts for charts
- Vitest for math unit tests

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # run math tests
npm run build        # production build → dist/
```

## How the comparison works

When you buy property, you have cash outflows at specific times:

1. Upfront: down payment + stamp duty + (overdraft surplus, if applicable)
2. Monthly: EMI + maintenance
3. Annually (overdraft only): top-up to OD surplus

You also have inflows:

1. Monthly: rent
2. At exit: sale proceeds − selling cost − remaining loan − LTCG tax (+
   overdraft surplus returned)

**Property XIRR** = the annualized return across all these cash flows.

**FD / Equity comparison** takes _the same outflows_ and invests them at the
chosen CAGR instead. The final value is computed by compounding each
investment until exit, then applying tax. This gives the true opportunity
cost: "if you'd put that same cash into FD / equity at the same times, what
would you have?"

## Deployment

The output of `npm run build` is a pure static site in `dist/`. It works on
any static host.

### Vercel (recommended)

1. Push to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. Framework preset: Vite. Build command: `npm run build`. Output directory:
   `dist`.
4. Click Deploy.

### Netlify

1. Push to GitHub.
2. Go to Netlify → Add new site → Import from Git.
3. Build command: `npm run build`. Publish directory: `dist`.

### Cloudflare Pages

1. Connect the repo.
2. Framework preset: Vite. Build command: `npm run build`. Output: `dist`.

### GitHub Pages

```bash
npm run build
npx gh-pages -d dist
```

## Assumptions & caveats

- Loan interest uses the standard EMI formula with monthly compounding on a
  nominal annual rate.
- FD and equity rates are treated as **effective annual CAGR** (so entering
  12% yields 12% XIRR, not 12.68%).
- Overdraft model follows SBI MaxGain / HDFC SmartHome: interest is charged
  on `max(0, outstanding − surplus)` each month; surplus is returned at exit.
- LTCG on property is 12.5% flat (new regime, no indexation). Equity LTCG is
  12.5% flat with no ₹1.25L exemption modeled (conservative — actual tax may
  be slightly lower for small gains).
- FD interest is assumed taxed at the slab rate you specify, levied on total
  gains at exit (close enough for planning; real FD tax is annual TDS).
- Rent, maintenance, and OD top-ups escalate at the start of each year (not
  mid-year).

## License

MIT
