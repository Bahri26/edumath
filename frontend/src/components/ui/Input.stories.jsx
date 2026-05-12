import React from 'react';
import Input from './Input';

export default {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password', 'search', 'number'] },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
};

export const Text = {
  args: {
    placeholder: 'Metin yazın',
    type: 'text',
  },
};

export const Email = {
  args: {
    type: 'email',
    placeholder: 'ornek@edumath.com',
    autoComplete: 'email',
  },
};

export const Password = {
  args: {
    type: 'password',
    placeholder: '••••••••',
    autoComplete: 'current-password',
  },
};

export const Invalid = {
  args: {
    placeholder: 'E-posta',
    type: 'email',
    invalid: true,
    defaultValue: 'gecersiz',
  },
};

export const Disabled = {
  args: {
    placeholder: 'Pasif alan',
    disabled: true,
    defaultValue: 'Düzenlenemez',
  },
};
