import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Layers,
  Pencil,
  Plus,
  Trash2,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { LanguageContext } from '../../context/LanguageContext';
import Card from '../../components/ui/Card.jsx';
import { CLASS_LEVELS, SUBJECTS } from '../../data/classLevelsAndDifficulties';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import TeacherPageShell from '../../components/teacher/TeacherPageShell.jsx';

const COPY = {
  TR: {
    title: 'Konu & ders yapısı',
    subtitle:
      'Öğrenci “Konu Ağacı” sayfasında göreceği konular ve dersleri buradan düzenlersiniz. Bu ekran görsel ağ değil; müfredat hiyerarşisidir.',
    classLabel: 'Sınıf',
    subjectLabel: 'Ders',
    newTopicPh: 'Yeni konu adı',
    addTopic: 'Konu ekle',
    empty: 'Bu sınıf ve ders için henüz konu yok. Yukarıdan ekleyebilirsiniz.',
    addLesson: 'Ders ekle',
    save: 'Kaydet',
    cancel: 'İptal',
    lessonPh: 'Ders adı',
    moveUp: 'Yukarı taşı',
    moveDown: 'Aşağı taşı',
    edit: 'Düzenle',
    deleteTopic: 'Konuyu sil',
    deleteLesson: 'Dersi sil',
    confirmTopicTitle: 'Konu silinsin mi?',
    confirmLessonTitle: 'Ders silinsin mi?',
    confirmTopic: 'Bu konu ve içindeki tüm dersler kalıcı olarak silinecek. Öğrenci ilerlemesi de kaldırılır. Bu işlem geri alınamaz.',
    confirmLesson: 'Bu ders kalıcı olarak silinecek. Bu derse ait öğrenci ilerlemesi de kaldırılır. Bu işlem geri alınamaz.',
    topicOrderHint: 'Konu sırası öğrenci listesindeki görünümü etkiler.',
    lessonOrderHint: 'Ders sırası öğrenci konu kartındaki sırayı belirler.',
    live: 'Canlı düzenleme',
  },
  EN: {
    title: 'Topics & lessons',
    subtitle:
      'Manage the topics and lessons students see on “Topic tree”. This is curriculum structure, not a visual graph.',
    classLabel: 'Grade',
    subjectLabel: 'Subject',
    newTopicPh: 'New topic name',
    addTopic: 'Add topic',
    empty: 'No topics yet for this grade and subject. Add one above.',
    addLesson: 'Add lesson',
    save: 'Save',
    cancel: 'Cancel',
    lessonPh: 'Lesson title',
    moveUp: 'Move up',
    moveDown: 'Move down',
    edit: 'Edit',
    deleteTopic: 'Delete topic',
    deleteLesson: 'Delete lesson',
    confirmTopicTitle: 'Delete this topic?',
    confirmLessonTitle: 'Delete this lesson?',
    confirmTopic: 'This topic and all its lessons will be permanently removed. Student progress will also be deleted. This cannot be undone.',
    confirmLesson: 'This lesson will be permanently removed. Student progress for it will also be deleted. This cannot be undone.',
    topicOrderHint: 'Topic order affects how students see the list.',
    lessonOrderHint: 'Lesson order is shown on the student topic card.',
    live: 'Live editing',
  },
};

const sortedLessons = (lessons) =>
  [...(lessons || [])].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

export default function SkillTreeBuilder() {
  const { language } = useContext(LanguageContext);
  const { showToast } = useToast();
  const { askConfirm, ConfirmDialog } = useConfirmAction();
  const t = COPY[language] || COPY.TR;

  const [classLevel, setClassLevel] = useState('9. Sınıf');
  const [subject, setSubject] = useState('Matematik');
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingLessonFor, setAddingLessonFor] = useState(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editTopicName, setEditTopicName] = useState('');
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');

  const bump = useCallback(() => setRefresh((r) => !r), []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setLoading(true);
    });
    apiClient
      .get(`/topics?classLevel=${encodeURIComponent(classLevel)}&subject=${encodeURIComponent(subject)}`)
      .then((res) => {
        if (active) setTopics(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (active) {
          setTopics([]);
          showToast(language === 'EN' ? 'Could not load topics' : 'Konular yüklenemedi', 'error');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [classLevel, subject, refresh, showToast, language]);

  const sortedTopics = useMemo(
    () => [...topics].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)),
    [topics]
  );

  const addTopic = async () => {
    const name = newTopic.trim();
    if (!name) {
      showToast(language === 'EN' ? 'Topic name required' : 'Konu adı boş olamaz', 'error');
      return;
    }
    try {
      await apiClient.post('/topics', { name, classLevel, subject });
      setNewTopic('');
      bump();
      showToast(language === 'EN' ? 'Topic added' : 'Konu eklendi', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || (language === 'EN' ? 'Could not add topic' : 'Konu eklenemedi'), 'error');
    }
  };

  const addLesson = async (topicId) => {
    const title = newLessonTitle.trim();
    if (!title) {
      showToast(language === 'EN' ? 'Lesson title required' : 'Ders adı boş olamaz', 'error');
      return;
    }
    try {
      await apiClient.post(`/topics/${topicId}/lessons`, { title });
      setNewLessonTitle('');
      setAddingLessonFor(null);
      bump();
      showToast(language === 'EN' ? 'Lesson added' : 'Ders eklendi', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || (language === 'EN' ? 'Could not add lesson' : 'Ders eklenemedi'), 'error');
    }
  };

  const saveTopicName = async (topicId) => {
    const name = editTopicName.trim();
    if (!name) return;
    try {
      await apiClient.patch(`/topics/${topicId}`, { name });
      setEditingTopicId(null);
      bump();
      showToast(language === 'EN' ? 'Topic updated' : 'Konu güncellendi', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || (language === 'EN' ? 'Update failed' : 'Güncellenemedi'), 'error');
    }
  };

  const saveLessonTitle = async (lessonId) => {
    const title = editLessonTitle.trim();
    if (!title) return;
    try {
      await apiClient.patch(`/lessons/${lessonId}`, { title });
      setEditingLessonId(null);
      bump();
      showToast(language === 'EN' ? 'Lesson updated' : 'Ders güncellendi', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || (language === 'EN' ? 'Update failed' : 'Güncellenemedi'), 'error');
    }
  };

  const deleteTopic = async (topicId) => {
    const confirmed = await askConfirm({
      title: t.confirmTopicTitle,
      description: t.confirmTopic,
    });
    if (!confirmed) return;
    try {
      await apiClient.delete(`/topics/${topicId}`);
      bump();
      showToast(language === 'EN' ? 'Topic deleted' : 'Konu silindi', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || (language === 'EN' ? 'Delete failed' : 'Silinemedi'), 'error');
    }
  };

  const deleteLesson = async (lessonId) => {
    const confirmed = await askConfirm({
      title: t.confirmLessonTitle,
      description: t.confirmLesson,
    });
    if (!confirmed) return;
    try {
      await apiClient.delete(`/lessons/${lessonId}`);
      bump();
      showToast(language === 'EN' ? 'Lesson deleted' : 'Ders silindi', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || (language === 'EN' ? 'Delete failed' : 'Silinemedi'), 'error');
    }
  };

  const reorderTopics = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= sortedTopics.length) return;
    const row = [...sortedTopics];
    const [moved] = row.splice(fromIndex, 1);
    row.splice(toIndex, 0, moved);
    const orderedTopicIds = row.map((x) => x._id);
    try {
      await apiClient.post('/topics/reorder', { classLevel, subject, orderedTopicIds });
      bump();
    } catch (err) {
      showToast(err?.response?.data?.message || (language === 'EN' ? 'Reorder failed' : 'Sıra güncellenemedi'), 'error');
    }
  };

  const reorderLessons = async (topicId, lessons, fromIndex, toIndex) => {
    const row = sortedLessons(lessons);
    if (toIndex < 0 || toIndex >= row.length) return;
    const next = [...row];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    try {
      await apiClient.patch(`/topics/${topicId}/lesson-order`, {
        orderedLessonIds: next.map((l) => l._id),
      });
      bump();
    } catch (err) {
      showToast(err?.response?.data?.message || (language === 'EN' ? 'Reorder failed' : 'Sıra güncellenemedi'), 'error');
    }
  };

  return (
    <TeacherPageShell
      maxWidthClass="max-w-5xl"
      title={t.title}
      subtitle={t.subtitle}
    >
      <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 dark:bg-teal-950/50 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 -mt-2">
        <Sparkles size={14} aria-hidden />
        {t.live}
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row flex-wrap gap-3 lg:items-end">
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t.classLabel}
            </label>
            <select
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              aria-label={t.classLabel}
            >
              {CLASS_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t.subjectLabel}
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              aria-label={t.subjectLabel}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t.newTopicPh}
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder={t.newTopicPh}
                className="flex-1 min-w-[180px] rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                aria-label={t.newTopicPh}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTopic();
                  }
                }}
              />
              <button
                type="button"
                onClick={addTopic}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-500/25 hover:bg-teal-700 transition-colors"
              >
                <Plus size={16} aria-hidden />
                {t.addTopic}
              </button>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
          <GraduationCap size={14} className="shrink-0 mt-0.5 text-slate-400" aria-hidden />
          {t.topicOrderHint}
        </p>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200/60 dark:border-slate-700" />
          ))}
        </div>
      ) : sortedTopics.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <Layers className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={40} aria-hidden />
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t.empty}</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {sortedTopics.map((topic, topicIndex) => {
            const lessonsList = sortedLessons(topic.lessons);
            return (
            <Card key={topic._id} className="p-0 overflow-hidden border-slate-200 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 px-4 py-4 sm:px-5">
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 dark:border-slate-600 p-2 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30"
                    aria-label={t.moveUp}
                    disabled={topicIndex === 0}
                    onClick={() => reorderTopics(topicIndex, topicIndex - 1)}
                  >
                    <ChevronUp size={18} aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 dark:border-slate-600 p-2 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30"
                    aria-label={t.moveDown}
                    disabled={topicIndex === sortedTopics.length - 1}
                    onClick={() => reorderTopics(topicIndex, topicIndex + 1)}
                  >
                    <ChevronDown size={18} aria-hidden />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  {editingTopicId === topic._id ? (
                    <div className="flex flex-wrap gap-2 items-center">
                      <input
                        autoFocus
                        value={editTopicName}
                        onChange={(e) => setEditTopicName(e.target.value)}
                        className="flex-1 min-w-[160px] rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveTopicName(topic._id);
                          }
                          if (e.key === 'Escape') {
                            setEditingTopicId(null);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => saveTopicName(topic._id)}
                        className="rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700"
                      >
                        {t.save}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTopicId(null)}
                        className="rounded-lg bg-slate-200 dark:bg-slate-700 px-3 py-2 text-xs font-medium"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{topic.name}</h2>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-600 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                        onClick={() => {
                          setEditingTopicId(topic._id);
                          setEditTopicName(topic.name || '');
                        }}
                      >
                        <Pencil size={12} aria-hidden />
                        {t.edit}
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900/50 px-2 py-1 text-xs font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        onClick={() => deleteTopic(topic._id)}
                      >
                        <Trash2 size={12} aria-hidden />
                        {t.deleteTopic}
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.lessonOrderHint}</p>
                </div>
              </div>

              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {lessonsList.map((lesson, li) => (
                    <div
                      key={lesson._id}
                      className="group flex flex-col sm:flex-row sm:items-stretch gap-1 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-2 min-w-[200px] flex-1 sm:max-w-sm"
                    >
                      <div className="flex gap-0.5 shrink-0 sm:flex-col">
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800 disabled:opacity-30"
                          aria-label={t.moveUp}
                          disabled={li === 0}
                          onClick={() => reorderLessons(topic._id, topic.lessons, li, li - 1)}
                        >
                          <ChevronUp size={16} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800 disabled:opacity-30"
                          aria-label={t.moveDown}
                          disabled={li === lessonsList.length - 1}
                          onClick={() => reorderLessons(topic._id, topic.lessons, li, li + 1)}
                        >
                          <ChevronDown size={16} aria-hidden />
                        </button>
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col justify-center px-1">
                        {editingLessonId === lesson._id ? (
                          <div className="flex flex-col gap-2">
                            <input
                              autoFocus
                              value={editLessonTitle}
                              onChange={(e) => setEditLessonTitle(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-2 py-1.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  saveLessonTitle(lesson._id);
                                }
                                if (e.key === 'Escape') setEditingLessonId(null);
                              }}
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => saveLessonTitle(lesson._id)}
                                className="text-xs font-semibold text-teal-600 dark:text-teal-400"
                              >
                                {t.save}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingLessonId(null)}
                                className="text-xs text-slate-500"
                              >
                                {t.cancel}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className="font-semibold text-emerald-900 dark:text-emerald-100 text-sm leading-snug">
                              {lesson.title}
                            </span>
                            <div className="mt-1 flex flex-wrap gap-2 opacity-90 group-hover:opacity-100">
                              <button
                                type="button"
                                className="text-xs font-medium text-teal-600 dark:text-teal-400 inline-flex items-center gap-1"
                                onClick={() => {
                                  setEditingLessonId(lesson._id);
                                  setEditLessonTitle(lesson.title || '');
                                }}
                              >
                                <Pencil size={10} aria-hidden />
                                {t.edit}
                              </button>
                              <button
                                type="button"
                                className="text-xs font-medium text-rose-600 dark:text-rose-400 inline-flex items-center gap-1"
                                onClick={() => deleteLesson(lesson._id)}
                              >
                                <Trash2 size={10} aria-hidden />
                                {t.deleteLesson}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  {addingLessonFor === topic._id ? (
                    <div className="flex flex-wrap gap-2 items-center rounded-2xl border border-dashed border-teal-300 dark:border-teal-700 bg-teal-50/40 dark:bg-teal-950/20 p-3 flex-1 min-w-[220px]">
                      <input
                        autoFocus
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        placeholder={t.lessonPh}
                        className="flex-1 min-w-[140px] rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-900"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addLesson(topic._id);
                          }
                          if (e.key === 'Escape') {
                            setAddingLessonFor(null);
                            setNewLessonTitle('');
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => addLesson(topic._id)}
                        className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700"
                      >
                        {t.save}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingLessonFor(null);
                          setNewLessonTitle('');
                        }}
                        className="rounded-xl bg-slate-200 dark:bg-slate-700 px-3 py-2 text-xs font-medium"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingLessonFor(topic._id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 min-h-[44px] min-w-[140px]"
                    >
                      <Plus size={16} aria-hidden />
                      {t.addLesson}
                    </button>
                  )}
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}
      <ConfirmDialog />
    </TeacherPageShell>
  );
}
