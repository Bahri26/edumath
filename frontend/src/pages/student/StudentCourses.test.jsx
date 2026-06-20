import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import StudentCourses from './StudentCourses';
import { renderWithProviders } from '../../test/test-utils';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: { grade: '3. Sınıf' } })),
  },
}));

vi.mock('../../utils/studentCourseData', () => ({
  fetchStudentTopicCourses: vi.fn(() => Promise.resolve({ courses: [], classLevel: '3. Sınıf' })),
  resolveClassLevel: vi.fn(() => '3. Sınıf'),
}));

describe('StudentCourses', () => {
  it('renders main section', async () => {
    renderWithProviders(<StudentCourses />);
    expect(await screen.findByText(/ders|course/i)).toBeInTheDocument();
  });
});
