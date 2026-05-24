import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { BookOpen, FileText, CheckCircle, Trophy, Calendar, Settings, User, LayoutGrid, Users, BarChart2, ClipboardList, MessageSquare } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import DashboardLayout from '../../pages/DashboardLayout';

const mockAuth = { user: { name: 'Demo User', role: 'student' }, logout: () => {} };
const mockLanguage = { language: 'TR' };

export default {
  title: 'Layout/DashboardLayout',
  component: DashboardLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <AuthContext.Provider value={mockAuth}>
          <LanguageContext.Provider value={mockLanguage}>
            <Story />
          </LanguageContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    ),
  ],
  argTypes: {
    role: { control: 'select', options: ['student', 'teacher'] },
    navMenuItems: { control: 'object' },
  },
};

const studentMenu = [
  { id: 'home', label: 'Ana Sayfa', icon: BookOpen, path: '/student/home' },
  { id: 'courses', label: 'Derslerim', icon: BookOpen, path: '/student/courses' },
  { id: 'assignments', label: 'Ödevler', icon: CheckCircle, path: '/student/assignments' },
  { id: 'exercises', label: 'Çalışma Merkezi', icon: Trophy, path: '/student/exercises' },
  { id: 'quizzes', label: 'Sınavlar', icon: FileText, path: '/student/quizzes' },
  { id: 'calendar', label: 'Takvim', icon: Calendar, path: '/student/calendar' },
];

const studentProfileExtras = [
  { id: 'surveys', label: 'Anketler', icon: ClipboardList, path: '/student/surveys' },
  { id: 'messages', label: 'Mesajlar', icon: MessageSquare, path: '/student/messages' },
];

const teacherMenu = [
  { id: 'overview', label: 'Ana Sayfa', icon: BookOpen, path: '/teacher/overview' },
  { id: 'questions', label: 'Soru Bankası', icon: FileText, path: '/teacher/questions' },
  { id: 'exams', label: 'Sınavlar', icon: CheckCircle, path: '/teacher/exams' },
  { id: 'exercises', label: 'Egzersizler', icon: Trophy, path: '/teacher/exercises' },
  { id: 'skill-tree', label: 'Konu & ders yapısı', icon: LayoutGrid, path: '/teacher/skill-tree' },
  { id: 'student-progress', label: 'Öğrenci İlerleme', icon: Users, path: '/teacher/student-progress' },
  { id: 'reports', label: 'Raporlar', icon: BarChart2, path: '/teacher/reports' },
  { id: 'settings', label: 'Ayarlar', icon: Settings, path: '/teacher/settings' },
  { id: 'profile', label: 'Profil', icon: User, path: '/teacher/profile' },
];

const teacherProfileExtras = [
  { id: 'surveys', label: 'Anketler', icon: ClipboardList, path: '/teacher/surveys' },
];

const Template = (args) => <DashboardLayout {...args} />;

export const StudentDashboard = Template.bind({});
StudentDashboard.args = {
  role: 'student',
  navMenuItems: studentMenu,
  profileMenuExtras: studentProfileExtras,
};

export const TeacherDashboard = Template.bind({});
TeacherDashboard.args = {
  role: 'teacher',
  navMenuItems: teacherMenu,
  profileMenuExtras: teacherProfileExtras,
};
