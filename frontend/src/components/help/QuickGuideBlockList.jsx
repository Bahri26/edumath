import React from 'react';
import {
  BookOpen,
  FileText,
  ClipboardCheck,
  LayoutGrid,
  Users,
  BarChart2,
  Award,
  Sparkles,
  Calendar,
  MessageSquare,
  GraduationCap,
  Lightbulb,
  Settings,
  ClipboardList,
} from 'lucide-react';

const TEACHER_ICONS = [
  FileText,
  ClipboardCheck,
  LayoutGrid,
  Users,
  BarChart2,
  Award,
  ClipboardList,
  Settings,
];

const STUDENT_ICONS = [
  BookOpen,
  ClipboardCheck,
  LayoutGrid,
  Sparkles,
  Award,
  Calendar,
  MessageSquare,
  GraduationCap,
];

/**
 * @param {'teacher'|'student'} audience
 * @param {Array<{ title: string, lines: string[], tip?: string }>} blocks
 * @param {'drawer'|'landing'} variant — drawer: sağ panel; landing: Audience sayfası kartları
 */
export default function QuickGuideBlockList({ audience = 'student', blocks = [], variant = 'drawer' }) {
  const icons = audience === 'teacher' ? TEACHER_ICONS : STUDENT_ICONS;
  const isLanding = variant === 'landing';

  return (
    <div className={isLanding ? 'grid gap-4 sm:grid-cols-2' : 'space-y-4'}>
      {blocks.map((block, i) => {
        const Icon = icons[i] || BookOpen;
        return (
          <article
            key={`${block.title}-${i}`}
            className={
              isLanding
                ? 'group relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white/95 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/90 dark:shadow-none'
                : 'group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-sm dark:border-slate-700 dark:from-slate-800/90 dark:to-slate-900/80 dark:shadow-none'
            }
          >
            <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-teal-500 to-sky-500 opacity-90" />
            <div className="relative pl-3">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={
                    isLanding
                      ? 'flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-300'
                      : 'flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-300'
                  }
                >
                  <Icon size={18} aria-hidden />
                </span>
                <h3
                  className={
                    isLanding
                      ? 'text-sm font-black text-gray-900 dark:text-white'
                      : 'text-sm font-bold text-slate-900 dark:text-white'
                  }
                >
                  {block.title}
                </h3>
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
            </div>
          </article>
        );
      })}
    </div>
  );
}
