import { useMemo } from 'react';
import {
  BookOpen, FileText, CheckCircle, Trophy, Users, BarChart2,
  Calendar, MessageSquare, ClipboardList, LayoutGrid,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

export function useTeacherNavItems() {
  const { t } = useTranslation();
  return useMemo(
    () => [
      { id: 'overview', label: t('nav.teacherOverview'), icon: BookOpen, path: '/teacher/overview' },
      { id: 'questions', label: t('nav.teacherQuestions'), icon: FileText, path: '/teacher/questions' },
      { id: 'exams', label: t('nav.teacherExams'), icon: CheckCircle, path: '/teacher/exams' },
      { id: 'exercises', label: t('nav.teacherExercises'), icon: Trophy, path: '/teacher/exercises' },
      { id: 'skill-tree', label: t('nav.teacherSkillTree'), icon: LayoutGrid, path: '/teacher/skill-tree' },
      { id: 'student-progress', label: t('nav.teacherProgress'), icon: Users, path: '/teacher/student-progress' },
      { id: 'reports', label: t('nav.teacherReports'), icon: BarChart2, path: '/teacher/reports' },
    ],
    [t],
  );
}

export function useTeacherProfileExtras() {
  const { t } = useTranslation();
  return useMemo(
    () => [{ id: 'surveys', label: t('nav.teacherSurveys'), icon: ClipboardList, path: '/teacher/surveys' }],
    [t],
  );
}

export function useStudentNavItems() {
  const { t } = useTranslation();
  return useMemo(
    () => [
      { id: 'home', label: t('nav.studentHome'), icon: BookOpen, path: '/student/home' },
      { id: 'courses', label: t('nav.studentCourses'), icon: BookOpen, path: '/student/courses' },
      { id: 'assignments', label: t('nav.studentAssignments'), icon: CheckCircle, path: '/student/assignments' },
      { id: 'exercises', label: t('nav.studentStudyHub'), icon: Trophy, path: '/student/exercises' },
      { id: 'quizzes', label: t('nav.studentQuizzes'), icon: FileText, path: '/student/quizzes' },
      { id: 'calendar', label: t('nav.studentCalendar'), icon: Calendar, path: '/student/calendar' },
    ],
    [t],
  );
}

export function useStudentProfileExtras() {
  const { t } = useTranslation();
  return useMemo(
    () => [
      { id: 'surveys', label: t('nav.studentSurveys'), icon: FileText, path: '/student/surveys' },
      { id: 'messages', label: t('nav.studentMessages'), icon: MessageSquare, path: '/student/messages' },
    ],
    [t],
  );
}
