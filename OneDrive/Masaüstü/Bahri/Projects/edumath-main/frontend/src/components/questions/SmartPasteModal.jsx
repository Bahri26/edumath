import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Sparkles } from 'lucide-react';
import { parseQuestionText } from '../../utils/textParsers.jsx';

export default function SmartPasteModal({ isOpen, onClose, onParsed }) {
  const [pasteText, setPasteText] = useState('');
  if (!isOpen) return null;
  const handleParse = () => {
    const parsed = parseQuestionText(pasteText);
    if (parsed) {
      onParsed(parsed);
      setPasteText('');
    } else {
      alert('Metin ayrıştırılamadı. Formatı kontrol edin.');
    }
  };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Akıllı Soru Yapıştır</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">LaTeX formatındaki soruları otomatik ayrıştırın</p>
            </div>
          </div>
          <button
            onClick={() => { onClose(); setPasteText(''); }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">📋 Beklenen Format:</p>
            <pre className="text-xs text-blue-800 dark:text-blue-400 bg-white/50 dark:bg-slate-900/50 p-3 rounded-lg overflow-x-auto">
{`$$LaTeX Formülü$$ Soru metni...
A) Şık 1
B) Şık 2
C) Şık 3
D) Şık 4
Çözüm: Çözüm açıklaması...
Doğru Şık: C`}
            </pre>
          </div>
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder="Örnek:&#10;&#10;$$x^2 + 5x + 6 = 0$$&#10;Yukarıdaki denklemin kökleri toplamı kaçtır?&#10;&#10;A) -5&#10;B) -3&#10;C) 3&#10;D) 5&#10;&#10;Çözüm: Viète formüllerine göre köklerin toplamı -b/a = -5/1 = -5&#10;&#10;Doğru Şık: A"
            className="w-full h-80 p-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl dark:bg-slate-700 dark:text-white resize-none focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm"
          />
          {pasteText.trim() && (
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-2">👁️ Önizleme</p>
              <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {pasteText.substring(0, 300)}{pasteText.length > 300 ? '...' : ''}
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
          <button
            onClick={() => { onClose(); setPasteText(''); }}
            className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
          >
            İptal
          </button>
          <button
            onClick={handleParse}
            disabled={!pasteText.trim()}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Sparkles size={18} /> Ayrıştır ve Ekle
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}

SmartPasteModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onParsed: PropTypes.func.isRequired,
};
