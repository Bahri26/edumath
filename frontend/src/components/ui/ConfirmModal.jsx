import React, { useRef, useEffect } from 'react';
import Button from './Button.jsx';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const ConfirmModal = ({
  open,
  title,
  description,
  confirmLabel = 'Evet',
  cancelLabel = 'Hayır',
  onConfirm,
  onCancel,
}) => {
  const panelRef = useRef(null);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel?.();
      }}
    >
      <div
        ref={panelRef}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-sm animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
      >
        <h3 id="confirm-modal-title" className="text-lg font-bold mb-2 dark:text-white">{title}</h3>
        <p id="confirm-modal-desc" className="mb-6 text-slate-600 dark:text-slate-300">{description}</p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="md" onClick={onCancel} ariaLabel={cancelLabel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" size="md" onClick={onConfirm} ariaLabel={confirmLabel}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
