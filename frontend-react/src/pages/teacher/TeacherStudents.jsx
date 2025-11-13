import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faSpinner, 
  faUserGraduate, 
  faEye, 
  faUserMinus,
  faUsers,
  faSchool,
  faDice
} from '@fortawesome/free-solid-svg-icons';
import { getTeacherStudents } from '../../services/studentService';
import api from '../../services/api';
import './TeacherStudents.css';

function TeacherStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [seeding, setSeeding] = useState(false);

  const fetchStudents = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTeacherStudents();
      setStudents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Öğrenciler alınamadı:', e);
      setError('Öğrenciler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSeedDemoData = async () => {
    if (!window.confirm('Demo öğrenci ve sınıflar oluşturulsun mu?')) return;
    
    setSeeding(true);
    try {
      const response = await api.post('/teacher/seed-demo-data');
      alert(response.data.message);
      fetchStudents();
    } catch (e) {
      console.error('Demo veri oluşturma hatası:', e);
      alert('Demo veriler oluşturulurken hata oluştu.');
    } finally {
      setSeeding(false);
    }
  };

  const handleRemove = async (student) => {
    if (!window.confirm(`${student.firstName} ${student.lastName} sınıftan çıkarılsın mı?`)) return;
    try {
      const res = await api.post('/teacher/students/remove', {
        studentId: student.id,
        classId: student.classId
      });
      if (res.data.removed) {
        setStudents(prev => prev.filter(s => s.id !== student.id));
      } else {
        alert('Öğrenci zaten sınıfta yok veya işlem başarısız.');
      }
    } catch (e) {
      console.error('Öğrenci çıkarma hatası:', e);
      alert('Öğrenci çıkarılırken hata oluştu.');
    }
  };

  const filteredStudents = students.filter(student => 
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Benzersiz sınıf ve seviye sayıları
  const uniqueClasses = new Set(students.map(s => s.classId)).size;
  const uniqueGrades = new Set(students.map(s => s.gradeLevel)).size;

  return (
    <div className="teacher-students-container">
      <div className="students-header">
        <h1>Öğrencilerim</h1>
        <p className="students-count">{students.length} Toplam Öğrenci</p>
      </div>

      {/* Stats Bar */}
      {students.length > 0 && (
        <div className="students-stats-bar">
          <div className="stat-card">
            <div className="stat-card-icon blue">
              <FontAwesomeIcon icon={faUserGraduate} />
            </div>
            <div className="stat-card-value">{students.length}</div>
            <div className="stat-card-label">Toplam Öğrenci</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon purple">
              <FontAwesomeIcon icon={faSchool} />
            </div>
            <div className="stat-card-value">{uniqueClasses}</div>
            <div className="stat-card-label">Farklı Sınıf</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon pink">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div className="stat-card-value">{uniqueGrades}</div>
            <div className="stat-card-label">Farklı Seviye</div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="students-search-bar">
        <div className="search-input-wrapper">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Öğrenci ara (Ad, Soyad, E-posta...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="students-search-input"
          />
        </div>
        {students.length === 0 && !loading && (
          <button 
            className="seed-demo-button" 
            onClick={handleSeedDemoData}
            disabled={seeding}
          >
            <FontAwesomeIcon icon={faDice} />
            {seeding ? 'Oluşturuluyor...' : 'Demo Veri Oluştur'}
          </button>
        )}
      </div>

      {error && <div className="students-error">{error}</div>}

      {/* Table or Empty State */}
      {loading ? (
        <div className="students-loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Öğrenciler yükleniyor...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="students-empty">
          <div className="students-empty-icon">👥</div>
          <h3>Henüz Öğrenci Yok</h3>
          <p>Sınıflarınıza öğrenci eklenmemiş. Demo veri oluşturarak başlayabilirsiniz.</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h4>Sonuç Bulunamadı</h4>
          <p>"{searchTerm}" aramanızla eşleşen öğrenci bulunamadı.</p>
        </div>
      ) : (
        <div className="students-table-wrapper">
          <table className="students-table">
            <thead>
              <tr>
                <th>Öğrenci</th>
                <th>Sınıf</th>
                <th>Seviye</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => {
                const initials = `${student.firstName[0]}${student.lastName[0]}`;
                return (
                  <tr key={student.id}>
                    <td>
                      <div className="student-name-cell">
                        <div className="student-avatar">{initials}</div>
                        <div className="student-name-wrapper">
                          <div className="student-full-name">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="student-email">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="student-class-badge">
                        <FontAwesomeIcon icon={faSchool} />
                        {student.joinedClass}
                      </span>
                    </td>
                    <td>
                      <div>
                        <strong>{student.gradeLevel}. Sınıf</strong>
                        <div className="student-grade">
                          {student.gradeLevel <= 5 ? 'İlkokul' : 
                           student.gradeLevel <= 8 ? 'Ortaokul' : 'Lise'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="student-actions">
                        <button className="action-button detail">
                          <FontAwesomeIcon icon={faEye} />
                          Detay
                        </button>
                        <button 
                          className="action-button remove" 
                          onClick={() => handleRemove(student)}
                        >
                          <FontAwesomeIcon icon={faUserMinus} />
                          Çıkar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TeacherStudents;
