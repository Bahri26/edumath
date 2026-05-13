/**
 * Shared Tailwind class bundles for admin surfaces — one place to tune aesthetics.
 */
export const admin = {
  input:
    'w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500',
  select:
    'rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-100',
  inputCompact:
    'min-w-0 rounded-lg border border-slate-200/90 bg-white px-2.5 py-1.5 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-900',

  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:from-violet-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45',
  btnSecondary:
    'inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
  btnGhost:
    'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',

  btnSmPrimary:
    'rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-500 active:scale-[0.98] disabled:opacity-45',
  btnSmSuccess:
    'rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 active:scale-[0.98]',
  btnSmDanger:
    'rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500 active:scale-[0.98]',
  btnSmWarning:
    'rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-amber-950 shadow-sm transition hover:bg-amber-400',
  btnSmNeutral:
    'rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
  btnSmIndigo:
    'rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500',
  btnSmOutline:
    'rounded-lg border border-violet-300/90 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-800 transition hover:bg-violet-100 dark:border-violet-500/35 dark:bg-violet-950/60 dark:text-violet-200 dark:hover:bg-violet-900/50',

  card: 'rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-md shadow-slate-200/25 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/70 dark:shadow-none',
  cardSoft:
    'rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-slate-50/80 to-violet-50/50 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40',

  pageWrap: 'mx-auto max-w-[1600px] space-y-8 px-4 py-8 sm:px-6 lg:px-8',
  title: 'text-3xl font-bold tracking-tight text-slate-900 dark:text-white',
  subtitle: 'mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400',
  eyebrow: 'text-xs font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400',
  fieldLabel: 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400',

  alertError:
    'rounded-xl border border-rose-200/90 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/45 dark:text-rose-100',
  alertOk:
    'rounded-xl border border-emerald-200/90 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100',

  filterBar:
    'flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/50',

  tableWrap:
    'overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/20 ring-1 ring-slate-100/80 dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none dark:ring-slate-800/80',
  table: 'w-full min-w-[720px] border-collapse text-sm',
  th: 'border-b border-slate-200/90 bg-gradient-to-b from-slate-50 to-slate-100/80 px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 first:rounded-tl-2xl last:rounded-tr-2xl dark:border-slate-700 dark:from-slate-800/90 dark:to-slate-900/80 dark:text-slate-400',
  td: 'border-b border-slate-100/90 px-4 py-3 align-middle text-slate-700 dark:border-slate-800 dark:text-slate-200',
  tr: 'transition-colors hover:bg-violet-50/40 dark:hover:bg-slate-800/35',

  loadingBox: 'flex items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-400',

  modalBackdrop:
    'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]',
  modalPanel:
    'max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-0 shadow-2xl shadow-slate-900/25 ring-1 ring-white/60 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700/80',

  badge: 'inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  badgeRole: (role) => {
    const map = {
      admin: 'bg-violet-100 text-violet-800 dark:bg-violet-950/80 dark:text-violet-200',
      teacher: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-200',
      student: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200',
    };
    return `inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${map[role] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`;
  },
};
