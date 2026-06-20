import { APP_SHELL } from './appShell';

const PROGRESS = {
  TR: {
    title: 'Öğrenci takibi',
    subtitle: 'Ders bazlı quiz ilerlemesi ve son deneme tarihleri.',
    classList: 'Sınıf listesi',
    searchPlaceholder: 'İsim veya e-posta ara…',
    noStudents: 'Henüz kayıtlı öğrenci yok.',
    rosterEmptyHint:
      'Liste, sizin oluşturduğunuz sınav, egzersiz, ödev veya anketi tamamlayan öğrencilerden oluşur. Sadece müfredat ders quiz’i çözenler burada otomatik görünmez.',
    loadError: 'Öğrenci listesi yüklenemedi.',
    progressError: 'İlerleme verisi alınamadı.',
    selectPrompt: 'Soldan bir öğrenci seçin',
    selectHint: 'Quiz doğru/yanlış sayıları ve XP burada listelenir.',
    invalidStudent: 'Bu öğrenci sınıfınızda bulunamadı.',
    lessons: 'Dersler',
    noProgress: 'Bu öğrenci için henüz ders ilerlemesi yok.',
    loadingProgress: 'İlerleme yükleniyor…',
    correctCol: 'Doğru',
    wrongCol: 'Yanlış',
    summaryLessons: 'Ders sayısı',
    summaryCorrect: 'Toplam doğru',
    summaryWrong: 'Toplam yanlış',
    summaryXp: 'Toplam XP',
    accuracy: 'Quiz isabeti',
    grade: 'Sınıf',
    avgShort: 'Ort.',
    studentsCount: (n) => `${n} öğrenci`,
    clearSelection: 'Seçimi kaldır',
    classAvg: 'Sınıf ort.',
    exercises: 'Egzersizler',
    noExercises: 'Bu öğrenci için egzersiz kaydı yok.',
    exerciseScore: 'Puan',
    exerciseTime: 'Süre',
    exerciseStatus: 'Durum',
    summaryExercises: 'Egzersiz',
    summaryExerciseTime: 'Egzersiz süresi',
    questionsDone: 'Soru',
    statusCompleted: 'Tamamlandı',
    statusStarted: 'Devam ediyor',
    statusAbandoned: 'Yarım bırakıldı',
    correctPct: (pct) => `${pct}% doğru`,
    correctPctEn: (pct) => `${pct}% correct`,
  },
  EN: {
    title: 'Student progress',
    subtitle: 'Per-lesson quiz stats and last attempt times.',
    classList: 'Class roster',
    searchPlaceholder: 'Search name or email…',
    noStudents: 'No students enrolled yet.',
    rosterEmptyHint:
      'The roster is built from students who completed your exam, exercise, assignment, or survey. Students who only solve built-in lesson quizzes are not linked here automatically.',
    loadError: 'Could not load the roster.',
    progressError: 'Could not load progress.',
    selectPrompt: 'Pick a student on the left',
    selectHint: 'Correct/wrong counts and XP appear here.',
    invalidStudent: 'This student is not in your class.',
    lessons: 'Lessons',
    noProgress: 'No lesson progress for this student yet.',
    loadingProgress: 'Loading progress…',
    correctCol: 'Correct',
    wrongCol: 'Wrong',
    summaryLessons: 'Lessons',
    summaryCorrect: 'Total correct',
    summaryWrong: 'Total wrong',
    summaryXp: 'Total XP',
    accuracy: 'Quiz accuracy',
    grade: 'Grade',
    avgShort: 'Avg.',
    studentsCount: (n) => `${n} students`,
    clearSelection: 'Clear selection',
    classAvg: 'Class avg.',
    exercises: 'Exercises',
    noExercises: 'No exercise records for this student.',
    exerciseScore: 'Score',
    exerciseTime: 'Time',
    exerciseStatus: 'Status',
    summaryExercises: 'Exercises',
    summaryExerciseTime: 'Exercise time',
    questionsDone: 'Questions',
    statusCompleted: 'Completed',
    statusStarted: 'In progress',
    statusAbandoned: 'Abandoned',
    correctPct: (pct) => `${pct}% correct`,
    correctPctEn: (pct) => `${pct}% correct`,
  },
};

const SETTINGS = {
  TR: {
    loading: 'Ayarlar yükleniyor…',
    studentTitle: 'Öğrenci ayarları',
    teacherTitle: 'Öğretmen ayarları',
    studentSubtitle: 'Hesap, görünüm ve bildirim tercihlerinizi buradan yönetebilirsiniz.',
    teacherSubtitle:
      'Hesap bilgileri burada; branş onayı ve detaylı profil alanları için profil sayfasını kullanın.',
    languageLabel: 'Dil',
    languageHint: 'Arayüz dil tercihi (desteklenen içeriklerde).',
    saveSuccess: 'Bilgileriniz başarıyla güncellendi.',
    prefUpdateError: 'Ayar güncellenemedi',
  },
  EN: {
    loading: 'Loading settings…',
    studentTitle: 'Student settings',
    teacherTitle: 'Teacher settings',
    studentSubtitle: 'Manage account, appearance, and notification preferences here.',
    teacherSubtitle:
      'Account details live here; use the profile page for branch approval and extended fields.',
    languageLabel: 'Language',
    languageHint: 'Interface language (where supported).',
    saveSuccess: 'Your profile was updated successfully.',
    prefUpdateError: 'Could not update preference',
  },
};

const ADMIN = {
  TR: {
    tableScrollHint: 'Tabloyu görmek için yatay kaydırın →',
  },
  EN: {
    tableScrollHint: 'Swipe horizontally to see the full table →',
  },
};

/** Unified message catalog: shell (flat) + nested sections. */
export const MESSAGES = {
  TR: { ...APP_SHELL.TR, progress: PROGRESS.TR, settings: SETTINGS.TR, admin: ADMIN.TR },
  EN: { ...APP_SHELL.EN, progress: PROGRESS.EN, settings: SETTINGS.EN, admin: ADMIN.EN },
};

export function lookupMessage(catalog, key) {
  if (!key) return undefined;
  return String(key)
    .split('.')
    .reduce((acc, part) => (acc != null ? acc[part] : undefined), catalog);
}

export function formatMessage(value, params) {
  const resolved = typeof value === 'function' ? value(params) : value;
  if (resolved == null) return '';
  if (!params || typeof resolved !== 'string') return String(resolved);
  return resolved.replace(/\{(\w+)\}/g, (_, k) =>
    params[k] != null ? String(params[k]) : `{${k}}`,
  );
}
