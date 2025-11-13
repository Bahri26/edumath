import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getExams } from '../../services/examService';
import { useI18n } from '../../hooks/useI18n';
import Skeleton from '../ui/common/Skeleton';

function UpcomingExams({ mode = 'teacher' }) {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await getExams();
        const list = Array.isArray(data) ? data.slice(0, 10) : [];
        if (mounted) {
          setItems(list);
          setFilteredItems(list);
        }
      } catch (e) {
        const msg = e?.response?.status ? `${t('home_error')}: ${e.response.status}` : t('home_error');
        if (mounted) setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [mode, t]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(e => e.status === statusFilter));
    }
  }, [statusFilter, items]);

  return (
    <div className="kids-card mb-4">
      <div className="d-flex justify-between align-center" style={{ marginBottom: 12 }}>
        <h3 className="m-0" style={{ fontWeight: 700 }}>{t('home_upcoming_exams')}</h3>
        <small className="muted">{mode === 'teacher' ? t('home_upcoming_exams_teacher_hint') : t('home_upcoming_exams_student_hint')}</small>
      </div>
      {!loading && !error && items.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e1e1e1', fontSize: 13 }}
          >
            <option value="all">Tüm Durumlar</option>
            <option value="Aktif">Aktif</option>
            <option value="Taslak">Taslak</option>
            <option value="Sona Erdi">Sona Erdi</option>
          </select>
        </div>
      )}
      {loading && (
        <div>
          <Skeleton height="60px" count={3} mb="8px" />
        </div>
      )}
      {!loading && error && (
        <div className="page-card" style={{ color: '#d32f2f' }}>{error}</div>
      )}
      {!loading && !error && (
        <div style={{ display: 'grid', gap: 8 }}>
          {filteredItems.length === 0 && (
            <div className="page-card muted">{t('home_no_exams')}</div>
          )}
          {filteredItems.slice(0, 5).map(exam => (
            <div key={exam._id || exam.id} className="page-card d-flex justify-between align-center">
              <div>
                <div style={{ fontWeight: 600 }}>{exam.title || t('exams')}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {(exam.startDate || '').toString().slice(0, 10)}
                  {exam.status ? ` • ${exam.status}` : ''}
                </div>
              </div>
              <Link to={`/teacher/exams/${exam._id || exam.id}`} className="kids-btn small">{t('home_view')}</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UpcomingExams;
