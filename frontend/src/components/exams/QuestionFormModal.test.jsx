import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi, beforeEach } from 'vitest';
import QuestionFormModal from './QuestionFormModal.jsx';
import { TestToastProvider } from '../../context/ToastContext.jsx';

import apiClient from '../../services/api';
vi.mock('../../services/api', async () => ({...(await vi.importActual('../../services/api')), default:{put:vi.fn(),post:vi.fn()}}));
beforeEach(() => {vi.clearAllMocks(); apiClient.put.mockResolvedValue({data:{data:{_id:'saved'}}}); apiClient.post.mockResolvedValue({data:{data:{_id:'saved'}}});});
const props = {
  isOpen:true, editingId:'test-question', onClose:vi.fn(),
  manualForm:{text:'Örüntünün kuralı nedir?',options:['1','2','3','4'],correctAnswer:'2',classLevel:'6. Sınıf',subject:'Matematik'},
  setManualForm:vi.fn(),mainImage:{file:null,preview:''},setMainImage:vi.fn(),onSave:vi.fn(),
};

it('renders the editor outside the transformed page container',()=>{
  render(<TestToastProvider><div data-testid="page" style={{transform:'translateY(100px)'}}><QuestionFormModal {...props}/></div></TestToastProvider>);
  const dialog=screen.getByRole('dialog',{name:'Soruyu Güncelle'});
  expect(screen.getByTestId('page')).not.toContainElement(dialog);
  expect(dialog.parentElement.parentElement).toBe(document.body);
  expect(screen.getByRole('button',{name:'Güncelle ve Kaydet'})).toBeInTheDocument();
});

it('locks background scrolling and restores it when closed',()=>{
  const onClose=vi.fn();
  const view=render(<TestToastProvider><QuestionFormModal {...props} onClose={onClose}/></TestToastProvider>);
  expect(document.body.style.overflow).toBe('hidden');
  fireEvent.keyDown(document,{key:'Escape'});
  expect(onClose).toHaveBeenCalledOnce();
  view.rerender(<TestToastProvider><QuestionFormModal {...props} isOpen={false}/></TestToastProvider>);
  expect(document.body.style.overflow).not.toBe('hidden');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('preserves five image choices and E when saving', async () => {
  render(<TestToastProvider><QuestionFormModal {...props} manualForm={{...props.manualForm,options:['10','20','30','40','50'],correctAnswer:'50',assessmentMeta:{imageRole:'diagram'}}} mainImage={{file:null,preview:'image.png'}} /></TestToastProvider>);
  expect(screen.getByRole('button',{name:'E',exact:true})).toHaveAttribute('aria-pressed','true');
  fireEvent.click(screen.getByRole('button',{name:'Güncelle ve Kaydet'}));
  await waitFor(() => expect(apiClient.put).toHaveBeenCalledOnce());
  expect(apiClient.put.mock.calls[0][1].getAll('options')).toEqual(['10','20','30','40','50']);
  expect(apiClient.put.mock.calls[0][1].get('correctAnswer')).toBe('50');
});
it('allows clearing solution and outcome', async () => {
  render(<TestToastProvider><QuestionFormModal {...props} manualForm={{...props.manualForm,solution:'Eski çözüm',learningOutcome:'Eski kazanım'}} /></TestToastProvider>);
  fireEvent.change(screen.getByLabelText('1. soru çözümü'),{target:{value:''}});
  fireEvent.change(screen.getByLabelText('1. soru kazanımı'),{target:{value:''}});
  fireEvent.click(screen.getByRole('button',{name:'Güncelle ve Kaydet'}));
  await waitFor(() => expect(apiClient.put).toHaveBeenCalledOnce());
  expect(apiClient.put.mock.calls[0][1].get('solution')).toBe('');
  expect(apiClient.put.mock.calls[0][1].get('learningOutcome')).toBe('');
});
it('retains choices across modes and protects dirty edits', () => {
  const onClose=vi.fn(); render(<TestToastProvider><QuestionFormModal {...props} onClose={onClose}/></TestToastProvider>);
  fireEvent.click(screen.getByRole('radio',{name:/Resimli/}));
  fireEvent.click(screen.getByRole('radio',{name:/Metin/}));
  expect(screen.getByLabelText('1. soru A şıkkı')).toHaveValue('1');
  fireEvent.keyDown(document,{key:'Escape'});
  expect(onClose).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Değişiklikleri bırak ve kapat'}));
  expect(onClose).toHaveBeenCalledOnce();
});
it('validates the whole group before sending any question', () => {
  render(<TestToastProvider><QuestionFormModal isOpen onClose={vi.fn()} onSave={vi.fn()}/></TestToastProvider>);
  fireEvent.click(screen.getByRole('button',{name:/Metin soru/}));
  fireEvent.click(screen.getByRole('button',{name:/Birden fazla soru/}));
  fireEvent.change(screen.getByLabelText('1. soru metni'),{target:{value:'Birinci soru'}});
  ['A','B','C','D'].forEach((letter,i) => fireEvent.change(screen.getByLabelText(`1. soru ${letter} şıkkı`),{target:{value:String(i+1)}}));
  fireEvent.click(screen.getAllByRole('button',{name:'A',exact:true})[0]);
  fireEvent.click(screen.getByRole('button',{name:'3 Soruyu Kaydet'}));
  expect(apiClient.post).not.toHaveBeenCalled();
});

it('resumes a partially saved group without reposting successful questions', async () => {
  apiClient.post.mockResolvedValueOnce({data:{data:{_id:'first'}}}).mockRejectedValueOnce(new Error('network'));
  render(<TestToastProvider><QuestionFormModal isOpen onClose={vi.fn()} onSave={vi.fn()}/></TestToastProvider>);
  fireEvent.click(screen.getByRole('button',{name:/Metin soru/}));
  fireEvent.click(screen.getByRole('button',{name:/Birden fazla soru/}));
  for (let n=1; n<=3; n++) {
    fireEvent.change(screen.getByLabelText(`${n}. soru metni`),{target:{value:`Soru ${n}`}});
    ['A','B','C','D'].forEach((letter,i) => fireEvent.change(screen.getByLabelText(`${n}. soru ${letter} şıkkı`),{target:{value:String(i+1)}}));
    fireEvent.click(screen.getAllByRole('button',{name:'A',exact:true})[n-1]);
  }
  fireEvent.click(screen.getByRole('button',{name:'3 Soruyu Kaydet'}));
  await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.getByRole('button',{name:'3 Soruyu Kaydet'})).toBeEnabled());
  expect(screen.getByLabelText('1. soru metni')).toBeDisabled();
  fireEvent.click(screen.getByRole('button',{name:'3 Soruyu Kaydet'}));
  await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(4));
  const items=apiClient.post.mock.calls.map(([,data])=>JSON.parse(data.get('assessmentMeta')).groupIndex);
  expect(items).toEqual([1,2,2,3]);
});
