// frontend-react/src/components/common/PageHeader.jsx (SON HALİ)

import React from 'react';
import '../../../assets/styles/PageHeader.css'; // Kendi CSS'ini import eder

const PageHeader = ({ title, children }) => {
  return (
    <div className="page-header-container">
      <h1 className="page-header-title">{title}</h1>
      <div className="page-header-actions">
        {children} 
      </div>
    </div>
  );
};

export default PageHeader;