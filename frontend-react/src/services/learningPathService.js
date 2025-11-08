import api from './api';

const learningPathService = {
  getByGrade: (gradeLevel) => api.get(`/learning-paths/grade/${gradeLevel}`).then(r => r.data)
};

export default learningPathService;
