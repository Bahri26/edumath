import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router';
import {beforeEach,expect,it,vi} from 'vitest';
import TeacherHome from './TeacherHome.jsx';
import {AuthContext} from '../../context/AuthContext';
import apiClient from '../../services/api';
vi.mock('../../services/api',()=>({default:{get:vi.fn()}}));
vi.mock('../../components/help/GuideDrawer.jsx',()=>({default:()=>null}));
const fixture={classes:['6. Sınıf'],generatedAt:'2026-10-11T10:00:00Z',stats:{totalStudents:2,measuredStudents:1,unmeasuredStudents:1,classAverage:0,activeExams:1,scheduledExams:0,reviewQuestions:0,totalQuestions:3},students:[{_id:'s1',name:'Ada',grade:'6. Sınıf',resultCount:1,averageScore:0},{_id:'s2',name:'Efe',grade:'6. Sınıf',resultCount:0,averageScore:null}],exams:[{_id:'e1',title:'Sayı örüntüleri',classLevel:'6. Sınıf',phase:'live',endAt:'2026-10-12',eligibleCount:2,participantCount:1,missingCount:1}],recentQuestions:[]};
const mount=()=>render(<MemoryRouter><AuthContext.Provider value={{user:{name:'Öğretmen'}}}><TeacherHome/></AuthContext.Provider></MemoryRouter>);
beforeEach(()=>{vi.clearAllMocks();apiClient.get.mockResolvedValue({data:fixture});});
it('separates unmeasured students from the support list and links directly to creation',async()=>{
 mount();await screen.findByText('Ada');
 expect(screen.queryByText('Efe')).not.toBeInTheDocument();
 expect(screen.getByText(/1 öğrenci için seçilen dönemde sonuç yok/)).toBeInTheDocument();
 expect(screen.getByRole('link',{name:'Sınav hazırla'})).toHaveAttribute('href','/teacher/exams?create=1');
 expect(screen.getByRole('link',{name:'Soru ekle'})).toHaveAttribute('href','/teacher/questions?create=1');
 expect(screen.getByText(/Katılım: 1\/2/)).toBeInTheDocument();
});
it('requests a consistent summary when class and period change',async()=>{
 mount();await screen.findByText('Ada');
 fireEvent.change(screen.getByLabelText('Sınıf'),{target:{value:'6. Sınıf'}});
 fireEvent.change(screen.getByLabelText('Sonuç dönemi'),{target:{value:'7'}});
 await waitFor(()=>expect(apiClient.get).toHaveBeenLastCalledWith('/teacher/dashboard-summary',{params:{classLevel:'6. Sınıf',days:'7'}}));
});
it('shows request errors without misleading zero metrics or tasks',async()=>{
 apiClient.get.mockRejectedValue(new Error('failed'));mount();
 expect(await screen.findByRole('alert')).toHaveTextContent('Genel bakış yüklenemedi');
 expect(screen.queryByText('Öncelikli işler')).not.toBeInTheDocument();
});

it('toggles mobile detail sections and flags a single result as an initial observation',async()=>{
 mount();await screen.findByText('Ada');
 const toggle=screen.getByRole('button',{name:'Öğrenci takibi (1)'});
 expect(toggle).toHaveAttribute('aria-expanded','false');
 fireEvent.click(toggle);expect(toggle).toHaveAttribute('aria-expanded','true');
 expect(screen.getByText(/Tek sonuç · ilk gözlem/)).toBeInTheDocument();
 fireEvent.click(toggle);expect(toggle).toHaveAttribute('aria-expanded','false');
 expect(screen.getByRole('link',{name:'Sınav hazırla'})).toHaveClass('bg-teal-700');
});
