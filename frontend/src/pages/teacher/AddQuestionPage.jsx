import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import MathText from '../../components/common/MathText';

const AddQuestionPage = () => {
    const { examId } = useParams();
    const navigate = useNavigate();

    // -- STATE'LER --
    const [poolQuestions, setPoolQuestions] = useState([]); // Tüm soru havuzu
    const [isLoading, setIsLoading] = useState(false); // Buton kilitleme
    const [examInfo, setExamInfo] = useState(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [examQuestions, setExamQuestions] = useState([]);

    // Sayfalandırma State'leri (Pagination)
    const [currentPage, setCurrentPage] = useState(1);
    const questionsPerPage = 6; // Her sayfada kaç soru görünsün?

    // İstatistikler (7-7-7 Kuralı için)
    const [stats, setStats] = useState({
        easy: 0, medium: 0, hard: 0, total: 0
    });
    
    // Eklenmiş soruların ID listesi (Gizlemek için)
    const [addedQuestionIds, setAddedQuestionIds] = useState([]);

    // Filtre State'leri
    const [filterClass, setFilterClass] = useState('all'); 
    const [filterDifficulty, setFilterDifficulty] = useState('all'); 


    const normalizeDifficulty = (value) => {
        const normalized = String(value || '').toLocaleLowerCase('tr-TR').trim();
        if (['1', 'easy', 'kolay'].includes(normalized)) return 'easy';
        if (['2', 'medium', 'orta'].includes(normalized)) return 'medium';
        if (['3', 'hard', 'zor'].includes(normalized)) return 'hard';
        return 'medium';
    };

    const parseQuestionMeta = (question) => {
        const rawTopic = String(question.topic || '').trim();
        const topicMatch = rawTopic.match(/^(\d+)\.\s*Sınıf\s*-\s*(.+)$/i);
        const topicClassLevel = topicMatch ? Number(topicMatch[1]) : null;
        const classLevel = Number(question.class_level || question.grade_level || topicClassLevel || 0);
        const topic = topicMatch ? topicMatch[2].trim() : rawTopic;

        return {
            classLevel: Number.isInteger(classLevel) && classLevel > 0 ? classLevel : null,
            topic: topic || null,
            difficulty: normalizeDifficulty(question.difficulty_level)
        };
    };

    useEffect(() => {
        fetchExamInfo();
        fetchPool(); 
        updateExamStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const isExamDetailRoute = /^\/exams\/\d+$/.test(location.pathname);
    const viewOnly = query.get('view') === '1' || query.get('mode') === 'view' || isExamDetailRoute;

    const getExamStageMeta = () => {
        const status = String(examInfo?.status || '').toLocaleLowerCase('tr-TR');
        const published = Number(examInfo?.is_published) === 1 || status === 'published' || status === 'archived';

        if (published) {
            return { label: '✅ Sınav Bitmiş (Yayınlandı)', color: '#2e7d32', bg: '#e8f5e9' };
        }
        if ((stats.total || 0) > 0 || (status && status !== 'draft')) {
            return { label: '🟡 Henüz Bitmemiş (Hazırlanıyor)', color: '#b26a00', bg: '#fff8e1' };
        }
        return { label: '📝 Taslak', color: '#0f766e', bg: '#ecfeff' };
    };

    const fetchExamInfo = async () => {
        try {
            const res = await api.get(`/exams/${examId}`);
            const exam = res.data?.data || res.data || null;
            setExamInfo(exam);

            const status = String(exam?.status || '').toLocaleLowerCase('tr-TR');
            const published = Number(exam?.is_published) === 1 || status === 'published';
            setIsReadOnly(published);
        } catch (error) {
            console.error('Sınav bilgisi alınamadı', error);
        }
    };

    // Filtre değişince sayfayı başa al
    useEffect(() => {
        setCurrentPage(1);
    }, [filterClass, filterDifficulty]);

    // 1. Havuzdaki TÜM Soruları Getir
    const fetchPool = async () => {
        try {
            const res = await api.get(`/questions?limit=1000`);
            const payload = res.data && (res.data.data !== undefined ? res.data.data : (res.data.rows !== undefined ? res.data.rows : res.data));
            
            setPoolQuestions(payload || []);
        } catch (error) {
            console.error("Havuz yüklenemedi", error);
        }
    };

    // 2. Sınav İstatistiklerini Güncelle
    const updateExamStats = async () => {
        try {
            const res = await api.get(`/exams/${examId}/questions`);
            const questions = (res.data && (res.data.data !== undefined ? res.data.data : (res.data.rows !== undefined ? res.data.rows : res.data))) || [];

            let e = 0, m = 0, h = 0;
            questions.forEach(q => {
                const diff = normalizeDifficulty(q.difficulty_level);
                if (diff === 'easy') e++;
                else if (diff === 'medium') m++;
                else if (diff === 'hard') h++;
            });

            setStats({ easy: e, medium: m, hard: h, total: questions.length });
            setAddedQuestionIds(questions.map(q => q.question_id));
            setExamQuestions(questions);
        } catch (error) {
            console.error("İstatistik hatası", error);
            setStats({ easy: 0, medium: 0, hard: 0, total: 0 });
            setAddedQuestionIds([]);
            setExamQuestions([]);
        }
    };

    const questionAnalysis = (() => {
        const byClass = {};
        const byTopic = {};

        examQuestions.forEach((q) => {
            const meta = parseQuestionMeta(q);
            const classKey = meta.classLevel ? `${meta.classLevel}. Sınıf` : 'Belirsiz Sınıf';
            const topicKey = meta.topic || 'Belirsiz Konu';

            byClass[classKey] = (byClass[classKey] || 0) + 1;
            byTopic[topicKey] = (byTopic[topicKey] || 0) + 1;
        });

        const topTopics = Object.entries(byTopic)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);

        return {
            byClass: Object.entries(byClass).sort((a, b) => a[0].localeCompare(b[0], 'tr-TR')),
            topTopics
        };
    })();

    // --- OTOMATİK DOLDURMA ---
    const handleAutoFill = async () => {
        if (isReadOnly) return alert('Yayınlanmış sınavlarda soru değişikliği yapılamaz.');

        const neededEasy = 7 - stats.easy;
        const neededMedium = 7 - stats.medium;
        const neededHard = 7 - stats.hard;

        if (neededEasy <= 0 && neededMedium <= 0 && neededHard <= 0) {
            return alert("✅ Sınav zaten tam dengeli ve dolu!");
        }

        const classLabel = filterClass === 'all' ? "Tüm Sınıflar" : `${filterClass}. Sınıf`;

        if (!window.confirm(`"${classLabel}" havuzundan eksik sorular rastgele seçilip eklensin mi?\n\nİhtiyaç:\n🟢 Kolay: ${Math.max(0, neededEasy)}\n🟡 Orta: ${Math.max(0, neededMedium)}\n🔴 Zor: ${Math.max(0, neededHard)}`)) {
            return;
        }

        setIsLoading(true);

        const availableQuestions = poolQuestions.filter(q => {
            const isNotAdded = !addedQuestionIds.includes(q.question_id);
            const matchesClass = filterClass === 'all' || String(q.class_level) === String(filterClass);
            return isNotAdded && matchesClass;
        });
        
        const shuffled = availableQuestions.sort(() => 0.5 - Math.random());
        const selectedIds = [];
        let addedE = 0, addedM = 0, addedH = 0;

        const candidatesEasy = shuffled.filter(q => normalizeDifficulty(q.difficulty_level) === 'easy').slice(0, Math.max(0, neededEasy));
        candidatesEasy.forEach(q => { selectedIds.push(q.question_id); addedE++; });

        const candidatesMedium = shuffled.filter(q => normalizeDifficulty(q.difficulty_level) === 'medium').slice(0, Math.max(0, neededMedium));
        candidatesMedium.forEach(q => { selectedIds.push(q.question_id); addedM++; });

        const candidatesHard = shuffled.filter(q => normalizeDifficulty(q.difficulty_level) === 'hard').slice(0, Math.max(0, neededHard));
        candidatesHard.forEach(q => { selectedIds.push(q.question_id); addedH++; });

        if (selectedIds.length === 0) {
            setIsLoading(false);
            return alert(`⚠️ "${classLabel}" için uygun kriterde soru bulunamadı!`);
        }

        try {
            await Promise.all(selectedIds.map(qid => api.post('/exam_questions', { exam_id: examId, question_id: qid })));
            await updateExamStats();
            alert(`🎉 İşlem Tamamlandı!\n\n"${classLabel}" Havuzundan Toplam ${selectedIds.length} soru eklendi:\n\n🟢 +${addedE} Kolay\n🟡 +${addedM} Orta\n🔴 +${addedH} Zor`);
        } catch (error) {
            console.error(error);
            alert("Hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- TEK TEK HAVUZDAN EKLEME ---
    const handleAddFromPool = async (question) => {
        if (isLoading) return;
        if (isReadOnly) return alert('Yayınlanmış sınavlarda soru değişikliği yapılamaz.');
        if (stats.total >= 21) return alert("⚠️ Toplam 21 soru limitine ulaştınız!");
        const diff = normalizeDifficulty(question.difficulty_level);
        if (diff === 'easy' && stats.easy >= 7) return alert("⚠️ Kolay seviye kotası (7 soru) doldu!");
        if (diff === 'medium' && stats.medium >= 7) return alert("⚠️ Orta seviye kotası (7 soru) doldu!");
        if (diff === 'hard' && stats.hard >= 7) return alert("⚠️ Zor seviye kotası (7 soru) doldu!");

        try {
            await api.post('/exam_questions', { exam_id: examId, question_id: question.question_id });
            updateExamStats();
        } catch (error) {
            alert("Hata oluştu.");
        }
    };

    const handleRemoveFromExam = async (questionId) => {
        if (isReadOnly) return alert('Yayınlanmış sınavlarda soru değişikliği yapılamaz.');
        if (!window.confirm('Bu soruyu sınavdan çıkarmak istiyor musunuz?')) return;

        try {
            const resLinks = await api.get('/exam_questions');
            const links = (resLinks.data && (resLinks.data.data !== undefined ? resLinks.data.data : (resLinks.data.rows !== undefined ? resLinks.data.rows : resLinks.data))) || [];
            const link = links.find(l => Number(l.exam_id) === Number(examId) && Number(l.question_id) === Number(questionId));
            if (link && link.id) {
                await api.delete(`/exam_questions/${link.id}`);
            }
            await updateExamStats();
        } catch (error) {
            alert(error.response?.data?.message || 'Soru sınavdan çıkarılamadı.');
        }
    };

    // --- LİSTELEME VE SAYFALANDIRMA MANTIĞI ---
    const getFilteredPool = () => {
        return poolQuestions.filter(q => {
            const isNotAdded = !addedQuestionIds.includes(q.question_id);
            const matchesClass = filterClass === 'all' || String(q.class_level) === String(filterClass); 
            const matchesDiff = filterDifficulty === 'all' || normalizeDifficulty(q.difficulty_level) === filterDifficulty;
            return isNotAdded && matchesClass && matchesDiff;
        });
    };

    const filteredQuestions = getFilteredPool();
    const indexOfLastQuestion = currentPage * questionsPerPage;
    const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
    const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
    const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);

    const rightPanel = (
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '10px', border:'1px solid #ddd', display:'flex', flexDirection:'column', height:'100%', gap:'15px' }}>
            <div style={{ backgroundColor: 'white', padding: '12px 15px', borderRadius: '10px', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                        <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Sınav</div>
                        <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{examInfo?.title || `#${examId}`}</div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '6px 10px', borderRadius: '999px', color: getExamStageMeta().color, backgroundColor: getExamStageMeta().bg }}>
                        {getExamStageMeta().label}
                    </span>
                </div>
            </div>

            {/* İSTATİSTİK KUTUSU (Üstte) */}
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                    <h4 style={{margin:'0 0 6px 0', color:'#2c3e50'}}>📊 Sınav Dengesi</h4>
                    <div style={{display:'flex', gap:'12px', fontSize:'13px', color:'#333'}}>
                        <div>🟢 Kolay: <strong style={{marginLeft:'6px'}}>{stats.easy}</strong></div>
                        <div>🟡 Orta: <strong style={{marginLeft:'6px'}}>{stats.medium}</strong></div>
                        <div>🔴 Zor: <strong style={{marginLeft:'6px'}}>{stats.hard}</strong></div>
                        <div style={{marginLeft:'10px', color:'#7f8c8d'}}>Toplam: <strong>{stats.total}</strong></div>
                    </div>
                </div>

                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                    <button onClick={() => navigate('/exams')} style={{padding:'10px 14px', backgroundColor:'#34495e', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Sınavlara Dön</button>
                </div>
            </div>

            {/* --- HAZIRLANAN SINAV SORULARI --- */}
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', border:'1px solid #eee', display:'flex', flexDirection:'column', minHeight: '260px' }}>
                <h4 style={{margin:'0 0 10px 0', color:'#2c3e50', borderBottom:'1px solid #eee', paddingBottom:'5px'}}>👁️ Hazırlanan Sınav Soruları</h4>
                <div style={{flex:1, overflowY:'auto'}}>
                    {examQuestions.length === 0 ? (
                        <p style={{margin:0, color:'#999'}}>Bu sınavda henüz soru yok.</p>
                    ) : (
                        examQuestions.map((question, index) => {
                            const meta = parseQuestionMeta(question);
                            return (
                                <div key={question.question_id} style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px', padding:'8px', border:'1px solid #eee', borderRadius:'6px'}}>
                                    <span style={{color:'#999', minWidth:'22px'}}>{index + 1}.</span>
                                    {question.image_url && (
                                        <div style={{width:'42px', height:'42px', borderRadius:'6px', overflow:'hidden', border:'1px solid #e5e7eb', backgroundColor:'#f8fafc', flexShrink:0}}>
                                            <img src={question.image_url} alt="Soru görseli" style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                        </div>
                                    )}
                                    <div style={{flex:1}}>
                                        <div style={{fontSize:'12px', color:'#666'}}>
                                            {meta.classLevel ? `${meta.classLevel}. Sınıf` : ''}
                                            {meta.topic ? ` • ${meta.topic}` : ''}
                                        </div>
                                        <div style={{fontSize:'13px', color:'#2c3e50', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{question.content_text}</div>
                                    </div>
                                    {!isReadOnly && (
                                        <button onClick={() => handleRemoveFromExam(question.question_id)} style={{background:'none', border:'none', color:'#e74c3c', cursor:'pointer', fontSize:'18px'}}>×</button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* --- OPSİYONEL: Soru Bankası (Edit modunda) --- */}
            {!isReadOnly && !viewOnly && (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <h3 style={{color:'#2980b9', margin:0}}>🏦 Soru Bankası</h3>
                    <div style={{display:'flex', gap:'10px'}}>
                        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} style={{padding:'5px', borderRadius:'5px', border:'1px solid #3498db', fontWeight:'bold', color:'#2980b9'}}>
                            <option value="all">Tüm Sınıflar</option>
                            <option value="1">1. Sınıf</option>
                            <option value="2">2. Sınıf</option>
                            <option value="3">3. Sınıf</option>
                            <option value="4">4. Sınıf</option>
                        </select>
                        <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)} style={{padding:'5px', borderRadius:'5px', border:'1px solid #3498db', fontWeight:'bold', color:'#2980b9'}}>
                            <option value="all">Tüm Seviyeler</option>
                            <option value="easy">Kolay</option>
                            <option value="medium">Orta</option>
                            <option value="hard">Zor</option>
                        </select>
                    </div>
                </div>
            )}

            {!isReadOnly && !viewOnly && (
                <div style={{ flex:1, overflowY:'auto', paddingRight:'5px' }}>
                    {currentQuestions.map(q => (
                        <div key={q.question_id} style={{ backgroundColor:'white', padding:'15px', marginBottom:'10px', borderRadius:'8px', border:'1px solid #eee', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <div style={{flex:1}}>
                                {(() => {
                                    const meta = parseQuestionMeta(q);
                                    return (
                                        <div style={{display:'flex', gap:'10px', marginBottom:'5px'}}>
                                            {meta.classLevel && (
                                                <span style={{fontSize:'12px', backgroundColor:'#d1ecf1', color:'#0c5460', padding:'2px 6px', borderRadius:'4px'}}>{`${meta.classLevel}. Sınıf`}</span>
                                            )}
                                            <span style={{fontSize:'12px', 
                                                backgroundColor: meta.difficulty === 'easy' ? '#d4edda' : meta.difficulty === 'medium' ? '#fff3cd' : '#f8d7da', 
                                                color: meta.difficulty === 'easy' ? '#155724' : meta.difficulty === 'medium' ? '#856404' : '#721c24', 
                                                padding:'2px 6px', borderRadius:'4px'
                                            }}>
                                                {meta.difficulty === 'easy' ? 'Kolay' : meta.difficulty === 'medium' ? 'Orta' : 'Zor'}
                                            </span>
                                            {meta.topic && (
                                                <span style={{fontSize:'12px', backgroundColor:'#f1f2f6', color:'#57606f', padding:'2px 6px', borderRadius:'4px'}}>{meta.topic}</span>
                                            )}
                                        </div>
                                    );
                                })()}
                                <div style={{margin:0, fontWeight:'500', color:'#333'}}>
                                    {q.image_url && (
                                        <div style={{marginBottom:'8px', border:'1px solid #e5e7eb', borderRadius:'8px', overflow:'hidden', backgroundColor:'#f8fafc', maxHeight:'140px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                                            <img src={q.image_url} alt="Soru görseli" style={{maxHeight:'140px', width:'100%', objectFit:'contain'}} />
                                        </div>
                                    )}
                                    <MathText text={q.content_text} />
                                </div>
                            </div>
                            <button 
                                onClick={() => handleAddFromPool(q)}
                                disabled={isLoading}
                                style={{backgroundColor: isLoading ? '#ccc' : '#3498db', color:'white', border:'none', padding:'8px 15px', borderRadius:'5px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight:'bold', marginLeft:'10px'}}
                            >
                                Ekle ➕
                            </button>
                        </div>
                    ))}

                    {filteredQuestions.length === 0 && (
                        <p style={{textAlign:'center', color:'#999', marginTop:'20px'}}>
                            {poolQuestions.length === 0 ? "Yükleniyor..." : "Filtreye uygun soru bulunamadı."}
                        </p>
                    )}

                    {filteredQuestions.length > questionsPerPage && (
                        <div style={{display:'flex', justifyContent:'center', alignItems:'center', marginTop:'15px', gap:'15px'}}>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                style={{padding:'8px 15px', border:'1px solid #ddd', borderRadius:'5px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', backgroundColor: currentPage === 1 ? '#eee' : 'white'}}
                            >
                                ⬅️ Önceki
                            </button>
                            
                            <span style={{fontWeight:'bold', color:'#555'}}>
                                Sayfa {currentPage} / {totalPages}
                            </span>
                            
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                style={{padding:'8px 15px', border:'1px solid #ddd', borderRadius:'5px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', backgroundColor: currentPage === totalPages ? '#eee' : 'white'}}
                            >
                                Sonraki ➡️
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', border:'1px solid #eee' }}>
                <h4 style={{margin:'0 0 10px 0', color:'#2c3e50', borderBottom:'1px solid #eee', paddingBottom:'5px'}}>📈 Soruların Analizi</h4>

                {examQuestions.length === 0 ? (
                    <p style={{margin:0, color:'#999'}}>Analiz için sınava en az 1 soru eklenmeli.</p>
                ) : (
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
                        <div style={{border:'1px solid #eef2f7', borderRadius:'8px', padding:'10px'}}>
                            <div style={{fontSize:'12px', color:'#7f8c8d', marginBottom:'6px'}}>Sınıf Dağılımı</div>
                            {questionAnalysis.byClass.map(([label, count]) => (
                                <div key={label} style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#2c3e50', marginBottom:'4px'}}>
                                    <span>{label}</span>
                                    <strong>{count}</strong>
                                </div>
                            ))}
                        </div>

                        <div style={{border:'1px solid #eef2f7', borderRadius:'8px', padding:'10px'}}>
                            <div style={{fontSize:'12px', color:'#7f8c8d', marginBottom:'6px'}}>Öne Çıkan Konular</div>
                            {questionAnalysis.topTopics.map(([label, count]) => (
                                <div key={label} style={{display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#2c3e50', marginBottom:'4px'}}>
                                    <span>{label}</span>
                                    <strong>{count}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    if (viewOnly) {
        return (
            <div style={{ maxWidth: '1200px', margin: '20px auto', display:'block', fontFamily: 'Segoe UI', height:'85vh' }}>
                {rightPanel}
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '20px auto', display:'grid', gridTemplateColumns:'350px 1fr', gap:'20px', fontFamily: 'Segoe UI', height:'85vh' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:'20px', height:'100%', overflow:'hidden' }}>
                {/* STATISTICS BOX (left) */}
                <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <h4 style={{margin:'0 0 10px 0', color:'#2c3e50', borderBottom:'1px solid #eee', paddingBottom:'5px'}}>📊 Sınav Dengesi (Hedef: 21)</h4>
                    {examInfo && (
                        <p style={{margin:'0 0 10px 0', fontSize:'12px', color: getExamStageMeta().color, backgroundColor: getExamStageMeta().bg, padding:'6px 8px', borderRadius:'6px', fontWeight:'bold'}}>
                            {getExamStageMeta().label}
                        </p>
                    )}
                    
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', fontSize:'14px'}}>
                        <span>🟢 Kolay:</span>
                        <span style={{fontWeight:'bold', color: stats.easy === 7 ? '#27ae60' : stats.easy > 7 ? '#e74c3c' : '#333'}}>{stats.easy} / 7</span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', fontSize:'14px'}}>
                        <span>🟡 Orta:</span>
                        <span style={{fontWeight:'bold', color: stats.medium === 7 ? '#27ae60' : stats.medium > 7 ? '#e74c3c' : '#333'}}>{stats.medium} / 7</span>
                    </div>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px', fontSize:'14px'}}>
                        <span>🔴 Zor:</span>
                        <span style={{fontWeight:'bold', color: stats.hard === 7 ? '#27ae60' : stats.hard > 7 ? '#e74c3c' : '#333'}}>{stats.hard} / 7</span>
                    </div>

                    <div style={{backgroundColor:'#ecf0f1', height:'10px', borderRadius:'5px', overflow:'hidden', marginBottom:'15px'}}>
                        <div style={{width: `${Math.min(100, (stats.total / 21) * 100)}%`, backgroundColor: stats.total >= 21 ? '#27ae60' : '#3498db', height:'100%'}}></div>
                    </div>

                    <button 
                        onClick={handleAutoFill}
                        disabled={isLoading || stats.total >= 21 || isReadOnly}
                        style={{
                            width:'100%', padding:'12px', backgroundColor: (isLoading || isReadOnly) ? '#95a5a6' : '#8e44ad',
                            color:'white', border:'none', borderRadius:'5px', cursor: (isLoading || isReadOnly) ? 'not-allowed' : 'pointer',
                            fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                            boxShadow: '0 4px 6px rgba(142, 68, 173, 0.3)'
                        }}
                    >
                        🎲 Otomatik Doldur
                    </button>
                    
                    <button onClick={() => navigate('/teacher-dashboard')} style={{width:'100%', marginTop:'10px', padding:'10px', backgroundColor:'#34495e', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', fontWeight:'bold', fontSize:'15px', letterSpacing:'0.5px'}}>Panele Dön</button>
                </div>

            </div>

            <div>
                {rightPanel}
            </div>
        </div>
    );
};

export default AddQuestionPage;