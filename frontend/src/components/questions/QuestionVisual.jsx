import React, { useState, useMemo } from 'react';
import { resolveAssetUrl } from '../../services/api';
import { hasQuestionImage } from '../../utils/questionImage';

function QuestionVisualInner({
  src,
  alt = 'Soru görseli',
  className = '',
  variant = 'default',
  loading = 'eager',
  fetchPriority,
}) {
  const [failed, setFailed] = useState(false);
  const resolved = useMemo(() => resolveAssetUrl(src), [src]);
  const compact = variant === 'compact';

  if (failed) {
    return null;
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <div
        className={
          compact
            ? 'inline-block max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-600 dark:bg-slate-900'
            : 'flex w-full max-w-2xl items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 px-3 py-2 dark:border-slate-600 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/30'
        }
      >
        <img
          src={resolved}
          alt={alt}
          className={
            compact
              ? 'block max-h-[min(520px,70vh)] w-auto max-w-full h-auto'
              : 'max-h-[min(560px,calc(75vh-6rem))] w-auto max-w-full object-contain'
          }
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          onError={() => setFailed(true)}
        />
      </div>
    </div>
  );
}

/** Görsel yoksa veya yüklenemezse hiçbir şey render etmez */
export default function QuestionVisual(props) {
  const { src } = props;
  if (!hasQuestionImage(src)) {
    return null;
  }
  return <QuestionVisualInner key={src} {...props} />;
}
