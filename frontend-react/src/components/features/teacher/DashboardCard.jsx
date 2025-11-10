import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const DashboardCard = ({ 
    icon, 
    title, 
    count, 
    countLabel, 
    buttonText, 
    buttonIcon, 
    linkTo, 
    variant = 'primary' 
}) => {
    return (
        <div className={`page-card exam-card card-${variant}`}>
            <h3>
                <i className={`fas fa-${icon}`}></i> {title}
            </h3>
            
            <div className="exam-details">
                <strong>{count}</strong>
                <span>{countLabel}</span>
            </div>
            
            <div className="exam-actions">
                <Link to={linkTo} className={`btn-${variant} w-100`}>
                    <i className={`fas fa-${buttonIcon} me-2`}></i> {buttonText}
                </Link>
            </div>
        </div>
    );
};

DashboardCard.propTypes = {
    icon: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired,
    countLabel: PropTypes.string.isRequired,
    buttonText: PropTypes.string.isRequired,
    buttonIcon: PropTypes.string.isRequired,
    linkTo: PropTypes.string.isRequired,
    variant: PropTypes.oneOf(['primary', 'success', 'info', 'warning', 'danger'])
};

export default DashboardCard;