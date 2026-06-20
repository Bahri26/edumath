import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Save,
  Loader2,
  Bell,
  Moon,
  Sun,
  CheckCircle,
  Settings,
  Globe,
  ExternalLink,
  Lock,
} from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../i18n/useTranslation';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import FormField from '../../components/ui/FormField.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { SUBJECTS, CLASS_LEVELS } from '../../data/classLevelsAndDifficulties';
import { useConfirmAction } from '../../hooks/useConfirmAction';

const GRADE_OPTIONS = [...CLASS_LEVELS, 'Mezun'];

const profilePath = (r) => (r === 'teacher' ? '/teacher/profile' : '/student/profile');

const SectionHeading = ({ icon: Icon, children }) => (
  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
    {Icon ? <Icon className="text-brand-600 dark:text-brand-400 shrink-0" size={22} aria-hidden /> : null}
    {children}
  </h3>
);

const SettingsPage = ({ role = 'student' }) => {
  const { showToast } = useToast();
  const { askConfirm, ConfirmDialog } = useConfirmAction();
  const { setIsDarkMode } = useTheme();
  const { setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const pwdModalRef = useRef(null);
  useFocusTrap(pwdModalRef, showPwdModal);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    branch: '',
    grade: '',
    schoolType: 'ilkokul',
    avatar: '',
    theme: 'light',
    notifications: true,
    language: 'TR',
  });

  const syncThemeFromValue = useCallback(
    (theme) => {
      setIsDarkMode((theme || 'light') === 'dark');
    },
    [setIsDarkMode],
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/users/profile');
        const d = res.data || {};
        const theme = d.theme || 'light';
        setFormData({
          name: d.name || '',
          email: d.email || '',
          branch: d.branch || '',
          grade: d.grade || '',
          schoolType: d.schoolType || 'ilkokul',
          avatar: d.avatar || '',
          theme,
          notifications: typeof d.notifications === 'boolean' ? d.notifications : true,
          language: d.language === 'EN' ? 'EN' : 'TR',
        });
        syncThemeFromValue(theme);
        setLanguage(d.language === 'EN' ? 'EN' : 'TR');
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Profil yüklenemedi:', error?.message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    const fetchNotifications = async () => {
      try {
        setNotifLoading(true);
        const res = await apiClient.get('/notifications?limit=5');
        const list = res.data?.data ?? res.data?.notifications ?? [];
        setNotifications(Array.isArray(list) ? list : []);
        setUnreadCount(res.data?.unreadCount ?? 0);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Bildirimler yüklenemedi:', error?.message);
        }
      } finally {
        setNotifLoading(false);
      }
    };
    fetchNotifications();
  }, [syncThemeFromValue, setLanguage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrefChange = async (field, value) => {
    const previous = formData[field];
    setFormData((prev) => ({ ...prev, [field]: value }));
    try {
      await apiClient.put('/users/profile', { [field]: value });
      if (field === 'theme') {
        syncThemeFromValue(value);
      }
      if (field === 'language') {
        setLanguage(value);
      }
    } catch (error) {
      setFormData((prev) => ({ ...prev, [field]: previous }));
      if (field === 'theme') {
        syncThemeFromValue(previous);
      }
      showToast(t('settings.prefUpdateError') + ': ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        avatar: formData.avatar,
        theme: formData.theme,
        notifications: formData.notifications,
        language: formData.language,
      };
      if (role === 'teacher') {
        payload.branch = formData.branch;
      }
      if (role === 'student') {
        payload.grade = formData.grade;
        payload.schoolType = formData.schoolType;
      }
      await apiClient.put('/users/profile', payload);
      syncThemeFromValue(formData.theme);
      setLanguage(formData.language);
      showToast(t('settings.saveSuccess'), 'success');
    } catch (error) {
      showToast('Hata oluştu: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
      showToast('Tüm bildirimler okundu olarak işaretlendi.', 'success');
    } catch (error) {
      showToast('İşlem başarısız: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[40vh] gap-3" role="status" aria-live="polite">
        <Loader2 className="animate-spin text-brand-600" size={40} aria-hidden />
        <span className="text-sm text-slate-500 dark:text-slate-400">{t('settings.loading')}</span>
      </div>
    );
  }

  const isTeacher = role === 'teacher';
  const title = isTeacher ? t('settings.teacherTitle') : t('settings.studentTitle');

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h2
          className={`text-3xl font-extrabold flex items-center gap-3 ${
            role === 'student'
              ? 'bg-gradient-to-r from-amber-600 to-teal-600 bg-clip-text text-transparent dark:from-amber-400 dark:to-teal-400'
              : 'text-slate-800 dark:text-white'
          }`}
        >
          <Settings size={30} className={role === 'student' ? 'text-teal-600 dark:text-teal-400 shrink-0' : 'text-brand-600 shrink-0'} aria-hidden />
          {title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
          {isTeacher ? t('settings.teacherSubtitle') : t('settings.studentSubtitle')}
        </p>
        <Link
          to={profilePath(role)}
          className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Profil sayfasına git
          <ExternalLink size={14} aria-hidden />
        </Link>
      </div>

      <Card className="p-6 md:p-8 space-y-6">
        <div>
          <SectionHeading icon={User}>Hesap bilgileri</SectionHeading>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Ad ve e-posta giriş bilgilerinizle ilişkilidir.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Ad soyad">
              <Input type="text" name="name" value={formData.name} onChange={handleChange} autoComplete="name" />
            </FormField>
            <FormField label="E-posta">
              <Input type="email" name="email" value={formData.email} onChange={handleChange} autoComplete="email" />
            </FormField>
            {isTeacher && (
              <div className="md:col-span-2">
                <FormField label="Branş">
                  <Select name="branch" value={formData.branch} onChange={handleChange}>
                    <option value="">Seçiniz</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Branş değişikliği yönetici onayına düşebilir. Onay durumunu profil sayfasından takip edebilirsiniz.
                </p>
              </div>
            )}
            {role === 'student' && (
              <>
                <FormField label="Kademe">
                  <Select name="schoolType" value={formData.schoolType} onChange={handleChange}>
                    <option value="ilkokul">İlkokul</option>
                    <option value="ortaokul">Ortaokul</option>
                    <option value="lise">Lise</option>
                  </Select>
                </FormField>
                <FormField label="Sınıf seviyesi">
                  <Select name="grade" value={formData.grade} onChange={handleChange}>
                    <option value="">Seçiniz</option>
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <SectionHeading icon={Moon}>Görünüm</SectionHeading>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Tema tercihi bu cihazda anında uygulanır ve hesabınıza kaydedilir.</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {formData.theme === 'dark' ? 'Karanlık tema açık' : 'Açık tema'}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => handlePrefChange('theme', formData.theme === 'dark' ? 'light' : 'dark')}
                  icon={formData.theme === 'dark' ? Sun : Moon}
                >
                  {formData.theme === 'dark' ? 'Açık temaya geç' : 'Karanlık temaya geç'}
                </Button>
              </div>
            </div>
            <div>
              <SectionHeading icon={Globe}>{t('settings.languageLabel')}</SectionHeading>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t('settings.languageHint')}</p>
              <FormField label={t('settings.languageLabel')}>
                <Select
                  name="language"
                  value={formData.language}
                  onChange={(e) => {
                    const v = e.target.value;
                    handlePrefChange('language', v);
                  }}
                >
                  <option value="TR">Türkçe</option>
                  <option value="EN">English</option>
                </Select>
              </FormField>
            </div>
            <div>
              <SectionHeading icon={Bell}>Anlık bildirim tercihi</SectionHeading>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Kapatırsanız yeni uyarılar için e-posta politikasına bakın.</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {formData.notifications ? 'Bildirimler açık' : 'Bildirimler kapalı'}
                </span>
                <Button
                  type="button"
                  variant={formData.notifications ? 'outline' : 'primary'}
                  size="md"
                  onClick={() => handlePrefChange('notifications', !formData.notifications)}
                  icon={CheckCircle}
                >
                  {formData.notifications ? 'Kapat' : 'Aç'}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <SectionHeading icon={Bell}>Son bildirimler</SectionHeading>
              {unreadCount > 0 && (
                <span className="text-xs font-bold bg-brand-600 text-white px-2.5 py-1 rounded-full">{unreadCount} okunmamış</span>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
              {notifLoading ? (
                <div className="p-4 text-sm text-slate-500">Yükleniyor…</div>
              ) : notifications.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="Henüz bildirim yok"
                  description="Duyurular ve sistem mesajları burada görünür."
                  className="py-8 border-0 bg-transparent"
                />
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`p-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0 ${
                      n.isRead ? '' : 'bg-brand-50/80 dark:bg-brand-950/30'
                    }`}
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-100 flex flex-wrap items-center gap-2">
                      {n.title}
                      {!n.isRead && (
                        <span className="text-[10px] uppercase font-bold bg-brand-600 text-white px-2 py-0.5 rounded-full">Yeni</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">{n.message}</div>
                    <div className="text-xs text-slate-500 mt-2">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString('tr-TR') : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div className="flex justify-end mt-3">
                <Button type="button" variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
                  Tümünü okundu işaretle
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6 md:p-8">
        <SectionHeading icon={Lock}>Güvenlik</SectionHeading>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Şifre ve hesap yaşam döngüsü.</p>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
          <Button type="button" variant="outline" size="md" onClick={() => setShowPwdModal(true)}>
            Şifremi değiştir
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={async () => {
              const confirmed = await askConfirm({
                title: 'Hesap silinsin mi?',
                description:
                  'Hesabınız ve tüm verileriniz kalıcı olarak silinecek. Oturumunuz kapanır ve bu işlem geri alınamaz.',
              });
              if (!confirmed) return;
              try {
                await apiClient.delete('/users/delete');
                showToast('Hesabınız silindi.', 'success');
                localStorage.clear();
                window.location.href = '/';
              } catch (err) {
                showToast('Hesap silinemedi: ' + (err.response?.data?.message || err.message), 'error');
              }
            }}
          >
            Hesabımı sil
          </Button>
        </div>
      </Card>

      {showPwdModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwd-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !pwdLoading) {
              setShowPwdModal(false);
              setOldPassword('');
              setNewPassword('');
            }
          }}
        >
          <div
            ref={pwdModalRef}
            className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-600 animate-fade-in"
          >
            <h3 id="pwd-modal-title" className="font-bold text-lg mb-1 text-slate-900 dark:text-white">
              Şifre değiştir
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Mevcut şifrenizi ve yeni şifrenizi girin.</p>
            <div className="space-y-4">
              <FormField label="Eski şifre">
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  autoComplete="current-password"
                  autoFocus
                />
              </FormField>
              <FormField label="Yeni şifre">
                <Input
                  type="password"
                  placeholder="En az 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </FormField>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowPwdModal(false);
                  setOldPassword('');
                  setNewPassword('');
                }}
                disabled={pwdLoading}
              >
                İptal
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={pwdLoading || !oldPassword || !newPassword}
                onClick={async () => {
                  setPwdLoading(true);
                  try {
                    await apiClient.post('/users/change-password', { oldPassword, newPassword });
                    showToast('Şifreniz başarıyla değiştirildi.', 'success');
                    setShowPwdModal(false);
                    setOldPassword('');
                    setNewPassword('');
                  } catch (err) {
                    showToast('Şifre değiştirilemedi: ' + (err.response?.data?.message || err.message), 'error');
                  } finally {
                    setPwdLoading(false);
                  }
                }}
              >
                {pwdLoading ? 'Kaydediliyor…' : 'Kaydet'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="button" variant="primary" size="lg" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="animate-spin" size={18} aria-hidden />
              Kaydediliyor…
            </>
          ) : (
            <>
              <Save size={18} aria-hidden />
              Değişiklikleri kaydet
            </>
          )}
        </Button>
      </div>
      <ConfirmDialog />
    </div>
  );
};

export default SettingsPage;
