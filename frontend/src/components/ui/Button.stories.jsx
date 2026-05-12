import React from 'react';
import { Plus } from 'lucide-react';
import Button from './Button';

export default {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'danger', 'outline'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    icon: { control: false },
  },
};

export const Primary = {
  args: {
    children: 'Birincil',
    variant: 'primary',
    size: 'md',
  },
};

export const Secondary = {
  args: {
    children: 'İkincil',
    variant: 'secondary',
    size: 'md',
  },
};

export const Success = {
  args: {
    children: 'Başarılı',
    variant: 'success',
    size: 'md',
  },
};

export const Danger = {
  args: {
    children: 'Tehlike',
    variant: 'danger',
    size: 'md',
  },
};

export const Outline = {
  args: {
    children: 'Çerçeve',
    variant: 'outline',
    size: 'md',
  },
};

export const WithIcon = {
  args: {
    children: 'İkonlu',
    variant: 'primary',
    size: 'md',
    icon: Plus,
  },
};

export const Disabled = {
  args: {
    children: 'Pasif',
    variant: 'primary',
    size: 'md',
    disabled: true,
  },
};

export const FullWidth = {
  args: {
    children: 'Tam genişlik',
    variant: 'primary',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs w-full">
        <Story />
      </div>
    ),
  ],
};
