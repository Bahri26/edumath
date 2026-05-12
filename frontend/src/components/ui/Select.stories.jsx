import React from 'react';
import Select from './Select';

export default {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export const Default = {
  render: (args) => (
    <div className="max-w-xs">
      <Select {...args}>
        <option value="">Seçiniz</option>
        <option value="a">Seçenek A</option>
        <option value="b">Seçenek B</option>
      </Select>
    </div>
  ),
  args: {},
};

export const Invalid = {
  render: () => (
    <div className="max-w-xs">
      <Select invalid defaultValue="">
        <option value="">Zorunlu</option>
        <option value="1">Bir</option>
      </Select>
    </div>
  ),
};
