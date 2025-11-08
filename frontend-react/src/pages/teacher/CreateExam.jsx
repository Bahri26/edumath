import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faSave,
  faEye,
  faTrash,
  faClock,
  faBook,
  faUsers,
  faCalendar,
  faCog,
  faCheck,
  faFilter,
  faGraduationCap
} from '@fortawesome/free-solid-svg-icons';
import PageHeader from '../../components/common/PageHeader';

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
    tags: []
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

  // Soruları getir
  useEffect(() => {
    fetchQuestions();
  }, []);

  // Filtreleri uygula
  useEffect(() => {
    applyFilters();
  }, [questionFilters, availableQuestions]);

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/questions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableQuestions(response.data);
      setFilteredQuestions(response.data);
    } catch (error) {
      console.error('Sorular yüklenemedi:', error);
    }
  };

  const applyFilters = () => {
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
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedQuestions.length === 0) {
      alert('Lütfen en az bir soru seçin.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...examData,
        questions: selectedQuestions
      };

      const response = await axios.post('http://localhost:8000/api/exams', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Sınav başarıyla oluşturuldu!');
      console.log('Created Exam:', response.data);
      // Navigate to exams list
    } catch (error) {
      console.error('Sınav oluşturulamadı:', error);
      alert('Sınav oluşturulurken bir hata oluştu.');
    }
  };

  // Sınıf seviyeleri
  const classLevels = ['9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf'];
  
  // Benzersiz değerleri al
  const uniqueSubjects = [...new Set(availableQuestions.map(q => q.subject))];
  const uniqueTopics = [...new Set(availableQuestions.map(q => q.topic))];

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
                <option value="Fizik">Fizik</option>
                <option value="Kimya">Kimya</option>
                <option value="Biyoloji">Biyoloji</option>
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

          <FormGroup>
            <label>Açıklama</label>
            <textarea
              name="description"
              value={examData.description}
              onChange={handleInputChange}
              placeholder="Sınav hakkında kısa bir açıklama yazın..."
            />
          </FormGroup>

          <FormGrid cols="repeat(3, 1fr)">
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

            <FormGroup>
              <label>Toplam Puan</label>
              <input
                type="number"
                name="totalPoints"
                value={examData.totalPoints}
                onChange={handleInputChange}
                min="1"
              />
            </FormGroup>
          </FormGrid>
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

        {/* Ayarlar */}
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
              <label>İncelemeye İzin Ver</label>
              <Switch>
                <input
                  type="checkbox"
                  checked={examData.allowReview}
                  onChange={() => handleSwitchChange('allowReview')}
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

            <SwitchGroup>
              <label>Tekrar Girişe İzin Ver</label>
              <Switch>
                <input
                  type="checkbox"
                  checked={examData.allowRetake}
                  onChange={() => handleSwitchChange('allowRetake')}
                />
                <span></span>
              </Switch>
            </SwitchGroup>

            <FormGroup>
              <label>Maksimum Deneme Sayısı</label>
              <input
                type="number"
                name="maxAttempts"
                value={examData.maxAttempts}
                onChange={handleInputChange}
                min="1"
                disabled={!examData.allowRetake}
              />
            </FormGroup>
          </FormGrid>
        </FormCard>

        {/* Soru Seçimi */}
        <FormCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <SectionTitle style={{ margin: 0 }}>
              <FontAwesomeIcon icon={faCheck} />
              Soru Seçimi
            </SectionTitle>
            <SelectedCount>
              <FontAwesomeIcon icon={faCheck} />
              {selectedQuestions.length} soru seçildi
            </SelectedCount>
          </div>

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
