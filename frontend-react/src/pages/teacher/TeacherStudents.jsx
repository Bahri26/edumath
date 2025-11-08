// frontend-react/src/pages/teacher/TeacherStudents.jsx

import React, { useState, useEffect } from 'react';
// Paylaşılan stil dosyamızı import edelim
import '../../assets/styles/TeacherPages.css';

// SAHTE VERİ (Backend bağlanana kadar)
// Normalde bu veri, '/api/teacher/students' gibi bir endpoint'ten gelir
const dummyStudents = [
  { id: 's1', firstName: 'Ali', lastName: 'Yılmaz', email: 'ali@mail.com', joinedClass: '10-A Matematik' },
  { id: 's2', firstName: 'Ayşe', lastName: 'Kaya', email: 'ayse@mail.com', joinedClass: '10-A Matematik' },
  { id: 's3', firstName: 'Mehmet', lastName: 'Demir', email: 'mehmet@mail.com', joinedClass: '9-C Fizik' },
  { id: 's4', firstName: 'Zeynep', lastName: 'Şahin', email: 'zeynep@mail.com', joinedClass: '12. Sınıf React' },
  { id: 's5', firstName: 'Mustafa', lastName: 'Çelik', email: 'mustafa@mail.com', joinedClass: '10-A Matematik' },
];

function TeacherStudents() {
  // read token inside component so login state is reflected
  const token = localStorage.getItem('token');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // --- STATE'LER ---
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Arama filtresi için

  // --- FETCH ---
  const fetchStudents = React.useCallback(() => {
    setLoading(true);
    // TODO: replace with: axios.get('/api/teacher/students', axiosConfig)
    setTimeout(() => {
      setStudents(dummyStudents);
      setLoading(false);
    }, 500);
  }, [token]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // --- FİLTRELENMİŞ ÖĞRENCİLER ---
  // Arama kutusuna yazılan değere göre listeyi filtrele
  const filteredStudents = students.filter(student => 
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="teacher-page-container">
      <div className="page-header">
        <h1>Öğrencilerim ({students.length})</h1>
        {/* Arama Çubuğu */}
        <div className="search-bar">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="Öğrenci ara (Ad, Soyad, E-posta...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* --- ÖĞRENCİ LİSTESİ TABLOSU --- */}
      <div className="page-card">
        {loading ? (
          <p>Öğrenciler yükleniyor...</p>
        ) : (
          <div className="table-container">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Ad</th>
                  <th>Soyad</th>
                  <th>E-posta</th>
                  <th>İlgili Sınıf</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td>{student.firstName}</td>
                    <td>{student.lastName}</td>
                    <td>{student.email}</td>
                    <td>{student.joinedClass}</td>
                    <td>
                      <button className="btn-secondary btn-sm"><i className="fas fa-search-plus"></i>Detaylar</button>
                      <button className="btn-danger btn-sm" style={{marginLeft: '8px'}}>
                        <i className="fas fa-user-minus"></i>Sınıftan Çıkar
                      </button>
                    </td>
                  </tr>
                ))}
                
                {/* Filtre sonucu boşsa */}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>
                      "{searchTerm}" ile eşleşen öğrenci bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherStudents;