import React from 'react';
import XpBar from './XpBar';

export default {
  title: 'UI/XpBar',
  component: XpBar,
  tags: ['autodocs'],
  argTypes: {
    current: { control: 'number' },
    max: { control: 'number' },
    level: { control: 'number' },
  },
};

export const Default = {
  args: {
    current: 420,
    max: 600,
    level: 7,
  },
};

export const NearlyFull = {
  name: 'Neredeyse dolu',
  args: {
    current: 580,
    max: 600,
    level: 12,
  },
};

export const JustStarted = {
  name: 'Yeni başladı',
  args: {
    current: 15,
    max: 300,
    level: 1,
  },
};
