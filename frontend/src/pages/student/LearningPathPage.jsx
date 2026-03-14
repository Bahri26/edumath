import React from 'react';
import { useNavigate } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import MathText from '../../components/common/MathText';
import DailyQuest from '../../components/student/DailyQuest';

const LearningPathPage = () => {
    const navigate = useNavigate();
    const { data, loading, error } = useFetch('/learning-path');
    let user = {};
    try {
            const storedUser = localStorage.getItem('edumath_user');
        user = storedUser ? JSON.parse(storedUser) : {};
    } catch (e) {
        user = {};
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">🛣️</div>
                    <p className="text-xl text-gray-700 font-medium">Yol haritanız çiziliyor...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Veriler Yüklenemedi</h2>
                    <p className="text-gray-600 mb-4">{error || 'Lütfen sayfayı yenileyin'}</p>
                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
                        🔄 Yenile
                    </button>
                </div>
            </div>
        );
    }

    const {
        topics = [],
        recommendedQuestions = [],
        lastAiAdvice,
        overallStats,
        recentActivity = [],
        dailyQuests = [],
        xpHeader,
        continueLesson,
        dueReviews = [],
        weakSkills = [],
        levelState,
        completionState,
        studyModules = [],
        questionGames = [],
        dailyPlan,
        recentLessonActivities = [],
        gameXpDistribution
    } = data;

    const levelLabel = xpHeader?.currentStage || 'A1';
    const levelProgress = Math.max(0, Math.min(100, Number(xpHeader?.stageProgress || 0)));
    const primaryQuestions = dailyQuests.length ? dailyQuests : recommendedQuestions.slice(0, 3);

    const openLearningMode = (path) => navigate(path);
    const buildContextualLearningPath = (label, mode = 'explanation', mastery = 0, focus = '', skill = '') => {
        const params = new URLSearchParams({ mode, mastery: String(Math.round(mastery || 0)) });
        if (xpHeader?.currentStage) params.set('stage', xpHeader.currentStage);
        if (focus) params.set('focus', focus);
        if (skill) params.set('skill', skill);
        return `/learning/${encodeURIComponent(label || 'Genel Matematik')}?${params.toString()}`;
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff3d6,_#f9fbff_42%,_#eef2ff)] p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_0.9fr] gap-6 mb-8">
                    <div className="rounded-[36px] bg-slate-950 text-white p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.25),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.22),_transparent_30%)]"></div>
                        <div className="relative z-10">
                            <div className="text-xs uppercase tracking-[0.35em] text-amber-300 font-bold mb-3">Adaptive Learning Path</div>
                            <h1 className="text-4xl md:text-5xl font-black mb-3">Merhaba, {user.full_name || user.name || 'Öğrenci'}!</h1>
                            <p className="text-white/75 text-lg max-w-3xl mb-6">Bu alan; konu anlatimi, soru oyunlari, gunluk sorular ve tekrar akisini gelisimine gore her gun yeniden kurar.</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                                    <div className="text-xs uppercase tracking-[0.25em] text-white/50 font-bold mb-2">Seviye</div>
                                    <div className="text-3xl font-black">{levelLabel}</div>
                                </div>
                                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                                    <div className="text-xs uppercase tracking-[0.25em] text-white/50 font-bold mb-2">XP</div>
                                    <div className="text-3xl font-black">{xpHeader?.xpTotal || 0}</div>
                                </div>
                                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                                    <div className="text-xs uppercase tracking-[0.25em] text-white/50 font-bold mb-2">Seri</div>
                                    <div className="text-3xl font-black">{xpHeader?.dailyStreak || 0}</div>
                                </div>
                                <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                                    <div className="text-xs uppercase tracking-[0.25em] text-white/50 font-bold mb-2">Takipli Beceri</div>
                                    <div className="text-3xl font-black">{levelState?.trackedSkills || 0}</div>
                                </div>
                            </div>

                            <div className="rounded-3xl bg-white/10 border border-white/10 p-5 max-w-2xl">
                                <div className="flex items-center justify-between gap-4 mb-2">
                                    <div>
                                        <div className="text-sm font-bold text-white">{levelState?.currentStage?.title || 'Baslangic'}</div>
                                        <div className="text-sm text-white/65">{levelState?.currentStage?.description}</div>
                                    </div>
                                    {xpHeader?.nextStage && <div className="text-sm font-bold text-amber-300">Sonraki: {xpHeader.nextStage}</div>}
                                </div>
                                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400" style={{ width: `${levelProgress}%` }}></div>
                                </div>
                                <div className="mt-2 text-xs text-white/60">Seviye ilerlemesi %{levelProgress}</div>
                            </div>

                            {completionState?.isCompleted ? (
                                <div className="mt-6 rounded-3xl bg-emerald-400/15 border border-emerald-300/30 p-5">
                                    <div className="text-xs uppercase tracking-[0.25em] text-emerald-200 font-bold mb-2">Tamamlandi</div>
                                    <h2 className="text-2xl font-black mb-2">{completionState.title}</h2>
                                    <p className="text-white/80">{completionState.message}</p>
                                </div>
                            ) : (
                                <div className="mt-6 rounded-3xl bg-white/10 border border-white/10 p-5">
                                    <div className="text-xs uppercase tracking-[0.25em] text-amber-200 font-bold mb-2">C2 Tamamlama Kriteri</div>
                                    <h2 className="text-2xl font-black mb-2">{completionState?.title}</h2>
                                    <p className="text-white/75 mb-4">{completionState?.message}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div className={`rounded-2xl p-4 border ${levelState?.completionProgress?.trackedSkillsMet ? 'bg-emerald-400/10 border-emerald-300/30 text-emerald-100' : 'bg-white/5 border-white/10 text-white/75'}`}>
                                            Takipli beceri: {levelState?.trackedSkills || 0}/{levelState?.completionRequirements?.minTrackedSkills || 4}
                                        </div>
                                        <div className={`rounded-2xl p-4 border ${levelState?.completionProgress?.masteredSkillsMet ? 'bg-emerald-400/10 border-emerald-300/30 text-emerald-100' : 'bg-white/5 border-white/10 text-white/75'}`}>
                                            Usta beceri: {levelState?.masteredSkills || 0}/{levelState?.completionRequirements?.minMasteredSkills || 4}
                                        </div>
                                        <div className={`rounded-2xl p-4 border ${levelState?.completionProgress?.averageMasteryMet ? 'bg-emerald-400/10 border-emerald-300/30 text-emerald-100' : 'bg-white/5 border-white/10 text-white/75'}`}>
                                            Ortalama mastery: %{levelState?.avgMastery || 0}/{levelState?.completionRequirements?.minAverageMastery || 85}
                                        </div>
                                        <div className={`rounded-2xl p-4 border ${levelState?.completionProgress?.dueReviewsCleared ? 'bg-emerald-400/10 border-emerald-300/30 text-emerald-100' : 'bg-white/5 border-white/10 text-white/75'}`}>
                                            Bekleyen tekrar: {levelState?.dueReviewCount || 0}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-[32px] bg-white p-6 shadow-sm border border-amber-100">
                            <div className="text-xs uppercase tracking-[0.25em] text-amber-500 font-bold mb-3">Bugunku Plan</div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2">{dailyPlan?.headline || 'Bugunku calisma akisi hazir.'}</h2>
                            <p className="text-gray-600 mb-4">{dailyPlan?.motivation}</p>
                            <div className="space-y-3">
                                {(dailyPlan?.tasks || []).map((task) => (
                                    <button key={task.task_id} onClick={() => task.path ? openLearningMode(task.path) : null} className="w-full text-left rounded-2xl border border-gray-100 bg-gray-50 p-4 hover:border-indigo-200 hover:bg-indigo-50 transition-colors">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="font-bold text-gray-900">{task.title}</div>
                                                <div className="text-sm text-gray-600 mt-1">{task.description}</div>
                                            </div>
                                            <div className={`text-xs font-bold px-2 py-1 rounded-full ${task.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{task.done ? 'Tamamlandi' : 'Sirada'}</div>
                                        </div>
                                        <div className="mt-3 text-xs text-gray-400">{task.progress_text || `${task.estimated_minutes} dk`}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {lastAiAdvice ? (
                            <div className="rounded-[32px] bg-white p-6 shadow-sm border border-indigo-100">
                                <div className="text-xs uppercase tracking-[0.25em] text-indigo-500 font-bold mb-3">AI Kocu</div>
                                <p className="text-gray-700 leading-7 mb-4">{lastAiAdvice.general_comment}</p>
                                <div className="space-y-2">
                                    {(lastAiAdvice.study_recommendations || []).slice(0, 3).map((item, index) => (
                                        <div key={index} className="rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{item}</div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="mb-10">
                    <DailyQuest />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                    <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between gap-4 mb-5">
                            <div>
                                <div className="text-xs uppercase tracking-[0.25em] text-sky-500 font-bold mb-2">Son Ders Etkinlikleri</div>
                                <h2 className="text-2xl font-black text-gray-900">Az once ne yaptin?</h2>
                            </div>
                            <div className="text-sm text-gray-400">Activity tabanli ozet</div>
                        </div>
                        {recentLessonActivities.length > 0 ? (
                            <div className="space-y-3">
                                {recentLessonActivities.map((activity, index) => (
                                    <div key={`${activity.activity_type}-${activity.created_at}-${index}`} className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="font-bold text-gray-900">{activity.activity_label}</div>
                                                <div className="text-sm text-gray-600 mt-1">{activity.topic_name}</div>
                                                <div className="text-xs text-gray-400 mt-2">{new Date(activity.created_at).toLocaleString('tr-TR')}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-sm font-bold ${activity.is_correct ? 'text-emerald-600' : 'text-rose-500'}`}>{activity.is_correct ? 'Basarili' : 'Tekrar gerekli'}</div>
                                                <div className="text-xs text-amber-600 mt-1">+{activity.xp_gain} XP</div>
                                                <div className="text-xs text-gray-400 mt-1">{Math.max(1, Math.round((activity.time_spent_ms || 0) / 1000))} sn</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-gray-200 p-8 text-center text-gray-500">Ders etkinlikleri yaptikca burada son calismalarin listelenecek.</div>
                        )}
                    </div>

                    <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between gap-4 mb-5">
                            <div>
                                <div className="text-xs uppercase tracking-[0.25em] text-fuchsia-500 font-bold mb-2">Oyun Bazli XP</div>
                                <h2 className="text-2xl font-black text-gray-900">XP nereden geliyor?</h2>
                            </div>
                            <div className="text-sm text-gray-400">Toplam {gameXpDistribution?.totalXp || 0} XP</div>
                        </div>
                        {gameXpDistribution?.items?.length > 0 ? (
                            <div className="space-y-4">
                                {gameXpDistribution.items.map((item) => (
                                    <div key={item.activity_type}>
                                        <div className="flex items-center justify-between gap-4 mb-2">
                                            <div>
                                                <div className="font-bold text-gray-900">{item.activity_label}</div>
                                                <div className="text-xs text-gray-400">{item.attempts} deneme · %{item.success_rate} basari</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-fuchsia-600">{item.xp_total} XP</div>
                                                <div className="text-xs text-gray-400">%{item.share_percent}</div>
                                            </div>
                                        </div>
                                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500" style={{ width: `${Math.max(6, item.share_percent || 0)}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-gray-200 p-8 text-center text-gray-500">Flash kart, mini quiz ve diger oyunlar yapildikca XP dagilimi burada gorunecek.</div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-xs uppercase tracking-wider text-indigo-500 font-bold mb-2">Continue Lesson</div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">{continueLesson?.item?.skill_label || continueLesson?.item?.topic || 'Hazır olduğunda devam et'}</h2>
                                <p className="text-gray-600 mb-4">
                                    {continueLesson?.selection_reason === 'due_review' ? 'Tekrar zamanı gelen beceri önce geliyor.' :
                                     continueLesson?.selection_reason === 'weak_skill' ? 'En zayıf becerine odaklanıyorsun.' :
                                     continueLesson?.selection_reason === 'weak_topic_history' ? 'Geçmiş performansına göre seçildi.' : 'Yeni kazanım keşfi için seçildi.'}
                                </p>
                                {continueLesson?.item ? (
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold">{continueLesson.item.skill_label || continueLesson.item.topic}</span>
                                        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold">Beceri: {continueLesson.item.skill_key}</span>
                                        <button
                                            onClick={() => openLearningMode(buildContextualLearningPath(
                                                continueLesson.item.skill_label || continueLesson.item.topic || 'Genel Matematik',
                                                'explanation',
                                                continueLesson.item.mastery_score || 0,
                                                continueLesson.selection_reason || '',
                                                continueLesson.item.skill_key || ''
                                            ))}
                                            className="px-5 py-2.5 bg-amber-100 text-amber-800 rounded-xl font-bold hover:bg-amber-200"
                                        >
                                            Konu Anlatimi
                                        </button>
                                        <button
                                            onClick={() => navigate(`/question/${continueLesson.item.question_id}`)}
                                            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                                        >
                                            Devam Et →
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => navigate('/student-exams')}
                                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                                    >
                                        Sınavlarla Başla →
                                    </button>
                                )}
                            </div>
                            <div className="min-w-[120px] text-right">
                                <div className="text-sm text-gray-400 mb-1">Günlük İlerleme</div>
                                <div className="text-3xl font-black text-indigo-600">{xpHeader?.dailyCompleted || 0}/{xpHeader?.dailyTarget || 10}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <div className="text-xs uppercase tracking-wider text-amber-500 font-bold mb-2">Due Reviews</div>
                        <h3 className="text-xl font-black text-gray-900 mb-4">Tekrar Zamanı Gelenler</h3>
                        {dueReviews.length > 0 ? (
                            <div className="space-y-3">
                                {dueReviews.map((review) => (
                                    <div key={review.skill_key} className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                                        <div className="font-bold text-gray-900">{review.skill_label}</div>
                                        <div className="text-sm text-gray-600 mt-1">Mastery %{Math.round(review.mastery_score || 0)} · Güven %{Math.round(review.confidence_score || 0)}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Şu anda bekleyen tekrar yok.</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                    <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div>
                                <div className="text-xs uppercase tracking-[0.25em] text-indigo-500 font-bold mb-2">Konu Anlatimlari</div>
                                <h2 className="text-2xl font-black text-gray-900">Sana ozel moduller</h2>
                            </div>
                            <div className="text-sm text-gray-400">Gelisimine gore guncellenir</div>
                        </div>
                        <div className="space-y-4">
                            {studyModules.length > 0 ? studyModules.map((module) => (
                                <button key={module.module_id} onClick={() => openLearningMode(module.path)} className="w-full text-left rounded-3xl bg-gradient-to-r from-white to-indigo-50 border border-indigo-100 p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="text-xs uppercase tracking-[0.25em] text-indigo-500 font-bold mb-2">Oncelik {module.priority}</div>
                                            <h3 className="text-xl font-black text-gray-900 mb-2">{module.title}</h3>
                                            <p className="text-gray-600 leading-7">{module.description}</p>
                                        </div>
                                        <div className="rounded-2xl bg-indigo-600 text-white px-3 py-2 text-sm font-bold whitespace-nowrap">{module.estimated_minutes} dk</div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Mastery %{Math.round(module.mastery_score || 0)}</span>
                                        <span className="text-indigo-600 font-bold">{module.cta_label} →</span>
                                    </div>
                                </button>
                            )) : (
                                <div className="rounded-3xl border border-dashed border-gray-200 p-8 text-center text-gray-500">Yeni konu anlatimi modulleri, ilk soru ve tekrar verileri geldikce burada olusacak.</div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div>
                                <div className="text-xs uppercase tracking-[0.25em] text-emerald-500 font-bold mb-2">Soru Oyunlari</div>
                                <h2 className="text-2xl font-black text-gray-900">Tekrar yerine oyunlu pekistirme</h2>
                            </div>
                            <div className="text-sm text-gray-400">Flash kart, esleme, bosluk</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {questionGames.length > 0 ? questionGames.map((game) => (
                                <button key={game.game_id} onClick={() => openLearningMode(game.path)} className="rounded-3xl text-left bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase">{game.mode}</span>
                                        <span className="text-xs text-gray-400">Bant {game.current_difficulty_band}</span>
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 mb-2">{game.title}</h3>
                                    <p className="text-sm text-gray-600 leading-6 mb-4">{game.description}</p>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">{game.estimated_minutes} dk · Mastery %{Math.round(game.mastery_score || 0)}</span>
                                        <span className="text-emerald-700 font-bold">{game.cta_label} →</span>
                                    </div>
                                </button>
                            )) : (
                                <div className="md:col-span-2 rounded-3xl border border-dashed border-gray-200 p-8 text-center text-gray-500">Oyun onerileri, zayif veya tekrar zamani gelen becerilerden otomatik uretilecek.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* İSTATİSTİK KARTLARI */}
                {overallStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-shadow">
                            <div className="text-4xl mb-2">📊</div>
                            <div className="text-3xl font-black text-indigo-600">{overallStats.totalExams}</div>
                            <div className="text-sm text-gray-500 font-medium">Tamamlanan Sınav</div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-shadow">
                            <div className="text-4xl mb-2">✅</div>
                            <div className="text-3xl font-black text-green-600">{overallStats.totalCorrect}</div>
                            <div className="text-sm text-gray-500 font-medium">Doğru Cevap</div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-shadow">
                            <div className="text-4xl mb-2">🎯</div>
                            <div className="text-3xl font-black text-purple-600">%{overallStats.successRate}</div>
                            <div className="text-sm text-gray-500 font-medium">Başarı Oranı</div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-shadow">
                            <div className="text-4xl mb-2">⭐</div>
                            <div className="text-3xl font-black text-orange-600">{overallStats.avgScore}</div>
                            <div className="text-sm text-gray-500 font-medium">Ortalama Puan</div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* SOL PANEL: KONU ANALİZİ */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                                <span className="text-2xl">🧠</span> Weak Skills
                            </h2>
                            {weakSkills.length > 0 ? (
                                <div className="space-y-4">
                                    {weakSkills.map((skill) => (
                                        <div key={skill.skill_key}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-semibold text-gray-700 text-sm">{skill.skill_label}</span>
                                                <span className="text-sm font-bold text-red-500">%{Math.round(skill.mastery_score || 0)}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                <div className="h-2 rounded-full bg-gradient-to-r from-rose-400 to-red-600" style={{ width: `${Math.min(100, Math.round(skill.mastery_score || 0))}%` }}></div>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">Bant {skill.current_difficulty_band} · {skill.correct_count} doğru / {skill.wrong_count} yanlış</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Henüz skill seviyesi verisi oluşmadı. Sorular çözüldükçe burası dolacak.</p>
                            )}
                        </div>

                        {/* Konu Karnesi */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                                <span className="text-2xl">📊</span> Konu Analizin
                            </h2>
                            {topics.length > 0 ? (
                                <div className="space-y-5">
                                    {topics.map((t, index) => (
                                        <div key={index} className="group">
                                            <div className="flex justify-between items-center mb-2">
                                                <button onClick={() => openLearningMode(`/learning/${encodeURIComponent(t.topic)}`)} className="font-semibold text-gray-700 text-sm hover:underline">{t.topic}</button>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold text-lg ${t.status === 'strong' ? 'text-green-600' : 'text-red-500'}`}>
                                                        %{t.score}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        ({t.correctCount}/{t.totalQuestions})
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                                <div 
                                                    className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                                                        t.status === 'strong' 
                                                            ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                                            : 'bg-gradient-to-r from-red-400 to-red-600'
                                                    }`} 
                                                    style={{ width: `${t.score}%` }}
                                                ></div>
                                            </div>
                                            <div className="mt-1 text-xs text-gray-400">
                                                {t.status === 'strong' ? '💪 Güçlü!' : '⚠️ Geliştirilmeli'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-5xl mb-3">📚</div>
                                    <p className="text-gray-400 text-sm">Henüz veri yok</p>
                                    <p className="text-gray-500 text-xs mt-1">Sınav çözerek başla!</p>
                                    <button
                                        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                        onClick={() => navigate('/student-exams')}
                                    >
                                        Sınav Listesine Git
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Motivasyon Kartı */}
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-200 p-6 text-center shadow-sm">
                            <div className="text-5xl mb-3">🔥</div>
                            <h3 className="font-black text-orange-800 text-lg mb-2">Seriyi Bozma!</h3>
                            <p className="text-orange-700 text-sm leading-relaxed">
                                Her gün düzenli çalışarak başarı oranını artır.
                            </p>
                        </div>

                        {/* Son Aktivite */}
                        {recentActivity.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="text-xl">📅</span> Son 7 Gün
                                </h3>
                                <div className="space-y-2">
                                    {recentActivity.map((activity, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">
                                                {new Date(activity.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-indigo-600 font-semibold">{activity.exam_count} sınav</span>
                                                <span className="text-green-600 font-bold">%{Math.round(activity.avg_score)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SAĞ PANEL: ÖNERİLEN SORULAR */}
                    <div className="lg:col-span-2">
                        <div className="mb-6 rounded-[32px] bg-white p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <div>
                                    <div className="text-xs uppercase tracking-[0.25em] text-rose-500 font-bold mb-2">Gunluk Sorular</div>
                                    <h2 className="text-2xl font-black text-gray-900">Bugun seni ileri tasiyacak sorular</h2>
                                </div>
                                <div className="text-sm text-gray-400">{xpHeader?.dailyCompleted || 0}/{xpHeader?.dailyTarget || 10} tamamlandi</div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {primaryQuestions.length > 0 ? primaryQuestions.map((q, index) => (
                                    <button key={`daily-${q.question_id || index}`} onClick={() => navigate(`/question/${q.question_id}`)} className="text-left rounded-3xl bg-gradient-to-br from-rose-50 to-white border border-rose-100 p-5 hover:shadow-md transition-shadow">
                                        <div className="text-xs uppercase tracking-[0.25em] text-rose-500 font-bold mb-2">Gunluk soru {index + 1}</div>
                                        <div className="font-bold text-gray-900 mb-3">{q.topic || q.skill_label || 'Genel Matematik'}</div>
                                        <div className="text-sm text-gray-600 line-clamp-4"><MathText text={q.content_text} /></div>
                                    </button>
                                )) : (
                                    <div className="md:col-span-3 rounded-3xl border border-dashed border-gray-200 p-8 text-center text-gray-500">Gunluk sorular ilk tavsiye havuzu olustugunda burada gorunecek.</div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-3">
                                <span className="text-3xl">🎯</span> Senin İçin Seçtiklerim
                            </h2>
                            <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full">
                                Eksiklerine Özel
                            </span>
                        </div>

                        <div className="space-y-4">
                            {recommendedQuestions.length > 0 ? recommendedQuestions.map((q, index) => {
                                const topicScore = topics.find((t) => t.topic === q.topic)?.score;
                                return (
                                <div key={q.question_id} className="relative bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                            q.difficulty_level === 1 ? 'bg-green-100 text-green-700' :
                                            q.difficulty_level === 2 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {q.difficulty_level === 1 ? '😊 Kolay' : q.difficulty_level === 2 ? '🤔 Orta' : '🔥 Zor'}
                                        </span>
                                    </div>
                                    
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                                            {q.skill_label || q.topic || 'Genel'}
                                        </span>
                                        {topicScore != null && (
                                            <span className="text-xs text-gray-500">({topicScore}%)</span>
                                        )}
                                        {q.selection_reason && (
                                            <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full">{q.selection_reason}</span>
                                        )}
                                    </div>
                                    
                                    <div className="text-gray-800 font-medium text-base mb-5">
                                        <MathText text={q.content_text} />
                                    </div>

                                    <button 
                                        onClick={() => navigate(`/question/${q.question_id}`)} 
                                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                                    >
                                        Hemen Çöz →
                                    </button>
                                </div>
                                );
                            }) : (
                                <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                    <div className="text-6xl mb-4">🎉</div>
                                    <h3 className="text-2xl font-bold text-gray-700 mb-2">Harikasın!</h3>
                                    <p className="text-gray-500">Şu an için eksik konun görünmüyor.</p>
                                    <button 
                                        onClick={() => navigate('/student-exams')}
                                        className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                                    >
                                        Sınavlara Git →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LearningPathPage;
