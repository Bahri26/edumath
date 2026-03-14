Visual QA Report — quick checks

- Checked: `frontend/dist` contains built assets.
- Found: `recharts` references remained in `dist` from previous build; source `PerformanceChart.jsx` updated to inline SVG charts.
- Action taken: Replaced `recharts` usage in `frontend/src/components/PerformanceChart.jsx` with `SimpleLineChart` and `SimpleRadarChart` SVG implementations.
- Recommendation: Run `npm run build` in `frontend` to regenerate `dist` and verify `recharts-vendor` chunk is no longer produced.
- Manual visual checks suggested: open Student and Teacher dashboards and confirm charts render and tooltips/readability are acceptable.
