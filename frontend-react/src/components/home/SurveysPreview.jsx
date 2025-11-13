import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSurveys, getAvailableSurveys } from '../../services/surveyService';
import { useI18n } from '../../hooks/useI18n';
import Skeleton from '../ui/common/Skeleton';

function SurveysPreview({ mode = 'teacher' }) {
  const { t } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = mode === 'teacher' ? await getSurveys() : await getAvailableSurveys();
        const list = Array.isArray(data) ? data.slice(0, 5) : [];
        if (mounted) setItems(list);
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

  return (
    <div className="kids-card mb-4">
      <div className="d-flex justify-between align-center">
        <h3 className="m-0" style={{ fontWeight: 700 }}>{t('home_surveys_preview')}</h3>
        <small className="muted">{mode === 'teacher' ? t('home_surveys_teacher_hint') : t('home_surveys_student_hint')}</small>
      </div>
      {loading && (
        <div style={{ marginTop: 12 }}>
          <Skeleton height="50px" count={3} mb="8px" />
        </div>
      )}
      {!loading && error && <div className="page-card" style={{ color: '#d32f2f' }}>{error}</div>}
      {!loading && !error && (
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {items.length === 0 && <div className="page-card muted">{t('home_no_surveys')}</div>}
          {items.map(s => (
            <div key={s._id || s.id} className="page-card d-flex justify-between align-center">
              <div style={{ fontWeight: 600 }}>{s.title || t('home_surveys')}</div>
              <Link
                to={mode === 'teacher' ? `/teacher/surveys/${s._id || s.id}/results` : `/student/surveys/${s._id || s.id}`}
                className="kids-btn small"
              >{t('home_open')}</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SurveysPreview;
