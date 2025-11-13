import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
// Ortak API instance ve servis fonksiyonları
import { getQuestions } from '../../services/questionService';
import { createExam } from '../../services/examService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave,
  faEye,
  faBook,
  faCalendar,
  faCog,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import PageHeader from '../../components/ui/common/PageHeader';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const FormCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  color: #333;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  
  svg {
    color: #4834d4;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: ${props => props.cols || 'repeat(2, 1fr)'};
  gap: 20px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 14px;
    font-weight: 500;
    color: #555;
  }

  input, textarea, select {
    padding: 12px;
    border: 1px solid #e1e1e1;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #4834d4;
      box-shadow: 0 0 0 2px rgba(72, 52, 212, 0.1);
    }
  }

  textarea {
    min-height: 100px;
    resize: vertical;
  }
`;

const SwitchGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;

  label {
    font-size: 14px;
    color: #555;
  }
`;

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + span {
      background-color: #4834d4;
    }

    &:checked + span:before {
      transform: translateX(26px);
    }
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 24px;

    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
  }
`;

const QuestionSelector = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  select {
    padding: 8px 16px;
    border: 1px solid #e1e1e1;
    border-radius: 6px;
    font-size: 14px;
    min-width: 150px;
    background: white;

    &:focus {
      outline: none;
      border-color: #4834d4;
    }
  }
`;

const QuestionList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
  padding: 10px 0;
`;

const QuestionItem = styled.div`
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 2px solid ${props => props.selected ? '#4834d4' : '#e1e1e1'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #4834d4;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(72, 52, 212, 0.1);
  }

  .question-title {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .question-meta {
    font-size: 12px;
    color: #666;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;

    span {
      background: #f0f0f0;
      padding: 2px 8px;
      border-radius: 4px;
    }
  }

  ${props => props.selected && `
    background: #f0edff;
  `}
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 30px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.primary && `
    background: #4834d4;
    color: white;
    &:hover {
      background: #3c2db0;
      transform: translateY(-2px);
    }
  `}

  ${props => props.secondary && `
    background: #f8f9fa;
    color: #4834d4;
    border: 1px solid #e1e1e1;
    &:hover {
      background: #fff;
      border-color: #4834d4;
    }
  `}
`;

const SelectedCount = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #4834d4;
  color: white;
  border-radius: 20px;
  font-weight: 500;
  font-size: 14px;
`;

const GameTypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const GameTypeCard = styled.div`
  background: ${props => props.selected ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'};
  border: 2px solid ${props => props.selected ? '#667eea' : '#e1e1e1'};
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    border-color: #667eea;
  }

  .game-icon {
    font-size: 3rem;
    margin-bottom: 10px;
    animation: ${props => props.selected ? 'bounce 0.6s ease' : 'none'};
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .game-title {
    font-size: 16px;
    font-weight: 600;
    color: ${props => props.selected ? 'white' : '#333'};
    margin-bottom: 5px;
  }

  .game-description {
    font-size: 12px;
    color: ${props => props.selected ? 'rgba(255,255,255,0.9)' : '#666'};
    line-height: 1.4;
  }

  ${props => props.selected && `
    &::before {
      content: '✓';
      position: absolute;
      top: 10px;
      right: 10px;
      width: 24px;
      height: 24px;
      background: white;
      color: #667eea;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
    }
  `}
`;

const AIButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(245, 87, 108, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .ai-icon {
    font-size: 1.2rem;
    animation: ${props => props.loading ? 'rotate 1s linear infinite' : 'none'};
  }

  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

function CreateExam() {
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    category: '',
    classLevel: '',
    difficulty: 'Orta',
    duration: 60,
    passMark: 50,
    totalPoints: 100,
    isPublished: false,
    allowReview: true,
    shuffleQuestions: false,
    showResults: true,
    allowRetake: false,
    maxAttempts: 1,
    startDate: '',
    endDate: '',
    tags: [],
    gameType: 'standard' // yeni: oyun türü
  });

  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  
  const [questionFilters, setQuestionFilters] = useState({
    classLevel: '',
    subject: '',
    difficulty: '',
    topic: ''
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState([]);

  // Filtre fonksiyonunu önce tanımla (TDZ hatasını önler)
  const applyFilters = useCallback(() => {
    let filtered = [...availableQuestions];

    if (questionFilters.classLevel) {
      filtered = filtered.filter(q => q.classLevel === questionFilters.classLevel);
    }
    if (questionFilters.subject) {
      filtered = filtered.filter(q => q.subject === questionFilters.subject);
    }
    if (questionFilters.difficulty) {
      filtered = filtered.filter(q => q.difficulty === questionFilters.difficulty);
    }
    if (questionFilters.topic) {
      filtered = filtered.filter(q => q.topic.toLowerCase().includes(questionFilters.topic.toLowerCase()));
    }

    setFilteredQuestions(filtered);
  }, [availableQuestions, questionFilters]);

  // Soruları getir
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await getQuestions();
        setAvailableQuestions(data);
        setFilteredQuestions(data);
      } catch (error) {
        console.error('Sorular yüklenemedi:', error);
      }
    };
    fetchQuestions();
  }, []);

  // Filtreleri uygula
  useEffect(() => {
    applyFilters();
  }, [questionFilters, availableQuestions, applyFilters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExamData(prev => ({
      ...prev,
      [name]: value
    }));

    // Sınıf seviyesi değiştiğinde soru filtresini güncelle
    if (name === 'classLevel') {
      setQuestionFilters(prev => ({
        ...prev,
        classLevel: value
      }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setQuestionFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (name) => {
    setExamData(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleQuestionSelect = (questionId) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      }
      return [...prev, questionId];
    });
  };

  const handleAIGenerateQuestions = async () => {
    if (!examData.classLevel || !examData.category) {
      alert('Lütfen önce sınıf seviyesi ve kategori seçin!');
      return;
    }

    setAiLoading(true);
    try {
      // Soru havuzundan AI'ya context verilecek
      const poolQuestions = availableQuestions.filter(q => 
        q.classLevel === examData.classLevel && 
        q.subject === examData.category
      );

      if (poolQuestions.length === 0) {
        alert('Seçilen sınıf ve ders için soru havuzunda örnek soru bulunamadı.');
        setAiLoading(false);
        return;
      }

      // AI'ya gönderilecek prompt
      const context = {
        classLevel: examData.classLevel,
        subject: examData.category,
        difficulty: examData.difficulty,
        gameType: examData.gameType,
        exampleQuestions: poolQuestions.slice(0, 5).map(q => ({
          text: q.text,
          type: q.type,
          options: q.options,
          topic: q.topic
        }))
      };

      console.log('AI Context:', context);

      // TODO: Gerçek AI endpoint'ine bağlanacak
      // Şimdilik mock data ile simüle ediyoruz
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockGeneratedQuestions = [
        {
          _id: 'ai-' + Date.now() + '-1',
          text: `AI Üretildi: ${examData.gameType === 'match' ? 'Eşleştirme' : examData.gameType === 'flashcard' ? 'Hafıza Kartı' : 'Test'} sorusu - ${examData.category}`,
          type: examData.gameType === 'match' ? 'matching' : examData.gameType === 'flashcard' ? 'flashcard' : 'multiple-choice',
          classLevel: examData.classLevel,
          subject: examData.category,
          difficulty: examData.difficulty,
          topic: 'AI Generated',
          options: examData.gameType === 'match' ? [
            { left: 'Terim 1', right: 'Açıklama 1' },
            { left: 'Terim 2', right: 'Açıklama 2' }
          ] : ['Seçenek A', 'Seçenek B', 'Seçenek C', 'Seçenek D'],
          correctAnswer: 0
        }
      ];

      setAiGeneratedQuestions(mockGeneratedQuestions);
      setFilteredQuestions(prev => [...mockGeneratedQuestions, ...prev]);
      alert(`AI tarafından ${mockGeneratedQuestions.length} soru üretildi!`);
    } catch (error) {
      console.error('AI soru üretimi hatası:', error);
      alert('AI soru üretimi sırasında bir hata oluştu.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedQuestions.length === 0) {
      alert('Lütfen en az bir soru seçin.');
      return;
    }

    try {
      const payload = { ...examData, questions: selectedQuestions };
      const created = await createExam(payload);
      alert('Sınav başarıyla oluşturuldu!');
      console.log('Created Exam:', created);
      // TODO: başarı sonrası yönlendirme (örn: navigate('/teacher/exams'))
    } catch (error) {
      console.error('Sınav oluşturulamadı:', error);
      alert('Sınav oluşturulurken bir hata oluştu.');
    }
  };

  // Sınıf seviyeleri (1-9)
  const classLevels = [
    '1. Sınıf',
    '2. Sınıf', 
    '3. Sınıf',
    '4. Sınıf',
    '5. Sınıf',
    '6. Sınıf',
    '7. Sınıf',
    '8. Sınıf',
    '9. Sınıf'
  ];

  // Oyun türleri
  const gameTypes = [
    {
      id: 'standard',
      icon: '📝',
      title: 'Standart Sınav',
      description: 'Klasik test formatında sınav'
    },
    {
      id: 'match',
      icon: '🔄',
      title: 'Eşleştir',
      description: 'Karşılıkları bularak eşleştirin'
    },
    {
      id: 'test',
      icon: '✅',
      title: 'Test',
      description: 'Çoktan seçmeli sınav'
    },
    {
      id: 'flashcard',
      icon: '🎴',
      title: 'Hafıza Kartları',
      description: 'Ön yüzde tanım, arka yüzde açıklama'
    },
    {
      id: 'random',
      icon: '🎲',
      title: 'Rastgele Kartlar',
      description: 'Karışık bir desteden rastgele dağıtın'
    },
    {
      id: 'find-pair',
      icon: '🔺',
      title: 'Eşleşmeyi Bul',
      description: 'Eşleşen cevapları bulun'
    },
    {
      id: 'openbox',
      icon: '📦',
      title: 'Kutuyu Aç',
      description: 'Sırayla her kutuya dokunun'
    },
    {
      id: 'anagram',
      icon: '🔤',
      title: 'Anagram',
      description: 'Harfleri doğru konumlarına sürükleyin'
    },
    {
      id: 'wordcloud',
      icon: '💬',
      title: 'Kelime Çorbası',
      description: 'Cümleyi doğru sıraya göre düzenleme'
    },
    {
      id: 'complete',
      icon: '✍️',
      title: 'Cümleyi Tamamlayın',
      description: 'Boşlukları bir metin içindeki boş alanlara sürükleyin'
    },
    {
      id: 'matching-pairs',
      icon: '⭐',
      title: 'Eşleşen Çiftler',
      description: 'Eşleşen çiftleri ortaya çıkarın'
    },
    {
      id: 'group-sort',
      icon: '📦',
      title: 'Grup Sıralaması',
      description: 'Her öğeyi grubuna bırakın'
    }
  ];
  
  // Benzersiz değerleri al
  const uniqueSubjects = [...new Set(availableQuestions.map(q => q.subject))];

  return (
    <Container>
      <PageHeader title="Yeni Sınav Oluştur" />

      <form onSubmit={handleSubmit}>
        {/* Temel Bilgiler */}
        <FormCard>
          <SectionTitle>
            <FontAwesomeIcon icon={faBook} />
            Temel Bilgiler
          </SectionTitle>

          <FormGrid>
            <FormGroup>
              <label>Sınav Başlığı *</label>
              <input
                type="text"
                name="title"
                value={examData.title}
                onChange={handleInputChange}
                placeholder="Örn: 10. Sınıf Matematik Dönem Sonu Sınavı"
                required
              />
            </FormGroup>

            <FormGroup>
              <label>Sınıf Seviyesi *</label>
              <select
                name="classLevel"
                value={examData.classLevel}
                onChange={handleInputChange}
                required
              >
                <option value="">Sınıf Seviyesi Seçin</option>
                {classLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </FormGroup>
          </FormGrid>

          <FormGrid>
            <FormGroup>
              <label>Kategori *</label>
              <select
                name="category"
                value={examData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Kategori Seçin</option>
                <option value="Matematik">Matematik</option>
                <option value="Türkçe">Türkçe</option>
                <option value="Fen Bilimleri">Fen Bilimleri</option>
                <option value="Sosyal Bilgiler">Sosyal Bilgiler</option>
                <option value="İngilizce">İngilizce</option>
                <option value="Hayat Bilgisi">Hayat Bilgisi</option>
                <option value="Din Kültürü">Din Kültürü</option>
              </select>
            </FormGroup>

            <FormGroup>
              <label>Zorluk Seviyesi</label>
              <select
                name="difficulty"
                value={examData.difficulty}
                onChange={handleInputChange}
              >
                <option value="Kolay">Kolay</option>
                <option value="Orta">Orta</option>
                <option value="Zor">Zor</option>
              </select>
            </FormGroup>
          </FormGrid>

          <FormGrid cols="repeat(2, 1fr)">
            <FormGroup>
              <label>Süre (Dakika)</label>
              <input
                type="number"
                name="duration"
                value={examData.duration}
                onChange={handleInputChange}
                min="1"
              />
            </FormGroup>

            <FormGroup>
              <label>Geçme Notu (%)</label>
              <input
                type="number"
                name="passMark"
                value={examData.passMark}
                onChange={handleInputChange}
                min="0"
                max="100"
              />
            </FormGroup>
          </FormGrid>
        </FormCard>

        {/* Oyun Türü Seçimi */}
        <FormCard>
          <SectionTitle>
            🎮 Oyun Türü Seçin
          </SectionTitle>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
            Sınavınız için eğlenceli bir oyun formatı seçin. Bu, öğrencilerin daha etkileşimli bir deneyim yaşamasını sağlar.
          </p>
          <GameTypeGrid>
            {gameTypes.map(game => (
              <GameTypeCard
                key={game.id}
                selected={examData.gameType === game.id}
                onClick={() => setExamData(prev => ({ ...prev, gameType: game.id }))}
              >
                <div className="game-icon">{game.icon}</div>
                <div className="game-title">{game.title}</div>
                <div className="game-description">{game.description}</div>
              </GameTypeCard>
            ))}
          </GameTypeGrid>
        </FormCard>

        {/* Zamanlama */}
        <FormCard>
          <SectionTitle>
            <FontAwesomeIcon icon={faCalendar} />
            Zamanlama
          </SectionTitle>

          <FormGrid>
            <FormGroup>
              <label>Başlangıç Tarihi</label>
              <input
                type="datetime-local"
                name="startDate"
                value={examData.startDate}
                onChange={handleInputChange}
              />
            </FormGroup>

            <FormGroup>
              <label>Bitiş Tarihi</label>
              <input
                type="datetime-local"
                name="endDate"
                value={examData.endDate}
                onChange={handleInputChange}
              />
            </FormGroup>
          </FormGrid>
        </FormCard>

        {/* Ayarlar - Sadeleştirilmiş */}
        <FormCard>
          <SectionTitle>
            <FontAwesomeIcon icon={faCog} />
            Sınav Ayarları
          </SectionTitle>

          <FormGrid>
            <SwitchGroup>
              <label>Sınavı Yayınla</label>
              <Switch>
                <input
                  type="checkbox"
                  checked={examData.isPublished}
                  onChange={() => handleSwitchChange('isPublished')}
                />
                <span></span>
              </Switch>
            </SwitchGroup>

            <SwitchGroup>
              <label>Soruları Karıştır</label>
              <Switch>
                <input
                  type="checkbox"
                  checked={examData.shuffleQuestions}
                  onChange={() => handleSwitchChange('shuffleQuestions')}
                />
                <span></span>
              </Switch>
            </SwitchGroup>

            <SwitchGroup>
              <label>Sonuçları Göster</label>
              <Switch>
                <input
                  type="checkbox"
                  checked={examData.showResults}
                  onChange={() => handleSwitchChange('showResults')}
                />
                <span></span>
              </Switch>
            </SwitchGroup>
          </FormGrid>
        </FormCard>

        {/* Soru Seçimi */}
        <FormCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <SectionTitle style={{ margin: 0 }}>
              <FontAwesomeIcon icon={faCheck} />
              Soru Seçimi
            </SectionTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <AIButton 
                type="button"
                onClick={handleAIGenerateQuestions}
                disabled={aiLoading}
                loading={aiLoading}
              >
                <span className="ai-icon">🤖</span>
                {aiLoading ? 'AI Sorular Üretiyor...' : 'AI ile Soru Üret'}
              </AIButton>
              <SelectedCount>
                <FontAwesomeIcon icon={faCheck} />
                {selectedQuestions.length} soru seçildi
              </SelectedCount>
            </div>
          </div>

          {aiGeneratedQuestions.length > 0 && (
            <div style={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
              padding: '15px', 
              borderRadius: '8px', 
              color: 'white',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '1.5rem' }}>✨</span>
              <div>
                <strong>AI Başarılı!</strong>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                  {aiGeneratedQuestions.length} soru soru havuzundaki bilgiler ışığında AI tarafından üretildi.
                </p>
              </div>
            </div>
          )}

          <QuestionSelector>
            <FilterBar>
              <select
                name="classLevel"
                value={questionFilters.classLevel}
                onChange={handleFilterChange}
              >
                <option value="">Tüm Sınıflar</option>
                {classLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>

              <select
                name="subject"
                value={questionFilters.subject}
                onChange={handleFilterChange}
              >
                <option value="">Tüm Dersler</option>
                {uniqueSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>

              <select
                name="difficulty"
                value={questionFilters.difficulty}
                onChange={handleFilterChange}
              >
                <option value="">Tüm Zorluklar</option>
                <option value="Kolay">Kolay</option>
                <option value="Orta">Orta</option>
                <option value="Zor">Zor</option>
              </select>
            </FilterBar>

            <QuestionList>
              {filteredQuestions.length === 0 ? (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666', padding: '40px 0' }}>
                  {examData.classLevel 
                    ? `${examData.classLevel} için soru bulunamadı. Lütfen soru havuzuna soru ekleyin.`
                    : 'Lütfen önce sınıf seviyesi seçin.'}
                </p>
              ) : (
                filteredQuestions.map(question => (
                  <QuestionItem
                    key={question._id}
                    selected={selectedQuestions.includes(question._id)}
                    onClick={() => handleQuestionSelect(question._id)}
                  >
                    <div className="question-title">{question.text}</div>
                    <div className="question-meta">
                      <span>{question.classLevel}</span>
                      <span>{question.subject}</span>
                      <span>{question.difficulty}</span>
                      <span>{question.topic}</span>
                    </div>
                  </QuestionItem>
                ))
              )}
            </QuestionList>
          </QuestionSelector>
        </FormCard>

        <ButtonGroup>
          <Button type="button" secondary>
            <FontAwesomeIcon icon={faEye} />
            Önizle
          </Button>
          <Button type="submit" primary>
            <FontAwesomeIcon icon={faSave} />
            Sınavı Kaydet
          </Button>
        </ButtonGroup>
      </form>
    </Container>
  );
}

export default CreateExam;

