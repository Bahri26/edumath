import React, { useRef, useEffect } from "react";
import Button from './Button.jsx';

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
          <Button
            ref={cancelBtnRef}
            variant="outline"
            size="md"
            onClick={onCancel}
            ariaLabel="İptal"
          >
            İptal
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={onConfirm}
            ariaLabel="Onayla"
          >
            Evet, Sil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
