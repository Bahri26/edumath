/**
 * Varsayılan panel yolu — giriş sonrası ve yetkisiz rota düzeltmelerinde kullanılır.
 */
export function getHomePathForRole(role) {
  if (role === 'admin') return '/admin';
  if (role === 'teacher') return '/teacher/overview';
  if (role === 'student') return '/student/home';
  return '/';
}
