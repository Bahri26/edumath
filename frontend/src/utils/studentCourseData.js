import apiClient from '../services/api';

export function resolveClassLevel(profile) {
  const g = String(profile?.grade || '').trim();
  if (!g) return '9. Sınıf';
  if (/sınıf/i.test(g)) return g;
  const n = parseInt(g, 10);
  if (Number.isFinite(n) && n >= 1 && n <= 12) return `${n}. Sınıf`;
  return '9. Sınıf';
}

const TOPIC_COLORS = [
  'indigo',
  'emerald',
  'amber',
  'sky',
  'violet',
  'rose',
  'teal',
  'orange',
];

const TOPIC_EMOJI = ['🔢', '📐', '✨', '🎯', '🧩', '📊', '🌟', '🚀'];

function progressMapFromItems(items) {
  const map = new Map();
  for (const row of items || []) {
    if (row.lessonId) map.set(String(row.lessonId), row);
  }
  return map;
}

export function buildTopicCourses(topics, progressItems) {
  const progressMap = progressMapFromItems(progressItems);

  return (topics || []).map((topic, index) => {
    const lessons = Array.isArray(topic.lessons) ? topic.lessons : [];
    const totalModules = lessons.length;
    let completedModules = 0;
    let lastLessonTitle = '';

    for (const lesson of lessons) {
      const lid = lesson._id || lesson;
      const row = progressMap.get(String(lid));
      if (row?.completed) completedModules += 1;
      if (row?.lastAttempt) lastLessonTitle = lesson.title || lastLessonTitle;
    }

    const progress =
      totalModules > 0 ? Math.round((100 * completedModules) / totalModules) : 0;

    return {
      id: topic._id,
      title: topic.name,
      progress,
      totalModules,
      completedModules,
      color: TOPIC_COLORS[index % TOPIC_COLORS.length],
      icon: TOPIC_EMOJI[index % TOPIC_EMOJI.length],
      subject: topic.subject || 'Matematik',
      classLevel: topic.classLevel,
      lastLessonTitle,
      isPattern: /örüntü/i.test(String(topic.name || '')),
    };
  });
}

export function findContinueLearning(topics, progressItems) {
  const progressMap = progressMapFromItems(progressItems);
  let best = null;

  for (const topic of topics || []) {
    for (const lesson of topic.lessons || []) {
      const lid = String(lesson._id || lesson);
      const row = progressMap.get(lid);
      if (!row?.completed) {
        return {
          course: topic.name,
          topic: lesson.title || topic.name,
          lessonId: lesson._id || lesson,
          progress: row ? Math.min(99, (row.correctCount || 0) * 10) : 0,
        };
      }
      if (row?.lastAttempt) {
        best = {
          course: topic.name,
          topic: lesson.title || topic.name,
          lessonId: lesson._id || lesson,
          progress: 100,
        };
      }
    }
  }

  if (best) return best;

  const firstTopic = topics?.[0];
  const firstLesson = firstTopic?.lessons?.[0];
  if (firstTopic && firstLesson) {
    return {
      course: firstTopic.name,
      topic: firstLesson.title || firstTopic.name,
      lessonId: firstLesson._id || firstLesson,
      progress: 0,
    };
  }

  return {
    course: '',
    topic: '',
    lessonId: null,
    progress: 0,
  };
}

export async function fetchStudentTopicCourses(profile) {
  const classLevel = resolveClassLevel(profile);
  const subject = 'Matematik';

  try {
    const [topicsRes, progressRes] = await Promise.all([
      apiClient.get('/topics', { params: { classLevel, subject } }),
      apiClient.get('/progress/lessons'),
    ]);

    const topics = Array.isArray(topicsRes.data) ? topicsRes.data : [];
    const progressItems = progressRes.data?.items || progressRes.data?.data?.items || [];

    const courses = buildTopicCourses(topics, progressItems);
    const continueLearning = findContinueLearning(topics, progressItems);

    return { courses, continueLearning, classLevel, subject, topicsEmpty: courses.length === 0 };
  } catch {
    return {
      courses: [],
      continueLearning: { course: '', topic: '', lessonId: null, progress: 0 },
      classLevel,
      subject,
      topicsEmpty: true,
    };
  }
}
