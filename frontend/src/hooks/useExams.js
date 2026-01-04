import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/api';

export const useExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/exams');
      setExams(res.data);
    } catch (err) {
      console.error("Sınavlar getirilirken hata oluştu:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  return { exams, loading, refetchExams: fetchExams };
};
