import React from 'react';
import {
  BookOpen,
  FileText,
  ClipboardCheck,
  LayoutGrid,
  Users,
  BarChart2,
  Sparkles,
  Calendar,
  MessageSquare,
  GraduationCap,
  Lightbulb,
  Settings,
  ArrowRight,
  Trophy,
} from 'lucide-react';

const TEACHER_ICONS = {
  questions: FileText,
  exams: ClipboardCheck,
  'skill-tree': LayoutGrid,
  'student-progress': Users,
  reports: BarChart2,
  exercises: Trophy,
  account: Settings,
};

const STUDENT_ICONS = {
  home: BookOpen,
  quizzes: ClipboardCheck,
  courses: LayoutGrid,
  exercises: Sparkles,
  assignments: Calendar,
  messages: MessageSquare,
  account: GraduationCap,
};

/**
 * @param {'teacher'|'student'} audience
 * @param {Array<{ id?: string, title: string, lines: string[], tip?: string, path?: string, _active?: boolean }>} blocks
 * @param {'drawer'|'landing'} variant
 * @param {(path: string) => void} [onNavigate] — drawer’da CTA; verilmezse buton yok
 * @param {'TR'|'EN'} [lang]
 */
export default function QuickGuideBlockList({
  audience = 'student',
  blocks = [],
  variant = 'drawer',
  onNavigate,
  lang = 'TR',
}) {
  const icons = audience === 'teacher' ? TEACHER_ICONS : STUDENT_ICONS;
  const isLanding = variant === 'landing';
  const ctaLabel = lang === 'EN' ? 'Go to page' : 'Sayfaya git';
  const hereLabel = lang === 'EN' ? 'This page' : 'Bu sayfa';

  return (
    <div className={isLanding ? 'grid gap-4 sm:grid-cols-2' : 'space-y-4'}>
      {blocks.map((block, i) => {
        const Icon = (block.id && icons[block.id]) || BookOpen;
        const active = Boolean(block._active);
        return (
          <article
            key={`${block.id || block.title}-${i}`}
            className={
              isLanding
                ? 'group relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white/95 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/90 dark:shadow-none'
                : `group relative overflow-hidden rounded-2xl border p-4 shadow-sm dark:shadow-none ${
                    active
                      ? 'border-teal-300 bg-teal-50/50 dark:border-teal-700 dark:bg-teal-950/30'
                      : 'border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 dark:border-slate-700 dark:from-slate-800/90 dark:to-slate-900/80'
                  }`
            }
          >
            <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-teal-500 to-sky-500 opacity-90" />
            <div className="relative pl-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-300">
                  <Icon size={18} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h3
                    className={
                      isLanding
                        ? 'text-sm font-black text-gray-900 dark:text-white'
                        : 'text-sm font-bold text-slate-900 dark:text-white'
                    }
                  >
                    {block.title}
                  </h3>
                  {active && !isLanding ? (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                      {hereLabel}
                    </p>
                  ) : null}
                </div>
              </div>
              <ul
                className={
                  isLanding
                    ? 'space-y-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300'
                    : 'space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300'
                }
              >
                {block.lines.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400 dark:bg-teal-500" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              {block.tip ? (
                <p className="mt-3 flex gap-2 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs font-medium text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                  <span>{block.tip}</span>
                </p>
              ) : null}
              {!isLanding && block.path && typeof onNavigate === 'function' ? (
                <button
                  type="button"
                  onClick={() => onNavigate(block.path)}
                  className="mt-3 inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-3 text-sm font-semibold text-white hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                >
                  {ctaLabel}
                  <ArrowRight size={16} aria-hidden />
                </button>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
