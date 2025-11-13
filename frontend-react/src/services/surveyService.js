// src/services/surveyService.js
// Service layer for survey (anket) related operations.
// Endpoints inferred from surveyController.js

import api from './api';

const BASE_URL = '/surveys';

export async function getSurveys() {
  const response = await api.get(BASE_URL);
  return response.data; // Expect array of surveys
}

export async function getSurvey(id) {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response.data;
}

export async function createSurvey(data) {
  const response = await api.post(BASE_URL, data);
  return response.data;
}

export async function updateSurvey(id, data) {
  const response = await api.put(`${BASE_URL}/${id}`, data);
  return response.data;
}

export async function deleteSurvey(id) {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response.data;
}

export async function getSurveyResults(id) {
  const response = await api.get(`${BASE_URL}/${id}/results`);
  return response.data; // Expect results array or aggregated metrics
}

// Student endpoints
export async function getAvailableSurveys() {
  const res = await api.get(`${BASE_URL}/available`);
  return res.data;
}

export async function getSurveyPublic(id) {
  const res = await api.get(`${BASE_URL}/${id}/public`);
  return res.data;
}

export async function submitSurveyAnswer(id, answers) {
  const res = await api.post(`${BASE_URL}/${id}/answer`, { answers });
  return res.data;
}

export default {
  getSurveys,
  getSurvey,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  getSurveyResults,
  getAvailableSurveys,
  getSurveyPublic,
  submitSurveyAnswer,
};
