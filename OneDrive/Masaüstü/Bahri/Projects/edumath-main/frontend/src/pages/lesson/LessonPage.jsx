import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
// MathWorkspace bileşeninin doğru path'ini güncelleyin
import MathWorkspace from '../components/dashboard/MathWorkspace';

const LessonPage = () => {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const res = await axios.get(`/api/lessons/${id}`);
        setLesson(res.data);
      } catch (err) {
        setError('Ders yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;
  if (error) return <div className="p-8 text-center text-rose-500">{error}</div>;
  if (!lesson) return null;

  // Math-interactive ise MathWorkspace render et
  if (lesson.type === 'math-interactive') {
    return <MathWorkspace content={lesson.content} lesson={lesson} />;
  }

  // Diğer tipler için fallback
  return (
    <div className="p-8 text-center text-slate-500">Bu ders tipi henüz desteklenmiyor.</div>
  );
};

export default LessonPage;
