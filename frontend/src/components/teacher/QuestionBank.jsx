import React, { useState, useEffect } from 'react';
import api from '../../services/api';

/**
 * QuestionBank - Question management and organization
 * Create, edit, search and organize questions for exams and surveys
 */
function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    difficulty_level: 'medium',
    options: [
      { option_text: '', is_correct: true },
      { option_text: '', is_correct: false }
    ]
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/questions/my-questions');
      setQuestions(response.data.data || response.data);
    } catch (error) {
      console.error('Sorular yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('q', searchTerm);
      if (filterType) params.append('type', filterType);
      
      const response = await api.get(`/questions/search?${params}`);
      setQuestions(response.data.data || response.data);
    } catch (error) {
      console.error('Arama yapılamadı:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedQuestion?.id) {
        // Update
        await api.put(`/questions/${selectedQuestion.id}`, formData);
        setQuestions(questions.map(q => 
          q.id === selectedQuestion.id ? { ...q, ...formData } : q
        ));
      } else {
        // Create
        const response = await api.post('/questions', formData);
        setQuestions([...questions, response.data]);
      }
      handleReset();
    } catch (error) {
      console.error('Soru kaydedilemedi:', error);
    }
  };

  const handleEdit = (question) => {
    setSelectedQuestion(question);
    setFormData({
      question_text: question.question_text,
      question_type: question.question_type,
      difficulty_level: question.difficulty_level || 'medium',
      options: question.options || []
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/questions/${id}`);
      setQuestions(questions.filter(q => q.id !== id));
      if (selectedQuestion?.id === id) {
        handleReset();
      }
    } catch (error) {
      console.error('Soru silinmedi:', error);
    }
  };

  const handleReset = () => {
    setSelectedQuestion(null);
    setShowForm(false);
    setFormData({
      question_text: '',
      question_type: 'multiple_choice',
      difficulty_level: 'medium',
      options: [
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false }
      ]
    });
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { option_text: '', is_correct: false }]
    });
  };

  const removeOption = (idx) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== idx)
    });
  };

  const updateOption = (idx, field, value) => {
    const newOptions = [...formData.options];
    newOptions[idx] = { ...newOptions[idx], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = !searchTerm || q.question_text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || q.question_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="question-bank p-6">
      <h2 className="text-2xl font-bold mb-6">Soru Bankası</h2>

      {/* Search and Filter */}
      <form onSubmit={handleSearch} className="bg-white p-4 rounded shadow mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Sorular ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">Tüm Türler</option>
          <option value="multiple_choice">Çoktan Seçmeli</option>
          <option value="short_answer">Kısa Cevap</option>
          <option value="essay">Essay</option>
          <option value="true_false">Doğru/Yanlış</option>
        </select>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Ara
        </button>
        <button
          type="button"
          onClick={() => !showForm && setShowForm(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Yeni Soru
        </button>
      </form>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded shadow mb-6 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold mb-4">
            {selectedQuestion ? 'Soruyu Düzenle' : 'Yeni Soru Oluştur'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Soru Metni *</label>
              <textarea
                required
                value={formData.question_text}
                onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Soru Türü</label>
                <select
                  value={formData.question_type}
                  onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="multiple_choice">Çoktan Seçmeli</option>
                  <option value="short_answer">Kısa Cevap</option>
                  <option value="essay">Essay</option>
                  <option value="true_false">Doğru/Yanlış</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Zorluk</label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="easy">Kolay</option>
                  <option value="medium">Orta</option>
                  <option value="hard">Zor</option>
                </select>
              </div>
            </div>

            {/* Options for Multiple Choice */}
            {formData.question_type === 'multiple_choice' && (
              <div>
                <label className="block text-sm font-medium mb-2">Seçenekler</label>
                <div className="space-y-2">
                  {formData.options.map((option, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Seçenek ${idx + 1}`}
                        value={option.option_text}
                        onChange={(e) => updateOption(idx, 'option_text', e.target.value)}
                        className="flex-1 border rounded px-3 py-2"
                      />
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={option.is_correct || false}
                          onChange={(e) => updateOption(idx, 'is_correct', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Doğru</span>
                      </label>
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm"
                >
                  Seçenek Ekle
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                Kaydet
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions List */}
      {loading ? (
        <div className="text-center py-8">Yükleniyor...</div>
      ) : (
        <div className="grid gap-4">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded">Soru bulunamadı</div>
          ) : (
            filteredQuestions.map(question => (
              <div
                key={question.id}
                className={`bg-white p-4 rounded shadow border-l-4 transition-all ${
                  selectedQuestion?.id === question.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-semibold">{question.question_text}</p>
                    <div className="text-sm text-gray-600 mt-1 flex gap-2">
                      <span className="bg-blue-100 px-2 py-0.5 rounded">
                        {question.question_type}
                      </span>
                      <span className="bg-yellow-100 px-2 py-0.5 rounded">
                        {question.difficulty_level || 'Orta'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(question)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(question.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default QuestionBank;
