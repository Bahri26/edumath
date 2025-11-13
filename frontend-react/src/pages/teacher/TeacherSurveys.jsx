import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faChartBar, faEdit, faTrash, faPoll, faUsers } from '@fortawesome/free-solid-svg-icons';
import PageHeader from '../../components/ui/common/PageHeader';
import { getSurveys, createSurvey, deleteSurvey, updateSurvey } from '../../services/surveyService';
import { getClasses } from '../../services/classService';
import './TeacherSurveys.css';

function TeacherSurveys() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [classes, setClasses] = useState([]); // sınıf seçimi
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formClass, setFormClass] = useState('all'); // 'all' => tüm sınıflar
  const [formStatus, setFormStatus] = useState('active');
  const [formQuestions, setFormQuestions] = useState([]); // [{ qid, text, type, options }]

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSurveys();
      setSurveys(data);
    } catch (err) {
      console.error('getSurveys failed', err);
      setError('Anketler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClassesForSelect = useCallback(async () => {
    try {
      const data = await getClasses();
      setClasses(data);
    } catch (err) {
      console.warn('getClasses (for survey select) failed', err);
    }
  }, []);

  useEffect(() => {
    fetchSurveys();
    fetchClassesForSelect();
  }, [fetchSurveys, fetchClassesForSelect]);

  const resetForm = () => {
    setFormTitle('');
    setFormClass('all');
    setFormStatus('active');
    setFormQuestions([]);
    setEditingSurvey(null);
  };

  const openCreateModal = () => { resetForm(); setModalOpen(true); };
  const openEditModal = (survey) => {
    setEditingSurvey(survey);
    setFormTitle(survey.title || '');
    setFormClass(survey.targetClass ? survey.targetClass : 'all');
    setFormStatus(survey.status || 'active');
    setFormQuestions(Array.isArray(survey.questions) ? survey.questions : []);
    setModalOpen(true);
  };

  const handleSubmitSurvey = async (e) => {
    e.preventDefault();
    if (!formTitle) return;
    setCreating(true);
    setError(null);
    try {
      const payload = {
        title: formTitle,
        targetClass: formClass === 'all' ? null : formClass,
        status: formStatus,
        questions: formQuestions,
      };
      let saved;
      if (editingSurvey) {
        saved = await updateSurvey(editingSurvey.id || editingSurvey._id, payload);
        // Replace edited survey in list
        setSurveys(surveys.map(s => ( (s.id||s._id) === (editingSurvey.id||editingSurvey._id) ? saved : s )));
      } else {
        saved = await createSurvey(payload);
        // Normalize saved object to match list shape
        const normalized = {
          id: saved.id || saved._id,
            title: saved.title,
            targetClass: saved.targetClass || null,
            status: saved.status || 'active',
            responseCount: saved.responseCount || 0,
            createdAt: saved.createdAt || new Date().toISOString()
        };
        setSurveys([normalized, ...surveys]);
      }
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('save survey failed', err);
      setError(editingSurvey ? 'Anket güncellenemedi.' : 'Anket oluşturulamadı.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (survey) => {
    if (!window.confirm('Bu anketi silmek istediğinize emin misiniz?')) return;
    try {
      await deleteSurvey(survey.id || survey._id);
      setSurveys(surveys.filter(s => (s.id||s._id) !== (survey.id||survey._id)));
    } catch (err) {
      console.error('delete survey failed', err);
      setError('Anket silinemedi.');
    }
  };

  const addQuestion = () => {
    setFormQuestions([...formQuestions, { qid: Date.now().toString(), text: '', type: 'text', options: [] }]);
  };

  const removeQuestion = (qid) => {
    setFormQuestions(formQuestions.filter(q => q.qid !== qid));
  };

  const updateQuestion = (qid, field, value) => {
    setFormQuestions(formQuestions.map(q => q.qid === qid ? { ...q, [field]: value } : q));
  };

  const addOption = (qid) => {
    setFormQuestions(formQuestions.map(q => {
      if (q.qid === qid) {
        return { ...q, options: [...(q.options || []), ''] };
      }
      return q;
    }));
  };

  const updateOption = (qid, idx, value) => {
    setFormQuestions(formQuestions.map(q => {
      if (q.qid === qid) {
        const opts = [...(q.options || [])];
        opts[idx] = value;
        return { ...q, options: opts };
      }
      return q;
    }));
  };

  const removeOption = (qid, idx) => {
    setFormQuestions(formQuestions.map(q => {
      if (q.qid === qid) {
        const opts = [...(q.options || [])];
        opts.splice(idx, 1);
        return { ...q, options: opts };
      }
      return q;
    }));
  };

  return (
    <div className="teacher-surveys-container">
      <div className="surveys-header">
        <div className="surveys-header-content">
          <div className="surveys-title-section">
            <h1 className="surveys-title">
              <i className="fas fa-poll"></i>
              Anketler
            </h1>
            <p className="surveys-subtitle">Öğrenci anketlerini oluştur ve yönet</p>
          </div>
          <div className="surveys-actions">
            <button className="create-survey-button" onClick={openCreateModal}>
              <i className="fas fa-plus"></i>
              Yeni Anket
            </button>
            <button className="refresh-button" onClick={fetchSurveys}>
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>

        <div className="surveys-stats">
          <div className="survey-stat-card">
            <div className="stat-icon primary">
              <i className="fas fa-poll"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{surveys.length}</div>
              <div className="stat-label">Toplam Anket</div>
            </div>
          </div>
          <div className="survey-stat-card">
            <div className="stat-icon success">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{surveys.filter(s => s.status === 'active').length}</div>
              <div className="stat-label">Aktif Anket</div>
            </div>
          </div>
          <div className="survey-stat-card">
            <div className="stat-icon info">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{surveys.reduce((acc, s) => acc + ((s.responseCount ?? s.responses?.length) || 0), 0)}</div>
              <div className="stat-label">Toplam Yanıt</div>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="surveys-error">{error}</div>}

      {loading ? (
        <div className="surveys-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="survey-card loading">
              <div className="skeleton text mb-2" style={{ width: '60%' }}></div>
              <div className="skeleton text mb-1" style={{ width: '40%' }}></div>
              <div className="skeleton text mb-1" style={{ width: '50%' }}></div>
              <div className="skeleton btn" style={{ width: '100%' }}></div>
            </div>
          ))}
        </div>
      ) : surveys.length === 0 ? (
        <div className="surveys-empty-state">
          <i className="fas fa-poll-h"></i>
          <h3>Henüz anket oluşturulmamış</h3>
          <p>İlk anketinizi oluşturarak öğrencilerinizden geri bildirim almaya başlayın</p>
          <button className="create-survey-button" onClick={openCreateModal}>
            <i className="fas fa-plus"></i>
            İlk Anketi Oluştur
          </button>
        </div>
      ) : (
        <div className="surveys-grid">
          {surveys.map((survey) => (
            <div key={survey.id || survey._id} className="survey-card">
              <div className="survey-card-header">
                <h3 className="survey-card-title">{survey.title}</h3>
                <div className="survey-card-badges">
                  <span className={`survey-status-badge ${survey.status === 'active' ? 'active' : 'closed'}`}>
                    {survey.status === 'active' ? 'Aktif' : 'Kapalı'}
                  </span>
                </div>
              </div>
              
              <div className="survey-card-body">
                <div className="survey-info-row">
                  <i className="fas fa-users"></i>
                  <span>{survey.targetClass || 'Tüm Sınıflar'}</span>
                </div>
                <div className="survey-info-row">
                  <i className="fas fa-chart-bar"></i>
                  <span>{(survey.responseCount ?? survey.responses?.length) || 0} Yanıt</span>
                </div>
                <div className="survey-info-row">
                  <i className="fas fa-question-circle"></i>
                  <span>{survey.questions?.length || 0} Soru</span>
                </div>
              </div>

              <div className="survey-card-footer">
                <button className="survey-action-button primary" onClick={() => navigate(`/teacher/surveys/${survey.id || survey._id}/results`)}>
                  <i className="fas fa-chart-bar"></i>
                  Sonuçlar
                </button>
                <button className="survey-action-button secondary" onClick={() => openEditModal(survey)}>
                  <i className="fas fa-edit"></i>
                </button>
                <button className="survey-action-button danger" onClick={() => handleDelete(survey)}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="survey-modal-overlay" onClick={() => { setModalOpen(false); resetForm(); }}>
          <div className="survey-modal" onClick={(e) => e.stopPropagation()}>
            <div className="survey-modal-header">
              <h2>
                <i className="fas fa-poll"></i>
                {editingSurvey ? 'Anketi Düzenle' : 'Yeni Anket'}
              </h2>
              <button className="survey-modal-close" onClick={() => { setModalOpen(false); resetForm(); }}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitSurvey} className="survey-modal-body">
              <div className="survey-form-group">
                <label htmlFor="surveyTitle">Başlık</label>
                <input
                  id="surveyTitle"
                  type="text"
                  className="survey-form-input"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Örn: Öğrenci Memnuniyeti"
                  autoFocus
                  required
                />
              </div>

              <div className="survey-form-row">
                <div className="survey-form-group">
                  <label htmlFor="targetClass">Hedef Sınıf</label>
                  <select
                    id="targetClass"
                    className="survey-form-input"
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                  >
                    <option value="all">Tüm Sınıflar</option>
                    {classes.map(cls => (
                      <option key={cls.id || cls._id} value={cls.id || cls._id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div className="survey-form-group">
                  <label htmlFor="surveyStatus">Durum</label>
                  <select
                    id="surveyStatus"
                    className="survey-form-input"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                  >
                    <option value="active">Aktif</option>
                    <option value="closed">Kapalı</option>
                  </select>
                </div>
              </div>
              
              <div className="survey-questions-section">
                <div className="survey-questions-header">
                  <label>Sorular</label>
                  <button type="button" className="add-question-button" onClick={addQuestion}>
                    <i className="fas fa-plus"></i>
                    Soru Ekle
                  </button>
                </div>

                {formQuestions.length === 0 ? (
                  <div className="survey-questions-empty">
                    <i className="fas fa-question-circle"></i>
                    <p>Henüz soru eklenmedi</p>
                    <span>Boş anketi kaydedebilir veya sorularını şimdi ekleyebilirsiniz</span>
                  </div>
                ) : (
                  <div className="survey-questions-list">
                    {formQuestions.map((q, idx) => (
                      <div key={q.qid} className="survey-question-card">
                        <div className="survey-question-header">
                          <span className="survey-question-number">Soru {idx+1}</span>
                          <button type="button" className="remove-question-button" onClick={() => removeQuestion(q.qid)}>
                            <i className="fas fa-times"></i>
                          </button>
                        </div>

                        <input
                          type="text"
                          className="survey-form-input"
                          placeholder="Soru metni"
                          value={q.text}
                          onChange={(e) => updateQuestion(q.qid, 'text', e.target.value)}
                        />

                        <select 
                          className="survey-form-input" 
                          value={q.type} 
                          onChange={(e) => updateQuestion(q.qid, 'type', e.target.value)}
                        >
                          <option value="text">Metin</option>
                          <option value="single">Tek Seçim</option>
                          <option value="multi">Çoklu Seçim</option>
                        </select>

                        {(q.type === 'single' || q.type === 'multi') && (
                          <div className="survey-options-section">
                            <div className="survey-options-header">
                              <span>Seçenekler</span>
                              <button type="button" className="add-option-button" onClick={() => addOption(q.qid)}>
                                <i className="fas fa-plus"></i>
                                Ekle
                              </button>
                            </div>
                            <div className="survey-options-list">
                              {(q.options || []).map((opt, oidx) => (
                                <div key={oidx} className="survey-option-row">
                                  <input
                                    type="text"
                                    className="survey-form-input"
                                    placeholder={`Seçenek ${oidx+1}`}
                                    value={opt}
                                    onChange={(e) => updateOption(q.qid, oidx, e.target.value)}
                                  />
                                  <button type="button" className="remove-option-button" onClick={() => removeOption(q.qid, oidx)}>
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="survey-modal-footer">
                <button type="button" className="survey-cancel-button" onClick={() => { setModalOpen(false); resetForm(); }}>
                  <i className="fas fa-times"></i>
                  İptal
                </button>
                <button type="submit" disabled={creating} className="survey-submit-button">
                  <i className="fas fa-check"></i>
                  {creating ? 'Kaydediliyor...' : editingSurvey ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherSurveys;
