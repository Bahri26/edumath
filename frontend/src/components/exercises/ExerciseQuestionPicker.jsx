import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Plus, X } from 'lucide-react';
import apiClient, { resolveAssetUrl } from '../../services/api';
import { renderWithLatex } from '../../utils/latex.jsx';
import Button from '../ui/Button.jsx';
import { questionTypeLabel } from '../../constants/questionTypesUi';

const MAX_DEFAULT = 25;

/**
 * Havuzdan soru seçimi: öğretmen soruları veya (branş onaylıysa) branş havuzu.
 */
export default function ExerciseQuestionPicker({
  classLevel,
  subject,
  topic,
  questionTypes = [],
  branchApproved,
  selectedIds,
  onSelectedIdsChange,
  maxSelected = MAX_DEFAULT,
}) {
  const [poolSearch, setPoolSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [poolPage, setPoolPage] = useState(1);
  const [poolQuestions, setPoolQuestions] = useState([]);
  const [poolTotalPages, setPoolTotalPages] = useState(1);
  const [poolLoading, setPoolLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(poolSearch.trim()), 250);
    return () => clearTimeout(t);
  }, [poolSearch]);

  const fetchPool = useCallback(async () => {
    if (!classLevel) return;
    setPoolLoading(true);
    try {
      const params = {
        page: poolPage,
        limit: 12,
        classLevel,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      };
      if (topic && topic !== 'Tümü') params.topic = topic;
      if (questionTypes?.length) params.types = questionTypes.join(',');

      let res;
      if (branchApproved) {
        res = await apiClient.get('/teacher/subject/questions', { params });
      } else {
        res = await apiClient.get('/teacher/questions', {
          params: {
            ...params,
            ...(subject ? { subject } : {}),
          },
        });
      }
      setPoolQuestions(res.data?.data || []);
      setPoolTotalPages(res.data?.totalPages || 1);
    } catch {
      setPoolQuestions([]);
      setPoolTotalPages(1);
    } finally {
      setPoolLoading(false);
    }
  }, [branchApproved, classLevel, subject, topic, questionTypes, poolPage, debouncedSearch]);

  useEffect(() => {
    fetchPool();
  }, [fetchPool]);

  useEffect(() => {
    setPoolPage(1);
  }, [classLevel, subject, topic, questionTypes, debouncedSearch, branchApproved]);

  const addId = (id) => {
    const sid = String(id);
    if (selectedIds.includes(sid)) return;
    if (selectedIds.length >= maxSelected) return;
    onSelectedIdsChange([...selectedIds, sid]);
  };

  const removeId = (id) => {
    onSelectedIdsChange(selectedIds.filter((x) => x !== String(id)));
  };

  const move = (from, to) => {
    if (to < 0 || to >= selectedIds.length) return;
    const next = [...selectedIds];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onSelectedIdsChange(next);
  };

  const idSet = new Set(selectedIds);
  const selectedMeta = selectedIds.map((id) => poolQuestions.find((q) => String(q._id) === id)).filter(Boolean);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-900/30 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <p className="text-xs font-black uppercase tracking-wider text-surface-600 dark:text-surface-400">Havuz</p>
          <span className="text-[11px] text-surface-500">
            En fazla {maxSelected} soru · {selectedIds.length} seçili
          </span>
        </div>
        <input
          type="search"
          placeholder="Metinde ara…"
          value={poolSearch}
          onChange={(e) => setPoolSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-sm"
        />
        <div className="min-h-[200px] max-h-[320px] overflow-y-auto space-y-2 pr-1">
          {poolLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-brand-600" size={28} />
            </div>
          ) : poolQuestions.length === 0 ? (
            <p className="text-sm text-surface-500 py-6 text-center">Bu filtrede soru yok. Soru bankasına soru ekleyin.</p>
          ) : (
            poolQuestions.map((q) => {
              const sid = String(q._id);
              const added = idSet.has(sid);
              const imgSrc = resolveAssetUrl(q.image);
              return (
                <div
                  key={sid}
                  className="flex gap-2 items-start p-2 rounded-xl border border-surface-100 dark:border-surface-800 bg-white dark:bg-surface-900/80"
                >
                  {imgSrc ? (
                    <img src={imgSrc} alt="" className="w-12 h-12 object-contain rounded-lg border border-surface-100 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-surface-100 dark:bg-surface-800 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 text-brand-800 dark:bg-brand-950/50 dark:text-brand-200">
                      {questionTypeLabel(q.type)}
                    </span>
                    <div className="text-xs text-surface-800 dark:text-surface-100 mt-1 line-clamp-2">
                      {renderWithLatex(q.text || '—')}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={added || selectedIds.length >= maxSelected}
                    onClick={() => addId(sid)}
                    className="shrink-0 p-2 rounded-lg bg-brand-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-700"
                    aria-label="Ekle"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
        {poolTotalPages > 1 ? (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              disabled={poolPage <= 1}
              onClick={() => setPoolPage((p) => p - 1)}
              className="p-2 rounded-lg border border-surface-200 dark:border-surface-600 disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-bold text-surface-600">
              {poolPage} / {poolTotalPages}
            </span>
            <button
              type="button"
              disabled={poolPage >= poolTotalPages}
              onClick={() => setPoolPage((p) => p + 1)}
              className="p-2 rounded-lg border border-surface-200 dark:border-surface-600 disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-brand-200/60 dark:border-brand-900/50 bg-brand-50/30 dark:bg-brand-950/20 p-4 space-y-3 flex flex-col min-h-[280px]">
        <p className="text-xs font-black uppercase tracking-wider text-brand-800 dark:text-brand-300">Egzersizdeki sıra</p>
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[360px] pr-1">
          {selectedIds.length === 0 ? (
            <p className="text-sm text-surface-600 dark:text-surface-400 py-8 text-center">
              Soldan + ile soru ekleyin. Sırayı oklarla değiştirebilirsiniz.
            </p>
          ) : (
            selectedIds.map((id, idx) => {
              const fromPool = poolQuestions.find((q) => String(q._id) === id);
              const label = fromPool?.text ? String(fromPool.text).slice(0, 80) : id.slice(-6);
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 text-xs"
                >
                  <span className="text-[10px] font-bold text-surface-400 w-5">{idx + 1}</span>
                  <span className="flex-1 line-clamp-2 text-surface-800 dark:text-surface-100">
                    {fromPool ? renderWithLatex(fromPool.text || '—') : `Soru…${label}`}
                  </span>
                  <div className="flex gap-0.5 shrink-0">
                    <button
                      type="button"
                      className="p-1 rounded text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30"
                      disabled={idx === 0}
                      onClick={() => move(idx, idx - 1)}
                      aria-label="Yukarı"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="p-1 rounded text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 disabled:opacity-30"
                      disabled={idx >= selectedIds.length - 1}
                      onClick={() => move(idx, idx + 1)}
                      aria-label="Aşağı"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      onClick={() => removeId(id)}
                      aria-label="Kaldır"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {selectedMeta.length < selectedIds.length ? (
          <p className="text-[11px] text-amber-700 dark:text-amber-400">
            Bazı seçili sorular bu sayfada görünmüyor; sıra ve silme yine de geçerlidir. Kaydettiğinizde tam liste sunucuda doğrulanır.
          </p>
        ) : null}
        {selectedIds.length > 0 ? (
          <Button variant="outline" size="sm" onClick={() => onSelectedIdsChange([])}>
            Tümünü temizle
          </Button>
        ) : null}
      </div>
    </div>
  );
}
