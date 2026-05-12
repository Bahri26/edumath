import React from 'react';
import { Inbox, Search } from 'lucide-react';
import Button from './Button';
import EmptyState from './EmptyState';

export default {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};

export const Default = {
  args: {
    icon: Inbox,
    title: 'Kayıt bulunamadı',
    description: 'Filtreleri değiştirerek tekrar deneyin veya yeni bir kayıt ekleyin.',
  },
};

export const TitleOnly = {
  args: {
    title: 'Liste boş',
  },
};

export const WithAction = {
  render: () => (
    <EmptyState
      icon={Search}
      title="Sonuç yok"
      description="Arama kriterlerinize uygun öğe bulunamadı."
      action={<Button variant="outline" size="sm">Filtreleri sıfırla</Button>}
    />
  ),
};
