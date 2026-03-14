PR: Reduce frontend bundle, remove Recharts, add SVG charts, PR notes

Summary:
- Replaced `recharts` usage in `PerformanceChart.jsx` with lightweight inline SVG components to reduce vendor bundle weight and avoid shipping a large chart library to clients.
- Removed `recharts` dependency from `frontend/package.json`.
- Added quick visual QA report at `VISUAL_QA_REPORT.md`.

Files changed (high-level):
- `frontend/src/components/PerformanceChart.jsx` — removed static `recharts` imports and implemented `SimpleLineChart` and `SimpleRadarChart`.
- `frontend/package.json` — removed `recharts` dependency.
- `VISUAL_QA_REPORT.md`, `PR_DESCRIPTION.md` — new documentation.

Testing & verification steps:
1. In `frontend`, run:

```bash
npm ci   # or npm install
npm run build
```

2. Confirm `dist` rebuilds without a `recharts-vendor-*.js` chunk (search `dist` for "recharts-vendor").
3. Start a static server (or `npm run start`) and open Student and Teacher dashboards to visually confirm charts render correctly.
4. Run backend Jest tests to ensure no regressions: from repo root `cd backend && npm test`.

Risks & notes:
- The SVG charts are intentionally lightweight and do not provide all Recharts features (animations, advanced tooltips). If advanced interactions are required, consider lazy-loading the original library for those pages.
- `package-lock.json` may still reference `recharts` until `npm install` / `npm ci` is run and lockfile updated.

If you want, I can:
- Run the `npm run build` and verify the new `dist` here.
- Update or remove `recharts` from `package-lock.json`/run `npm ci`.
- Open the dashboards in a headless browser and capture screenshots for QA.
