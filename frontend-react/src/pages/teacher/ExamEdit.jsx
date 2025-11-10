import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import PageHeader from '../../components/common/PageHeader';
import { useI18n } from '../../contexts/I18nContext';
import '../../assets/styles/ExamPages.css';

const API_URL = 'http://localhost:8000/api/exams';

function ExamEdit() {
  const { t } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    difficulty: 'Orta',
    subject: 'Matematik',
    status: 'Taslak',
    questions: [],
    assignedClasses: []
  });

  // Sınavı yükle
  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFormData(response.data);
        setError(null);
      } catch (err) {
        console.error('Sınav yüklenemedi:', err);
        setError('Sınav yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };

    const fetchClasses = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/classes', {
          headers: { Authorization: `Bearer ${token}` },
          params: { gradeLevel: '' }
        });
        setAvailableClasses(response.data || []);
      } catch (err) {
        console.error('Sınıflar yüklenemedi:', err);
      }
    };

    if (id && token) {
      fetchExam();
      fetchClasses();
    }
  }, [id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClassSelect = (classId) => {
    setFormData(prev => {
      const assignedClasses = prev.assignedClasses || [];
      if (assignedClasses.includes(classId)) {
        return {
          ...prev,
          assignedClasses: assignedClasses.filter(id => id !== classId)
        };
      }
      return {
        ...prev,
        assignedClasses: [...assignedClasses, classId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Sınav başlığı gereklidir!');
      return;
    }

    try {
      setSaving(true);
      await axios.put(`${API_URL}/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ Sınav güncellendi!');
      navigate('/teacher/exams');
    } catch (err) {
      console.error('Güncelleme hatası:', err);
      alert('❌ Sınav güncellenemedi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="kids-dashboard-container">
        <PageHeader title={t('edit_exam') || 'Sınav Düzenle'} emoji="✏️" />
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t('exam_loading') || 'Sınav yükleniyor...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kids-dashboard-container">
        <PageHeader title={t('edit_exam') || 'Sınav Düzenle'} emoji="✏️" />
        <div className="empty-state">
          <span className="empty-icon">❌</span>
          <h3>{t('error') || 'Hata'}</h3>
          <p>{error}</p>
          <Link to="/teacher/exams" className="btn-primary">{t('back_to_exams') || 'Sınavlara Dön'}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="kids-dashboard-container">
  <PageHeader title={t('edit_exam') || 'Sınav Düzenle'} emoji="✏️" />

      <div className="exam-create-container">
        <form onSubmit={handleSubmit}>
          {/* Temel Bilgiler */}
          <div className="exam-form-card">
            <h2 className="exam-section-title">📋 {t('exam_basic_info') || 'Temel Bilgiler'}</h2>
            
            <div className="exam-form-group">
              <label htmlFor="title">{t('exam_title_label') || 'Sınav Başlığı'} *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Örn: 9. Sınıf Matematik 1. Dönem Sınavı"
                required
              />
            </div>

            <div className="exam-form-group">
              <label htmlFor="description">{t('exam_description') || 'Açıklama'}</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Sınav hakkında açıklama yazın..."
              />
            </div>

            <div className="exam-form-grid grid-3">
              <div className="exam-form-group">
                <label htmlFor="subject">{t('exam_category') || 'Ders/Kategori'}</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                >
                  <option value="Matematik">Matematik</option>
                  <option value="Fizik">Fizik</option>
                  <option value="Kimya">Kimya</option>
                  <option value="Biyoloji">Biyoloji</option>
                  <option value="Türkçe">Türkçe</option>
                  <option value="Tarih">Tarih</option>
                  <option value="Coğrafya">Coğrafya</option>
                  <option value="İngilizce">İngilizce</option>
                </select>
              </div>

              <div className="exam-form-group">
                <label htmlFor="difficulty">{t('exam_difficulty') || 'Zorluk Seviyesi'}</label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                >
                  <option value="Kolay">Kolay</option>
                  <option value="Orta">Orta</option>
                  <option value="Zor">Zor</option>
                </select>
              </div>

              <div className="exam-form-group">
                <label htmlFor="duration">{t('exam_duration_min') || 'Süre (Dakika)'}</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="5"
                  max="300"
                />
              </div>
            </div>

            <div className="exam-form-group">
              <label htmlFor="status">{t('status') || 'Durum'}</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Taslak">{t('status_draft') || 'Taslak'}</option>
                <option value="Aktif">{t('status_active') || 'Aktif'}</option>
                <option value="Sona Erdi">{t('status_ended') || 'Sona Erdi'}</option>
              </select>
            </div>
          </div>

          {/* Sınıf Seçimi */}
          <div className="exam-form-card">
            <h2 className="exam-section-title">🏫 {t('exam_assignment') || 'Sınav Atama'}</h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              {t('exam_assignment_hint') || 'Bu sınavın hangi sınıflara atanacağını seçin (opsiyonel)'}
            </p>

            {availableClasses.length === 0 ? (
              <div className="exam-info-box">
                <p>{t('no_classes_yet') || 'Henüz oluşturulmuş sınıf bulunmuyor.'}</p>
              </div>
            ) : (
              <div className="class-selection-grid">
                {availableClasses.map(cls => (
                  <div 
                    key={cls._id || cls.id} 
                    className={`class-selection-item ${formData.assignedClasses?.includes(cls._id || cls.id) ? 'selected' : ''}`}
                    onClick={() => handleClassSelect(cls._id || cls.id)}
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedClasses?.includes(cls._id || cls.id) || false}
                      onChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="class-info">
                      <strong>{cls.name}</strong>
                      <span className="class-meta">
                        {cls.gradeLevel}. {t('class_suffix') || 'Sınıf'} • {cls.subject} • {(cls.students?.length || 0)} {t('student_suffix') || 'öğrenci'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {formData.assignedClasses && formData.assignedClasses.length > 0 && (
              <div className="exam-info-box" style={{ marginTop: '16px', background: '#e1f8e7' }}>
                <p style={{ color: '#2e7d32', fontWeight: '600' }}>✅ {formData.assignedClasses.length} {t('classes_selected') || 'sınıf seçildi'}</p>
              </div>
            )}
          </div>

          {/* Sorular */}
          <div className="exam-form-card">
            <h2 className="exam-section-title">❓ {t('questions') || 'Sorular'}</h2>
            <div className="exam-info-box">
              <p>
                <strong>{formData.questions?.length || 0}</strong> {t('questions_added') || 'soru eklendi'}
              </p>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                {t('questions_edit_note') || 'Not: Soru düzenleme özelliği yakında eklenecek. Şimdilik mevcut soruları koruyoruz.'}
              </p>
            </div>
          </div>

          {/* Kaydet Butonu */}
          <div className="exam-buttons">
            <Link to="/teacher/exams" className="btn-secondary">
              ← {t('cancel') || 'İptal'}
            </Link>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (t('saving') || '💾 Kaydediliyor...') : (t('save_changes') || '💾 Değişiklikleri Kaydet')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExamEdit;
