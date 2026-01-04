import React from 'react';
import ExamCard from './ExamCard';

const ExamList = ({ exams, role, onStart, onDelete }) => {
  if (exams.length === 0) {
    return (
      <div className="col-span-full text-center py-10 text-slate-500">
        Henüz sınav oluşturulmamış.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {exams.map(exam => (
        <ExamCard 
          key={exam._id} 
          exam={exam} 
          role={role} 
          onStart={onStart}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default ExamList;
