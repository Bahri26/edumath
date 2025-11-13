import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/common/PageHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChild, 
  faBookOpen, 
  faUserGraduate, 
  faArrowRight, 
  faSpinner, 
  faUsers, 
  faSchool 
} from '@fortawesome/free-solid-svg-icons';
import { getClassesSummary } from '../../services/classService';
import './TeacherClasses.css';

// Seviyeye göre ikon & stil seçimi
const getGradeStyle = (level) => {
  let icon, colorClass;
  if (level <= 5) {
    icon = faChild;
    colorClass = 'primary';
  } else if (level <= 8) {
    icon = faBookOpen;
    colorClass = 'success';
  } else {
    icon = faUserGraduate;
    colorClass = 'purple';
  }
  return { icon, colorClass };
};

function TeacherClasses() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClassesSummary();
      setSummary(data);
    } catch (err) {
      console.error('getClassesSummary failed', err);
      setError('Sınıf özet verileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Tüm sınıf seviyelerini (1-12) göster, backend'den gelmeyen sınıflar için 0 değerleri
  const allGrades = Array.from({ length: 12 }, (_, i) => {
    const gradeLevel = i + 1;
    const existingGrade = summary.find(s => s.gradeLevel === gradeLevel);
    return existingGrade || { gradeLevel, classCount: 0, studentCount: 0 };
  });

  return (
    <div className="teacher-classes-container">
      <div className="classes-header">
        <h1>Sınıflar Yönetimi</h1>
        <p>
          İşlem yapmak istediğiniz sınıf seviyesini seçin. 
          Buradaki veriler gerçek zamanlı özet değerlerdir.
        </p>
      </div>

      {error && (
        <div className="classes-error">
          <p>{error}</p>
          <button className="retry-button" onClick={fetchSummary}>
            Yeniden Dene
          </button>
        </div>
      )}

      {loading ? (
        <div className="classes-loading">
          <FontAwesomeIcon icon={faSpinner} spin />
        </div>
      ) : (
        <div className="classes-grid">
          {allGrades.map(({ gradeLevel, classCount, studentCount }) => {
            const style = getGradeStyle(gradeLevel);
            return (
              <Link
                key={gradeLevel}
                to={`/teacher/classes/${gradeLevel}`}
                className={`class-card ${style.colorClass}`}
              >
                <div className="class-card-content">
                  <div className="class-icon-wrapper">
                    <FontAwesomeIcon icon={style.icon} />
                  </div>
                  <div className="class-info">
                    <h2 className="class-grade">{gradeLevel}. Sınıf</h2>
                    <div className="class-stats">
                      <span className="stat-badge">
                        <FontAwesomeIcon icon={faSchool} />
                        {classCount} Şube
                      </span>
                      <span className="stat-badge">
                        <FontAwesomeIcon icon={faUsers} />
                        {studentCount} Öğrenci
                      </span>
                    </div>
                  </div>
                  <div className="class-arrow">
                    Yönet
                    <FontAwesomeIcon icon={faArrowRight} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TeacherClasses;
