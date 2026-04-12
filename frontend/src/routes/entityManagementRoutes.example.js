/**
 * Entity Management Routes Örneği
 * Tüm entity yönetim sayfalarının route'ları
 */

import EntityManagementPage from '../components/common/EntityManagementPage';
import ProtectedRoute from '../components/ProtectedRoute';

// Direktif: Sadece admin ve teacher'lar erişebilir
const ADMIN_TEACHER_ROLES = ['admin', 'teacher'];

export const entityManagementRoutes = [
  // Sorular Yönetimi
  {
    path: '/teacher/questions',
    element: (
      <ProtectedRoute requiredRoles={ADMIN_TEACHER_ROLES}>
        <EntityManagementPage entityType="questions" />
      </ProtectedRoute>
    ),
    name: 'Sorular Yönetimi'
  },

  // Sınavlar Yönetimi
  {
    path: '/teacher/exams',
    element: (
      <ProtectedRoute requiredRoles={ADMIN_TEACHER_ROLES}>
        <EntityManagementPage entityType="exams" />
      </ProtectedRoute>
    ),
    name: 'Sınavlar Yönetimi'
  },

  // Anketler Yönetimi
  {
    path: '/teacher/surveys',
    element: (
      <ProtectedRoute requiredRoles={ADMIN_TEACHER_ROLES}>
        <EntityManagementPage entityType="surveys" />
      </ProtectedRoute>
    ),
    name: 'Anketler Yönetimi'
  },

  // Admin Paneli için bütün bu sayfalar
  {
    path: '/admin/questions',
    element: (
      <ProtectedRoute requiredRoles={['admin']}>
        <EntityManagementPage entityType="questions" />
      </ProtectedRoute>
    ),
    name: 'Sorular (Admin)'
  },

  {
    path: '/admin/exams',
    element: (
      <ProtectedRoute requiredRoles={['admin']}>
        <EntityManagementPage entityType="exams" />
      </ProtectedRoute>
    ),
    name: 'Sınavlar (Admin)'
  },

  {
    path: '/admin/surveys',
    element: (
      <ProtectedRoute requiredRoles={['admin']}>
        <EntityManagementPage entityType="surveys" />
      </ProtectedRoute>
    ),
    name: 'Anketler (Admin)'
  }
];

/**
 * Main Router'ında Kullanım Örneği
 */
export const routerConfigExample = {
  // ... diğer routes
  children: [
    // Entity Management Routes
    ...entityManagementRoutes,

    // ... diğer routes
  ]
};

/**
 * Navigasyon Menüsü Örneği
 */
export const navigationMenuItems = [
  {
    title: 'Yönetim',
    icon: 'Settings',
    role: ['teacher', 'admin'],
    submenu: [
      { label: 'Sorular', path: '/teacher/questions', icon: 'FileText' },
      { label: 'Sınavlar', path: '/teacher/exams', icon: 'BookOpen' },
      { label: 'Anketler', path: '/teacher/surveys', icon: 'ClipboardList' }
    ]
  }
];

/**
 * API Endpoint'leri (Backend'de implementasyon gerekli)
 * 
 * QUESTIONS
 * - GET    /api/questions?page=1&limit=12&search=...&subject=...&classLevel=...&difficulty=...
 * - GET    /api/questions/:id
 * - POST   /api/questions { text, subject, classLevel, difficulty, type, options, correctAnswer, solution }
 * - PUT    /api/questions/:id { ...fields }
 * - DELETE /api/questions/:id
 * - POST   /api/questions/delete-multiple { ids: [...] }
 * 
 * EXAMS
 * - GET    /api/exams?page=1&limit=12&search=...&classLevel=...&subject=...
 * - GET    /api/exams/:id
 * - POST   /api/exams { title, description, classLevel, subject, totalQuestions, duration, startDate, endDate, questions }
 * - PUT    /api/exams/:id { ...fields }
 * - DELETE /api/exams/:id
 * - POST   /api/exams/delete-multiple { ids: [...] }
 * 
 * SURVEYS
 * - GET    /api/surveys?page=1&limit=12&search=...&classLevel=...
 * - GET    /api/surveys/:id
 * - POST   /api/surveys { title, description, classLevel, isAnonymous, startDate, endDate, questions }
 * - PUT    /api/surveys/:id { ...fields }
 * - DELETE /api/surveys/:id
 * - POST   /api/surveys/delete-multiple { ids: [...] }
 */
