// frontend-react/src/pages/teacher/TeacherExams.jsx (YENİ ALANLAR EKLENMİŞ SON HALİ)

import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import '../../assets/styles/TeacherPages.css';
import PageHeader from '../../components/common/PageHeader'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPlus, 
    faClock, 
    faListOl, 
    faPenToSquare, 
    faUserPlus 
} from '@fortawesome/free-solid-svg-icons';

// --- CURRICULUM DATA (Varsayım: Bu veriler erişilebilir) ---
const curriculumData = {
    dersler: ["Matematik", "Fizik", "Kimya", "Biyoloji", "Tarih"],
    siniflar: ["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf", "9. Sınıf", "10. Sınıf", "11. Sınıf", "12. Sınıf"],
    // ...
};
const DUMMY_EXAMS = [
    { _id: 'e1', title: 'Matematik 1. Vize', questionCount: 20, duration: 45 },
    { _id: 'e2', title: 'React Temelleri Testi', questionCount: 10, duration: 20 },
];

const API_URL = 'http://localhost:8000/api/exams';
const token = localStorage.getItem('token'); 
const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };


function TeacherExams() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); 

    // --- YENİ EKLENDİ: Form State'leri ---
    const [newExamTitle, setNewExamTitle] = useState('');
    const [newExamDuration, setNewExamDuration] = useState(40);
    const [newExamCategory, setNewExamCategory] = useState(curriculumData.dersler[0]); // Kategori/Ders
    const [newExamPassMark, setNewExamPassMark] = useState(50); // Geçme Notu
    const [newExamClass, setNewExamClass] = useState(''); // Atanacak Sınıf
    // --- YENİ EKLENDİ SONU ---

    // ... (fetchExams fonksiyonu aynı kalır) ...
    const fetchExams = async () => {
        setLoading(true);
        setError(null);
        try {
            // Backend'den çekmek için: 
            // const response = await axios.get(API_URL, axiosConfig); 
            // setExams(response.data); 
            
            setTimeout(() => {
                setExams(DUMMY_EXAMS);
                setLoading(false);
            }, 500); 

        } catch (err) {
            setError('Sınav listesi yüklenirken bir hata oluştu.');
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchExams();
    }, []);

    const handleAta = (examId) => {
        // Öğrenci veya sınıfa sınav atama (Modal açılabilir)
        alert(`Sınav ID ${examId} öğrencilere atanacak.`);
    };

    // --- GÜNCELLENDİ: Yeni Alanları Gönderme ---
    const handleCreateExam = async (e) => {
        e.preventDefault();
        // Sadece başlık, süre ve kategori kontrolü
        if (!newExamTitle || !newExamDuration || !newExamCategory) {
            setError('Başlık, süre ve kategori zorunludur.');
            return;
        }

        const newExamData = {
            title: newExamTitle,
            duration: parseInt(newExamDuration),
            category: newExamCategory, // Yeni
            passMark: parseInt(newExamPassMark), // Yeni
            associatedClass: newExamClass || null, // Yeni (Opsiyonel)
            questions: [], 
        };

        try {
            // TODO: Backend'e axios.post ile gönderilir
            console.log('Yeni Sınav Oluşturuldu ve Gönderildi:', newExamData);

            // SAHTE VERİ GÜNCELLEMESİ
            const dummyResponse = { ...newExamData, _id: `e${Date.now()}`, questionCount: 0 };
            setExams([dummyResponse, ...exams]); 
            
            // Modalı kapat ve formları temizle
            setIsModalOpen(false); 
            setNewExamTitle('');
            setNewExamCategory(curriculumData.dersler[0]);
            setNewExamPassMark(50);
            setNewExamClass('');
            setError(null);
        } catch (err) {
            setError('Sınav oluşturma hatası: Sunucuya bağlanılamadı.');
        }
    };


    return (
        <div className="teacher-page-container">
            {/* 1. BAŞLIK */}
            <PageHeader title="Sınavlar">
                <button 
                    className="btn-primary" 
                    onClick={() => {
                        setError(null);
                        setIsModalOpen(true);
                    }}
                >
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Yeni Sınav Oluştur
                </button>
            </PageHeader>

            {error && <div className="alert alert-danger page-card">{error}</div>}
            
            {/* 2. SINAV KARTLARI LİSTESİ */}
            <div className="exams-grid">
                {/* ... (Liste JSX'i aynı kalır) ... */}
            </div>

            {/* 3. YENİ SINAV OLUŞTURMA MODALI */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Yeni Sınav Oluştur</h2>
                        <form onSubmit={handleCreateExam}>
                            
                            {/* Başlık */}
                            <div className="form-group">
                                <label htmlFor="examTitle">Sınav Başlığı</label>
                                <input 
                                    type="text" 
                                    id="examTitle"
                                    value={newExamTitle}
                                    onChange={(e) => setNewExamTitle(e.target.value)}
                                    placeholder="Örn: 11. Sınıf Fizik 1. Dönem"
                                    autoFocus
                                    required
                                />
                            </div>
                            
                            {/* Kategori/Ders Seçimi (YENİ EKLENDİ) */}
                            <div className="form-group">
                                <label htmlFor="examCategory">Sınav Kategorisi (Ders)</label>
                                <select 
                                    id="examCategory" 
                                    value={newExamCategory} 
                                    onChange={(e) => setNewExamCategory(e.target.value)}
                                    required
                                >
                                    {curriculumData.dersler.map(ders => (
                                        <option key={ders} value={ders}>{ders}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Süre */}
                            <div className="form-group">
                                <label htmlFor="examDuration">Sınav Süresi (Dakika)</label>
                                <input 
                                    type="number" 
                                    id="examDuration"
                                    value={newExamDuration}
                                    onChange={(e) => setNewExamDuration(e.target.value)}
                                    min="5"
                                    required
                                />
                            </div>
                            
                            {/* Geçme Notu (YENİ EKLENDİ) */}
                            <div className="form-group">
                                <label htmlFor="passMark">Geçme Notu (%)</label>
                                <input 
                                    type="number" 
                                    id="passMark"
                                    value={newExamPassMark}
                                    onChange={(e) => setNewExamPassMark(e.target.value)}
                                    min="0" max="100"
                                    required
                                />
                            </div>
                            
                            {/* Atanacak Sınıf (YENİ EKLENDİ - Opsiyonel) */}
                            <div className="form-group">
                                <label htmlFor="examClass">Atanacak Sınıf (Opsiyonel)</label>
                                <select 
                                    id="examClass" 
                                    value={newExamClass} 
                                    onChange={(e) => setNewExamClass(e.target.value)}
                                >
                                    <option value="">(Sınıf Seçilmedi)</option>
                                    {curriculumData.siniflar.map(sinif => (
                                        <option key={sinif} value={sinif}>{sinif}</option>
                                    ))}
                                </select>
                            </div>


                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                                    İptal
                                </button>
                                <button type="submit" className="btn-primary">
                                    Oluştur ve Devam Et
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

export default TeacherExams;