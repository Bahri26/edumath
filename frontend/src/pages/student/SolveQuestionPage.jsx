import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import MathText from '../../components/common/MathText';

const SolveQuestionPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [question, setQuestion] = useState(null);
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(null);

    const [resultMeta, setResultMeta] = useState(null);

    useEffect(() => {
        async function load() {
            try {
                const qRes = await api.get(`/questions/${id}`);
                setQuestion(qRes.data);
                const oRes = await api.get(`/questions/${id}/options`);
                setOptions(oRes.data.data || []);

            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    function handleSelect(optId) {
        if (submitted) return;
        setSelected(optId);
    }

    async function handleSubmit() {
        if (selected == null) return;
        setSubmitted(true);
        try {
            const res = await api.post('/learning/answer', {
                questionId: Number(id),
                selectedOptionId: selected,
                source: 'recommended_question'
            });
            const payload = res.data?.data;
            setIsCorrect(Boolean(payload?.isCorrect));
            setResultMeta(payload || null);
        } catch (e) {
            const opt = options.find((o) => o.option_id === selected || o.id === selected);
            const correct = opt && (opt.is_correct === 1 || opt.is_correct === true);
            setIsCorrect(correct);
        }
    }

    if (loading) return <p>Yükleniyor...</p>;
    if (error) return <p className="text-red-500">Hata: {error}</p>;
    if (!question) return <p>Soru bulunamadı.</p>;

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            <button onClick={() => navigate(-1)} className="text-indigo-600 hover:underline mb-4">← Geri</button>
            <h1 className="text-xl font-bold mb-4">Soru Çöz</h1>
            <div className="bg-white p-6 rounded-2xl shadow">
                <div className="mb-6">
                    <MathText text={question.content_text} />
                </div>
                <div className="space-y-4">
                    {options.map((opt) => {
                        const oid = opt.option_id || opt.id;
                        const isSelected = selected === oid;
                        const bg = isSelected ? 'bg-indigo-100' : 'bg-gray-100';
                        let border = 'border-transparent';
                        if (submitted) {
                            if (oid === selected) border = isCorrect ? 'border-green-500' : 'border-red-500';
                            if (opt.is_correct) border = 'border-green-500';
                        }
                        return (
                            <div
                                key={oid}
                                className={`${bg} ${border} rounded-lg p-3 cursor-pointer`}
                                onClick={() => handleSelect(oid)}
                            >
                                <MathText text={opt.option_text} />
                            </div>
                        );
                    })}
                </div>
                {!submitted && (
                    <button
                        className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl"
                        disabled={selected == null}
                        onClick={handleSubmit}
                    >
                        Cevabı Gönder
                    </button>
                )}
                {submitted && (
                    <div className="mt-6 text-lg font-semibold">
                        {isCorrect ? (
                            <span className="text-green-600">Tebrikler, doğru!</span>
                        ) : (
                            <span className="text-red-600">Maalesef yanlış.</span>
                        )}
                        {resultMeta && (
                            <div className="mt-3 text-sm font-medium text-gray-600">
                                <div>XP +{resultMeta.xp_gain || 0}</div>
                                {resultMeta.skill_state?.topic_name && (
                                    <div>{resultMeta.skill_state.topic_name} mastery: %{Math.round(resultMeta.skill_state.mastery_score || 0)}</div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SolveQuestionPage;
