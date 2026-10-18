import React, { useState, useMemo } from 'react';
import { resolveAssetUrl } from '../../services/api';
import QuestionImageViewer from './QuestionImageViewer.jsx';
import { hasQuestionImage } from '../../utils/questionImage';

function QuestionVisualInner({
  src,
  alt = 'Soru görseli',
  className = '',
  variant = 'default',
  loading = 'eager',
  fetchPriority,
  fallback,
  dimensions,
}) {
  const [failed, setFailed] = useState(false);
  const [loaded,setLoaded]=useState(false);
  const [attempt,setAttempt]=useState(0);
  const [expanded,setExpanded]=useState(false);
  const resolved = useMemo(() => resolveAssetUrl(src), [src]);
  const compact = variant === 'compact';

  if (failed) {
    return <div role="alert" className="min-w-0 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
      <p>Görsel yüklenemedi. Bağlantınızı kontrol edip yeniden deneyin.</p>
      <button type="button" className="mt-3 min-h-11 rounded-lg border border-amber-400 px-4 font-semibold" onClick={()=>{setFailed(false);setLoaded(false);setAttempt(n=>n+1);}}>Yeniden dene</button>
      {fallback}
    </div>;
  }

  return (
    <div className={`flex min-w-0 flex-col items-center gap-2 ${className}`}>
      <div
        className={
          compact
            ? 'relative inline-block max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-600 dark:bg-slate-900'
            : 'relative flex w-full max-w-2xl items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 px-3 py-2 dark:border-slate-600 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/30'
        }
      >
        {!loaded && <span role="status" className="absolute inset-0 flex min-h-24 items-center justify-center bg-slate-100 text-sm text-slate-600">Görsel yükleniyor…</span>}
        <button type="button" aria-label="Soru görselini büyüt" onClick={()=>setExpanded(true)} className="block min-h-24 max-w-full rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500" disabled={!loaded}>
        <img key={attempt}
          src={resolved}
          alt={alt}
          width={dimensions?.width}
          height={dimensions?.height}
          className={
            compact
              ? 'block max-h-[min(520px,70vh)] w-auto max-w-full h-auto object-contain'
              : 'max-h-[min(560px,calc(75vh-6rem))] w-auto max-w-full object-contain'
          }
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          onLoad={()=>setLoaded(true)}
          onError={() => setFailed(true)}
        />
        </button>
      </div>
      <button type="button" disabled={!loaded} onClick={()=>setExpanded(true)} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-50 dark:text-teal-200">Büyüt ve incele</button>
      {expanded && <QuestionImageViewer src={resolved} alt={alt} onClose={()=>setExpanded(false)}/>}
    </div>
  );
}

/** Görsel yoksa boş bırakır; yükleme hatasında açıklama gösterir. */
export default function QuestionVisual(props) {
  const { src } = props;
  if (!hasQuestionImage(src)) {
    return null;
  }
  return <QuestionVisualInner key={src} {...props} />;
}
