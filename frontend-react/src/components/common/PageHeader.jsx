// frontend-react/src/components/common/PageHeader.jsx

import React from 'react';
import '../../assets/styles/PageHeader.css'; // Yeni CSS'i import et

function PageHeader({ title }) {
  return (
    <div className="page-header-container">
      <h1>{title}</h1>
    </div>
  );
}

export default PageHeader;