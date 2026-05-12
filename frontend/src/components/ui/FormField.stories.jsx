import React, { useState } from 'react';
import FormField from './FormField';
import Input from './Input';
import Textarea from './Textarea';

export default {
  title: 'UI/FormField',
  component: FormField,
  tags: ['autodocs'],
};

export const Basic = {
  render: () => (
    <div className="max-w-sm space-y-4">
      <FormField label="Görünen ad">
        <Input name="displayName" placeholder="Adınız" />
      </FormField>
    </div>
  ),
};

export const WithHint = {
  render: () => (
    <div className="max-w-sm">
      <FormField
        label="Kullanıcı adı"
        hint="Sadece harf, rakam ve alt çizgi."
      >
        <Input name="username" placeholder="bahadir_teacher" />
      </FormField>
    </div>
  ),
};

export const WithError = {
  render: function WithErrorRender() {
    const [v, setV] = useState('x');
    const error = v.length < 3 ? 'En az 3 karakter olmalı.' : null;
    return (
      <div className="max-w-sm">
        <FormField label="Kod" error={error} required>
          <Input value={v} onChange={(e) => setV(e.target.value)} />
        </FormField>
      </div>
    );
  },
};

export const TextareaField = {
  render: () => (
    <div className="max-w-md">
      <FormField label="Not" hint="Kısa tutun.">
        <Textarea rows={4} placeholder="İsteğe bağlı not..." />
      </FormField>
    </div>
  ),
};
