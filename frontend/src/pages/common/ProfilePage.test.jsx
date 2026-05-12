import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ProfilePage from './ProfilePage';
import apiClient from '../../services/api';

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
  },
}));

const baseStudent = {
  name: 'Test',
  email: 'test@example.com',
  branch: '',
  branchApproval: 'none',
  grade: '9. Sınıf',
  schoolType: 'lise',
  avatar: '',
  bio: '',
  phone: '',
};

describe('ProfilePage', () => {
  beforeEach(() => {
    apiClient.get.mockResolvedValue({ data: { ...baseStudent } });
  });

  it('renders student account and school sections', async () => {
    render(<ProfilePage role="student" />);
    expect(await screen.findByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(await screen.findByText('Hesap bilgileri')).toBeInTheDocument();
    expect(await screen.findByText('Okul bilgileri')).toBeInTheDocument();
  });

  it('renders teacher branch section', async () => {
    apiClient.get.mockResolvedValue({
      data: {
        name: 'Öğretmen',
        email: 't@example.com',
        branch: 'Matematik',
        branchApproval: 'approved',
        grade: '',
        schoolType: 'ilkokul',
        avatar: '',
        bio: '',
        phone: '',
      },
    });
    render(<ProfilePage role="teacher" />);
    expect(await screen.findByText('Branş ve erişim')).toBeInTheDocument();
  });
});
