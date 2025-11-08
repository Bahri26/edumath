import React from 'react';
import { patternsCurriculum } from '../../data/patternsCurriculum';
import './PatternMap.css';

// Örnek olarak öğrencinin 4. sınıf olduğunu varsayalım.
// Bu bilgi daha sonra AuthContext gibi bir yerden dinamik olarak gelecek.
const STUDENT_GRADE = 4;

const PatternMap = () => {
  // Müfredattan sadece öğrencinin sınıfına ait kazanımları filtrele
  const gradeObjectives = patternsCurriculum.grades.find(
    (g) => g.grade === STUDENT_GRADE
  );

  if (!gradeObjectives) {
    return <div>Bu sınıf seviyesi için örüntü kazanımı bulunamadı.</div>;
  }

  return (
    <div className="pattern-map-container">
      <h3 className="map-title">{gradeObjectives.title}</h3>
      <div className="map-path">
        {gradeObjectives.objectives.map((objective, index) => (
          <React.Fragment key={objective.id}>
            <div className="map-node completed">
              <div className="node-icon">⭐</div>
              <div className="node-tooltip">{objective.description}</div>
            </div>
            {index < gradeObjectives.objectives.length - 1 && (
              <div className="map-connector"></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default PatternMap;
