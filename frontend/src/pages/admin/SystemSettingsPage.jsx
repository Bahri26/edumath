import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Database, Shield, Zap, Mail, Globe, Save } from 'lucide-react';
import api from '../../services/api';
import { ADMIN_SETTINGS_ERROR_CODES } from '../../constants/adminSettingsErrorCodes';

const ADMIN_SETTINGS_KEY = 'admin_system_settings';

const defaultSystemSettings = {
    systemName: 'EduMath',
    systemDescription: 'AI Destekli Matematik Öğrenme Platformu',
    maintenanceMode: false,
    allowRegistrations: true,
    defaultExamDuration: 60,
    maxQuestionsPerExam: 50,
    autoGrading: true,
    aiEnabled: true,
    aiModel: 'gemini-1.5-flash',
    maxAIRequestsPerDay: 100,
    requireEmailVerification: false,
    passwordMinLength: 6,
    sessionTimeout: 24,
    twoFactorEnabled: false,
    emailNotifications: true,
    examResultNotifications: true,
    announcementNotifications: true
};

const defaultCefrThresholds = {
    a2Min: 20,
    b1Min: 35,
    b2Min: 50,
    c1Min: 65,
    c2Min: 80
};

const allowedAiModels = ['gemini-1.5-flash', 'gemini-1.5-pro'];

function validateSettings(values) {
    const errors = {};

    const systemName = String(values.systemName || '').trim();
    if (systemName.length < 2 || systemName.length > 80) {
        errors.systemName = 'Sistem adı 2-80 karakter olmalı.';
    }

    const systemDescription = String(values.systemDescription || '').trim();
    if (systemDescription.length < 5 || systemDescription.length > 300) {
        errors.systemDescription = 'Sistem açıklaması 5-300 karakter olmalı.';
    }

    if (!allowedAiModels.includes(values.aiModel)) {
        errors.aiModel = 'Geçerli bir AI model seçin.';
    }

    const ranges = [
        ['defaultExamDuration', 10, 180, 'Varsayılan sınav süresi'],
        ['maxQuestionsPerExam', 5, 100, 'Maksimum soru sayısı'],
        ['maxAIRequestsPerDay', 10, 5000, 'Günlük AI istek limiti'],
        ['passwordMinLength', 6, 20, 'Minimum şifre uzunluğu'],
        ['sessionTimeout', 1, 168, 'Oturum zaman aşımı']
    ];

    for (const [key, min, max, label] of ranges) {
        const value = Number(values[key]);
        if (!Number.isFinite(value) || value < min || value > max) {
            errors[key] = `${label} ${min}-${max} arasında olmalı.`;
        }
    }

    return errors;
}

function validateCefr(values) {
    const errors = {};
    const entries = [
        ['a2Min', 'A2'],
        ['b1Min', 'B1'],
        ['b2Min', 'B2'],
        ['c1Min', 'C1'],
        ['c2Min', 'C2']
    ];

    const nums = {};
    for (const [key, label] of entries) {
        const value = Number(values[key]);
        nums[key] = value;
        if (!Number.isFinite(value) || value < 0 || value > 100) {
            errors[`cefr.${key}`] = `${label} sınırı 0-100 arasında olmalı.`;
        }
    }

    if (Object.keys(errors).length === 0) {
        const ascending = nums.a2Min < nums.b1Min && nums.b1Min < nums.b2Min && nums.b2Min < nums.c1Min && nums.c1Min < nums.c2Min;
        if (!ascending) {
            const orderMessage = 'Sıralama hatalı: A2 < B1 < B2 < C1 < C2 olmalı.';
            errors['cefr.a2Min'] = orderMessage;
            errors['cefr.b1Min'] = orderMessage;
            errors['cefr.b2Min'] = orderMessage;
            errors['cefr.c1Min'] = orderMessage;
            errors['cefr.c2Min'] = orderMessage;
            errors['cefr.order'] = orderMessage;
        }
    }

    return errors;
}

function mapBackendCodeToFieldError(code, message) {
    const mapping = {
        [ADMIN_SETTINGS_ERROR_CODES.SYSTEM_NAME_LENGTH]: { key: 'systemName', message: 'Sistem adı 2-80 karakter olmalı.' },
        [ADMIN_SETTINGS_ERROR_CODES.SYSTEM_DESCRIPTION_LENGTH]: { key: 'systemDescription', message: 'Sistem açıklaması 5-300 karakter olmalı.' },
        [ADMIN_SETTINGS_ERROR_CODES.AI_MODEL_INVALID]: { key: 'aiModel', message: 'Geçerli bir AI model seçin.' },
        [ADMIN_SETTINGS_ERROR_CODES.DEFAULT_EXAM_DURATION_RANGE]: { key: 'defaultExamDuration', message: 'Varsayılan sınav süresi 10-180 arasında olmalı.' },
        [ADMIN_SETTINGS_ERROR_CODES.MAX_QUESTIONS_PER_EXAM_RANGE]: { key: 'maxQuestionsPerExam', message: 'Maksimum soru sayısı 5-100 arasında olmalı.' },
        [ADMIN_SETTINGS_ERROR_CODES.MAX_AI_REQUESTS_PER_DAY_RANGE]: { key: 'maxAIRequestsPerDay', message: 'Günlük AI istek limiti 10-5000 arasında olmalı.' },
        [ADMIN_SETTINGS_ERROR_CODES.PASSWORD_MIN_LENGTH_RANGE]: { key: 'passwordMinLength', message: 'Minimum şifre uzunluğu 6-20 arasında olmalı.' },
        [ADMIN_SETTINGS_ERROR_CODES.SESSION_TIMEOUT_RANGE]: { key: 'sessionTimeout', message: 'Oturum zaman aşımı 1-168 arasında olmalı.' }
    };

    const matched = mapping[code];
    if (!matched) return null;
    return { [matched.key]: matched.message || message || 'Geçersiz değer.' };
}

const SystemSettingsPage = () => {
    const [settings, setSettings] = useState(defaultSystemSettings);
    const [cefrThresholds, setCefrThresholds] = useState(defaultCefrThresholds);

    const [saveStatus, setSaveStatus] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const [cefrRes, adminSettingsRes] = await Promise.all([
                    api.get('/exams/level-thresholds'),
                    api.get(`/system_settings/by-key/${ADMIN_SETTINGS_KEY}`).catch((err) => {
                        if (err?.response?.status === 404) return { data: null };
                        throw err;
                    })
                ]);

                const data = cefrRes?.data?.data || defaultCefrThresholds;
                setCefrThresholds({
                    a2Min: Number(data.a2Min ?? defaultCefrThresholds.a2Min),
                    b1Min: Number(data.b1Min ?? defaultCefrThresholds.b1Min),
                    b2Min: Number(data.b2Min ?? defaultCefrThresholds.b2Min),
                    c1Min: Number(data.c1Min ?? defaultCefrThresholds.c1Min),
                    c2Min: Number(data.c2Min ?? defaultCefrThresholds.c2Min)
                });

                const rawValue = adminSettingsRes?.data?.setting_value;
                if (rawValue) {
                    try {
                        const parsed = JSON.parse(rawValue);
                        setSettings({ ...defaultSystemSettings, ...(parsed || {}) });
                    } catch (_) {
                        setSettings(defaultSystemSettings);
                    }
                }
            } catch (_) {
                setErrorMessage('Ayarlar yüklenemedi.');
            }
        };

        loadSettings();
    }, []);

    const handleChange = (key, value) => {
        setErrorMessage('');
        setFieldErrors((prev) => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
        setSettings({ ...settings, [key]: value });
    };

    const handleCefrChange = (key, value) => {
        setErrorMessage('');
        setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[`cefr.${key}`];
            delete next['cefr.order'];
            return next;
        });
        setCefrThresholds((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setErrorMessage('');
        const settingsErrors = validateSettings(settings);
        const cefrErrors = validateCefr(cefrThresholds);
        const allErrors = { ...settingsErrors, ...cefrErrors };
        setFieldErrors(allErrors);

        if (Object.keys(allErrors).length > 0) {
            setSaveStatus('');
            setErrorMessage('Bazı alanlarda doğrulama hatası var. Lütfen işaretli alanları düzeltin.');
            return;
        }

        setSaveStatus('saving');

        try {
            await Promise.all([
                api.put('/exams/level-thresholds', {
                    a2Min: Number(cefrThresholds.a2Min),
                    b1Min: Number(cefrThresholds.b1Min),
                    b2Min: Number(cefrThresholds.b2Min),
                    c1Min: Number(cefrThresholds.c1Min),
                    c2Min: Number(cefrThresholds.c2Min)
                }),
                api.put(`/system_settings/by-key/${ADMIN_SETTINGS_KEY}`, {
                    setting_value: JSON.stringify(settings)
                })
            ]);

            setSaveStatus('success');
            setTimeout(() => setSaveStatus(''), 3000);
        } catch (err) {
            setSaveStatus('');
            const backendCode = err?.response?.data?.code;
            const backendMessage = err?.response?.data?.error || 'Kaydetme başarısız oldu.';
            const mappedFieldError = mapBackendCodeToFieldError(backendCode, backendMessage);
            if (mappedFieldError) {
                setFieldErrors((prev) => ({ ...prev, ...mappedFieldError }));
                setErrorMessage('Bir veya daha fazla alan backend doğrulamasından geçemedi.');
            } else {
                setErrorMessage(backendMessage);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 md:p-10">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-2">
                        ⚙️ Sistem Ayarları
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400">
                        Platform genelinde geçerli ayarları yönet
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saveStatus === 'saving'}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-indigo-900 disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {saveStatus === 'saving' ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
            </div>

            {/* Success Message */}
            {saveStatus === 'success' && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 px-6 py-4 rounded-xl mb-6 flex items-center gap-3"
                >
                    <span className="text-2xl">✅</span>
                    <span className="font-bold">Ayarlar başarıyla kaydedildi!</span>
                </motion.div>
            )}

            {errorMessage && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 px-6 py-4 rounded-xl mb-6 flex items-center gap-3"
                >
                    <span className="text-2xl">⚠️</span>
                    <span className="font-bold">{errorMessage}</span>
                </motion.div>
            )}

            <div className="grid gap-6">
                {/* Genel Ayarlar */}
                <SettingsSection 
                    icon={<Globe />} 
                    title="Genel Ayarlar" 
                    description="Platform geneli temel ayarlar"
                >
                    <InputField
                        label="Sistem Adı"
                        value={settings.systemName}
                        onChange={(e) => handleChange('systemName', e.target.value)}
                        error={fieldErrors.systemName}
                    />
                    <InputField
                        label="Sistem Açıklaması"
                        value={settings.systemDescription}
                        onChange={(e) => handleChange('systemDescription', e.target.value)}
                        error={fieldErrors.systemDescription}
                    />
                    <ToggleField
                        label="Bakım Modu"
                        description="Aktif edilirse kullanıcılar sisteme giremez"
                        checked={settings.maintenanceMode}
                        onChange={(checked) => handleChange('maintenanceMode', checked)}
                    />
                    <ToggleField
                        label="Yeni Kayıtlar"
                        description="Yeni kullanıcı kayıtlarına izin ver"
                        checked={settings.allowRegistrations}
                        onChange={(checked) => handleChange('allowRegistrations', checked)}
                    />
                </SettingsSection>

                {/* Sınav Ayarları */}
                <SettingsSection 
                    icon={<Database />} 
                    title="Sınav Ayarları" 
                    description="Sınav sistemi yapılandırması"
                >
                    <NumberField
                        label="Varsayılan Sınav Süresi (dakika)"
                        value={settings.defaultExamDuration}
                        onChange={(value) => handleChange('defaultExamDuration', value)}
                        min={10}
                        max={180}
                        error={fieldErrors.defaultExamDuration}
                    />
                    <NumberField
                        label="Sınav Başına Maksimum Soru"
                        value={settings.maxQuestionsPerExam}
                        onChange={(value) => handleChange('maxQuestionsPerExam', value)}
                        min={5}
                        max={100}
                        error={fieldErrors.maxQuestionsPerExam}
                    />
                    <ToggleField
                        label="Otomatik Puanlama"
                        description="Sınavlar otomatik olarak puanlansın"
                        checked={settings.autoGrading}
                        onChange={(checked) => handleChange('autoGrading', checked)}
                    />
                    <NumberField
                        label="CEFR A2 Başlangıç (%)"
                        value={cefrThresholds.a2Min}
                        onChange={(value) => handleCefrChange('a2Min', value)}
                        min={0}
                        max={100}
                        error={fieldErrors['cefr.a2Min']}
                    />
                    <NumberField
                        label="CEFR B1 Başlangıç (%)"
                        value={cefrThresholds.b1Min}
                        onChange={(value) => handleCefrChange('b1Min', value)}
                        min={0}
                        max={100}
                        error={fieldErrors['cefr.b1Min']}
                    />
                    <NumberField
                        label="CEFR B2 Başlangıç (%)"
                        value={cefrThresholds.b2Min}
                        onChange={(value) => handleCefrChange('b2Min', value)}
                        min={0}
                        max={100}
                        error={fieldErrors['cefr.b2Min']}
                    />
                    <NumberField
                        label="CEFR C1 Başlangıç (%)"
                        value={cefrThresholds.c1Min}
                        onChange={(value) => handleCefrChange('c1Min', value)}
                        min={0}
                        max={100}
                        error={fieldErrors['cefr.c1Min']}
                    />
                    <NumberField
                        label="CEFR C2 Başlangıç (%)"
                        value={cefrThresholds.c2Min}
                        onChange={(value) => handleCefrChange('c2Min', value)}
                        min={0}
                        max={100}
                        error={fieldErrors['cefr.c2Min']}
                    />
                    {fieldErrors['cefr.order'] && (
                        <p className="text-sm text-red-600 dark:text-red-400 -mt-2">{fieldErrors['cefr.order']}</p>
                    )}
                </SettingsSection>

                {/* AI Ayarları */}
                <SettingsSection 
                    icon={<Zap />} 
                    title="AI Ayarları" 
                    description="Yapay zeka özelliklerini yapılandır"
                >
                    <ToggleField
                        label="AI Özellikleri"
                        description="AI destekli özellikleri aktif et"
                        checked={settings.aiEnabled}
                        onChange={(checked) => handleChange('aiEnabled', checked)}
                    />
                    <SelectField
                        label="AI Model"
                        value={settings.aiModel}
                        onChange={(value) => handleChange('aiModel', value)}
                        error={fieldErrors.aiModel}
                        options={[
                            { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Hızlı)' },
                            { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Gelişmiş)' }
                        ]}
                    />
                    <NumberField
                        label="Günlük Maksimum AI İstek"
                        value={settings.maxAIRequestsPerDay}
                        onChange={(value) => handleChange('maxAIRequestsPerDay', value)}
                        min={10}
                        max={5000}
                        error={fieldErrors.maxAIRequestsPerDay}
                    />
                </SettingsSection>

                {/* Güvenlik Ayarları */}
                <SettingsSection 
                    icon={<Shield />} 
                    title="Güvenlik Ayarları" 
                    description="Güvenlik ve kimlik doğrulama ayarları"
                >
                    <ToggleField
                        label="Email Doğrulama"
                        description="Kayıtta email doğrulaması zorunlu olsun"
                        checked={settings.requireEmailVerification}
                        onChange={(checked) => handleChange('requireEmailVerification', checked)}
                    />
                    <NumberField
                        label="Minimum Şifre Uzunluğu"
                        value={settings.passwordMinLength}
                        onChange={(value) => handleChange('passwordMinLength', value)}
                        min={6}
                        max={20}
                        error={fieldErrors.passwordMinLength}
                    />
                    <NumberField
                        label="Oturum Zaman Aşımı (saat)"
                        value={settings.sessionTimeout}
                        onChange={(value) => handleChange('sessionTimeout', value)}
                        min={1}
                        max={168}
                        error={fieldErrors.sessionTimeout}
                    />
                    <ToggleField
                        label="İki Faktörlü Doğrulama"
                        description="2FA sistemini aktif et (Yakında)"
                        checked={settings.twoFactorEnabled}
                        onChange={(checked) => handleChange('twoFactorEnabled', checked)}
                        disabled
                    />
                </SettingsSection>

                {/* Bildirim Ayarları */}
                <SettingsSection 
                    icon={<Mail />} 
                    title="Bildirim Ayarları" 
                    description="Email ve sistem bildirimleri"
                >
                    <ToggleField
                        label="Email Bildirimleri"
                        description="Genel email bildirimlerini aktif et"
                        checked={settings.emailNotifications}
                        onChange={(checked) => handleChange('emailNotifications', checked)}
                    />
                    <ToggleField
                        label="Sınav Sonuç Bildirimleri"
                        description="Öğrencilere sınav sonuçları otomatik gönderilsin"
                        checked={settings.examResultNotifications}
                        onChange={(checked) => handleChange('examResultNotifications', checked)}
                    />
                    <ToggleField
                        label="Duyuru Bildirimleri"
                        description="Yeni duyurular için email gönder"
                        checked={settings.announcementNotifications}
                        onChange={(checked) => handleChange('announcementNotifications', checked)}
                    />
                </SettingsSection>
            </div>
        </div>
    );
};

// Helper Components
const SettingsSection = ({ icon, title, description, children }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gray-50 dark:bg-slate-700/50 px-6 py-4 flex items-center gap-3 border-b border-gray-200 dark:border-slate-700">
            <div className="text-indigo-600 dark:text-indigo-400">{icon}</div>
            <div>
                <h3 className="font-bold text-gray-800 dark:text-white">{title}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">{description}</p>
            </div>
        </div>
        <div className="p-6 space-y-6">
            {children}
        </div>
    </div>
);

const InputField = ({ label, value, onChange, error }) => (
    <div>
        <label className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 block">{label}</label>
        <input
            type="text"
            value={value}
            onChange={onChange}
            className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border rounded-lg text-gray-800 dark:text-white focus:ring-2 outline-none ${error ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-indigo-500'}`}
        />
        {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
    </div>
);

const NumberField = ({ label, value, onChange, min, max, error }) => (
    <div>
        <label className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 block">
            {label} <span className="text-gray-400 text-xs">({min}-{max})</span>
        </label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border rounded-lg text-gray-800 dark:text-white focus:ring-2 outline-none ${error ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-indigo-500'}`}
        />
        {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
    </div>
);

const SelectField = ({ label, value, onChange, options, error }) => (
    <div>
        <label className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 block">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border rounded-lg text-gray-800 dark:text-white focus:ring-2 outline-none ${error ? 'border-red-400 focus:ring-red-500' : 'border-gray-300 dark:border-slate-600 focus:ring-indigo-500'}`}
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        {error && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>}
    </div>
);

const ToggleField = ({ label, description, checked, onChange, disabled }) => (
    <div className="flex items-center justify-between">
        <div className="flex-1">
            <label className="text-sm font-bold text-gray-700 dark:text-slate-300 block">{label}</label>
            <p className="text-xs text-gray-500 dark:text-slate-400">{description}</p>
        </div>
        <button
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            className={`relative w-14 h-8 rounded-full transition ${checked
                ? 'bg-indigo-600'
                : 'bg-gray-300 dark:bg-slate-600'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <span
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'
                    }`}
            />
        </button>
    </div>
);

export default SystemSettingsPage;
