import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ExamList from '../../components/exams/ExamList';
import ExamPreviewModal from '../../components/exams/ExamPreviewModal';
import apiClient from '../../services/api';

const TeacherMyExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/exams/mine'); // Backend'de öğretmene ait sınavlar endpointi
        setExams(res.data);
      } catch (err) {
        setExams([]);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  const handlePreview = (exam) => {
    setSelectedExam(exam);
    setPreviewOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Sınavlarım</h2>
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition"
          onClick={() => navigate('/teacher/exams')}
        >
          Sınav Ekle
        </button>
      </div>
      {loading ? <div>Yükleniyor...</div> :
        <ExamList exams={exams} role="teacher" onStart={handlePreview} />
      }
      {previewOpen && selectedExam && (
        <ExamPreviewModal exam={selectedExam} onClose={() => setPreviewOpen(false)} />
      )}
    </div>
  );
};

export default TeacherMyExams;
