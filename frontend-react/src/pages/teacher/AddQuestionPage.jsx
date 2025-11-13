import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuestion } from '../../services/questionService';
import { patternsCurriculum } from '../../data/patternsCurriculum';
import { curriculumData } from '../../data/curriculumData';
import PageHeader from '../../components/ui/common/PageHeader';

const AddQuestionPage = () => {
  const navigate = useNavigate();
  const [questionData, setQuestionData] = useState({
    subject: 'Matematik',
    classLevel: '',
    topic: 'Örüntüler',
    learningOutcome: '',
    questionType: 'test',
    difficulty: 'Orta',
    text: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    solutionText: '',
  });
  const [learningOutcomes, setLearningOutcomes] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (questionData.classLevel) {
      const selectedGrade = patternsCurriculum.grades.find(
        (g) => g.grade === parseInt(questionData.classLevel.split('.')[0])
      );
      setLearningOutcomes(selectedGrade ? selectedGrade.objectives : []);
      setQuestionData((prev) => ({ ...prev, learningOutcome: '' }));
    } else {
      setLearningOutcomes([]);
    }
  }, [questionData.classLevel]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuestionData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...questionData.options];
    newOptions[index] = value;
    setQuestionData((prev) => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic validation
    if (
      !questionData.classLevel ||
      !questionData.learningOutcome ||
      !questionData.text
    ) {
      setError('Lütfen Sınıf, Kazanım ve Soru Metni alanlarını doldurun.');
      return;
    }

    if (questionData.questionType === 'test' && !questionData.correctAnswer) {
        setError('Lütfen doğru cevabı işaretleyin.');
        return;
    }


    try {
      // Filter out empty options before sending
      const dataToSend = {
        ...questionData,
        options: questionData.options.filter((opt) => opt.trim() !== ''),
      };
      await createQuestion(dataToSend);
      setSuccess('Soru başarıyla eklendi!');
      // Reset form
      setQuestionData({
        subject: 'Matematik',
        classLevel: '',
        topic: 'Örüntüler',
        learningOutcome: '',
        questionType: 'test',
        difficulty: 'Orta',
        text: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        solutionText: '',
      });
      setTimeout(() => navigate('/teacher/questions'), 2000);
    } catch (err) {
      setError(
        'Soru eklenirken bir hata oluştu: ' +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const renderOptions = () => {
    switch (questionData.questionType) {
      case 'test':
        return (
          <div className="form-group">
            <label>Seçenekler ve Doğru Cevap</label>
            {questionData.options.map((option, index) => (
              <div key={index} className="option-input">
                <input
                  type="radio"
                  name="correctAnswer"
                  value={option}
                  checked={questionData.correctAnswer === option}
                  onChange={(e) =>
                    setQuestionData((prev) => ({
                      ...prev,
                      correctAnswer: e.target.value,
                    }))
                  }
                  id={`radio-${index}`}
                />
                <label htmlFor={`radio-${index}`}>{String.fromCharCode(65 + index)}</label>
                <input
                  type="text"
                  placeholder={`Seçenek ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>
        );
      case 'dogru-yanlis':
        return (
          <div className="form-group">
            <label>Doğru Cevap</label>
            <select
              name="correctAnswer"
              value={questionData.correctAnswer}
              onChange={handleChange}
            >
              <option value="">Seçiniz...</option>
              <option value="Doğru">Doğru</option>
              <option value="Yanlış">Yanlış</option>
            </select>
          </div>
        );
      case 'bosluk-doldurma':
         return (
          <div className="form-group">
            <label>Doğru Cevap</label>
            <input
              type="text"
              name="correctAnswer"
              placeholder="Boşluğa gelecek kelimeyi yazın"
              value={questionData.correctAnswer}
              onChange={handleChange}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="add-question-page teacher-page">
      <PageHeader title="Yeni Soru Ekle" />
      <div className="page-content">
        <form onSubmit={handleSubmit} className="question-form">
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="classLevel">Sınıf Seviyesi</label>
              <select
                id="classLevel"
                name="classLevel"
                value={questionData.classLevel}
                onChange={handleChange}
                required
              >
                <option value="">Sınıf Seçiniz...</option>
                {patternsCurriculum.grades.map((g) => (
                  <option key={g.grade} value={`${g.grade}. Sınıf`}>
                    {g.grade}. Sınıf
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="learningOutcome">Kazanım</label>
              <select
                id="learningOutcome"
                name="learningOutcome"
                value={questionData.learningOutcome}
                onChange={handleChange}
                required
                disabled={!questionData.classLevel}
              >
                <option value="">Kazanım Seçiniz...</option>
                {learningOutcomes.map((lo) => (
                  <option key={lo.id} value={lo.id}>
                    {lo.id}: {lo.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="questionType">Soru Tipi</label>
              <select
                id="questionType"
                name="questionType"
                value={questionData.questionType}
                onChange={handleChange}
              >
                {curriculumData.soruTipleri.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="difficulty">Zorluk Seviyesi</label>
              <select
                id="difficulty"
                name="difficulty"
                value={questionData.difficulty}
                onChange={handleChange}
              >
                <option value="Kolay">Kolay</option>
                <option value="Orta">Orta</option>
                <option value="Zor">Zor</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="text">Soru Metni</label>
            <textarea
              id="text"
              name="text"
              rows="5"
              placeholder="Soru metnini buraya girin..."
              value={questionData.text}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          {renderOptions()}

           <div className="form-group">
            <label htmlFor="solutionText">Çözüm Açıklaması (İsteğe Bağlı)</label>
            <textarea
              id="solutionText"
              name="solutionText"
              rows="3"
              placeholder="Sorunun çözüm yolunu veya açıklamasını girin..."
              value={questionData.solutionText}
              onChange={handleChange}
            ></textarea>
          </div>


          <button type="submit" className="btn btn-primary">
            Soruyu Kaydet
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddQuestionPage;

