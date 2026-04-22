# Real Estate vs FD vs Equity — Investment Calculator

**Live: https://atharva-lipare.github.io/real-estate-calculator/**

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

Prerequisites: Node 18+ (tested on 20 and 24).

```bash
npm install
npm run dev          # hot-reloading dev server → http://localhost:5173
npm test             # run the math unit tests (vitest)
npm run build        # production build → dist/
npm run preview      # serve the production build locally
```

### Stopping the dev server

If you started it in the foreground, `Ctrl+C` in that terminal. If it's
running in the background (or you've lost the terminal):

```bash
kill $(lsof -t -i:5173)
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

Deployed via GitHub Pages. The workflow at `.github/workflows/deploy.yml`
builds and publishes on every push to `master`. No action needed on your
end once the repo is set up — just push.

If forking this to deploy your own copy:

1. Make the fork public (GitHub Pages on free tier requires public repos).
2. In the repo settings → **Pages** → Source: **GitHub Actions**.
3. Push to `master`. The workflow passes `VITE_BASE=/<repo-name>/` so Vite
   emits asset paths that match Pages' sub-path hosting.

The output of `npm run build` is a pure static site in `dist/`, so any
other static host (Vercel, Netlify, Cloudflare Pages, S3, …) also works
without modification — leave `VITE_BASE` unset and they serve from root.

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
- FD interest is compounded at the post-tax rate (`rate × (1 − slab%)`),
  reflecting the real-world annual TDS + slab treatment.
- Equity compounds gross, with LTCG (if toggled) applied once on total gain
  at exit — realistic for a long-held SIP redeemed in one go.
- Rent is treated as pocketed, not reinvested. XIRR implicitly assumes
  reinvestment at its own rate; "final value" does not compound rent.
- Rent, maintenance, and OD top-ups escalate at the start of each year (not
  mid-year).

## License

MIT
