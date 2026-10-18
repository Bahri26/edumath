import React from 'react';
import {act,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import {beforeEach,expect,it,vi} from 'vitest';
import {MemoryRouter} from 'react-router';
import QuestionBank,{QuestionCard} from './QuestionBank.jsx';
import {TestToastProvider} from '../../context/ToastContext';
import {LanguageProvider} from '../../context/LanguageContext';
import apiClient from '../../services/api';
vi.mock('../../services/api',async()=>({...await vi.importActual('../../services/api'),default:{get:vi.fn()}}));
const q=grade=>({_id:'test-'+grade,text:'Bu soru metni kartta görünmemeli',classLevel:grade,subject:'Matematik',topic:'Örüntüler',difficulty:'Orta',options:['1','2','3','4'],correctAnswer:'2'});
const wrap=children=><MemoryRouter initialEntries={['/teacher/questions?subject=Matematik&classLevel=6.+S%C4%B1n%C4%B1f']}><LanguageProvider><TestToastProvider>{children}</TestToastProvider></LanguageProvider></MemoryRouter>;
beforeEach(()=>{vi.clearAllMocks();});
it('hides the question stem on the bank card while keeping preview access',()=>{
 render(wrap(<QuestionCard question={q('6. Sınıf')} expanded={false} onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()}/>));
 expect(screen.queryByText(/Bu soru metni/)).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'Soru detayını göster'})).toBeEnabled();
});
it('preserves the URL grade and ignores a stale response after the grade changes',async()=>{
 let resolveSix;
 apiClient.get.mockImplementation((url,config)=>{
  if(url.includes('profile'))return Promise.resolve({data:{branch:'Matematik',branchApproval:'approved'}});
  if(url.includes('topics'))return Promise.resolve({data:{topics:[]}});
  if(url.includes('questions')){
   if(config.params.classLevel==='6. Sınıf')return new Promise(resolve=>{resolveSix=resolve;});
   return Promise.resolve({data:{data:[q('7. Sınıf')],total:1,totalPages:1}});
  }
  return Promise.resolve({data:{}});
 });
 render(wrap(<QuestionBank/>));
 await waitFor(()=>expect(resolveSix).toBeTypeOf('function'));
 expect(screen.getByLabelText('Sınıf')).toHaveValue('6. Sınıf');
 fireEvent.change(screen.getByLabelText('Sınıf'),{target:{value:'7. Sınıf'}});
 const card=await screen.findByRole('article');expect(within(card).getByText('7. Sınıf')).toBeInTheDocument();
 await act(async()=>{resolveSix({data:{data:[q('6. Sınıf')],total:1,totalPages:1}});});
 expect(within(screen.getByRole('article')).queryByText('6. Sınıf')).not.toBeInTheDocument();
});
