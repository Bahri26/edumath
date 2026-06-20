import { useState, useCallback, useRef } from 'react';
import ConfirmModal from '../components/ui/ConfirmModal';

const CLOSED = {
  open: false,
  title: '',
  description: '',
  confirmLabel: 'Evet',
  cancelLabel: 'Hayır',
};

/**
 * Evet/Hayır onay diyaloğu. Hayır seçilirse mevcut ekranda kalınır.
 * @returns {{ askConfirm: (opts: { title: string, description: string, confirmLabel?: string, cancelLabel?: string }) => Promise<boolean>, ConfirmDialog: () => JSX.Element }}
 */
export function useConfirmAction() {
  const [config, setConfig] = useState(CLOSED);
  const resolveRef = useRef(null);

  const askConfirm = useCallback(({ title, description, confirmLabel = 'Evet', cancelLabel = 'Hayır' }) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setConfig({ open: true, title, description, confirmLabel, cancelLabel });
    });
  }, []);

  const finish = useCallback((confirmed) => {
    setConfig(CLOSED);
    if (resolveRef.current) {
      resolveRef.current(confirmed);
      resolveRef.current = null;
    }
  }, []);

  const ConfirmDialog = useCallback(() => (
    <ConfirmModal
      open={config.open}
      title={config.title}
      description={config.description}
      confirmLabel={config.confirmLabel}
      cancelLabel={config.cancelLabel}
      onConfirm={() => finish(true)}
      onCancel={() => finish(false)}
    />
  ), [config, finish]);

  return { askConfirm, ConfirmDialog };
}
