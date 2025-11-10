import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../contexts/AuthContext';
import styles from './CreateClassModal.module.css';

const CreateClassModal = ({ isOpen, onClose, onClassCreated }) => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useContext(AuthContext);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !subject || !gradeLevel) {
      setError('Tüm alanlar zorunludur.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post('/api/classes', { name, subject, gradeLevel }, config);
      onClassCreated(data); // Yeni oluşturulan sınıfı listeye ekle
      onClose(); // Modalı kapat
    } catch (err) {
      setError(err.response?.data?.message || 'Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Yeni Sınıf Oluştur</h2>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Sınıf Adı (Örn: 9-A)</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sınıf veya şube adı"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="subject">Ders (Örn: Matematik)</label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Dersin adı"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="gradeLevel">Sınıf Seviyesi</label>
            <select
              id="gradeLevel"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              required
            >
              <option value="">Seviye Seçin</option>
              <option value="9">9. Sınıf</option>
              <option value="10">10. Sınıf</option>
              <option value="11">11. Sınıf</option>
              <option value="12">12. Sınıf</option>
            </select>
          </div>
          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} disabled={isLoading} className={styles.cancelButton}>
              İptal
            </button>
            <button type="submit" disabled={isLoading} className={styles.createButton}>
              {isLoading ? 'Oluşturuluyor...' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClassModal;
