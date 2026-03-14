Optimization Plan — next steps to reduce remaining vendor chunks

1) PDF vendor (progress: partial)
- What I did: Converted `frontend/src/utils/pdfExporter.js` to dynamic import `jspdf` and `html2canvas` at call-time.
- Next: Rebuild `frontend` to confirm `pdf-vendor` is now lazy and excluded from initial bundles. If still large, consider server-side PDF generation for exports.

2) Math vendor (KaTeX, math utils)
- Action items:
  - Audit heavy math imports (e.g., KaTeX usage) and defer KaTeX rendering to route-level or render server-side where possible.
  - Consider shipping a pre-rendered HTML for math blocks or using a lightweight math renderer for non-edit views.

3) Misc
- Review `pdf-vendor`-dependent pages and add on-demand loading wrappers (dynamic import) for any heavy UI that triggers PDF generation automatically.
- Run `npm run build` and analyze bundle outputs (Vite build report). Tune `manualChunks` in `vite.config.js` if needed.

If you want, I can run a clean frontend build now and report the new bundle sizes and whether `recharts-vendor` or `pdf-vendor` remain in `dist`. Say "build and report" and I'll run it and summarize results.
