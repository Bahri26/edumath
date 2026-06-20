import React, { useState } from 'react';
import ConfirmModal from './ConfirmModal';
import Button from './Button';

export default {
  title: 'UI/ConfirmModal',
  component: ConfirmModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Open = {
  args: {
    open: true,
    title: 'Silmek istediğinize emin misiniz?',
    description: 'Bu işlem geri alınamaz.',
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export const Interactive = {
  name: 'Etkileşimli',
  render: function InteractiveRender() {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-8">
        <Button variant="danger" size="md" onClick={() => setOpen(true)}>
          Silme modalını aç
        </Button>
        <ConfirmModal
          open={open}
          title="Kaydı sil"
          description="Bu kayıt kalıcı olarak kaldırılacak."
          cancelLabel="Hayır"
          confirmLabel="Evet"
          onConfirm={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </div>
    );
  },
};
