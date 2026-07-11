import React, { useState, useMemo } from 'react';
import { resolveAssetUrl } from '../../services/api';
import { hasQuestionImage } from '../../utils/questionImage';

function QuestionVisualInner({
  src,
  alt = 'Soru görseli',
  className = '',
  loading = 'eager',
  fetchPriority,
}) {
  const [failed, setFailed] = useState(false);
  const resolved = useMemo(() => resolveAssetUrl(src), [src]);

  if (failed) {
    return null;
  }

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-600 bg-gradient-to-br from-slate-50 via-white to-teal-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/40 px-4 py-3 max-h-[min(420px,calc(70vh-8rem))] shadow-inner ${className}`}
    >
      <img
        src={resolved}
        alt={alt}
        className="max-h-[min(380px,calc(70vh-10rem))] w-auto max-w-full object-contain drop-shadow-md"
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        onError={() => setFailed(true)}
      />
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
