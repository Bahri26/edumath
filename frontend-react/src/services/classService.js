// src/services/classService.js
// Service layer for class (sınıf) related operations.
// Endpoints are inferred from backend Express controllers: classController.js
// Adjust paths if backend differs.

import api from './api';

const BASE_URL = '/classes'; // Full path becomes /api/classes via api baseURL

// Fetch all classes or classes filtered by grade level
export async function getClasses(gradeLevel) {
  const params = gradeLevel ? { gradeLevel } : undefined;
  const response = await api.get(BASE_URL, { params });
  return response.data; // Expect array of class objects
}

// Optional: summary endpoint if backend supports it
export async function getClassesSummary() {
  try {
    const response = await api.get(`${BASE_URL}/summary`);
    return response.data; // Expect array of { gradeLevel, classCount, studentCount }
  } catch (err) {
    // Fallback: derive summary client-side
    console.warn('GET /classes/summary not available, deriving summary client-side', err);
    const all = await getClasses();
    const map = new Map();
    all.forEach(cls => {
      const g = cls.gradeLevel || cls.grade || 'unknown';
      if (!map.has(g)) map.set(g, { gradeLevel: g, classCount: 0, studentCount: 0 });
      const agg = map.get(g);
      agg.classCount += 1;
      agg.studentCount += cls.studentCount || (Array.isArray(cls.students) ? cls.students.length : 0) || 0;
    });
    return Array.from(map.values()).sort((a,b)=> Number(a.gradeLevel) - Number(b.gradeLevel));
  }
}

export async function createClass(data) {
  const response = await api.post(BASE_URL, data);
  return response.data;
}

export async function updateClass(id, data) {
  const response = await api.put(`${BASE_URL}/${id}`, data);
  return response.data;
}

export async function deleteClass(id) {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response.data;
}

export default {
  getClasses,
  getClassesSummary,
  createClass,
  updateClass,
  deleteClass,
};
