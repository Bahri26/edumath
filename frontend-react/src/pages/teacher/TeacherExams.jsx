// frontend-react/src/pages/teacher/TeacherExams.jsx (TAM VE GÜNCEL SON HALİ)

import React, { useState, useEffect } from 'react';
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

// --- YOL DÜZELTİLDİ: curriculumData.js importu ---
import { curriculumData } from '../../data/curriculumData';
// --- YOL DÜZELTME SONU ---

// Soru Seçme Modalını import edin
import SelectQuestionsModal from './SelectQuestionsModal';
import ExamCard from '../../components/common/ExamCard';


// --- DUMMY/SAHTE VERİ ---
const DUMMY_EXAMS = [
    { _id: 'e1', title: 'Matematik 1. Vize', questionCount: 20, duration: 45, questions: ['q1','q2'] },
    { _id: 'e2', title: 'React Temelleri Testi', questionCount: 10, duration: 20, questions: ['q3','q4'] },
];

const API_URL = 'http://localhost:8000/api/exams';

function TeacherExams() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Yeni Sınav Oluştur modalı
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); 

    // Soru Seçme/Düzenleme modalı
    const [isSelectQuestionsModalOpen, setIsSelectQuestionsModalOpen] = useState(false);
    const [currentExamToEdit, setCurrentExamToEdit] = useState(null); // Düzenlenecek sınavı tutar

    // --- Form State'leri ---
    const [newExamTitle, setNewExamTitle] = useState('');
    const [newExamDuration, setNewExamDuration] = useState(40);
    const [newExamCategory, setNewExamCategory] = useState(curriculumData.dersler[0]);
    const [newExamPassMark, setNewExamPassMark] = useState(50);
    const [newExamClass, setNewExamClass] = useState(''); 

    const fetchExams = async () => {
        setLoading(true);
        setError(null);
        try {
            // TODO: API'den çekmek için burayı açın: const response = await axios.get(API_URL, axiosConfig); 
            
            setTimeout(() => {
                setExams(DUMMY_EXAMS);
                setLoading(false);
            }, 500); 

        } catch (error) {
            setError('Sınav listesi yüklenirken bir hata oluştu.');
            setLoading(false);
            console.error('Hata:', error);
        }
    };
    useEffect(() => {
        fetchExams();
    }, []);

    const handleAta = (examId) => {
        // TODO: AssignmentModal burada açılmalı
        alert(`Sınav ID ${examId} öğrencilere atanacak. (Atama modalı açılacak)`);
    };
    
    const handleEditQuestions = (exam) => { // exam objesi alır
        // Düzenlenecek sınavı state'e kaydet ve modalı aç
        setCurrentExamToEdit(exam);
        setIsSelectQuestionsModalOpen(true);
    };

    const handleCreateExam = async (e) => {
        e.preventDefault();
        if (!newExamTitle || !newExamDuration || !newExamCategory) {
            setError('Başlık, süre ve kategori zorunludur.');
            return;
        }

        const newExamData = {
            title: newExamTitle,
            duration: parseInt(newExamDuration),
            category: newExamCategory, 
            passMark: parseInt(newExamPassMark), 
            associatedClass: newExamClass || null, 
            questions: [], 
        };

        try {
            // TODO: Backend'e axios.post ile gönder
            // const response = await axios.post(API_URL, newExamData, axiosConfig);
            // const newExamId = response.data._id;
            
            // SAHTE VERİ İÇİN:
            const newExamId = `e${Date.now()}`;
            const dummyResponse = { ...newExamData, _id: newExamId, questionCount: 0 };
            setExams([dummyResponse, ...exams]); 
            
            // Modalı kapat ve formları temizle
            setIsCreateModalOpen(false); 
            setNewExamTitle('');
            setNewExamCategory(curriculumData.dersler[0]);
            setNewExamPassMark(50);
            setNewExamClass('');
            setError(null);

            // Yeni sınavı hemen düzenleme modunda (modal) aç
            handleEditQuestions(dummyResponse); 

        } catch (error) {
            setError('Sınav oluşturma hatası: Sunucuya bağlanılamadı.');
            console.error('Hata:', error);
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
                        setIsCreateModalOpen(true); // Yeni Sınav Oluştur modalını aç
                    }}
                >
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Yeni Sınav Oluştur
                </button>
            </PageHeader>

            {error && <div className="alert alert-danger page-card">{error}</div>}
            
            {/* 2. SINAV KARTLARI LİSTESİ */}
            <div className="exams-grid">
                {exams.length === 0 && !loading ? (
                    <div className="page-card" style={{gridColumn: '1 / -1'}}>
                        Henüz oluşturulmuş bir sınav yok. Başlamak için yukarıdaki butonu kullanın.
                    </div>
                ) : (
                    exams.map((exam) => (
                        <ExamCard
                            key={exam._id}
                            exam={exam}
                            onEditQuestions={handleEditQuestions}
                            onAssign={handleAta}
                        />
                    ))
                )}
            </div>

            {/* 3. YENİ SINAV OLUŞTURMA MODALI */}
            {isCreateModalOpen && (
                <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Yeni Sınav Oluştur</h2>
                        <form onSubmit={handleCreateExam}>
                            
                            {/* Başlık */}
                            <div className="form-group">
                                <label htmlFor="examTitle">Sınav Başlığı</label>
                                <input type="text" id="examTitle" value={newExamTitle} onChange={(e) => setNewExamTitle(e.target.value)} placeholder="Örn: 11. Sınıf Fizik 1. Dönem" autoFocus required/>
                            </div>
                            
                            {/* Kategori/Ders Seçimi */}
                            <div className="form-group">
                                <label htmlFor="examCategory">Sınav Kategorisi (Ders)</label>
                                <select id="examCategory" value={newExamCategory} onChange={(e) => setNewExamCategory(e.target.value)} required>
                                    {curriculumData.dersler.map(ders => (<option key={ders} value={ders}>{ders}</option>))}
                                </select>
                            </div>

                            {/* Süre */}
                            <div className="form-group">
                                <label htmlFor="examDuration">Sınav Süresi (Dakika)</label>
                                <input type="number" id="examDuration" value={newExamDuration} onChange={(e) => setNewExamDuration(e.target.value)} min="5" required/>
                            </div>
                            
                            {/* Geçme Notu */}
                            <div className="form-group">
                                <label htmlFor="passMark">Geçme Notu (%)</label>
                                <input type="number" id="passMark" value={newExamPassMark} onChange={(e) => setNewExamPassMark(e.target.value)} min="0" max="100" required/>
                            </div>
                            
                            {/* Atanacak Sınıf */}
                            <div className="form-group">
                                <label htmlFor="examClass">Atanacak Sınıf (Opsiyonel)</label>
                                <select id="examClass" value={newExamClass} onChange={(e) => setNewExamClass(e.target.value)}>
                                    <option value="">(Sınıf Seçilmedi)</option>
                                    {curriculumData.siniflar.map(sinif => (<option key={sinif} value={sinif}>{sinif}</option>))}
                                </select>
                            </div>


                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
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
            
            {/* 4. SORU SEÇME MODALI */}
            {currentExamToEdit && (
                <SelectQuestionsModal
                    show={isSelectQuestionsModalOpen}
                    exam={currentExamToEdit}
                    handleClose={() => {
                        setIsSelectQuestionsModalOpen(false);
                        setCurrentExamToEdit(null);
                        fetchExams(); // Sınav soruları güncellendiği için listeyi yenile
                    }}
                />
            )}
        </div>
    );
}

export default TeacherExams;