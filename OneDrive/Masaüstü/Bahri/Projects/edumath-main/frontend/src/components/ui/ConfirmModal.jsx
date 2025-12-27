import React, { useRef, useEffect } from "react";

const ConfirmModal = ({ open, title, description, onConfirm, onCancel }) => {
  const cancelBtnRef = useRef(null);
  useEffect(() => {
    if (open && cancelBtnRef.current) {
      cancelBtnRef.current.focus();
    }
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
      >
        <h3 id="confirm-modal-title" className="text-lg font-bold mb-2 dark:text-white">{title}</h3>
        <p id="confirm-modal-desc" className="mb-6 text-slate-600 dark:text-slate-300">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            ref={cancelBtnRef}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600"
            onClick={onCancel}
            aria-label="İptal"
          >
            İptal
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
            aria-label="Onayla"
          >
            Evet, Sil
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
