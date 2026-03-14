import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

function normalizeText(value) {
    return String(value || '').trim().toLocaleLowerCase('tr-TR');
}

function shuffleArray(items) {
    const clone = [...items];
    for (let index = clone.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
    }
    return clone;
}

const TopicPage = () => {
    const navigate = useNavigate();
    const { topicName: rawTopicName } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    // topicName comes in URL encoded, decode for display
    const topicName = rawTopicName ? decodeURIComponent(rawTopicName) : '';
    const initialMode = searchParams.get('mode') || 'explanation';
    const masteryScore = Number(searchParams.get('mastery') || 0);
    const currentStage = searchParams.get('stage') || 'A1';
    const focusReason = searchParams.get('focus') || '';
    const skillKey = searchParams.get('skill') || '';
    const [mode, setMode] = useState(initialMode);
    const [aiResult, setAiResult] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [progress, setProgress] = useState(null);
    const [topicId, setTopicId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [flashcardIndex, setFlashcardIndex] = useState(0);
    const [flashcardRevealed, setFlashcardRevealed] = useState(false);
    const [fillAnswers, setFillAnswers] = useState([]);
    const [fillChecked, setFillChecked] = useState(false);
    const [matchingOptions, setMatchingOptions] = useState([]);
    const [selectedLeftIndex, setSelectedLeftIndex] = useState(null);
    const [matchedPairs, setMatchedPairs] = useState({});
    const [gameFeedback, setGameFeedback] = useState(null);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);

    function handleFetch(mode) {
        setAiLoading(true);
        setAiError(null);
        setAiResult(null);
        api
            .get('/ai-content/learning', {
                params: {
                    topic: topicName,
                    mode,
                    mastery: masteryScore,
                    stage: currentStage,
                    focus: focusReason
                }
            })
            .then((resp) => setAiResult(resp.data))
            .catch((err) => setAiError(err.message))
            .finally(() => setAiLoading(false));
    }

    function changeMode(nextMode) {
        setMode(nextMode);
        const params = { mode: nextMode };
        if (masteryScore) params.mastery = String(masteryScore);
        if (currentStage) params.stage = currentStage;
        if (focusReason) params.focus = focusReason;
        if (skillKey) params.skill = skillKey;
        setSearchParams(params);
        handleFetch(nextMode);
    }

    function submitReview(correct) {
        if (!userId || !topicId) return;
        return api
            .post(`/user_topic_progress/${topicId}/review`, { user_id: userId, correct })
            .then((r) => {
                setProgress(r.data);
                return r.data;
            })
            .catch((e) => {
                console.warn('review error', e);
                return null;
            });
    }

    useEffect(() => {
        if (topicName && topicName !== '') {
            handleFetch(initialMode);

            // look up current user and topic id for progress
            let stored = null;
            try { stored = JSON.parse(localStorage.getItem('edumath_user')); } catch (e) { stored = null; }
            const uid = stored ? (stored.user_id || stored.id) : null;
            setUserId(uid);
            if (uid) {
                api
                  .get('/curriculum/topics', { params: { q: topicName, limit: 1 } })
                  .then((r) => {
                      const first = r.data.rows && r.data.rows[0];
                      if (first) {
                          setTopicId(first.id);
                          return api.get(`/user_topic_progress/${first.id}`, { params: { user_id: uid } });
                      }
                      return null;
                  })
                  .then((r) => {
                      if (r && r.data) setProgress(r.data);
                  })
                  .catch((e) => console.warn('progress fetch', e));
            }
        }
    }, [topicName, initialMode, masteryScore, currentStage, focusReason]);

    const result = aiResult?.result || null;
    const aiContext = aiResult?.context || {};
    const cards = Array.isArray(result) ? result : (Array.isArray(result?.pairs) ? result.pairs : []);

    useEffect(() => {
        setFlashcardIndex(0);
        setFlashcardRevealed(false);
        setFillChecked(false);
        setGameFeedback(null);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setSelectedLeftIndex(null);
        setMatchedPairs({});

        if (mode === 'fillblank' && Array.isArray(result?.answers)) {
            setFillAnswers(result.answers.map(() => ''));
        } else {
            setFillAnswers([]);
        }

        if (mode === 'matching' && Array.isArray(result?.pairs)) {
            setMatchingOptions(shuffleArray(result.pairs.map((pair, index) => ({ ...pair, index }))));
        } else {
            setMatchingOptions([]);
        }
    }, [mode, result]);

    function runAutoReview(correct, message) {
        setGameFeedback(message);
        const scoreRatioFromMessage = (() => {
            const match = String(message || '').match(/(\d+)\/(\d+)/);
            if (!match) return correct ? 1 : 0;
            const total = Number(match[2] || 0);
            return total > 0 ? Number(match[1] || 0) / total : (correct ? 1 : 0);
        })();

        if (userId) {
            api.post('/learning/activity', {
                topicName,
                topicId,
                skillKey,
                mode,
                isCorrect: correct,
                scoreRatio: scoreRatioFromMessage,
                masteryScore,
                source: 'topic_activity'
            }).catch((error) => console.warn('adaptive activity error', error));
        }

        if (userId && topicId) {
            submitReview(correct);
        }
    }

    function completeFlashcards() {
        runAutoReview(true, 'Flash kart turu tamamlandi. Bu beceri icin tekrar yaptin.');
    }

    function checkFillBlank() {
        const answers = result?.answers || [];
        const correctCount = answers.filter((answer, index) => normalizeText(fillAnswers[index]) === normalizeText(answer)).length;
        const ratio = answers.length ? correctCount / answers.length : 0;
        setFillChecked(true);
        runAutoReview(ratio >= 0.67, `Bosluk doldurma sonucu: ${correctCount}/${answers.length} dogru.`);
    }

    function handleMatchingChoice(rightItem) {
        if (selectedLeftIndex == null) return;
        const currentPair = result?.pairs?.[selectedLeftIndex];
        if (!currentPair) return;

        if (currentPair.right === rightItem.right) {
            const nextPairs = { ...matchedPairs, [selectedLeftIndex]: rightItem.right };
            setMatchedPairs(nextPairs);
            setSelectedLeftIndex(null);
            setGameFeedback('Dogru eslesme.');
            if (Object.keys(nextPairs).length === (result?.pairs?.length || 0)) {
                runAutoReview(true, 'Esleme oyunu tamamlandi. Tum iliskileri dogru kurdun.');
            }
        } else {
            setGameFeedback('Bu ikili uyusmuyor, tekrar dene.');
        }
    }

    function submitMiniQuiz() {
        const questions = result?.questions || [];
        const correctCount = questions.filter((question, index) => Number(quizAnswers[index]) === Number(question.answer_index)).length;
        const ratio = questions.length ? correctCount / questions.length : 0;
        setQuizSubmitted(true);
        runAutoReview(ratio >= 0.67, `Mini quiz sonucu: ${correctCount}/${questions.length} dogru.`);
    }

    const renderContent = () => {
        if (!result) return null;
        if (mode === 'explanation') {
            return (
                <div className="space-y-4">
                    <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                        <div className="text-xs uppercase tracking-[0.25em] text-indigo-500 font-bold mb-3">Gemini Destekli Ders</div>
                        <h2 className="text-2xl font-black text-gray-900 mb-3">{result.lesson_title || `${topicName} konu anlatimi`}</h2>
                        <p className="text-lg leading-8 text-gray-700">{result.summary || result.explanation || String(result)}</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                            <div className="text-xs uppercase tracking-[0.25em] text-amber-500 font-bold mb-3">Bu ders neden secildi?</div>
                            <p className="text-gray-700 leading-7">{result.why_this_matters || 'Bu konu, eksigini toparlamak ve yeni sorularda daha guvenli ilerlemeni saglamak icin secildi.'}</p>
                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100">
                                    <div className="text-amber-600 font-bold mb-1">Seviye</div>
                                    <div className="text-gray-900 font-semibold">{aiContext.stage || currentStage}</div>
                                </div>
                                <div className="rounded-2xl bg-indigo-50 p-4 border border-indigo-100">
                                    <div className="text-indigo-600 font-bold mb-1">Mastery</div>
                                    <div className="text-gray-900 font-semibold">%{Math.round(aiContext.masteryScore || masteryScore || 0)}</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                            <div className="text-xs uppercase tracking-[0.25em] text-rose-500 font-bold mb-3">Yaygin Hata</div>
                            <p className="text-gray-700 leading-7 mb-4">{result.misconception || 'Kurali gormeden hizli cevaba gitmek bu konuda en buyuk risk.'}</p>
                            <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 text-emerald-900">
                                <div className="text-sm font-bold mb-2">Motivasyon Notu</div>
                                <p className="text-sm leading-6">{result.encouragement || 'Adimlari sindirerek gidersen bu konu hizla guclenir.'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                        <div className="text-xs uppercase tracking-[0.25em] text-emerald-500 font-bold mb-4">Ders Adimlari</div>
                        <div className="space-y-3">
                            {(result.steps || []).map((step, index) => (
                                <div key={index} className="rounded-2xl bg-gray-50 p-4 border border-gray-100 flex gap-4 items-start">
                                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black flex-shrink-0">{index + 1}</div>
                                    <p className="text-gray-700 leading-7">{step}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {result.worked_example && (
                        <div className="rounded-3xl bg-slate-950 text-white p-6 shadow-sm border border-slate-900">
                            <div className="text-xs uppercase tracking-[0.25em] text-amber-300 font-bold mb-4">Aciklamali Ornek</div>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm text-white/60 mb-2">Soru</div>
                                    <p className="text-lg leading-8">{result.worked_example.question}</p>
                                </div>
                                <div>
                                    <div className="text-sm text-white/60 mb-2">Cozum Akisi</div>
                                    <p className="text-white/90 leading-8">{result.worked_example.solution}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {Array.isArray(result.checkpoints) && result.checkpoints.length > 0 && (
                        <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                            <div className="text-xs uppercase tracking-[0.25em] text-violet-500 font-bold mb-4">Ders Sonu Kontrol</div>
                            <div className="space-y-3">
                                {result.checkpoints.map((item, index) => (
                                    <div key={index} className="rounded-2xl bg-violet-50 p-4 border border-violet-100 text-violet-950">{item}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (mode === 'fillblank') {
            return (
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
                    <div>
                        <div className="text-xs uppercase tracking-[0.25em] text-amber-500 font-bold mb-3">Bosluk Doldurma</div>
                        <p className="text-lg leading-8 text-gray-700">{result.text}</p>
                    </div>
                    <div>
                        <div className="text-sm font-bold text-gray-900 mb-2">Cevaplarini Gir</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {(result.answers || []).map((answer, index) => (
                                <input
                                    key={`${answer}-${index}`}
                                    value={fillAnswers[index] || ''}
                                    onChange={(event) => {
                                        const nextAnswers = [...fillAnswers];
                                        nextAnswers[index] = event.target.value;
                                        setFillAnswers(nextAnswers);
                                    }}
                                    className="px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
                                    placeholder={`Bosluk ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={checkFillBlank} className="px-4 py-3 rounded-2xl bg-amber-500 text-white font-bold hover:bg-amber-600">Kontrol Et</button>
                        {fillChecked && <div className="text-sm text-gray-600">{gameFeedback}</div>}
                    </div>
                </div>
            );
        }

        if (mode === 'flashcards') {
            const currentCard = cards[flashcardIndex];
            return (
                <div className="space-y-4">
                    <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <div className="text-xs uppercase tracking-[0.25em] text-indigo-500 font-bold">Flash Kart {flashcardIndex + 1}/{cards.length}</div>
                            <div className="text-sm text-gray-400">Kartlari tek tek acarak tekrar et</div>
                        </div>
                        <div className="rounded-3xl bg-indigo-50 p-6 border border-indigo-100 mb-4">
                            <div className="text-sm text-indigo-500 font-bold mb-2">Soru</div>
                            <div className="text-xl font-semibold text-gray-900">{currentCard?.q}</div>
                        </div>
                        {flashcardRevealed && (
                            <div className="rounded-3xl bg-emerald-50 p-6 border border-emerald-100 mb-4">
                                <div className="text-sm text-emerald-600 font-bold mb-2">Cevap</div>
                                <div className="text-lg text-emerald-950 leading-8">{currentCard?.a}</div>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-3">
                            {!flashcardRevealed ? (
                                <button onClick={() => setFlashcardRevealed(true)} className="px-4 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700">Cevabi Goster</button>
                            ) : flashcardIndex < cards.length - 1 ? (
                                <button onClick={() => { setFlashcardIndex((value) => value + 1); setFlashcardRevealed(false); }} className="px-4 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700">Sonraki Kart</button>
                            ) : (
                                <button onClick={completeFlashcards} className="px-4 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700">Turu Tamamla</button>
                            )}
                            {gameFeedback && <div className="text-sm text-gray-600 self-center">{gameFeedback}</div>}
                        </div>
                    </div>
                </div>
            );
        }

        if (mode === 'matching') {
            return (
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                    <div className="text-xs uppercase tracking-[0.25em] text-emerald-500 font-bold mb-4">Esleme Oyunu</div>
                    <p className="text-gray-600 mb-5">Soldan bir kart sec, sonra ona ait sag karti sec.</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            {(result?.pairs || []).map((item, index) => (
                                <button
                                    key={`left-${index}`}
                                    onClick={() => !matchedPairs[index] && setSelectedLeftIndex(index)}
                                    className={`w-full text-left rounded-2xl p-4 border transition-colors ${matchedPairs[index] ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : selectedLeftIndex === index ? 'bg-indigo-50 border-indigo-300' : 'bg-gray-50 border-gray-200 hover:border-indigo-200'}`}
                                >
                                    {item.left}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-3">
                            {matchingOptions.map((item) => {
                                const isLocked = Object.values(matchedPairs).includes(item.right);
                                return (
                                    <button
                                        key={`right-${item.index}`}
                                        onClick={() => !isLocked && handleMatchingChoice(item)}
                                        className={`w-full text-left rounded-2xl p-4 border transition-colors ${isLocked ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-gray-50 border-gray-200 hover:border-emerald-200'}`}
                                    >
                                        {item.right}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {gameFeedback && <div className="mt-4 text-sm text-gray-600">{gameFeedback}</div>}
                </div>
            );
        }

        if (mode === 'miniquiz') {
            return (
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 space-y-5">
                    <div>
                        <div className="text-xs uppercase tracking-[0.25em] text-rose-500 font-bold mb-2">Mini Quiz</div>
                        <h2 className="text-2xl font-black text-gray-900">Kisa kontrol testi</h2>
                    </div>
                    {(result?.questions || []).map((question, questionIndex) => (
                        <div key={questionIndex} className="rounded-3xl bg-gray-50 p-5 border border-gray-100">
                            <div className="font-bold text-gray-900 mb-4">{questionIndex + 1}. {question.question}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(question.options || []).map((option, optionIndex) => {
                                    const selected = Number(quizAnswers[questionIndex]) === optionIndex;
                                    const revealCorrect = quizSubmitted && optionIndex === Number(question.answer_index);
                                    const revealWrong = quizSubmitted && selected && optionIndex !== Number(question.answer_index);
                                    return (
                                        <button
                                            key={`${questionIndex}-${optionIndex}`}
                                            onClick={() => !quizSubmitted && setQuizAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))}
                                            className={`text-left rounded-2xl p-4 border transition-colors ${revealCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : revealWrong ? 'bg-rose-50 border-rose-300 text-rose-900' : selected ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200 hover:border-indigo-200'}`}
                                        >
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>
                            {quizSubmitted && <div className="mt-3 text-sm text-gray-600">{question.explanation}</div>}
                        </div>
                    ))}
                    <div className="flex items-center gap-3">
                        {!quizSubmitted ? (
                            <button onClick={submitMiniQuiz} className="px-4 py-3 rounded-2xl bg-rose-600 text-white font-bold hover:bg-rose-700">Mini Quiz'i Bitir</button>
                        ) : (
                            <div className="text-sm text-gray-600">{gameFeedback}</div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((item, index) => (
                    <div key={`${mode}-${index}`} className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                        <div className="text-xs uppercase tracking-[0.25em] text-emerald-500 font-bold mb-3">
                            {mode === 'matching' ? `Eslestirme ${index + 1}` : `Kart ${index + 1}`}
                        </div>
                        {mode === 'matching' ? (
                            <div className="space-y-3">
                                <div className="rounded-2xl bg-gray-50 p-4">
                                    <div className="text-xs text-gray-400 mb-1">Sol</div>
                                    <div className="font-semibold text-gray-800">{item.left}</div>
                                </div>
                                <div className="rounded-2xl bg-emerald-50 p-4">
                                    <div className="text-xs text-emerald-500 mb-1">Sag</div>
                                    <div className="font-semibold text-emerald-900">{item.right}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="rounded-2xl bg-gray-50 p-4">
                                    <div className="text-xs text-gray-400 mb-1">Soru</div>
                                    <div className="font-semibold text-gray-800">{item.q}</div>
                                </div>
                                <div className="rounded-2xl bg-indigo-50 p-4">
                                    <div className="text-xs text-indigo-500 mb-1">Cevap</div>
                                    <div className="font-semibold text-indigo-900">{item.a}</div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            );
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff3d6,_#f8fbff_45%,_#eef3ff)] p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="rounded-[32px] bg-slate-950 text-white p-6 md:p-8 shadow-2xl">
                    <button onClick={() => navigate('/learning-path')} className="text-sm text-white/70 hover:text-white mb-4">← Ogrenme yoluna don</button>
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                        <div>
                            <div className="text-xs uppercase tracking-[0.3em] text-amber-300 font-bold mb-3">Kisisel Calisma Alani</div>
                            <h1 className="text-3xl md:text-5xl font-black mb-3">{topicName}</h1>
                            <p className="text-white/75 max-w-2xl">Konu anlatimi, soru oyunlari ve tekrar akisini ayni yerde gormen icin hazirlandi.</p>
                        </div>
                        <div className="rounded-3xl bg-white/10 border border-white/15 p-5 min-w-[260px]">
                            <div className="text-xs uppercase tracking-[0.25em] text-white/60 font-bold mb-2">Mevcut Durum</div>
                            {progress ? (
                                <div className="space-y-2 text-sm">
                                    <div>Seviye: <span className="font-bold">{progress.mastery_level}</span></div>
                                    <div>Dogu/Yanlis: <span className="font-bold">{progress.correct_count} / {progress.wrong_count}</span></div>
                                </div>
                            ) : (
                                <div className="text-sm text-white/70">Bu konuda ilerleme kaydi soru cozdükce burada gorunecek.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {[
                        { key: 'explanation', label: 'Konu Anlatimi' },
                        { key: 'flashcards', label: 'Flash Kart' },
                        { key: 'fillblank', label: 'Bosluk Doldurma' },
                        { key: 'matching', label: 'Esleme' },
                        { key: 'miniquiz', label: 'Mini Quiz' }
                    ].map((item) => (
                        <button
                            key={item.key}
                            onClick={() => changeMode(item.key)}
                            className={`px-4 py-3 rounded-2xl font-bold transition-colors ${mode === item.key ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300'}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {aiLoading && <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100 text-gray-500">Icerik hazirlaniyor...</div>}
                {aiError && <div className="rounded-3xl bg-red-50 p-6 shadow-sm border border-red-100 text-red-600">{aiError}</div>}
                {!aiLoading && !aiError && renderContent()}

                {userId && topicId && (
                    <div className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <div className="text-xs uppercase tracking-[0.25em] text-emerald-500 font-bold mb-2">Mini Degerlendirme</div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Bu modulu bitirdiginde ilerlemeni isaretle</h2>
                                <p className="text-gray-600">Doğru veya yanlış geri bildirimi, bu konunun tekrar sıklığını ve zorluk bandını etkileyecek.</p>
                            </div>
                            <div className="flex gap-3">
                                <button className="px-4 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700" onClick={() => submitReview(true)}>Dogru hissettim</button>
                                <button className="px-4 py-3 rounded-2xl bg-rose-600 text-white font-bold hover:bg-rose-700" onClick={() => submitReview(false)}>Tekrar gerekli</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopicPage;
