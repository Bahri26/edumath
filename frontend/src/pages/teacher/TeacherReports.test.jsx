import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import TeacherReports from './TeacherReports';
import { renderWithProviders } from '../../test/test-utils';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock('../../services/teacherService', () => ({
  getClassReports: vi.fn(() => Promise.resolve({
    topicPerformance: [],
    dailyTrend: [],
    students: [],
  })),
}));

describe('TeacherReports', () => {
  it('renders main section', async () => {
    renderWithProviders(<TeacherReports />);
    expect(await screen.findByRole('heading', { name: /sınıf raporları/i })).toBeInTheDocument();
  });
});
