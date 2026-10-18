import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import CreateExamModal from './CreateExamModal.jsx';
import { TestToastProvider } from '../../context/ToastContext.jsx';
import apiClient from '../../services/api';
vi.mock('../../services/api', () => ({default:{get:vi.fn(),post:vi.fn()}}));
beforeEach(() => vi.clearAllMocks());

it('shows insufficient pool counts before allowing publication', async () => {
  apiClient.get.mockResolvedValue({data:{counts:{Kolay:7,Orta:3,Zor:2},sufficient:false,excluded:4}});
  render(<TestToastProvider><CreateExamModal onClose={vi.fn()}/></TestToastProvider>);
  fireEvent.change(screen.getByLabelText('Ders'),{target:{value:'Matematik'}});
  await waitFor(() => expect(screen.getByText(/Kolay 7\/7/)).toBeInTheDocument());
  expect(screen.getByRole('button',{name:'Oluştur ve Yayınla'})).toBeDisabled();
  expect(apiClient.post).not.toHaveBeenCalled();
});

it('allows creation once all difficulty groups are sufficient', async () => {
  apiClient.get.mockResolvedValue({data:{counts:{Kolay:7,Orta:7,Zor:7},sufficient:true,excluded:0}});
  render(<TestToastProvider><CreateExamModal onClose={vi.fn()}/></TestToastProvider>);
  fireEvent.change(screen.getByLabelText('Ders'),{target:{value:'Matematik'}});
  await waitFor(() => expect(screen.getByRole('button',{name:'Oluştur ve Yayınla'})).toBeEnabled());
});
