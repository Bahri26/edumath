import React, { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import adminService from '../../services/adminService';
import { admin as a } from './adminUi';

const AdminInternalNotesPanel = ({ refType, refId }) => {
  const [items, setItems] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!refId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.listInternalNotes(refType, refId);
      setItems(data.items || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Notlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [refType, refId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await adminService.createInternalNote({ refType, refId, body: body.trim() });
      setBody('');
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Not kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">Bu notlar yalnızca yönetici hesapları tarafından görülebilir.</p>

      {error && <div className={a.alertError}>{error}</div>}

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
          Yükleniyor…
        </div>
      ) : (
        <ul className="max-h-52 space-y-3 overflow-y-auto pr-1">
          {items.length === 0 && (
            <li className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400">
              Henüz not yok.
            </li>
          )}
          {items.map((n) => (
            <li
              key={n._id}
              className="rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/90 p-3 shadow-sm dark:border-slate-700 dark:from-slate-800/80 dark:to-slate-900/80"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {(n.authorId && (n.authorId.name || n.authorId.email)) || 'Admin'}
                </span>
                <time className="tabular-nums text-[11px]">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-100">{n.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
        <textarea
          className={a.input}
          rows={3}
          placeholder="Notunuzu yazın…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={4000}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">{4000 - body.length} karakter</span>
          <button type="submit" disabled={saving || !body.trim()} className={a.btnPrimary}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Kaydediliyor
              </>
            ) : (
              'Not ekle'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminInternalNotesPanel;
