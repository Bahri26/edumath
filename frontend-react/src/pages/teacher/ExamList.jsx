import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faEye,
  faClock,
  faUsers,
  faChartLine,
  faCheckCircle,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import PageHeader from '../../components/ui/common/PageHeader';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 20px;
  flex-wrap: wrap;
`;

const SearchBar = styled.div`
  flex: 1;
  min-width: 280px;
  position: relative;

  input {
    width: 100%;
    padding: 12px 16px 12px 40px;
    border: 1px solid #e1e1e1;
    border-radius: 8px;
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: #4834d4;
      box-shadow: 0 0 0 2px rgba(72, 52, 212, 0.1);
    }
  }

  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
  }
`;

const CreateButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #4834d4;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #3c2db0;
    transform: translateY(-2px);
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;

  select {
    padding: 8px 16px;
    border: 1px solid #e1e1e1;
    border-radius: 6px;
    font-size: 14px;
    min-width: 150px;
  }
`;

const ExamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 24px;
`;

const ExamCard = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid #f0f0f0;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${props => {
      switch(props.$status) {
        case 'Aktif': return '#4834d4';
        case 'Taslak': return '#f39c12';
        case 'Sona Erdi': return '#e74c3c';
        default: return '#95a5a6';
      }
    }};
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const ExamTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  color: #2d3436;
  font-weight: 600;
  flex: 1;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch(props.$status) {
      case 'Aktif': return '#eceaff';
      case 'Taslak': return '#fff3e0';
      case 'Sona Erdi': return '#feeff0';
      default: return '#f8f9fa';
    }
  }};
  color: ${props => {
    switch(props.$status) {
      case 'Aktif': return '#4834d4';
      case 'Taslak': return '#f39c12';
      case 'Sona Erdi': return '#e74c3c';
      default: return '#95a5a6';
    }
  }};
`;

const ExamMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 16px 0;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;

  svg {
    color: #4834d4;
    font-size: 14px;
  }
`;

const ExamStats = styled.div`
  display: flex;
  gap: 20px;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin: 16px 0;
`;

const StatItem = styled.div`
  flex: 1;
  text-align: center;

  .value {
    font-size: 20px;
    font-weight: 600;
    color: #2d3436;
  }

  .label {
    font-size: 12px;
    color: #666;
    margin-top: 4px;
  }
`;

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 16px;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border: 1px solid #e1e1e1;
  border-radius: 6px;
  background: white;
  color: ${props => props.$color || '#666'};
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$hoverBg || '#f8f9fa'};
    border-color: ${props => props.$color || '#666'};
    transform: translateY(-2px);
  }
`;

function ExamList() {
  const [exams] = useState([
    {
      id: 1,
      title: '10. Sınıf Matematik Dönem Sonu Sınavı',
      description: 'Birinci dönem konularını kapsayan genel sınav',
      category: 'Matematik',
      difficulty: 'Orta',
      duration: 90,
      questionCount: 25,
      totalAttempts: 45,
      averageScore: 72,
      status: 'Aktif',
      startDate: '2025-11-01',
      endDate: '2025-12-01'
    },
    {
      id: 2,
      title: 'Fizik Hareket Konusu Değerlendirme',
      description: 'Hareket ve kuvvet konularını içeren sınav',
      category: 'Fizik',
      difficulty: 'Zor',
      duration: 60,
      questionCount: 20,
      totalAttempts: 32,
      averageScore: 65,
      status: 'Aktif',
      startDate: '2025-11-05',
      endDate: '2025-11-20'
    },
    {
      id: 3,
      title: 'Kimya Periyodik Tablo Testi',
      description: 'Periyodik tablo ve elementler',
      category: 'Kimya',
      difficulty: 'Kolay',
      duration: 45,
      questionCount: 15,
      totalAttempts: 0,
      averageScore: 0,
      status: 'Taslak',
      startDate: null,
      endDate: null
    }
  ]);

  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    difficulty: 'all'
  });

  const [search, setSearch] = useState('');

  const handleFilterChange = (e) => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleDelete = (/* examId */) => {
    if (window.confirm('Bu sınavı silmek istediğinizden emin misiniz?')) {
      // TODO: Silme işlemi implement edilecek
    }
  };

  return (
    <Container>
      <PageHeader title="Sınavlar" />

      <TopBar>
        <SearchBar>
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            placeholder="Sınav ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </SearchBar>

        <CreateButton to="/teacher/exams/create">
          <FontAwesomeIcon icon={faPlus} />
          Yeni Sınav Oluştur
        </CreateButton>
      </TopBar>

      <FilterBar>
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="all">Tüm Durumlar</option>
          <option value="Aktif">Aktif</option>
          <option value="Taslak">Taslak</option>
          <option value="Sona Erdi">Sona Erdi</option>
        </select>

        <select name="category" value={filters.category} onChange={handleFilterChange}>
          <option value="all">Tüm Kategoriler</option>
          <option value="Matematik">Matematik</option>
          <option value="Fizik">Fizik</option>
          <option value="Kimya">Kimya</option>
          <option value="Biyoloji">Biyoloji</option>
        </select>

        <select name="difficulty" value={filters.difficulty} onChange={handleFilterChange}>
          <option value="all">Tüm Zorluklar</option>
          <option value="Kolay">Kolay</option>
          <option value="Orta">Orta</option>
          <option value="Zor">Zor</option>
        </select>
      </FilterBar>

      <ExamGrid>
        {exams.map(exam => (
          <ExamCard
            key={exam.id}
            $status={exam.status}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardHeader>
              <ExamTitle>{exam.title}</ExamTitle>
              <StatusBadge $status={exam.status}>{exam.status}</StatusBadge>
            </CardHeader>

            <p style={{ color: '#666', fontSize: '14px', margin: '0 0 16px 0' }}>
              {exam.description}
            </p>

            <ExamMeta>
              <MetaItem>
                <FontAwesomeIcon icon={faClock} />
                {exam.duration} dakika
              </MetaItem>
              <MetaItem>
                <FontAwesomeIcon icon={faCheckCircle} />
                {exam.questionCount} soru
              </MetaItem>
              <MetaItem>
                <FontAwesomeIcon icon={faUsers} />
                {exam.category}
              </MetaItem>
              <MetaItem>
                <FontAwesomeIcon icon={faChartLine} />
                {exam.difficulty}
              </MetaItem>
            </ExamMeta>

            <ExamStats>
              <StatItem>
                <div className="value">{exam.totalAttempts}</div>
                <div className="label">Deneme</div>
              </StatItem>
              <StatItem>
                <div className="value">%{exam.averageScore}</div>
                <div className="label">Ort. Puan</div>
              </StatItem>
              <StatItem>
                <div className="value">{exam.questionCount}</div>
                <div className="label">Soru</div>
              </StatItem>
            </ExamStats>

            <ActionButtons>
              <ActionButton $color="#4834d4" $hoverBg="#eceaff">
                <FontAwesomeIcon icon={faEye} />
                Görüntüle
              </ActionButton>
              <ActionButton $color="#2e7d32" $hoverBg="#edf7ed">
                <FontAwesomeIcon icon={faEdit} />
                Düzenle
              </ActionButton>
              <ActionButton 
                $color="#d32f2f" 
                $hoverBg="#feeff0"
                onClick={() => handleDelete(exam.id)}
              >
                <FontAwesomeIcon icon={faTrash} />
                Sil
              </ActionButton>
            </ActionButtons>
          </ExamCard>
        ))}
      </ExamGrid>
    </Container>
  );
}

export default ExamList;
