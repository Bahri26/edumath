import React, { useState, useEffect } from 'react';
import api from '../../services/api';

/**
 * ExamManager - Create and manage exams
 * Teacher dashboard component for exam CRUD operations
 */
function ExamManager() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    exam_type: 'quiz',
    total_points: 100,
    passing_score: 60,
    duration_minutes: 60
  });

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await api.get('/exams');
      setExams(response.data.data || response.data);
    } catch (error) {
      console.error('Sinavlar yuklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/exams', formData);
      setExams([...exams, response.data]);
      setFormData({
        title: '', description: '', course_id: '', 
        exam_type: 'quiz', total_points: 100, passing_score: 60, duration_minutes: 60
      });
      setShowForm(false);
    } catch (error) {
      console.error('Sinav eklenemedi:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu sinavı silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/exams/${id}`);
      setExams(exams.filter(e => e.id !== id));
    } catch (error) {
      console.error('Sinav silinmedi:', error);
    }
  };

  const handlePublish = async (id) => {
    try {
      await api.post(`/exams/${id}/publish`);
      setExams(exams.map(e => e.id === id ? { ...e, status: 'published' } : e));
    } catch (error) {
      console.error('Sinav yayinlanamadi:', error);
    }
  };

  return (
    <div className="exam-manager p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Sinavlar</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          {showForm ? 'İptal' : 'Yeni Sinav'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded shadow mb-6 border-l-4 border-blue-500">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Başlık *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Sınav başlığı"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Açıklama</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows="3"
                placeholder="Sınav açıklaması"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kurs ID *</label>
                <input
                  type="number"
                  required
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sınav Türü</label>
                <select
                  value={formData.exam_type}
                  onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="quiz">Quiz</option>
                  <option value="midterm">Ara Sınav</option>
                  <option value="final">Final</option>
                  <option value="practice">Pratik</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Toplam Puan</label>
                <input
                  type="number"
                  value={formData.total_points}
                  onChange={(e) => setFormData({ ...formData, total_points: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Geçme Puanı</label>
                <input
                  type="number"
                  value={formData.passing_score}
                  onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Süre (dakika)</label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Sınavı Oluştur
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Yükleniyor...</div>
      ) : (
        <div className="grid gap-4">
          {exams.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded">Henüz sınav yok</div>
          ) : (
            exams.map(exam => (
              <div key={exam.id} className="bg-white p-4 rounded shadow-md border-l-4 border-blue-400">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">{exam.title}</h3>
                    <p className="text-gray-600 text-sm">{exam.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    exam.status === 'published' ? 'bg-green-200 text-green-800' :
                    exam.status === 'draft' ? 'bg-blue-200 text-blue-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {exam.status === 'published' ? 'Yayınlandı' :
                     exam.status === 'draft' ? 'Taslak' : exam.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-3 space-y-1">
                  <p>Tür: {exam.exam_type} | Puan: {exam.total_points} | Geçme: {exam.passing_score}</p>
                  <p>Süre: {exam.duration_minutes} dakika</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.href = `/exams/${exam.id}/edit`}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => window.location.href = `/exams/${exam.id}/questions`}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Sorular
                  </button>
                  {exam.status !== 'published' && (
                    <button
                      onClick={() => handlePublish(exam.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Yayınla
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(exam.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ExamManager;
