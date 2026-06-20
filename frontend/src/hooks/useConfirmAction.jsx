import { useState, useCallback, useRef, useMemo, useContext } from 'react';
import ConfirmModal from '../components/ui/ConfirmModal';
import { LanguageContext } from '../context/LanguageContext';
import { MESSAGES, lookupMessage, formatMessage } from '../i18n/messages';

function useConfirmDefaults() {
  const langCtx = useContext(LanguageContext);
  const catalog = MESSAGES[langCtx?.language || 'TR'] || MESSAGES.TR;
  return useMemo(
    () => ({
      confirmLabel: formatMessage(lookupMessage(catalog, 'admin.confirmYes')) || 'Evet',
      cancelLabel: formatMessage(lookupMessage(catalog, 'admin.confirmNo')) || 'Hayır',
    }),
    [catalog],
  );
}

/**
 * Evet/Hayır onay diyaloğu. Hayır seçilirse mevcut ekranda kalınır.
 */
export function useConfirmAction() {
  const defaults = useConfirmDefaults();

  const [config, setConfig] = useState({
    open: false,
    title: '',
    description: '',
    confirmLabel: defaults.confirmLabel,
    cancelLabel: defaults.cancelLabel,
  });
  const resolveRef = useRef(null);

  const askConfirm = useCallback(
    ({ title, description, confirmLabel, cancelLabel }) => {
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        setConfig({
          open: true,
          title,
          description,
          confirmLabel: confirmLabel ?? defaults.confirmLabel,
          cancelLabel: cancelLabel ?? defaults.cancelLabel,
        });
      });
    },
    [defaults.confirmLabel, defaults.cancelLabel],
  );

  const finish = useCallback(
    (confirmed) => {
      setConfig({
        open: false,
        title: '',
        description: '',
        confirmLabel: defaults.confirmLabel,
        cancelLabel: defaults.cancelLabel,
      });
      if (resolveRef.current) {
        resolveRef.current(confirmed);
        resolveRef.current = null;
      }
    },
    [defaults.confirmLabel, defaults.cancelLabel],
  );

  const ConfirmDialog = useCallback(
    () => (
      <ConfirmModal
        open={config.open}
        title={config.title}
        description={config.description}
        confirmLabel={config.confirmLabel}
        cancelLabel={config.cancelLabel}
        onConfirm={() => finish(true)}
        onCancel={() => finish(false)}
      />
    ),
    [config, finish],
  );

  return { askConfirm, ConfirmDialog };
}
