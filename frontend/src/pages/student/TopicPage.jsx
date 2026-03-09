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

    useEffect(() => {
        if (topicName && topicName !== '...') {
            handleFetch('explanation');
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
        </div>
    );
};

export default TopicPage;
