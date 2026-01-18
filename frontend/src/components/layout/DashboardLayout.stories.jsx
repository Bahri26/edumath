import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';
const mockAuth = { user: { name: 'Demo User', role: 'student' }, logout: () => {} };
const mockTheme = { isDarkMode: false, setIsDarkMode: () => {} };
const mockLanguage = { language: 'TR' };
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import DashboardLayout from '../../pages/DashboardLayout';
import { BookOpen, FileText, CheckCircle, Trophy, Calendar, Settings, User, LayoutGrid, Users, BarChart2 } from 'lucide-react';

export default {
  title: 'Layout/DashboardLayout',
  component: DashboardLayout,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <AuthContext.Provider value={mockAuth}>
          <ThemeContext.Provider value={mockTheme}>
            <LanguageContext.Provider value={mockLanguage}>
              <Story />
            </LanguageContext.Provider>
          </ThemeContext.Provider>
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
  { id: 'quizzes', label: 'Sınavlar', icon: FileText, path: '/student/quizzes' },
  { id: 'surveys', label: 'Anketler', icon: FileText, path: '/student/surveys' },
  { id: 'leaderboard', label: 'Sıralama', icon: Trophy, path: '/student/leaderboard' },
  { id: 'calendar', label: 'Takvim', icon: Calendar, path: '/student/calendar' },
  { id: 'settings', label: 'Ayarlar', icon: Settings, path: '/student/settings' },
  { id: 'profile', label: 'Profil', icon: User, path: '/student/profile' },
];

const teacherMenu = [
  { id: 'overview', label: 'Ana Sayfa', icon: BookOpen, path: '/teacher/overview' },
  { id: 'questions', label: 'Soru Bankası', icon: FileText, path: '/teacher/questions' },
  { id: 'exams', label: 'Sınavlar', icon: CheckCircle, path: '/teacher/exams' },
  { id: 'exercises', label: 'Egzersizler', icon: Trophy, path: '/teacher/exercises' },
  { id: 'skill-tree', label: 'Kazanım Ağacı', icon: LayoutGrid, path: '/teacher/skill-tree' },
  { id: 'student-progress', label: 'Öğrenci İlerleme', icon: Users, path: '/teacher/student-progress' },
  { id: 'reports', label: 'Raporlar', icon: BarChart2, path: '/teacher/reports' },
  { id: 'surveys', label: 'Anketler', icon: FileText, path: '/teacher/surveys' },
  { id: 'settings', label: 'Ayarlar', icon: Settings, path: '/teacher/settings' },
  { id: 'profile', label: 'Profil', icon: User, path: '/teacher/profile' },
];

const Template = (args) => <DashboardLayout {...args} />;

export const StudentDashboard = Template.bind({});
StudentDashboard.args = {
  role: 'student',
  navMenuItems: studentMenu,
};

export const TeacherDashboard = Template.bind({});
TeacherDashboard.args = {
  role: 'teacher',
  navMenuItems: teacherMenu,
};
