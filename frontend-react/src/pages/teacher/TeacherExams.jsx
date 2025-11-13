import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { getExams, createExam } from '../../services/examService';
import PageHeader from '../../components/ui/common/PageHeader';
import { curriculumData } from '../../data/curriculumData';
import SelectQuestionsModal from './SelectQuestionsModal';
import ExamCard from '../../components/common/ExamCard';
import './TeacherExams.css';

function TeacherExams() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSelectQuestionsModalOpen, setIsSelectQuestionsModalOpen] = useState(false);
    const [currentExamToEdit, setCurrentExamToEdit] = useState(null);

    // Form state
    const [newExamTitle, setNewExamTitle] = useState('');
    const [newExamDuration, setNewExamDuration] = useState(40);
    const [newExamCategory, setNewExamCategory] = useState(curriculumData.dersler[0]);
    const [newExamPassMark, setNewExamPassMark] = useState(50);
    const [newExamClass, setNewExamClass] = useState('');

    const fetchExams = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getExams();
            setExams(data);
        } catch (err) {
            console.error('Sınav listesi yüklenirken hata:', err);
            setError('Sınav listesi yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchExams(); }, []);

    const handleAta = (examId) => {
        alert(`Sınav ID ${examId} öğrencilere atanacak. (Atama modalı açılacak)`);
    };

    const handleEditQuestions = (exam) => {
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
            subject: newExamCategory,
            passMark: parseInt(newExamPassMark),
            classLevel: newExamClass || null,
            questions: []
        };
        try {
            const created = await createExam(newExamData);
            setExams([created, ...exams]);
            setIsCreateModalOpen(false);
            setNewExamTitle('');
            setNewExamDuration(40);
            setNewExamCategory(curriculumData.dersler[0]);
            setNewExamPassMark(50);
            setNewExamClass('');
            setError(null);
            handleEditQuestions(created);
        } catch (err) {
            console.error('Sınav oluşturma hatası:', err);
            setError('Sınav oluşturulamadı.');
        }
    };

    return (
        <div className="container pt-2">
            <PageHeader title="Sınavlar">
                <button
                    className="kids-btn primary"
                    onClick={() => { setError(null); setIsCreateModalOpen(true); }}
                >
                    <FontAwesomeIcon icon={faPlus} className="mr-1" /> Yeni Sınav Oluştur
                </button>
            </PageHeader>

            {error && <div className="kids-error mb-2">{error}</div>}

            <div className="kids-grid-2">
                {loading && exams.length === 0 && (
                    [1,2,3].map(i => (
                        <div key={i} className="kids-card span-all">
                            <div className="skeleton text mb-2" style={{ width: '50%' }}></div>
                            <div className="skeleton text mb-2" style={{ width: '70%' }}></div>
                            <div className="skeleton btn" style={{ width: '100%' }}></div>
                        </div>
                    ))
                )}
                {!loading && exams.length === 0 && (
                    <div className="kids-card span-all text-center">
                        <h3 className="m-0 mb-2">Henüz sınav yok</h3>
                        <p className="muted mb-2">İlk sınavınızı oluşturmak için yukarıdaki butonu kullanın.</p>
                        <button className="kids-btn primary" onClick={() => setIsCreateModalOpen(true)}>➕ Sınav Oluştur</button>
                    </div>
                )}
                {exams.map(exam => (
                    <ExamCard
                        key={exam._id}
                        exam={exam}
                        onEditQuestions={handleEditQuestions}
                        onAssign={handleAta}
                    />
                ))}
            </div>

            {isCreateModalOpen && (
                <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="kids-card modal-card" onClick={(e) => e.stopPropagation()}>
                        <h2 className="m-0 mb-2">Yeni Sınav Oluştur</h2>
                        <form onSubmit={handleCreateExam}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="examTitle">Sınav Başlığı</label>
                                <input id="examTitle" className="kids-input" value={newExamTitle} onChange={(e) => setNewExamTitle(e.target.value)} placeholder="Örn: 11. Sınıf Fizik 1. Dönem" required autoFocus />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="examCategory">Sınav Kategorisi (Ders)</label>
                                <select id="examCategory" className="kids-select" value={newExamCategory} onChange={(e) => setNewExamCategory(e.target.value)} required>
                                    {curriculumData.dersler.map(ders => (<option key={ders} value={ders}>{ders}</option>))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="examDuration">Sınav Süresi (Dakika)</label>
                                <input id="examDuration" type="number" className="kids-input" value={newExamDuration} onChange={(e) => setNewExamDuration(e.target.value)} min="5" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="passMark">Geçme Notu (%)</label>
                                <input id="passMark" type="number" className="kids-input" value={newExamPassMark} onChange={(e) => setNewExamPassMark(e.target.value)} min="0" max="100" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="examClass">Atanacak Sınıf (Opsiyonel)</label>
                                <select id="examClass" className="kids-select" value={newExamClass} onChange={(e) => setNewExamClass(e.target.value)}>
                                    <option value="">(Sınıf Seçilmedi)</option>
                                    {curriculumData.siniflar.map(s => (<option key={s} value={s}>{s}</option>))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button type="button" className="kids-btn secondary" onClick={() => setIsCreateModalOpen(false)}>İptal</button>
                                <button type="submit" className="kids-btn primary">Oluştur ve Devam Et</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {currentExamToEdit && (
                <SelectQuestionsModal
                    show={isSelectQuestionsModalOpen}
                    exam={currentExamToEdit}
                    handleClose={() => {
                        setIsSelectQuestionsModalOpen(false);
                        setCurrentExamToEdit(null);
                        fetchExams();
                    }}
                />
            )}
        </div>
    );
}

export default TeacherExams;
