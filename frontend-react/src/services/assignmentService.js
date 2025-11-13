import api from './api';

// Fetch all assignments for the logged in teacher
export async function getAssignments() {
  return api.get('/assignments').then(r => r.data);
}

// Create a new assignment (exam -> class/student)
export async function assignExam(examId, targetType, targetId, dueDateIso) {
  return api
    .post('/assignments', { examId, targetType, targetId, dueDate: dueDateIso })
    .then(r => r.data);
}

// (Future) Fetch a single assignment by id if detailed endpoint added
export async function getAssignmentById(id) {
  return api.get(`/assignments/${id}`).then(r => r.data);
}

// (Future) Delete an assignment (if backend route implemented later)
export async function deleteAssignment(id) {
  return api.delete(`/assignments/${id}`).then(r => r.data);
}

