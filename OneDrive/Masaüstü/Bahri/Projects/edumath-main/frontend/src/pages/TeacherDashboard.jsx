import { useState } from 'react';
import QuickActions from '../components/dashboard/QuickActions';
import RiskyStudentsWidget from '../components/dashboard/RiskyStudentsWidget';
import LiveStatusIndicator from '../components/dashboard/LiveStatusIndicator';

// Mock data
const riskyStudents = [
  { id: 1, name: 'Ahmet Y.', reason: 'Not ortalaması düştü' },
  { id: 2, name: 'Ayşe K.', reason: 'Devamsızlık yaptı' },
];

const TeacherDashboard = () => {
  const [activeStudents] = useState(12);
  const [inExam] = useState(3);

  const handleAssignHomework = () => alert('Hızlı ödev atama açıldı!');
  const handleAnnounce = () => alert('Duyuru paneli açıldı!');
  const handleAddQuestion = () => alert('Yeni soru ekleme açıldı!');
  const handleMessageStudent = (student) => alert(`${student.name} öğrencisine mesaj atılıyor!`);

  return (
    <div className="space-y-6 animate-fade-in">
      <QuickActions
        onAssignHomework={handleAssignHomework}
        onAnnounce={handleAnnounce}
        onAddQuestion={handleAddQuestion}
      />
      <LiveStatusIndicator activeStudents={activeStudents} inExam={inExam} />
      <RiskyStudentsWidget students={riskyStudents} onMessage={handleMessageStudent} />
      {/* Diğer öğretmene özel widgetlar buraya eklenebilir */}
    </div>
  );
};

export default TeacherDashboard;
