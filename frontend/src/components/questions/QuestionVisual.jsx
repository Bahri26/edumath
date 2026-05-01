import React, { useState, useMemo } from 'react';
import { resolveAssetUrl } from '../../services/api';

function QuestionVisualInner({
  src,
  alt = 'Soru görseli',
  className = '',
  loading = 'eager',
  fetchPriority,
}) {
  const [failed, setFailed] = useState(false);
  const resolved = useMemo(() => resolveAssetUrl(src), [src]);

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-600 bg-gradient-to-br from-slate-50 via-white to-indigo-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 px-6 py-10 min-h-[260px] shadow-inner ${className}`}
    >
      {failed ? (
        <div className="text-center max-w-md px-4">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Görsel yüklenemedi</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dosya kayıp olabilir veya bağlantı kesik.
          </p>
          <details className="mt-3 text-left">
            <summary className="cursor-pointer text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              Teknik ayrıntı
            </summary>
            <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
              Denenen URL:{' '}
              <code className="break-all bg-slate-100 dark:bg-slate-800 px-1 rounded">{resolved}</code>
            </p>
            <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
              Geliştirme: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">vite.config.js</code>'de
              {' '}<code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">/uploads → backend</code> proxy'si açık olmalı.
              Veritabanında <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">/api/uploads</code> yazıyorsa düzeltin.
            </p>
          </details>
        </div>
      ) : (
        <img
          src={resolved}
          alt={alt}
          className="max-h-[min(420px,calc(70vh-8rem))] w-auto max-w-full object-contain drop-shadow-md"
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

/** src değişince yükleme hatası state sıfırlandığı için anahtar verilir */
export default function QuestionVisual(props) {
  const { src } = props;
  if (!src) {
    return null;
  }
  return <QuestionVisualInner key={src} {...props} />;
}
