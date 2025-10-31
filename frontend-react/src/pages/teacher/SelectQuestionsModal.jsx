// frontend-react/src/components/teacher/SelectQuestionsModal.jsx (FİLTRE SADELEŞTİRMELİ SON HALİ)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimes, faFilter } from '@fortawesome/free-solid-svg-icons';
// Varsayım: curriculumData buradan import ediliyor
import { curriculumData } from '../../data/curriculumData'; 
import '../../assets/styles/TeacherPages.css';


const API_QUESTIONS_URL = 'http://localhost:8000/api/questions';
const API_EXAMS_URL = 'http://localhost:8000/api/exams';

const difficultyLevels = ['Kolay', 'Orta', 'Zor'];

const SelectQuestionsModal = ({ show, handleClose, exam }) => {
    // Soru Havuzundaki tüm sorular
    const [allQuestions, setAllQuestions] = useState([]);
    // Seçili soruların ID'leri
    const [selectedQuestionIds, setSelectedQuestionIds] = useState(exam.questions || []);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    // Sadece Zorluk Filtresi kaldı
    const [filterZorluk, setFilterZorluk] = useState('');

    const token = localStorage.getItem('token');
    const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };


    useEffect(() => {
        if (show) {
            // Sadece modal açıldığında ve filtre değiştiğinde veriyi çek
            fetchQuestions();
            setSelectedQuestionIds(exam.questions || []);
            // Sınıf filtresi yerine sadece sınavın kategorisini gösteriyoruz (kullanıcıya bilgi vermek için)
            setError(null);
        }
    }, [show, filterZorluk]); // Sadece zorluk değişince soruları yeniden çek


    // --- 1. Filtreli Soruları Çekme ---
    const fetchQuestions = async () => {
        setLoading(true);
        setError(null);

        const params = {};
        // Sınavın kendi kategorisini otomatik filtrele (Backend bunu yapmalıydı, Frontend'de ek kontrol)
        params.category = exam.category; 
        
        if (filterZorluk) params.difficulty = filterZorluk;

        try {
            const response = await axios.get(API_QUESTIONS_URL, {
                ...axiosConfig,
                params: params // Filtreleri Backend'e gönder
            });
            setAllQuestions(response.data);
        } catch (err) {
            setError("Soru havuzu yüklenirken hata oluştu.");
        } finally {
            setLoading(false);
        }
    };


    // --- 2. Soru Seçme/Seçimi Kaldırma ---
    const toggleQuestionSelection = (questionId) => {
        setSelectedQuestionIds(prevIds => {
            if (prevIds.includes(questionId)) {
                return prevIds.filter(id => id !== questionId); // Seçimi kaldır
            } else {
                return [...prevIds, questionId]; // Seç
            }
        });
    };


    // --- 3. Sınavı Kaydetme (Soru ID'lerini Backend'e Gönderme) ---
    const handleSaveQuestions = async () => {
        setSaving(true);
        setError(null);
        
        try {
            // PUT /api/exams/:examId/questions
            const response = await axios.put(
                `${API_EXAMS_URL}/${exam._id}/questions`,
                { questionIds: selectedQuestionIds },
                axiosConfig
            );

            alert(`Başarılı: ${response.data.questionCount} soru sınava eklendi.`);
            
            handleClose(); // Modalı kapat

        } catch (err) {
            const msg = err.response?.data?.message || 'Sorular kaydedilirken bir hata oluştu.';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };


    if (!show) return null;
    const totalSelected = selectedQuestionIds.length;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div 
                className="modal-content" 
                onClick={(e) => e.stopPropagation()} 
                style={{maxWidth: '900px', width: '90%'}} 
            >
                
                <h2>{exam.title} Sınavına Soru Ekle/Çıkar</h2>
                {error && <div className="alert alert-danger">{error}</div>}

                {/* Filtreleme Çubuğu */}
                <div className="filter-bar filter-modal-bar" style={{gridTemplateColumns: '1fr 1fr', alignItems: 'center'}}>
                    
                    {/* Sınav Kategorisi Bilgisi (Filtre değil, bilgi) */}
                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.2rem'}}>
                        <label style={{fontWeight: '600'}}>Sınav Kategorisi (Zorunlu):</label>
                        <span>{exam.category}</span>
                    </div>

                    {/* Sadece Zorluk Filtresi */}
                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.2rem'}}>
                        <label style={{fontWeight: '600'}}>Zorluk Filtresi:</label>
                        <select value={filterZorluk} onChange={(e) => setFilterZorluk(e.target.value)} style={{maxWidth: '100%'}}>
                            <option value="">Tüm Zorluklar</option>
                            {difficultyLevels.map(level => <option key={level} value={level}>{level}</option>)}
                        </select>
                    </div>
                </div>
                
                <p style={{marginTop: '1rem'}}>
                    Toplam Seçili Soru: <strong>{totalSelected}</strong>
                </p>

                {/* Soru Listesi Alanı */}
                <div className="question-selection-area" style={{maxHeight: '400px', overflowY: 'auto', padding: '10px 0'}}>
                    {loading ? (
                        <p>Sorular yükleniyor...</p>
                    ) : (
                        allQuestions.map((q) => (
                            <div 
                                key={q._id} 
                                className={`question-item-selection ${selectedQuestionIds.includes(q._id) ? 'selected' : ''}`}
                                onClick={() => toggleQuestionSelection(q._id)} 
                            >
                                <input 
                                    type="checkbox"
                                    checked={selectedQuestionIds.includes(q._id)}
                                    readOnly 
                                    style={{marginRight: '1rem', transform: 'scale(1.2)'}}
                                />
                                <div style={{flexGrow: 1}}>
                                    <span className="question-subject-badge">{q.subject} - {q.classLevel}</span>
                                    <span className={`question-difficulty-badge difficulty-${q.difficulty?.toLowerCase()}`}>{q.difficulty}</span>
                                    <p style={{margin: 0, fontWeight: 600, marginTop: '0.2rem'}}>{q.text}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>


                {/* Alt Aksiyon Butonları */}
                <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={handleClose} disabled={saving}>
                        <FontAwesomeIcon icon={faTimes} className="me-2" /> Kapat
                    </button>
                    <button type="button" className="btn-primary" onClick={handleSaveQuestions} disabled={saving}>
                        {saving ? 'Kaydediliyor...' : 'Sınavı Kaydet'}
                        <FontAwesomeIcon icon={faSave} className="ms-2" />
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SelectQuestionsModal;