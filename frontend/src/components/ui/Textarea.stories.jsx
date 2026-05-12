import React from 'react';
import Textarea from './Textarea';

export default {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    rows: { control: 'number' },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export const Default = {
  args: {
    placeholder: 'Metninizi buraya yazın…',
    rows: 5,
  },
};

export const Invalid = {
  args: {
    placeholder: 'Zorunlu alan',
    invalid: true,
    defaultValue: '',
  },
};

export const WithMinHeight = {
  name: 'Uzun içerik',
  render: () => (
    <div className="max-w-lg">
      <Textarea
        readOnly
        defaultValue={'Satır 1\nSatır 2\nSatır 3'}
        rows={6}
      />
    </div>
  ),
};
