import React from 'react';
import ActivityRow from './ActivityRow';

export default {
  title: 'UI/ActivityRow',
  component: ActivityRow,
  tags: ['autodocs'],
  render: (args) => (
    <table className="w-full max-w-2xl">
      <tbody>
        <ActivityRow {...args} />
      </tbody>
    </table>
  ),
};

export const HighScore = {
  name: 'Yüksek puan',
  args: {
    activity: {
      student: 'Elif Yılmaz',
      subtitle: '5. Sınıf Matematik',
      action: 'Sınavı tamamladı',
      score: 92,
      time: '5 dk önce',
      kind: 'exam',
    },
  },
};

export const LowScore = {
  name: 'Düşük puan',
  args: {
    activity: {
      student: 'Mehmet Demir',
      action: 'Sınavı tamamladı',
      score: 45,
      time: '2 saat önce',
      kind: 'exam',
    },
  },
};

export const QuestionActivity = {
  name: 'Soru çözümü',
  args: {
    activity: {
      student: 'Ayşe Kaya',
      action: 'Soru çözdü',
      kind: 'question',
      time: '10 dk önce',
    },
  },
};

export const NoResultYet = {
  name: 'Sonuç yok',
  args: {
    activity: {
      student: 'Can Öztürk',
      action: 'Sınava başladı',
      score: 0,
      time: '1 dk önce',
      kind: 'exam',
    },
  },
};
