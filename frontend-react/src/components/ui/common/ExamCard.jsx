import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListOl, faClock, faPenToSquare, faUserPlus } from '@fortawesome/free-solid-svg-icons';

const ExamCard = ({ exam, onEditQuestions, onAssign }) => {
    return (
        <div className="page-card exam-card">
            <h3>{exam.title}</h3>

            <div className="exam-details">
                <div className="detail-item">
                    <FontAwesomeIcon icon={faListOl} className="me-2" />
                    {exam.questionCount || exam.questions?.length || 0} Soru
                </div>
                <div className="detail-item">
                    <FontAwesomeIcon icon={faClock} className="me-2" />
                    {exam.duration} Dakika
                </div>
            </div>

            <div className="exam-actions">
                <button className="btn-secondary btn-sm" onClick={() => onEditQuestions(exam)}>
                    <FontAwesomeIcon icon={faPenToSquare} className="me-2" /> Soru Ekle/Düzenle
                </button>
                <button className="btn-primary btn-sm" onClick={() => onAssign(exam._id)}>
                    <FontAwesomeIcon icon={faUserPlus} className="me-2" /> Ata
                </button>
            </div>
        </div>
    );
};

ExamCard.propTypes = {
    exam: PropTypes.object.isRequired,
    onEditQuestions: PropTypes.func.isRequired,
    onAssign: PropTypes.func.isRequired,
};

export default ExamCard;
