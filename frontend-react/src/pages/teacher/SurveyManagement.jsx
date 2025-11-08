import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar,
  faPen,
  faTrash,
  faEye,
  faPlus,
  faClock,
  faUsers,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import PageHeader from '../../components/common/PageHeader';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #6c5ce7;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 24px;

  &:hover {
    background: #5849c2;
    transform: translateY(-2px);
  }

  svg {
    font-size: 16px;
  }
`;

const SurveyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const SurveyCard = styled(motion.div)`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid #eef1f6;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
`;

const SurveyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const SurveyTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
`;

const SurveyStatus = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => props.active ? '#e1f8e7' : '#fff5f5'};
  color: ${props => props.active ? '#2dce89' : '#f56565'};
`;

const SurveyInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;

  svg {
    color: #6c5ce7;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
`;

const ActionButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border: 1px solid #eef1f6;
  border-radius: 6px;
  background: ${props => props.primary ? '#6c5ce7' : 'white'};
  color: ${props => props.primary ? 'white' : '#666'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.primary ? '#5849c2' : '#f8f9fe'};
    transform: translateY(-2px);
  }

  svg {
    font-size: 14px;
  }
`;

const NoSurveys = styled.div`
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  color: #666;

  svg {
    font-size: 48px;
    color: #6c5ce7;
    opacity: 0.5;
    margin-bottom: 16px;
  }

  h3 {
    margin: 0 0 8px 0;
    color: #333;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
`;

function SurveyManagement() {
  const [surveys, setSurveys] = useState([
    {
      id: 1,
      title: 'Öğrenci Memnuniyet Anketi',
      status: 'active',
      target: 'Tüm Sınıflar',
      responseCount: 45,
      dueDate: '2025-12-01'
    },
    {
      id: 2,
      title: '10-A Matematik Dersi Geri Bildirimi',
      status: 'active',
      target: '10-A Matematik',
      responseCount: 22,
      dueDate: '2025-11-15'
    },
    {
      id: 3,
      title: 'Dönem Sonu Değerlendirmesi',
      status: 'inactive',
      target: 'Tüm Sınıflar',
      responseCount: 0,
      dueDate: '2026-01-15'
    }
  ]);

  const handleCreateSurvey = () => {
    // Yeni anket oluşturma modalını aç
  };

  const handleViewResults = (surveyId) => {
    // Anket sonuçlarını görüntüle
  };

  const handleEditSurvey = (surveyId) => {
    // Anket düzenleme modalını aç
  };

  const handleDeleteSurvey = (surveyId) => {
    // Anket silme onayını göster
  };

  return (
    <Container>
      <PageHeader title="Anket Yönetimi" />

      <CreateButton onClick={handleCreateSurvey}>
        <FontAwesomeIcon icon={faPlus} />
        Yeni Anket Oluştur
      </CreateButton>

      <SurveyGrid>
        <AnimatePresence>
          {surveys.length === 0 ? (
            <NoSurveys>
              <FontAwesomeIcon icon={faChartBar} />
              <h3>Henüz Anket Bulunmuyor</h3>
              <p>Yeni bir anket oluşturmak için yukarıdaki butonu kullanın.</p>
            </NoSurveys>
          ) : (
            surveys.map(survey => (
              <SurveyCard
                key={survey.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <SurveyHeader>
                  <SurveyTitle>{survey.title}</SurveyTitle>
                  <SurveyStatus active={survey.status === 'active'}>
                    <FontAwesomeIcon icon={survey.status === 'active' ? faCheckCircle : faTimesCircle} />
                    {survey.status === 'active' ? 'Aktif' : 'Kapalı'}
                  </SurveyStatus>
                </SurveyHeader>

                <SurveyInfo>
                  <InfoItem>
                    <FontAwesomeIcon icon={faUsers} />
                    {survey.target}
                  </InfoItem>
                  <InfoItem>
                    <FontAwesomeIcon icon={faChartBar} />
                    {survey.responseCount} Yanıt
                  </InfoItem>
                  <InfoItem>
                    <FontAwesomeIcon icon={faClock} />
                    Son Tarih: {new Date(survey.dueDate).toLocaleDateString('tr-TR')}
                  </InfoItem>
                </SurveyInfo>

                <ActionButtons>
                  <ActionButton primary onClick={() => handleViewResults(survey.id)}>
                    <FontAwesomeIcon icon={faEye} />
                    Sonuçları Gör
                  </ActionButton>
                  <ActionButton onClick={() => handleEditSurvey(survey.id)}>
                    <FontAwesomeIcon icon={faPen} />
                    Düzenle
                  </ActionButton>
                  <ActionButton onClick={() => handleDeleteSurvey(survey.id)}>
                    <FontAwesomeIcon icon={faTrash} />
                    Sil
                  </ActionButton>
                </ActionButtons>
              </SurveyCard>
            ))
          )}
        </AnimatePresence>
      </SurveyGrid>
    </Container>
  );
}

export default SurveyManagement;