import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import api from '../../services/api';

const TopicPage = () => {
    const { topicName: rawTopicName } = useParams();
    // topicName comes in URL encoded, decode for display
    const topicName = rawTopicName ? decodeURIComponent(rawTopicName) : '';
    const [mode, setMode] = useState('explanation');
    const [aiResult, setAiResult] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [progress, setProgress] = useState(null);
    const [topicId, setTopicId] = useState(null);
    const [userId, setUserId] = useState(null);

    // there is no async fetch for topic metadata; just use name


    function handleFetch(mode) {
        setAiLoading(true);
        setAiError(null);
        setAiResult(null);
        api
            .get('/ai-content/learning', { params: { topic: topicName, mode } })
            .then((resp) => setAiResult(resp.data))
            .catch((err) => setAiError(err.message))
            .finally(() => setAiLoading(false));
    }

    function submitReview(correct) {
        if (!userId || !topicId) return;
        api
            .post(`/user_topic_progress/${topicId}/review`, { user_id: userId, correct })
            .then((r) => {
                setProgress(r.data);
            })
            .catch((e) => console.warn('review error', e));
    }

    useEffect(() => {
        if (topicName && topicName !== '') {
            handleFetch('explanation');

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
    }, [topicName]);


    if (topicLoading) return <p>Yükleniyor...</p>;
    if (topicError) return <p>Hata: {topicError}</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">{topicName}</h1>
            <div className="space-x-2 mb-4">
                <button
                    className={`px-4 py-2 rounded ${mode === 'explanation' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                    onClick={() => { setMode('explanation'); handleFetch('explanation'); }}
                >
                    Açıklama
                </button>
                <button
                    className={`px-4 py-2 rounded ${mode === 'flashcards' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                    onClick={() => { setMode('flashcards'); handleFetch('flashcards'); }}
                >
                    Flash Kart
                </button>
                <button
                    className={`px-4 py-2 rounded ${mode === 'fillblank' ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                    onClick={() => { setMode('fillblank'); handleFetch('fillblank'); }}
                >
                    Boşluk Doldurma
                </button>
            </div>

            {aiLoading && <p>AI içerik yükleniyor...</p>}
            {aiError && <p className="text-red-500">{aiError}</p>}
            {aiResult && (
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto">{JSON.stringify(aiResult, null, 2)}</pre>
            )}

            {userId && topicId && (
                <div className="mt-6 bg-white p-4 rounded shadow-sm">
                    <h2 className="font-semibold mb-2">İlerleme</h2>
                    {progress ? (
                        <div className="flex items-center gap-4">
                            <span>Seviye: {progress.mastery_level}</span>
                            <span>✔️: {progress.correct_count} ❌: {progress.wrong_count}</span>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Henüz ilerleme yok</p>
                    )}
                    <div className="mt-2 space-x-2">
                        <button className="px-3 py-1 bg-green-500 text-white rounded" onClick={() => submitReview(true)}>Doğru</button>
                        <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={() => submitReview(false)}>Yanlış</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TopicPage;
